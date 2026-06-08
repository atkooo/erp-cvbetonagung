/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Receipt, Search, Filter, Printer, ExternalLink, Calendar, CheckCircle, AlertTriangle, X, DollarSign } from '@/src/components/icons';
import { Invoice, ViewType } from '../types';
import { authStorage } from '../services/api';
import { financeApi } from '../features/finance/api';
import { formatDate } from '../utils/date';
import { SkeletonTable, ErrorCard } from './Skeleton';

interface InvoicesViewProps {
  onTriggerNotification: (message: string) => void;
  onNavigate: (view: ViewType) => void;
}

export default function InvoicesView({ onTriggerNotification, onNavigate }: InvoicesViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // API states
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await financeApi.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat data invoice';
      setErrorMessage(msg);
      onTriggerNotification(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedInvoice?.invoiceNumber || 'invoice-cv-beton-agung',
  });

  const handlePrintInvoice = () => {
    if (!selectedInvoice) return;
    onTriggerNotification(`Menyiapkan invoice ${selectedInvoice.invoiceNumber} untuk dicetak / PDF...`);
    setTimeout(() => handlePrintAction(), 150);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-sans font-bold text-sm text-slate-800 uppercase tracking-tight flex items-center gap-2">
            E-Faktur / Invoice Penjualan
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Penayangan termin tagihan pelanggan, sisa piutang, dan status jatuh tempo.</p>
        </div>
        <button
          onClick={() => {
            onNavigate('payments');
            onTriggerNotification('Berpindah ke halaman Log Transaksi Pembayaran');
          }}
          className="px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5"
        >
          <DollarSign size={14} />
          <span>Lihat Log Penerimaan</span>
        </button>
      </div>

      {/* Inputs controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari invoice atau nama pembeli..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
          <Filter size={13} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-[11px] text-slate-600 bg-transparent py-1 focus:outline-none cursor-pointer"
          >
            <option value="All">Semua Invoice</option>
            <option value="Belum Lunas">Status: Belum Lunas</option>
            <option value="Sebagian Dibayar">Status: Sebagian Dibayar</option>
            <option value="Lunas">Status: Lunas</option>
            <option value="Overdue">Status: Overdue</option>
          </select>
        </div>
      </div>

      {/* Main invoices grid table */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={8} />
      ) : errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={loadData} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                  <th className="p-3.5 pl-5">Nomor invoice</th>
                  <th className="p-3.5">Nama Customer</th>
                  <th className="p-3.5">Tanggal Terbit</th>
                  <th className="p-3.5">Jatuh Tempo</th>
                  <th className="p-3.5">Nilai Tagihan</th>
                  <th className="p-3.5">Telah Dibayar</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      Tidak ditemukan kecocokan dokumen invoice.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const badgeColors: Record<string, string> = {
                      'Belum Lunas': 'bg-slate-100 text-slate-600 border-slate-200',
                      'Sebagian Dibayar': 'bg-blue-100 text-blue-700 border-blue-200',
                      Lunas: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      Overdue: 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse',
                    };

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/40">
                        <td className="p-3.5 pl-5 font-mono font-bold text-slate-800 flex items-center gap-1.5">
                          <Receipt size={13} className="text-slate-400" />
                          <span>{inv.invoiceNumber}</span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-700">{inv.customerName}</td>
                        <td className="p-3.5 font-mono text-slate-500">{formatDate(inv.date)}</td>
                        <td className="p-3.5 font-mono font-medium text-amber-600">{formatDate(inv.dueDate)}</td>
                        <td className="p-3.5 font-mono font-black text-slate-900">{formatIDR(inv.total)}</td>
                        <td className="p-3.5 font-mono text-emerald-600 font-bold">{formatIDR(inv.paidAmount)}</td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColors[inv.status] || 'bg-slate-100'}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right font-bold">
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              onTriggerNotification(`Membuka Visual Invoice Slip ${inv.invoiceNumber}`);
                            }}
                            className="px-2.5 py-1 text-[10px] bg-slate-50 hover:bg-slate-100 border rounded cursor-pointer transition-colors"
                          >
                            Lihat Slip
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visual Invoice Slate (Simulated Letterhead Receipt) */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans text-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Stamp / Letter Header bg-slate-900 */}
            <div className="p-6 bg-slate-950 text-white flex justify-between items-center relative">
              <div className="space-y-1">
                <span className="text-[10px] tracking-wider uppercase font-mono text-cyan-400 font-bold">FAKTUR KOMERSIAL</span>
                <h3 className="font-bold text-base">CV BETON AGUNG SOLUSI</h3>
                <p className="text-[10px] text-slate-400">Penyedia Kubah Masjid & Precast Beton Jawa Timur</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            {/* Slip content */}
            <div className="p-6 space-y-6">
              {/* Header metadata row */}
              <div className="grid grid-cols-2 gap-4 text-[11px] leading-relaxed pb-4 border-b border-slate-100">
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Diterbitkan Untuk</p>
                  <strong className="text-slate-800 text-xs block">{selectedInvoice.customerName}</strong>
                  <span className="text-slate-500 block">Mitra Pembangunan Daerah</span>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Detail Dokumen Faktur</p>
                  <strong className="text-cyan-600 block text-xs">{selectedInvoice.invoiceNumber}</strong>
                  <span className="text-slate-500 block">Tanggal: <strong className="text-slate-600">{formatDate(selectedInvoice.date)}</strong></span>
                  <span className="text-rose-600 font-bold block">Jatuh Tempo: {formatDate(selectedInvoice.dueDate)}</span>
                </div>
              </div>

              {/* Items row */}
              <div className="space-y-3">
                <p className="text-slate-400 uppercase tracking-widest font-mono text-[9px] font-bold">Rekapitulasi Borongan Terkait</p>
                <div className="p-3.5 bg-slate-50 border rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-slate-800">Paket Konstruksi Terintegrasi</h5>
                    <p className="text-slate-400 text-[10px] mt-0.5">Komponen Beton Pracetak standardisasi SNI CV Beton Agung Java</p>
                  </div>
                  <strong className="text-slate-900 font-bold font-mono text-[13px]">{formatIDR(selectedInvoice.total)}</strong>
                </div>
              </div>

              {/* Receipt status stamp */}
              <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-100 rounded-xl">
                <div>
                  <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">Kondisi Validasi</span>
                  <strong className="text-slate-700 text-xs mt-0.5 block">Sisa Hutang: <span className="font-mono text-indigo-750 font-black">{formatIDR(selectedInvoice.total - selectedInvoice.paidAmount)}</span></strong>
                </div>
                
                <span className={`px-3 py-1 rounded text-xs font-black uppercase tracking-wider ${
                  selectedInvoice.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  selectedInvoice.status === 'Sebagian Dibayar' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800 animate-pulse'
                }`}>
                  {selectedInvoice.status}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs font-bold">
              <button
                onClick={handlePrintInvoice}
                className="px-3.5 py-1.5 border hover:bg-slate-100 rounded-lg flex items-center gap-1.5 text-slate-650 cursor-pointer"
              >
                <Printer size={13} />
                <span>Cetak / Cetak PDF</span>
              </button>

              <button
                onClick={() => {
                  onTriggerNotification(`Mengirim softcopy WA tagihan ke customer`);
                }}
                className="px-3.5 py-1.5 border hover:bg-slate-100 rounded-lg flex items-center gap-1.5 text-slate-650 cursor-pointer"
              >
                <ExternalLink size={13} />
                <span>Kirim WhatsApp</span>
              </button>

              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden">
        <div ref={printRef} className="print:block p-8 font-sans text-sm text-black bg-white">
          {selectedInvoice && (
            <div className="w-full max-w-[800px] mx-auto">
              <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-8">
                <div>
                  <h1 className="text-3xl font-black tracking-tight uppercase">CV Beton Agung Solusi</h1>
                  <p className="text-sm font-bold mt-1">Penyedia Kubah Masjid & Precast Beton Jawa Timur</p>
                  <p className="text-xs mt-1 text-slate-700 max-w-sm">Jl. Raya Sukomanunggal Jaya No. 12, Surabaya, Jawa Timur</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black text-slate-500 uppercase tracking-widest border border-slate-300 inline-block px-4 py-1">
                    INVOICE
                  </h2>
                  <p className="font-mono font-bold mt-2 text-lg">{selectedInvoice.invoiceNumber}</p>
                  <p className="text-sm">Tanggal: {formatDate(selectedInvoice.date)}</p>
                  <p className="text-sm">Jatuh Tempo: {formatDate(selectedInvoice.dueDate)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="border border-black rounded-md p-4">
                  <p className="text-[10px] font-mono font-bold text-slate-500 tracking-widest uppercase mb-1">Ditagihkan Kepada</p>
                  <p className="font-bold text-lg">{selectedInvoice.customerName}</p>
                  <p className="mt-2 text-xs text-slate-700">Mitra Pembangunan Daerah</p>
                </div>
                <div className="border border-black rounded-md p-4">
                  <p className="text-[10px] font-mono font-bold text-slate-500 tracking-widest uppercase mb-2">Status Pembayaran</p>
                  <p>Status: <strong>{selectedInvoice.status}</strong></p>
                  <p>Total Dibayar: <strong>{formatIDR(selectedInvoice.paidAmount)}</strong></p>
                  <p>Sisa Tagihan: <strong>{formatIDR(selectedInvoice.total - selectedInvoice.paidAmount)}</strong></p>
                </div>
              </div>

              <table className="w-full mb-8 border-collapse border border-black">
                <thead>
                  <tr className="bg-slate-100 uppercase text-xs">
                    <th className="p-3 border border-black text-left w-12">No</th>
                    <th className="p-3 border border-black text-left">Uraian Tagihan</th>
                    <th className="p-3 border border-black text-right w-48">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-black text-center">1</td>
                    <td className="p-3 border border-black">
                      <p className="font-bold">Paket Konstruksi Terintegrasi</p>
                      <p className="text-xs text-slate-600 mt-1">Komponen Beton Pracetak standardisasi SNI CV Beton Agung</p>
                    </td>
                    <td className="p-3 border border-black text-right font-mono font-bold">{formatIDR(selectedInvoice.total)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="p-3 border border-black text-right font-bold">TOTAL TAGIHAN</td>
                    <td className="p-3 border border-black text-right font-mono font-bold">{formatIDR(selectedInvoice.total)}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="p-3 border border-black text-right font-bold">TELAH DIBAYAR</td>
                    <td className="p-3 border border-black text-right font-mono font-bold">{formatIDR(selectedInvoice.paidAmount)}</td>
                  </tr>
                  <tr className="bg-slate-100">
                    <td colSpan={2} className="p-3 border border-black text-right font-black">SISA TAGIHAN</td>
                    <td className="p-3 border border-black text-right font-mono font-black text-lg">
                      {formatIDR(selectedInvoice.total - selectedInvoice.paidAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div className="text-xs leading-relaxed mb-12">
                <p><strong>Catatan:</strong> Mohon lakukan pembayaran sebelum tanggal jatuh tempo. Simpan dokumen ini sebagai bukti tagihan resmi.</p>
              </div>

              <div className="grid grid-cols-2 gap-20 mt-12 text-center text-xs">
                <div>
                  <p>Diterima Oleh,</p>
                  <div className="h-24"></div>
                  <p className="border-t border-black pt-2 font-bold">{selectedInvoice.customerName}</p>
                </div>
                <div>
                  <p>Hormat Kami,</p>
                  <div className="h-24"></div>
                  <p className="border-t border-black pt-2 font-bold">Finance Dept.</p>
                  <p>CV Beton Agung Solusi</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
