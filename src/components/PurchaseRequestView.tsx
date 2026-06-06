/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, Plus, Printer, X, ChevronDown, ChevronRight, Check } from '@/src/components/icons';
import { PurchaseRequest, Product } from '../types';
import { productsApi } from '../features/products/api';
import ProductPicker from './ProductPicker';

interface PurchaseRequestViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function PurchaseRequestView({ onTriggerNotification }: PurchaseRequestViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedPrId, setExpandedPrId] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);

  // Form State
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [department, setDepartment] = useState('Gudang Utama');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const prods = await productsApi.getProducts();
        setProducts(prods);


        setPurchaseRequests([]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selProd = products.find(p => p.id === productId);
    if (!selProd) return;

    const newPr: PurchaseRequest = {
      id: `pr-${Date.now()}`,
      prNumber: `PR-2026-${Math.floor(Math.random() * 10000)}`,
      requesterId: 'usr-self',
      requesterName: 'Anda',
      requestDate: new Date().toISOString().split('T')[0],
      requiredDate: new Date().toISOString().split('T')[0],
      department,
      status: 'Draft',
      items: [
        { id: `item-${Date.now()}`, productId: selProd.id, productName: selProd.name, quantity: qty, status: 'Draft' }
      ]
    };

    setPurchaseRequests([newPr, ...purchaseRequests]);
    onTriggerNotification('Purchase Request berhasil diajukan');
    setShowAddModal(false);
  };

  const handleApprove = (id: string) => {
    setPurchaseRequests(prev => prev.map(pr => pr.id === id ? { ...pr, status: 'Disetujui' } : pr));
    onTriggerNotification('Purchase Request disetujui, siap untuk RFQ.');
  };

  const filteredPRs = purchaseRequests.filter((pr) => {
    const matchesSearch = pr.prNumber.toLowerCase().includes(search.toLowerCase()) || pr.department.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || pr.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans text-xs">
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg">
            <ShoppingCart size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">Purchase Request (PR)</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Pengajuan kebutuhan logistik dari divisi gudang atau produksi</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold shadow hover:bg-slate-800 flex items-center gap-1.5">
          <Plus size={16} /><span>Ajukan PR Baru</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari No PR atau Divisi..." className="w-full pl-9 pr-4 py-2 border rounded-lg" />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border">
          <Filter size={13} className="text-slate-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent py-1 outline-none text-slate-600">
            <option value="All">Semua PR</option>
            <option value="Draft">Draft</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                <th className="p-3.5 pl-5">No PR</th>
                <th className="p-3.5">Pemohon</th>
                <th className="p-3.5">Divisi</th>
                <th className="p-3.5">Tanggal Butuh</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right pr-5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
            {filteredPRs.map((pr) => {
              const isExpanded = expandedPrId === pr.id;
              return (
                <React.Fragment key={pr.id}>
                  <tr className="hover:bg-slate-50/40">
                    <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">
                      <button onClick={() => setExpandedPrId(isExpanded ? null : pr.id)} className="flex items-center gap-1.5 focus:outline-none text-left">
                        {isExpanded ? <ChevronDown size={14} className="text-cyan-500" /> : <ChevronRight size={14} className="text-slate-400" />} <span>{pr.prNumber}</span>
                      </button>
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">{pr.requesterName}</td>
                    <td className="p-3.5 font-bold">{pr.department}</td>
                    <td className="p-3.5 font-mono text-slate-500">{pr.requiredDate}</td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${pr.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>{pr.status}</span>
                    </td>
                    <td className="p-3.5 text-right pr-5">
                      {pr.status === 'Draft' && (
                        <button onClick={() => handleApprove(pr.id)} className="px-2 py-1 bg-emerald-600 text-white rounded mr-2 text-[10px] font-bold shadow-sm">Approve</button>
                      )}
                      <button onClick={() => onTriggerNotification('Cetak PR')} className="p-1 px-2 border rounded bg-slate-50 hover:bg-slate-100 hover:border-slate-200 text-xs text-slate-650">Cetak</button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={6} className="p-4 pl-12">
                        <div className="space-y-2">
                          <div className="font-bold text-[10px] text-slate-400 mb-2">RINCIAN KEBUTUHAN BARANG</div>
                          {pr.items.map(it => (
                            <div key={it.id} className="p-2 border bg-white rounded flex justify-between">
                              <span className="font-bold">{it.productName}</span>
                              <span className="font-mono text-cyan-600">{it.quantity} Pcs</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
            <div className="p-4 bg-slate-900 text-white flex justify-between">
              <h3 className="font-bold">Ajukan Purchase Request</h3>
              <button onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Pilih Material</label>
                <ProductPicker 
                  value={productId}
                  onChange={(product) => setProductId(product.id)}
                  categoryFilter="Bahan Baku" // Contoh jika ingin memfilter hanya bahan baku, hapus prop ini untuk semua produk
                  placeholder="Pilih Material untuk di-request..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Kuantitas</label>
                  <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full p-2 border rounded" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Divisi Pemohon</label>
                  <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full p-2 border rounded">
                    <option value="Gudang Utama">Gudang Utama</option>
                    <option value="Produksi">Produksi</option>
                    <option value="Proyek A">Proyek A</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded">Batal</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded font-bold">Ajukan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
