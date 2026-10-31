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
  Building2,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Package,
  ShoppingBag,
  ExternalLink,
  XCircle,
  FileText,
  Phone,
  MapPin,
  RefreshCw,
  Edit2,
  ChevronRight,
  HelpCircle,
} from '@/src/components/icons';
import { Quotation, ViewType } from '../../../types';
import { salesApi } from '../api';
import { formatDate } from '../../../utils/date';
import { CompanyProfile, getCompanyProfile, formatAddressForPrint } from '../../../utils/companyProfile';
import {
  QuotationPrintInfo,
  printQuotationThermal,
  downloadQuotationThermalPdf,
  printBluetoothQuotation,
  buildQuotationThermalHTML,
} from '../services/QuotationPrintService';

interface QuotationDetailViewProps {
  quotationId: string;
  initialQuotation?: Quotation | null;
  onBack: () => void;
  onNavigate?: (view: ViewType | string) => void;
  onTriggerNotification: (message: string) => void;
  onEdit?: (quotation: Quotation) => void;
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

export default function QuotationDetailView({
  quotationId,
  initialQuotation,
  onBack,
  onNavigate,
  onTriggerNotification,
  onEdit,
}: QuotationDetailViewProps) {
  const [quotation, setQuotation] = useState<Quotation | null>(initialQuotation || null);
  const [isLoading, setIsLoading] = useState(!initialQuotation);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'orders' | 'notes'>('items');
  const [showThermalPreview, setShowThermalPreview] = useState(false);
  const companyProfile = getCompanyProfile();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintA4 = useReactToPrint({
    contentRef: printRef,
    documentTitle: quotation ? `QUO-${quotation.quotationNumber || quotation.quoteNumber}` : 'quotation',
  });

  const loadQuotationDetail = async () => {
    setIsLoading(true);
    try {
      const data = await salesApi.getQuotation(quotationId);
      setQuotation(data);
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal memuat detail Penawaran');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (quotationId) {
      loadQuotationDetail();
    }
  }, [quotationId]);

  if (isLoading && !quotation) {
    return (
      <div className="p-8 space-y-4 font-sans">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-4 h-4 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
          <span>Memuat data Penawaran...</span>
        </div>
        <div className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse" />
        <div className="h-64 bg-white border border-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="p-8 font-sans text-center bg-white border border-slate-200 rounded-2xl space-y-4 max-w-lg mx-auto my-12">
        <AlertCircle size={36} className="mx-auto text-rose-500" />
        <h3 className="font-bold text-slate-800 text-base">Penawaran Tidak Ditemukan</h3>
        <p className="text-xs text-slate-500">
          Data Penawaran dengan ID ini tidak dapat dimuat atau telah dihapus.
        </p>
        <button onClick={onBack} className="btn btn-secondary btn-md mx-auto">
          <ChevronLeft size={14} />
          <span>Kembali ke Daftar</span>
        </button>
      </div>
    );
  }

  const docNumber = quotation.quotationNumber || quotation.quoteNumber || 'QUO';
  const isApproved = quotation.status === 'Disetujui' || quotation.status === 'approved';
  const isDraft = quotation.status === 'Draft' || quotation.status === 'draft';
  const isSent = quotation.status === 'Terkirim' || quotation.status === 'sent';
  const isCancelled = quotation.status === 'cancelled' || quotation.status === 'Dibatalkan';

  const getStatusBadgeClass = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'disetujui':
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'terkirim':
      case 'sent':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'draft':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'dibatalkan':
      case 'cancelled':
      case 'ditolak':
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleApprove = async () => {
    if (!window.confirm(`Konfirmasi persetujuan Penawaran ${docNumber}? Penawaran akan disetujui dan otomatis membuat Sales Order.`)) {
      return;
    }

    setIsActionLoading(true);
    try {
      const createdSo = await salesApi.approveQuotation(quotation.id);
      onTriggerNotification(`Penawaran ${docNumber} berhasil disetujui. Sales Order ${createdSo.orderNumber} telah dibuat.`);
      await loadQuotationDetail();
      if (onNavigate) {
        onNavigate(`/sales/order/${createdSo.id}`);
      }
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal menyetujui penawaran');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelQuotation = async () => {
    const reason = window.prompt(`Masukkan alasan pembatalan Penawaran ${docNumber}:`);
    if (reason === null) return;

    setIsActionLoading(true);
    try {
      await salesApi.cancelQuotation(quotation.id, reason);
      onTriggerNotification(`Penawaran ${docNumber} berhasil dibatalkan.`);
      await loadQuotationDetail();
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal membatalkan penawaran');
    } finally {
      setIsActionLoading(false);
    }
  };

  const mapToPrintInfo = (): QuotationPrintInfo => ({
    quotationNumber: docNumber,
    quotationDate: formatDate(quotation.quotationDate || quotation.date),
    validUntil: quotation.validUntil ? formatDate(quotation.validUntil) : undefined,
    customerName: quotation.customerName || quotation.customer?.name || 'Pelanggan',
    customerPhone: quotation.customer?.phone || undefined,
    status: quotation.status || 'Draft',
    notes: quotation.notes || undefined,
    total: Number(quotation.total) || 0,
    globalDiscountAmount: Number(quotation.globalDiscountAmount) || 0,
    globalDiscountType: quotation.globalDiscountType || undefined,
    globalDiscountValue: Number(quotation.globalDiscountValue) || 0,
    items: (quotation.items || []).map((item) => {
      const unitPrice = Number(item.price ?? item.unitPrice ?? 0);
      const qty = Number(item.quantity) || 0;
      const discount = Number(item.discountAmount) || 0;
      const subtotal = Number(item.subtotal) || (qty * unitPrice - discount);
      const rawUnit = item.unit || item.product?.unit?.name || item.product?.unit?.code || '';
      const unitName = typeof rawUnit === 'string' ? rawUnit : '';

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
  });

  const printInfo = mapToPrintInfo();
  const thermalHtml = buildQuotationThermalHTML(printInfo, companyProfile, false);

  const totalItemGross = (quotation.items || []).reduce((acc, it) => {
    const unitPrice = Number(it.price ?? it.unitPrice ?? 0);
    const qty = Number(it.quantity || 0);
    const gross = unitPrice * qty;
    return acc + (gross > 0 ? gross : ((Number(it.subtotal || 0)) + (Number(it.discountAmount || 0))));
  }, 0);
  const totalItemDiscount = (quotation.items || []).reduce((acc, it) => acc + (Number(it.discountAmount) || 0), 0);
  const globalDiscountAmount = Number(quotation.globalDiscountAmount) || 0;
  const grandTotal = Number(quotation.total) || 0;
  const subtotalGross = totalItemGross > 0 ? totalItemGross : (grandTotal + globalDiscountAmount + totalItemDiscount);
  const hasAnyDiscount = totalItemDiscount > 0 || globalDiscountAmount > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-800">
      {/* 1. Header Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={onBack}
            className="btn btn-secondary btn-sm flex items-center gap-1 font-semibold text-slate-700 hover:text-sky-700"
          >
            <ChevronLeft size={14} />
            <span>Daftar Penawaran</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 font-medium">Penjualan</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 font-medium">Penawaran (Quotation)</span>
          <span className="text-slate-300">/</span>
          <span className="font-mono font-bold text-sky-700">{docNumber}</span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={loadQuotationDetail}
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
                {docNumber}
              </span>
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getStatusBadgeClass(quotation.status)}`}>
                {quotation.status}
              </span>
              {quotation.validUntil && (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium text-slate-600 bg-slate-100 border border-slate-200">
                  Berlaku s/d: {formatDate(quotation.validUntil)}
                </span>
              )}
            </div>

            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span>{quotation.customerName || quotation.customer?.name || 'Pelanggan Umum'}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                <span>Tanggal: <strong className="text-slate-700 font-medium">{formatDate(quotation.quotationDate || quotation.date)}</strong></span>
              </div>
              {quotation.customer?.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={13} className="text-slate-400" />
                  <span>Telp: <strong className="text-slate-700 font-medium">{quotation.customer.phone}</strong></span>
                </div>
              )}
              {quotation.notes && (
                <div className="flex items-center gap-1.5 text-slate-500 italic">
                  <span>Catatan: {quotation.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Print Thermal 80mm Button */}
            <button
              onClick={() => setShowThermalPreview(true)}
              className="btn btn-primary btn-md shadow-xs text-xs"
              title="Cetak struk thermal 80mm roll"
            >
              <Receipt size={14} />
              <span>Cetak Thermal (80mm)</span>
            </button>

            {/* Print PDF A4 Button */}
            <button
              onClick={() => handlePrintA4()}
              className="btn btn-secondary btn-md text-xs"
              title="Cetak PDF Dokumen Resmi (A4)"
            >
              <Printer size={14} />
              <span>Cetak PDF (A4)</span>
            </button>

            {/* Approve Button */}
            {(isDraft || isSent) && (
              <button
                onClick={handleApprove}
                disabled={isActionLoading}
                className="btn btn-success btn-md text-xs"
                title="Setujui penawaran dan buat Sales Order otomatis"
              >
                <FileCheck size={14} />
                <span>Setujui (Approve)</span>
              </button>
            )}

            {/* Edit Button */}
            {isDraft && onEdit && (
              <button
                onClick={() => onEdit(quotation)}
                disabled={isActionLoading}
                className="btn btn-secondary btn-md text-amber-700 hover:text-amber-800 border-amber-200 hover:bg-amber-50 text-xs"
              >
                <Edit2 size={14} />
                <span>Edit Penawaran</span>
              </button>
            )}

            {/* Convert to SO (if already approved and user wants to create SO manually) */}
            {isApproved && (
              <button
                onClick={() => {
                  sessionStorage.setItem('action_create_so', quotation.id);
                  if (onNavigate) {
                    onNavigate('sales-orders');
                  }
                }}
                className="btn btn-secondary btn-md text-sky-700 hover:text-sky-800 border-sky-200 hover:bg-sky-50 text-xs"
                title="Buka form pembuatan Sales Order dengan referensi penawaran ini"
              >
                <ShoppingBag size={14} className="text-sky-600" />
                <span>Buat Sales Order</span>
              </button>
            )}

            {/* Cancel Button */}
            {!isCancelled && (
              <button
                onClick={handleCancelQuotation}
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
            Status Alur Penawaran:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Step 1: Draf */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={13} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-700 truncate">1. Draf Dibuat</div>
                <div className="text-[9px] text-slate-500 truncate font-mono">{formatDate(quotation.quotationDate || quotation.date)}</div>
              </div>
            </div>

            {/* Step 2: Terkirim / Review */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${!isDraft ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                {!isDraft ? <CheckCircle2 size={13} /> : <Clock size={13} />}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-700 truncate">2. Diajukan ke Klien</div>
                <div className="text-[9px] text-slate-500 truncate">
                  {!isDraft ? 'Terkirim' : 'Draf'}
                </div>
              </div>
            </div>

            {/* Step 3: Approval Pelanggan */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isApproved ? 'bg-emerald-50 text-emerald-600' : isCancelled ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-400'}`}>
                {isApproved ? <CheckCircle2 size={13} /> : isCancelled ? <XCircle size={13} /> : <Clock size={13} />}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-700 truncate">3. Persetujuan</div>
                <div className="text-[9px] text-slate-500 truncate">
                  {isApproved ? 'Disetujui' : isCancelled ? 'Dibatalkan' : 'Menunggu'}
                </div>
              </div>
            </div>

            {/* Step 4: Konversi ke SO */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${(quotation.salesOrders && quotation.salesOrders.length > 0) ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                {(quotation.salesOrders && quotation.salesOrders.length > 0) ? <CheckCircle2 size={13} /> : <ShoppingBag size={13} />}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-700 truncate">4. Sales Order (SO)</div>
                <div className="text-[9px] text-slate-500 truncate">
                  {(quotation.salesOrders && quotation.salesOrders.length > 0) ? `${quotation.salesOrders.length} SO Terbit` : 'Belum Konversi'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-white">
          {/* Card 1: Pelanggan */}
          <div className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Building2 size={14} className="text-slate-400" />
              <span>Informasi Pelanggan</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-bold text-sm text-slate-800">
                {quotation.customerName || quotation.customer?.name || 'Pelanggan'}
              </div>
              {quotation.customer?.phone && (
                <div className="text-slate-600 flex items-center gap-1.5">
                  <Phone size={12} className="text-slate-400" />
                  <span>{quotation.customer.phone}</span>
                </div>
              )}
              {(quotation.customer?.address || quotation.customer?.city) && (
                <div className="text-slate-500 text-[11px] flex items-start gap-1.5">
                  <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>{[quotation.customer.address, quotation.customer.city].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Masa Berlaku & Periode */}
          <div className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Calendar size={14} className="text-slate-400" />
              <span>Periode Penawaran</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Tanggal Terbit:</span>
                <span className="font-medium text-slate-800">{formatDate(quotation.quotationDate || quotation.date)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Berlaku Hingga:</span>
                <span className="font-medium text-amber-700">{quotation.validUntil ? formatDate(quotation.validUntil) : '-'}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Total Item:</span>
                <span className="font-medium text-slate-800">{(quotation.items || []).length} Produk / Jasa</span>
              </div>
            </div>
          </div>

          {/* Card 3: Ringkasan Nilai Penawaran */}
          <div className="p-5 space-y-2 bg-sky-50/20">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-800 uppercase tracking-wider">
              <Receipt size={14} className="text-sky-600" />
              <span>Nilai Penawaran</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">{hasAnyDiscount ? 'Subtotal Bruto:' : 'Subtotal:'}</span>
                <span className="font-mono text-slate-700">{formatIDR(hasAnyDiscount ? subtotalGross : grandTotal)}</span>
              </div>
              {totalItemDiscount > 0 && (
                <div className="flex justify-between py-0.5 text-rose-600">
                  <span>Diskon Item:</span>
                  <span className="font-mono">- {formatIDR(totalItemDiscount)}</span>
                </div>
              )}
              {globalDiscountAmount > 0 && (
                <div className="flex justify-between py-0.5 text-rose-600">
                  <span>
                    Diskon Transaksi
                    {quotation.globalDiscountType === 'percentage' && quotation.globalDiscountValue ? ` (${quotation.globalDiscountValue}%)` : ''}:
                  </span>
                  <span className="font-mono">- {formatIDR(globalDiscountAmount)}</span>
                </div>
              )}
              {totalItemDiscount > 0 && globalDiscountAmount > 0 && (
                <div className="flex justify-between py-0.5 text-rose-700 font-bold border-t border-slate-200">
                  <span>Total Diskon:</span>
                  <span className="font-mono">- {formatIDR(totalItemDiscount + globalDiscountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-t border-slate-200 font-bold text-sm text-sky-900">
                <span>Total Penawaran:</span>
                <span className="font-mono">{formatIDR(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tabbed Content Sections */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('items')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'items'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package size={14} />
            <span>Rincian Produk & Item</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 text-sky-800 font-bold">
              {(quotation.items || []).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag size={14} />
            <span>Sales Order Terkait</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold">
              {(quotation.salesOrders || []).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'notes'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText size={14} />
            <span>Catatan & Syarat Ketentuan</span>
          </button>
        </div>

        {/* Tab 1: Rincian Produk */}
        {activeTab === 'items' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">Nama Produk / Jasa</th>
                    <th className="p-3 w-28 text-right">Jumlah (Qty)</th>
                    <th className="p-3 w-36 text-right">Harga Satuan</th>
                    <th className="p-3 w-32 text-right">Diskon Item</th>
                    <th className="p-3 w-36 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(quotation.items || []).map((item, idx) => {
                    const unitPrice = Number(item.price ?? item.unitPrice ?? 0);
                    const qty = Number(item.quantity) || 0;
                    const discount = Number(item.discountAmount) || 0;
                    const subtotal = Number(item.subtotal) || (qty * unitPrice - discount);
                    const unitStr = item.unit || item.product?.unit?.name || item.product?.unit?.code || '';

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-3 space-y-1">
                          <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
                            <span>{item.product?.name || item.productName || 'Unknown Product'}</span>
                            {item.product?.sku && (
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {item.product.sku}
                              </span>
                            )}
                          </div>
                          {item.pieceCount && item.length && (
                            <div className="text-[11px] text-sky-800 font-medium">
                              Dimensi Fisik: {item.pieceCount} batang/pcs @ {item.length} {unitStr || 'meter'}
                            </div>
                          )}
                          {item.specification && (
                            <div className="text-[11px] text-slate-500">
                              Spesifikasi: {item.specification}
                            </div>
                          )}
                          {item.description && (
                            <div className="text-[11px] text-slate-500 italic">
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-slate-800">
                          {qty} <span className="font-sans text-[11px] text-slate-500 uppercase">{unitStr}</span>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-700">
                          {formatIDR(unitPrice)}
                        </td>
                        <td className="p-3 text-right font-mono text-rose-600">
                          {discount > 0 ? (
                            <span>
                              - {formatIDR(discount)}
                              {(() => {
                                const gross = qty * unitPrice;
                                if (gross > 0) {
                                  const pct = Math.round((discount / gross) * 100);
                                  if (pct > 0 && pct <= 100) return ` (${pct}%)`;
                                }
                                return '';
                              })()}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {formatIDR(subtotal)}
                        </td>
                      </tr>
                    );
                  })}
                  {(!quotation.items || quotation.items.length === 0) && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        Tidak ada rincian item pada penawaran ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Breakdown */}
            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <div className="w-full max-w-sm space-y-1.5 text-xs font-mono">
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Subtotal Bruto:</span>
                  <span>{formatIDR(subtotalGross)}</span>
                </div>
                {totalItemDiscount > 0 && (
                  <div className="flex justify-between py-1 text-rose-600 font-semibold">
                    <span>Diskon Item:</span>
                    <span>- {formatIDR(totalItemDiscount)}</span>
                  </div>
                )}
                {globalDiscountAmount > 0 && (
                  <div className="flex justify-between py-1 text-rose-600 font-semibold">
                    <span>
                      Diskon Transaksi
                      {quotation.globalDiscountType === 'percentage' && quotation.globalDiscountValue ? ` (${quotation.globalDiscountValue}%)` : ''}:
                    </span>
                    <span>- {formatIDR(globalDiscountAmount)}</span>
                  </div>
                )}
                {totalItemDiscount > 0 && globalDiscountAmount > 0 && (
                  <div className="flex justify-between py-1 text-rose-700 font-bold border-t border-slate-200">
                    <span>Total Diskon:</span>
                    <span>- {formatIDR(totalItemDiscount + globalDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t-2 border-slate-200 text-sm font-bold text-slate-800">
                  <span>Total Penawaran:</span>
                  <span className="text-sky-800 font-black">{formatIDR(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Sales Order Terkait */}
        {activeTab === 'orders' && (
          <div className="p-4 sm:p-6 space-y-4">
            {quotation.salesOrders && quotation.salesOrders.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Berikut adalah daftar Sales Order yang diterbitkan berdasarkan surat penawaran ini:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quotation.salesOrders.map((so) => (
                    <div
                      key={so.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-300 transition-all flex items-center justify-between shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <ShoppingBag size={15} className="text-sky-600" />
                          <span className="font-mono font-bold text-slate-800 text-sm">{so.orderNumber}</span>
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {so.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Tanggal: <span className="font-mono">{formatDate(so.orderDate)}</span> | Total: <span className="font-mono font-bold text-slate-700">{formatIDR(so.total)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (onNavigate) {
                            onNavigate(`/sales/order/${so.id}`);
                          }
                        }}
                        className="btn btn-secondary btn-sm text-[11px] font-semibold flex items-center gap-1 hover:text-sky-700"
                        title="Buka detail Sales Order"
                      >
                        <span>Lihat SO</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <ShoppingBag size={32} className="mx-auto text-slate-400" />
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-700 text-sm">Belum Ada Sales Order Terkait</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Penawaran ini belum dikonversi menjadi pesanan penjualan (Sales Order).
                  </p>
                </div>
                {isApproved && (
                  <button
                    onClick={() => {
                      sessionStorage.setItem('action_create_so', quotation.id);
                      if (onNavigate) {
                        onNavigate('sales-orders');
                      }
                    }}
                    className="btn btn-primary btn-md mx-auto text-xs"
                  >
                    <ShoppingBag size={14} />
                    <span>Buat Sales Order Baru</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Catatan & Syarat Ketentuan */}
        {activeTab === 'notes' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Catatan Khusus Penawaran:
              </h4>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {quotation.notes || '(Tidak ada catatan khusus yang dilampirkan pada penawaran ini)'}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Syarat & Ketentuan Standar Penjualan:
              </h4>
              <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <li>Harga penawaran sudah termasuk PPN (kecuali dicantumkan khusus).</li>
                <li>Masa berlaku penawaran harga ini mengikat hingga tanggal yang ditentukan ({quotation.validUntil ? formatDate(quotation.validUntil) : '14 hari kerja'}).</li>
                <li>Jadwal pengiriman atau proses produksi dimulai setelah uang muka (DP) diterima dan kontrak Sales Order disetujui.</li>
                <li>Pembayaran ditujukan ke rekening resmi perusahaan yang tertera pada dokumen faktur / invoice resmi.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 4. Thermal Print Modal Preview */}
      {showThermalPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-60 p-4 font-sans text-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-5 py-3.5 soft-blue-header text-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-sky-100" />
                <div>
                  <h3 className="font-bold text-sm">Cetak Thermal Penawaran Harga</h3>
                  <p className="text-[10px] text-sky-100/80">{docNumber} - Format roll 80mm tanpa tanda tangan</p>
                </div>
              </div>
              <button
                onClick={() => setShowThermalPreview(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Thermal Live Preview */}
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
                  onClick={() => printQuotationThermal(printInfo, companyProfile, onTriggerNotification)}
                  className="btn btn-success btn-md text-[11px]"
                  title="Cetak lewat dialog browser / USB printer"
                >
                  <Printer size={14} />
                  <span>Cetak Struk</span>
                </button>
                <button
                  onClick={() => printBluetoothQuotation(printInfo, companyProfile, onTriggerNotification)}
                  className="btn btn-primary btn-md text-[11px]"
                  title="Cetak via Bluetooth ESC/POS"
                >
                  <Printer size={14} />
                  <span>Bluetooth</span>
                </button>
                <button
                  onClick={() => downloadQuotationThermalPdf(printInfo, companyProfile, onTriggerNotification)}
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

      {/* 5. Hidden A4 Print Layout (ReactToPrint) */}
      <div className="hidden">
        <div ref={printRef} className="print:block p-8 font-sans text-sm text-black bg-white">
          <div className="max-w-200 mx-auto">
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
              <div className="flex items-center gap-4">
                {companyProfile.logoUrl ? (
                  <img src={companyProfile.logoUrl} alt="Logo" className="w-16 h-16 object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-slate-900 flex items-center justify-center text-white font-black text-2xl tracking-tighter">
                    {companyProfile.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-black tracking-tight">{companyProfile.name.toUpperCase()}</h1>
                  <p className="font-bold text-xs">General Contractor & Supplier Material Alam</p>
                  <p className="text-[11px] mt-1">{formatAddressForPrint(companyProfile.address)}</p>
                  <p className="text-[10px] mt-0.5">Telp: {companyProfile.phone} | Email: {companyProfile.email}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="border px-4 py-1 font-black tracking-[0.2em] text-slate-500 text-lg">QUOTATION</div>
                <p className="font-mono font-bold mt-2 text-lg">{docNumber}</p>
                <p className="text-sm">Tanggal Penawaran: {formatDate(quotation.quotationDate || quotation.date)}</p>
                {quotation.validUntil && (
                  <p className="text-sm">Berlaku Hingga: {formatDate(quotation.validUntil)}</p>
                )}
              </div>
            </div>

            <div className="border border-black rounded-md p-4 w-[45%] mb-6">
              <p className="text-[10px] font-mono font-bold text-slate-500 tracking-widest">KEPADA YTH. (CUSTOMER)</p>
              <p className="font-bold text-lg mt-1">{quotation.customerName || quotation.customer?.name || 'Pelanggan'}</p>
              {quotation.customer?.phone && <p className="text-xs text-slate-700">Telp: {quotation.customer.phone}</p>}
            </div>

            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black p-2 w-10">NO</th>
                  <th className="border border-black p-2 text-left">NAMA PRODUK / PEKERJAAN</th>
                  <th className="border border-black p-2 w-20 text-right">QTY</th>
                  <th className="border border-black p-2 w-32 text-right">HARGA SATUAN</th>
                  <th className="border border-black p-2 w-32 text-right">JUMLAH</th>
                </tr>
              </thead>
              <tbody>
                {(quotation.items || []).map((item, idx) => {
                  const itemUnitPrice = Number(item.price ?? item.unitPrice ?? 0);
                  const itemSubtotal = (Number(item.quantity) * itemUnitPrice) - (Number(item.discountAmount) || 0);

                  return (
                    <tr key={idx}>
                      <td className="border border-black p-2 text-center align-top">{idx + 1}</td>
                      <td className="border border-black p-2 align-top">
                        <span className="font-bold block">{item.product?.name || item.productName || 'Unknown Product'}</span>
                        {item.pieceCount && item.length && (
                          <div className="text-[10px] text-slate-800 font-bold mt-1">Ukuran Custom: {item.pieceCount} Fisik x {item.length} {item.unit || 'M'}</div>
                        )}
                        {item.description && (
                          <div className="text-[10px] text-slate-600 mt-1 italic">{item.description}</div>
                        )}
                      </td>
                      <td className="border border-black p-2 text-right font-mono align-top">
                        {item.quantity} <span className="text-[10px] ml-1 font-sans font-normal uppercase">{item.unit || ''}</span>
                      </td>
                      <td className="border border-black p-2 text-right font-mono align-top">
                        {formatIDR(itemUnitPrice)}
                        {item.discountAmount ? (() => {
                          const disc = Number(item.discountAmount);
                          const gross = Number(item.quantity) * itemUnitPrice;
                          let pctStr = '';
                          if (gross > 0) {
                            const pct = Math.round((disc / gross) * 100);
                            if (pct > 0 && pct <= 100) pctStr = ` (${pct}%)`;
                          }
                          return (
                            <div className="text-[9px] text-rose-600 font-sans mt-0.5">
                              - Diskon Item{pctStr}: {formatIDR(disc)}
                            </div>
                          );
                        })() : null}
                      </td>
                      <td className="border border-black p-2 text-right font-mono font-bold align-top">{formatIDR(itemSubtotal)}</td>
                    </tr>
                  );
                })}
                {hasAnyDiscount && (
                  <>
                    <tr className="bg-slate-50">
                      <td colSpan={4} className="border border-black p-2 text-right font-bold text-[11px]">SUBTOTAL KOTOR</td>
                      <td className="border border-black p-2 text-right font-mono text-sm">{formatIDR(subtotalGross)}</td>
                    </tr>
                    {totalItemDiscount > 0 && (
                      <tr className="bg-rose-50/70 text-rose-700">
                        <td colSpan={4} className="border border-black p-2 text-right font-bold text-[11px]">
                          TOTAL DISKON ITEM
                        </td>
                        <td className="border border-black p-2 text-right font-mono text-sm">- {formatIDR(totalItemDiscount)}</td>
                      </tr>
                    )}
                    {globalDiscountAmount > 0 && (
                      <tr className="bg-rose-50 text-rose-700">
                        <td colSpan={4} className="border border-black p-2 text-right font-bold text-[11px]">
                          DISKON TRANSAKSI {quotation.globalDiscountType === 'percentage' && quotation.globalDiscountValue ? `(${quotation.globalDiscountValue}%)` : ''}
                        </td>
                        <td className="border border-black p-2 text-right font-mono text-sm">- {formatIDR(globalDiscountAmount)}</td>
                      </tr>
                    )}
                    {totalItemDiscount > 0 && globalDiscountAmount > 0 && (
                      <tr className="bg-rose-100/60 text-rose-800 font-bold">
                        <td colSpan={4} className="border border-black p-2 text-right text-[11px]">
                          TOTAL SEMUA DISKON
                        </td>
                        <td className="border border-black p-2 text-right font-mono text-sm">- {formatIDR(totalItemDiscount + globalDiscountAmount)}</td>
                      </tr>
                    )}
                  </>
                )}
                <tr className="bg-slate-100">
                  <td colSpan={4} className="border border-black p-3 text-right font-black">TOTAL KESELURUHAN</td>
                  <td className="border border-black p-3 text-right font-black font-mono text-base">{formatIDR(grandTotal)}</td>
                </tr>
              </tbody>
            </table>

            {quotation.notes && (
              <div className="mt-4 p-3 border border-black rounded text-xs">
                <strong>Catatan:</strong>
                <p className="mt-1 whitespace-pre-wrap">{quotation.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
