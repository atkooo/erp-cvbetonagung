/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  FileSpreadsheet,
  FileCheck,
  Search,
  Filter,
  Plus,
  Receipt,
  Printer,
  ChevronRight,
  TrendingUp,
  X,
  CreditCard,
  Building2,
  Calendar,
  Truck
} from '@/src/components/icons';
import { Quotation, SalesOrder, ViewType, Customer, Product } from '../types';
import { authStorage } from '../services/api';
import { salesApi } from '../features/sales/api';
import { financeApi } from '../features/finance/api';
import { customersApi } from '../features/customers/api';
import { productsApi } from '../features/products/api';
import { SkeletonTable, ErrorCard } from './Skeleton';
import SearchableSelect from './SearchableSelect';

interface SalesViewProps {
  type: 'quotation' | 'sales-order';
  onTriggerNotification: (message: string) => void;
  onNavigate: (view: ViewType) => void;
}

export default function SalesView({
  type,
  onTriggerNotification,
  onNavigate,
}: SalesViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // API states
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isQuotation = type === 'quotation';
  const dataList = isQuotation ? quotations : salesOrders;
  const printTitle = selectedDoc
    ? `${isQuotation ? selectedDoc.quoteNumber : selectedDoc.orderNumber}`
    : 'sales-document';
  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: printTitle,
  });

  // Form states to create a quick document
  const [custId, setCustId] = useState('');
  const [quotationId, setQuotationId] = useState('');
  const [productId, setProductId] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [docs, custsRes, prods] = await Promise.all([
        isQuotation ? salesApi.getQuotations() : salesApi.getSalesOrders(),
        customersApi.listCustomers(),
        productsApi.getProducts()
      ]);
      if (isQuotation) {
        setQuotations(docs as Quotation[]);
        setSalesOrders([]);
      } else {
        setSalesOrders(docs as SalesOrder[]);
      }
      setCustomers(custsRes.customers);
      setProducts(prods);

      if (custsRes.customers.length > 0 && !custId) setCustId(custsRes.customers[0].id);
      if (prods.length > 0 && !productId) {
        setProductId(prods[0].id);
        setItemPrice(prods[0].sellingPrice || 0);
      }
    } catch (err) {
      console.error('Failed to load sales data', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat data penjualan';
      setErrorMessage(msg);
      onTriggerNotification(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [type]);

  useEffect(() => {
    if (!showAddForm || isQuotation || quotations.length > 0) {
      return;
    }

    let cancelled = false;
    salesApi.getQuotations()
      .then((qs) => {
        if (!cancelled) setQuotations(qs);
      })
      .catch((err) => {
        onTriggerNotification(err instanceof Error ? err.message : 'Gagal memuat referensi quotation');
      });

    return () => {
      cancelled = true;
    };
  }, [showAddForm, isQuotation, quotations.length, onTriggerNotification]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Filter logic
  const filteredDocs = dataList.filter((doc: any) => {
    const docNum = isQuotation ? doc.quoteNumber : doc.orderNumber;
    const matchesSearch =
      docNum.toLowerCase().includes(search.toLowerCase()) ||
      doc.customerName.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle create document
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itemQty <= 0 || itemPrice <= 0) {
      onTriggerNotification('Gagal: Kuantitas dan harga produk harus positif!');
      return;
    }

    try {
      const d = new Date();
      const todayStr = d.toISOString().split('T')[0];
      const validUntil = new Date(d);
      validUntil.setDate(d.getDate() + 14); // 14 days valid

      if (isQuotation) {
        await salesApi.createQuotation({
          customer_id: custId,
          quotation_date: todayStr,
          valid_until: validUntil.toISOString().split('T')[0],
          items: [
            {
              product_id: productId,
              quantity: itemQty,
              unit_price: itemPrice,
            }
          ]
        });
        onTriggerNotification(`Sukses menerbitkan Quotation via API`);
      } else {
        await salesApi.createSalesOrder({
          customer_id: custId,
          quotation_id: quotationId ? quotationId : undefined,
          order_date: todayStr,
          items: [
            {
              product_id: productId,
              quantity: itemQty,
              unit_price: itemPrice,
            }
          ]
        });
        onTriggerNotification(`Sukses menerbitkan Sales Order via API`);
      }
      await loadData();
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal membuat dokumen');
    }

    setQuotationId('');
    setShowAddForm(false);
  };

  const handleApproveQuotation = async (docId: string, quoteNum: string) => {
    try {
      await salesApi.approveQuotation(docId);
      onTriggerNotification(`Sukses mengonversi Quotation ${quoteNum} menjadi Sales Order (SO)`);
      await loadData();
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal approve quotation');
    }
    onNavigate('sales-orders');
    setSelectedDoc(null);
  };

  const handleApproveSalesOrder = async (docId: string, docNum: string) => {
    try {
      await salesApi.approveSalesOrder(docId);
      onTriggerNotification(`Sukses approve Sales Order ${docNum} dan menerbitkan tagihan (Invoice) otomatis.`);
      await loadData();
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal approve sales order');
    }
    onNavigate('invoices');
    setSelectedDoc(null);
  };

  return (
    <div className="space-y-6 relative">
      {/* 1. Header Banner */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
            {isQuotation ? <FileSpreadsheet size={20} /> : <FileCheck size={20} />}
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-slate-800">
              {isQuotation ? 'Siklus Penawaran (Quotation Platform)' : 'Manajemen Kontrak Sales Order (SO)'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {isQuotation ? 'Kelola pipeline negosiasi biaya ornamen, precast, dan pekerjaan custom' : 'Kontrol pengiriman produksi workshop setelah DP tervalidasi terekam'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow hover:bg-slate-800 flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          <span>{isQuotation ? 'Buat Penawaran' : 'Rilis SO Baru'}</span>
        </button>
      </div>

      {/* 2. Lookup Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isQuotation ? 'Cari Nomor Quotation atau Nama Customer...' : 'Cari Nomor Sales Order atau Nama Customer...'}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-sans text-slate-850 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 shrink-0">
          <Filter size={13} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-[11px] text-slate-600 bg-transparent py-1 focus:outline-none text-xs cursor-pointer font-sans"
          >
            <option value="All">Semua Status</option>
            {isQuotation ? (
              <>
                <option value="Draft">Draft</option>
                <option value="Terkirim">Terkirim</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Ditolak">Ditolak</option>
              </>
            ) : (
              <>
                <option value="Draft">Draft</option>
                <option value="Diproses">Diproses</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Selesai">Selesai</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* 3. Document Tables */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={isQuotation ? 7 : 6} />
      ) : errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={loadData} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                  <th className="p-3.5 pl-5">Nomor Dokumen</th>
                  <th className="p-3.5">Nama Relasi Customer</th>
                  <th className="p-3.5">Tanggal Dokumen</th>
                  {isQuotation && <th className="p-3.5">Masa Berlaku s/d</th>}
                  <th className="p-3.5">Nilai Transaksi (Gross)</th>
                  <th className="p-3.5">Status Alur</th>
                  <th className="p-3.5 pr-5 text-right">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={isQuotation ? 7 : 6} className="text-center py-12 text-slate-400 font-medium">
                      Tidak ada dokumen transaksi terekam saat ini.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc: any, idx) => {
                    const docNum = isQuotation ? doc.quoteNumber : doc.orderNumber;
                    const statusColors: Record<string, string> = {
                      Draft: 'bg-slate-100 text-slate-600',
                      Terkirim: 'bg-blue-100 text-blue-700',
                      Disetujui: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      Ditolak: 'bg-red-100 text-red-700',
                      Diproses: 'bg-amber-100 text-amber-700 border-amber-300',
                      Disetujui: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                      Selesai: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      Dibatalkan: 'bg-slate-100 text-slate-400',
                    };

                    return (
                      <tr key={idx} className="hover:bg-slate-50/40">
                        <td className="p-3.5 pl-5 font-mono font-bold text-slate-800 flex items-center gap-2">
                          {isQuotation ? <FileSpreadsheet size={13} className="text-slate-400" /> : <FileCheck size={13} className="text-slate-400" />}
                          <span>{docNum}</span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-700">{doc.customerName}</td>
                        <td className="p-3.5 font-mono text-slate-500">{doc.date}</td>
                        {isQuotation && <td className="p-3.5 font-mono text-slate-450">{doc.validUntil}</td>}
                        <td className="p-3.5 font-mono font-black text-slate-900">{formatIDR(doc.total)}</td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors[doc.status] || 'bg-slate-50'}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          <button
                            onClick={() => {
                              setSelectedDoc(doc);
                              onTriggerNotification(`Membuka rincian item dokumen ${docNum}`);
                            }}
                            className="p-1 text-cyan-600 hover:text-cyan-700 bg-slate-50 hover:bg-slate-100 rounded border hover:border-slate-200 transition-all font-bold text-[10px] px-2"
                          >
                            Rincian Item
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

      {/* 4. Side Drawer Modal for Detailed Items overview */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-end z-50 p-4">
          <div className="bg-white h-full max-w-md w-full shadow-2xl border-l border-slate-200 overflow-y-auto p-6 flex flex-col justify-between animate-in slide-in-from-right duration-150 rounded-l-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Receipt size={18} className="text-cyan-500" />
                  <h4 className="font-sans font-bold text-slate-800 text-sm">
                    Rincian Document {isQuotation ? selectedDoc.quoteNumber : selectedDoc.orderNumber}
                  </h4>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              {/* Informative details */}
              <div className="space-y-4 py-5 text-xs font-sans text-slate-700">
                <div className="flex justify-between border-b border-slate-150 pb-2">
                  <span className="text-slate-400 font-medium">Customer:</span>
                  <strong className="text-slate-800">{selectedDoc.customerName}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-150 pb-2">
                  <span className="text-slate-400 font-medium">Tanggal Masuk:</span>
                  <span className="font-mono">{selectedDoc.date}</span>
                </div>
                {isQuotation && (
                  <div className="flex justify-between border-b border-slate-150 pb-2">
                    <span className="text-slate-400 font-medium">Berlaku Hingga:</span>
                    <span className="font-mono text-amber-600">{selectedDoc.validUntil}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-150 pb-2">
                  <span className="text-slate-400 font-medium">Status Dokumen:</span>
                  <span className="font-bold text-indigo-700">{selectedDoc.status}</span>
                </div>

                {/* Items loop */}
                <div className="mt-6">
                  <h5 className="font-mono font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-3">DAFTAR PENYUSUNAN BARANG</h5>
                  <div className="space-y-2">
                    {selectedDoc.items?.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-slate-800 block mb-1 leading-snug">{item.productName}</strong>
                          <span className="text-slate-400 text-[11px] font-mono">{item.quantity} Unit x {formatIDR(item.price)}</span>
                        </div>
                        <span className="font-bold text-slate-900 font-mono text-[11px]">{formatIDR(item.quantity * item.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t border-slate-100 pt-5 space-y-2">
              <div className="flex justify-between text-sm font-bold text-slate-800 mb-4 px-1">
                <span>TOTAL GROSS :</span>
                <span className="text-indigo-700 font-mono">{formatIDR(selectedDoc.total)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onTriggerNotification(`Mencetak Print Preview dokumen ${isQuotation ? selectedDoc.quoteNumber : selectedDoc.orderNumber}`);
                    setTimeout(() => handlePrintAction(), 150);
                  }}
                  className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-all hover:bg-slate-100 flex items-center justify-center gap-1.5"
                >
                  <Printer size={13} />
                  <span>Cetak PDF</span>
                </button>

                {isQuotation && (selectedDoc.status === 'Terkirim' || selectedDoc.status === 'Draft') ? (
                  <button
                    onClick={() => handleApproveQuotation(selectedDoc.id, selectedDoc.quoteNumber)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileCheck size={13} className="text-white" />
                    <span>Approve to SO</span>
                  </button>
                ) : !isQuotation && (selectedDoc.status === 'Draft' || selectedDoc.status === 'Diproses' || selectedDoc.status === 'Disetujui') ? (
                  <div className="flex flex-col gap-2 w-full">
                    {selectedDoc.status === 'Draft' || selectedDoc.status === 'Diproses' ? (
                      <button
                        onClick={() => handleApproveSalesOrder(selectedDoc.id, selectedDoc.orderNumber)}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                      >
                        <Receipt size={13} className="text-white" />
                        <span>Approve & Terbitkan Invoice</span>
                      </button>
                    ) : null}

                    {selectedDoc.status === 'Disetujui' && (
                      <button
                        onClick={async () => {
                          try {
                            const todayStr = new Date().toISOString().split('T')[0];
                            const doNum = `DO-2026-${Math.floor(1000 + Math.random() * 9000)}`;

                            await salesApi.createDeliveryOrder(selectedDoc.id, {
                              delivery_number: doNum,
                              delivery_date: todayStr,
                              notes: `Surat jalan otomatis dari Sales Order ${selectedDoc.orderNumber}`
                            });

                            onTriggerNotification(`Berhasil menerbitkan Surat Jalan ${doNum} untuk sales order ${selectedDoc.orderNumber}`);
                            onNavigate('delivery-orders');
                          } catch (err) {
                            onTriggerNotification(err instanceof Error ? err.message : 'Gagal menerbitkan Surat Jalan. Pastikan invoice sudah dibayar (minimal sebagian).');
                          }
                          setSelectedDoc(null);
                        }}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                      >
                        <Truck size={13} className="text-white" />
                        <span>Terbitkan Surat Jalan (DO)</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedDoc(null)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] transition-all cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-bold text-[11px] transition-all hover:bg-slate-800 cursor-pointer"
                  >
                    Tutup
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="hidden print:block">
        <div ref={printRef} className="print:block p-8 font-sans text-sm text-black bg-white">
          {selectedDoc && (() => {
            const docNumber = isQuotation ? selectedDoc.quoteNumber : selectedDoc.orderNumber;
            const docTitle = isQuotation ? 'QUOTATION' : 'SALES ORDER';
            const docDateLabel = isQuotation ? 'Tanggal Penawaran' : 'Tanggal Sales Order';
            const signatureTitle = isQuotation ? 'Disetujui Oleh,' : 'Dikonfirmasi Oleh,';

            return (
              <div className="max-w-[800px] mx-auto">
                <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight">CV BETON AGUNG</h1>
                    <p className="font-bold text-xs">General Contractor & Supplier Material Alam</p>
                    <p className="text-[11px] mt-1">Jl. Raya Sukomanunggal Jaya No. 12, Surabaya, Jawa Timur</p>
                  </div>
                  <div className="text-right">
                    <div className="border px-4 py-1 font-black tracking-[0.2em] text-slate-500 text-lg">{docTitle}</div>
                    <p className="font-mono font-bold mt-2 text-lg">{docNumber}</p>
                    <p className="text-sm">{docDateLabel}: {selectedDoc.date}</p>
                    {isQuotation && <p className="text-sm">Berlaku Hingga: {selectedDoc.validUntil}</p>}
                  </div>
                </div>

                <div className="border border-black rounded-md p-4 w-[45%] mb-6">
                  <p className="text-[10px] font-mono font-bold text-slate-500 tracking-widest">KEPADA YTH. (CUSTOMER)</p>
                  <p className="font-bold text-lg mt-1">{selectedDoc.customerName}</p>
                </div>

                <table className="w-full border-collapse border border-black text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-black p-2 w-10">NO</th>
                      <th className="border border-black p-2 text-left">NAMA PRODUK / PEKERJAAN</th>
                      <th className="border border-black p-2 w-20 text-right">QTY</th>
                      <th className="border border-black p-2 w-32 text-right">HARGA SATUAN</th>
                      <th className="border border-black p-2 w-32 text-right">JUMLAH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDoc.items?.map((item: any, idx: number) => (
                      <tr key={`${item.productName}-${idx}`}>
                        <td className="border border-black p-2 text-center">{idx + 1}</td>
                        <td className="border border-black p-2 font-bold">{item.productName}</td>
                        <td className="border border-black p-2 text-right font-mono">{item.quantity}</td>
                        <td className="border border-black p-2 text-right font-mono">{formatIDR(item.price)}</td>
                        <td className="border border-black p-2 text-right font-mono font-bold">{formatIDR(item.quantity * item.price)}</td>
                      </tr>
                    ))}
                    {!selectedDoc.items?.length && (
                      <tr>
                        <td className="border border-black p-4 text-center text-slate-500" colSpan={5}>Tidak ada item.</td>
                      </tr>
                    )}
                    <tr className="bg-slate-100">
                      <td colSpan={4} className="border border-black p-3 text-right font-black">TOTAL KESELURUHAN</td>
                      <td className="border border-black p-3 text-right font-black font-mono text-base">{formatIDR(selectedDoc.total)}</td>
                    </tr>
                  </tbody>
                </table>

                <p className="text-[11px] mt-6">
                  <strong>Catatan:</strong> Dokumen ini diterbitkan sebagai dasar administrasi penjualan, produksi, pengiriman, dan penagihan customer.
                </p>

                <div className="grid grid-cols-3 gap-10 mt-10 text-center text-xs">
                  <div>
                    <p>Dibuat Oleh,</p>
                    <div className="h-20"></div>
                    <p className="border-t border-black pt-2 font-bold">SALES DEPT.</p>
                    <p>CV Beton Agung</p>
                  </div>
                  <div>
                    <p>{signatureTitle}</p>
                    <div className="h-20"></div>
                    <p className="border-t border-black pt-2 font-bold">{selectedDoc.customerName}</p>
                  </div>
                  <div>
                    <p>Mengetahui,</p>
                    <div className="h-20"></div>
                    <p className="border-t border-black pt-2 font-bold">DIREKTUR UTAMA</p>
                    <p>CV Beton Agung</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 5. Create Draft Modal Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans text-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-cyan-400" />
                <h3 className="font-bold text-sm">Entri Memo {isQuotation ? 'Quotation Baru' : 'Sales Order Baru'}</h3>
              </div>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Pilih Relasi Pelanggan</label>
                {customers.length > 0 ? (
                  <SearchableSelect
                    value={custId}
                    onChange={(val) => setCustId(val)}
                    options={customers.map(c => ({ value: c.id, label: `${c.name} (${c.city})` }))}
                    placeholder="Pilih Customer..."
                  />
                ) : (
                  <SearchableSelect
                    value=""
                    onChange={() => {}}
                    options={[]}
                    placeholder="Memuat Customer..."
                    disabled
                  />
                )}
              </div>

              {!isQuotation && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Referensi Quotation (Opsional)</label>
                  <SearchableSelect
                    value={quotationId}
                    onChange={(qId) => {
                      setQuotationId(qId);
                      if (qId) {
                        const selectedQuo = quotations.find(q => q.id === qId);
                        if (selectedQuo && selectedQuo.items && selectedQuo.items.length > 0) {
                          const firstItem = selectedQuo.items[0];
                          const prod = products.find(p => p.name === firstItem.productName);
                          if (prod) {
                            setProductId(prod.id);
                          }
                          setItemQty(firstItem.quantity);
                          setItemPrice(firstItem.price);
                        }
                      }
                    }}
                    options={[
                      { value: "", label: "-- Tanpa Referensi Quotation --" },
                      ...quotations
                        .filter(q => q.customerId === custId && (q.status === 'Terkirim' || q.status === 'Draft'))
                        .map(q => ({ value: q.id, label: `${q.quoteNumber} - ${formatIDR(q.total)}` }))
                    ]}
                    placeholder="Pilih Referensi Quotation..."
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Item Produk Borongan</label>
                {products.length > 0 ? (
                  <SearchableSelect
                    value={productId}
                    onChange={(val) => {
                      setProductId(val);
                      const selProd = products.find(p => p.id === val);
                      if (selProd) {
                        setItemPrice(selProd.sellingPrice || 0);
                        setItemQty(1);
                      }
                    }}
                    options={products.map(p => ({ value: p.id, label: `${p.name} (${formatIDR(p.sellingPrice)})` }))}
                    placeholder="Pilih Produk..."
                  />
                ) : (
                  <SearchableSelect
                    value=""
                    onChange={() => {}}
                    options={[]}
                    placeholder="Memuat Produk..."
                    disabled
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Kuantitas Unit / Pcs</label>
                  <input
                    type="number"
                    required
                    value={itemQty || ''}
                    onChange={(e) => setItemQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 font-sans">Harga Satuan disepakati (Rp)</label>
                  <input
                    type="number"
                    required
                    value={itemPrice || ''}
                    onChange={(e) => setItemPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-slate-400">Total Proyeksi Kontrak</span>
                <p className="text-sm font-black text-indigo-750 font-mono mt-1">{formatIDR(itemQty * itemPrice)}</p>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2 text-xs font-bold">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">Batal</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg">Penerbitan Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
