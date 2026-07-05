import React, { useEffect, useState } from 'react';
import { TrendingUp, Receipt, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';
import { reportsApi, DailySalesData, ReportFilters } from '../../api';

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const fmtNum = (n: number) => new Intl.NumberFormat('id-ID').format(n);

interface Props { filters: ReportFilters }

export default function DailySalesPanel({ filters }: Props) {
  const [data, setData] = useState<DailySalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportsApi.getDailySales(filters);
      setData(res);
    } catch {
      setError('Gagal memuat data. Pastikan server berjalan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters.period, filters.date_from, filters.date_to]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-slate-400 text-sm flex items-center gap-2">
        <RefreshCw size={16} className="animate-spin" />
        Memuat laporan omset...
      </div>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-rose-500 text-sm flex items-center gap-2">
        <AlertCircle size={16} />
        {error}
      </div>
    </div>
  );

  const s = data!.summary;

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={TrendingUp} label="Total Omset" value={fmt(s.total_revenue)} iconColor="text-blue-500" bg="bg-blue-50" />
        <KpiCard icon={CreditCard} label="Terbayar" value={fmt(s.total_paid)} iconColor="text-emerald-500" bg="bg-emerald-50" />
        <KpiCard icon={Receipt} label="Outstanding" value={fmt(s.total_outstanding)} iconColor="text-amber-500" bg="bg-amber-50" />
        <KpiCard icon={Receipt} label="Jml Invoice" value={fmtNum(s.total_invoices)} iconColor="text-slate-500" bg="bg-slate-100" suffix="invoice" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Rincian per Periode</h3>
          <button onClick={load} className="text-slate-400 hover:text-slate-600 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
        {data!.rows.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">Tidak ada data untuk rentang tanggal ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Periode</th>
                  <th className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Jml Invoice</th>
                  <th className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Omset</th>
                  <th className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Terbayar</th>
                  <th className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data!.rows.map((row) => (
                  <tr key={row.period_label} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-slate-700">{row.period_label}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{fmtNum(row.invoice_count)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-800">{fmt(row.gross_revenue)}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-600 font-semibold">{fmt(row.total_paid)}</td>
                    <td className="px-4 py-2.5 text-right text-amber-600 font-semibold">{fmt(row.outstanding)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td className="px-4 py-2.5 font-bold text-slate-700">TOTAL</td>
                  <td className="px-4 py-2.5 text-right font-bold">{fmtNum(s.total_invoices)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-800">{fmt(s.total_revenue)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-emerald-700">{fmt(s.total_paid)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-amber-700">{fmt(s.total_outstanding)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, iconColor, bg, suffix }: {
  icon: any; label: string; value: string; iconColor: string; bg: string; suffix?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-3">
      <div className={`${bg} ${iconColor} p-2.5 rounded-xl`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-base font-black text-slate-800 mt-0.5 truncate">{value}</p>
        {suffix && <p className="text-[10px] text-slate-400 mt-0.5">{suffix}</p>}
      </div>
    </div>
  );
}
