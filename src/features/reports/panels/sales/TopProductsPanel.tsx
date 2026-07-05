import React, { useEffect, useState } from 'react';
import { Award, Package, RefreshCw, AlertCircle } from 'lucide-react';
import { reportsApi, TopProductsData, ReportFilters } from '../../api';

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const fmtNum = (n: number) => new Intl.NumberFormat('id-ID').format(n);

interface Props { filters: ReportFilters }

function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, string> = {
    1: 'bg-yellow-400 text-yellow-900',
    2: 'bg-slate-300 text-slate-700',
    3: 'bg-amber-600 text-amber-100',
  };
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${styles[rank] ?? 'bg-slate-100 text-slate-500'}`}>
      {rank}
    </span>
  );
}

export default function TopProductsPanel({ filters }: Props) {
  const [data, setData] = useState<TopProductsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await reportsApi.getTopProducts({ ...filters, limit: 20 }));
    } catch {
      setError('Gagal memuat data produk terlaris.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters.date_from, filters.date_to]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-slate-400 text-sm flex items-center gap-2"><RefreshCw size={16} className="animate-spin" />Memuat analisis produk terlaris...</div>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-rose-500 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>
    </div>
  );

  const rows = data!.rows;
  const grandTotal = data!.grand_total;

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Hero summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-5 text-white flex items-center justify-between">
        <div>
          <p className="text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-1">Total Revenue Periode Ini</p>
          <p className="text-2xl font-black">{fmt(grandTotal)}</p>
          <p className="text-blue-200 text-xs mt-1">dari {rows.length} produk terlaris</p>
        </div>
        <Award size={48} className="text-blue-300 opacity-60" />
      </div>

      {/* Top 3 highlight cards */}
      {rows.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {rows.slice(0, 3).map((row, i) => (
            <div key={row.sku} className={`rounded-xl border p-4 ${i === 0 ? 'border-yellow-300 bg-yellow-50' : i === 1 ? 'border-slate-300 bg-slate-50' : 'border-amber-300 bg-amber-50'}`}>
              <RankBadge rank={row.rank} />
              <p className="font-bold text-slate-800 text-xs mt-2 truncate" title={row.product_name}>{row.product_name}</p>
              <p className="text-[10px] text-slate-500">{row.sku} · {row.category}</p>
              <p className="font-black text-slate-800 mt-2">{fmt(row.total_revenue)}</p>
              <p className="text-[10px] text-slate-500">{row.contribution_pct}% kontribusi</p>
            </div>
          ))}
        </div>
      )}

      {/* Full ranking table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Package size={14} className="text-blue-500" />
            Ranking Produk Lengkap (Top 20)
          </h3>
          <button onClick={load} className="text-slate-400 hover:text-slate-600"><RefreshCw size={14} /></button>
        </div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">Tidak ada data penjualan untuk periode ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2.5 text-center font-bold text-slate-500 uppercase tracking-wider w-12">#</th>
                  <th className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Produk</th>
                  <th className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-4 py-2.5 text-right font-bold text-slate-500 uppercase tracking-wider">Order</th>
                  <th className="px-4 py-2.5 text-right font-bold text-slate-500 uppercase tracking-wider">Qty Terjual</th>
                  <th className="px-4 py-2.5 text-right font-bold text-slate-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-4 py-2.5 text-right font-bold text-slate-500 uppercase tracking-wider">Kontribusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(row => (
                  <tr key={row.sku} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-center"><RankBadge rank={row.rank} /></td>
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-slate-800">{row.product_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{row.sku}</p>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{row.category}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">{row.order_count}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{fmtNum(row.total_qty)} {row.unit}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-800">{fmt(row.total_revenue)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(row.contribution_pct, 100)}%` }} />
                        </div>
                        <span className="font-bold text-blue-600 w-10 text-right">{row.contribution_pct}%</span>
                      </div>
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
