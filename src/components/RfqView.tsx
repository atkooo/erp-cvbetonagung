/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Printer, X, FileText, ChevronDown, ChevronRight, Building2 } from '@/src/components/icons';
import { Rfq, Supplier } from '../types';
import { suppliersApi } from '../features/suppliers/api';

interface RfqViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function RfqView({ onTriggerNotification }: RfqViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedRfqId, setExpandedRfqId] = useState<string | null>(null);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [prNumber, setPrNumber] = useState('PR-2026-0601');
  const [price, setPrice] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const sups = await suppliersApi.getSuppliers();
        setSuppliers(sups);
        if (sups.length > 0) setSupplierId(sups[0].id);

        // Mock RFQs
        setRfqs([
          {
            id: 'rfq-1',
            rfqNumber: 'RFQ-2026-001',
            purchaseRequestId: 'pr-1',
            supplierId: 'sup-1',
            supplierName: 'PT Semen Indonesia',
            rfqDate: '2026-06-02',
            validUntil: '2026-06-09',
            status: 'Dikirim',
            items: [
              { id: 'item-1', productId: 'p1', productName: 'Semen Gresik 40kg', quantity: 100, quotedUnitPrice: 48000, subtotal: 4800000 },
            ]
          },
          {
            id: 'rfq-2',
            rfqNumber: 'RFQ-2026-002',
            purchaseRequestId: 'pr-2',
            supplierId: 'sup-2',
            supplierName: 'Toko Besi Maju Jaya',
            rfqDate: '2026-06-03',
            validUntil: '2026-06-10',
            status: 'Diterima',
            items: [
              { id: 'item-2', productId: 'p3', productName: 'Besi Wiremesh', quantity: 200, quotedUnitPrice: 150000, subtotal: 30000000 },
            ]
          }
        ]);
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
    const selSup = suppliers.find(s => s.id === supplierId);
    if (!selSup) return;

    const newRfq: Rfq = {
      id: `rfq-${Date.now()}`,
      rfqNumber: `RFQ-2026-${Math.floor(Math.random() * 1000)}`,
      purchaseRequestId: prNumber,
      supplierId: selSup.id,
      supplierName: selSup.name,
      rfqDate: new Date().toISOString().split('T')[0],
      validUntil: new Date().toISOString().split('T')[0],
      status: 'Dikirim',
      items: [
        { id: `item-${Date.now()}`, productId: 'p-custom', productName: 'Material PR', quantity: 1, quotedUnitPrice: price, subtotal: price }
      ]
    };

    setRfqs([newRfq, ...rfqs]);
    onTriggerNotification(`RFQ ${newRfq.rfqNumber} berhasil dikirim ke Vendor`);
    setShowAddModal(false);
  };

  const handleCreatePo = (rfqNum: string) => {
    onTriggerNotification(`Tawaran dari ${rfqNum} disetujui, siap di-generate menjadi PO.`);
  };

  const filteredRfqs = rfqs.filter((r) => {
    const matchesSearch = r.rfqNumber.toLowerCase().includes(search.toLowerCase()) || r.supplierName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-6 font-sans text-xs">
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">Request For Quotation (RFQ)</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Penawaran harga dari supplier untuk pengadaan barang</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold shadow hover:bg-slate-800 flex items-center gap-1.5">
          <Plus size={16} /><span>Kirim RFQ Baru</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari No RFQ atau Supplier..." className="w-full pl-9 pr-4 py-2 border rounded-lg" />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border">
          <Filter size={13} className="text-slate-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent py-1 outline-none text-slate-600">
            <option value="All">Semua RFQ</option>
            <option value="Dikirim">Dikirim</option>
            <option value="Diterima">Diterima (Ada Balasan)</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                <th className="p-3.5 pl-5">No RFQ</th>
                <th className="p-3.5">Vendor / Supplier</th>
                <th className="p-3.5">Referensi PR</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right pr-5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
            {filteredRfqs.map((rfq) => {
              const isExpanded = expandedRfqId === rfq.id;
              return (
                <React.Fragment key={rfq.id}>
                  <tr className="hover:bg-slate-50/40">
                    <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">
                      <button onClick={() => setExpandedRfqId(isExpanded ? null : rfq.id)} className="flex items-center gap-1.5 focus:outline-none text-left">
                        {isExpanded ? <ChevronDown size={14} className="text-cyan-500" /> : <ChevronRight size={14} className="text-slate-400" />} <span>{rfq.rfqNumber}</span>
                      </button>
                    </td>
                    <td className="p-3.5 font-bold flex items-center gap-1.5 text-slate-700"><Building2 size={14} className="text-slate-400"/> {rfq.supplierName}</td>
                    <td className="p-3.5 font-mono text-cyan-600">{rfq.purchaseRequestId}</td>
                    <td className="p-3.5 font-mono text-slate-500">{rfq.rfqDate}</td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${rfq.status === 'Diterima' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-300'}`}>{rfq.status}</span>
                    </td>
                    <td className="p-3.5 text-right pr-5">
                      {rfq.status === 'Diterima' && (
                        <button onClick={() => handleCreatePo(rfq.rfqNumber)} className="px-2 py-1 bg-slate-900 text-white rounded mr-2 text-[10px] font-bold shadow-sm">Pilih Tawaran</button>
                      )}
                      <button onClick={() => onTriggerNotification('Cetak RFQ')} className="p-1 px-2 border rounded bg-slate-50 hover:bg-slate-100 hover:border-slate-200 text-xs text-slate-650">Cetak</button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={6} className="p-4 pl-12">
                        <div className="space-y-2 max-w-lg">
                          <div className="font-bold text-[10px] text-slate-400 mb-2">PENAWARAN HARGA ITEM</div>
                          {rfq.items.map(it => (
                            <div key={it.id} className="p-2.5 border bg-white rounded flex justify-between items-center">
                              <div>
                                <span className="font-bold block">{it.productName}</span>
                                <span className="text-[10px] text-slate-500">{it.quantity} Pcs x {formatIDR(it.quotedUnitPrice)}</span>
                              </div>
                              <span className="font-mono text-slate-800 font-bold">{formatIDR(it.subtotal)}</span>
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
              <h3 className="font-bold">Kirim Permintaan Kuotasi (RFQ)</h3>
              <button onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Referensi PR</label>
                <input type="text" value={prNumber} onChange={e => setPrNumber(e.target.value)} className="w-full p-2 border rounded font-mono" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Pilih Supplier / Vendor</label>
                <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full p-2 border rounded">
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Estimasi Target Harga (Total)</label>
                <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full p-2 border rounded" required />
              </div>
              <div className="flex justify-end pt-4 border-t gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded">Batal</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded font-bold">Kirim RFQ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
