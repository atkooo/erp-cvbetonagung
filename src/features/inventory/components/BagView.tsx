import React, { useState, useEffect } from 'react';
import { FileCheck, Plus, Search, Warehouse, Eye, RefreshCw } from '@/src/components/icons';
import Swal from 'sweetalert2';
import { apiClient } from '../../../services/api';
import { productsApi } from '../../products/api';
import { Bag, BagItem } from '../../../types';
import { Product } from '../../../types';
import ProductPicker from '../../../components/ProductPicker';

interface BagViewProps {
  onTriggerNotification?: (message: string) => void;
}

const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const Header = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
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

const StatusPill = ({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'cyan' | 'emerald' | 'amber' }) => {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${tones[tone]}`}>
      {children}
    </span>
  );
};

export default function BagView({ onTriggerNotification }: BagViewProps) {
  const [bags, setBags] = useState<Bag[]>([]);
  const [selectedBag, setSelectedBag] = useState<Bag | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // New BAG form state
  const [showNewModal, setShowNewModal] = useState(false);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string; warehouse_id: string }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [newBagDate, setNewBagDate] = useState('');
  const [newBagWarehouseId, setNewBagWarehouseId] = useState('');
  const [newBagLocationId, setNewBagLocationId] = useState('');
  const [newBagType, setNewBagType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [newBagNotes, setNewBagNotes] = useState('');
  const [newBagItems, setNewBagItems] = useState<{ product_id: string; quantity: number; notes: string }[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBags();
    loadMasterData();
    setNewBagDate(new Date().toISOString().split('T')[0]);
  }, []);

  const fetchBags = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ data: Bag[] }>('/inventory/bags?include=warehouse,location,items.product');
      setBags(res.data);
    } catch (error) {
      console.error('Error fetching BAGs:', error);
      onTriggerNotification?.('Gagal memuat Berita Acara Gudang.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMasterData = async () => {
    try {
      const [whRes, locRes, prodData] = await Promise.all([
        apiClient.get<{ data: any[] }>('/master-data/warehouses'),
        apiClient.get<{ data: any[] }>('/master-data/storage-locations'),
        productsApi.getProducts()
      ]);
      setWarehouses(whRes.data);
      setLocations(locRes.data);
      setProducts(prodData);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const availableLocations = locations.filter(loc => loc.warehouse_id === newBagWarehouseId);

  const handleAddItem = () => {
    setNewBagItems([...newBagItems, { product_id: '', quantity: 0, notes: '' }]);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updated = [...newBagItems];
    updated[index] = { ...updated[index], [field]: value };
    setNewBagItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setNewBagItems(newBagItems.filter((_, i) => i !== index));
  };

  const handleSubmitBag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBagWarehouseId || newBagItems.length === 0) {
      Swal.fire('Error', 'Silakan pilih gudang dan minimal tambahkan 1 item barang.', 'error');
      return;
    }
    for (const item of newBagItems) {
      if (!item.product_id || item.quantity <= 0) {
        Swal.fire('Error', 'Pastikan semua item memiliki produk dan kuantitas lebih dari 0.', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        date: newBagDate,
        warehouse_id: newBagWarehouseId,
        location_id: newBagLocationId || undefined,
        type: newBagType,
        notes: newBagNotes,
        items: newBagItems
      };
      await apiClient.post('/inventory/bags', payload);
      
      Swal.fire('Sukses', 'Berita Acara Gudang berhasil disubmit dan stok diperbarui!', 'success');
      setShowNewModal(false);
      
      // Reset form
      setNewBagWarehouseId('');
      setNewBagLocationId('');
      setNewBagNotes('');
      setNewBagItems([]);
      
      fetchBags();
    } catch (error) {
      console.error('Error submitting BAG:', error);
      Swal.fire('Gagal', 'Gagal memproses Berita Acara Gudang.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      <Header
        icon={<FileCheck size={20} />}
        title="Berita Acara Gudang (BAG)"
        desc="Mencatat penerimaan, pengeluaran, atau penyesuaian stok tanpa referensi (PO/DO) secara langsung."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Panel className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Daftar BAG</h4>
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition"
              >
                <Plus size={12} />
                <span>Buat BAG Baru</span>
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="animate-spin text-slate-400" size={18} />
              </div>
            ) : bags.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Belum ada dokumen BAG.</p>
            ) : (
              <div className="space-y-2 max-h-120 overflow-y-auto pr-1">
                {bags.map((bag) => (
                  <div
                    key={bag.id}
                    onClick={() => setSelectedBag(bag)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${selectedBag?.id === bag.id
                        ? 'border-cyan-500 bg-cyan-50/30'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-slate-800">{bag.bag_number}</span>
                      <StatusPill tone={bag.type === 'in' ? 'emerald' : bag.type === 'out' ? 'amber' : 'cyan'}>
                        {bag.type.toUpperCase()}
                      </StatusPill>
                    </div>
                    <p className="text-slate-600 font-medium mb-1 flex items-center gap-1">
                      <Warehouse size={12} className="text-slate-400" />
                      <span>{bag.warehouse?.name}</span>
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 border-t pt-1.5 border-slate-100">
                      <span>{bag.date}</span>
                      <span>Item: {bag.items?.length || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="lg:col-span-2">
          {selectedBag ? (
            <Panel className="overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-mono font-bold text-slate-900 text-sm">{selectedBag.bag_number}</h4>
                    <StatusPill tone="emerald">{selectedBag.status}</StatusPill>
                  </div>
                  <p className="text-slate-500 font-medium">Gudang: {selectedBag.warehouse?.name} | Tipe: {selectedBag.type.toUpperCase()} | Tanggal: {selectedBag.date}</p>
                  {selectedBag.notes && (
                    <p className="text-slate-400 mt-1 italic">Catatan: "{selectedBag.notes}"</p>
                  )}
                </div>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                      <th className="p-3.5 pl-5">Produk</th>
                      <th className="p-3.5 text-center">Qty</th>
                      <th className="p-3.5">Catatan Item</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedBag.items?.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5 pl-5">
                          <p className="font-bold text-slate-800">{item.product?.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{item.product?.sku}</p>
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {item.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ) : (
             <div className="flex flex-col justify-center items-center h-full min-h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
               <FileCheck size={32} className="mb-3 text-slate-300" />
               <p>Pilih dokumen BAG di panel kiri untuk melihat detail.</p>
             </div>
          )}
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Buat Berita Acara Gudang Baru</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-rose-500">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitBag} className="flex flex-col overflow-hidden flex-1">
              <div className="p-5 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={newBagDate}
                      onChange={(e) => setNewBagDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipe Mutasi</label>
                    <select
                      value={newBagType}
                      onChange={(e) => setNewBagType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="in">Barang Masuk (In)</option>
                      <option value="out">Barang Keluar (Out)</option>
                      <option value="adjustment">Penyesuaian (Adjustment)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gudang</label>
                    <select
                      required
                      value={newBagWarehouseId}
                      onChange={(e) => {
                        setNewBagWarehouseId(e.target.value);
                        setNewBagLocationId('');
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="">Pilih Gudang...</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lokasi Rak (Opsional)</label>
                    <select
                      value={newBagLocationId}
                      onChange={(e) => setNewBagLocationId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      disabled={!newBagWarehouseId}
                    >
                      <option value="">Pilih Lokasi Rak...</option>
                      {availableLocations.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Catatan Umum</label>
                    <input
                      type="text"
                      value={newBagNotes}
                      onChange={(e) => setNewBagNotes(e.target.value)}
                      placeholder="Catatan dokumen..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h4 className="font-bold text-slate-700">Daftar Item Barang</h4>
                    <button type="button" onClick={handleAddItem} className="px-2 py-1 bg-cyan-600 text-white rounded text-[10px] font-bold flex items-center gap-1 hover:bg-cyan-700">
                      <Plus size={10} /> Tambah Item
                    </button>
                  </div>
                  {newBagItems.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">Silakan tambahkan item barang.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {newBagItems.map((item, index) => (
                        <div key={index} className="p-3 flex items-start gap-3">
                          <div className="flex-1">
                            <div className="mb-2">
                              <ProductPicker
                                value={item.product_id}
                                onChange={(product) => handleUpdateItem(index, 'product_id', product.id)}
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="Catatan item (opsional)"
                              value={item.notes}
                              onChange={(e) => handleUpdateItem(index, 'notes', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-[10px]"
                            />
                          </div>
                          <div className="w-32">
                            <input
                              type="number"
                              required
                              min="0.01"
                              step="0.01"
                              placeholder="Qty"
                              value={item.quantity || ''}
                              onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                            />
                          </div>
                          <button type="button" onClick={() => handleRemoveItem(index)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg">
                            <Plus size={14} className="rotate-45" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 border border-slate-200 bg-white rounded-lg font-bold text-slate-600 hover:bg-slate-50">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50">
                  {isSubmitting ? 'Menyimpan...' : 'Submit BAG'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
