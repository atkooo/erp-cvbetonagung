import React, { useEffect, useState } from 'react';
import { TrendingUp, ShoppingCart, Percent, RefreshCw, AlertCircle } from 'lucide-react';
import { reportsApi, GrossProfitData, ReportFilters } from '../../api';

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

interface Props { filters: ReportFilters }

export default function GrossProfitPanel({ filters }: Props) {
  const [data, setData] = useState<GrossProfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await reportsApi.getGrossProfit(filters));
    } catch {
      setError('Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters.date_from, filters.date_to]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-slate-400 text-sm flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> Memuat laporan laba kotor...</div>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-rose-500 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>
    </div>
  );

  const s = data!.summary;
  const marginColor = s.margin_pct >= 20 ? 'text-emerald-600' : s.margin_pct >= 10 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Summary KPI */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-50 text-blue-500 p-2 rounded-lg"><TrendingUp size={16} /></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Omset</span>
          </div>
          <p className="text-base font-black text-slate-800">{fmt(s.revenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-rose-50 text-rose-500 p-2 rounded-lg"><ShoppingCart size={16} /></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">HPP / COGS</span>
          </div>
          <p className="text-base font-black text-slate-800">{fmt(s.cogs)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${s.gross_profit >= 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
              <TrendingUp size={16} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Laba Kotor</span>
          </div>
          <p className={`text-base font-black ${s.gross_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{fmt(s.gross_profit)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-violet-50 text-violet-500 p-2 rounded-lg"><Percent size={16} /></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Margin</span>
          </div>
          <p className={`text-base font-black ${marginColor}`}>{s.margin_pct.toFixed(2)}%</p>
        </div>
      </div>

      {/* By Category Table */}
      <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Laba Kotor per Kategori Produk</h3>
          <button onClick={load} className="text-slate-400 hover:text-slate-600"><RefreshCw size={14} /></button>
        </div>
        {data!.by_category.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">Tidak ada data penjualan untuk periode ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {['Kategori', 'Order', 'Qty', 'Omset', 'HPP', 'Laba Kotor', 'Margin'].map(h => (
                    <th key={h} className={`px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider ${h === 'Kategori' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data!.by_category.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-slate-700">{row.category}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">{row.order_count}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">{row.total_qty}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{fmt(row.total_revenue)}</td>
                    <td className="px-4 py-2.5 text-right text-rose-500">{fmt(row.total_cogs)}</td>
                    <td className={`px-4 py-2.5 text-right font-bold ${row.gross_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(row.gross_profit)}</td>
                    <td className={`px-4 py-2.5 text-right font-bold ${row.margin_pct >= 20 ? 'text-emerald-600' : row.margin_pct >= 10 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {row.margin_pct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
