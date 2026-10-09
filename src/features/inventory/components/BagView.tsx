import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck,
  Plus,
  Warehouse,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Info,
  Calendar,
  Tag,
  AlertTriangle,
} from '@/src/components/icons';
import Swal from 'sweetalert2';
import { apiClient } from '../../../services/api';
import { productsApi } from '../../products/api';
import { Bag, Product } from '../../../types';
import ProductPicker from '../../../components/ProductPicker';
import { useAuth } from '../../../contexts/AuthContext';

interface BagViewProps {
  onTriggerNotification?: (message: string) => void;
}

const REASON_CODES: Record<string, string> = {
  OPNAME_DISCREPANCY: 'Selisih Stock Opname',
  EXPIRATION: 'Barang Expired / Kadaluarsa',
  DAMAGED_IN_TRANSIT: 'Rusak Saat Pengiriman',
  SAMPLE_MARKETING: 'Pengeluaran Sampel Marketing',
  INTERNAL_CONSUMPTION: 'Pemakaian Internal Gudang',
  OTHER: 'Lain-lain',
};

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

const StatusPill = ({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'cyan' | 'emerald' | 'amber' | 'rose' }) => {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${tones[tone]}`}>
      {children}
    </span>
  );
};

export default function BagView({ onTriggerNotification }: BagViewProps) {
  const { authUser } = useAuth();
  const [bags, setBags] = useState<Bag[]>([]);
  const [selectedBag, setSelectedBag] = useState<Bag | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_approval' | 'approved' | 'rejected'>('all');

  // Pagination for BAG List (Left Panel)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Pagination for Detail Items Table (Right Panel)
  const [itemPage, setItemPage] = useState(1);
  const itemsPerPageDetail = 5;

  // New BAG Form State
  const [showNewModal, setShowNewModal] = useState(false);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string; warehouse_id: string }[]>([]);

  const [newBagDate, setNewBagDate] = useState('');
  const [newBagWarehouseId, setNewBagWarehouseId] = useState('');
  const [newBagLocationId, setNewBagLocationId] = useState('');
  const [newBagType, setNewBagType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [newBagReasonCode, setNewBagReasonCode] = useState('OPNAME_DISCREPANCY');
  const [newBagNotes, setNewBagNotes] = useState('');
  const [newBagItems, setNewBagItems] = useState<{ product_id: string; quantity: number; notes: string }[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBags();
    loadMasterData();
    setNewBagDate(new Date().toISOString().split('T')[0]);
  }, []);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Reset item pagination when selected bag changes
  useEffect(() => {
    setItemPage(1);
  }, [selectedBag?.id]);

  const fetchBags = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ data: Bag[] }>('/inventory/bags?include=warehouse,location,createdBy,approvedBy,approvalRequest,items.product');
      setBags(res.data);
      if (selectedBag) {
        const updated = res.data.find(b => b.id === selectedBag.id);
        if (updated) setSelectedBag(updated);
      }
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

  const getProduct = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  // Filtered BAGs
  const filteredBags = useMemo(() => {
    return bags.filter(bag => {
      if (statusFilter !== 'all' && bag.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        bag.bag_number.toLowerCase().includes(q) ||
        (bag.warehouse?.name && bag.warehouse.name.toLowerCase().includes(q)) ||
        (bag.notes && bag.notes.toLowerCase().includes(q)) ||
        (bag.reason_code && (REASON_CODES[bag.reason_code] || bag.reason_code).toLowerCase().includes(q))
      );
    });
  }, [bags, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredBags.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBags = filteredBags.slice(startIndex, startIndex + itemsPerPage);

  // Detail items pagination
  const detailItems = selectedBag?.items || [];
  const totalItemPages = Math.ceil(detailItems.length / itemsPerPageDetail);
  const paginatedDetailItems = detailItems.slice(
    (itemPage - 1) * itemsPerPageDetail,
    itemPage * itemsPerPageDetail
  );

  const canApprove = () => {
    if (!authUser || !authUser.role) return true;
    const roleCode = authUser.role.code?.toLowerCase() || '';
    if (['admin', 'superadmin', 'owner', 'manager', 'head_of_warehouse'].includes(roleCode)) {
      return true;
    }
    const permissions = authUser.role.permissions || [];
    const invPerm = permissions.find(p => p.module === 'inventory' && (p.action === 'approve' || p.action === 'all'));
    if (invPerm && invPerm.pivot?.access_level === 'full') {
      return true;
    }
    return permissions.some(p => (p.module === 'inventory' || p.module === 'approvals') && p.pivot?.access_level === 'full');
  };

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
        reason_code: newBagReasonCode,
        notes: newBagNotes,
        items: newBagItems,
      };
      await apiClient.post('/inventory/bags', payload);

      Swal.fire('Pengajuan Terkirim', 'Berita Acara Gudang berhasil diajukan dan menunggu persetujuan (Approval).', 'success');
      setShowNewModal(false);

      // Reset form
      setNewBagWarehouseId('');
      setNewBagLocationId('');
      setNewBagNotes('');
      setNewBagReasonCode('OPNAME_DISCREPANCY');
      setNewBagItems([]);

      await fetchBags();
      await loadMasterData();
    } catch (error) {
      console.error('Error submitting BAG:', error);
      Swal.fire('Gagal', 'Gagal memproses Berita Acara Gudang.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveBag = async (bagId: string) => {
    const result = await Swal.fire({
      title: 'Setujui Dokumen BAG?',
      text: 'Stok barang di gudang akan otomatis diperbarui dan dicatat ke mutasi kartu stok.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Setujui & Update Stok',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#059669',
    });

    if (!result.isConfirmed) return;

    setIsActionLoading(true);
    try {
      await apiClient.post(`/inventory/bags/${bagId}/approve`);
      Swal.fire('Disetujui!', 'Berita Acara Gudang berhasil disetujui dan stok fisik telah diperbarui.', 'success');
      await fetchBags();
      await loadMasterData();
    } catch (error: any) {
      console.error('Error approving BAG:', error);
      Swal.fire('Gagal', error?.response?.data?.message || 'Gagal menyetujui Berita Acara Gudang.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectBag = async (bagId: string) => {
    const { value: notes, isConfirmed } = await Swal.fire({
      title: 'Tolak Dokumen BAG?',
      input: 'textarea',
      inputPlaceholder: 'Masukkan alasan penolakan...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Tolak Dokumen',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#e11d48',
    });

    if (!isConfirmed) return;

    setIsActionLoading(true);
    try {
      await apiClient.post(`/inventory/bags/${bagId}/reject`, { notes });
      Swal.fire('Ditolak', 'Berita Acara Gudang telah ditolak.', 'info');
      await fetchBags();
    } catch (error: any) {
      console.error('Error rejecting BAG:', error);
      Swal.fire('Gagal', error?.response?.data?.message || 'Gagal menolak Berita Acara Gudang.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Menghitung nilai stok Sebelum (Before), Perubahan (+/-), dan Sesudah (After)
   */
  const calculateStockImpact = (
    qty: number,
    bagType: 'in' | 'out' | 'adjustment',
    status: string,
    currentStock: number
  ) => {
    const isApproved = status === 'approved';
    let before = 0;
    let change = 0;
    let after = 0;

    if (bagType === 'in') {
      if (isApproved) {
        before = currentStock - qty;
        change = qty;
        after = currentStock;
      } else {
        before = currentStock;
        change = qty;
        after = currentStock + qty;
      }
    } else if (bagType === 'out') {
      if (isApproved) {
        before = currentStock + qty;
        change = -qty;
        after = currentStock;
      } else {
        before = currentStock;
        change = -qty;
        after = currentStock - qty;
      }
    } else {
      // Adjustment (penetapan kuantitas riil)
      if (isApproved) {
        after = qty;
        before = currentStock;
        change = qty - before;
      } else {
        before = currentStock;
        after = qty;
        change = qty - currentStock;
      }
    }

    return { before, change, after, isApproved };
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <StatusPill tone="amber">PENDING APPROVAL</StatusPill>;
      case 'approved':
        return <StatusPill tone="emerald">APPROVED</StatusPill>;
      case 'rejected':
        return <StatusPill tone="rose">REJECTED</StatusPill>;
      case 'Final':
        return <StatusPill tone="emerald">FINAL</StatusPill>;
      default:
        return <StatusPill tone="slate">{status.toUpperCase()}</StatusPill>;
    }
  };

  const renderTypeBadge = (type: 'in' | 'out' | 'adjustment') => {
    switch (type) {
      case 'in':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <TrendingUp size={11} /> Masuk (In)
          </span>
        );
      case 'out':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <TrendingDown size={11} /> Keluar (Out)
          </span>
        );
      case 'adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <RefreshCw size={10} /> Penyesuaian (Adjustment)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      <Header
        icon={<FileCheck size={20} />}
        title="Berita Acara Gudang (BAG)"
        desc="Dokumen resmi pertanggungjawaban fisik penerimaan, pengeluaran, atau penyesuaian stok gudang dengan dual control approval."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PANEL KIRI: DAFTAR DOKUMEN BAG DENGAN FILTER & PAGINATION */}
        <div className="lg:col-span-4 space-y-4">
          <Panel className="p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Daftar Dokumen BAG</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Total {filteredBags.length} dokumen ditemukan</p>
              </div>
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition shadow-sm text-xs cursor-pointer"
              >
                <Plus size={13} />
                <span>Buat BAG</span>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg text-[10px] font-bold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`py-1 rounded text-center transition ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Semua ({bags.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending_approval')}
                className={`py-1 rounded text-center transition ${statusFilter === 'pending_approval' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Pending ({bags.filter(b => b.status === 'pending_approval').length})
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`py-1 rounded text-center transition ${statusFilter === 'approved' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                ACC ({bags.filter(b => b.status === 'approved').length})
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`py-1 rounded text-center transition ${statusFilter === 'rejected' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Tolak ({bags.filter(b => b.status === 'rejected').length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari No. BAG, Gudang, atau Catatan..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* List BAG */}
            {isLoading ? (
              <div className="flex justify-center py-10">
                <RefreshCw className="animate-spin text-slate-400" size={20} />
              </div>
            ) : filteredBags.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <FileCheck size={28} className="mx-auto mb-2 text-slate-300" />
                <p>Tidak ada dokumen BAG yang sesuai filter.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {paginatedBags.map((bag) => (
                  <div
                    key={bag.id}
                    onClick={() => setSelectedBag(bag)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${selectedBag?.id === bag.id
                      ? 'border-cyan-500 bg-cyan-50/40 shadow-sm ring-1 ring-cyan-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-slate-800 text-[11px]">{bag.bag_number}</span>
                      {renderStatusBadge(bag.status)}
                    </div>
                    <div className="flex items-center justify-between text-slate-600 font-medium mb-1">
                      <span className="flex items-center gap-1 truncate max-w-[140px]" title={bag.warehouse?.name}>
                        <Warehouse size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{bag.warehouse?.name}</span>
                      </span>
                      {renderTypeBadge(bag.type)}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 border-t pt-1.5 border-slate-100">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} className="text-slate-300" />
                        {bag.date}
                      </span>
                      <span className="font-semibold text-slate-500">{bag.items?.length || 0} Item Barang</span>
                    </div>
                  </div>
                ))}

                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] font-mono">
                  <span className="text-slate-400">
                    Hal {currentPage} dari {Math.max(1, totalPages)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="p-1 px-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded font-bold cursor-pointer transition"
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft size={12} />
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                      .map((page, idx, arr) => (
                        <React.Fragment key={page}>
                          {idx > 0 && page - arr[idx - 1] > 1 && (
                            <span className="px-1 text-slate-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-2 py-0.5 rounded font-bold transition ${currentPage === page
                              ? 'bg-slate-900 text-white'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="p-1 px-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded font-bold cursor-pointer transition"
                      title="Halaman Berikutnya"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* PANEL KANAN: DETAIL BAG DENGAN KOLOM BEFORE & AFTER DAN PAGINATION ITEM */}
        <div className="lg:col-span-8">
          {selectedBag ? (
            <Panel className="overflow-hidden">
              {/* Header Detail */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/60 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-mono font-bold text-slate-900 text-base">{selectedBag.bag_number}</h4>
                      {renderStatusBadge(selectedBag.status)}
                      {renderTypeBadge(selectedBag.type)}
                      {selectedBag.reason_code && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Tag size={10} />
                          {REASON_CODES[selectedBag.reason_code] || selectedBag.reason_code}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 font-medium text-[11px]">
                      Gudang: <strong className="text-slate-700">{selectedBag.warehouse?.name}</strong>
                      {selectedBag.location && <span> | Lokasi Rak: <strong className="text-slate-700">{selectedBag.location.name}</strong></span>}
                      <span> | Tanggal: <strong className="text-slate-700">{selectedBag.date}</strong></span>
                    </p>
                  </div>

                  {/* Tombol Approval (Dual Control) */}
                  {selectedBag.status === 'pending_approval' && canApprove() && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveBag(selectedBag.id)}
                        disabled={isActionLoading}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition flex items-center gap-1.5 text-xs shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle2 size={14} />
                        <span>Setujui & Update Stok</span>
                      </button>
                      <button
                        onClick={() => handleRejectBag(selectedBag.id)}
                        disabled={isActionLoading}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition flex items-center gap-1.5 text-xs shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        <XCircle size={14} />
                        <span>Tolak</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Audit Approval Info */}
                {selectedBag.approvedBy && (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>
                      Telah disetujui oleh <strong>{selectedBag.approvedBy.name}</strong> pada {selectedBag.approved_at || '-'}. Saldo stok fisik telah diselaraskan.
                    </span>
                  </div>
                )}

                {selectedBag.notes && (
                  <p className="text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200 text-[11px]">
                    Catatan Dokumen: "{selectedBag.notes}"
                  </p>
                )}

                {/* 4 Kartu Metrik Ringkasan */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tipe Mutasi</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                      {selectedBag.type === 'in' ? 'Barang Masuk (+)' : selectedBag.type === 'out' ? 'Barang Keluar (-)' : 'Penyesuaian (Set)'}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Macam Item</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block font-mono">
                      {detailItems.length} Produk
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Volume Mutasi</span>
                    <span className="font-bold text-cyan-700 text-xs mt-0.5 block font-mono">
                      {detailItems.reduce((acc, it) => acc + Number(it.quantity || 0), 0).toLocaleString('id-ID')} unit
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Efek Stok</span>
                    <span className={`font-bold text-xs mt-0.5 block ${selectedBag.status === 'approved' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {selectedBag.status === 'approved' ? 'Telah Diterapkan' : 'Belum Diterapkan'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabel Detail Item dengan BEFORE & AFTER yang Jelas */}
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[10px] uppercase tracking-wider font-mono text-slate-600">
                      <th className="p-3 pl-4">No</th>
                      <th className="p-3">Produk & SKU</th>
                      <th className="p-3 text-right">Stok Sebelum (Before)</th>
                      <th className="p-3 text-center">Perubahan / Mutasi</th>
                      <th className="p-3 text-right">Stok Sesudah (After)</th>
                      <th className="p-3">Keterangan Item</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {paginatedDetailItems.map((item, idx) => {
                      const product = getProduct(item.product_id);
                      const currentStock = Number(product?.stock ?? (item.product as any)?.stock ?? 0);
                      const unit = product?.unit || 'pcs';
                      const { before, change, after, isApproved } = calculateStockImpact(
                        Number(item.quantity),
                        selectedBag.type,
                        selectedBag.status,
                        currentStock
                      );

                      const rowNumber = (itemPage - 1) * itemsPerPageDetail + idx + 1;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3 pl-4 font-mono text-slate-400 text-[11px]">{rowNumber}</td>
                          <td className="p-3">
                            <p className="font-bold text-slate-800">{item.product?.name || product?.name || 'Item Tanpa Nama'}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{item.product?.sku || product?.sku || '-'}</p>
                          </td>

                          {/* STOK SEBELUM (BEFORE) */}
                          <td className="p-3 text-right">
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                              {before.toLocaleString('id-ID')} {unit}
                            </span>
                          </td>

                          {/* PERUBAHAN / MUTASI */}
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1 font-mono font-bold text-[11px] px-2 py-0.5 rounded border">
                              {change > 0 ? (
                                <span className="text-emerald-700 bg-emerald-50 border-emerald-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
                                  <TrendingUp size={11} /> +{change.toLocaleString('id-ID')} {unit}
                                </span>
                              ) : change < 0 ? (
                                <span className="text-rose-700 bg-rose-50 border-rose-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
                                  <TrendingDown size={11} /> {change.toLocaleString('id-ID')} {unit}
                                </span>
                              ) : (
                                <span className="text-slate-600 bg-slate-100 border-slate-200 px-2 py-0.5 rounded">
                                  0 {unit}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* STOK SESUDAH (AFTER) */}
                          <td className="p-3 text-right">
                            <div className="inline-flex flex-col items-end">
                              <span className={`font-mono font-black text-[11px] px-2.5 py-0.5 rounded border ${
                                isApproved
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-cyan-50 text-cyan-800 border-cyan-200'
                              }`}>
                                {after.toLocaleString('id-ID')} {unit}
                              </span>
                              <span className="text-[9px] text-slate-400 mt-0.5">
                                {isApproved ? 'Stok Terupdate' : 'Estimasi Menjadi'}
                              </span>
                            </div>
                          </td>

                          {/* KETERANGAN */}
                          <td className="p-3 text-slate-600 text-[11px]">
                            {item.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION ITEM DETAIL */}
              {totalItemPages > 1 && (
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-500">
                    Menampilkan item {(itemPage - 1) * itemsPerPageDetail + 1} - {Math.min(itemPage * itemsPerPageDetail, detailItems.length)} dari {detailItems.length} item
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setItemPage(p => Math.max(1, p - 1))}
                      disabled={itemPage <= 1}
                      className="px-2 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded font-bold cursor-pointer"
                    >
                      Prev
                    </button>
                    <span className="text-slate-600 font-bold px-1">
                      {itemPage} / {totalItemPages}
                    </span>
                    <button
                      onClick={() => setItemPage(p => Math.min(totalItemPages, p + 1))}
                      disabled={itemPage >= totalItemPages}
                      className="px-2 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded font-bold cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </Panel>
          ) : (
            <div className="flex flex-col justify-center items-center h-full min-h-80 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-8 text-center">
              <FileCheck size={36} className="mb-3 text-slate-300 stroke-[1.5]" />
              <h5 className="font-bold text-slate-700 text-sm">Pilih Dokumen BAG</h5>
              <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                Pilih salah satu dokumen Berita Acara Gudang di panel sebelah kiri untuk meninjau rincian perubahan stok Before dan After serta eksekusi approval.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL FORM: BUAT BAG BARU DENGAN LIVE BEFORE & AFTER PREVIEW */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="font-bold text-sm">Buat Berita Acara Gudang (BAG) Baru</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">Dokumen akan masuk ke antrian approval sebelum saldo stok diperbarui.</p>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmitBag} className="flex flex-col overflow-hidden flex-1">
              <div className="p-5 overflow-y-auto space-y-5">
                {/* Form Dokumen Induk */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={newBagDate}
                      onChange={(e) => setNewBagDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tipe Mutasi</label>
                    <select
                      value={newBagType}
                      onChange={(e) => setNewBagType(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="in">🟢 Barang Masuk (In) — Tambah Stok</option>
                      <option value="out">🔴 Barang Keluar (Out) — Kurangi Stok</option>
                      <option value="adjustment">🟡 Penyesuaian (Adjustment) — Set Stok Fisik</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Alasan (Reason Code)</label>
                    <select
                      value={newBagReasonCode}
                      onChange={(e) => setNewBagReasonCode(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      {Object.entries(REASON_CODES).map(([code, label]) => (
                        <option key={code} value={code}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Gudang Penyimpanan</label>
                    <select
                      required
                      value={newBagWarehouseId}
                      onChange={(e) => {
                        setNewBagWarehouseId(e.target.value);
                        setNewBagLocationId('');
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="">Pilih Gudang...</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Lokasi Rak (Opsional)</label>
                    <select
                      value={newBagLocationId}
                      onChange={(e) => setNewBagLocationId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      disabled={!newBagWarehouseId}
                    >
                      <option value="">Pilih Lokasi Rak...</option>
                      {availableLocations.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Catatan Dokumen</label>
                    <input
                      type="text"
                      value={newBagNotes}
                      onChange={(e) => setNewBagNotes(e.target.value)}
                      placeholder="Misal: Hasil audit mingguan / kerusakan transit"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Daftar Item dengan Preview Before & After */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-3 px-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">Rincian Item Barang & Kalkulasi Stok (Before ➔ After)</h4>
                      <p className="text-[10px] text-slate-500">Pilih produk dan masukkan kuantitas untuk melihat simulasi efek ke saldo stok fisik.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-cyan-700 cursor-pointer shadow-sm"
                    >
                      <Plus size={12} /> Tambah Baris Item
                    </button>
                  </div>

                  {newBagItems.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-white">
                      <Layers size={24} className="mx-auto mb-2 text-slate-300" />
                      Silakan klik tombol <strong>Tambah Baris Item</strong> di atas untuk menambahkan barang.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 bg-white">
                      {newBagItems.map((item, index) => {
                        const product = getProduct(item.product_id);
                        const currentStock = Number(product?.stock ?? 0);
                        const qty = Number(item.quantity || 0);
                        const unit = product?.unit || 'pcs';

                        let afterStock = currentStock;
                        let delta = qty;
                        if (newBagType === 'in') {
                          afterStock = currentStock + qty;
                          delta = qty;
                        } else if (newBagType === 'out') {
                          afterStock = currentStock - qty;
                          delta = -qty;
                        } else {
                          afterStock = qty;
                          delta = qty - currentStock;
                        }

                        const isDeficit = newBagType === 'out' && afterStock < 0;

                        return (
                          <div key={index} className="p-3.5 flex flex-col md:flex-row items-start md:items-center gap-3 hover:bg-slate-50/50 transition">
                            <span className="font-mono text-slate-400 text-xs w-6 shrink-0">{index + 1}.</span>

                            {/* Pemilih Produk */}
                            <div className="flex-1 min-w-[240px] space-y-1">
                              <ProductPicker
                                value={item.product_id}
                                onChange={(prod) => handleUpdateItem(index, 'product_id', prod.id)}
                              />
                              <input
                                type="text"
                                placeholder="Keterangan item (misal: pecah sudut, cacat cetak)..."
                                value={item.notes}
                                onChange={(e) => handleUpdateItem(index, 'notes', e.target.value)}
                                className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-[10px]"
                              />
                            </div>

                            {/* Input Qty */}
                            <div className="w-32 shrink-0">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                                {newBagType === 'adjustment' ? 'Qty Target Fisik' : 'Qty Mutasi'}
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  required
                                  min="0.01"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={item.quantity || ''}
                                  onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                                  {unit}
                                </span>
                              </div>
                            </div>

                            {/* Panel Visual Live Before & After */}
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 px-3 flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Before (Saat Ini)</span>
                                <span className="font-mono font-bold text-slate-700 text-[11px]">
                                  {currentStock.toLocaleString('id-ID')} {unit}
                                </span>
                              </div>

                              <ArrowRight size={14} className="text-slate-400 shrink-0" />

                              <div className="text-left">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">After (Menjadi)</span>
                                <span className={`font-mono font-bold text-[11px] ${
                                  isDeficit ? 'text-rose-600' : 'text-cyan-700'
                                }`}>
                                  {afterStock.toLocaleString('id-ID')} {unit}
                                </span>
                              </div>

                              {isDeficit && (
                                <span className="text-[9px] font-bold text-rose-600 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <AlertTriangle size={10} /> Defisit!
                                </span>
                              )}
                            </div>

                            {/* Tombol Hapus Baris */}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition shrink-0"
                              title="Hapus Baris"
                            >
                              <Plus size={16} className="rotate-45" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Total {newBagItems.length} item barang tercatat dalam formulir ini.
                </span>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 border border-slate-200 bg-white rounded-lg font-bold text-slate-600 hover:bg-slate-50 cursor-pointer text-xs transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 cursor-pointer text-xs shadow-md transition"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Ajukan Berita Acara Gudang'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
