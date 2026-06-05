/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Filter, Check, ShieldCheck, HelpCircle, XCircle, DollarSign } from 'lucide-react';
import { Payment } from '../types';
import { authStorage } from '../services/api';
import { financeApi } from '../features/finance/api';

interface PaymentsViewProps {
  payments: Payment[];
  onVerifyPayment: (id: string) => void;
  onTriggerNotification: (message: string) => void;
}

export default function PaymentsView({ payments, onVerifyPayment, onTriggerNotification }: PaymentsViewProps) {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');

  // API states
  const [apiPayments, setApiPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const hasBackendSession = Boolean(authStorage.getToken());
  const activePayments = hasBackendSession ? apiPayments : payments;

  const loadData = async () => {
    if (!hasBackendSession) return;
    setIsLoading(true);
    try {
      const data = await financeApi.getPayments();
      setApiPayments(data);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [hasBackendSession]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const filteredPayments = activePayments.filter((pay) => {
    const matchesSearch =
      pay.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
      pay.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      pay.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesMethod = methodFilter === 'All' || pay.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const handleVerify = async (payId: string, payNum: string, customer: string, amount: number) => {
    if (hasBackendSession) {
      try {
        await financeApi.verifyPayment(payId);
        onTriggerNotification(`Berhasil memverifikasi setoran BANK dari ${customer} sebesar ${formatIDR(amount)}`);
        await loadData();
      } catch (err) {
        onTriggerNotification(err instanceof Error ? err.message : 'Gagal verifikasi pembayaran');
      }
    } else {
      onVerifyPayment(payId);
      onTriggerNotification(`Berhasil memverifikasi setoran BANK dari ${customer} sebesar ${formatIDR(amount)}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Method cards summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cash summary */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Total Nominal Cash (Tunai)</span>
          <h4 className="text-base font-black text-slate-800 font-mono mt-1.5">
            {formatIDR(activePayments.filter(p => p.method === 'Cash' && p.status === 'Verified').reduce((acc, p) => acc + p.amount, 0))}
          </h4>
          <span className="text-[9px] text-slate-400 block mt-2">Logistik pembayaran manual di workshop</span>
        </div>

        {/* Transfer sum */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Total Transfer Rek Bank</span>
          <h4 className="text-base font-black text-cyan-705 font-mono mt-1.5 text-cyan-600">
            {formatIDR(activePayments.filter(p => p.method === 'Transfer' && p.status === 'Verified').reduce((acc, p) => acc + p.amount, 0))}
          </h4>
          <span className="text-[9px] text-slate-400 block mt-2">BCA Rekening Giro CV Beton Agung</span>
        </div>

        {/* QRIS sum */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Total E-Wallet QRIS Digital</span>
          <h4 className="text-base font-black text-indigo-750 font-mono mt-1.5 text-indigo-600">
            {formatIDR(activePayments.filter(p => p.method === 'QRIS' && p.status === 'Verified').reduce((acc, p) => acc + p.amount, 0))}
          </h4>
          <span className="text-[9px] text-slate-400 block mt-2">QRIS Standar Merchant Bank Mandiri</span>
        </div>
      </div>

      {/* Input controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kupon pembayaran, kode invoice, atau customer..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
          <Filter size={13} className="text-slate-400" />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-[11px] text-slate-600 bg-transparent py-1 cursor-pointer focus:outline-none"
          >
            <option value="All">Semua Metode</option>
            <option value="Cash">Metode: Cash (Tunai)</option>
            <option value="Transfer">Metode: Bank Transfer</option>
            <option value="QRIS">Metode: QRIS Digital</option>
          </select>
        </div>
      </div>

      {/* Main Payment receipts list Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            Log Inventaris Kas Masuk / Penerimaan Termin ({filteredPayments.length} Pembayaran)
            <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[9px] text-slate-500 normal-case font-normal">
              {hasBackendSession ? 'API MODE' : 'DEMO MODE'}
            </span>
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
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Memuat log kas masuk dari backend...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Tidak ditemukan data setoran tunai atau pemindahbukuan.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/40">
                    <td className="p-3.5 pl-5 font-mono font-bold text-slate-800 flex items-center gap-1.5">
                      <CreditCard size={13} className="text-slate-400" />
                      <span>{pay.paymentNumber}</span>
                    </td>
                    <td className="p-3.5 font-mono font-medium text-cyan-600">{pay.invoiceNumber}</td>
                    <td className="p-3.5 font-bold text-slate-700">{pay.customerName}</td>
                    <td className="p-3.5 font-mono text-slate-500">{pay.date}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
