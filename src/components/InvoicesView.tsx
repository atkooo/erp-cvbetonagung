/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';
import { Receipt, Search, Filter, Printer, ExternalLink, Calendar, CheckCircle, AlertTriangle, X, DollarSign, XCircle } from '@/src/components/icons';
import { Invoice, ViewType } from '../types';
import { authStorage } from '../services/api';
import { financeApi } from '../features/finance/api';
import { formatDate, toApiDate } from '../utils/date';
import { SkeletonTable, ErrorCard } from './Skeleton';
import { salesApi } from '../features/sales/api';
import { SalesOrder } from '../types/sales';
import { Plus, Truck } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { getCompanyProfile, formatAddressForPrint, CompanyProfile } from '../utils/companyProfile';

interface InvoicesViewProps {
  onTriggerNotification: (message: string) => void;
  onNavigate: (view: ViewType) => void;
}

export default function InvoicesView({ onTriggerNotification, onNavigate }: InvoicesViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(getCompanyProfile());

  useEffect(() => {
    const handleProfileUpdate = () => {
      setCompanyProfile(getCompanyProfile());
    };
    window.addEventListener('erp_company_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('erp_company_profile_updated', handleProfileUpdate);
  }, []);
  const printRef = useRef<HTMLDivElement>(null);

  // Create Invoice states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [selectedSOId, setSelectedSOId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(toApiDate());
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return toApiDate(d);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API states
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [invoiceData, accountsData] = await Promise.all([
        financeApi.getInvoices(),
        financeApi.getAccounts()
      ]);
      setInvoices(invoiceData);
      setAccounts(accountsData.filter(a => a.type === 'bank' || a.type === 'ewallet'));
    } catch (err) {
      console.error('Failed to load invoices', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat data invoice';
      setErrorMessage(msg);
      onTriggerNotification(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSalesOrders = async () => {
    try {
      const data = await salesApi.getSalesOrders();
      // Only get Approved (Disetujui) sales orders that don't have invoices yet
      const approvedSOs = data.filter(so => so.status === 'Disetujui' && !so.hasInvoice);
      setSalesOrders(approvedSOs);
    } catch (err) {
      onTriggerNotification('Gagal memuat daftar Sales Order untuk invoice');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Workflow shortcut effect
  useEffect(() => {
    const pendingSalesOrderId = sessionStorage.getItem('action_create_invoice');
    if (pendingSalesOrderId) {
      sessionStorage.removeItem('action_create_invoice');

      // Load sales orders first, then set the ID
      loadSalesOrders().then(() => {
        setTimeout(() => {
          setShowCreateModal(true);
          setSelectedSOId(pendingSalesOrderId);
        }, 500);
      });
    }
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSOId) {
      onTriggerNotification('Silakan pilih Sales Order terlebih dahulu');
      return;
    }

    const so = salesOrders.find(s => s.id === selectedSOId);
    if (!so) return;

    setIsSubmitting(true);
    try {
      const newInvoice = await financeApi.createInvoice({
        customer_id: so.customerId || '',
        sales_order_id: so.id,
        invoice_date: invoiceDate,
        due_date: dueDate,
        total: so.total
      });
      onTriggerNotification(`Berhasil menerbitkan invoice untuk Sales Order ${so.orderNumber}`);
      setShowCreateModal(false);
      setSelectedSOId('');
      await loadData();

      // Automatically show and print the new invoice
      setSelectedInvoice(newInvoice);
      setTimeout(() => {
        handlePrintAction();
      }, 500);

    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal menerbitkan invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInvoice = async (docId: string, docNum: string) => {
    const { value: reason } = await Swal.fire({
      title: `Batalkan Invoice ${docNum}?`,
      text: "Tindakan ini akan membatalkan invoice. Jika invoice sudah lunas, transaksi tidak bisa dibatalkan.",
      input: 'text',
      inputPlaceholder: 'Alasan pembatalan...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#e2e8f0',
      cancelButtonText: '<span style="color:#475569">Tutup</span>',
      confirmButtonText: 'Batalkan Dokumen',
      inputValidator: (value) => {
        if (!value) {
          return 'Alasan pembatalan wajib diisi!';
        }
      }
    });

    if (reason) {
      try {
        await financeApi.cancelInvoice(docId, reason);
        onTriggerNotification(`Sukses membatalkan Invoice ${docNum}.`);
        await loadData();
        setSelectedInvoice(null);
      } catch (err) {
        onTriggerNotification(err instanceof Error ? err.message : 'Gagal membatalkan invoice');
      }
    }
  };

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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-sans font-bold text-sm text-slate-800 uppercase tracking-tight flex items-center gap-2">
            E-Faktur / Invoice Penjualan
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Penayangan termin tagihan pelanggan, sisa outstanding receivable, dan status jatuh tempo.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              loadSalesOrders();
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-xs flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Terbitkan Invoice</span>
          </button>

        </div>
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
                {paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      Tidak ditemukan kecocokan dokumen invoice.
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((inv) => {
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-slate-200">
              <div className="text-[10px] text-slate-400 font-mono">
                Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredInvoices.length)} dari {filteredInvoices.length} data
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold shadow-sm"
                >
                  Prev
                </button>
                <span className="text-slate-500 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
                  {selectedInvoice.salesOrder?.orderNumber && (
                    <span className="text-slate-500 block">Ref. SO: <strong className="text-slate-600">{selectedInvoice.salesOrder.orderNumber}</strong></span>
                  )}
                  <span className="text-slate-500 block">Tanggal: <strong className="text-slate-600">{formatDate(selectedInvoice.date)}</strong></span>
                  <span className="text-rose-600 font-bold block">Jatuh Tempo: {formatDate(selectedInvoice.dueDate)}</span>
                </div>
              </div>

              {/* Items row */}
              <div className="space-y-3">
                <p className="text-slate-400 uppercase tracking-widest font-mono text-[9px] font-bold">Rincian Item Tagihan</p>
                <div className="space-y-2">
                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    selectedInvoice.items.map((item, index) => (
                      <div key={item.id || index} className="p-3.5 bg-slate-50 border rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <h5 className="font-bold text-slate-800">{item.product?.name || 'Produk'}</h5>
                          {item.pieceCount && item.length && (
                            <div className="text-[10px] text-slate-800 font-bold mt-1">Ukuran Custom: {item.pieceCount} Fisik x {item.length} {item.product?.unit?.name || 'M'}</div>
                          )}
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            {item.quantity} {item.product?.unit?.name || ''} x {formatIDR(item.unitPrice)}
                            {item.description ? ` - ${item.description}` : ''}
                          </p>
                        </div>
                        <strong className="text-slate-900 font-bold font-mono text-[13px]">{formatIDR(item.subtotal)}</strong>
                      </div>
                    ))
                  ) : (
                    <div className="p-3.5 bg-slate-50 border rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <h5 className="font-bold text-slate-800">Paket Konstruksi Terintegrasi</h5>
                        <p className="text-slate-400 text-[10px] mt-0.5">Komponen Beton Pracetak standardisasi SNI CV Beton Agung Java</p>
                      </div>
                      <strong className="text-slate-900 font-bold font-mono text-[13px]">{formatIDR(selectedInvoice.total)}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Receipt status stamp */}
              <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-100 rounded-xl">
                <div>
                  <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">Kondisi Validasi</span>
                  <strong className="text-slate-700 text-xs mt-0.5 block">Sisa Outstanding: <span className="font-mono text-indigo-750 font-black">{formatIDR(selectedInvoice.total - selectedInvoice.paidAmount)}</span></strong>
                </div>

                <span className={`px-3 py-1 rounded text-xs font-black uppercase tracking-wider ${selectedInvoice.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  selectedInvoice.status === 'Sebagian Dibayar' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800 animate-pulse'
                  }`}>
                  {selectedInvoice.status}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-end gap-2 text-xs font-bold">
              {(selectedInvoice.status === 'Sebagian Dibayar' || selectedInvoice.status === 'Lunas') && (
                <button
                  onClick={() => {
                    if (selectedInvoice.salesOrderId) {
                      sessionStorage.setItem('action_create_do', selectedInvoice.salesOrderId);
                      setSelectedInvoice(null);
                      onNavigate && onNavigate('delivery-orders');
                    } else {
                      onTriggerNotification('Invoice ini tidak terhubung dengan Sales Order.');
                    }
                  }}
                  className="px-4 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Truck size={13} />
                  <span>Buat Surat Jalan (DO)</span>
                </button>
              )}

              {(selectedInvoice.status === 'Belum Lunas' || selectedInvoice.status === 'Sebagian Dibayar' || selectedInvoice.status === 'Overdue') && (
                <button
                  onClick={() => {
                    sessionStorage.setItem('action_pay_invoice', selectedInvoice.id);
                    setSelectedInvoice(null);
                    onNavigate && onNavigate('payments');
                  }}
                  className="px-4 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <DollarSign size={13} />
                  <span>Lanjut Terima Pembayaran</span>
                </button>
              )}

              <button
                onClick={handlePrintInvoice}
                className="px-3.5 py-1.5 border hover:bg-slate-100 rounded-lg flex items-center gap-1.5 text-slate-650 cursor-pointer"
              >
                <Printer size={13} />
                <span>Cetak / Cetak PDF</span>
              </button>

              <button
                onClick={() => {
                  const message = `Halo ${selectedInvoice.customerName},\n\nBerikut adalah ringkasan tagihan (Invoice) dari *${companyProfile.name}*:\n\n*No. Invoice:* ${selectedInvoice.invoiceNumber}\n*Total Tagihan:* ${formatIDR(selectedInvoice.total)}\n*Sisa Tagihan:* ${formatIDR(selectedInvoice.total - selectedInvoice.paidAmount)}\n*Jatuh Tempo:* ${formatDate(selectedInvoice.dueDate)}\n\nMohon segera melakukan pelunasan sebelum tanggal jatuh tempo. Terima kasih.`;

                  let waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                  if (selectedInvoice.customer?.phone) {
                    let phone = selectedInvoice.customer.phone.replace(/\D/g, '');
                    // Jika dimulai dengan angka 0, ubah menjadi format internasional Indonesia (62)
                    if (phone.startsWith('0')) {
                      phone = '62' + phone.substring(1);
                    }
                    waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                  }

                  window.open(waUrl, '_blank');
                  onTriggerNotification(`Membuka WhatsApp untuk mengirim tagihan ke ${selectedInvoice.customerName}`);
                }}
                className="px-3.5 py-1.5 border hover:bg-slate-100 rounded-lg flex items-center gap-1.5 text-slate-650 cursor-pointer"
              >
                <ExternalLink size={13} />
                <span>Kirim WhatsApp</span>
              </button>

              {selectedInvoice.status !== 'cancelled' && (
                <button
                  onClick={() => handleCancelInvoice(selectedInvoice.id, selectedInvoice.invoiceNumber)}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <XCircle size={13} className="text-rose-500" />
                  <span>Batalkan Invoice</span>
                </button>
              )}

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
        <div ref={printRef} className="print:block bg-white text-black print-a4-container">
          {selectedInvoice && (
            <div className="w-full flex flex-col h-full">
              {/* Header / Letterhead */}
              <div className="flex justify-between items-center border-b-4 border-double border-slate-900 pb-5 mb-8 mt-4">
                <div className="flex items-center gap-4">
                  {companyProfile.logoUrl ? (
                    <img src={companyProfile.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
                  ) : (
                    <div className="w-16 h-16 bg-slate-900 flex items-center justify-center text-white font-black text-2xl tracking-tighter">
                      {companyProfile.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">{companyProfile.name}</h1>
                    <p className="text-xs font-bold text-slate-700 tracking-wide mt-0.5">GENERAL CONTRACTOR & SUPPLIER MATERIAL ALAM</p>
                    <p className="text-[10px] mt-1 text-slate-600 max-w-sm">{formatAddressForPrint(companyProfile.address)}</p>
                    <p className="text-[10px] mt-0.5 text-slate-600">Telp: {companyProfile.phone} | Email: {companyProfile.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-black text-cyan-700 uppercase tracking-widest mb-2">
                    INVOICE
                  </h2>
                  <div className="inline-block text-left bg-slate-50 p-3 border border-slate-200 rounded">
                    <p className="text-xs flex justify-between gap-4"><span className="font-bold text-slate-500">No. Invoice:</span> <span className="font-mono font-bold text-sm">{selectedInvoice.invoiceNumber}</span></p>
                    <p className="text-xs flex justify-between gap-4 mt-1"><span className="font-bold text-slate-500">Tanggal:</span> <span>{formatDate(selectedInvoice.date || selectedInvoice.invoiceDate)}</span></p>
                    <p className="text-xs flex justify-between gap-4 mt-1"><span className="font-bold text-slate-500">Jatuh Tempo:</span> <span className="text-rose-600 font-bold">{formatDate(selectedInvoice.dueDate)}</span></p>
                    {selectedInvoice.salesOrder?.orderNumber && (
                      <p className="text-xs flex justify-between gap-4 mt-1 border-t border-slate-200 pt-1"><span className="font-bold text-slate-500">Ref. SO:</span> <span>{selectedInvoice.salesOrder.orderNumber}</span></p>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="flex gap-10 mb-8">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ditagihkan Kepada:</p>
                  <div className="border-l-4 border-cyan-700 pl-3">
                    <p className="font-bold text-base text-slate-900 uppercase">{selectedInvoice.customerName}</p>
                    <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap">{selectedInvoice.customer?.phone || 'Alamat tidak tersedia. Harap hubungi tim representatif kami.'}</p>
                  </div>
                </div>
                <div className="w-1/3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Informasi Pembayaran:</p>
                  <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-800">
                    <p className="font-bold mb-1">Transfer Bank / E-Wallet:</p>
                    {accounts.length > 0 ? (
                      accounts.map(acc => (
                        <p key={acc.id} className="flex justify-between font-mono mt-0.5">
                          <span className="font-bold">{acc.bank_name || acc.name}</span> <span>{acc.account_number}</span>
                        </p>
                      ))
                    ) : (
                      <p className="text-[10px] italic text-slate-500">Belum ada rekening tujuan diatur.</p>
                    )}
                    <p className="mt-2 text-[10px] text-slate-500">A/N: {companyProfile.name}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8 flex-1">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3 text-center w-12 border-b-2 border-slate-900">No</th>
                      <th className="py-2.5 px-3 text-left border-b-2 border-slate-900">Deskripsi Barang / Jasa</th>
                      <th className="py-2.5 px-3 text-center w-24 border-b-2 border-slate-900">Qty</th>
                      <th className="py-2.5 px-3 text-right w-32 border-b-2 border-slate-900">Harga Satuan</th>
                      <th className="py-2.5 px-3 text-right w-36 border-b-2 border-slate-900">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 border-b-2 border-slate-900">
                    {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                      selectedInvoice.items.map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="py-3 px-3 text-center text-slate-500">{index + 1}</td>
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-900">{item.product?.name || 'Produk'}</p>
                            {item.pieceCount && item.length && (
                              <p className="text-[10px] text-slate-600 mt-0.5">{item.pieceCount} Fisik x {item.length} {item.product?.unit?.name || 'M'}</p>
                            )}
                            {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
                          </td>
                          <td className="py-3 px-3 text-center font-mono">{item.quantity} <span className="text-[10px] text-slate-500">{item.product?.unit?.name || ''}</span></td>
                          <td className="py-3 px-3 text-right font-mono">{formatIDR(item.unitPrice)}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatIDR(item.subtotal)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-3 px-3 text-center text-slate-500">1</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">Material Konstruksi</p>
                          <p className="text-xs text-slate-500 mt-0.5">Sesuai penawaran/surat jalan</p>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">1</td>
                        <td className="py-3 px-3 text-right font-mono">{formatIDR(selectedInvoice.total)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatIDR(selectedInvoice.total)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} rowSpan={3} className="py-4 px-3 text-xs align-top border-r border-slate-200">
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded text-amber-800 inline-block w-full max-w-sm">
                          <p className="font-bold mb-1">Status: {selectedInvoice.status.toUpperCase()}</p>
                          <p className="text-[10px]">Harap sertakan Nomor Invoice pada berita transfer pembayaran Anda.</p>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-xs font-bold text-slate-600 uppercase">Subtotal</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatIDR(selectedInvoice.total)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-right text-xs font-bold text-slate-600 uppercase border-b border-slate-200">Telah Dibayar</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 border-b border-slate-200">- {formatIDR(selectedInvoice.paidAmount)}</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="py-3 px-3 text-right text-xs font-black text-slate-900 uppercase">Total Tagihan</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900 text-lg border-b-4 border-slate-900">
                        {formatIDR(selectedInvoice.total - selectedInvoice.paidAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-20 mt-auto pt-8">
                <div className="text-center text-sm">
                  <p className="text-slate-600 mb-20">Diterima Oleh,</p>
                  <p className="border-t border-slate-900 mx-10 pt-2 font-bold uppercase text-slate-800">
                    {selectedInvoice.customerName}
                  </p>
                  <p className="text-[10px] text-slate-500">Ttd & Stempel Perusahaan</p>
                </div>
                <div className="text-center text-sm">
                  <p className="text-slate-600 mb-20">Hormat Kami,</p>
                  <p className="border-t border-slate-900 mx-10 pt-2 font-bold uppercase text-slate-800">
                    Finance Dept.
                  </p>
                  <p className="text-[10px] text-slate-500">{companyProfile.name}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-10 border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400 font-mono">
                <p>Terima kasih atas kepercayaan Anda bermitra dengan kami.</p>
                <p className="mt-1 mb-4">
                  Invoice generated by Sistem ERP {companyProfile.name} &copy; {new Date().getFullYear()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans text-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Receipt size={16} className="text-cyan-400" />
                Terbitkan Invoice Baru
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Referensi Sales Order (Approved)</label>
                  <SearchableSelect
                    value={selectedSOId}
                    onChange={(val) => setSelectedSOId(val)}
                    options={salesOrders.map(so => ({
                      value: so.id,
                      label: `${so.orderNumber} - ${so.customerName || so.customer?.name || '-'} - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(so.total)}`
                    }))}
                    placeholder="-- Cari atau Pilih Sales Order --"
                  />
                  {salesOrders.length === 0 && (
                    <p className="text-[10px] text-amber-600 mt-1">Belum ada Sales Order yang siap ditagihkan.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Tanggal Invoice</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Jatuh Tempo</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedSOId}
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                >
                  {isSubmitting ? 'Memproses...' : 'Terbitkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
