/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, CheckCircle2, ChevronRight, X, Clock, HelpCircle, FileText, Send, Check } from 'lucide-react';
import { authStorage, apiClient } from '../services/api';
import { salesApi } from '../features/sales/api';
import { DeliveryOrder, SalesOrder } from '../types';

interface DeliveryOrdersViewProps {
  onTriggerNotification: (message: string) => void;
}

interface StorageLocationOption {
  id: string;
  name: string;
  code: string;
}

// Dummy initial data for demo mode fallback
const dummyDeliveryOrders: DeliveryOrder[] = [
  { id: 'do1', deliveryNumber: 'DO-2026-0601', salesOrderId: 'so1', salesOrderNumber: 'SO-2026-05-033', customerId: 'c1', customerName: 'Masjid Baiturrahman', deliveryDate: '2026-06-02', status: 'Dikirim', receiverName: '', notes: 'Kubah GRC D 6 Meter', items: [{ id: 'doi1', productId: 'p1', productName: 'Kubah GRC D 6 Meter', productSku: 'KBG-006', quantity: 1 }] },
  { id: 'do2', deliveryNumber: 'DO-2026-0602', salesOrderId: 'so2', salesOrderNumber: 'SO-2026-05-035', customerId: 'c2', customerName: 'PT Karya Beton Raya', deliveryDate: '2026-06-01', receivedAt: '2026-06-02', receiverName: 'Pak Anton', status: 'Diterima', notes: 'Roster 1.500 pcs', items: [{ id: 'doi2', productId: 'p2', productName: 'Roster Beton Motif Kotak', productSku: 'RST-001', quantity: 1500 }] },
  { id: 'do3', deliveryNumber: 'DO-2026-0603', salesOrderId: 'so3', salesOrderNumber: 'SO-2026-05-036', customerId: 'c3', customerName: 'H. Ahmad Syukur', deliveryDate: '2026-06-04', status: 'Siap Muat', receiverName: '', notes: 'Lisplang M20 80 m', items: [{ id: 'doi3', productId: 'p3', productName: 'Lisplang Beton M20', productSku: 'LPL-M20', quantity: 80 }] },
];

export default function DeliveryOrdersView({ onTriggerNotification }: DeliveryOrdersViewProps) {
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>(dummyDeliveryOrders);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocationOption[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedDo, setSelectedDo] = useState<DeliveryOrder | null>(null);

  // Create DO form states
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState('');
  const [deliveryNumber, setDeliveryNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Ship DO form states
  const [selectedLocationId, setSelectedLocationId] = useState('');
  
  // Receive DO form states
  const [receiverName, setReceiverName] = useState('');

  const hasBackendSession = Boolean(authStorage.getToken());

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (hasBackendSession) {
        // Fetch real data
        const [dos, sos, locs] = await Promise.all([
          salesApi.getDeliveryOrders(),
          salesApi.getSalesOrders(),
          apiClient.get<{ data: StorageLocationOption[] }>('/master-data/storage-locations')
        ]);
        setDeliveryOrders(dos);
        setSalesOrders(sos);
        setStorageLocations(locs.data || []);
      } else {
        // Mock storage locations
        setStorageLocations([
          { id: 'loc1', name: 'Gudang Utama A', code: 'GD-A' },
          { id: 'loc2', name: 'Workshop Produksi', code: 'WS-01' },
          { id: 'loc3', name: 'Gudang Bahan Baku', code: 'GD-BB' },
        ]);
      }
    } catch (err) {
      console.error('Failed to load delivery order resources', err);
      onTriggerNotification('Gagal mengambil data surat jalan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hasBackendSession]);

  const handleOpenCreateModal = () => {
    // Generate auto DO number
    const count = deliveryOrders.length + 1;
    setDeliveryNumber(`DO-2026-06${count < 10 ? '0' + count : count}`);
    setSelectedSalesOrderId('');
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsCreateModalOpen(true);
  };

  const handleCreateDo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSalesOrderId || !deliveryNumber) {
      onTriggerNotification('Pilih Sales Order dan isi nomor surat jalan.');
      return;
    }

    try {
      if (hasBackendSession) {
        const created = await salesApi.createDeliveryOrder(selectedSalesOrderId, {
          delivery_number: deliveryNumber,
          delivery_date: deliveryDate,
          notes
        });
        setDeliveryOrders(prev => [created, ...prev]);
        onTriggerNotification(`Surat Jalan ${deliveryNumber} berhasil dibuat`);
      } else {
        const so = salesOrders.find(s => s.id === selectedSalesOrderId) || { orderNumber: 'SO-MOCK', customerName: 'Mock Customer' };
        const mockNew: DeliveryOrder = {
          id: `do-${Date.now()}`,
          deliveryNumber,
          salesOrderId: selectedSalesOrderId,
          salesOrderNumber: so.orderNumber,
          customerId: 'mock-customer-id',
          customerName: so.customerName,
          deliveryDate,
          status: 'Siap Muat',
          notes,
          items: []
        };
        setDeliveryOrders(prev => [mockNew, ...prev]);
        onTriggerNotification(`Surat Jalan ${deliveryNumber} disimulasikan`);
      }
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Failed to create delivery order', err);
      onTriggerNotification('Gagal membuat surat jalan. Pastikan order belum memiliki DO.');
    }
  };

  const handleOpenShipModal = (doOrder: DeliveryOrder) => {
    setSelectedDo(doOrder);
    setSelectedLocationId(storageLocations[0]?.id || '');
    setIsShipModalOpen(true);
  };

  const handleShipDo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDo || !selectedLocationId) return;

    try {
      if (hasBackendSession) {
        const updated = await salesApi.shipDeliveryOrder(selectedDo.id, {
          from_location_id: selectedLocationId,
          movement_at: new Date().toISOString()
        });
        setDeliveryOrders(prev => prev.map(item => item.id === selectedDo.id ? updated : item));
      } else {
        setDeliveryOrders(prev => prev.map(item => item.id === selectedDo.id ? { ...item, status: 'Dikirim' } : item));
      }
      onTriggerNotification(`Surat Jalan ${selectedDo.deliveryNumber} status diubah ke: Dikirim`);
      setIsShipModalOpen(false);
    } catch (err) {
      console.error('Failed to ship delivery order', err);
      onTriggerNotification('Gagal memproses pengiriman. Cek saldo stok gudang!');
    }
  };

  const handleOpenReceiveModal = (doOrder: DeliveryOrder) => {
    setSelectedDo(doOrder);
    setReceiverName('');
    setIsReceiveModalOpen(true);
  };

  const handleReceiveDo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDo || !receiverName) {
      onTriggerNotification('Isi nama penerima barang.');
      return;
    }

    try {
      if (hasBackendSession) {
        const updated = await salesApi.updateDeliveryOrderStatus(selectedDo.id, {
          status: 'received',
          receiver_name: receiverName,
          received_at: new Date().toISOString()
        });
        setDeliveryOrders(prev => prev.map(item => item.id === selectedDo.id ? updated : item));
      } else {
        setDeliveryOrders(prev => prev.map(item => item.id === selectedDo.id ? { 
          ...item, 
          status: 'Diterima', 
          receiverName, 
          receivedAt: new Date().toISOString().split('T')[0] 
        } : item));
      }
      onTriggerNotification(`Surat Jalan ${selectedDo.deliveryNumber} dikonfirmasi Diterima oleh ${receiverName}`);
      setIsReceiveModalOpen(false);
    } catch (err) {
      console.error('Failed to mark delivery order as received', err);
      onTriggerNotification('Gagal mengupdate status surat jalan.');
    }
  };

  const handlePrintDo = (doNumber: string) => {
    onTriggerNotification(`Surat Jalan ${doNumber} disiapkan untuk dicetak. Membuka print layout...`);
  };

  // Filters & Counts
  const totalDos = deliveryOrders.length;
  const countReady = deliveryOrders.filter(d => d.status === 'Siap Muat').length;
  const countShipped = deliveryOrders.filter(d => d.status === 'Dikirim').length;
  const countReceived = deliveryOrders.filter(d => d.status === 'Diterima').length;

  const filteredOrders = deliveryOrders.filter(d => 
    d.deliveryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.customerName && d.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.salesOrderNumber && d.salesOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-cyan-400 font-bold uppercase bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-800/50">
              LOGISTIK & EKSPEDISI
            </span>
            <h1 className="font-sans font-black tracking-tight text-xl md:text-2xl mt-3 text-slate-100 flex items-center gap-2">
              Delivery Order / Surat Jalan
              {hasBackendSession && (
                <span className="text-[9px] font-mono font-normal tracking-normal normal-case border border-cyan-400/35 bg-cyan-950/50 text-cyan-400 rounded px-1.5 py-0.5 ml-2">
                  API MODE
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-350 mt-1 max-w-xl leading-relaxed">
              Buat dokumen surat jalan resmi dari Sales Order, lakukan shipment untuk mengurangi stok secara live, dan catat bukti terima barang.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-gradient-to-br from-cyan-500 to-indigo-650 text-white font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 shrink-0"
          >
            <Plus size={14} />
            <span>Buat Surat Jalan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Total Pengiriman</span>
            <h4 className="text-lg font-black text-slate-800 mt-1">{totalDos} Surat</h4>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-500 rounded-lg">
            <Truck size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Siap Muat</span>
            <h4 className="text-lg font-black text-cyan-600 mt-1">{countReady} Surat</h4>
          </div>
          <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Dalam Pengiriman</span>
            <h4 className="text-lg font-black text-amber-600 mt-1">{countShipped} Surat</h4>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Send size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Sudah Diterima</span>
            <h4 className="text-lg font-black text-emerald-600 mt-1">{countReceived} Surat</h4>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Cari no. DO, customer, sales order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Menampilkan {filteredOrders.length} dari {totalDos} data surat jalan
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-sans">
            Memuat database ekspedisi...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                  <th className="p-3.5 pl-5">No Surat Jalan</th>
                  <th className="p-3.5">Sales Order</th>
                  <th className="p-3.5">Customer / Relasi</th>
                  <th className="p-3.5">Tanggal Muat</th>
                  <th className="p-3.5">Detail Muatan</th>
                  <th className="p-3.5">Nama Penerima</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((doOrder) => (
                  <tr key={doOrder.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5 pl-5 font-mono font-bold text-cyan-600">{doOrder.deliveryNumber}</td>
                    <td className="p-3.5 font-mono text-slate-500">{doOrder.salesOrderNumber || '-'}</td>
                    <td className="p-3.5 font-bold text-slate-800">{doOrder.customerName}</td>
                    <td className="p-3.5 font-mono text-slate-500">{doOrder.deliveryDate}</td>
                    <td className="p-3.5 text-slate-600">
                      {doOrder.items && doOrder.items.length > 0 ? (
                        <div className="space-y-0.5">
                          {doOrder.items.map(item => (
                            <div key={item.id} className="font-semibold text-slate-700">
                              {item.productName} ({item.quantity} pcs)
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">{doOrder.notes || 'Muatan Custom'}</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-650 text-slate-700">
                      {doOrder.receiverName ? (
                        <div>
                          <div className="font-bold text-slate-800">{doOrder.receiverName}</div>
                          {doOrder.receivedAt && (
                            <div className="text-[9px] text-slate-400 font-mono">Tgl: {doOrder.receivedAt}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        doOrder.status === 'Siap Muat' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                        doOrder.status === 'Dikirim' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        doOrder.status === 'Diterima' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {doOrder.status}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex justify-end gap-1.5">
                        {doOrder.status === 'Siap Muat' && (
                          <button
                            onClick={() => handleOpenShipModal(doOrder)}
                            className="px-2.5 py-1 bg-cyan-600 text-white text-[10px] font-bold rounded-lg hover:bg-cyan-700 transition-all flex items-center gap-1"
                          >
                            <Send size={10} />
                            <span>Kirim</span>
                          </button>
                        )}
                        {doOrder.status === 'Dikirim' && (
                          <button
                            onClick={() => handleOpenReceiveModal(doOrder)}
                            className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-1"
                          >
                            <Check size={10} />
                            <span>Terima</span>
                          </button>
                        )}
                        <button
                          onClick={() => handlePrintDo(doOrder.deliveryNumber)}
                          className="px-2.5 py-1 border rounded bg-slate-50 hover:bg-white text-[10px] font-bold text-slate-600 transition-all"
                        >
                          Cetak
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                      Tidak ada Surat Jalan yang terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Buat Surat Jalan */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-cyan-400" />
                <h3 className="font-bold text-sm">Buat Surat Jalan</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDo} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Pilih Sales Order *</label>
                <select
                  required
                  value={selectedSalesOrderId}
                  onChange={(e) => setSelectedSalesOrderId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- Pilih Sales Order Active --</option>
                  {salesOrders
                    .filter(so => so.status !== 'Dibatalkan' && so.status !== 'Selesai')
                    .map(so => (
                      <option key={so.id} value={so.id}>
                        {so.orderNumber} - {so.customerName}
                      </option>
                    ))}
                  {salesOrders.length === 0 && (
                    <option value="" disabled>Tidak ada Sales Order aktif untuk dikirim</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">No. Surat Jalan *</label>
                  <input
                    type="text"
                    required
                    value={deliveryNumber}
                    onChange={(e) => setDeliveryNumber(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Tanggal Kirim *</label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Catatan Muatan / Pengiriman</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Instruksi pengiriman supir atau rincian muatan khusus..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-br from-cyan-500 to-indigo-650 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 hover:opacity-95"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ship / Kirim Surat Jalan */}
      {isShipModalOpen && selectedDo && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-cyan-400" />
                <h3 className="font-bold text-sm">Shipment: Kirim Barang</h3>
              </div>
              <button onClick={() => setIsShipModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleShipDo} className="p-5 space-y-4">
              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-900 leading-relaxed space-y-1">
                <div className="font-bold text-xs">Informasi Surat Jalan:</div>
                <div>No. DO: <span className="font-mono font-bold">{selectedDo.deliveryNumber}</span></div>
                <div>Customer: <span className="font-bold">{selectedDo.customerName}</span></div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Asal Gudang / Lokasi Stok *</label>
                <select
                  required
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-cyan-400"
                >
                  {storageLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Stok material akan terpotong secara otomatis dari lokasi ini ketika status diubah ke "Dikirim".
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsShipModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-br from-cyan-500 to-indigo-650 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 hover:opacity-95"
                >
                  Kirim Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Received / Konfirmasi Penerimaan */}
      {isReceiveModalOpen && selectedDo && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <h3 className="font-bold text-sm">Konfirmasi Diterima</h3>
              </div>
              <button onClick={() => setIsReceiveModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleReceiveDo} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Nama Penerima Barang *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pak Slamet (Security / Owner)"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
                >
                  Konfirmasi Diterima
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
