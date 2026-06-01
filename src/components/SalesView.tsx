/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  Calendar
} from 'lucide-react';
import { Quotation, SalesOrder, ViewType } from '../types';

interface SalesViewProps {
  type: 'quotation' | 'sales-order';
  quotations: Quotation[];
  salesOrders: SalesOrder[];
  onAddQuotation: (q: Quotation) => void;
  onAddSalesOrder: (so: SalesOrder) => void;
  onTriggerNotification: (message: string) => void;
  onNavigate: (view: ViewType) => void;
}

export default function SalesView({
  type,
  quotations,
  salesOrders,
  onAddQuotation,
  onAddSalesOrder,
  onTriggerNotification,
  onNavigate,
}: SalesViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedDoc, setSelectedDoc] = useState<any>(null); // For detail view drawer
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states to create a quick document
  const [custName, setCustName] = useState('Yayasan Al-Ikhlas');
  const [itemName, setItemName] = useState('Roster Beton Minimalis Motif Kotak Silang');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(15000);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Filter logic
  const isQuotation = type === 'quotation';
  const dataList = isQuotation ? quotations : salesOrders;

  const filteredDocs = dataList.filter((doc: any) => {
    const docNum = isQuotation ? doc.quoteNumber : doc.orderNumber;
    const matchesSearch =
      docNum.toLowerCase().includes(search.toLowerCase()) ||
      doc.customerName.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle mock create document
  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemQty <= 0 || itemPrice <= 0) {
      onTriggerNotification('Gagal: Kuantitas dan harga produk harus positif!');
      return;
    }

    const totalDoc = itemQty * itemPrice;
    const d = new Date();
    const todayStr = d.toISOString().split('T')[0];

    if (isQuotation) {
      const nextQuoteNum = `Q-2026-05-00${quotations.length + 4}`;
      const newQuote: Quotation = {
        id: `q${quotations.length + 4}`,
        quoteNumber: nextQuoteNum,
        customerName: custName,
        date: todayStr,
        validUntil: '2026-06-30',
        total: totalDoc,
        status: 'Draft',
        items: [{ productName: itemName, quantity: itemQty, price: itemPrice }],
      };
      onAddQuotation(newQuote);
      onTriggerNotification(`Sukses menerbitkan Draft Quotation ${nextQuoteNum}`);
    } else {
      const nextSONum = `SO-2026-05-0${salesOrders.length + 91}`;
      const newSO: SalesOrder = {
        id: `so${salesOrders.length + 91}`,
        orderNumber: nextSONum,
        customerName: custName,
        date: todayStr,
        total: totalDoc,
        status: 'Draft',
        items: [{ productName: itemName, quantity: itemQty, price: itemPrice }],
      };
      onAddSalesOrder(newSO);
      onTriggerNotification(`Sukses menerbitkan Draft Sales Order ${nextSONum}`);
    }

    setShowAddForm(false);
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
              {isQuotation ? 'Kelola pipeline negosiasi biaya ornamen & kubah ke panitia pembangunan' : 'Kontrol pengiriman produksi workshop setelah DP tervalidasi terekam'}
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
                <option value="Selesai">Selesai</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* 3. Document Tables */}
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
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
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
                  }}
                  className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-all hover:bg-slate-100 flex items-center justify-center gap-1.5"
                >
                  <Printer size={13} />
                  <span>Cetak PDF</span>
                </button>

                {isQuotation && selectedDoc.status === 'Terkirim' ? (
                  <button
                    onClick={() => {
                      onNavigate('sales-orders');
                      onTriggerNotification(`Sukses mengonversi Quotation ${selectedDoc.quoteNumber} menjadi Sales Order (SO) terekam`);
                      setSelectedDoc(null);
                    }}
                    className="w-full py-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 hover:opacity-90 text-slate-950 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5"
                  >
                    <FileCheck size={13} className="text-slate-950" />
                    <span>Approve to SO</span>
                  </button>
                ) : !isQuotation && selectedDoc.status === 'Draft' ? (
                  <button
                    onClick={() => {
                      onNavigate('invoices');
                      onTriggerNotification(`Berhasil menerbitkan Draft Invoice untuk sales order ${selectedDoc.orderNumber}`);
                      setSelectedDoc(null);
                    }}
                    className="w-full py-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 hover:opacity-90 text-slate-950 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Receipt size={13} className="text-slate-950" />
                    <span>Terbitkan Invoice</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-bold text-[11px] transition-all hover:bg-slate-800"
                  >
                    Selesai
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                <select
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:bg-white bg-slate-50 rounded"
                >
                  <option value="Yayasan Al-Ikhlas">Yayasan Al-Ikhlas (Sidoarjo)</option>
                  <option value="Takmir Masjid Baiturrahman">Takmir Masjid Baiturrahman (Mojokerto)</option>
                  <option value="PT Maju Konstruksi Utama">PT Maju Konstruksi Utama (Gresik)</option>
                  <option value="Bapak Hermawan">Bapak Hermawan (Malang)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Item Produk Borongan</label>
                <select
                  value={itemName}
                  onChange={(e) => {
                    setItemName(e.target.value);
                    if (e.target.value.includes('Kubah')) {
                      setItemPrice(75000000);
                      setItemQty(1);
                    } else if (e.target.value.includes('Lisplang')) {
                      setItemPrice(75000);
                      setItemQty(100);
                    } else {
                      setItemPrice(15000);
                      setItemQty(500);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded"
                >
                  <option value="Kubah Masjid GRC Motif Madinah D-6m">Kubah Masjid GRC Motif Madinah D-6m (Rp 75,000,000)</option>
                  <option value="Lisplang Beton Klasik Lebar 30cm">Lisplang Beton Klasik Lebar 30cm (Rp 75,000)</option>
                  <option value="Roster Beton Minimalis Motif Kotak Silang">Roster Beton Minimalis Motif Kotak (Rp 15,000)</option>
                  <option value="Ornamen Mihrab Kaligrafi GRC">Ornamen Mihrab Kaligrafi GRC (Rp 14,000,000)</option>
                </select>
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
