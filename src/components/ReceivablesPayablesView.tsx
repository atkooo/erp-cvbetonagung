/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  WalletCards, RefreshCw, AlertTriangle, Coins, CheckCircle, HandCoins
} from 'lucide-react';
import Swal from 'sweetalert2';
import { financeApi } from '../features/finance/api';
import { Invoice } from '../types';
import { SupplierPayable } from '../features/finance/types';

interface ReceivablesPayablesViewProps {
  onTriggerNotification: (message: string) => void;
}

const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const Header = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <Panel className="p-5">
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg">{icon}</div>
      <div>
        <h3 className="font-sans font-bold text-sm text-slate-800">{title}</h3>
        <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
      </div>
    </div>
  </Panel>
);

const StatusPill = ({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'cyan' | 'amber' | 'emerald' | 'rose' | 'indigo' }) => {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${tones[tone]}`}>
      {children}
    </span>
  );
};

const formatIDR = (num: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
};

export default function ReceivablesPayablesView({ onTriggerNotification }: ReceivablesPayablesViewProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payables, setPayables] = useState<SupplierPayable[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invs, pays] = await Promise.all([
        financeApi.getInvoices(),
        financeApi.getSupplierPayables()
      ]);
      setInvoices(invs);
      setPayables(pays);
    } catch (error) {
      console.error('Error fetching receivables/payables:', error);
      onTriggerNotification('Gagal memuat data keuangan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaySupplier = async (payable: SupplierPayable) => {
    const remaining = payable.amount - payable.paidAmount;
    if (remaining <= 0) {
      Swal.fire('Info', 'Utang ini sudah lunas.', 'info');
      return;
    }

    const { value: paymentInput } = await Swal.fire({
      title: 'Pembayaran Utang Supplier',
      text: `Masukkan nominal pembayaran untuk ${payable.payableNumber} (Sisa: ${formatIDR(remaining)}):`,
      input: 'number',
      inputPlaceholder: 'Nominal pembayaran',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value || parseFloat(value) <= 0) {
          return 'Nominal pembayaran harus lebih besar dari 0!';
        }
        if (parseFloat(value) > remaining) {
          return `Nominal pembayaran tidak boleh melebihi sisa utang (${formatIDR(remaining)})!`;
        }
        return null;
      }
    });

    if (paymentInput) {
      const paymentAmount = parseFloat(paymentInput);
      const newPaidAmount = payable.paidAmount + paymentAmount;
      const status = newPaidAmount >= payable.amount ? 'paid' : 'partial';

      try {
        await financeApi.updateSupplierPayable(payable.id, {
          paid_amount: newPaidAmount,
          status: status
        });

        Swal.fire('Sukses', `Pembayaran ${formatIDR(paymentAmount)} berhasil dicatat.`, 'success');
        onTriggerNotification(`Pembayaran utang ${payable.payableNumber} sebesar ${formatIDR(paymentAmount)} berhasil.`);
        fetchData();
      } catch (error) {
        console.error('Error recording payment:', error);
        Swal.fire('Gagal', 'Terjadi kesalahan saat memproses pembayaran utang.', 'error');
      }
    }
  };

  // Calculations
  const today = new Date().toISOString().split('T')[0];

  // Invoices that are not paid
  const outstandingInvoices = invoices.filter(inv => inv.status !== 'Lunas');
  
  const overdueReceivables = outstandingInvoices
    .filter(inv => inv.dueDate < today)
    .reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

  const activeReceivables = outstandingInvoices
    .filter(inv => inv.dueDate >= today)
    .reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

  const totalPayables = payables
    .filter(p => p.status !== 'Lunas')
    .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

  const netCashExposure = (activeReceivables + overdueReceivables) - totalPayables;

  const getInvoiceTone = (status: string) => {
    switch (status) {
      case 'Lunas': return 'emerald';
      case 'Sebagian Dibayar': return 'cyan';
      case 'Belum Lunas': return 'amber';
      case 'Overdue': return 'rose';
      default: return 'slate';
    }
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      <Header
        icon={<WalletCards size={20} />}
        title="Piutang & Hutang Usaha (Receivables & Payables)"
        desc="Kelola penagihan piutang dari invoice customer dan jadwal pembayaran utang supplier untuk kestabilan cashflow."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Piutang Overdue', formatIDR(overdueReceivables), 'rose', 'Terlambat'],
          ['Piutang Aktif', formatIDR(activeReceivables), 'cyan', 'Belum Jatuh Tempo'],
          ['Hutang Supplier', formatIDR(totalPayables), 'amber', 'Kewajiban'],
          ['Net Cash Exposure', formatIDR(netCashExposure), netCashExposure >= 0 ? 'emerald' : 'rose', 'Net Balance']
        ].map(([label, value, tone, sub]) => (
          <Panel key={label} className="p-4">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">{label}</span>
            <div className="mt-1.5 flex items-center justify-between">
              <strong className="text-base font-black text-slate-900">{value}</strong>
              <StatusPill tone={tone as any}>{sub}</StatusPill>
            </div>
          </Panel>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-2 border bg-white hover:bg-slate-50 rounded-lg font-bold text-slate-600 transition"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          <span>Segarkan Data Keuangan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Receivables Table */}
        <Panel className="overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Aging Piutang Customer</h4>
            <StatusPill tone="cyan">Receivables</StatusPill>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="animate-spin text-slate-400" size={20} />
            </div>
          ) : outstandingInvoices.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle size={20} className="mx-auto mb-1 text-emerald-500" />
              <p>Tidak ada piutang outstanding.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                    <th className="p-3.5 pl-5">No Invoice</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Jatuh Tempo</th>
                    <th className="p-3.5">Sisa Piutang</th>
                    <th className="p-3.5 pr-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {outstandingInvoices.map((inv) => {
                    const remaining = inv.total - inv.paidAmount;
                    const isOverdue = inv.dueDate < today;

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5 pl-5 font-mono font-bold text-cyan-600">{inv.invoiceNumber}</td>
                        <td className="p-3.5 font-bold text-slate-700">{inv.customerName}</td>
                        <td className={`p-3.5 font-mono ${isOverdue ? 'text-rose-500 font-bold' : 'text-slate-500'}`}>
                          {inv.dueDate}
                        </td>
                        <td className="p-3.5 font-mono font-black text-slate-900">
                          {formatIDR(remaining)}
                        </td>
                        <td className="p-3.5 pr-5">
                          <StatusPill tone={isOverdue ? 'rose' : getInvoiceTone(inv.status)}>
                            {isOverdue ? 'Overdue' : inv.status}
                          </StatusPill>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* Payables Table */}
        <Panel className="overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Aging Hutang Supplier</h4>
            <StatusPill tone="amber">Payables</StatusPill>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="animate-spin text-slate-400" size={20} />
            </div>
          ) : payables.filter(p => p.status !== 'Lunas').length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle size={20} className="mx-auto mb-1 text-emerald-500" />
              <p>Tidak ada utang outstanding.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                    <th className="p-3.5 pl-5">No Payable</th>
                    <th className="p-3.5">Supplier</th>
                    <th className="p-3.5">Jatuh Tempo</th>
                    <th className="p-3.5">Sisa Utang</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payables
                    .filter(p => p.status !== 'Lunas')
                    .map((payable) => {
                      const remaining = payable.amount - payable.paidAmount;
                      const isOverdue = payable.dueDate && payable.dueDate < today;

                      return (
                        <tr key={payable.id} className="hover:bg-slate-50/50">
                          <td className="p-3.5 pl-5 font-mono font-bold text-cyan-600">{payable.payableNumber}</td>
                          <td className="p-3.5 font-bold text-slate-700">{payable.supplierName}</td>
                          <td className={`p-3.5 font-mono ${isOverdue ? 'text-rose-500 font-bold' : 'text-slate-500'}`}>
                            {payable.dueDate}
                          </td>
                          <td className="p-3.5 font-mono font-black text-slate-900">
                            {formatIDR(remaining)}
                          </td>
                          <td className="p-3.5">
                            <StatusPill tone={isOverdue ? 'rose' : payable.status === 'Open' ? 'amber' : 'cyan'}>
                              {isOverdue ? 'Overdue' : payable.status}
                            </StatusPill>
                          </td>
                          <td className="p-3.5 pr-5 text-right">
                            <button
                              onClick={() => handlePaySupplier(payable)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition"
                            >
                              <HandCoins size={12} />
                              <span>Bayar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
