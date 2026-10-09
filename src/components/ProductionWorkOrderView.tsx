/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Factory, Plus, Search, CheckCircle2, X, Clock, HelpCircle,
  FileText, Send, Check, UserCheck, Calendar, Clipboard, AlertCircle, Trash2,
  Package, Building2, Warehouse, ChevronRight, ChevronDown, Layers
} from '@/src/components/icons';
import SearchableSelect from './SearchableSelect';
import { authStorage, apiClient } from '../services/api';
import { productionApi } from '../features/production/api';
import { productsApi } from '../features/products/api';
import { employeesApi } from '../features/employees/api';
import { projectsApi } from '../features/projects/api';
import { salesApi } from '../features/sales/api';
import { SkeletonTable, SkeletonCard, ErrorCard } from './Skeleton';
import { ProductionWorkOrder, ProductionWorkLog, Employee, Product, Project, SalesOrder, StockProductionRequest } from '../types';
import Swal from 'sweetalert2';
import { toApiDate } from '../utils/date';

interface ProductionWorkOrderViewProps {
  initialWoId?: string | null;
  onNavigateToProject?: (projectId: string) => void;
  onTriggerNotification: (message: string) => void;
}

export default function ProductionWorkOrderView({ initialWoId, onNavigateToProject, onTriggerNotification }: ProductionWorkOrderViewProps) {
  const [workOrders, setWorkOrders] = useState<ProductionWorkOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [stockRequests, setStockRequests] = useState<StockProductionRequest[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWoId, setSelectedWoId] = useState<string | null>(null);
  const [referenceFilter, setReferenceFilter] = useState<'all' | 'sales_order' | 'project' | 'stock_request'>('all');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSprModalOpen, setIsSprModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isUpdateStageModalOpen, setIsUpdateStageModalOpen] = useState(false);

  // Form States - Create WO
  const [createRefType, setCreateRefType] = useState<'sales_order' | 'project' | 'stock_request'>('sales_order');
  const [newWoNumber, setNewWoNumber] = useState('AUTO GENERATED');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState('');
  const [selectedSalesOrderItemIndex, setSelectedSalesOrderItemIndex] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedSprId, setSelectedSprId] = useState('');
  const [selectedSprItemIndex, setSelectedSprItemIndex] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [targetQty, setTargetQty] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [stage, setStage] = useState('Cetak & Curing');

  // Form States - Create SPR
  const [sprLocationId, setSprLocationId] = useState('');
  const [sprDueDate, setSprDueDate] = useState('');
  const [sprNotes, setSprNotes] = useState('');
  const [sprItems, setSprItems] = useState<Array<{ product_id: string; target_qty: number; notes: string }>>([
    { product_id: '', target_qty: 100, notes: '' }
  ]);

  // Form States - Input Log
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [logWorkDate, setLogWorkDate] = useState(toApiDate());
  const [logStage, setLogStage] = useState('Cetak & Curing');
  const [logMaxQty, setLogMaxQty] = useState<number | null>(null);
  const [madeQty, setMadeQty] = useState(0);
  const [rejectQty, setRejectQty] = useState(0);
  const [okQty, setOkQty] = useState(0);
  const [logNotes, setLogNotes] = useState('');

  // Form States - Update Stage
  const [updateStageValue, setUpdateStageValue] = useState('Cetak & Curing');

  // Form States - Receive Stock
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receiveQty, setReceiveQty] = useState(0);
  const [receiveTargetLocationId, setReceiveTargetLocationId] = useState('');
  const [receiveSourceLocationId, setReceiveSourceLocationId] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [wos, prods, emps, projs, sos, locRes, sprs] = await Promise.all([
        productionApi.getWorkOrders(),
        productsApi.getProducts(),
        employeesApi.getEmployees(),
        projectsApi.getProjects(),
        salesApi.getSalesOrders(),
        apiClient.get<{ data: any[] }>('/master-data/storage-locations'),
        productionApi.getStockProductionRequests().catch(() => [])
      ]);
      setWorkOrders(wos);
      setProducts(prods);
      setEmployees(emps.filter(e => e.status === 'Aktif'));
      setProjects(projs);
      setSalesOrders(sos);
      setLocations(locRes.data || []);
      setStockRequests(sprs || []);

      if (initialWoId) {
        setSelectedWoId(initialWoId);
      } else if (wos.length > 0) {
        setSelectedWoId(wos[0].id);
      }
    } catch (err) {
      console.error('Failed to load production data', err);
      const msg = err instanceof Error ? err.message : 'Gagal mengambil data produksi';
      setErrorMessage(msg);
      onTriggerNotification(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (initialWoId) {
      setSelectedWoId(initialWoId);
    }
  }, [initialWoId]);

  const getItemOutstandingQty = React.useCallback((soId: string, item: any) => {
    if (!item.productId) return 0;

    // Check if SO is from POS and find its PO quantity from draft delivery orders
    const so = salesOrders.find(s => s.id === soId);
    let requiredQty = item.pieceCount || item.quantity;

    if (so && so.source === 'pos') {
      const poQty = so.deliveryOrders?.filter(d => d.status === 'draft' || d.status === 'ready_to_load')
        .flatMap(d => d.items || [])
        .filter(di => di.productId === item.productId)
        .reduce((sum, di) => sum + di.quantity, 0) || 0;

      // If it's from POS and not in a Draft DO, it's not a PO item, so requiredQty is 0
      requiredQty = poQty;
    }

    const itemWos = workOrders.filter(wo => wo.salesOrderId === soId && wo.productId === item.productId);
    let totalExpectedYield = 0;
    for (const wo of itemWos) {
      const totalReject = wo.logs?.reduce((sum, l) => sum + l.rejectQty, 0) || 0;
      totalExpectedYield += Math.max(0, wo.targetQty - totalReject);
    }
    return Math.max(0, requiredQty - totalExpectedYield);
  }, [workOrders, salesOrders]);

  const activeSalesOrders = React.useMemo(() => {
    return salesOrders.filter(so => {
      if (!so.items || so.items.length === 0) return false;
      if (so.status === 'Dibatalkan' || so.status === 'Selesai' || so.status === 'Draft') return false;
      return so.items.some(item => getItemOutstandingQty(so.id, item) > 0);
    });
  }, [salesOrders, getItemOutstandingQty]);

  const applySalesOrderItemToForm = (salesOrder: SalesOrder, itemIndex: number) => {
    const item = salesOrder.items?.[itemIndex];
    if (!item?.productId) return;

    const outstanding = getItemOutstandingQty(salesOrder.id, item);

    setSelectedSalesOrderItemIndex(String(itemIndex));
    setSelectedProductId(item.productId);
    setTargetQty(outstanding);

    let label = `SO: ${salesOrder.orderNumber}`;
    if (item.pieceCount && item.length) {
      label += ` [${item.pieceCount} Fisik @ ${item.length} M]`;
    }
    setSourceLabel(label);
  };

  const handleOpenCreateModal = () => {
    setCreateRefType('sales_order');
    setNewWoNumber('AUTO GENERATED');
    setSelectedProductId('');
    setSelectedSalesOrderId('');
    setSelectedSalesOrderItemIndex('');
    setSelectedProjectId('');
    setSelectedSprId('');
    setSelectedSprItemIndex('');
    setSourceLabel('');
    setTargetQty(100);
    setDueDate(toApiDate(new Date(Date.now() + 7 * 24 * 3600 * 1000)));
    setStage('Cetak & Curing');
    setIsCreateModalOpen(true);
  };

  const handleOpenSprModal = () => {
    setSprLocationId(locations[0]?.id || '');
    setSprDueDate(toApiDate(new Date(Date.now() + 7 * 24 * 3600 * 1000)));
    setSprNotes('');
    setSprItems([{ product_id: '', target_qty: 100, notes: '' }]);
    setIsSprModalOpen(true);
  };

  const handleCreateSpr = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = sprItems.filter(item => item.product_id && item.target_qty > 0);
    if (validItems.length === 0) {
      onTriggerNotification('Mohon tambahkan minimal satu produk dengan target jumlah yang valid.');
      return;
    }

    try {
      const created = await productionApi.createStockProductionRequest({
        storage_location_id: sprLocationId || undefined,
        request_date: toApiDate(),
        due_date: sprDueDate || undefined,
        notes: sprNotes || undefined,
        items: validItems
      });

      setStockRequests(prev => [created, ...prev]);
      onTriggerNotification(`Permintaan Stok ${created.requestNumber} berhasil dibuat.`);
      setIsSprModalOpen(false);
      setReferenceFilter('stock_request');
    } catch (err) {
      console.error('Failed to create SPR', err);
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal membuat Permintaan Produksi Stok');
    }
  };

  const handleApproveSpr = async (sprId: string, sprNumber: string) => {
    const result = await Swal.fire({
      title: 'Setujui Permintaan Stok?',
      text: `Permintaan ${sprNumber} akan disetujui dan sistem akan otomatis menerbitkan Work Order untuk seluruh item terkait.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Terbitkan WO!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await productionApi.approveStockProductionRequest(sprId);
      setStockRequests(prev => prev.map(s => s.id === sprId ? res.request : s));
      if (res.workOrders && res.workOrders.length > 0) {
        setWorkOrders(prev => [...res.workOrders, ...prev]);
        setSelectedWoId(res.workOrders[0].id);
      }
      onTriggerNotification(`Permintaan Stok ${sprNumber} disetujui & ${res.workOrders.length} Work Order berhasil diterbitkan.`);
    } catch (err) {
      console.error('Failed to approve SPR', err);
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal menyetujui Permintaan Stok');
    }
  };

  const handleCreateWo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWoNumber || !selectedProductId || targetQty <= 0) {
      onTriggerNotification('Mohon lengkapi semua field utama.');
      return;
    }

    if (createRefType === 'sales_order') {
      if (!selectedSalesOrderId) {
        onTriggerNotification('Mohon pilih Sales Order sebagai referensi.');
        return;
      }
      const selectedSalesOrder = salesOrders.find(s => s.id === selectedSalesOrderId);
      const selectedSalesOrderItem = selectedSalesOrderItemIndex !== ''
        ? selectedSalesOrder?.items?.[Number(selectedSalesOrderItemIndex)]
        : undefined;
      const requiredQty = selectedSalesOrderItem ? getItemOutstandingQty(selectedSalesOrderId, selectedSalesOrderItem) : 0;
      if (selectedSalesOrderItem && targetQty < requiredQty) {
        onTriggerNotification(
          `Target produksi tidak boleh kurang dari kebutuhan sisa SO (Indent/PO): ${requiredQty}.`
        );
        return;
      }
    } else if (createRefType === 'project') {
      if (!selectedProjectId) {
        onTriggerNotification('Mohon pilih Proyek Konstruksi sebagai referensi.');
        return;
      }
    } else if (createRefType === 'stock_request') {
      if (!selectedSprId) {
        onTriggerNotification('Mohon pilih Dokumen Permintaan Stok (SPR) sebagai referensi.');
        return;
      }
    }

    try {
      let label = sourceLabel;
      if (createRefType === 'sales_order') {
        const so = salesOrders.find(s => s.id === selectedSalesOrderId);
        if (!label) label = so ? `SO: ${so.orderNumber} - ${so.customerName || 'Pelanggan'}` : '';
      } else if (createRefType === 'project') {
        const pr = projects.find(p => p.id === selectedProjectId);
        if (!label) label = pr ? `Proyek: ${pr.projectName}` : '';
      } else if (createRefType === 'stock_request') {
        const spr = stockRequests.find(s => s.id === selectedSprId);
        if (!label) label = spr ? `SPR: ${spr.requestNumber} - Restok Gudang` : '';
      }

      const payload: any = {
        work_order_number: newWoNumber,
        product_id: selectedProductId,
        stage,
        target_qty: targetQty,
        due_date: dueDate || null,
        source_label: label || 'Stok Gudang',
      };
      if (createRefType === 'sales_order' && selectedSalesOrderId) payload.sales_order_id = selectedSalesOrderId;
      if (createRefType === 'project' && selectedProjectId) payload.project_id = selectedProjectId;
      if (createRefType === 'stock_request' && selectedSprId) payload.stock_production_request_id = selectedSprId;

      const created = await productionApi.createWorkOrder(payload);
      setWorkOrders(prev => [created, ...prev]);
      setSelectedWoId(created.id);
      onTriggerNotification(`Work Order ${newWoNumber} berhasil dibuat dengan referensi sah.`);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Failed to create Work Order', err);
      onTriggerNotification('Gagal membuat Work Order baru.');
    }
  };

  const handleOpenLogModal = () => {
    setSelectedEmployeeId(employees[0]?.id || '');
    setLogWorkDate(toApiDate());
    setLogStage(selectedWo?.stage || 'Cetak & Curing');
    setMadeQty(0);
    setRejectQty(0);
    setOkQty(0);
    setLogNotes('');
    setIsLogModalOpen(true);
  };

  const handleMadeQtyChange = (val: number) => {
    setMadeQty(val);
    let newReject = rejectQty;
    if (newReject > val) newReject = val; // Force reject to not exceed madeQty
    setRejectQty(newReject);
    setOkQty(Math.max(0, val - newReject));
  };

  const handleRejectQtyChange = (val: number) => {
    let newReject = val;
    if (newReject > madeQty) newReject = madeQty; // Reject cannot exceed total made
    setRejectQty(newReject);
    setOkQty(Math.max(0, madeQty - newReject));
  };

  const handleCreateWorkLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWoId || !selectedEmployeeId || madeQty <= 0) {
      onTriggerNotification('Mohon lengkapi data hasil produksi.');
      return;
    }

    try {
      const payload = {
        work_order_id: selectedWoId,
        employee_id: selectedEmployeeId,
        work_date: logWorkDate,
        stage: logStage,
        made_qty: madeQty,
        reject_qty: rejectQty,
        ok_qty: okQty,
        notes: logNotes || undefined
      };

      const createdLog = await productionApi.createWorkLog(payload);

      // Refresh work orders to recalculate progress & logs
      const refreshedWos = await productionApi.getWorkOrders();
      setWorkOrders(refreshedWos);
      onTriggerNotification(`Input harian untuk WO berhasil disimpan`);
      setIsLogModalOpen(false);
    } catch (err) {
      console.error('Failed to save production log', err);
      onTriggerNotification('Gagal menyimpan hasil harian.');
    }
  };

  const handleOpenUpdateStageModal = () => {
    if (!selectedWo) return;
    setUpdateStageValue(selectedWo.stage);
    setIsUpdateStageModalOpen(true);
  };

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWoId || !selectedWo) return;

    try {
      const updated = await productionApi.updateWorkOrder(selectedWoId, {
        stage: updateStageValue
      });
      setWorkOrders(prev => prev.map(w => w.id === selectedWoId ? updated : w));
      onTriggerNotification(`WO ${selectedWo.workOrderNumber} tahap diubah ke: ${updateStageValue}`);
      setIsUpdateStageModalOpen(false);
    } catch (err) {
      console.error('Failed to update WO stage', err);
      onTriggerNotification('Gagal mengubah tahap produksi.');
    }
  };

  const handleOpenReceiveModal = () => {
    if (!selectedWo) return;
    const remainingToReceive = totalOk - selectedWo.completedQty;
    setReceiveQty(remainingToReceive > 0 ? remainingToReceive : 0);
    setReceiveTargetLocationId('');
    setReceiveSourceLocationId('');
    setReceiveNotes('');
    setIsReceiveModalOpen(true);
  };

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWoId || !selectedWo || receiveQty <= 0 || !receiveTargetLocationId) {
      onTriggerNotification('Mohon lengkapi qty dan lokasi tujuan dengan benar.');
      return;
    }

    try {
      const updated = await productionApi.receiveWorkOrder(selectedWoId, {
        quantity: receiveQty,
        target_location_id: receiveTargetLocationId,
        source_location_id: receiveSourceLocationId || undefined,
        notes: receiveNotes
      });
      setWorkOrders(prev => prev.map(w => w.id === selectedWoId ? updated : w));
      onTriggerNotification(`Stok berhasil masuk ke gudang untuk WO ${selectedWo.workOrderNumber}`);
      setIsReceiveModalOpen(false);
    } catch (err) {
      console.error('Failed to receive stock', err);
      onTriggerNotification('Gagal menerima stok ke gudang.');
    }
  };

  const handleStartProduction = async (wo: ProductionWorkOrder) => {
    try {
      const updated = await productionApi.updateWorkOrder(wo.id, { stage: 'Cetak & Curing' });
      setWorkOrders(prev => prev.map(w => w.id === updated.id ? updated : w));
      onTriggerNotification(`WO ${wo.workOrderNumber} berhasil dimulai (Tahap: Cetak & Curing)`);
    } catch (err) {
      console.error('Failed to start production', err);
      onTriggerNotification('Gagal memulai proses produksi.');
    }
  };

  const handleDeleteWo = async (id: string, num: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Menghapus Work Order ${num} tidak dapat dibatalkan!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      await productionApi.deleteWorkOrder(id);
      setWorkOrders(prev => prev.filter(w => w.id !== id));
      if (selectedWoId === id) {
        setSelectedWoId(null);
      }
      Swal.fire({
        title: 'Terhapus!',
        text: `Work Order ${num} berhasil dihapus.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Failed to delete work order', err);
      Swal.fire({
        title: 'Gagal!',
        text: 'Gagal menghapus Work Order.',
        icon: 'error'
      });
      onTriggerNotification('Gagal menghapus Work Order.');
    }
  };

  const handleCancelWorkOrder = async (id: string, num: string) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Batalkan Work Order?',
      text: `Masukkan alasan pembatalan untuk Work Order ${num}. Stok yang terkait (jika ada) akan di-reverse secara otomatis.`,
      input: 'text',
      inputPlaceholder: 'Salah input, batal produksi, dll',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Batalkan',
      cancelButtonText: 'Kembali',
      inputValidator: (value) => {
        if (!value) return 'Alasan pembatalan wajib diisi!';
        return null;
      }
    });

    if (isConfirmed && reason) {
      try {
        await productionApi.cancelWorkOrder(id, reason);
        setWorkOrders(prev => prev.filter(w => w.id !== id));
        if (selectedWoId === id) {
          setSelectedWoId(null);
        }
        onTriggerNotification(`Berhasil membatalkan Work Order ${num}`);
      } catch (err) {
        onTriggerNotification(err instanceof Error ? err.message : 'Gagal membatalkan Work Order');
      }
    }
  };

  // Calculations & Filtering
  const selectedWo = workOrders.find(wo => wo.id === selectedWoId && wo.stage !== 'cancelled' && wo.stage !== 'dibatalkan');
  const selectedCreateProduct = products.find(p => p.id === selectedProductId);
  const selectedCreateSalesOrder = salesOrders.find(so => so.id === selectedSalesOrderId);
  const selectedCreateSalesOrderItem = selectedSalesOrderItemIndex !== ''
    ? selectedCreateSalesOrder?.items?.[Number(selectedSalesOrderItemIndex)]
    : undefined;
  const targetUnit = selectedCreateProduct?.unit || 'pcs';

  const filteredWos = workOrders.filter(w => {
    if (w.stage === 'cancelled' || w.stage === 'dibatalkan') return false;
    return (
      w.workOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.productName && w.productName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.sourceLabel && w.sourceLabel.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Perhitungan jumlah WO berdasarkan dokumen referensi (tidak termasuk yang dibatalkan)
  const activeWos = workOrders.filter(w => w.stage !== 'cancelled' && w.stage !== 'dibatalkan');
  const countSoWos = activeWos.filter(w => w.salesOrderId || w.salesOrderNumber || w.sourceLabel?.startsWith('SO:')).length;
  const countPrjWos = activeWos.filter(w => w.projectId || w.projectName).length;
  const countSprWos = activeWos.filter(w => w.stockProductionRequestId || w.stockProductionRequestNumber || w.sourceLabel?.startsWith('SPR:')).length;

  // Mengelompokkan Work Order berdasarkan Dokumen Referensi Induk
  const groupedReferences = React.useMemo(() => {
    const groups: Array<{
      key: string;
      type: 'sales_order' | 'project' | 'stock_request' | 'other';
      docNumber: string;
      title: string;
      subtitle: string;
      badgeColor: string;
      badgeIcon: any;
      wos: ProductionWorkOrder[];
    }> = [];

    const soMap = new Map<string, ProductionWorkOrder[]>();
    const prjMap = new Map<string, ProductionWorkOrder[]>();
    const sprMap = new Map<string, ProductionWorkOrder[]>();
    const otherWos: ProductionWorkOrder[] = [];

    for (const wo of filteredWos) {
      if (wo.salesOrderId || wo.salesOrderNumber || wo.sourceLabel?.startsWith('SO:')) {
        const soKey = wo.salesOrderId || wo.salesOrderNumber || wo.sourceLabel?.split(' - ')[0] || 'SO';
        if (!soMap.has(soKey)) soMap.set(soKey, []);
        soMap.get(soKey)!.push(wo);
      } else if (wo.projectId || wo.projectName) {
        const prjKey = wo.projectId || wo.projectName || 'PRJ';
        if (!prjMap.has(prjKey)) prjMap.set(prjKey, []);
        prjMap.get(prjKey)!.push(wo);
      } else if (wo.stockProductionRequestId || wo.stockProductionRequestNumber || wo.sourceLabel?.startsWith('SPR:')) {
        const sprKey = wo.stockProductionRequestId || wo.stockProductionRequestNumber || wo.sourceLabel?.split(' - ')[0] || 'SPR';
        if (!sprMap.has(sprKey)) sprMap.set(sprKey, []);
        sprMap.get(sprKey)!.push(wo);
      } else {
        otherWos.push(wo);
      }
    }

    if (referenceFilter === 'all' || referenceFilter === 'sales_order') {
      soMap.forEach((wos, key) => {
        const first = wos[0];
        const soNum = first.salesOrderNumber || (first.sourceLabel?.startsWith('SO:') ? first.sourceLabel.split(' - ')[0].replace('SO: ', '') : key);
        const customer = first.customerName || (first.sourceLabel?.includes(' - ') ? first.sourceLabel.split(' - ')[1] : 'Pesanan Pelanggan');
        groups.push({
          key: `so-${key}`,
          type: 'sales_order',
          docNumber: soNum,
          title: `Sales Order: ${soNum}`,
          subtitle: `Pelanggan: ${customer}`,
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
          badgeIcon: Package,
          wos,
        });
      });
    }

    if (referenceFilter === 'all' || referenceFilter === 'project') {
      prjMap.forEach((wos, key) => {
        const first = wos[0];
        const prjName = first.projectName || first.sourceLabel || key;
        groups.push({
          key: `prj-${key}`,
          type: 'project',
          docNumber: prjName,
          title: `Proyek: ${prjName}`,
          subtitle: `Pekerjaan Konstruksi Precast`,
          badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          badgeIcon: Building2,
          wos,
        });
      });
    }

    if (referenceFilter === 'all' || referenceFilter === 'stock_request') {
      sprMap.forEach((wos, key) => {
        const first = wos[0];
        const sprNum = first.stockProductionRequestNumber || (first.sourceLabel?.startsWith('SPR:') ? first.sourceLabel.split(' - ')[0].replace('SPR: ', '') : key);
        groups.push({
          key: `spr-${key}`,
          type: 'stock_request',
          docNumber: sprNum,
          title: `Permintaan Stok: ${sprNum}`,
          subtitle: `Restok Persediaan Gudang`,
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          badgeIcon: Warehouse,
          wos,
        });
      });
    }

    if (referenceFilter === 'all' && otherWos.length > 0) {
      groups.push({
        key: 'other-standalone',
        type: 'other',
        docNumber: 'PRODUKSI MANDIRI',
        title: 'Produksi Lainnya',
        subtitle: 'Work Order tanpa dokumen induk',
        badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
        badgeIcon: Layers,
        wos: otherWos,
      });
    }

    return groups;
  }, [filteredWos, referenceFilter]);

  // Group counts
  const getWoStatus = (wo: ProductionWorkOrder) => {
    // 1. Fulfilled target
    if (wo.completedQty >= wo.targetQty) return 'Closed';

    if (wo.tasks && wo.tasks.length > 0) {
      // 2. All tasks officially completed
      if (wo.tasks.every(t => t.status === 'Completed')) return 'Closed';

      // 3. Check if WO is "Exhausted" (dead end due to rejects)
      // A WO is exhausted if the first task has processed all target items (completed + reject),
      // AND every subsequent task has processed all available items from the previous task.
      let isExhausted = true;
      const firstTask = wo.tasks[0];
      if ((firstTask.completedQty + firstTask.rejectQty) < firstTask.targetQty) {
        isExhausted = false;
      } else {
        for (let i = 1; i < wo.tasks.length; i++) {
          const currentTask = wo.tasks[i];
          const prevTask = wo.tasks[i - 1];
          if ((currentTask.completedQty + currentTask.rejectQty) < prevTask.completedQty) {
            isExhausted = false;
            break;
          }
        }
      }

      if (isExhausted) return 'Closed';

      // 4. If not closed, check if it has started
      const isStarted = wo.tasks.some(t => t.status !== 'Pending');
      return isStarted ? 'In Progress' : 'Open';
    }

    return 'Open';
  };

  const countDraft = workOrders.filter(w => w.stage === 'Draft').length;
  const countOpen = workOrders.filter(w => w.stage !== 'Draft' && getWoStatus(w) === 'Open').length;
  const countInProgress = workOrders.filter(w => w.stage !== 'Draft' && getWoStatus(w) === 'In Progress').length;
  const countClosed = workOrders.filter(w => w.stage !== 'Draft' && getWoStatus(w) === 'Closed').length;

  // Worker rekap summary for selected WO
  const logsList = selectedWo?.logs || [];
  // Total barang yang diciptakan hanya dihitung dari tahap Cetak & Curing
  const totalMade = logsList.filter(l => l.stage === 'Cetak & Curing').reduce((sum, l) => sum + l.madeQty, 0);
  // Total reject dihitung dari seluruh tahap (Cetak & Curing, Finishing, QC, dll)
  const totalReject = logsList.reduce((sum, l) => sum + l.rejectQty, 0);
  // Total Bagus (OK) adalah barang yang dicetak dikurangi semua reject di sepanjang proses
  const totalOk = Math.max(0, totalMade - totalReject);

  const workerSummary = logsList.reduce<Record<string, { made: number; ok: number; reject: number }>>((acc, log) => {
    const worker = log.employeeName || 'Unknown';
    acc[worker] = acc[worker] || { made: 0, ok: 0, reject: 0 };
    acc[worker].made += log.madeQty;
    acc[worker].reject += log.rejectQty;
    acc[worker].ok += log.okQty;
    return acc;
  }, {});

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Banner */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
            <Factory size={20} />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-slate-800 flex items-center gap-2">
              Work Order Cetak
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Keluarkan Work Order untuk tukang, monitor progress cetak harian, hitung persentase barang reject, dan monitor produksi beton secara live.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenSprModal}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 shrink-0 transition-all active:scale-95 cursor-pointer text-xs"
            title="Buat Permintaan Produksi Stok Gudang (SPR)"
          >
            <Warehouse size={14} />
            <span>Permintaan Stok (SPR)</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-md flex items-center justify-center gap-2 shrink-0 transition-all active:scale-95 cursor-pointer text-xs"
          >
            <Plus size={14} />
            <span>Keluarkan Work Order</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-5 h-[550px] bg-slate-100 rounded-xl animate-pulse" />
            <div className="xl:col-span-7 h-[550px] bg-slate-100 rounded-xl animate-pulse" />
          </div>
        </div>
      ) : errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={fetchData} />
      ) : (
        <>
          {/* Status KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Draft', count: countDraft, color: 'text-slate-500 bg-slate-50' },
              { label: 'Open (Baru)', count: countOpen, color: 'text-slate-700 bg-slate-100 border-slate-200' },
              { label: 'In Progress', count: countInProgress, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
              { label: 'Selesai (Closed)', count: countClosed, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
            ].map((stageItem) => (
              <div key={stageItem.label} className={`bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center ${stageItem.color.includes('border') ? stageItem.color.split(' ').find(c => c.startsWith('border')) : 'border-slate-200'}`}>
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400">{stageItem.label}</span>
                  <h4 className="text-lg font-black text-slate-800 mt-1">{stageItem.count} SPK</h4>
                </div>
                <div className={`p-2.5 rounded-lg ${stageItem.color}`}>
                  <Factory size={16} />
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid: Grouped WO List & Detailed Monitor */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left: Grouped WO List by Reference Document */}
            <div className="xl:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
              <div className="p-3.5 border-b border-slate-100 space-y-2.5 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-850 text-sm">Daftar Antrian Berdasarkan Referensi</h3>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">{workOrders.length} Total WO</span>
                </div>

                {/* Filter Tab Kategori Dokumen Referensi */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setReferenceFilter('all')}
                    className={`py-1 rounded text-center transition-all ${referenceFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Semua ({filteredWos.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReferenceFilter('sales_order')}
                    className={`py-1 rounded text-center transition-all flex items-center justify-center gap-1 ${referenceFilter === 'sales_order' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Package size={11} />
                    <span>SO ({countSoWos})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReferenceFilter('project')}
                    className={`py-1 rounded text-center transition-all flex items-center justify-center gap-1 ${referenceFilter === 'project' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Building2 size={11} />
                    <span>Proyek ({countPrjWos})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReferenceFilter('stock_request')}
                    className={`py-1 rounded text-center transition-all flex items-center justify-center gap-1 ${referenceFilter === 'stock_request' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Warehouse size={11} />
                    <span>SPR ({countSprWos})</span>
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Cari WO, produk, proyek, no SO..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 text-xs"
                  />
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-3 space-y-3 bg-slate-50/40">
                {groupedReferences.map((group) => {
                  const Icon = group.badgeIcon;
                  return (
                    <div key={group.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                      {/* Group Header (Dokumen Referensi Induk) */}
                      <div className="px-3.5 py-2.5 bg-slate-100/70 border-b border-slate-200/70 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`p-1.5 rounded-md border shrink-0 ${group.badgeColor}`}>
                            <Icon size={13} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-850 text-xs truncate">{group.title}</h4>
                            <p className="text-[10px] text-slate-500 truncate">{group.subtitle}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                          {group.wos.length} WO
                        </span>
                      </div>

                      {/* Work Orders Inside This Reference */}
                      <div className="divide-y divide-slate-100">
                        {group.wos.map((wo) => {
                          const status = getWoStatus(wo);
                          const isSelected = selectedWoId === wo.id;
                          return (
                            <div
                              key={wo.id}
                              onClick={() => setSelectedWoId(wo.id)}
                              className={`p-3 cursor-pointer hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-2 ${
                                isSelected ? 'bg-cyan-50/60 border-l-4 border-cyan-500 pl-2' : ''
                              }`}
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-bold text-[11px] text-cyan-700">{wo.workOrderNumber}</span>
                                  {wo.stage === 'cancelled' ? (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold border bg-rose-50 text-rose-700 border-rose-200">Dibatalkan</span>
                                  ) : wo.stage === 'Draft' ? (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold border bg-purple-50 text-purple-700 border-purple-200">Draft</span>
                                  ) : status === 'Closed' ? (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-100">Selesai</span>
                                  ) : status === 'In Progress' ? (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold border bg-cyan-50 text-cyan-700 border-cyan-100">In Progress</span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold border bg-slate-50 text-slate-700 border-slate-200">Open</span>
                                  )}
                                </div>
                                <h5 className="font-bold text-slate-800 text-[11px] truncate">{wo.productName}</h5>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="font-mono text-slate-700 font-semibold text-[11px]">{wo.completedQty} / {wo.targetQty} pcs</div>
                                <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 ml-auto">
                                  <div className="h-full bg-cyan-500 transition-all" style={{ width: `${wo.progress}%` }} />
                                </div>
                                <div className="text-[9px] font-mono text-slate-400 mt-0.5">{wo.progress}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {groupedReferences.length === 0 && (
                  <div className="p-10 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    <Clipboard size={28} className="mx-auto text-slate-300 mb-2" />
                    Tidak ada Work Order pada kategori referensi ini.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Detailed Monitor Card */}
            <div className="xl:col-span-7 space-y-6">
              {selectedWo ? (
                <>
                  {/* Detailed Header Card */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded">
                            {selectedWo.workOrderNumber}
                          </span>
                          {(() => {
                            const status = getWoStatus(selectedWo);

                            if (selectedWo.stage === 'cancelled') {
                              return <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold">Dibatalkan</span>;
                            } else if (status === 'Closed') {
                              return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">Selesai (Closed)</span>;
                            } else if (status === 'In Progress') {
                              return <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded text-[10px] font-bold">In Progress</span>;
                            } else {
                              return <span className="px-2 py-0.5 bg-slate-50 text-slate-700 border border-slate-200 rounded text-[10px] font-bold">Open</span>;
                            }
                          })()}
                          {selectedWo.projectId && (
                            <button
                              onClick={() => onNavigateToProject && onNavigateToProject(selectedWo.projectId!)}
                              className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Buka Detail Proyek Induk"
                            >
                              <CheckCircle2 size={10} />
                              <span>Proyek Induk</span>
                            </button>
                          )}
                        </div>
                        <h3 className="font-sans font-black text-slate-800 text-base mt-2">{selectedWo.productName}</h3>
                        <div className="mt-1 space-y-1">
                          {/* Reference Info */}
                          {(selectedWo.salesOrderNumber || selectedWo.projectName || selectedWo.stockProductionRequestNumber) && (
                            <div className="flex flex-wrap items-center gap-2">
                              {selectedWo.salesOrderNumber && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded font-bold text-[11px]">
                                  <Package size={11} />
                                  <span>SO: {selectedWo.salesOrderNumber} {selectedWo.customerName ? `(${selectedWo.customerName})` : ''}</span>
                                </span>
                              )}
                              {selectedWo.projectName && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded font-bold text-[11px]">
                                  <Building2 size={11} />
                                  <span>Proyek: {selectedWo.projectName}</span>
                                </span>
                              )}
                              {selectedWo.stockProductionRequestNumber && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold text-[11px]">
                                  <Warehouse size={11} />
                                  <span>Permintaan Stok: {selectedWo.stockProductionRequestNumber}</span>
                                </span>
                              )}
                            </div>
                          )}
                          {/* Source Label */}
                          {selectedWo.sourceLabel && (
                            selectedWo.sourceLabel.includes('[') ? (
                              <span className="inline-block px-2 py-1 bg-violet-50 text-violet-700 border border-violet-200 rounded font-bold text-[11px]">
                                Ref: {selectedWo.sourceLabel}
                              </span>
                            ) : (
                              <span className="font-semibold text-[10px] text-slate-700">Sumber: {selectedWo.sourceLabel}</span>
                            )
                          )}
                          <span className="block text-[10px] text-slate-400">
                            {selectedWo.dueDate && `Target Selesai: ${selectedWo.dueDate}`}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {selectedWo.stage === 'Draft' && (
                          <button
                            onClick={() => handleStartProduction(selectedWo)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Factory size={13} />
                            <span>Mulai Produksi</span>
                          </button>
                        )}
                        {(() => {
                          const qcTask = selectedWo.tasks?.find(t => t.taskName === 'QC');
                          const readyQty = qcTask ? qcTask.completedQty : 0;
                          const unreceivedQty = readyQty - selectedWo.completedQty;
                          const isReadyForWarehouse = unreceivedQty > 0;

                          return (
                            <button
                              onClick={handleOpenReceiveModal}
                              disabled={!isReadyForWarehouse}
                              title={!isReadyForWarehouse ? 'Tidak ada barang yang siap dimasukkan ke gudang (Harus lolos QC terlebih dahulu)' : ''}
                              className={`px-3 py-1.5 font-bold rounded-lg transition-all ${isReadyForWarehouse ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                            >
                              Terima Stok ({unreceivedQty > 0 ? unreceivedQty : 0} pcs)
                            </button>
                          );
                        })()}
                        {selectedWo.stage !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelWorkOrder(selectedWo.id, selectedWo.workOrderNumber)}
                            className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-lg font-bold transition-all text-xs"
                          >
                            Batal
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Stats bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-100 text-center">
                      {[
                        { label: 'Target Produksi', value: `${selectedWo.targetQty} pcs`, color: 'text-slate-800' },
                        { label: 'Total Output', value: `${totalMade} pcs`, color: 'text-cyan-600' },
                        { label: 'Bagus (OK)', value: `${totalOk} pcs`, color: 'text-emerald-600' },
                        { label: 'Reject QC', value: `${totalReject} pcs`, color: 'text-rose-600' }
                      ].map((stat) => (
                        <div key={stat.label} className="p-4 border-r last:border-r-0 border-slate-100">
                          <span className="text-[9px] uppercase font-mono font-bold text-slate-400">{stat.label}</span>
                          <p className={`mt-1 text-base font-black ${stat.color}`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Tasklist (Routing) UI */}
                    {selectedWo.tasks && selectedWo.tasks.length > 0 && (
                      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Clipboard size={14} className="text-cyan-600" />
                          <h4 className="font-bold text-slate-800">Tasklist Produksi (Routing)</h4>
                        </div>
                        <div className="space-y-3">
                          {selectedWo.tasks.map((task, index) => {
                            const isCompleted = task.status === 'Completed';
                            const isInProgress = task.status === 'In Progress';
                            const isPending = task.status === 'Pending';

                            return (
                              <div key={task.id} className={`p-3 rounded-lg border ${isCompleted ? 'bg-emerald-50 border-emerald-100' : isInProgress ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-200'} flex items-center justify-between`}>
                                <div className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isCompleted ? 'bg-emerald-500 text-white' : isInProgress ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    {isCompleted ? <CheckCircle2 size={12} /> : index + 1}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[10px] font-bold text-slate-500">{task.taskCode}</span>
                                      <h5 className={`font-bold text-sm ${isCompleted ? 'text-emerald-800' : isInProgress ? 'text-amber-800' : 'text-slate-700'}`}>{task.taskName}</h5>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                      Status: <span className="font-bold">{task.status}</span> | Selesai: {task.completedQty} / {task.targetQty} pcs
                                      {task.rejectQty > 0 && <span className="text-rose-500 ml-1">| Reject: {task.rejectQty} pcs</span>}
                                    </p>
                                  </div>
                                </div>
                                <div className="shrink-0">
                                  <button
                                    onClick={() => {
                                      let max = task.targetQty - (task.completedQty + task.rejectQty);
                                      if (index > 0) {
                                        const prevTask = selectedWo.tasks![index - 1];
                                        max = prevTask.completedQty - (task.completedQty + task.rejectQty);
                                      }
                                      setLogMaxQty(max > 0 ? max : 0);
                                      setLogStage(task.taskName);
                                      setMadeQty(0);
                                      setRejectQty(0);
                                      setOkQty(0);
                                      setLogNotes('');
                                      setIsLogModalOpen(true);
                                    }}
                                    disabled={
                                      (task.completedQty + task.rejectQty) >= task.targetQty ||
                                      (index > 0 && selectedWo.tasks![index - 1].completedQty === 0) ||
                                      (index > 0 && (task.completedQty + task.rejectQty) >= selectedWo.tasks![index - 1].completedQty)
                                    }
                                    title={(task.completedQty + task.rejectQty) >= task.targetQty ? 'Tahap ini sudah memenuhi target (Termasuk Reject).' : index > 0 && selectedWo.tasks![index - 1].completedQty === 0 ? 'Tunggu tahap sebelumnya menghasilkan barang.' : index > 0 && (task.completedQty + task.rejectQty) >= selectedWo.tasks![index - 1].completedQty ? 'Seluruh hasil dari tahap sebelumnya sudah diproses di tahap ini.' : ''}
                                    className={`px-3 py-1.5 text-[10px] font-bold rounded border transition-colors ${(task.completedQty + task.rejectQty) >= task.targetQty || (index > 0 && (task.completedQty + task.rejectQty) >= selectedWo.tasks![index - 1].completedQty) ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                  >
                                    Input Hasil
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Progress Qty OK Terhadap Target</span>
                        <span className="font-mono font-black text-cyan-600">{selectedWo.progress}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${selectedWo.progress}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Sub Grid: Log Harian & Rekap per Worker */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Log Harian */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden md:col-span-8 flex flex-col max-h-[300px]">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <h4 className="font-bold text-slate-800">Catatan Harian Cetak/Finishing</h4>
                        <span className="text-[10px] text-slate-400 font-mono">Total {logsList.length} Entri</span>
                      </div>
                      <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                        <table className="w-full text-left border-collapse text-[10px]">
                          <thead className="bg-slate-50 sticky top-0 border-b z-10">
                            <tr className="font-mono text-slate-500 uppercase tracking-wider">
                              <th className="p-2.5 pl-4">Tanggal</th>
                              <th className="p-2.5">Tukang</th>
                              <th className="p-2.5">Tahap</th>
                              <th className="p-2.5 text-right">Dibuat</th>
                              <th className="p-2.5 text-right">OK</th>
                              <th className="p-2.5 text-right">Reject</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {logsList.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50/55">
                                <td className="p-2.5 pl-4 font-mono text-slate-500">{log.workDate}</td>
                                <td className="p-2.5 font-bold text-slate-800">{log.employeeName}</td>
                                <td className="p-2.5 text-slate-600">{log.stage}</td>
                                <td className="p-2.5 text-right font-mono">{log.madeQty}</td>
                                <td className="p-2.5 text-right font-mono text-emerald-600 font-bold">{log.okQty}</td>
                                <td className="p-2.5 text-right font-mono text-rose-500">{log.rejectQty}</td>
                              </tr>
                            ))}
                            {logsList.length === 0 && (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                                  Belum ada catatan laporan harian untuk WO ini.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Rekap per worker */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:col-span-4 max-h-[300px] overflow-y-auto">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-3">
                        <UserCheck size={14} className="text-cyan-600" />
                        <h4 className="font-bold text-slate-800">Rekap Per Tukang</h4>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(workerSummary).map(([worker, summary]) => {
                          const rejectRate = summary.made ? Math.round((summary.reject / summary.made) * 100) : 0;
                          return (
                            <div key={worker} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px]">
                              <div className="flex items-center justify-between gap-1 font-bold">
                                <span className="text-slate-800 truncate">{worker}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${rejectRate > 4 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  }`}>
                                  {rejectRate}% reject
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-1 mt-2 text-center font-mono">
                                <div>
                                  <div className="text-[8px] text-slate-400">Total</div>
                                  <div className="font-bold text-slate-700">{summary.made}</div>
                                </div>
                                <div>
                                  <div className="text-[8px] text-slate-400 text-emerald-600">OK</div>
                                  <div className="font-bold text-emerald-700">{summary.ok}</div>
                                </div>
                                <div>
                                  <div className="text-[8px] text-slate-400 text-rose-500">Rej</div>
                                  <div className="font-bold text-rose-600">{summary.reject}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {Object.keys(workerSummary).length === 0 && (
                          <div className="text-center text-slate-400 py-8 italic">Tidak ada rekap.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400 font-sans">
                  <Clipboard size={32} className="mx-auto text-slate-300 mb-2" />
                  Pilih Work Order di sebelah kiri untuk memantau aktivitas produksi secara detail.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal: Buat SPK / WO Berdasarkan Dokumen Referensi */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Factory size={16} className="text-cyan-400" />
                <h3 className="font-bold text-sm">Keluarkan Work Order (Berdasarkan Referensi)</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateWo} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Selector Tipe Dokumen Referensi Induk */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">Tipe Dokumen Referensi *</label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateRefType('sales_order');
                      setSelectedProductId('');
                      setSelectedProjectId('');
                      setSelectedSprId('');
                    }}
                    className={`py-2 rounded-md transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      createRefType === 'sales_order' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Package size={14} />
                    <span>Sales Order</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateRefType('project');
                      setSelectedProductId('');
                      setSelectedSalesOrderId('');
                      setSelectedSprId('');
                    }}
                    className={`py-2 rounded-md transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      createRefType === 'project' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Building2 size={14} />
                    <span>Proyek</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateRefType('stock_request');
                      setSelectedProductId('');
                      setSelectedSalesOrderId('');
                      setSelectedProjectId('');
                    }}
                    className={`py-2 rounded-md transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      createRefType === 'stock_request' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Warehouse size={14} />
                    <span>Permintaan Stok</span>
                  </button>
                </div>
              </div>

              {/* Referensi 1: Sales Order */}
              {createRefType === 'sales_order' && (
                <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-amber-900 text-xs">Pilih Sales Order (Pesanan Pelanggan) *</label>
                    <SearchableSelect
                      value={selectedSalesOrderId}
                      onChange={(val) => {
                        setSelectedSalesOrderId(val);
                        setSelectedSalesOrderItemIndex('');
                        const salesOrder = salesOrders.find(so => so.id === val);
                        if (salesOrder?.items?.length) {
                          const unfulfilledIndex = salesOrder.items.findIndex(item => getItemOutstandingQty(val, item) > 0);
                          if (unfulfilledIndex !== -1) {
                            applySalesOrderItemToForm(salesOrder, unfulfilledIndex);
                          }
                        }
                      }}
                      options={activeSalesOrders.map(so => ({
                        value: so.id,
                        label: `${so.orderNumber} - ${so.customerName || 'N/A'}`
                      }))}
                      placeholder="-- Cari Nomor Sales Order / Pelanggan --"
                    />
                  </div>

                  {selectedSalesOrderId && (
                    <div className="space-y-1">
                      <label className="block font-bold text-amber-900 text-xs">Item Produk Sales Order *</label>
                      <select
                        value={selectedSalesOrderItemIndex}
                        onChange={(e) => {
                          const salesOrder = salesOrders.find(so => so.id === selectedSalesOrderId);
                          if (salesOrder && e.target.value !== '') {
                            applySalesOrderItemToForm(salesOrder, Number(e.target.value));
                          }
                        }}
                        className="w-full px-3 py-1.5 border border-amber-200 rounded-lg bg-white focus:outline-none text-xs"
                      >
                        <option value="" disabled>-- Pilih Item yang Belum Terpenuhi --</option>
                        {salesOrders
                          .find(so => so.id === selectedSalesOrderId)
                          ?.items?.map((item, index) => {
                            const outQty = getItemOutstandingQty(selectedSalesOrderId, item);
                            const disabled = outQty <= 0;
                            return (
                              <option key={`${item.productId || item.product?.name}-${index}`} value={index} disabled={disabled}>
                                {item.product?.name || item.description || 'Item'}
                                {' '} - {disabled ? 'Sudah Terpenuhi' : `Sisa Kebutuhan: ${outQty} pcs`}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Referensi 2: Proyek Konstruksi */}
              {createRefType === 'project' && (
                <div className="p-3 bg-indigo-50/50 border border-indigo-200/80 rounded-xl space-y-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-indigo-900 text-xs">Pilih Proyek Konstruksi *</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        const pr = projects.find(p => p.id === e.target.value);
                        if (pr) setSourceLabel(`Proyek: ${pr.projectName}`);
                      }}
                      className="w-full px-3 py-1.5 border border-indigo-200 rounded-lg bg-white focus:outline-none text-xs"
                    >
                      <option value="">-- Pilih Proyek --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.projectName} ({p.code || 'PRJ'})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Referensi 3: Permintaan Stok Gudang (SPR) */}
              {createRefType === 'stock_request' && (
                <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-emerald-900 text-xs">Pilih Dokumen Permintaan Stok (SPR) *</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreateModalOpen(false);
                          handleOpenSprModal();
                        }}
                        className="text-[10px] text-emerald-700 underline font-bold hover:text-emerald-900 cursor-pointer"
                      >
                        + Buat SPR Baru
                      </button>
                    </div>
                    <select
                      value={selectedSprId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedSprId(val);
                        setSelectedSprItemIndex('');
                        const spr = stockRequests.find(s => s.id === val);
                        if (spr?.items?.length) {
                          const firstItem = spr.items[0];
                          setSelectedSprItemIndex('0');
                          setSelectedProductId(firstItem.productId);
                          setTargetQty(Number(firstItem.targetQty));
                          setSourceLabel(`SPR: ${spr.requestNumber} - Restok Gudang`);
                        }
                      }}
                      className="w-full px-3 py-1.5 border border-emerald-200 rounded-lg bg-white focus:outline-none text-xs"
                    >
                      <option value="">-- Pilih Dokumen SPR --</option>
                      {stockRequests.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.requestNumber} ({s.status.toUpperCase()}) - {s.notes || 'Restok Gudang'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedSprId && (
                    <div className="space-y-1">
                      <label className="block font-bold text-emerald-900 text-xs">Pilih Item Permintaan Stok *</label>
                      <select
                        value={selectedSprItemIndex}
                        onChange={(e) => {
                          setSelectedSprItemIndex(e.target.value);
                          const spr = stockRequests.find(s => s.id === selectedSprId);
                          const item = spr?.items?.[Number(e.target.value)];
                          if (item) {
                            setSelectedProductId(item.productId);
                            setTargetQty(Number(item.targetQty));
                          }
                        }}
                        className="w-full px-3 py-1.5 border border-emerald-200 rounded-lg bg-white focus:outline-none text-xs"
                      >
                        <option value="" disabled>-- Pilih Item --</option>
                        {stockRequests
                          .find(s => s.id === selectedSprId)
                          ?.items?.map((item, index) => (
                            <option key={`${item.productId}-${index}`} value={index}>
                              {item.productName || 'Item'} - Target: {item.targetQty} pcs
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">No. Work Order (Otomatis)</label>
                <input
                  type="text"
                  required
                  readOnly
                  disabled
                  value={newWoNumber}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-mono cursor-not-allowed text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Produk yang Dicetak *</label>
                <SearchableSelect
                  value={selectedProductId}
                  onChange={(val) => setSelectedProductId(val)}
                  options={products
                    .filter(p => p.type !== 'raw_material' && p.type !== 'service')
                    .map(p => ({
                      value: p.id,
                      label: `${p.sku} - ${p.name}`
                    }))}
                  placeholder="-- Ketik Nama atau SKU Produk Jadi --"
                  disabled={createRefType === 'sales_order' || createRefType === 'stock_request'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Target Produksi ({targetUnit}) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={targetQty}
                    onChange={(e) => setTargetQty(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Batas Selesai *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Keterangan Sumber Dokumen</label>
                <input
                  type="text"
                  placeholder="Terisi otomatis sesuai referensi"
                  value={sourceLabel}
                  onChange={(e) => setSourceLabel(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-xs bg-slate-50"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold transition-all border border-slate-200 cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 cursor-pointer text-xs"
                >
                  Keluarkan Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Buat Permintaan Produksi Stok (SPR) */}
      {isSprModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-4 bg-emerald-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Warehouse size={16} className="text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Permintaan Produksi Stok (Stock Production Request)</h3>
                  <p className="text-[10px] text-emerald-300">Dokumen referensi resmi pengisian buffer stock gudang</p>
                </div>
              </div>
              <button onClick={() => setIsSprModalOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSpr} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-xs">Lokasi Gudang Tujuan *</label>
                  <select
                    value={sprLocationId}
                    onChange={(e) => setSprLocationId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none text-xs"
                  >
                    <option value="">-- Pilih Lokasi Gudang --</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name} ({loc.code || 'LOC'})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-xs">Target Selesai *</label>
                  <input
                    type="date"
                    required
                    value={sprDueDate}
                    onChange={(e) => setSprDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 text-xs">Alasan Kebutuhan / Catatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Stok Paving Block menipis di bawah buffer minimum"
                  value={sprNotes}
                  onChange={(e) => setSprNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-xs"
                />
              </div>

              {/* Tabel Daftar Produk yang Diminta Diproduksi */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 text-xs">Daftar Produk yang Mau Distok *</label>
                  <button
                    type="button"
                    onClick={() => setSprItems(prev => [...prev, { product_id: '', target_qty: 100, notes: '' }])}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    + Tambah Produk
                  </button>
                </div>

                <div className="space-y-2">
                  {sprItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex-1">
                        <select
                          value={item.product_id}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSprItems(prev => prev.map((it, i) => i === idx ? { ...it, product_id: val } : it));
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-xs focus:outline-none"
                        >
                          <option value="">-- Pilih Produk Jadi / Precast --</option>
                          {products
                            .filter(p => p.type !== 'raw_material' && p.type !== 'service')
                            .map(p => (
                              <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                            ))}
                        </select>
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          min={1}
                          placeholder="Target Qty"
                          value={item.target_qty}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSprItems(prev => prev.map((it, i) => i === idx ? { ...it, target_qty: val } : it));
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-xs font-mono text-right focus:outline-none"
                        />
                      </div>

                      {sprItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSprItems(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Hapus baris"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSprModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold transition-all border border-slate-200 cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 cursor-pointer text-xs"
                >
                  Simpan Permintaan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Input Hasil Harian */}
      {isLogModalOpen && selectedWo && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-cyan-400" />
                <h3 className="font-bold text-sm">Input Output Tukang Harian</h3>
              </div>
              <button onClick={() => setIsLogModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateWorkLog} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Tukang / Pekerja *</label>
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- Pilih Tukang --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeType})</option>
                  ))}
                  {employees.length === 0 && (
                    <option value="" disabled>Tidak ada karyawan aktif</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Tanggal Kerja *</label>
                  <input
                    type="date"
                    required
                    value={logWorkDate}
                    onChange={(e) => setLogWorkDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Tahap SPK *</label>
                  <select
                    value={logStage}
                    disabled
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                  >
                    <option value="Cetak">Cetak</option>
                    <option value="Curing">Curing</option>
                    <option value="Finishing">Finishing</option>
                    <option value="QC">QC</option>
                    <option value="Siap Gudang">Siap Gudang</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-y border-slate-100 py-3">
                <div className="space-y-1 text-center">
                  <label className="block font-bold text-slate-700">Dibuat * {logMaxQty !== null && <span className="text-slate-400 font-normal text-[10px]">(Max: {logMaxQty})</span>}</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={logMaxQty !== null ? logMaxQty : undefined}
                    value={madeQty}
                    onChange={(e) => {
                      let val = Number(e.target.value);
                      if (logMaxQty !== null && val > logMaxQty) val = logMaxQty;
                      handleMadeQtyChange(val);
                    }}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-center font-mono text-slate-800"
                  />
                </div>

                <div className="space-y-1 text-center">
                  <label className="block font-bold text-slate-700">Reject</label>
                  <input
                    type="number"
                    min={0}
                    value={rejectQty}
                    onChange={(e) => handleRejectQtyChange(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-center font-mono text-rose-600"
                  />
                </div>

                <div className="space-y-1 text-center">
                  <label className="block font-bold text-slate-700">Bagus (OK)</label>
                  <input
                    type="number"
                    disabled
                    value={okQty}
                    className="w-full px-2 py-1.5 border border-slate-250 bg-slate-50 rounded-lg text-center font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Keterangan / Notes</label>
                <input
                  type="text"
                  placeholder="Contoh: Bagian pinggir retak tipis / Batch pagi"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg font-bold transition-all border border-slate-200/50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Simpan Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ubah Tahap WO */}
      {isUpdateStageModalOpen && selectedWo && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clipboard size={16} className="text-cyan-400" />
                <h3 className="font-bold text-sm">Ubah Tahap Produksi SPK</h3>
              </div>
              <button onClick={() => setIsUpdateStageModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateStage} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Pilih Tahap Baru *</label>
                <select
                  value={updateStageValue}
                  onChange={(e) => setUpdateStageValue(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
                >
                  {(() => {
                    const stages = [
                      { value: 'Draft', label: 'Draft (Dalam Rencana)' },
                      { value: 'Cetak', label: 'Cetak (Proses Pembuatan)' },
                      { value: 'Curing', label: 'Curing (Proses Pengeringan)' },
                      { value: 'Finishing', label: 'Finishing (Proses Pemolesan)' },
                      { value: 'QC', label: 'QC & Siap (Selesai QC / Siap Kirim)' }
                    ];
                    const currentIndex = stages.findIndex(s => s.value === selectedWo.stage);

                    return stages.map((s, index) => {
                      const isDisabled = index > currentIndex + 1;
                      return (
                        <option key={s.value} value={s.value} disabled={isDisabled}>
                          {s.label} {isDisabled ? '(Terkunci - Lalui tahap sebelumnya)' : ''}
                        </option>
                      );
                    });
                  })()}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUpdateStageModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-655 rounded-lg font-bold transition-all border border-slate-200/50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Ubah Tahap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Terima Stok Gudang */}
      {isReceiveModalOpen && selectedWo && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-300" />
                <h3 className="font-bold text-sm">Terima Stok Hasil Produksi</h3>
              </div>
              <button onClick={() => setIsReceiveModalOpen(false)} className="text-emerald-200 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleReceiveStock} className="p-5 space-y-4">
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100 text-[11px]">
                Anda akan menerima produk jadi <strong>{selectedWo.productName}</strong> ke dalam inventori, sekaligus memotong bahan baku sesuai dengan Bill of Materials (BOM) jika ada.
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Jumlah Diterima (Pcs) *</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    required
                    min={0.1}
                    step={0.1}
                    value={receiveQty}
                    onChange={(e) => setReceiveQty(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-lg font-bold text-emerald-700"
                  />
                  <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                    Total OK: {totalOk} pcs<br />
                    Sdh Terima: {selectedWo.completedQty} pcs
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Tujuan Lokasi Penyimpanan (Barang Jadi) *</label>
                <SearchableSelect
                  value={receiveTargetLocationId}
                  onChange={(val) => setReceiveTargetLocationId(val)}
                  options={locations.map(loc => ({
                    value: loc.id,
                    label: `${loc.warehouse?.name ? loc.warehouse.name + ' - ' : ''}${loc.name} (${loc.code})`
                  }))}
                  placeholder="-- Pilih Lokasi Target --"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Asal Gudang Bahan Baku (Opsional)</label>
                <SearchableSelect
                  value={receiveSourceLocationId}
                  onChange={(val) => setReceiveSourceLocationId(val)}
                  options={locations.map(loc => ({
                    value: loc.id,
                    label: `${loc.warehouse?.name ? loc.warehouse.name + ' - ' : ''}${loc.name} (${loc.code})`
                  }))}
                  placeholder="-- Lokasi Default / Tidak Dipotong --"
                />
                <p className="text-[9px] text-slate-400 mt-1">Pilih dari mana bahan baku dikurangi (jika produk memiliki BOM).</p>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Catatan Penerimaan</label>
                <input
                  type="text"
                  placeholder="Contoh: Penerimaan Batch Siang"
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-655 rounded-lg font-bold transition-all border border-slate-200/50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Konfirmasi Penerimaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
