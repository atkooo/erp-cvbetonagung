/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Filter, Check, ShieldCheck, HelpCircle, XCircle, DollarSign, X } from '@/src/components/icons';
import { Invoice, Payment } from '../types';
import { authStorage } from '../services/api';
import { financeApi } from '../features/finance/api';
import { formatDate } from '../utils/date';
import { SkeletonTable, ErrorCard } from './Skeleton';
import SearchableSelect from './SearchableSelect';
import CurrencyInput from './CurrencyInput';
import Swal from 'sweetalert2';

interface PaymentsViewProps {
  onTriggerNotification: (message: string) => void;
  onNavigate?: (view: string) => void;
}

export default function PaymentsView({ onTriggerNotification }: PaymentsViewProps) {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qris'>('transfer');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // API states
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [paymentData, invoiceData, accountsData] = await Promise.all([
        financeApi.getPayments(),
        financeApi.getInvoices(),
        financeApi.getAccounts(),
      ]);
      setPayments(paymentData);
      setInvoices(invoiceData);
      setAccounts(accountsData);
      
      if (accountsData.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accountsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load payments', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat data pembayaran';
      setErrorMessage(msg);
      onTriggerNotification(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Workflow shortcut effect
  useEffect(() => {
    const pendingInvoiceId = sessionStorage.getItem('action_pay_invoice');
    if (pendingInvoiceId) {
      sessionStorage.removeItem('action_pay_invoice');
      
      // We need to wait for invoices to load
      const checkAndOpen = setInterval(() => {
        setInvoices((currentInvoices) => {
          if (currentInvoices.length > 0) {
            clearInterval(checkAndOpen);
            setTimeout(() => {
              const invoice = currentInvoices.find((inv) => inv.id === pendingInvoiceId);
              if (invoice) {
                setSelectedInvoiceId(pendingInvoiceId);
                setPaymentAmount(invoice.total - invoice.paidAmount);
                setPaymentMethod('transfer');
                setPaymentNotes(`Penerimaan pembayaran faktur ${invoice.invoiceNumber}`);
                setShowReceiveModal(true);
              }
            }, 500);
          }
          return currentInvoices;
        });
      }, 500);
      
      // timeout clear interval after 10s
      setTimeout(() => clearInterval(checkAndOpen), 10000);
    }
  }, []);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const unpaidInvoices = invoices.filter((inv) => {
    const hasPendingPayment = payments.some(p => p.invoiceNumber === inv.invoiceNumber && p.status === 'Pending');
    return inv.status !== 'Lunas' && inv.total - inv.paidAmount > 0 && !hasPendingPayment;
  });
  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId) || null;
  const selectedOutstanding = selectedInvoice ? selectedInvoice.total - selectedInvoice.paidAmount : 0;

  const filteredPayments = payments.filter((pay) => {
    const matchesSearch =
      pay.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
      pay.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      pay.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesMethod = methodFilter === 'All' || pay.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const openReceivePaymentModal = () => {
    const firstInvoice = unpaidInvoices[0] || null;
    setSelectedInvoiceId(firstInvoice?.id || '');
    setPaymentAmount(firstInvoice ? firstInvoice.total - firstInvoice.paidAmount : 0);
    setPaymentMethod('transfer');
    setPaymentNotes(firstInvoice ? `Penerimaan pembayaran faktur ${firstInvoice.invoiceNumber}` : '');
    setShowReceiveModal(true);
  };

  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId) || null;
    setSelectedInvoiceId(invoiceId);
    setPaymentAmount(invoice ? invoice.total - invoice.paidAmount : 0);
    setPaymentNotes(invoice ? `Penerimaan pembayaran faktur ${invoice.invoiceNumber}` : '');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) {
      onTriggerNotification('Pilih invoice yang akan dilunasi.');
      return;
    }
    if (paymentAmount <= 0) {
      onTriggerNotification('Gagal: nominal penerimaan harus lebih besar dari 0.');
      return;
    }
    if (paymentAmount > selectedOutstanding) {
      onTriggerNotification('Gagal: nominal penerimaan melebihi sisa piutang invoice.');
      return;
    }
    if (!selectedAccountId) {
      onTriggerNotification('Pilih akun penerima pembayaran.');
      return;
    }

    setIsSavingPayment(true);
    try {
      const todayStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      await financeApi.createPayment({
        invoice_id: selectedInvoice.id,
        account_id: selectedAccountId,
        payment_date: todayStr,
        method: paymentMethod,
        amount: paymentAmount,
        notes: paymentNotes,
      });
      onTriggerNotification(`Kasir berhasil mencatat penerimaan untuk ${selectedInvoice.invoiceNumber}`);
      setShowReceiveModal(false);
      await loadData();
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal mencatat penerimaan pembayaran');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleVerify = async (payId: string, payNum: string, customer: string, amount: number) => {
    const result = await Swal.fire({
      title: 'Verifikasi Pembayaran',
      text: `Approve setoran dari ${customer} sebesar ${formatIDR(amount)}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Approve',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await financeApi.verifyPayment(payId);
        onTriggerNotification(`Berhasil memverifikasi setoran BANK dari ${customer} sebesar ${formatIDR(amount)}`);
        await loadData();
      } catch (err) {
        onTriggerNotification(err instanceof Error ? err.message : 'Gagal verifikasi pembayaran');
      }
    }
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="h-3 w-1/3 bg-slate-200/80 rounded animate-pulse" />
              <div className="h-6 w-2/3 bg-slate-200/80 rounded animate-pulse" />
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="h-3 w-1/3 bg-slate-200/80 rounded animate-pulse" />
              <div className="h-6 w-2/3 bg-slate-200/80 rounded animate-pulse" />
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="h-3 w-1/3 bg-slate-200/80 rounded animate-pulse" />
              <div className="h-6 w-2/3 bg-slate-200/80 rounded animate-pulse" />
            </div>
          </div>
          <SkeletonTable rows={5} cols={8} />
        </div>
      ) : errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={loadData} />
      ) : (
        <>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-sans font-bold text-sm text-slate-800 uppercase tracking-tight flex items-center gap-2">
                Kasir / Penerimaan Pembayaran
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Input uang masuk pelanggan, pelunasan invoice, dan audit pembayaran kas/bank.</p>
            </div>
            <button
              onClick={openReceivePaymentModal}
              disabled={unpaidInvoices.length === 0}
              className="px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DollarSign size={14} />
              <span>Terima Pembayaran</span>
            </button>
          </div>

          {/* Visual Method cards summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cash summary */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Total Nominal Cash (Tunai)</span>
              <h4 className="text-base font-black text-slate-800 font-mono mt-1.5">
                {formatIDR(payments.filter(p => p.method === 'Cash' && p.status === 'Verified').reduce((acc, p) => acc + p.amount, 0))}
              </h4>
              <span className="text-[9px] text-slate-400 block mt-2">Logistik pembayaran manual di workshop</span>
            </div>

            {/* Transfer sum */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Total Transfer Rek Bank</span>
              <h4 className="text-base font-black text-cyan-705 font-mono mt-1.5 text-cyan-600">
                {formatIDR(payments.filter(p => p.method === 'Transfer' && p.status === 'Verified').reduce((acc, p) => acc + p.amount, 0))}
              </h4>
              <span className="text-[9px] text-slate-400 block mt-2">BCA Rekening Giro CV Beton Agung</span>
            </div>

            {/* QRIS sum */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Total E-Wallet QRIS Digital</span>
              <h4 className="text-base font-black text-indigo-750 font-mono mt-1.5 text-indigo-600">
                {formatIDR(payments.filter(p => p.method === 'QRIS' && p.status === 'Verified').reduce((acc, p) => acc + p.amount, 0))}
              </h4>
              <span className="text-[9px] text-slate-400 block mt-2">QRIS Standar Merchant Bank Mandiri</span>
            </div>
          </div>

          {/* Main Payment receipts list Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                Log Inventaris Kas Masuk / Penerimaan Termin ({filteredPayments.length} Pembayaran)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">CV Beton Agung Audited Cash</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                    <th className="p-3.5 pl-5">Nomor Bukti</th>
                    <th className="p-3.5">Faktur Terkait</th>
                    <th className="p-3.5">Nama Relasi Customer</th>
                    <th className="p-3.5">Tanggal Bayar</th>
                    <th className="p-3.5">Metode</th>
                    <th className="p-3.5">Nominal Disetor</th>
                    <th className="p-3.5">Status Kasir</th>
                    <th className="p-3.5 pr-5 text-right">Aksi Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/40">
                      <td className="p-3.5 pl-5 font-mono font-bold text-slate-800 flex items-center gap-1.5">
                        <CreditCard size={13} className="text-slate-400" />
                        <span>{pay.paymentNumber}</span>
                      </td>
                      <td className="p-3.5 font-mono font-medium text-cyan-600">{pay.invoiceNumber}</td>
                      <td className="p-3.5 font-bold text-slate-700">{pay.customerName}</td>
                      <td className="p-3.5 font-mono text-slate-500">{formatDate(pay.date)}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-slate-150 rounded border text-[10px] font-semibold text-slate-600">
                          {pay.method}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-black text-slate-900">{formatIDR(pay.amount)}</td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          pay.status === 'Verified' ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' :
                          pay.status === 'Pending' ? 'bg-amber-100 text-amber-800 border border-amber-250 animate-pulse font-semibold' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {pay.status === 'Verified' && <ShieldCheck size={11} />}
                          {pay.status === 'Pending' && <HelpCircle size={11} />}
                          <span>{pay.status}</span>
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        {pay.status === 'Pending' ? (
                          <button
                            onClick={() => handleVerify(pay.id, pay.paymentNumber, pay.customerName, pay.amount)}
                            className="px-2.5 py-1 text-[10px] bg-slate-900 hover:bg-slate-800 text-white font-bold rounded flex items-center gap-1 ml-auto"
                          >
                            <Check size={11} />
                            <span>Verifikasi</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono italic">Audit Sukses</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {showReceiveModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans text-xs">
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign size={18} className="text-cyan-400" />
                    <h3 className="font-bold text-sm">Kasir: Terima Pembayaran</h3>
                  </div>
                  <button onClick={() => setShowReceiveModal(false)} className="text-slate-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Invoice / Piutang Pelanggan</label>
                    <SearchableSelect
                      value={selectedInvoiceId}
                      onChange={(val) => handleInvoiceChange(val)}
                      options={unpaidInvoices.map((inv) => ({
                        value: inv.id,
                        label: `${inv.invoiceNumber} - ${inv.customerName} - Sisa ${formatIDR(inv.total - inv.paidAmount)}`
                      }))}
                      placeholder="-- Cari atau Pilih Invoice --"
                    />
                  </div>

                  {selectedInvoice && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-slate-400">Ringkasan Piutang</span>
                      <p className="font-bold text-slate-800 text-xs">{selectedInvoice.invoiceNumber} - {selectedInvoice.customerName}</p>
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 pt-1.5 border-t border-slate-200 mt-1">
                        <span>Total: <strong>{formatIDR(selectedInvoice.total)}</strong></span>
                        <span>Dibayar: <strong>{formatIDR(selectedInvoice.paidAmount)}</strong></span>
                        <span>Sisa: <strong className="text-indigo-700">{formatIDR(selectedOutstanding)}</strong></span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Akun Penerima</label>
                      <select
                        value={selectedAccountId}
                        onChange={(e) => {
                          const accId = e.target.value;
                          setSelectedAccountId(accId);
                          const acc = accounts.find(a => a.id === accId);
                          if (acc) {
                            if (acc.type === 'bank') setPaymentMethod('transfer');
                            else if (acc.type === 'cash') setPaymentMethod('cash');
                            else if (acc.type === 'ewallet') setPaymentMethod('qris');
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-200 focus:bg-white bg-slate-50 rounded"
                      >
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Persentase (%)</label>
                      <input 
                        type="number"
                        min={1}
                        max={100}
                        placeholder="Contoh: 50"
                        className="w-full px-3 py-2 border border-slate-200 focus:outline-none rounded placeholder:text-slate-300"
                        onChange={(e) => {
                          const pct = Number(e.target.value);
                          if (pct > 0 && selectedInvoice) {
                            const calculated = Math.round((selectedInvoice.total * pct) / 100);
                            setPaymentAmount(calculated > selectedOutstanding ? selectedOutstanding : calculated);
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Nominal Diterima</label>
                      <CurrencyInput
                        required
                        value={paymentAmount || ''}
                        onValueChange={(val) => setPaymentAmount(Number(val))}
                        className="w-full px-3 py-2 border border-slate-200 focus:outline-none rounded"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Catatan Kasir</label>
                    <textarea
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Keterangan transfer, nomor referensi, atau catatan kasir..."
                      className="w-full px-3 py-2 border border-slate-200 focus:outline-none h-16 resize-none rounded"
                    />
                  </div>

                  <div className="pt-3 border-t flex justify-end gap-2 text-xs font-bold">
                    <button type="button" onClick={() => setShowReceiveModal(false)} className="px-3 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">Batal</button>
                    <button type="submit" disabled={isSavingPayment || !selectedInvoice} className="px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg disabled:opacity-50">
                      {isSavingPayment ? 'Menyimpan...' : 'Simpan Penerimaan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
