/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  ChevronLeft,
  Receipt,
  Printer,
  FileCheck,
  Factory,
  Truck,
  CreditCard,
  Building2,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Package,
  Layers,
  ShoppingBag,
  ExternalLink,
  XCircle,
  FileText,
  Phone,
  MapPin,
  RefreshCw,
} from '@/src/components/icons';
import { SalesOrder, ViewType } from '../../../types';
import { salesApi } from '../api';
import { apiClient } from '../../../services/api';
import { formatDate } from '../../../utils/date';
import { CompanyProfile, getCompanyProfile, formatAddressForPrint } from '../../../utils/companyProfile';
import {
  SalesOrderPrintInfo,
  SalesOrderInvoicePrint,
  printSalesOrderThermal,
  downloadSalesOrderThermalPdf,
  printBluetoothSalesOrder,
  buildSalesOrderThermalHTML,
} from '../services/SalesOrderPrintService';

interface SalesOrderDetailViewProps {
  salesOrderId: string;
  initialOrder?: SalesOrder | null;
  onBack: () => void;
  onNavigate?: (view: ViewType | string) => void;
  onTriggerNotification: (message: string) => void;
}

const formatIDR = (val: number | string | undefined | null) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export default function SalesOrderDetailView({
  salesOrderId,
  initialOrder,
  onBack,
  onNavigate,
  onTriggerNotification,
}: SalesOrderDetailViewProps) {
  const [order, setOrder] = useState<SalesOrder | null>(initialOrder || null);
  const [isLoading, setIsLoading] = useState(!initialOrder);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'wo' | 'opl' | 'do' | 'invoices'>('items');
  const [showThermalPreview, setShowThermalPreview] = useState(false);
  const companyProfile = getCompanyProfile();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintA4 = useReactToPrint({
    contentRef: printRef,
    documentTitle: order ? `SO-${order.orderNumber}` : 'sales-order',
  });

  const loadOrderDetail = async () => {
    setIsLoading(true);
    try {
      const data = await salesApi.getSalesOrder(salesOrderId);
      setOrder(data);
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal memuat detail Sales Order');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (salesOrderId) {
      loadOrderDetail();
    }
  }, [salesOrderId]);

  if (isLoading && !order) {
    return (
      <div className="p-8 space-y-4 font-sans">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-4 h-4 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
          <span>Memuat data Sales Order...</span>
        </div>
        <div className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse" />
        <div className="h-64 bg-white border border-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 font-sans text-center bg-white border border-slate-200 rounded-2xl space-y-4 max-w-lg mx-auto my-12">
        <AlertCircle size={36} className="mx-auto text-rose-500" />
        <h3 className="font-bold text-slate-800 text-base">Sales Order Tidak Ditemukan</h3>
        <p className="text-xs text-slate-500">
          Data Sales Order dengan ID ini tidak dapat dimuat atau telah dihapus.
        </p>
        <button onClick={onBack} className="btn btn-secondary btn-md mx-auto">
          <ChevronLeft size={14} />
          <span>Kembali ke Daftar</span>
        </button>
      </div>
    );
  }

  // Monitoring status calculation
  const getMonitoringStatus = (so: SalesOrder): string => {
    if (so.status === 'Dibatalkan' || so.status === 'cancelled') return 'Dibatalkan';
    if (so.status === 'Draft' || so.status === 'draft') return 'Draft';
    if (so.status === 'Selesai' || so.status === 'completed') return 'Selesai';

    const hasDO = (so.deliveryOrders || []).length > 0;
    const hasActiveDO = (so.deliveryOrders || []).some((d: any) =>
      ['shipped', 'dikirim', 'received', 'selesai'].includes(String(d.status || '').toLowerCase())
    );

    if (hasActiveDO) return 'Proses Pengiriman';
    if (hasDO) return 'Menunggu Pengiriman';

    const hasActiveWO = (so.productionWorkOrders || []).some(
      (wo: any) => !['cancelled', 'dibatalkan'].includes(String(wo.stage || '').toLowerCase())
    );
    if (hasActiveWO) return 'Sedang Diproduksi';

    if (so.status === 'Disetujui' || so.status === 'approved') return 'Disetujui';
    return so.status || 'Diproses';
  };

  const monitoringStatus = getMonitoringStatus(order);

  // Status badge styling adhering to design rules
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'disetujui':
      case 'approved':
      case 'selesai':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'diproses':
      case 'sedang diproduksi':
      case 'menunggu pengiriman':
      case 'proses pengiriman':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'dibatalkan':
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'draft':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Check if order has manufacturing items
  const hasManufactureItems = (order.items || []).some(item => {
    const prod = item.product;
    if (!prod) return false;
    if (prod.type === 'raw_material' || prod.type === 'service') return false;
    if (prod.procurementType === 'purchase') return false;
    return prod.procurementType === 'manufacture' || prod.type === 'finished_good';
  });

  const activeWorkOrders = (order.productionWorkOrders || []).filter(
    wo => !['cancelled', 'dibatalkan'].includes(String(wo.stage || '').toLowerCase())
  );

  const purchaseOrdersList = order.purchaseOrders || [];
  const deliveryOrdersList = order.deliveryOrders || [];
  const invoicesList = order.invoices || [];

  // Finansial calculation
  const grossTotal = (order.items || []).reduce((acc, it) => acc + (Number(it.unitPrice) * Number(it.quantity)), 0);
  const globalDiscount = Number(order.globalDiscountAmount || 0);
  const netTotal = Number(order.total || 0);

  const totalPaid = invoicesList.reduce((sum, inv: any) => sum + Number(inv.paidAmount ?? inv.paid_amount ?? 0), 0);
  const totalRemaining = Math.max(0, netTotal - totalPaid);
  const isFullyPaid = totalPaid >= netTotal && netTotal > 0;
  const isPartiallyPaid = totalPaid > 0 && totalPaid < netTotal;

  // Handlers
  const handleApprove = async () => {
    if (!window.confirm(`Setujui Sales Order ${order.orderNumber}?`)) return;
    setIsActionLoading(true);
    try {
      await salesApi.approveSalesOrder(order.id);
      onTriggerNotification(`Sales Order ${order.orderNumber} berhasil disetujui.`);
      await loadOrderDetail();
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal menyetujui Sales Order');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleGenerateWorkOrders = async () => {
    setIsActionLoading(true);
    try {
      const res = await apiClient.post<{ message: string; data: any[] }>(
        `/sales/sales-orders/${order.id}/generate-work-orders`,
        {}
      );
      onTriggerNotification(res?.message || 'Work Order produksi berhasil digenerate.');
      await loadOrderDetail();
      setActiveTab('wo');
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal generate Work Order');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    const reason = window.prompt(`Masukkan alasan pembatalan Sales Order ${order.orderNumber}:`);
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Alasan pembatalan wajib diisi.');
      return;
    }

    setIsActionLoading(true);
    try {
      await salesApi.cancelSalesOrder(order.id, reason);
      onTriggerNotification(`Sales Order ${order.orderNumber} berhasil dibatalkan.`);
      await loadOrderDetail();
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal membatalkan Sales Order');
    } finally {
      setIsActionLoading(false);
    }
  };

  const mapToPrintInfo = (): SalesOrderPrintInfo => {
    const mappedInvoices: SalesOrderInvoicePrint[] = (order.invoices || []).map((inv: any) => {
      const invTotal = Number(inv.totalAmount ?? inv.total_amount ?? inv.total ?? 0);
      const invPaid = Number(inv.paidAmount ?? inv.paid_amount ?? 0);
      const invRemaining = Number(inv.remainingAmount ?? inv.remaining_amount ?? Math.max(0, invTotal - invPaid));
      const payments = (inv.payments || []).map((p: any) => ({
        paymentNumber: p.paymentNumber || p.payment_number || 'PAY',
        paymentDate: p.paymentDate || p.payment_date ? formatDate(p.paymentDate || p.payment_date) : undefined,
        method: p.method || 'cash',
        amount: Number(p.amount || 0),
      }));

      return {
        invoiceNumber: inv.invoiceNumber || inv.invoice_number || `INV-${inv.id ? String(inv.id).substring(0, 8) : ''}`,
        issueDate: inv.issueDate || inv.issue_date ? formatDate(inv.issueDate || inv.issue_date) : undefined,
        dueDate: inv.dueDate || inv.due_date ? formatDate(inv.dueDate || inv.due_date) : undefined,
        totalAmount: invTotal,
        paidAmount: invPaid,
        remainingAmount: invRemaining,
        status: inv.status || (invPaid >= invTotal && invTotal > 0 ? 'paid' : invPaid > 0 ? 'partial' : 'unpaid'),
        payments,
      };
    });

    const totalPaid = mappedInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalRemaining = Math.max(0, (Number(order.total) || 0) - totalPaid);
    const paymentStatus = totalPaid >= (Number(order.total) || 0) && (Number(order.total) || 0) > 0
      ? 'Lunas'
      : totalPaid > 0
        ? 'Sebagian (DP)'
        : 'Belum Dibayar';

    return {
      orderNumber: order.orderNumber,
      orderDate: formatDate(order.orderDate),
      customerName: order.customerName || order.customer?.name || 'Pelanggan',
      status: order.status,
      notes: order.notes || undefined,
      quotationNumber: order.quotationNumber || order.quotation?.quotationNumber || undefined,
      source: order.source,
      total: Number(order.total) || 0,
      globalDiscountAmount: Number(order.globalDiscountAmount) || 0,
      globalDiscountType: order.globalDiscountType || undefined,
      globalDiscountValue: Number(order.globalDiscountValue) || 0,
      invoices: mappedInvoices,
      totalPaid,
      totalRemaining,
      paymentStatus,
      items: (order.items || []).map(item => {
        const unitPrice = Number(item.unitPrice || 0);
        const qty = Number(item.quantity) || 0;
        const discount = Number(item.discountAmount || 0);
        const subtotal = Number(item.subtotal) || (qty * unitPrice - discount);
        const unitName = typeof item.unit === 'string' ? item.unit : (item.product?.unit?.name || item.product?.unit?.code || '');

        return {
          productName: item.product?.name || item.productName || 'Item',
          pieceCount: item.pieceCount ? Number(item.pieceCount) : undefined,
          length: item.length ? Number(item.length) : undefined,
          quantity: qty,
          unit: unitName,
          unitPrice,
          discountAmount: discount,
          subtotal,
          description: item.description || undefined,
        };
      }),
    };
  };

  const printInfo = mapToPrintInfo();
  const thermalHtml = buildSalesOrderThermalHTML(printInfo, companyProfile, false);

  return (
    <div className="space-y-5 font-sans pb-12">
      {/* 1. Breadcrumb & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 px-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-600 hover:text-sky-700 font-semibold px-2 py-1 rounded-lg hover:bg-sky-50 transition-colors cursor-pointer"
          >
            <ChevronLeft size={15} />
            <span>Kembali ke Daftar</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 font-medium">Penjualan</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 font-medium">Sales Order</span>
          <span className="text-slate-300">/</span>
          <span className="font-mono font-bold text-sky-700">{order.orderNumber}</span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={loadOrderDetail}
            disabled={isLoading || isActionLoading}
            className="btn btn-secondary btn-sm"
            title="Refresh Data"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Card / Hero Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 md:p-6 bg-linear-to-r from-sky-50/50 via-white to-slate-50/40 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold text-sky-900 bg-sky-100/70 border border-sky-200">
                {order.orderNumber}
              </span>
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getStatusBadgeClass(monitoringStatus)}`}>
                {monitoringStatus}
              </span>
              {order.source && (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200">
                  Sumber: {order.source}
                </span>
              )}
            </div>

            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span>{order.customerName || order.customer?.name || 'Pelanggan Umum'}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                <span>Tanggal: <strong className="text-slate-700 font-medium">{formatDate(order.orderDate)}</strong></span>
              </div>
              {order.quotationNumber && (
                <div className="flex items-center gap-1.5">
                  <FileText size={13} className="text-slate-400" />
                  <span>Ref Penawaran: <strong className="font-mono text-slate-700">{order.quotationNumber}</strong></span>
                </div>
              )}
              {order.notes && (
                <div className="flex items-center gap-1.5 text-slate-500 italic">
                  <span>Catatan: {order.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Print Buttons */}
            <button
              onClick={() => setShowThermalPreview(true)}
              className="btn btn-primary btn-md shadow-xs text-xs"
              title="Cetak struk thermal 80mm roll"
            >
              <Receipt size={14} />
              <span>Cetak Thermal (80mm)</span>
            </button>

            <button
              onClick={() => handlePrintA4()}
              className="btn btn-secondary btn-md text-xs"
              title="Cetak PDF Dokumen Resmi (A4)"
            >
              <Printer size={14} />
              <span>Cetak PDF (A4)</span>
            </button>

            {/* Approval / Workflow Buttons */}
            {(order.status === 'Draft' || order.status === 'draft' || order.status === 'Diproses') && (
              <button
                onClick={handleApprove}
                disabled={isActionLoading}
                className="btn btn-success btn-md text-xs"
              >
                <FileCheck size={14} />
                <span>Setujui (Approve)</span>
              </button>
            )}

            {/* Kirim ke Antrian Produksi WO */}
            {order.status !== 'cancelled' && order.status !== 'Dibatalkan' && order.status !== 'Draft' && !order.hasActiveWorkOrder && hasManufactureItems && (
              <button
                onClick={handleGenerateWorkOrders}
                disabled={isActionLoading}
                className="btn btn-secondary btn-md text-sky-700 hover:text-sky-800 border-sky-200 hover:bg-sky-50 text-xs"
                title="Generate Surat Perintah Kerja (WO) untuk pabrik"
              >
                <Factory size={14} className="text-sky-600" />
                <span>Generate Work Order</span>
              </button>
            )}

            {/* Batalkan Pesanan */}
            {order.status !== 'cancelled' && order.status !== 'Dibatalkan' && (
              <button
                onClick={handleCancelOrder}
                disabled={isActionLoading}
                className="btn btn-danger btn-md text-xs"
              >
                <XCircle size={14} />
                <span>Batalkan</span>
              </button>
            )}
          </div>
        </div>

        {/* Pipeline Stepper */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            Status Alur Dokumen & Operasional:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* Step 1: Dibuat */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={13} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-700 truncate">1. Dibuat</div>
                <div className="text-[9px] text-slate-500 truncate font-mono">{formatDate(order.orderDate)}</div>
              </div>
            </div>

            {/* Step 2: Approval */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${order.status !== 'Draft' && order.status !== 'draft' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                {order.status !== 'Draft' && order.status !== 'draft' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-700 truncate">2. Persetujuan</div>
                <div className="text-[9px] text-slate-500 truncate">
                  {order.status !== 'Draft' && order.status !== 'draft' ? 'Disetujui' : 'Menunggu'}
                </div>
              </div>
            </div>

            {/* Step 3: Produksi WO */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${activeWorkOrders.length > 0 ? 'bg-sky-50 text-sky-600' : !hasManufactureItems ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 text-amber-600'}`}>
                <Factory size={13} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-700 truncate">3. Produksi (WO)</div>
                <div className="text-[9px] text-slate-500 truncate">
                  {!hasManufactureItems
                    ? 'Tidak Perlu'
                    : activeWorkOrders.length > 0
                      ? `${activeWorkOrders.length} SPK Aktif`
                      : 'Belum Terbit'}
                </div>
              </div>
            </div>

            {/* Step 4: OPL / PO */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${purchaseOrdersList.length > 0 ? 'bg-sky-50 text-sky-600' : 'bg-slate-100 text-slate-400'}`}>
                <ShoppingBag size={13} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-700 truncate">4. OPL / PO Luar</div>
                <div className="text-[9px] text-slate-500 truncate">
                  {purchaseOrdersList.length > 0 ? `${purchaseOrdersList.length} PO Terkait` : 'Tidak Ada'}
                </div>
              </div>
            </div>

            {/* Step 5: Pengiriman DO */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${deliveryOrdersList.length > 0 ? 'bg-sky-50 text-sky-600' : 'bg-slate-100 text-slate-400'}`}>
                <Truck size={13} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-700 truncate">5. Surat Jalan</div>
                <div className="text-[9px] text-slate-500 truncate">
                  {deliveryOrdersList.length > 0 ? `${deliveryOrdersList.length} Pengiriman` : 'Belum Kirim'}
                </div>
              </div>
            </div>

            {/* Step 6: Invoicing / Pembayaran */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  isFullyPaid
                    ? 'bg-emerald-50 text-emerald-600'
                    : isPartiallyPaid
                      ? 'bg-amber-50 text-amber-600'
                      : invoicesList.length > 0
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-slate-100 text-slate-400'
                }`}
              >
                <CreditCard size={13} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-700 truncate">6. Pembayaran</div>
                <div className="text-[9px] text-slate-500 truncate">
                  {isFullyPaid
                    ? 'Lunas'
                    : isPartiallyPaid
                      ? 'Sebagian (DP)'
                      : invoicesList.length > 0
                        ? 'Menunggu Bayar'
                        : 'Belum Tagih'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Mini Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-4 text-xs">
          <div className="p-3 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Transaksi</span>
            <div className="font-mono font-bold text-sm text-slate-900">{formatIDR(netTotal)}</div>
            {globalDiscount > 0 && (
              <span className="text-[10px] text-emerald-600 font-medium">Hemat {formatIDR(globalDiscount)}</span>
            )}
          </div>
          <div className="p-3 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Item Produk</span>
            <div className="font-bold text-sm text-slate-800">
              {(order.items || []).length} macam barang
            </div>
            <span className="text-[10px] text-slate-500">
              Total {(order.items || []).reduce((a, b) => a + Number(b.quantity || 0), 0)} unit
            </span>
          </div>
          <div className="p-3 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Kontak Customer</span>
            <div className="font-bold text-slate-700 truncate">{order.customer?.phone || '-'}</div>
            <div className="text-[10px] text-slate-400 truncate">{order.customer?.city || order.customer?.address || 'Lokasi tidak diset'}</div>
          </div>
          <div className="p-3 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Logistik & Tagihan</span>
            <div className="font-bold text-slate-700">
              {deliveryOrdersList.length} DO • {invoicesList.length} Faktur
            </div>
            <span
              className={`inline-block text-[10px] font-semibold ${
                isFullyPaid
                  ? 'text-emerald-600'
                  : isPartiallyPaid
                    ? 'text-amber-600'
                    : invoicesList.length > 0
                      ? 'text-amber-600'
                      : 'text-slate-500'
              }`}
            >
              {isFullyPaid
                ? 'Status Finansial Lunas'
                : isPartiallyPaid
                  ? `Terbayar Sebagian (Sisa ${formatIDR(totalRemaining)})`
                  : invoicesList.length > 0
                    ? `Menunggu Pelunasan (${formatIDR(netTotal)})`
                    : 'Faktur Belum Terbit'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Tabbed Sections */}
      <div className="space-y-4">
        {/* Tab Header */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'items'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-700 border border-slate-200'
              }`}
          >
            <Package size={14} />
            <span>Rincian Item ({(order.items || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('wo')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'wo'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-700 border border-slate-200'
              }`}
          >
            <Factory size={14} />
            <span>Work Order Produksi ({activeWorkOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('opl')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'opl'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-700 border border-slate-200'
              }`}
          >
            <ShoppingBag size={14} />
            <span>OPL & Pengadaan ({purchaseOrdersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('do')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'do'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-700 border border-slate-200'
              }`}
          >
            <Truck size={14} />
            <span>Surat Jalan DO ({deliveryOrdersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'invoices'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-700 border border-slate-200'
              }`}
          >
            <CreditCard size={14} />
            <span>Faktur & Tagihan ({invoicesList.length})</span>
          </button>
        </div>

        {/* Tab 1: Rincian Item */}
        {activeTab === 'items' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Daftar Barang & Jasa Pesanan</h3>
                <p className="text-[11px] text-slate-400">Rincian produk, volume dimensi, harga satuan, dan diskon.</p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                Total: {(order.items || []).length} Baris
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-mono text-[10px] uppercase tracking-wider">
                    <th className="p-3.5 pl-5">No</th>
                    <th className="p-3.5">Nama Produk / Material</th>
                    <th className="p-3.5">Tipe Pengadaan</th>
                    <th className="p-3.5">Dimensi / Ukuran</th>
                    <th className="p-3.5 text-right">Kuantitas</th>
                    <th className="p-3.5 text-right">Harga Satuan</th>
                    <th className="p-3.5 text-right">Potongan</th>
                    <th className="p-3.5 pr-5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(order.items || []).map((item, idx) => {
                    const unitPrice = Number(item.unitPrice || 0);
                    const qty = Number(item.quantity || 0);
                    const discount = Number(item.discountAmount || 0);
                    const subtotal = Number(item.subtotal) || (qty * unitPrice - discount);
                    const unitName = typeof item.unit === 'string' ? item.unit : (item.product?.unit?.name || item.product?.unit?.code || '');

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50">
                        <td className="p-3.5 pl-5 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800">{item.product?.name || item.productName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{item.product?.sku || item.productId}</div>
                          {item.description && <div className="text-[10px] text-slate-500 italic mt-0.5">{item.description}</div>}
                        </td>
                        <td className="p-3.5">
                          {item.product?.procurementType === 'manufacture' || item.product?.type === 'finished_good' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                              <Factory size={10} /> Pabrikasi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                              <ShoppingBag size={10} /> Pembelian / Stok
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 text-[11px]">
                          {item.length ? `${item.length} m` : '-'}
                          {item.pieceCount ? ` (${item.pieceCount} btg)` : ''}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                          {qty.toLocaleString('id-ID')} <span className="font-normal text-slate-500 text-[10px]">{unitName}</span>
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-700">{formatIDR(unitPrice)}</td>
                        <td className="p-3.5 text-right font-mono text-slate-500">
                          {discount > 0 ? `- ${formatIDR(discount)}` : '-'}
                        </td>
                        <td className="p-3.5 pr-5 text-right font-mono font-bold text-slate-900">
                          {formatIDR(subtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
              <div className="text-slate-500 max-w-md">
                {order.notes && (
                  <div>
                    <strong className="text-slate-700">Instruksi Khusus:</strong> {order.notes}
                  </div>
                )}
              </div>

              <div className="w-full sm:w-72 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Bruto:</span>
                  <span>{formatIDR(grossTotal)}</span>
                </div>
                {globalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Diskon Dokumen:</span>
                    <span>- {formatIDR(globalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total Akhir (Net):</span>
                  <span className="text-sky-800 font-black">{formatIDR(netTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Work Order Produksi */}
        {activeTab === 'wo' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Factory size={16} className="text-sky-600" />
                    <span>Surat Perintah Kerja (Work Order) Pabrik</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pelacakan proses manufaktur beton pracetak, cetak & curing, finishing, dan quality control (QC).
                  </p>
                </div>

                {hasManufactureItems && activeWorkOrders.length === 0 && order.status !== 'Draft' && (
                  <button
                    onClick={handleGenerateWorkOrders}
                    disabled={isActionLoading}
                    className="btn btn-primary btn-sm"
                  >
                    <Factory size={13} />
                    <span>Generate Work Order Sekarang</span>
                  </button>
                )}
              </div>

              {activeWorkOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <Factory size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">
                    {!hasManufactureItems
                      ? 'Pesanan ini tidak memerlukan Work Order karena seluruh item bertipe Barang Beli / Stok Gudang.'
                      : 'Belum ada Surat Perintah Kerja (WO) yang digenerate untuk pesanan ini.'}
                  </p>
                  {hasManufactureItems && order.status === 'Draft' && (
                    <p className="text-[11px] text-amber-600 font-medium">
                      Setujui (Approve) Sales Order terlebih dahulu sebelum mengirim ke antrian produksi pabrik.
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeWorkOrders.map((wo: any, idx) => {
                    const targetQty = Number(wo.targetQty || wo.target_qty || 0);
                    const completedQty = Number(wo.completedQty || wo.completed_qty || 0);
                    const progress = Number(wo.progress || (targetQty > 0 ? (completedQty / targetQty) * 100 : 0));

                    return (
                      <div key={wo.id || idx} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 hover:border-sky-300 transition-all space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono font-bold text-xs text-sky-800">{wo.workOrderNumber}</span>
                            <h4 className="font-bold text-slate-800 text-xs mt-0.5">
                              {wo.product?.name || 'Produk Beton Pracetak'}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400">{wo.product?.sku || wo.productId}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                            {wo.stage || 'In Production'}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Kemajuan Produksi</span>
                            <span className="font-mono font-bold text-slate-700">{progress.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-sky-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>Selesai: {completedQty} unit</span>
                            <span>Target: {targetQty} unit</span>
                          </div>
                        </div>

                        {/* Task Breakdown if available */}
                        {wo.tasks && wo.tasks.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/80">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                              Tahapan Produksi:
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                              {wo.tasks.map((task: any, tIdx: number) => (
                                <div
                                  key={task.id || tIdx}
                                  className="px-2 py-1 bg-white rounded border border-slate-200 flex items-center justify-between"
                                >
                                  <span className="truncate text-slate-600">{task.taskName}</span>
                                  <span className={`font-semibold shrink-0 ml-1 ${task.status === 'Completed' || task.status === 'Selesai' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {task.status || 'Pending'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => onNavigate && onNavigate('production-work-orders')}
                            className="text-[11px] font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Buka di Modul Work Order</span>
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: OPL & Pengadaan (Purchase Orders) */}
        {activeTab === 'opl' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <ShoppingBag size={16} className="text-sky-600" />
                    <span>Order Pekerjaan Luar (OPL) & Pengadaan Terkait</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Purchase Order (PO) pembelian material khusus atau jasa subkontrak luar untuk memenuhi pesanan ini.
                  </p>
                </div>

                <button
                  onClick={() => onNavigate && onNavigate('purchase-orders')}
                  className="btn btn-secondary btn-sm"
                >
                  <ExternalLink size={12} />
                  <span>Modul Purchasing (PO)</span>
                </button>
              </div>

              {purchaseOrdersList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <ShoppingBag size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">
                    Tidak ada PO pengadaan atau Order Pekerjaan Luar (OPL) yang ditautkan ke Sales Order ini.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Pesanan dapat dipenuhi langsung menggunakan material stok gudang internal.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {purchaseOrdersList.map((po: any, idx: number) => (
                    <div key={po.id || idx} className="p-4 bg-white hover:bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-sky-800">{po.poNumber}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {po.status || 'Draft'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-700">
                          Supplier / Rekanan: {po.supplierName || po.supplier?.name || 'Rekanan Luar'}
                        </div>
                        {po.items && po.items.length > 0 && (
                          <div className="text-[11px] text-slate-500">
                            {po.items.length} item material dipesan • Diterima {po.items.reduce((a: number, b: any) => a + Number(b.receivedQty || 0), 0)} unit
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigate && onNavigate('purchase-orders')}
                          className="btn btn-secondary btn-sm text-[11px]"
                        >
                          <ExternalLink size={12} />
                          <span>Lihat Detail PO</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Surat Jalan (Delivery Order) */}
        {activeTab === 'do' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Truck size={16} className="text-sky-600" />
                    <span>Surat Jalan & Riwayat Pengiriman (Delivery Order)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Daftar armada pengiriman, supir, status barang keluar dari pabrik menuju lokasi proyek pelanggan.
                  </p>
                </div>

                <button
                  onClick={() => onNavigate && onNavigate('delivery-orders')}
                  className="btn btn-secondary btn-sm"
                >
                  <ExternalLink size={12} />
                  <span>Modul Surat Jalan (DO)</span>
                </button>
              </div>

              {deliveryOrdersList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <Truck size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">
                    Belum ada Surat Jalan (DO) yang diterbitkan untuk pesanan ini.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Surat Jalan dapat dibuat setelah barang siap di gudang dan Sales Order disetujui.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {deliveryOrdersList.map((doDoc: any, idx: number) => (
                    <div key={doDoc.id || idx} className="p-4 bg-white hover:bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-sky-800">{doDoc.deliveryNumber}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            {doDoc.status || 'Draft'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700">
                          Penerima: <strong>{doDoc.receiverName || order.customerName}</strong>
                          {doDoc.driverName && <span> • Supir: {doDoc.driverName} ({doDoc.vehicleNumber || 'Armada Pabrik'})</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Tanggal Pengiriman: {formatDate(doDoc.deliveryDate)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigate && onNavigate('delivery-orders')}
                          className="btn btn-secondary btn-sm text-[11px]"
                        >
                          <ExternalLink size={12} />
                          <span>Lihat Surat Jalan</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Faktur & Penagihan */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <CreditCard size={16} className="text-sky-600" />
                    <span>Faktur Penagihan & Status Pembayaran</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Faktur komersial (Invoice), pembayaran termin/DP, dan sisa saldo piutang pelanggan.
                  </p>
                </div>

                <button
                  onClick={() => onNavigate && onNavigate('invoices')}
                  className="btn btn-secondary btn-sm"
                >
                  <ExternalLink size={12} />
                  <span>Modul Penagihan (Invoice)</span>
                </button>
              </div>

              {invoicesList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <CreditCard size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">
                    Belum ada faktur penagihan (Invoice) yang diterbitkan untuk Sales Order ini.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Faktur dapat digenerate otomatis atau dibuat melalui modul Penagihan.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {invoicesList.map((inv: any, idx: number) => {
                    const paid = Number(inv.paidAmount || 0);
                    const total = Number(inv.total || netTotal);
                    const remaining = Math.max(0, total - paid);

                    return (
                      <div key={inv.id || idx} className="p-4 bg-white hover:bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-sky-800">{inv.invoiceNumber || `INV-${inv.id.substring(0, 8)}`}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${paid >= total ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                              {paid >= total ? 'Lunas' : paid > 0 ? 'Dibayar Sebagian' : 'Belum Dibayar'}
                            </span>
                          </div>
                          <div className="text-xs font-mono">
                            Total: <strong className="text-slate-800">{formatIDR(total)}</strong> • Terbayar: <span className="text-emerald-700">{formatIDR(paid)}</span>
                            {remaining > 0 && <span className="text-rose-600"> • Sisa: {formatIDR(remaining)}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onNavigate && onNavigate('invoices')}
                            className="btn btn-secondary btn-sm text-[11px]"
                          >
                            <ExternalLink size={12} />
                            <span>Buka Faktur</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Thermal Print Modal Preview */}
      {showThermalPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-60 p-4 font-sans text-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-5 py-3.5 bg-linear-to-r from-sky-600 to-sky-700 text-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-sky-100" />
                <div>
                  <h3 className="font-bold text-sm">Cetak Thermal Sales Order</h3>
                  <p className="text-[10px] text-sky-100/80">{order.orderNumber} - Format roll 80mm</p>
                </div>
              </div>
              <button
                onClick={() => setShowThermalPreview(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Live Preview */}
            <div className="p-4 bg-slate-100 flex-1 overflow-y-auto">
              <div className="bg-white p-4 shadow-sm border border-slate-200 rounded-lg mx-auto max-w-[76mm]">
                <div
                  className="font-mono text-[11px] text-black"
                  dangerouslySetInnerHTML={{ __html: thermalHtml }}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2 shrink-0">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => printSalesOrderThermal(printInfo, companyProfile, onTriggerNotification)}
                  className="btn btn-success btn-md text-[11px]"
                  title="Cetak lewat dialog browser / USB printer"
                >
                  <Printer size={14} />
                  <span>Cetak Struk</span>
                </button>
                <button
                  onClick={() => printBluetoothSalesOrder(printInfo, companyProfile, onTriggerNotification)}
                  className="btn btn-primary btn-md text-[11px]"
                  title="Cetak via Bluetooth ESC/POS"
                >
                  <Printer size={14} />
                  <span>Bluetooth</span>
                </button>
                <button
                  onClick={() => downloadSalesOrderThermalPdf(printInfo, companyProfile, onTriggerNotification)}
                  className="btn btn-secondary btn-md text-[11px]"
                  title="Unduh file PDF roll 80mm"
                >
                  <span>Unduh PDF</span>
                </button>
              </div>
              <button
                onClick={() => setShowThermalPreview(false)}
                className="btn btn-secondary btn-md text-[11px] w-full"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Hidden A4 Print Document for PDF / Window Print */}
      <div className="hidden">
        <div ref={printRef} className="p-8 text-black bg-white font-sans text-xs max-w-4xl mx-auto leading-normal">
          {/* Header Kop Surat Perusahaan */}
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
            <div className="flex items-center gap-4">
              {companyProfile.logoUrl ? (
                <img src={companyProfile.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
              ) : (
                <div className="w-16 h-16 bg-slate-900 flex items-center justify-center text-white font-black text-2xl tracking-tighter">
                  {companyProfile.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-black tracking-tight">{companyProfile.name.toUpperCase()}</h1>
                <p className="font-bold text-xs">General Contractor & Supplier Material Alam</p>
                <p className="text-[11px] mt-1">{formatAddressForPrint(companyProfile.address)}</p>
                <p className="text-[10px] mt-0.5">Telp: {companyProfile.phone || '-'} | Email: {companyProfile.email || '-'}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="border border-black px-4 py-1 font-black tracking-[0.2em] text-slate-700 text-lg">
                SALES ORDER
              </div>
              <p className="font-mono font-bold mt-2 text-base">{order.orderNumber}</p>
              {(order.quotationNumber || order.quotation?.quotationNumber) && (
                <p className="text-xs font-semibold text-slate-600">
                  Ref Penawaran: {order.quotationNumber || order.quotation?.quotationNumber}
                </p>
              )}
              <p className="text-xs">Tanggal Order: {formatDate(order.orderDate)}</p>
              <p className="text-xs">Status: <span className="font-bold">{order.status}</span></p>
            </div>
          </div>

          {/* Customer Information */}
          <div className="border border-black rounded-md p-3 w-[48%] mb-5">
            <p className="text-[10px] font-mono font-bold text-slate-600 tracking-wider">KEPADA YTH. (CUSTOMER)</p>
            <p className="font-bold text-base mt-0.5">{order.customerName || order.customer?.name || 'Pelanggan Umum'}</p>
            {order.customer?.phone && <p className="text-[11px] text-slate-700">Telp: {order.customer.phone}</p>}
            {order.customer?.address && <p className="text-[10px] text-slate-600 mt-0.5">{order.customer.address}</p>}
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse border border-black text-xs mb-5">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black p-2 w-10 text-center">NO</th>
                <th className="border border-black p-2 text-left">NAMA PRODUK / PEKERJAAN</th>
                <th className="border border-black p-2 w-24 text-right">QTY</th>
                <th className="border border-black p-2 w-32 text-right">HARGA SATUAN</th>
                <th className="border border-black p-2 w-32 text-right">JUMLAH</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item: any, idx: number) => {
                const itemUnitPrice = Number(item.unitPrice || 0);
                const qty = Number(item.quantity || 0);
                const discount = Number(item.discountAmount || 0);
                const itemSubtotal = Number(item.subtotal || qty * itemUnitPrice - discount);
                const unitName = typeof item.unit === 'string' ? item.unit : (item.product?.unit?.name || item.product?.unit?.code || '');

                return (
                  <tr key={idx}>
                    <td className="border border-black p-2 text-center align-top">{idx + 1}</td>
                    <td className="border border-black p-2 align-top">
                      <span className="font-bold block">{item.product?.name || item.productName || 'Item'}</span>
                      {item.pieceCount && item.length && (
                        <div className="text-[10px] text-slate-800 font-bold mt-0.5">
                          Ukuran: {item.pieceCount} Fisik @ {item.length} {unitName || 'M'}
                        </div>
                      )}
                      {item.description && (
                        <div className="text-[10px] text-slate-600 italic mt-0.5">{item.description}</div>
                      )}
                    </td>
                    <td className="border border-black p-2 text-right font-mono align-top">
                      {qty} <span className="text-[10px] uppercase font-sans">{unitName}</span>
                    </td>
                    <td className="border border-black p-2 text-right font-mono align-top">
                      {formatIDR(itemUnitPrice)}
                      {discount > 0 && <div className="text-[9px] text-rose-600">- Diskon: {formatIDR(discount)}</div>}
                    </td>
                    <td className="border border-black p-2 text-right font-mono font-bold align-top">{formatIDR(itemSubtotal)}</td>
                  </tr>
                );
              })}
              {(!order.items || order.items.length === 0) && (
                <tr>
                  <td colSpan={5} className="border border-black p-3 text-center text-slate-500">Tidak ada item pesanan.</td>
                </tr>
              )}
              {globalDiscount > 0 && (
                <>
                  <tr className="bg-slate-50">
                    <td colSpan={4} className="border border-black p-2 text-right font-bold text-[11px]">SUBTOTAL KOTOR</td>
                    <td className="border border-black p-2 text-right font-mono">{formatIDR(grossTotal)}</td>
                  </tr>
                  <tr className="bg-rose-50 text-rose-700">
                    <td colSpan={4} className="border border-black p-2 text-right font-bold text-[11px]">
                      DISKON TRANSAKSI {order.globalDiscountType === 'percentage' && order.globalDiscountValue ? `(${order.globalDiscountValue}%)` : ''}
                    </td>
                    <td className="border border-black p-2 text-right font-mono">- {formatIDR(globalDiscount)}</td>
                  </tr>
                </>
              )}
              <tr className="bg-slate-100 font-bold">
                <td colSpan={4} className="border border-black p-2.5 text-right font-black">TOTAL SALES ORDER</td>
                <td className="border border-black p-2.5 text-right font-black font-mono text-sm">{formatIDR(netTotal)}</td>
              </tr>
            </tbody>
          </table>

          {/* Rincian Invoice & Kuitansi Pembayaran */}
          <div className="mb-6 border border-black rounded-sm overflow-hidden">
            <div className="bg-slate-800 text-white p-2 font-bold text-xs uppercase tracking-wider flex justify-between items-center">
              <span>RINCIAN INVOICE & KUITANSI TANDA TERIMA PEMBAYARAN</span>
              <span className="text-[10px] font-mono normal-case tracking-normal bg-slate-700 px-2 py-0.5 rounded">
                Status: {printInfo.paymentStatus}
              </span>
            </div>

            {printInfo.invoices && printInfo.invoices.length > 0 ? (
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-black">
                    <th className="p-2 border-r border-black w-8 text-center">NO</th>
                    <th className="p-2 border-r border-black text-left">NO. INVOICE</th>
                    <th className="p-2 border-r border-black w-24 text-center">TGL INVOICE</th>
                    <th className="p-2 border-r border-black text-right w-28">NILAI FAKTUR</th>
                    <th className="p-2 border-r border-black text-left">RINCIAN KUITANSI (TANDA TERIMA)</th>
                    <th className="p-2 text-right w-28">TOTAL TERBAYAR</th>
                  </tr>
                </thead>
                <tbody>
                  {printInfo.invoices.map((inv, idx) => (
                    <tr key={idx} className="border-b border-black">
                      <td className="p-2 border-r border-black text-center align-top">{idx + 1}</td>
                      <td className="p-2 border-r border-black font-mono font-bold align-top">
                        {inv.invoiceNumber}
                        <div className="text-[10px] font-sans font-normal text-slate-600">Status: {inv.status}</div>
                      </td>
                      <td className="p-2 border-r border-black text-center align-top">{inv.issueDate || '-'}</td>
                      <td className="p-2 border-r border-black text-right font-mono align-top">{formatIDR(inv.totalAmount)}</td>
                      <td className="p-2 border-r border-black align-top">
                        {inv.payments && inv.payments.length > 0 ? (
                          <div className="space-y-1">
                            {inv.payments.map((p, pIdx) => (
                              <div key={pIdx} className="flex justify-between items-center bg-slate-50 p-1 rounded border border-slate-200 text-[11px]">
                                <div>
                                  <span className="font-mono font-bold text-sky-900">{p.paymentNumber}</span>
                                  <span className="text-slate-500 ml-1.5 font-sans">({p.method}{p.paymentDate ? ` • ${p.paymentDate}` : ''})</span>
                                </div>
                                <span className="font-mono font-bold">{formatIDR(p.amount)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">(Belum ada kuitansi pembayaran)</span>
                        )}
                      </td>
                      <td className="p-2 text-right font-mono font-bold align-top text-emerald-800">
                        {formatIDR(inv.paidAmount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t border-black">
                    <td colSpan={5} className="p-2 text-right border-r border-black">TOTAL SUDAH TERBAYAR (KUITANSI):</td>
                    <td className="p-2 text-right font-mono text-emerald-800">{formatIDR(printInfo.totalPaid || 0)}</td>
                  </tr>
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={5} className="p-2 text-right border-r border-black text-rose-800">SISA TAGIHAN (OUTSTANDING):</td>
                    <td className="p-2 text-right font-mono text-rose-800">{formatIDR(printInfo.totalRemaining || 0)}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="p-4 text-center text-slate-600 bg-slate-50 space-y-1">
                <p className="font-semibold">Belum ada faktur (invoice) atau kuitansi tanda terima yang diterbitkan untuk Sales Order ini.</p>
                <p className="text-[11px]">Total tagihan terutang: <strong className="font-mono text-black">{formatIDR(netTotal)}</strong></p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="text-[11px] mb-8">
            <strong>Catatan Dokumen:</strong>
            <p className="mt-0.5 text-slate-700 italic">
              {order.notes || 'Dokumen ini diterbitkan sebagai bukti konfirmasi pemesanan resmi (Sales Order) dan dasar penagihan pembayaran.'}
            </p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 text-center text-xs mt-10">
            <div>
              <p>Dibuat Oleh,</p>
              <div className="h-20" />
              <p className="border-t border-black pt-1.5 font-bold">SALES DEPT.</p>
              <p className="text-[10px] text-slate-600">{companyProfile.name}</p>
            </div>
            <div>
              <p>Menyetujui (Customer),</p>
              <div className="h-20" />
              <p className="border-t border-black pt-1.5 font-bold">{order.customerName || order.customer?.name || 'Pelanggan'}</p>
              <p className="text-[10px] text-slate-600">Tanda Tangan & Cap</p>
            </div>
            <div>
              <p>Mengetahui,</p>
              <div className="h-20" />
              <p className="border-t border-black pt-1.5 font-bold">DIREKTUR UTAMA</p>
              <p className="text-[10px] text-slate-600">{companyProfile.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
