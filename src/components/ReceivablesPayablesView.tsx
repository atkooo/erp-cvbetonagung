/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  WalletCards, RefreshCw, AlertTriangle, Coins, CheckCircle, HandCoins
} from '@/src/components/icons';
import Swal from 'sweetalert2';
import { financeApi } from '../features/finance/api';
import { Invoice } from '../types';
import { SupplierPayable } from '../features/finance/types';
import { formatDate } from '../utils/date';

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

const dateOnly = (value: string | null | undefined) => {
  if (!value || value === '-') return '';
  return value.split('T')[0];
};

export default function ReceivablesPayablesView({ onTriggerNotification }: ReceivablesPayablesViewProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payables, setPayables] = useState<SupplierPayable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ledgerMode, setLedgerMode] = useState<'ar' | 'ap'>('ar');
  const [payablesTab, setPayablesTab] = useState<'outstanding' | 'lunas'>('outstanding');

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
      Swal.fire('Info', 'AP ini sudah lunas.', 'info');
      return;
    }

    const { value: paymentInput } = await Swal.fire({
      title: 'Pembayaran Hutang Supplier (AP)',
      text: `Masukkan nominal pembayaran untuk ${payable.payableNumber} (Sisa hutang supplier: ${formatIDR(remaining)}):`,
      input: 'number',
      inputPlaceholder: 'Nominal pembayaran',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value || parseFloat(value) <= 0) {
          return 'Nominal pembayaran harus lebih besar dari 0!';
        }
        if (parseFloat(value) > remaining) {
          return `Nominal pembayaran tidak boleh melebihi sisa hutang supplier (${formatIDR(remaining)})!`;
        }
        return null;
      }
    });

    if (paymentInput) {
      const paymentAmount = parseFloat(paymentInput);

      try {
        await financeApi.paySupplierPayable(payable.id, {
          amount: paymentAmount,
          method: 'transfer',
          notes: `Pembayaran hutang supplier ${payable.payableNumber}`,
        });

        Swal.fire('Sukses', `Pembayaran supplier sebesar ${formatIDR(paymentAmount)} berhasil dicatat.`, 'success');
        onTriggerNotification(`Pembayaran hutang supplier ${payable.payableNumber} sebesar ${formatIDR(paymentAmount)} berhasil.`);
        fetchData();
      } catch (error) {
        console.error('Error recording payment:', error);
        Swal.fire('Gagal', 'Terjadi kesalahan saat memproses pembayaran hutang supplier.', 'error');
      }
    }
  };

  // Calculations
  const today = new Date().toISOString().split('T')[0];

  // Invoices that are not paid
  const outstandingInvoices = invoices.filter(inv => inv.status !== 'Lunas');
  
  const overdueReceivables = outstandingInvoices
    .filter(inv => dateOnly(inv.dueDate) < today)
    .reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

  const activeReceivables = outstandingInvoices
    .filter(inv => dateOnly(inv.dueDate) >= today)
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
        title="Piutang Customer & Hutang Supplier (AR / AP)"
        desc="Ledger posisi piutang dari Billing dan hutang supplier dari Purchasing untuk kontrol cashflow."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['AR Overdue Customer', formatIDR(overdueReceivables), 'rose', 'Piutang Telat'],
          ['AR Belum Jatuh Tempo', formatIDR(activeReceivables), 'cyan', 'Piutang Aktif'],
          ['AP Hutang Supplier', formatIDR(totalPayables), 'amber', 'Kewajiban'],
          ['Net AR - AP', formatIDR(netCashExposure), netCashExposure >= 0 ? 'emerald' : 'rose', 'Selisih']
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
        <div className="mr-auto flex border border-slate-200 rounded-lg overflow-hidden bg-slate-100 p-0.5">
          <button
            type="button"
            onClick={() => setLedgerMode('ar')}
            className={`px-4 py-2 rounded-md text-[10px] font-bold transition-all ${ledgerMode === 'ar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            AR - Piutang Customer
          </button>
          <button
            type="button"
            onClick={() => setLedgerMode('ap')}
            className={`px-4 py-2 rounded-md text-[10px] font-bold transition-all ${ledgerMode === 'ap' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            AP - Hutang Supplier
          </button>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-2 border bg-white hover:bg-slate-50 rounded-lg font-bold text-slate-600 transition"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          <span>Segarkan Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Receivables Table */}
        {ledgerMode === 'ar' && <Panel className="overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">AR Aging - Piutang Customer</h4>
            <StatusPill tone="cyan">Sumber: Billing Invoice</StatusPill>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="animate-spin text-slate-400" size={20} />
            </div>
          ) : outstandingInvoices.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle size={20} className="mx-auto mb-1 text-emerald-500" />
              <p>Tidak ada piutang customer outstanding.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                    <th className="p-3.5 pl-5">No. Invoice</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Jatuh Tempo</th>
                    <th className="p-3.5">Sisa Piutang</th>
                    <th className="p-3.5 pr-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {outstandingInvoices.map((inv) => {
                    const remaining = inv.total - inv.paidAmount;
                    const isOverdue = dateOnly(inv.dueDate) < today;

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5 pl-5 font-mono font-bold text-cyan-600">{inv.invoiceNumber}</td>
                        <td className="p-3.5 font-bold text-slate-700">{inv.customerName}</td>
                        <td className={`p-3.5 font-mono ${isOverdue ? 'text-rose-500 font-bold' : 'text-slate-500'}`}>
                          {formatDate(inv.dueDate)}
                        </td>
                        <td className="p-3.5 font-mono font-black text-slate-900">
                          {formatIDR(remaining)}
                        </td>
                        <td className="p-3.5 pr-5">
                          <StatusPill tone={isOverdue ? 'rose' : getInvoiceTone(inv.status)}>
                            {isOverdue ? 'Overdue' : 
                             inv.status === 'Lunas' ? 'Lunas' : 
                             inv.status === 'Sebagian Dibayar' ? 'Sebagian Dibayar' : 
                             inv.status === 'Belum Lunas' ? 'Belum Lunas' : inv.status}
                          </StatusPill>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>}

        {/* Payables Table */}
        {ledgerMode === 'ap' && <Panel className="overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">AP Aging - Hutang Supplier</h4>
              <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-100 p-0.5 max-w-max">
                <button
                  type="button"
                  onClick={() => setPayablesTab('outstanding')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${payablesTab === 'outstanding' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Hutang Supplier ({payables.filter(p => p.status !== 'Lunas').length})
                </button>
                <button
                  type="button"
                  onClick={() => setPayablesTab('lunas')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${payablesTab === 'lunas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Riwayat Lunas ({payables.filter(p => p.status === 'Lunas').length})
                </button>
              </div>
            </div>
            <StatusPill tone={payablesTab === 'outstanding' ? 'amber' : 'emerald'}>
              {payablesTab === 'outstanding' ? 'Pembayaran Keluar' : 'AP Lunas'}
            </StatusPill>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="animate-spin text-slate-400" size={20} />
            </div>
          ) : payables.filter(p => payablesTab === 'outstanding' ? p.status !== 'Lunas' : p.status === 'Lunas').length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle size={20} className="mx-auto mb-1 text-emerald-500" />
              <p>{payablesTab === 'outstanding' ? 'Tidak ada hutang supplier outstanding.' : 'Tidak ada riwayat hutang supplier lunas.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                    <th className="p-3.5 pl-5">No. AP</th>
                    <th className="p-3.5">Supplier</th>
                    <th className="p-3.5">Jatuh Tempo</th>
                    <th className="p-3.5">{payablesTab === 'outstanding' ? 'Sisa Hutang' : 'Total Lunas'}</th>
                    <th className="p-3.5">Status</th>
                    {payablesTab === 'outstanding' && <th className="p-3.5 pr-5 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payables
                    .filter(p => payablesTab === 'outstanding' ? p.status !== 'Lunas' : p.status === 'Lunas')
                    .map((payable) => {
                      const remaining = payable.amount - payable.paidAmount;
                      const isOverdue = !!payable.dueDate && dateOnly(payable.dueDate) < today;

                      return (
                        <tr key={payable.id} className="hover:bg-slate-50/50">
                          <td className="p-3.5 pl-5 font-mono font-bold text-cyan-600">{payable.payableNumber}</td>
                          <td className="p-3.5 font-bold text-slate-700">{payable.supplierName}</td>
                          <td className={`p-3.5 font-mono ${isOverdue ? 'text-rose-500 font-bold' : 'text-slate-500'}`}>
                            {formatDate(payable.dueDate)}
                          </td>
                          <td className="p-3.5 font-mono font-black text-slate-900">
                            {payablesTab === 'outstanding' ? formatIDR(remaining) : formatIDR(payable.amount)}
                          </td>
                          <td className="p-3.5">
                            <StatusPill tone={isOverdue ? 'rose' : payable.status === 'Lunas' ? 'emerald' : payable.status === 'Open' ? 'amber' : 'cyan'}>
                              {isOverdue ? 'Overdue' : 
                               payable.status === 'Lunas' ? 'Lunas' : 
                               payable.status === 'Open' ? 'Belum Dibayar' : 'Sebagian Dibayar'}
                            </StatusPill>
                          </td>
                          {payablesTab === 'outstanding' && (
                            <td className="p-3.5 pr-5 text-right">
                              <button
                                onClick={() => handlePaySupplier(payable)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition"
                              >
                                <HandCoins size={12} />
                                <span>Bayar Supplier</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>}
      </div>
    </div>
  );
}
