/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  RotateCcw, Plus, Search, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Truck, Eye, Trash2, X
} from 'lucide-react';
import Swal from 'sweetalert2';
import { purchasingApi } from '../features/purchasing/api';
import { Return, ReturnItem, CreateReturnDto } from '../features/purchasing/types';
import { productsApi } from '../features/products/api';
import { Product } from '../types';
import { customersApi } from '../features/customers/api';
import { suppliersApi } from '../features/suppliers/api';
import { salesApi } from '../features/sales/api';
import { Supplier, Customer, SalesOrder, PurchaseOrder } from '../types';

interface ReturnsViewProps {
  onTriggerNotification: (message: string) => void;
}

const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const Header = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <Panel className="p-5">
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg">{icon}</div>
      <div>
        <h3 className="font-sans font-bold text-sm text-slate-800">{title}</h3>
        <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
      </div>
    </div>
  </Panel>
);

const StatusPill = ({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'cyan' | 'amber' | 'emerald' | 'rose' | 'indigo' }) => {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${tones[tone]}`}>
      {children}
    </span>
  );
};

export default function ReturnsView({ onTriggerNotification }: ReturnsViewProps) {
  const [returns, setReturns] = useState<Return[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'supplier'>('all');

  // Modals
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [type, setType] = useState<'customer' | 'supplier'>('customer');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [selectedRefId, setSelectedRefId] = useState('');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<{ product_id: string; quantity: number; notes: string }[]>([]);

  useEffect(() => {
    fetchReturns();
    loadMasterData();
  }, []);

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const data = await purchasingApi.getReturns();
      setReturns(data);
    } catch (error) {
      console.error('Error fetching returns:', error);
      onTriggerNotification('Gagal memuat daftar retur barang.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMasterData = async () => {
    try {
      const [prods, custsRes, supps, sos, pos] = await Promise.all([
        productsApi.getProducts(),
        customersApi.listCustomers(),
        suppliersApi.getSuppliers(),
        salesApi.getSalesOrders(),
        purchasingApi.getPurchaseOrders()
      ]);
      setProducts(prods);
      setCustomers(custsRes.customers);
      setSuppliers(supps);
      setSalesOrders(sos);
      setPurchaseOrders(pos);
    } catch (error) {
      console.error('Error loading master data for returns:', error);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const statusLabels: Record<string, string> = {
      approved: 'Setujui & Restock',
      rejected: 'Tolak',
      supplier_claim: 'Klaim Supplier'
    };

    const result = await Swal.fire({
      title: 'Ubah Status QC?',
      text: `Apakah Anda yakin ingin mengubah status retur menjadi "${statusLabels[status]}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Ubah',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await purchasingApi.updateReturnQcStatus(id, status);
        Swal.fire('Sukses', 'Status QC berhasil diperbarui.', 'success');
        onTriggerNotification(`Status retur diubah menjadi ${statusLabels[status]}.`);
        setSelectedReturn(null);
        fetchReturns();
      } catch (error) {
        console.error('Error updating return status:', error);
        Swal.fire('Gagal', 'Terjadi kesalahan saat memproses status QC.', 'error');
      }
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId) {
      Swal.fire('Error', 'Silakan pilih Pelanggan/Pemasok.', 'error');
      return;
    }
    if (items.length === 0) {
      Swal.fire('Error', 'Silakan tambah minimal satu item barang.', 'error');
      return;
    }
    if (items.some(item => !item.product_id || item.quantity <= 0)) {
      Swal.fire('Error', 'Silakan isi produk dan kuantitas dengan benar.', 'error');
      return;
    }

    const payload: CreateReturnDto = {
      type,
      customer_id: type === 'customer' ? selectedPartnerId : null,
      supplier_id: type === 'supplier' ? selectedPartnerId : null,
      sales_order_id: type === 'customer' ? (selectedRefId || null) : null,
      purchase_order_id: type === 'supplier' ? (selectedRefId || null) : null,
      reason,
      qc_status: 'pending_qc',
      items: items.map(i => ({
        product_id: i.product_id,
        quantity: Number(i.quantity),
        notes: i.notes || null
      }))
    };

    try {
      await purchasingApi.createReturn(payload);
      Swal.fire('Sukses', 'Transaksi retur berhasil dibuat.', 'success');
      onTriggerNotification(`Retur barang baru berhasil dibuat.`);
      setShowCreateModal(false);
      resetForm();
      fetchReturns();
    } catch (error) {
      console.error('Error creating return:', error);
      Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan transaksi retur.', 'error');
    }
  };

  const resetForm = () => {
    setSelectedPartnerId('');
    setSelectedRefId('');
    setReason('');
    setItems([]);
  };

  const handleAddItem = () => {
    setItems([...items, { product_id: '', quantity: 1, notes: '' }]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setItems(newItems);
  };

  // Filter & Search
  const filteredReturns = returns.filter(ret => {
    const matchesSearch = 
      ret.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.reason.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesType = filterType === 'all' || ret.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getQcStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_qc': return 'Menunggu QC';
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      case 'supplier_claim': return 'Klaim Supplier';
      default: return status;
    }
  };

  const getQcStatusTone = (status: string) => {
    switch (status) {
      case 'pending_qc': return 'amber';
      case 'approved': return 'emerald';
      case 'rejected': return 'rose';
      case 'supplier_claim': return 'indigo';
      default: return 'slate';
    }
  };

  // Filtering dependent dropdown lists
  const filteredSalesOrders = salesOrders.filter(so => so.customerName === customers.find(c => c.id === selectedPartnerId)?.name);
  const filteredPurchaseOrders = purchaseOrders.filter(po => po.supplierName === suppliers.find(s => s.id === selectedPartnerId)?.name);

  return (
    <div className="space-y-6 text-xs font-sans">
      <Header
        icon={<RotateCcw size={20} />}
        title="Retur Barang (Customer & Supplier)"
        desc="Pusat pengelolaan retur barang rusak/cacat dari pelanggan atau pengembalian klaim ke pihak supplier."
      />

      {/* Control Panel */}
      <Panel className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 border border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full md:w-60">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Cari retur..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:border-cyan-500 text-xs bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            {[
              ['all', 'Semua'],
              ['customer', 'Retur Customer'],
              ['supplier', 'Retur Supplier'],
            ].map(([t, label]) => (
              <button
                key={t}
                onClick={() => setFilterType(t as any)}
                className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                  filterType === t
                    ? 'bg-slate-900 text-white border-slate-950'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReturns}
            className="flex items-center gap-1.5 px-3 py-2 border bg-white hover:bg-slate-50 rounded-lg font-bold text-slate-600 transition"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
          
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition"
          >
            <Plus size={14} />
            <span>Buat Retur Baru</span>
          </button>
        </div>
      </Panel>

      {/* Table Panel */}
      <Panel className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="animate-spin text-slate-400" size={24} />
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <AlertTriangle size={24} className="mx-auto mb-2 text-slate-300" />
            <p>Tidak ada data retur barang.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                  <th className="p-3.5 pl-5">No Retur</th>
                  <th className="p-3.5">Jenis</th>
                  <th className="p-3.5">Nama Partner</th>
                  <th className="p-3.5">Referensi SO/PO</th>
                  <th className="p-3.5">Alasan Retur</th>
                  <th className="p-3.5">Status QC</th>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 pl-5 font-mono text-cyan-600 font-bold">{ret.returnNumber}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ret.type === 'customer' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {ret.type === 'customer' ? 'Customer' : 'Supplier'}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">{ret.partnerName}</td>
                    <td className="p-3.5 font-mono text-slate-500">{ret.referenceNumber}</td>
                    <td className="p-3.5 text-slate-600 font-medium">{ret.reason}</td>
                    <td className="p-3.5">
                      <StatusPill tone={getQcStatusTone(ret.qcStatus)}>
                        {getQcStatusLabel(ret.qcStatus)}
                      </StatusPill>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{ret.createdAt}</td>
                    <td className="p-3.5 pr-5 text-right">
                      <button
                        onClick={() => setSelectedReturn(ret)}
                        className="px-2.5 py-1.5 border rounded-lg bg-slate-50 hover:bg-slate-100 text-[10px] font-bold text-slate-600 ml-auto transition flex items-center gap-1"
                      >
                        <Eye size={12} />
                        <span>QC Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Modal: View & QC Details */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Detail Quality Control</span>
                <h4 className="font-bold text-slate-800 text-xs">Transaksi Retur {selectedReturn.returnNumber}</h4>
              </div>
              <button onClick={() => setSelectedReturn(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Partner Details info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border">
                <div>
                  <span className="text-[10px] text-slate-400 block">Jenis Retur</span>
                  <span className="font-bold text-slate-700 capitalize">{selectedReturn.type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Pelanggan/Pemasok</span>
                  <span className="font-bold text-slate-700">{selectedReturn.partnerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Referensi Transaksi</span>
                  <span className="font-mono text-cyan-600 font-bold">{selectedReturn.referenceNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Alasan Retur</span>
                  <span className="font-medium text-slate-600">{selectedReturn.reason}</span>
                </div>
              </div>

              {/* Items list */}
              <div className="space-y-2">
                <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Item Barang Retur</h5>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b text-[9px] uppercase font-mono text-slate-400">
                        <th className="p-2.5 pl-4">Barang / SKU</th>
                        <th className="p-2.5">Kuantitas</th>
                        <th className="p-2.5 pr-4">Catatan Item</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedReturn.items && selectedReturn.items.length > 0 ? (
                        selectedReturn.items.map((item) => (
                          <tr key={item.id} className="text-slate-600">
                            <td className="p-2.5 pl-4">
                              <span className="font-bold text-slate-800 block">{item.productName}</span>
                              <span className="text-[9px] font-mono text-slate-400">{item.productSku}</span>
                            </td>
                            <td className="p-2.5 font-mono font-bold text-slate-700">{item.quantity} pcs</td>
                            <td className="p-2.5 pr-4 text-slate-500">{item.notes}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-slate-400">Tidak ada item terdaftar.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* QC Actions footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Status QC Saat Ini</span>
                <StatusPill tone={getQcStatusTone(selectedReturn.qcStatus)}>
                  {getQcStatusLabel(selectedReturn.qcStatus)}
                </StatusPill>
              </div>
              
              {selectedReturn.qcStatus === 'pending_qc' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedReturn.id, 'rejected')}
                    className="flex items-center gap-1.5 px-3 py-2 border bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 rounded-lg font-bold transition"
                  >
                    <XCircle size={13} />
                    <span>Tolak Retur</span>
                  </button>
                  
                  <button
                    onClick={() => handleUpdateStatus(selectedReturn.id, 'supplier_claim')}
                    className="flex items-center gap-1.5 px-3 py-2 border bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-600 rounded-lg font-bold transition"
                  >
                    <Truck size={13} />
                    <span>Klaim Supplier</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedReturn.id, 'approved')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition"
                  >
                    <CheckCircle2 size={13} />
                    <span>Setujui & Restock</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedReturn(null)}
                  className="px-4 py-2 border bg-white hover:bg-slate-50 rounded-lg font-bold text-slate-600"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Return */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Buat Transaksi Retur Baru</h4>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleCreateReturn} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Tipe Retur</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500 bg-white"
                    value={type}
                    onChange={(e) => { setType(e.target.value as any); resetForm(); }}
                    required
                  >
                    <option value="customer">Retur Masuk dari Pelanggan (Customer)</option>
                    <option value="supplier">Retur Keluar ke Pemasok (Supplier)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    {type === 'customer' ? 'Pilih Customer' : 'Pilih Supplier'}
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500 bg-white"
                    value={selectedPartnerId}
                    onChange={(e) => { setSelectedPartnerId(e.target.value); setSelectedRefId(''); }}
                    required
                  >
                    <option value="">-- Pilih Partner --</option>
                    {type === 'customer' ? (
                      customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                    ) : (
                      suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    {type === 'customer' ? 'Referensi Sales Order (SO)' : 'Referensi Purchase Order (PO)'}
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500 bg-white"
                    value={selectedRefId}
                    onChange={(e) => setSelectedRefId(e.target.value)}
                  >
                    <option value="">-- Tanpa Referensi / Non-SO-PO --</option>
                    {type === 'customer' ? (
                      filteredSalesOrders.map(so => <option key={so.id} value={so.id}>{so.orderNumber}</option>)
                    ) : (
                      filteredPurchaseOrders.map(po => <option key={po.id} value={po.id}>{po.poNumber}</option>)
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Alasan Retur</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                    placeholder="Contoh: Barang retak rambut / salah spek"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Item Barang Retur</h5>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2 py-1 text-[10px] bg-slate-900 hover:bg-slate-800 text-white rounded font-bold"
                  >
                    Tambah Item
                  </button>
                </div>
                
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border">
                      <div className="flex-1">
                        <select
                          className="w-full px-2 py-1 border rounded bg-white text-[11px]"
                          value={item.product_id}
                          onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                          required
                        >
                          <option value="">-- Pilih Produk --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="w-20">
                        <input
                          type="number"
                          min={1}
                          className="w-full px-2 py-1 border rounded text-center text-[11px]"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                          required
                        />
                      </div>

                      <div className="flex-1">
                        <input
                          type="text"
                          className="w-full px-2 py-1 border rounded text-[11px]"
                          placeholder="Catatan kerusakan..."
                          value={item.notes}
                          onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  
                  {items.length === 0 && (
                    <p className="text-center text-slate-400 py-4">Belum ada item ditambahkan.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
