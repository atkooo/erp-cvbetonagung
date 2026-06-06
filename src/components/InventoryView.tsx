/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  X
} from '@/src/components/icons';
import { Product, StockMovement } from '../types';
import { authStorage } from '../services/api';
import { productsApi } from '../features/products/api';
import { inventoryApi } from '../features/inventory/api';
import { SkeletonTable, ErrorCard } from './Skeleton';

interface InventoryViewProps {
  onTriggerNotification: (message: string) => void;
  initialTab?: 'stok' | 'masuk' | 'keluar' | 'riwayat';
}

export default function InventoryView({
  onTriggerNotification,
  initialTab = 'stok',
}: InventoryViewProps) {
  const activeTab = initialTab;

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState('All');

  // Modal forms
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [showOutwardModal, setShowOutwardModal] = useState(false);

  // Form states - Barang Masuk
  const [inSku, setInSku] = useState('');
  const [inQty, setInQty] = useState(0);
  const [inDoc, setInDoc] = useState('');
  const [inHandler, setInHandler] = useState('Gudang - Wahyu');
  const [inNotes, setInNotes] = useState('');

  // Form states - Barang Keluar
  const [outSku, setOutSku] = useState('');
  const [outQty, setOutQty] = useState(0);
  const [outDoc, setOutDoc] = useState('');
  const [outHandler, setOutHandler] = useState('Admin Gudang');
  const [outNotes, setOutNotes] = useState('');

  const categories = ['Kubah Masjid', 'Lisplang', 'Roster', 'Ornamen Beton', 'Tanaman', 'Produk Custom'];

  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [prods, stocks, movs] = await Promise.all([
        productsApi.getProducts(),
        inventoryApi.getProductStocks(),
        inventoryApi.getStockMovements(),
      ]);

      const combinedProds = prods.map(p => {
        const stockData = stocks.find(s => s.product?.sku === p.sku);
        return {
          ...p,
          stock: stockData ? Number(stockData.quantity) : 0,
          location: stockData?.location?.name || 'Gudang Utama',
        };
      });

      setProducts(combinedProds);
      setStockMovements(movs);
      
      if (combinedProds.length > 0) {
        setInSku(prev => prev || combinedProds[0].sku);
        setOutSku(prev => prev || combinedProds[0].sku);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal memuat data inventory');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  // Submit Incoming Goods
  const handleInwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inSku || inQty <= 0 || !inDoc) {
      onTriggerNotification('Gagal: Kolom SKU, Jumlah, dan Dokumen Referensi harus diisi!');
      return;
    }

    const matchedProd = products.find(p => p.sku === inSku);
    if (!matchedProd) return;

    try {
      await inventoryApi.receiveGoods({
        product_id: matchedProd.id,
        quantity: inQty,
        location_id: '9f2a95e6-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // default generic ID
        reference_type: 'PO',
        reference_number: inDoc,
        notes: inNotes,
      });
      onTriggerNotification(`Sukses menerima ${inQty} ${matchedProd.unit} untuk SKU [${inSku}] via API`);
      await loadData();
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal menerima barang');
    }

    // Reset Form
    setInQty(0);
    setInDoc('');
    setInNotes('');
    setShowInwardModal(false);
  };

  // Submit Outgoing Goods
  const handleOutwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outSku || outQty <= 0 || !outDoc) {
      onTriggerNotification('Gagal: Kolom SKU, Jumlah, dan Dokumen Referensi harus diisi!');
      return;
    }

    const matchedProd = products.find(p => p.sku === outSku);
    if (!matchedProd) return;

    if (matchedProd.stock < outQty) {
      onTriggerNotification(`Gagal: Stok tidak mencukupi! Stok saat ini: ${matchedProd.stock} ${matchedProd.unit}`);
      return;
    }

    try {
      await inventoryApi.issueGoods({
        product_id: matchedProd.id,
        quantity: outQty,
        location_id: '9f2a95e6-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // default generic ID
        reference_type: 'SO',
        reference_number: outDoc,
        notes: outNotes,
      });
      onTriggerNotification(`Sukses mengeluarkan ${outQty} ${matchedProd.unit} untuk SKU [${outSku}] via API`);
      await loadData();
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal mengeluarkan barang');
    }

    // Reset Form
    setOutQty(0);
    setOutDoc('');
    setOutNotes('');
    setShowOutwardModal(false);
  };

  return (
    <div className="space-y-6">
      {/* SEARCH AND ACTION SUB BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan SKU, Nama Produk, atau dokumen..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-sans text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>

          {activeTab === 'stok' && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 shrink-0">
              <Filter size={13} className="text-slate-400" />
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                className="text-[11px] text-slate-600 bg-transparent py-1 focus:outline-none cursor-pointer font-sans"
              >
                <option value="All">Semua Kondisi</option>
                <option value="Aman">Kondisi: Aman</option>
                <option value="Menipis">Kondisi: Menipis</option>
                <option value="Habis">Kondisi: Kosong</option>
              </select>
            </div>
          )}
        </div>

        {/* Dynamic primary action based on active tab */}
        {activeTab === 'masuk' && (
          <button
            onClick={() => setShowInwardModal(true)}
            className="px-4 py-2 bg-gradient-to-br from-cyan-500 to-blue-600 hover:opacity-90 text-slate-950 hover:text-slate-950 rounded-lg text-xs font-bold transition-all shadow flex items-center gap-2 shrink-0"
          >
            <Plus size={16} className="text-slate-950" />
            <span>Penerimaan Bahan Baru</span>
          </button>
        )}
        {activeTab === 'keluar' && (
          <button
            onClick={() => setShowOutwardModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-2 shrink-0"
          >
            <Plus size={16} />
            <span>Pengeluaran Logistik baru</span>
          </button>
        )}
        {activeTab === 'stok' && (
          <div className="text-[10px] font-mono text-slate-400 bg-slate-100 p-2 rounded-lg border border-slate-200 text-center truncate max-w-[250px]">
            API Mode | Total Katalog: <strong className="text-slate-700">{products.length} SKU</strong>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      {/* CONTENT SWITCHER CARD */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={8} />
      ) : errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={loadData} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* TAB 1: STOK PRODUK */}
          {activeTab === 'stok' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                    <th className="p-3.5 pl-5">SKU No.</th>
                    <th className="p-3.5">Nama Item Produk</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5">Lokasi Rak</th>
                    <th className="p-3.5 text-center">Stok Saat Ini</th>
                    <th className="p-3.5 text-center">Minimum Stok</th>
                    <th className="p-3.5">Status Alaram</th>
                    <th className="p-3.5 pr-5 text-right">Aksi Manual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products
                    .filter((p) => {
                      const matchSrc = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
                      const matchStt = stockStatusFilter === 'All' || p.status === stockStatusFilter;
                      return matchSrc && matchStt;
                    })
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/40">
                        <td className="p-3.5 pl-5 font-mono font-bold text-slate-700">{p.sku}</td>
                        <td className="p-3.5 font-bold text-slate-800">{p.name}</td>
                        <td className="p-3.5 text-slate-500 font-semibold">{p.category}</td>
                        <td className="p-3.5 text-slate-500 font-medium">{p.location}</td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-900 bg-slate-50/10">
                          {p.stock} <span className="font-normal text-slate-400 text-[10px]">{p.unit}</span>
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-400">{p.minStock} {p.unit}</td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'Aman' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            p.status === 'Menipis' ? 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold' :
                            'bg-red-50 text-red-700 border border-red-200 font-bold'
                          }`}>
                            {p.status === 'Aman' && <CheckCircle size={10} />}
                            {p.status === 'Menipis' && <AlertCircle size={10} />}
                            {p.status === 'Habis' && <AlertCircle size={10} />}
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          <button
                            onClick={() => {
                              onTriggerNotification('Koreksi stok manual dinonaktifkan. Silakan gunakan modul Stock Opname.');
                            }}
                            className="px-2 py-1 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 bg-slate-50 rounded text-[10px]"
                          >
                            Koreksi
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: BARANG MASUK */}
          {activeTab === 'masuk' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                    <th className="p-3.5 pl-5">No Transaksi</th>
                    <th className="p-3.5">Tanggal Masuk</th>
                    <th className="p-3.5">No Referensi / PO</th>
                    <th className="p-3.5">SKU No.</th>
                    <th className="p-3.5">Deskripsi Barang</th>
                    <th className="p-3.5 text-center">Jumlah Masuk</th>
                    <th className="p-3.5">Petugas Gudang</th>
                    <th className="p-3.5 pr-5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockMovements
                    .filter(m => m.type === 'Masuk' && (m.productName.toLowerCase().includes(search.toLowerCase()) || m.sku.toLowerCase().includes(search.toLowerCase()) || m.referenceDoc.toLowerCase().includes(search.toLowerCase())))
                    .map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/40">
                        <td className="p-3.5 pl-5 font-mono text-slate-400">{m.id}</td>
                        <td className="p-3.5 font-mono text-slate-600">{m.date}</td>
                        <td className="p-3.5 font-mono font-bold text-cyan-600">{m.referenceDoc}</td>
                        <td className="p-3.5 font-mono font-semibold text-slate-700">{m.sku}</td>
                        <td className="p-3.5 font-bold text-slate-800">{m.productName}</td>
                        <td className="p-3.5 text-center font-semibold text-emerald-600 font-mono">
                          +{m.quantity}
                        </td>
                        <td className="p-3.5 text-slate-600 flex items-center gap-1.5 pt-4">
                          <User size={12} className="text-slate-400" />
                          <span>{m.handler}</span>
                        </td>
                        <td className="p-3.5 pr-5 text-slate-500 italic max-w-[150px] truncate" title={m.notes}>{m.notes}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: BARANG KELUAR */}
          {activeTab === 'keluar' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                    <th className="p-3.5 pl-5">No Transaksi</th>
                    <th className="p-3.5">Tanggal Keluar</th>
                    <th className="p-3.5">Referensi SO No</th>
                    <th className="p-3.5">SKU No.</th>
                    <th className="p-3.5">Deskripsi Barang</th>
                    <th className="p-3.5 text-center">Jumlah Keluar</th>
                    <th className="p-3.5">Kurir / Handler</th>
                    <th className="p-3.5 pr-5">Tujuan Distribusi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockMovements
                    .filter(m => m.type === 'Keluar' && (m.productName.toLowerCase().includes(search.toLowerCase()) || m.sku.toLowerCase().includes(search.toLowerCase()) || m.referenceDoc.toLowerCase().includes(search.toLowerCase())))
                    .map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/40">
                        <td className="p-3.5 pl-5 font-mono text-slate-400">{m.id}</td>
                        <td className="p-3.5 font-mono text-slate-600">{m.date}</td>
                        <td className="p-3.5 font-mono font-bold text-indigo-600">{m.referenceDoc}</td>
                        <td className="p-3.5 font-mono font-semibold text-slate-700">{m.sku}</td>
                        <td className="p-3.5 font-bold text-slate-800">{m.productName}</td>
                        <td className="p-3.5 text-center font-semibold text-rose-600 font-mono">
                          -{m.quantity}
                        </td>
                        <td className="p-3.5 text-slate-600 flex items-center gap-1.5 pt-4">
                          <User size={12} className="text-slate-400" />
                          <span>{m.handler}</span>
                        </td>
                        <td className="p-3.5 pr-5 text-slate-500 max-w-[150px] truncate" title={m.notes}>{m.notes}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: RIWAYAT PERGERAKAN STOK */}
          {activeTab === 'riwayat' && (
            <div className="p-6">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Clock size={16} className="text-cyan-500" />
                <span>Timeline Log Mutasi Fisik Sejarah Gudang</span>
              </h4>

              <div className="relative border-l border-slate-200 pl-6 ml-3 space-y-6">
                {stockMovements
                  .filter(m => m.productName.toLowerCase().includes(search.toLowerCase()) || m.sku.toLowerCase().includes(search.toLowerCase()))
                  .map((m, idx) => (
                    <div key={idx} className="relative text-xs">
                      {/* Circle indicators */}
                      <span className={`absolute -left-[30px] top-0 p-1 rounded-full text-white ${
                        m.type === 'Masuk' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}>
                        {m.type === 'Masuk' ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                      </span>

                      {/* Timeline box layout */}
                      <div className="bg-slate-50 hover:bg-slate-100 p-3.5 rounded-xl border border-slate-200 max-w-2xl transition-colors">
                        <div className="flex md:items-center justify-between flex-col md:flex-row gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] bg-slate-200/60 font-black text-slate-700 px-1.5 py-0.5 rounded">
                              {m.sku}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                              m.type === 'Masuk' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              MUTASI {m.type.toUpperCase()}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">{m.date}</span>
                        </div>

                        <h5 className="font-bold text-slate-800 mt-2">{m.productName}</h5>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Kuantitas: <strong className="text-slate-700">{m.quantity} Pcs / Unit</strong> | Dokumen: <strong className="text-cyan-600 font-mono">{m.referenceDoc}</strong>
                        </p>
                        
                        {m.notes && (
                          <div className="mt-2.5 pt-1.5 border-t border-slate-200/50 text-[10px] text-slate-400 italic">
                            Catatan: {m.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL BARANG MASUK */}
      {showInwardModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownCircle size={18} className="text-emerald-400" />
                <h3 className="font-sans font-bold text-sm">Form Terima Barang Masuk (Inward)</h3>
              </div>
              <button onClick={() => setShowInwardModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInwardSubmit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Pilih Item SKU</label>
                <select
                  value={inSku}
                  onChange={(e) => setInSku(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg"
                >
                  {products.map((p, idx) => (
                    <option key={idx} value={p.sku}>{p.sku} | {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Kuantitas Masuk</label>
                  <input
                    type="number"
                    required
                    value={inQty || ''}
                    onChange={(e) => setInQty(Number(e.target.value))}
                    placeholder="Contoh: 150"
                    className="w-full px-3 py-2 border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Referensi PO / Surat Jalan</label>
                  <input
                    type="text"
                    required
                    value={inDoc}
                    onChange={(e) => setInDoc(e.target.value)}
                    placeholder="Contoh: PO-2026-05-120"
                    className="w-full px-3 py-2 border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Petugas yang Memverifikasi</label>
                <input
                  type="text"
                  required
                  value={inHandler}
                  onChange={(e) => setInHandler(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Catatan Penerimaan Gudang</label>
                <textarea
                  rows={2}
                  value={inNotes}
                  onChange={(e) => setInNotes(e.target.value)}
                  placeholder="Kondisi barang prima, lolos QC mold, diletakkan di rak barat."
                  className="w-full px-3 py-2 border border-slate-200 resize-none"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowInwardModal(false)} className="px-3 py-2 border rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg">Konfirmasi Masuk</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BARANG KELUAR */}
      {showOutwardModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpCircle size={18} className="text-rose-400" />
                <h3 className="font-sans font-bold text-sm">Form Pengeluaran Logistik Gudang (Outward)</h3>
              </div>
              <button onClick={() => setShowOutwardModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOutwardSubmit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Pilih Item SKU</label>
                <select
                  value={outSku}
                  onChange={(e) => setOutSku(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg"
                >
                  {products.map((p, idx) => (
                    <option key={idx} value={p.sku}>{p.sku} | {p.name} (Sisa: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Kuantitas Keluar</label>
                  <input
                    type="number"
                    required
                    value={outQty || ''}
                    onChange={(e) => setOutQty(Number(e.target.value))}
                    placeholder="Contoh: 50"
                    className="w-full px-3 py-2 border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Referensi SO / Surat Jalan Keluar</label>
                  <input
                    type="text"
                    required
                    value={outDoc}
                    onChange={(e) => setOutDoc(e.target.value)}
                    placeholder="Contoh: SO-2026-05-090"
                    className="w-full px-3 py-2 border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Driver / Kurir Pengantar</label>
                <input
                  type="text"
                  required
                  value={outHandler}
                  onChange={(e) => setOutHandler(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Tujuan Pengiriman / Alamat Proyek</label>
                <textarea
                  rows={2}
                  value={outNotes}
                  onChange={(e) => setOutNotes(e.target.value)}
                  placeholder="Kirim ke lokasi Masjid Al-Ikhlas Sidoarjo menggunakan Truk Colt Diesel"
                  className="w-full px-3 py-2 border border-slate-200 resize-none"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowOutwardModal(false)} className="px-3 py-2 border rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg">Konfirmasi Keluar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
