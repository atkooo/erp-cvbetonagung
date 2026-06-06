/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, Plus, Printer, HelpCircle, X, ChevronDown, ChevronRight, PackageCheck } from 'lucide-react';
import { PurchaseOrder, Supplier, Product } from '../types';
import { authStorage } from '../services/api';
import { purchasingApi } from '../features/purchasing/api';
import { suppliersApi } from '../features/suppliers/api';
import { productsApi } from '../features/products/api';
import { SkeletonTable, ErrorCard } from './Skeleton';

interface PurchaseViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function PurchaseView({
  onTriggerNotification,
}: PurchaseViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);

  // API states
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New PO States
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [pos, sups, prods] = await Promise.all([
        purchasingApi.getPurchaseOrders(),
        suppliersApi.getSuppliers(),
        productsApi.getProducts()
      ]);
      setPurchaseOrders(pos);
      setSuppliers(sups);
      setProducts(prods);

      if (sups.length > 0 && !supplierId) setSupplierId(sups[0].id);
      if (prods.length > 0 && !productId) {
        setProductId(prods[0].id);
        setPrice(prods[0].costPrice || 0); // usually we use cost price for PO
      }
    } catch (err) {
      console.error('Failed to load purchasing data', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat data pembelian';
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

  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0 || price <= 0) {
      onTriggerNotification('Gagal: Kuantitas dan harga bahan baku harus positif!');
      return;
    }

    try {
      const d = new Date();
      const todayStr = d.toISOString().split('T')[0];
      const expectedDate = new Date(d);
      expectedDate.setDate(d.getDate() + 7); // assume 7 days delivery

      await purchasingApi.createPurchaseOrder({
        supplier_id: supplierId,
        order_date: todayStr,
        expected_date: expectedDate.toISOString().split('T')[0],
        items: [
          {
            product_id: productId,
            quantity: qty,
            unit_price: price,
          }
        ]
      });
      onTriggerNotification(`Sukses menerbitkan PO via API`);
      await loadData();
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal membuat dokumen PO');
    }

    setShowAddModal(false);
  };

  const handleReceiveGoods = async (poId: string, poNum: string, items: any[]) => {
    try {
      const d = new Date();
      const todayStr = d.toISOString().split('T')[0];
      
      // Build items payload assuming full receive for simplicity
      const receiveItems = items.filter(it => it.id).map(it => ({
        id: it.id,
        received_quantity: it.quantity
      }));

      if (receiveItems.length === 0) {
        onTriggerNotification('Tidak ada item ID valid untuk konfirmasi penerimaan via API.');
        return;
      }

      await purchasingApi.receivePurchaseOrder(poId, {
        received_date: todayStr,
        items: receiveItems
      });
      
      onTriggerNotification(`Konfirmasi penerimaan stok gudang berhasil untuk PO ${poNum}`);
      await loadData();
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal konfirmasi penerimaan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual top card info */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg">
            <ShoppingCart size={20} />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-slate-800">
              Siklus Pembelian & Restock Bahan Cor (Purchase Order)
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Pantau kontrak pengadaan ke pabrik baja wiremesh, semen gresik, dan pasir lumajang super.
              <span className="ml-2 px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[9px] text-slate-500">
                API MODE
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-xs font-bold shadow hover:bg-slate-800 flex items-center gap-1.5 shrink-0"
        >
          <Plus size={16} />
          <span>Terbitkan PO Restock</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          ['PR-2026-0601', 'Permintaan Pembelian', 'Gudang mengajukan kebutuhan semen, pasir, dan wiremesh.', 'Draft'],
          ['PO-2026-05-014', 'Purchase Order', 'Admin menerbitkan pesanan resmi ke supplier.', 'Dipesan'],
          ['GRN-2026-0601', 'Penerimaan Gudang', 'Barang masuk dicek fisik sebelum stok bertambah.', 'Parsial'],
          ['AP-2026-0601', 'Hutang Supplier', 'Tagihan supplier menunggu jadwal pembayaran finance.', 'Open'],
        ].map(([code, title, desc, status]) => (
          <div key={code} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-black text-cyan-600">{code}</span>
              <span className="px-2 py-0.5 rounded border bg-slate-50 text-[9px] font-bold text-slate-500">{status}</span>
            </div>
            <h4 className="mt-2 font-bold text-slate-800">{title}</h4>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{desc}</p>
          </div>
        ))}
      </div>

      {/* Query Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari PO No atau nama supplier..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
          <Filter size={13} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-[11px] text-slate-600 bg-transparent py-1 cursor-pointer focus:outline-none"
          >
            <option value="All">Semua PO</option>
            <option value="Draft">Draft</option>
            <option value="Dipesan">Dipesan (Ordered)</option>
            <option value="Diterima Sebagian">Diterima Sebagian</option>
            <option value="Diterima Penuh">Diterima Penuh</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Main grid table */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={loadData} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                  <th className="p-3.5 pl-5">No PO.</th>
                  <th className="p-3.5">Pemasok Vendor</th>
                  <th className="p-3.5">Tanggal Surat</th>
                  <th className="p-3.5">Total Pengadaan</th>
                  <th className="p-3.5">Status Logistik</th>
                  <th className="p-3.5 pr-5 text-right">Rincian Item</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                      Tidak ditemukan data Purchase Order yang terekam.
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map((po) => {
                    const isExpanded = expandedPoId === po.id;
                    const statusColors: Record<string, string> = {
                      Draft: 'bg-slate-100 text-slate-600',
                      Dipesan: 'bg-blue-100 text-blue-700 border-blue-200',
                      'Diterima Sebagian': 'bg-amber-100 text-amber-700 border-amber-300 animate-pulse',
                      'Diterima Penuh': 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      Dibatalkan: 'bg-slate-100 text-slate-400',
                    };

                    return (
                      <React.Fragment key={po.id}>
                        <tr className="hover:bg-slate-50/40">
                          <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">
                            <button
                              onClick={() => setExpandedPoId(isExpanded ? null : po.id)}
                              className="flex items-center gap-1.5 focus:outline-none text-left"
                            >
                              {isExpanded ? <ChevronDown size={14} className="text-cyan-500" /> : <ChevronRight size={14} className="text-slate-400" />}
                              <span>{po.poNumber}</span>
                            </button>
                          </td>
                          <td className="p-3.5 font-bold text-slate-700">{po.supplierName}</td>
                          <td className="p-3.5 font-mono text-slate-500">{po.date}</td>
                          <td className="p-3.5 font-mono font-black text-slate-900">{formatIDR(po.total)}</td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors[po.status] || 'bg-slate-100'}`}>
                              {po.status}
                            </span>
                          </td>
                          <td className="p-3.5 pr-5 text-right">
                            <button
                              onClick={() => {
                                onTriggerNotification(`Mencetak draft dokumen pengadaan ${po.poNumber}`);
                              }}
                              className="p-1 px-2 border rounded bg-slate-50 hover:bg-slate-100 hover:border-slate-200 text-xs text-slate-650"
                              title="Print PO"
                            >
                              Cetak
                            </button>
                          </td>
                        </tr>

                        {/* Expandable PO items block */}
                        {isExpanded && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={6} className="p-4 pl-12 border-b border-slate-100">
                              <div className="space-y-4 max-w-xl">
                                <h5 className="font-mono text-[9px] font-bold text-slate-400 tracking-wider">KOMPONEN RESTOCK BORONGAN</h5>
                                <div className="space-y-1.5">
                                  {po.items?.map((it, idx) => (
                                    <div key={idx} className="p-2.5 bg-white border rounded-lg flex items-center justify-between text-xs">
                                      <div>
                                        <strong className="text-slate-700 block">{it.productName}</strong>
                                        <span className="text-slate-400 font-mono text-[10px]">{it.quantity} Pcs x {formatIDR(it.price)}</span>
                                      </div>
                                      <strong className="font-mono text-slate-950">{formatIDR(it.quantity * it.price)}</strong>
                                    </div>
                                  ))}
                                </div>

                                {po.status === 'Dipesan' && (
                                  <div className="pt-3 border-t flex justify-end">
                                    <button
                                      onClick={() => handleReceiveGoods(po.id, po.poNumber, po.items)}
                                      className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow transition-colors"
                                    >
                                      <PackageCheck size={11} className="stroke-[2.5]" />
                                      <span>Konfirmasi Terima Gudang</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rilis PO Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-cyan-400" />
                <h3 className="font-bold text-sm">Pemesanan PO Supplier</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Vendor Supplier</label>
                {suppliers.length > 0 ? (
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded bg-white"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                    ))}
                  </select>
                ) : (
                  <select disabled className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-100 text-slate-400">
                    <option>Memuat Supplier...</option>
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Komponen Produk Penunjang</label>
                {products.length > 0 ? (
                  <select
                    value={productId}
                    onChange={(e) => {
                      setProductId(e.target.value);
                      const prod = products.find(p => p.id === e.target.value);
                      if (prod) {
                        setPrice(prod.costPrice || 0);
                        setQty(1);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded bg-white"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (HPP: {formatIDR(p.costPrice || 0)})</option>
                    ))}
                  </select>
                ) : (
                  <select disabled className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-100 text-slate-400">
                    <option>Memuat Item...</option>
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Kuantitas Pembelian</label>
                  <input
                    type="number"
                    required
                    value={qty || ''}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    required
                    value={price || ''}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border rounded-xl">
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Total Borongan PO</span>
                <p className="text-sm font-black font-mono text-cyan-600 mt-1">{formatIDR(qty * price)}</p>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2 text-xs font-bold">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-2 border rounded-lg text-slate-650">Batal</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 border text-white rounded-lg">Rilis Surat PO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
