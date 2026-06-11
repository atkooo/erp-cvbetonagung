/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  PackageCheck, Plus, CheckCircle2, AlertCircle, X, Search,
  Warehouse, Eye, Clock, Check, RefreshCw, AlertTriangle, Send, Edit2
} from '@/src/components/icons';
import Swal from 'sweetalert2';
import { inventoryApi } from '../features/inventory/api';
import { productsApi } from '../features/products/api';
import { apiClient } from '../services/api';
import {
  StockOpnameSession, StockOpnameItem, LocationDto, ProductStockDto
} from '../features/inventory/types';
import { Product } from '../types';
import ProductPicker from './ProductPicker';

interface StockOpnameViewProps {
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

export default function StockOpnameView({ onTriggerNotification }: StockOpnameViewProps) {
  const [sessions, setSessions] = useState<StockOpnameSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<StockOpnameSession | null>(null);
  const [sessionItems, setSessionItems] = useState<StockOpnameItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string; code: string }[]>([]);
  const [productStocks, setProductStocks] = useState<ProductStockDto[]>([]);

  // Modals & Forms State
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionWarehouse, setNewSessionWarehouse] = useState('');
  const [newSessionNotes, setNewSessionNotes] = useState('');

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemProductId, setNewItemProductId] = useState('');
  const [newItemLocationId, setNewItemLocationId] = useState('');
  const [newItemPhysicalQty, setNewItemPhysicalQty] = useState<number>(0);
  const [newItemNotes, setNewItemNotes] = useState('');

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPhysicalQty, setEditingPhysicalQty] = useState<number>(0);
  const [editingNotes, setEditingNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const availableItemLocations = selectedSession
    ? locations.filter((location) => location.warehouse_id === selectedSession.warehouseId)
    : [];

  // Load baseline data
  useEffect(() => {
    fetchSessions();
    loadMasterData();
  }, []);

  // Fetch items when selected session changes
  useEffect(() => {
    if (selectedSession) {
      fetchSessionItems(selectedSession.id);
    } else {
      setSessionItems([]);
    }
    setNewItemLocationId('');
  }, [selectedSession]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const data = await inventoryApi.getStockOpnameSessions();
      setSessions(data);
      if (selectedSession) {
        const updated = data.find(s => s.id === selectedSession.id);
        if (updated) setSelectedSession(updated);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      onTriggerNotification('Gagal memuat sesi stock opname.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSessionItems = async (sessionId: string) => {
    setIsLoadingItems(true);
    setSessionItems([]); // Clear items to prevent showing previous session's items
    try {
      const data = await inventoryApi.getStockOpnameItems(sessionId);
      setSessionItems(data);
    } catch (error) {
      console.error('Error fetching session items:', error);
      onTriggerNotification('Gagal memuat item stock opname.');
    } finally {
      setIsLoadingItems(false);
    }
  };

  const loadMasterData = async () => {
    try {
      const [prodData, locRes, whRes, stocks] = await Promise.all([
        productsApi.getProducts(),
        apiClient.get<{ data: LocationDto[] }>('/master-data/storage-locations'),
        apiClient.get<{ data: any[] }>('/master-data/warehouses'),
        inventoryApi.getProductStocks(),
      ]);
      setProducts(prodData);
      setLocations(locRes.data);
      setWarehouses(whRes.data);
      setProductStocks(stocks);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionWarehouse) {
      Swal.fire('Error', 'Silakan pilih gudang terlebih dahulu.', 'error');
      return;
    }

    try {
      const newSession = await inventoryApi.createStockOpnameSession({
        warehouse_id: newSessionWarehouse,
        notes: newSessionNotes
      });
      Swal.fire('Sukses', `Sesi opname ${newSession.opnameNumber} berhasil dibuat!`, 'success');
      setShowNewSessionModal(false);
      setNewSessionWarehouse('');
      setNewSessionNotes('');
      fetchSessions();
      setSelectedSession(newSession);
    } catch (error) {
      console.error('Error creating session:', error);
      Swal.fire('Gagal', 'Terjadi kesalahan saat membuat sesi opname.', 'error');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession || !newItemProductId || !newItemLocationId) {
      Swal.fire('Error', 'Pilih produk dan lokasi penyimpanan.', 'error');
      return;
    }

    const selectedLocation = availableItemLocations.find((location) => location.id === newItemLocationId);
    if (!selectedLocation) {
      Swal.fire('Error', 'Lokasi penyimpanan harus berasal dari gudang sesi stock opname.', 'error');
      return;
    }

    // Determine system stock
    const matchingStock = productStocks.find(
      s => s.product_id === newItemProductId && s.location_id === newItemLocationId
    );
    const systemQty = matchingStock ? Number(matchingStock.quantity) : 0;
    const diffQty = newItemPhysicalQty - systemQty;

    try {
      await inventoryApi.createStockOpnameItem({
        session_id: selectedSession.id,
        product_id: newItemProductId,
        location_id: newItemLocationId,
        system_qty: systemQty,
        physical_qty: newItemPhysicalQty,
        difference_qty: diffQty,
        notes: newItemNotes
      });

      Swal.fire('Sukses', 'Item opname berhasil ditambahkan.', 'success');
      setShowAddItemModal(false);
      setNewItemProductId('');
      setNewItemLocationId('');
      setNewItemPhysicalQty(0);
      setNewItemNotes('');
      fetchSessionItems(selectedSession.id);
    } catch (error) {
      console.error('Error adding item:', error);
      Swal.fire('Gagal', 'Terjadi kesalahan saat menambahkan item opname.', 'error');
    }
  };

  const handleUpdateItem = async (itemId: string) => {
    if (!selectedSession) return;
    const item = sessionItems.find(i => i.id === itemId);
    if (!item) return;

    const diffQty = editingPhysicalQty - item.systemQty;

    try {
      await inventoryApi.updateStockOpnameItem(itemId, {
        physical_qty: editingPhysicalQty,
        difference_qty: diffQty,
        notes: editingNotes
      });

      Swal.fire('Sukses', 'Data item berhasil diperbarui.', 'success');
      setEditingItemId(null);
      fetchSessionItems(selectedSession.id);
    } catch (error) {
      console.error('Error updating item:', error);
      Swal.fire('Gagal', 'Gagal memperbarui item.', 'error');
    }
  };

  const handleStartEditing = (item: StockOpnameItem) => {
    setEditingItemId(item.id);
    setEditingPhysicalQty(item.physicalQty);
    setEditingNotes(item.notes);
  };

  const handleStatusChange = async (status: 'in_progress' | 'closed' | 'cancelled') => {
    if (!selectedSession) return;

    if (status === 'closed') {
      const hasUnresolved = sessionItems.some(
        (item) => item.differenceQty !== 0 && !item.isAdjusted
      );
      if (hasUnresolved) {
        Swal.fire(
          'Tidak Dapat Menutup Sesi',
          'Masih ada selisih stok yang belum diselesaikan (butuh approval dan penyesuaian).',
          'error'
        );
        return;
      }
    }

    const actionText = status === 'in_progress' ? 'Mulai Audit' : status === 'closed' ? 'Tutup Sesi' : 'Batalkan Sesi';
    const result = await Swal.fire({
      title: `${actionText}?`,
      text: `Status sesi akan diubah menjadi ${status}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Ubah',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await inventoryApi.updateStockOpnameSessionStatus(selectedSession.id, status);
        Swal.fire('Sukses', `Sesi opname berhasil diubah menjadi ${status}.`, 'success');
        fetchSessions();
      } catch (error) {
        console.error('Error changing status:', error);
        Swal.fire('Gagal', 'Gagal mengubah status sesi.', 'error');
      }
    }
  };

  const handleRequestApproval = async (item: StockOpnameItem) => {
    if (!selectedSession) return;

    const result = await Swal.fire({
      title: 'Ajukan Approval?',
      text: `Ajukan penyesuaian selisih ${item.differenceQty} pcs untuk ${item.productName} ke pihak berwenang?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ajukan',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        // 1. Create Approval Request
        const appReq = await inventoryApi.createApprovalRequest({
          request_type: 'stock_opname_adjustment',
          reference_type: 'stock_opname_item',
          reference_id: item.id,
          reference_number: selectedSession.opnameNumber,
          change_summary: `Koreksi stok ${item.productName} di ${item.locationName}: sistem ${item.systemQty}, fisik ${item.physicalQty} (selisih ${item.differenceQty})`,
          amount: 0
        });

        // 2. Link request id to item
        await inventoryApi.updateStockOpnameItem(item.id, {
          approval_request_id: appReq.id
        });

        Swal.fire('Sukses', 'Permintaan approval berhasil diajukan.', 'success');
        onTriggerNotification(`Permintaan approval penyesuaian stok ${item.sku} diajukan.`);
        fetchSessionItems(selectedSession.id);
      } catch (error) {
        console.error('Error submitting approval:', error);
        Swal.fire('Gagal', 'Gagal mengajukan permintaan approval.', 'error');
      }
    }
  };

  const handleAdjustStock = async (item: StockOpnameItem) => {
    if (!selectedSession) return;

    const result = await Swal.fire({
      title: 'Sesuaikan Stok?',
      text: `Menyesuaikan stok sistem ${item.productName} menjadi kuantitas fisik (${item.physicalQty} pcs)? Tindakan ini akan mencatat log mutasi.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Sesuaikan',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await inventoryApi.adjustStockOpnameItem(item.id, item.notes);
        Swal.fire('Sukses', 'Stok berhasil disesuaikan di database!', 'success');
        onTriggerNotification(`Stok ${item.sku} disesuaikan secara permanen.`);
        fetchSessionItems(selectedSession.id);
        fetchSessions(); // Sesi mungkin ditutup jika semua item sudah disesuaikan
      } catch (error) {
        console.error('Error adjusting stock:', error);
        Swal.fire('Gagal', 'Gagal memproses penyesuaian stok.', 'error');
      }
    }
  };

  // Status mapping to tone
  const getSessionTone = (status: string) => {
    switch (status) {
      case 'draft': return 'slate';
      case 'in_progress': return 'cyan';
      case 'completed': return 'amber';
      case 'closed': return 'emerald';
      default: return 'rose';
    }
  };

  const getApprovalTone = (status: string) => {
    switch (status) {
      case 'pending': return 'amber';
      case 'approved': return 'emerald';
      case 'rejected': return 'rose';
      default: return 'slate';
    }
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      <Header
        icon={<PackageCheck size={20} />}
        title="Stock Opname & Rekonsiliasi Gudang"
        desc="Audit kecocokan stok fisik di gudang dengan catatan sistem secara real-time dan berjenjang persetujuan."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Sessions List */}
        <div className="lg:col-span-1 space-y-4">
          <Panel className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Sesi Stock Opname</h4>
              <button
                onClick={() => setShowNewSessionModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition"
              >
                <Plus size={12} />
                <span>Buat Sesi</span>
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="animate-spin text-slate-400" size={18} />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Belum ada sesi stock opname.</p>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${selectedSession?.id === session.id
                        ? 'border-cyan-500 bg-cyan-50/30'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-slate-800">{session.opnameNumber}</span>
                      <StatusPill tone={getSessionTone(session.status)}>{session.status}</StatusPill>
                    </div>
                    <p className="text-slate-600 font-medium mb-1 flex items-center gap-1">
                      <Warehouse size={12} className="text-slate-400" />
                      <span>{session.warehouseName} ({session.warehouseCode})</span>
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 border-t pt-1.5 border-slate-100">
                      <span>Mulai: {session.startedAt}</span>
                      <span>Oleh: {session.startedBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Right Panel: Selected Session Items & Controls */}
        <div className="lg:col-span-2">
          {selectedSession ? (
            <Panel className="overflow-hidden">
              {/* Session Control Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-mono font-bold text-slate-900 text-sm">{selectedSession.opnameNumber}</h4>
                    <StatusPill tone={getSessionTone(selectedSession.status)}>{selectedSession.status}</StatusPill>
                  </div>
                  <p className="text-slate-500 font-medium">Gudang: {selectedSession.warehouseName} | Mulai: {selectedSession.startedAt}</p>
                  {selectedSession.notes && (
                    <p className="text-slate-400 mt-1 italic">Catatan: "{selectedSession.notes}"</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {selectedSession.status === 'draft' && (
                    <>
                      <button
                        onClick={() => {
                          setNewItemLocationId('');
                          setShowAddItemModal(true);
                        }}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition"
                      >
                        Tambah Item
                      </button>
                      <button
                        onClick={() => handleStatusChange('in_progress')}
                        className="px-3 py-1.5 border bg-white text-cyan-600 hover:bg-cyan-50/50 border-cyan-200 rounded-lg font-bold transition"
                      >
                        Mulai Audit
                      </button>
                    </>
                  )}

                  {selectedSession.status === 'in_progress' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('closed')}
                        className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 transition"
                      >
                        Tutup Sesi
                      </button>
                      <button
                        onClick={() => handleStatusChange('cancelled')}
                        className="px-3 py-1.5 border bg-white text-rose-600 hover:bg-rose-50 border-rose-200 rounded-lg font-bold transition"
                      >
                        Batalkan Sesi
                      </button>
                    </>
                  )}

                  {selectedSession.status === 'closed' && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      <span>Sesi Selesai & Ditutup</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Items Table */}
              {isLoadingItems ? (
                <div className="flex justify-center py-16">
                  <RefreshCw className="animate-spin text-slate-400" size={24} />
                </div>
              ) : sessionItems.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <PackageCheck size={28} className="mx-auto text-slate-300" />
                  <p>Belum ada item barang dalam sesi audit ini.</p>
                  {selectedSession.status === 'draft' && (
                    <button
                      onClick={() => {
                        setNewItemLocationId('');
                        setShowAddItemModal(true);
                      }}
                      className="text-cyan-600 font-bold hover:underline"
                    >
                      Tambahkan item pertama
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                        <th className="p-3.5 pl-5">Barang</th>
                        <th className="p-3.5">Lokasi Simpan</th>
                        <th className="p-3.5 text-center">Stok Sistem</th>
                        <th className="p-3.5 text-center">Stok Fisik</th>
                        <th className="p-3.5 text-center">Selisih</th>
                        <th className="p-3.5">Status Approval</th>
                        <th className="p-3.5">Catatan</th>
                        <th className="p-3.5 pr-5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sessionItems.map((item) => {
                        const isEditing = editingItemId === item.id;
                        const hasDifference = item.differenceQty !== 0;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="p-3.5 pl-5">
                              <span className="font-bold text-slate-800 block">{item.productName}</span>
                              <span className="font-mono text-slate-400 text-[10px]">{item.sku}</span>
                            </td>
                            <td className="p-3.5 font-mono text-slate-600">{item.locationName}</td>
                            <td className="p-3.5 text-center font-mono text-slate-700">{item.systemQty}</td>
                            <td className="p-3.5 text-center font-mono font-bold">
                              {isEditing ? (
                                <input
                                  type="number"
                                  className="w-16 px-1.5 py-1 border rounded text-center"
                                  value={editingPhysicalQty}
                                  onChange={(e) => setEditingPhysicalQty(Number(e.target.value))}
                                />
                              ) : (
                                <span>{item.physicalQty}</span>
                              )}
                            </td>
                            <td className={`p-3.5 text-center font-mono font-black ${item.differenceQty === 0
                                ? 'text-emerald-600'
                                : item.differenceQty > 0
                                  ? 'text-blue-600'
                                  : 'text-rose-600'
                              }`}>
                              {item.differenceQty > 0 ? `+${item.differenceQty}` : item.differenceQty}
                            </td>
                            <td className="p-3.5">
                              {item.approvalRequestId ? (
                                <StatusPill tone={getApprovalTone(item.approvalStatus || 'pending')}>
                                  {item.approvalStatus || 'pending'}
                                </StatusPill>
                              ) : hasDifference ? (
                                <span className="text-amber-500 font-bold">Butuh Approval</span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-500">
                              {isEditing ? (
                                <input
                                  type="text"
                                  className="px-2 py-1 border rounded w-full min-w-[120px]"
                                  value={editingNotes}
                                  onChange={(e) => setEditingNotes(e.target.value)}
                                  placeholder="Catatan..."
                                />
                              ) : (
                                <span>{item.notes || '-'}</span>
                              )}
                            </td>
                            <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* If session is in_progress, can edit quantities */}
                                {selectedSession.status === 'in_progress' && (
                                  <>
                                    {isEditing ? (
                                      <>
                                        <button
                                          onClick={() => handleUpdateItem(item.id)}
                                          className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                                          title="Simpan"
                                        >
                                          <Check size={12} />
                                        </button>
                                        <button
                                          onClick={() => setEditingItemId(null)}
                                          className="p-1.5 bg-slate-300 text-slate-700 rounded hover:bg-slate-400"
                                          title="Batal"
                                        >
                                          <X size={12} />
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => handleStartEditing(item)}
                                        title="Input Fisik"
                                        className="p-1.5 border rounded bg-white hover:bg-slate-50 text-slate-600 transition"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                    )}
                                  </>
                                )}

                                {/* If session is completed/closed/in_progress, look at adjustments */}
                                {selectedSession.status !== 'draft' && !isEditing && (
                                  <>
                                    {hasDifference && !item.approvalRequestId && (
                                      <button
                                        onClick={() => handleRequestApproval(item)}
                                        title="Ajukan Approval"
                                        className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded transition"
                                      >
                                        <Send size={14} />
                                      </button>
                                    )}

                                    {item.approvalStatus === 'approved' && !item.isAdjusted && (
                                      <button
                                        onClick={() => handleAdjustStock(item)}
                                        title="Sesuaikan Stok"
                                        className="p-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition"
                                      >
                                        <RefreshCw size={14} />
                                      </button>
                                    )}

                                    {item.approvalStatus === 'approved' && item.isAdjusted && (
                                      <span className="text-emerald-600 font-bold flex items-center gap-0.5 ml-2">
                                        <CheckCircle2 size={12} />
                                        <span>Selesai</span>
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          ) : (
            <Panel className="p-8 text-center text-slate-400 py-24">
              <Eye size={36} className="mx-auto text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-700">Pilih Sesi Opname</h4>
              <p className="mt-1 max-w-sm mx-auto">Silakan pilih salah satu sesi stock opname di sebelah kiri untuk melihat daftar item barang, mengaudit kuantitas, atau mengajukan koreksi.</p>
            </Panel>
          )}
        </div>
      </div>

      {/* Modal: New Session */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Mulai Sesi Opname Baru</h4>
              <button onClick={() => setShowNewSessionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateSession} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Pilih Gudang / Area Audit</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                  value={newSessionWarehouse}
                  onChange={(e) => setNewSessionWarehouse(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Gudang --</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Catatan / Keterangan</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                  value={newSessionNotes}
                  onChange={(e) => setNewSessionNotes(e.target.value)}
                  placeholder="Contoh: Audit stock triwulanan bahan baku"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800"
                >
                  Mulai Sesi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Item to Session */}
      {showAddItemModal && selectedSession && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Tambah Item ke Sesi Audit</h4>
              <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Pilih Produk</label>
                <ProductPicker
                  value={newItemProductId}
                  onChange={(product) => setNewItemProductId(product.id)}
                  placeholder="Pilih produk untuk diopname..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Pilih Lokasi Penyimpanan (Rak/Titik)</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                  value={newItemLocationId}
                  onChange={(e) => setNewItemLocationId(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Lokasi --</option>
                  {availableItemLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                  ))}
                </select>
                {availableItemLocations.length === 0 && (
                  <p className="text-[10px] text-amber-600 font-semibold">
                    Belum ada rak/lokasi untuk gudang {selectedSession.warehouseName}.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Kuantitas Fisik Awal (Pcs)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                  value={newItemPhysicalQty}
                  onChange={(e) => setNewItemPhysicalQty(Number(e.target.value))}
                  min={0}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Catatan Awal</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                  placeholder="Contoh: Kondisi retak/rusak, dsb."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800"
                >
                  Tambahkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
