import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { reportsApi, ArAgingData, ArInvoice } from '../../api';

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const BUCKETS = [
  { key: 'current' as const,  label: 'Belum Jatuh Tempo', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: '1_30' as const,     label: '1 – 30 Hari',       color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: '31_60' as const,    label: '31 – 60 Hari',      color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { key: '61_90' as const,    label: '61 – 90 Hari',      color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { key: 'over_90' as const,  label: '> 90 Hari',         color: 'bg-red-100 text-red-800 border-red-200' },
];

function agingBadge(days: number) {
  if (days <= 0) return 'bg-emerald-100 text-emerald-700';
  if (days <= 30) return 'bg-amber-100 text-amber-700';
  if (days <= 60) return 'bg-orange-100 text-orange-700';
  if (days <= 90) return 'bg-rose-100 text-rose-700';
  return 'bg-red-100 text-red-800';
}

interface Props { asOfDate?: string }

export default function ArAgingPanel({ asOfDate }: Props) {
  const [data, setData] = useState<ArAgingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await reportsApi.getArAging(asOfDate));
    } catch {
      setError('Gagal memuat data piutang.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [asOfDate]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-slate-400 text-sm flex items-center gap-2"><RefreshCw size={16} className="animate-spin" />Memuat data piutang jatuh tempo...</div>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-rose-500 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>
    </div>
  );

  const totalOutstanding = Object.values(data!.buckets).reduce((a, b) => a + b, 0);

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Aging Buckets */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {BUCKETS.map(b => {
          const amount = data!.buckets[b.key];
          const pct = totalOutstanding > 0 ? (amount / totalOutstanding) * 100 : 0;
          return (
            <div key={b.key} className={`border rounded-xl p-4 ${b.color}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">{b.label}</p>
              <p className="text-sm font-black">{fmt(amount)}</p>
              <div className="mt-2 bg-black/10 rounded-full h-1.5">
                <div className="bg-current h-1.5 rounded-full opacity-60 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[10px] font-bold mt-1 opacity-70">{pct.toFixed(1)}% dari total</p>
            </div>
          );
        })}
      </div>

      {/* Summary line */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <AlertTriangle size={18} className="text-amber-600 shrink-0" />
        <p className="text-xs text-amber-800">
          Total piutang outstanding: <strong>{fmt(totalOutstanding)}</strong>
          {data!.invoices.filter(i => i.days_overdue > 0).length > 0 && (
            <> · <strong>{data!.invoices.filter(i => i.days_overdue > 0).length}</strong> invoice sudah melewati jatuh tempo</>
          )}
        </p>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Daftar Invoice Belum Lunas
            <span className="ml-2 text-slate-400 normal-case font-normal">per {data!.as_of_date}</span>
          </h3>
          <button onClick={load} className="text-slate-400 hover:text-slate-600"><RefreshCw size={14} /></button>
        </div>
        {data!.invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <Clock size={32} className="mx-auto mb-2 opacity-30" />
            Tidak ada piutang outstanding. Semua invoice sudah lunas!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {['No. Invoice', 'Customer', 'Tgl Invoice', 'Jatuh Tempo', 'Total', 'Terbayar', 'Outstanding', 'Keterlambatan'].map(h => (
                    <th key={h} className={`px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${['Total', 'Terbayar', 'Outstanding'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data!.invoices.map((inv: ArInvoice) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-blue-600">{inv.invoice_number}</td>
                    <td className="px-4 py-2.5 text-slate-700 font-medium">{inv.customer_name}</td>
                    <td className="px-4 py-2.5 text-slate-500">{inv.invoice_date}</td>
                    <td className="px-4 py-2.5 text-slate-500">{inv.due_date ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{fmt(inv.total)}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-600">{fmt(inv.paid_amount)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-rose-600">{fmt(inv.outstanding)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${agingBadge(inv.days_overdue)}`}>
                        {inv.days_overdue <= 0 ? 'Belum JT' : `${inv.days_overdue} hari`}
                      </span>
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
