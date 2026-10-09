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
import { SupplierPayable, AccountDto } from '../features/finance/types';
import { formatDate, toApiDate } from '../utils/date';
import { X, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

interface ReceivablesPayablesViewProps {
  initialMode?: 'ar' | 'ap';
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
  return toApiDate(new Date(value));
};

export default function ReceivablesPayablesView({ initialMode, onTriggerNotification }: ReceivablesPayablesViewProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payables, setPayables] = useState<SupplierPayable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ledgerMode, setLedgerMode] = useState<'ar' | 'ap'>(initialMode || 'ar');
  
  // Tabs
  const [payablesTab, setPayablesTab] = useState<'outstanding' | 'lunas'>('outstanding');
  const [receivablesTab, setReceivablesTab] = useState<'outstanding' | 'lunas'>('outstanding');
  
  const [accounts, setAccounts] = useState<AccountDto[]>([]);

  // Search & Pagination
  const [arSearch, setArSearch] = useState('');
  const [apSearch, setApSearch] = useState('');
  const [arPage, setArPage] = useState(1);
  const [apPage, setApPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<SupplierPayable | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<Invoice | null>(null);
  
  const [showPayableDetail, setShowPayableDetail] = useState(false);
  const [selectedPayableDetail, setSelectedPayableDetail] = useState<SupplierPayable | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (initialMode) {
      setLedgerMode(initialMode);
    }
  }, [initialMode]);

  // Reset page when tab or search changes
  useEffect(() => { setArPage(1); }, [receivablesTab, arSearch]);
  useEffect(() => { setApPage(1); }, [payablesTab, apSearch]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invs, pays, accs] = await Promise.all([
        financeApi.getInvoices(),
        financeApi.getSupplierPayables(),
        financeApi.getAccounts()
      ]);
      setInvoices(invs);
      setPayables(pays);
      setAccounts(accs);
      if (accs.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accs[0].id);
      }
    } catch (error) {
      console.error('Error fetching receivables/payables:', error);
      onTriggerNotification('Gagal memuat data keuangan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvoice = async (id: string, number: string) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Batalkan Invoice?',
      text: `Masukkan alasan pembatalan untuk invoice ${number}.`,
      input: 'text',
      inputPlaceholder: 'Batal pesanan, salah input, dll',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Batalkan',
      cancelButtonText: 'Tutup',
      inputValidator: (value) => {
        if (!value) return 'Alasan pembatalan wajib diisi!';
        return null;
      }
    });

    if (isConfirmed && reason) {
      try {
        await financeApi.cancelInvoice(id, reason);
        onTriggerNotification(`Berhasil membatalkan invoice ${number}`);
        setShowInvoiceDetail(false);
        setInvoices(prev => prev.filter(inv => inv.id !== id));
        await fetchData();
      } catch (err) {
        onTriggerNotification(err instanceof Error ? err.message : 'Gagal membatalkan invoice');
      }
    }
  };

  useEffect(() => {
    const pendingPoNumber = sessionStorage.getItem('action_pay_ap');
    if (pendingPoNumber) {
      sessionStorage.removeItem('action_pay_ap');
      setLedgerMode('ap');
      
      const checkAndOpen = setInterval(() => {
        setPayables((currentPayables) => {
          if (currentPayables.length > 0) {
            clearInterval(checkAndOpen);
            setTimeout(() => {
              const payable = currentPayables.find((p) => p.poNumber === pendingPoNumber);
              if (payable) {
                handlePaySupplier(payable);
              }
            }, 500);
          }
          return currentPayables;
        });
      }, 500);
      
      setTimeout(() => clearInterval(checkAndOpen), 10000);
    }
  }, []);

  const handlePaySupplier = (payable: SupplierPayable) => {
    const remaining = payable.amount - payable.paidAmount;
    if (remaining <= 0) {
      Swal.fire('Info', 'AP ini sudah lunas.', 'info');
      return;
    }

    setSelectedPayable(payable);
    setPaymentAmount(remaining);
    setPaymentNotes(`Pembayaran outstanding payable ${payable.payableNumber}`);
    setShowPaymentModal(true);
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayable || !selectedAccountId || paymentAmount <= 0) {
      onTriggerNotification('Pilih Rekening dan isi nominal dengan benar.');
      return;
    }

    const remaining = selectedPayable.amount - selectedPayable.paidAmount;
    if (paymentAmount > remaining) {
      onTriggerNotification(`Nominal pembayaran tidak boleh melebihi sisa outstanding payable (${formatIDR(remaining)}).`);
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await financeApi.paySupplierPayable(selectedPayable.id, {
        account_id: selectedAccountId,
        amount: paymentAmount,
        method: 'transfer',
        notes: paymentNotes,
      });

      onTriggerNotification(`Pembayaran outstanding payable ${selectedPayable.payableNumber} sebesar ${formatIDR(paymentAmount)} berhasil.`);
      setShowPaymentModal(false);
      fetchData();
    } catch (error) {
      console.error('Error recording payment:', error);
      Swal.fire('Gagal', 'Terjadi kesalahan saat memproses pembayaran outstanding payable.', 'error');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Calculations
  const today = toApiDate();

  const isInvoiceActive = (inv: Invoice) => inv.status !== 'cancelled' && inv.status !== 'Dibatalkan';
  const isPayableActive = (p: SupplierPayable) => p.status !== 'Dibatalkan';

  const outstandingInvoices = invoices.filter(inv => isInvoiceActive(inv) && inv.status !== 'Lunas');
  
  const overdueReceivables = outstandingInvoices
    .filter(inv => dateOnly(inv.dueDate) < today)
    .reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

  const activeReceivables = outstandingInvoices
    .filter(inv => dateOnly(inv.dueDate) >= today)
    .reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

  const totalPayables = payables
    .filter(p => isPayableActive(p) && p.status !== 'Lunas')
    .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

  const overduePayables = payables
    .filter(p => isPayableActive(p) && p.status !== 'Lunas' && !!p.dueDate && dateOnly(p.dueDate) < today)
    .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

  const activePayables = payables
    .filter(p => isPayableActive(p) && p.status !== 'Lunas' && (!p.dueDate || dateOnly(p.dueDate) >= today))
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

  // AR Filter & Pagination
  const filteredAr = invoices.filter(inv => {
    if (!isInvoiceActive(inv)) return false;
    const isTabMatch = receivablesTab === 'outstanding' ? inv.status !== 'Lunas' : inv.status === 'Lunas';
    const isSearchMatch = inv.invoiceNumber.toLowerCase().includes(arSearch.toLowerCase()) || 
                          inv.customerName.toLowerCase().includes(arSearch.toLowerCase());
    return isTabMatch && isSearchMatch;
  });
  const totalArPages = Math.ceil(filteredAr.length / ITEMS_PER_PAGE);
  const paginatedAr = filteredAr.slice((arPage - 1) * ITEMS_PER_PAGE, arPage * ITEMS_PER_PAGE);

  // AP Filter & Pagination
  const filteredAp = payables.filter(p => {
    if (!isPayableActive(p)) return false;
    const isTabMatch = payablesTab === 'outstanding' ? p.status !== 'Lunas' : p.status === 'Lunas';
    const isSearchMatch = p.payableNumber.toLowerCase().includes(apSearch.toLowerCase()) || 
                          p.supplierName.toLowerCase().includes(apSearch.toLowerCase());
    return isTabMatch && isSearchMatch;
  });
  const totalApPages = Math.ceil(filteredAp.length / ITEMS_PER_PAGE);
  const paginatedAp = filteredAp.slice((apPage - 1) * ITEMS_PER_PAGE, apPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 text-xs font-sans">
      <Header
        icon={<WalletCards size={20} />}
        title={initialMode === 'ar' ? 'Outstanding Receivable (AR)' : initialMode === 'ap' ? 'Outstanding Payable (AP)' : 'Outstanding Receivable (AR) & Payable (AP)'}
        desc={initialMode === 'ar' ? 'Ledger posisi outstanding receivable dari Billing.' : initialMode === 'ap' ? 'Ledger posisi outstanding payable dari Purchasing.' : 'Ledger posisi outstanding receivable dari Billing dan payable dari Purchasing untuk kontrol cashflow.'}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(ledgerMode === 'ar' ? [
          ['AR Overdue Customer', formatIDR(overdueReceivables), 'rose', 'Receivable Telat'],
          ['AR Belum Jatuh Tempo', formatIDR(activeReceivables), 'cyan', 'Receivable Aktif'],
          ['Total Outstanding AR', formatIDR(overdueReceivables + activeReceivables), 'amber', 'Total Tagihan']
        ] : [
          ['AP Overdue Supplier', formatIDR(overduePayables), 'rose', 'Payable Telat'],
          ['AP Belum Jatuh Tempo', formatIDR(activePayables), 'cyan', 'Payable Aktif'],
          ['Total Outstanding AP', formatIDR(totalPayables), 'amber', 'Total Kewajiban']
        ]).map(([label, value, tone, sub]) => (
          <Panel key={label as string} className="p-4">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">{label as string}</span>
            <div className="mt-1.5 flex items-center justify-between">
              <strong className="text-base font-black text-slate-900">{value as string}</strong>
              <StatusPill tone={tone as any}>{sub as string}</StatusPill>
            </div>
          </Panel>
        ))}
      </div>

      <div className="flex justify-end">
        {!initialMode && (
          <div className="mr-auto flex border border-slate-200 rounded-lg overflow-hidden bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setLedgerMode('ar')}
              className={`px-4 py-2 rounded-md text-[10px] font-bold transition-all ${ledgerMode === 'ar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Outstanding Receivable (AR)
            </button>
            <button
              type="button"
              onClick={() => setLedgerMode('ap')}
              className={`px-4 py-2 rounded-md text-[10px] font-bold transition-all ${ledgerMode === 'ap' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Outstanding Payable (AP)
            </button>
          </div>
        )}
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
          <div className="flex flex-col bg-slate-50/50">
            <div className="p-4 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">AR Aging - Outstanding Receivable</h4>
              <StatusPill tone={receivablesTab === 'outstanding' ? 'cyan' : 'emerald'}>
                {receivablesTab === 'outstanding' ? 'Sumber: Billing Invoice' : 'AR Lunas'}
              </StatusPill>
            </div>
            <div className="px-4 flex gap-6 border-b border-slate-200 justify-between items-center">
              <div className="flex gap-6">
                <button
                  type="button"
                  onClick={() => setReceivablesTab('outstanding')}
                  className={`py-2 text-[11px] uppercase tracking-wider font-bold border-b-2 transition-all ${receivablesTab === 'outstanding' ? 'border-cyan-500 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Belum Lunas ({invoices.filter(i => i.status !== 'Lunas').length})
                </button>
                <button
                  type="button"
                  onClick={() => setReceivablesTab('lunas')}
                  className={`py-2 text-[11px] uppercase tracking-wider font-bold border-b-2 transition-all ${receivablesTab === 'lunas' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Riwayat Lunas ({invoices.filter(i => i.status === 'Lunas').length})
                </button>
              </div>
              <div className="pb-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari Invoice / Customer..."
                    value={arSearch}
                    onChange={(e) => setArSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-cyan-500 min-w-[200px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="animate-spin text-slate-400" size={20} />
            </div>
          ) : paginatedAr.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle size={20} className="mx-auto mb-1 text-emerald-500" />
              <p>{receivablesTab === 'outstanding' ? 'Tidak ada outstanding receivable.' : 'Tidak ada riwayat receivable lunas.'}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                      <th className="p-3.5 pl-5">No. Invoice</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Jatuh Tempo</th>
                      <th className="p-3.5">{receivablesTab === 'outstanding' ? 'Sisa Receivable' : 'Total Invoice'}</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 pr-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedAr.map((inv) => {
                      const remaining = inv.total - inv.paidAmount;
                      const isOverdue = dateOnly(inv.dueDate) < today && inv.status !== 'Lunas';

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="p-3.5 pl-5 font-mono font-bold text-cyan-600">{inv.invoiceNumber}</td>
                          <td className="p-3.5 font-bold text-slate-700">{inv.customerName}</td>
                          <td className={`p-3.5 font-mono ${isOverdue ? 'text-rose-500 font-bold' : 'text-slate-500'}`}>
                            {formatDate(inv.dueDate)}
                          </td>
                          <td className="p-3.5 font-mono font-black text-slate-900">
                            {receivablesTab === 'outstanding' ? formatIDR(remaining) : formatIDR(inv.total)}
                          </td>
                          <td className="p-3.5">
                            <StatusPill tone={isOverdue ? 'rose' : getInvoiceTone(inv.status)}>
                              {isOverdue ? 'Overdue' : 
                               inv.status === 'Lunas' ? 'Lunas' : 
                               inv.status === 'Sebagian Dibayar' ? 'Sebagian Dibayar' : 
                               inv.status === 'Belum Lunas' ? 'Belum Lunas' : inv.status}
                            </StatusPill>
                          </td>
                          <td className="p-3.5 pr-5 text-right">
                            <button
                              onClick={() => { setSelectedInvoiceDetail(inv); setShowInvoiceDetail(true); }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-bold transition"
                            >
                              <Eye size={12} />
                              <span>Detail</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalArPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                  <span className="text-slate-500 text-[11px]">Halaman {arPage} dari {totalArPages}</span>
                  <div className="flex gap-1">
                    <button 
                      disabled={arPage === 1}
                      onClick={() => setArPage(prev => prev - 1)}
                      className="p-1.5 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button 
                      disabled={arPage === totalArPages}
                      onClick={() => setArPage(prev => prev + 1)}
                      className="p-1.5 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Panel>}

        {/* Payables Table */}
        {ledgerMode === 'ap' && <Panel className="overflow-hidden">
          <div className="flex flex-col bg-slate-50/50">
            <div className="p-4 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">AP Aging - Outstanding Payable</h4>
              <StatusPill tone={payablesTab === 'outstanding' ? 'amber' : 'emerald'}>
                {payablesTab === 'outstanding' ? 'Pembayaran Keluar' : 'AP Lunas'}
              </StatusPill>
            </div>
            <div className="px-4 flex gap-6 border-b border-slate-200 justify-between items-center">
              <div className="flex gap-6">
                <button
                  type="button"
                  onClick={() => setPayablesTab('outstanding')}
                  className={`py-2 text-[11px] uppercase tracking-wider font-bold border-b-2 transition-all ${payablesTab === 'outstanding' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Belum Dibayar ({payables.filter(p => p.status !== 'Lunas').length})
                </button>
                <button
                  type="button"
                  onClick={() => setPayablesTab('lunas')}
                  className={`py-2 text-[11px] uppercase tracking-wider font-bold border-b-2 transition-all ${payablesTab === 'lunas' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Riwayat Lunas ({payables.filter(p => p.status === 'Lunas').length})
                </button>
              </div>
              <div className="pb-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari No AP / Supplier..."
                    value={apSearch}
                    onChange={(e) => setApSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 min-w-[200px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="animate-spin text-slate-400" size={20} />
            </div>
          ) : paginatedAp.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle size={20} className="mx-auto mb-1 text-emerald-500" />
              <p>{payablesTab === 'outstanding' ? 'Tidak ada outstanding payable.' : 'Tidak ada riwayat outstanding payable lunas.'}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                      <th className="p-3.5 pl-5">No. AP</th>
                      <th className="p-3.5">Supplier</th>
                      <th className="p-3.5">Jatuh Tempo</th>
                      <th className="p-3.5">{payablesTab === 'outstanding' ? 'Sisa Payable' : 'Total Lunas'}</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 pr-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedAp.map((payable) => {
                      const remaining = payable.amount - payable.paidAmount;
                      const isOverdue = !!payable.dueDate && dateOnly(payable.dueDate) < today && payable.status !== 'Lunas';

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
                          <td className="p-3.5 pr-5 text-right space-x-2">
                            <button
                              onClick={() => { setSelectedPayableDetail(payable); setShowPayableDetail(true); }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-bold transition"
                            >
                              <Eye size={12} />
                              <span>Detail</span>
                            </button>
                            {payablesTab === 'outstanding' && (
                              <button
                                onClick={() => handlePaySupplier(payable)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition"
                              >
                                <HandCoins size={12} />
                                <span>Bayar Supplier</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalApPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                  <span className="text-slate-500 text-[11px]">Halaman {apPage} dari {totalApPages}</span>
                  <div className="flex gap-1">
                    <button 
                      disabled={apPage === 1}
                      onClick={() => setApPage(prev => prev - 1)}
                      className="p-1.5 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button 
                      disabled={apPage === totalApPages}
                      onClick={() => setApPage(prev => prev + 1)}
                      className="p-1.5 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Panel>}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPayable && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 font-sans text-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <HandCoins size={16} className="text-cyan-400" />
                Bayar Outstanding Payable (AP)
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={submitPayment}>
              <div className="p-5 space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-800">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold">Dokumen AP:</span>
                    <span className="font-mono font-black">{selectedPayable.payableNumber}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold">Supplier:</span>
                    <span>{selectedPayable.supplierName}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2 pt-2 border-t border-amber-200">
                    <span className="font-bold">Sisa Payable:</span>
                    <span className="font-mono font-black">{formatIDR(selectedPayable.amount - selectedPayable.paidAmount)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Pilih Rekening Bank / Kas <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500 font-bold text-slate-700"
                  >
                    <option value="" disabled>-- Pilih Rekening --</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.type === 'Bank' ? 'BANK' : 'KAS'} - {acc.name} ({formatIDR(Number(acc.balance))})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Nominal Pembayaran <span className="text-rose-500">*</span></label>
                  <CurrencyInput
                    required
                    value={paymentAmount || ''}
                    onValueChange={(val) => setPaymentAmount(Number(val))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500 font-bold"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Catatan Pembayaran</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isSubmittingPayment ? 'Memproses...' : 'Bayar Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AR Detail Modal */}
      {showInvoiceDetail && selectedInvoiceDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 font-sans text-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
              <h3 className="font-bold">Detail AR (Invoice)</h3>
              <button onClick={() => setShowInvoiceDetail(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">No. Invoice</div>
                  <div className="font-mono font-bold text-cyan-600 text-sm">{selectedInvoiceDetail.invoiceNumber}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Customer</div>
                  <div className="font-bold text-slate-800">{selectedInvoiceDetail.customerName}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Tanggal Invoice</div>
                  <div>{formatDate(selectedInvoiceDetail.date)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Jatuh Tempo</div>
                  <div className="font-bold">{formatDate(selectedInvoiceDetail.dueDate)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total</div>
                  <div className="font-mono font-bold">{formatIDR(selectedInvoiceDetail.total)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Sisa Receivable</div>
                  <div className="font-mono font-bold text-rose-600">{formatIDR(selectedInvoiceDetail.total - selectedInvoiceDetail.paidAmount)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Status</div>
                  <div className="mt-1">
                    <StatusPill tone={selectedInvoiceDetail.status === 'Lunas' ? 'emerald' : 'amber'}>
                      {selectedInvoiceDetail.status}
                    </StatusPill>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setShowInvoiceDetail(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Tutup
                </button>
                {selectedInvoiceDetail.status !== 'Dibatalkan' && (
                  <button
                    onClick={() => handleCancelInvoice(selectedInvoiceDetail.id, selectedInvoiceDetail.invoiceNumber)}
                    className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-lg font-bold"
                  >
                    Batalkan Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AP Detail Modal */}
      {showPayableDetail && selectedPayableDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 font-sans text-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
              <h3 className="font-bold">Detail AP (Payable)</h3>
              <button onClick={() => setShowPayableDetail(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">No. AP</div>
                  <div className="font-mono font-bold text-cyan-600 text-sm">{selectedPayableDetail.payableNumber}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Supplier</div>
                  <div className="font-bold text-slate-800">{selectedPayableDetail.supplierName}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Jatuh Tempo</div>
                  <div className="font-bold">{formatDate(selectedPayableDetail.dueDate)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Status</div>
                  <div className="mt-1">
                    <StatusPill tone={selectedPayableDetail.status === 'Lunas' ? 'emerald' : 'amber'}>
                      {selectedPayableDetail.status}
                    </StatusPill>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total</div>
                  <div className="font-mono font-bold">{formatIDR(selectedPayableDetail.amount)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Sisa Payable</div>
                  <div className="font-mono font-bold text-rose-600">{formatIDR(selectedPayableDetail.amount - selectedPayableDetail.paidAmount)}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Catatan</div>
                  <div>{(selectedPayableDetail as any).notes || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
