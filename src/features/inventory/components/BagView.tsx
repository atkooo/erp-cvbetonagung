import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck,
  Plus,
  Warehouse,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Calendar,
  Tag,
  AlertTriangle,
  Check,
  X,
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
  <div className={`bg-white rounded-xl border border-slate-200 shadow-xs ${className}`}>
    {children}
  </div>
);

const Header = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <Panel className="p-5">
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">{icon}</div>
      <div>
        <h3 className="font-sans font-bold text-sm text-slate-800">{title}</h3>
        <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
      </div>
    </div>
  </Panel>
);

const StatusPill = ({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'sky' | 'emerald' | 'amber' | 'rose' }) => {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${tones[tone]}`}>
      {children}
    </span>
  );
};

export default function BagView({ onTriggerNotification }: BagViewProps) {
  const { authUser, userRoleCode } = useAuth();
  const [bags, setBags] = useState<Bag[]>([]);
  const [selectedBag, setSelectedBag] = useState<Bag | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_approval' | 'approved' | 'rejected'>('all');

  // Multi-select & Bulk Action State
  const [selectedBagIds, setSelectedBagIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // Pagination for BAG List (Left Panel)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Pagination for Detail Items Table (Right Panel)
  const [itemPage, setItemPage] = useState(1);
  const itemsPerPageDetail = 5;

  // New BAG Form State
  const [showNewModal, setShowNewModal] = useState(false);
  const [autoApproveOnCreate, setAutoApproveOnCreate] = useState(true);
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
    if (!authUser) return true;
    const code = (userRoleCode || authUser.role?.code || '').toLowerCase();
    if (['admin', 'superadmin', 'super_admin', 'owner', 'manager', 'head_of_warehouse', 'inventory'].includes(code)) {
      return true;
    }
    const permissions = authUser.role?.permissions || [];
    const bagPerm = permissions.find(
      p => (p.module === 'berita_acara_gudang' || p.module === 'inventory' || p.module === 'approvals' || p.module === 'stock_opname') &&
           (p.action === 'approve' || p.action === 'all')
    );
    if (bagPerm && bagPerm.pivot?.access_level === 'full') {
      return true;
    }
    return permissions.some(
      p => (p.module === 'berita_acara_gudang' || p.module === 'inventory' || p.module === 'approvals') &&
           p.pivot?.access_level === 'full'
    );
  };

  // Multi-select for bulk approval/rejection
  const pendingSelectedBags = useMemo(() => {
    return bags.filter(b => selectedBagIds.includes(b.id) && b.status === 'pending_approval');
  }, [bags, selectedBagIds]);

  const handleSelectAllPending = () => {
    const currentPendingIds = paginatedBags.filter(b => b.status === 'pending_approval').map(b => b.id);
    const allSelected = currentPendingIds.every(id => selectedBagIds.includes(id));
    if (allSelected) {
      setSelectedBagIds(prev => prev.filter(id => !currentPendingIds.includes(id)));
    } else {
      setSelectedBagIds(prev => Array.from(new Set([...prev, ...currentPendingIds])));
    }
  };

  const handleToggleSelectBag = (e: React.MouseEvent, bagId: string) => {
    e.stopPropagation();
    setSelectedBagIds(prev =>
      prev.includes(bagId) ? prev.filter(id => id !== bagId) : [...prev, bagId]
    );
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
    const willAutoApprove = autoApproveOnCreate && canApprove();
    try {
      const payload = {
        date: newBagDate,
        warehouse_id: newBagWarehouseId,
        location_id: newBagLocationId || undefined,
        type: newBagType,
        reason_code: newBagReasonCode,
        notes: newBagNotes,
        auto_approve: willAutoApprove,
        items: newBagItems,
      };
      await apiClient.post('/inventory/bags', payload);

      if (willAutoApprove) {
        Swal.fire('Berhasil Disimpan', 'Berita Acara Gudang berhasil disetujui dan stok fisik langsung diselaraskan.', 'success');
        onTriggerNotification?.('Berita Acara Gudang disetujui & stok diperbarui.');
      } else {
        Swal.fire('Tersimpan', 'Berita Acara Gudang berhasil disimpan. Anda dapat menyetujuinya langsung di menu ini.', 'success');
        onTriggerNotification?.('Berita Acara Gudang baru berhasil dibuat.');
      }

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
      confirmButtonColor: '#0284c7',
    });

    if (!result.isConfirmed) return;

    setIsActionLoading(true);
    try {
      await apiClient.post(`/inventory/bags/${bagId}/approve`);
      Swal.fire('Disetujui', 'Berita Acara Gudang berhasil disetujui dan stok fisik telah diperbarui.', 'success');
      onTriggerNotification?.('Berita Acara Gudang berhasil disetujui.');
      setSelectedBagIds(prev => prev.filter(id => id !== bagId));
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
      confirmButtonText: 'Tolak Dokumen',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#e11d48',
    });

    if (!isConfirmed) return;

    setIsActionLoading(true);
    try {
      await apiClient.post(`/inventory/bags/${bagId}/reject`, { notes });
      Swal.fire('Ditolak', 'Berita Acara Gudang telah ditolak.', 'info');
      onTriggerNotification?.('Berita Acara Gudang ditolak.');
      setSelectedBagIds(prev => prev.filter(id => id !== bagId));
      await fetchBags();
    } catch (error: any) {
      console.error('Error rejecting BAG:', error);
      Swal.fire('Gagal', error?.response?.data?.message || 'Gagal menolak Berita Acara Gudang.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    if (pendingSelectedBags.length === 0) return;
    const result = await Swal.fire({
      title: 'Setujui Dokumen Terpilih?',
      text: `Setujui ${pendingSelectedBags.length} dokumen Berita Acara Gudang sekaligus? Saldo stok fisik di gudang akan langsung diperbarui.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Setujui Semua',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#0284c7',
    });

    if (!result.isConfirmed) return;

    setIsBulkLoading(true);
    let successCount = 0;
    try {
      for (const bag of pendingSelectedBags) {
        await apiClient.post(`/inventory/bags/${bag.id}/approve`);
        successCount++;
      }
      Swal.fire('Disetujui', `${successCount} dokumen Berita Acara Gudang berhasil disetujui.`, 'success');
      onTriggerNotification?.(`${successCount} dokumen BAG disetujui.`);
      setSelectedBagIds(prev => prev.filter(id => !pendingSelectedBags.some(b => b.id === id)));
      await fetchBags();
      await loadMasterData();
    } catch (error: any) {
      console.error('Error bulk approving BAGs:', error);
      Swal.fire('Info', `Hanya ${successCount} dari ${pendingSelectedBags.length} yang berhasil disetujui.`, 'warning');
      await fetchBags();
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (pendingSelectedBags.length === 0) return;
    const { value: notes, isConfirmed } = await Swal.fire({
      title: 'Tolak Dokumen Terpilih?',
      input: 'textarea',
      inputPlaceholder: 'Masukkan catatan penolakan...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Tolak Semua',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#e11d48',
    });

    if (!isConfirmed) return;

    setIsBulkLoading(true);
    let successCount = 0;
    try {
      for (const bag of pendingSelectedBags) {
        await apiClient.post(`/inventory/bags/${bag.id}/reject`, { notes });
        successCount++;
      }
      Swal.fire('Ditolak', `${successCount} dokumen Berita Acara Gudang telah ditolak.`, 'info');
      onTriggerNotification?.(`${successCount} dokumen BAG ditolak.`);
      setSelectedBagIds(prev => prev.filter(id => !pendingSelectedBags.some(b => b.id === id)));
      await fetchBags();
    } catch (error: any) {
      console.error('Error bulk rejecting BAGs:', error);
      Swal.fire('Info', `Hanya ${successCount} dari ${pendingSelectedBags.length} yang berhasil ditolak.`, 'warning');
      await fetchBags();
    } finally {
      setIsBulkLoading(false);
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <TrendingUp size={11} /> Masuk (In)
          </span>
        );
      case 'out':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <TrendingDown size={11} /> Keluar (Out)
          </span>
        );
      case 'adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <RefreshCw size={10} /> Penyesuaian (Adjustment)
          </span>
        );
    }
  };

  const pendingInCurrentView = paginatedBags.filter(b => b.status === 'pending_approval');
  const allCurrentPendingSelected = pendingInCurrentView.length > 0 && pendingInCurrentView.every(b => selectedBagIds.includes(b.id));

  return (
    <div className="space-y-6 text-xs font-sans">
      <Header
        icon={<FileCheck size={20} />}
        title="Berita Acara Gudang (BAG)"
        desc="Dokumen resmi pertanggungjawaban fisik penerimaan, pengeluaran, atau penyesuaian stok gudang dengan persetujuan langsung di menu."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PANEL KIRI: DAFTAR DOKUMEN BAG DENGAN DIRECT APPROVAL & MULTI-SELECT */}
        <div className="lg:col-span-5 space-y-4">
          <Panel className="p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Daftar Dokumen BAG</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Total {filteredBags.length} dokumen ditemukan</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white rounded-xl font-semibold shadow-xs shadow-sky-500/20 transition text-xs cursor-pointer active:scale-[0.98]"
              >
                <Plus size={13} />
                <span>Buat BAG</span>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`py-1 rounded-lg text-center transition cursor-pointer ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Semua ({bags.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending_approval')}
                className={`py-1 rounded-lg text-center transition cursor-pointer ${statusFilter === 'pending_approval' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Pending ({bags.filter(b => b.status === 'pending_approval').length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('approved')}
                className={`py-1 rounded-lg text-center transition cursor-pointer ${statusFilter === 'approved' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Disetujui ({bags.filter(b => b.status === 'approved').length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('rejected')}
                className={`py-1 rounded-lg text-center transition cursor-pointer ${statusFilter === 'rejected' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Ditolak ({bags.filter(b => b.status === 'rejected').length})
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
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-sky-500 focus:bg-white text-slate-800"
              />
            </div>

            {/* Bulk Action Bar (Direct approval like Stock Opname) */}
            {canApprove() && pendingSelectedBags.length > 0 && (
              <div className="flex items-center justify-between p-2.5 bg-sky-50/80 border border-sky-200 rounded-xl text-[11px] animate-in fade-in-50 duration-150">
                <span className="font-semibold text-sky-900">
                  {pendingSelectedBags.length} BAG dipilih
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleBulkApprove}
                    disabled={isBulkLoading}
                    className="px-2.5 py-1 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-semibold rounded-lg text-[10px] shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50 transition active:scale-[0.98]"
                  >
                    <Check size={12} />
                    <span>Setujui ({pendingSelectedBags.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkReject}
                    disabled={isBulkLoading}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer disabled:opacity-50 transition active:scale-[0.98]"
                  >
                    <X size={12} />
                    <span>Tolak</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBagIds([])}
                    className="px-2 py-1 text-slate-500 hover:text-slate-800 rounded-lg text-[10px] font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Select All Pending Shortcut */}
            {canApprove() && pendingInCurrentView.length > 0 && (
              <div className="flex items-center justify-between px-1 text-[10px] text-slate-500">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800">
                  <input
                    type="checkbox"
                    checked={allCurrentPendingSelected}
                    onChange={handleSelectAllPending}
                    className="w-3.5 h-3.5 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                  />
                  <span>Pilih Semua Pending di Halaman Ini</span>
                </label>
              </div>
            )}

            {/* List BAG Cards */}
            {isLoading ? (
              <div className="flex justify-center py-10">
                <RefreshCw className="animate-spin text-slate-400" size={20} />
              </div>
            ) : filteredBags.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileCheck size={28} className="mx-auto mb-2 text-slate-300" />
                <p>Tidak ada dokumen BAG yang sesuai filter.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {paginatedBags.map((bag) => {
                  const isPending = bag.status === 'pending_approval';
                  const isSelected = selectedBag?.id === bag.id;
                  const isChecked = selectedBagIds.includes(bag.id);

                  return (
                    <div
                      key={bag.id}
                      onClick={() => setSelectedBag(bag)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition relative ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/40 shadow-xs ring-1 ring-sky-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          {canApprove() && isPending && (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onClick={(e) => handleToggleSelectBag(e, bag.id)}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer shrink-0 mt-0.5"
                            />
                          )}
                          <span className="font-mono font-bold text-slate-800 text-[11px]">{bag.bag_number}</span>
                        </div>
                        {renderStatusBadge(bag.status)}
                      </div>

                      <div className="flex items-center justify-between text-slate-600 font-medium mb-1">
                        <span className="flex items-center gap-1 truncate max-w-[150px]" title={bag.warehouse?.name}>
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

                      {/* Direct Inline Action Buttons (Like Stock Opname) */}
                      {isPending && canApprove() && (
                        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveBag(bag.id);
                            }}
                            disabled={isActionLoading}
                            title="Setujui Langsung & Update Stok"
                            className="flex-1 py-1.5 px-2.5 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1 transition shadow-xs shadow-sky-500/20 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                          >
                            <CheckCircle2 size={13} />
                            <span>Setujui Langsung</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectBag(bag.id);
                            }}
                            disabled={isActionLoading}
                            title="Tolak Dokumen"
                            className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer active:scale-[0.98] disabled:opacity-50"
                          >
                            <XCircle size={13} />
                            <span>Tolak</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] font-mono">
                  <span className="text-slate-400">
                    Hal {currentPage} dari {Math.max(1, totalPages)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="p-1 px-2 bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-bold cursor-pointer transition"
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft size={12} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                      .map((page, idx, arr) => (
                        <React.Fragment key={page}>
                          {idx > 0 && page - arr[idx - 1] > 1 && (
                            <span className="px-1 text-slate-400">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`px-2 py-0.5 rounded-lg font-bold transition cursor-pointer ${
                              currentPage === page
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-sky-50'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}

                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="p-1 px-2 bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-bold cursor-pointer transition"
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

        {/* PANEL KANAN: DETAIL BAG DENGAN SIMULASI BEFORE & AFTER SERTA TOMBOL APPROVAL */}
        <div className="lg:col-span-7">
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <Tag size={10} />
                          {REASON_CODES[selectedBag.reason_code] || selectedBag.reason_code}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 font-medium text-[11px]">
                      Gudang: <strong className="text-slate-700">{selectedBag.warehouse?.name}</strong>
                      {selectedBag.location && <span> | Lokasi: <strong className="text-slate-700">{selectedBag.location.name}</strong></span>}
                      <span> | Tanggal: <strong className="text-slate-700">{selectedBag.date}</strong></span>
                    </p>
                  </div>

                  {/* Tombol Approval Langsung di Menu (Direct Approval) */}
                  {selectedBag.status === 'pending_approval' && canApprove() && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleApproveBag(selectedBag.id)}
                        disabled={isActionLoading}
                        className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-semibold rounded-xl transition flex items-center gap-1.5 text-xs shadow-xs shadow-sky-500/20 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                      >
                        <CheckCircle2 size={14} />
                        <span>Setujui & Update Stok</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectBag(selectedBag.id)}
                        disabled={isActionLoading}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-xl transition flex items-center gap-1.5 text-xs shadow-xs disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                      >
                        <XCircle size={14} />
                        <span>Tolak</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Audit Approval Info */}
                {selectedBag.approvedBy && (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>
                      Telah disetujui oleh <strong>{selectedBag.approvedBy.name}</strong> pada {selectedBag.approved_at || '-'}. Saldo stok fisik telah diselaraskan.
                    </span>
                  </div>
                )}

                {selectedBag.notes && (
                  <p className="text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200 text-[11px]">
                    Catatan Dokumen: "{selectedBag.notes}"
                  </p>
                )}

                {/* 4 Kartu Metrik Ringkasan */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tipe Mutasi</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                      {selectedBag.type === 'in' ? 'Barang Masuk (+)' : selectedBag.type === 'out' ? 'Barang Keluar (-)' : 'Penyesuaian (Set)'}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Macam Item</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block font-mono">
                      {detailItems.length} Produk
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Volume Mutasi</span>
                    <span className="font-bold text-sky-700 text-xs mt-0.5 block font-mono">
                      {detailItems.reduce((acc, it) => acc + Number(it.quantity || 0), 0).toLocaleString('id-ID')} unit
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Efek Stok</span>
                    <span className={`font-bold text-xs mt-0.5 block ${selectedBag.status === 'approved' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {selectedBag.status === 'approved' ? 'Telah Diterapkan' : 'Belum Diterapkan'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabel Detail Item dengan BEFORE & AFTER */}
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
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[11px]">
                              {before.toLocaleString('id-ID')} {unit}
                            </span>
                          </td>

                          {/* PERUBAHAN / MUTASI */}
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1 font-mono font-bold text-[11px]">
                              {change > 0 ? (
                                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                  <TrendingUp size={11} /> +{change.toLocaleString('id-ID')} {unit}
                                </span>
                              ) : change < 0 ? (
                                <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                  <TrendingDown size={11} /> {change.toLocaleString('id-ID')} {unit}
                                </span>
                              ) : (
                                <span className="text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                  0 {unit}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* STOK SESUDAH (AFTER) */}
                          <td className="p-3 text-right">
                            <div className="inline-flex flex-col items-end">
                              <span className={`font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-md border ${
                                isApproved
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-sky-50 text-sky-800 border-sky-200'
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
                      type="button"
                      onClick={() => setItemPage(p => Math.max(1, p - 1))}
                      disabled={itemPage <= 1}
                      className="px-2 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-bold cursor-pointer transition"
                    >
                      Prev
                    </button>
                    <span className="text-slate-600 font-bold px-1">
                      {itemPage} / {totalItemPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setItemPage(p => Math.min(totalItemPages, p + 1))}
                      disabled={itemPage >= totalItemPages}
                      className="px-2 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-bold cursor-pointer transition"
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

      {/* MODAL FORM: BUAT BAG BARU DENGAN DIRECT APPROVAL OPTION */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 border border-slate-200">
            <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-sky-50 via-white to-sky-50/30">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Buat Berita Acara Gudang (BAG) Baru</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Catat perubahan fisik stok masuk, keluar, atau koreksi selisih gudang.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitBag} className="flex flex-col overflow-hidden flex-1">
              <div className="p-5 overflow-y-auto space-y-4">
                {/* Opsi Persetujuan Langsung (Direct Approval) */}
                {canApprove() && (
                  <div className="flex items-center justify-between p-3.5 bg-sky-50/70 rounded-xl border border-sky-100">
                    <div>
                      <span className="font-semibold text-xs text-sky-900 block">Persetujuan Langsung (Direct Approval)</span>
                      <span className="text-[10px] text-sky-700 block">Setujui dokumen dan selaraskan saldo stok fisik seketika saat disimpan.</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoApproveOnCreate}
                        onChange={(e) => setAutoApproveOnCreate(e.target.checked)}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-sky-900">Setujui Langsung</span>
                    </label>
                  </div>
                )}

                {/* Form Dokumen Induk */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={newBagDate}
                      onChange={(e) => setNewBagDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tipe Mutasi</label>
                    <select
                      value={newBagType}
                      onChange={(e) => setNewBagType(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 text-slate-800"
                    >
                      <option value="in">Barang Masuk (In) — Tambah Stok</option>
                      <option value="out">Barang Keluar (Out) — Kurangi Stok</option>
                      <option value="adjustment">Penyesuaian (Adjustment) — Set Stok Fisik</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Alasan (Reason Code)</label>
                    <select
                      value={newBagReasonCode}
                      onChange={(e) => setNewBagReasonCode(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500 text-slate-800"
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
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500 text-slate-800"
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
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500 text-slate-800"
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
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500 text-slate-800"
                    />
                  </div>
                </div>

                {/* Daftar Item dengan Preview Before & After */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="p-3 px-4 bg-slate-100/70 border-b border-slate-200 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">Rincian Item Barang & Kalkulasi Stok (Before ➔ After)</h4>
                      <p className="text-[10px] text-slate-500">Pilih produk dan masukkan kuantitas untuk melihat simulasi efek ke saldo stok fisik.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs shadow-sky-500/20 transition active:scale-[0.98]"
                    >
                      <Plus size={13} />
                      <span>Tambah Item</span>
                    </button>
                  </div>

                  {newBagItems.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-white">
                      <Layers size={24} className="mx-auto mb-2 text-slate-300" />
                      Silakan klik tombol <strong>Tambah Item</strong> di atas untuk menambahkan barang.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 bg-white">
                      {newBagItems.map((item, index) => {
                        const product = getProduct(item.product_id);
                        const currentStock = Number(product?.stock ?? 0);
                        const qty = Number(item.quantity || 0);
                        const unit = product?.unit || 'pcs';

                        let afterStock = currentStock;
                        if (newBagType === 'in') {
                          afterStock = currentStock + qty;
                        } else if (newBagType === 'out') {
                          afterStock = currentStock - qty;
                        } else {
                          afterStock = qty;
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
                                className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-sky-500 text-slate-800"
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
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-sky-500 text-slate-800"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                                  {unit}
                                </span>
                              </div>
                            </div>

                            {/* Panel Visual Live Before & After */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 px-3 flex items-center gap-3 shrink-0">
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
                                  isDeficit ? 'text-rose-600' : 'text-sky-700'
                                }`}>
                                  {afterStock.toLocaleString('id-ID')} {unit}
                                </span>
                              </div>

                              {isDeficit && (
                                <span className="text-[9px] font-bold text-rose-600 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
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
                              <X size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 px-6 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Total {newBagItems.length} item barang tercatat.
                </span>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 border border-slate-200 bg-white rounded-xl font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer text-xs transition active:scale-[0.98]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white rounded-xl font-semibold shadow-xs shadow-sky-500/20 disabled:opacity-50 cursor-pointer text-xs transition active:scale-[0.98]"
                  >
                    {isSubmitting
                      ? 'Menyimpan...'
                      : autoApproveOnCreate && canApprove()
                        ? 'Simpan & Setujui Langsung'
                        : 'Simpan Dokumen BAG'}
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
