/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BarChart3,
  BellRing,
  Boxes,
  Calculator,
  ClipboardCheck,
  Compass,
  CreditCard,
  Download,
  Factory,
  FileCheck,
  FileDown,
  FileSearch,
  FileSpreadsheet,
  FolderTree,
  Handshake,
  History,
  Layers,
  LayoutDashboard,
  Package,
  PackageCheck,
  QrCode,
  Receipt,
  RotateCcw,
  Scan,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Upload,
  Users,
  UserCog,
  WalletCards,
  Warehouse,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ViewType } from '../types';

export interface NavigationItem {
  view: ViewType;
  label: string;
  icon: LucideIcon;
  activeViews?: ViewType[];
}

export interface NavigationSection {
  id: string;
  title?: string;
  collapsible?: boolean;
  separator?: boolean;
  items: NavigationItem[];
}

export const VIEW_TITLES: Record<ViewType, string> = {
  login: 'Masuk Sistem',
  dashboard: 'Dashboard Utama',
  customers: 'Manajemen Customer (Pelanggan)',
  employees: 'Master Data Karyawan',
  suppliers: 'Manajemen Supplier (Pemasok)',
  products: 'Daftar Produk Konstruksi',
  categories: 'Kategori Produk',
  'stock-management': 'Manajemen Stok Produk',
  'incoming-goods': 'Penerimaan Barang Masuk',
  'outgoing-goods': 'Pengeluaran Barang Keluar',
  'stock-movement-history': 'Timeline & Riwayat Pergerakan Stok',
  'stock-opname': 'Stock Opname Gudang',
  'multi-warehouse': 'Multi Warehouse / Lokasi Stok',
  quotations: 'Daftar Quotation (Penawaran Harga)',
  'sales-orders': 'Daftar Sales Order (SO)',
  'delivery-orders': 'Delivery Order / Surat Jalan',
  returns: 'Retur Barang',
  invoices: 'Faktur Penjualan (Invoices)',
  payments: 'Riwayat Pembayaran Customer',
  'receivables-payables': 'Piutang & Hutang',
  'purchase-orders': 'Purchase Order (PO Pemasok)',
  'production-work-orders': 'Production / Work Order',
  'bom-costing': 'Bill of Materials & HPP',
  projects: 'Manajemen Proyek',
  'project-detail': 'Detail Progress Proyek',
  'project-budgeting': 'Project Budgeting',
  'role-permissions': 'Role & Permission Matrix',
  'approval-workflows': 'Approval Workflow Center',
  'audit-logs': 'Audit Log Aktivitas Sistem',
  reminders: 'Notifikasi & Reminder',
  'document-exports': 'Export / Print Dokumen',
  'qr-products': 'Daftar QR Code Produk',
  'scan-qr-product': 'Scanner QR Produk (Simulasi Kamera)',
  'scanned-product-detail': 'Detail Produk Hasil Scan QR',
  reports: 'Analisis & Laporan Operasional',
  settings: 'Pengaturan Sistem ERP',
};

export const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    id: 'core',
    items: [
      { view: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    ],
  },
  {
    id: 'master-data',
    title: 'Master Data',
    collapsible: true,
    items: [
      { view: 'customers', label: 'Customer', icon: Users },
      { view: 'employees', label: 'Karyawan', icon: UserCog },
      { view: 'suppliers', label: 'Supplier', icon: Handshake },
      { view: 'products', label: 'Produk', icon: Package },
      { view: 'categories', label: 'Kategori Produk', icon: FolderTree },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory',
    collapsible: true,
    items: [
      { view: 'stock-management', label: 'Stok Produk', icon: Boxes },
      { view: 'incoming-goods', label: 'Barang Masuk', icon: Download },
      { view: 'outgoing-goods', label: 'Barang Keluar', icon: Upload },
      { view: 'stock-movement-history', label: 'Riwayat Stok', icon: History },
      { view: 'stock-opname', label: 'Stock Opname', icon: PackageCheck },
      { view: 'multi-warehouse', label: 'Multi Warehouse', icon: Warehouse },
    ],
  },
  {
    id: 'sales',
    title: 'Sales & Orders',
    collapsible: true,
    items: [
      { view: 'quotations', label: 'Quotation', icon: FileSpreadsheet },
      { view: 'sales-orders', label: 'Sales Order', icon: FileCheck },
      { view: 'delivery-orders', label: 'Surat Jalan', icon: Truck },
      { view: 'returns', label: 'Retur Barang', icon: RotateCcw },
    ],
  },
  {
    id: 'billing',
    title: 'Billing & Payment',
    collapsible: true,
    items: [
      { view: 'invoices', label: 'Invoice', icon: Receipt },
      { view: 'payments', label: 'Payment', icon: CreditCard },
      { view: 'receivables-payables', label: 'Piutang & Hutang', icon: WalletCards },
    ],
  },
  {
    id: 'purchasing',
    title: 'Purchasing',
    items: [
      { view: 'purchase-orders', label: 'Purchase Order', icon: ShoppingCart },
    ],
  },
  {
    id: 'workshop',
    title: 'Workshop & Proyek',
    collapsible: true,
    items: [
      { view: 'production-work-orders', label: 'Work Order Produksi', icon: Factory },
      { view: 'bom-costing', label: 'BOM & HPP', icon: Layers },
      {
        view: 'projects',
        label: 'Proyek',
        icon: Compass,
        activeViews: ['project-detail'],
      },
      { view: 'project-budgeting', label: 'Budget Proyek', icon: Calculator },
    ],
  },
  {
    id: 'control',
    title: 'Kontrol Sistem',
    collapsible: true,
    items: [
      { view: 'role-permissions', label: 'Role & Permission', icon: ShieldCheck },
      { view: 'approval-workflows', label: 'Approval Center', icon: ClipboardCheck },
      { view: 'audit-logs', label: 'Audit Log', icon: FileSearch },
      { view: 'reminders', label: 'Reminder Center', icon: BellRing },
      { view: 'document-exports', label: 'Export Dokumen', icon: FileDown },
    ],
  },
  {
    id: 'qr',
    title: 'QR Code Utility',
    collapsible: true,
    items: [
      { view: 'qr-products', label: 'Daftar QR Produk', icon: QrCode },
      {
        view: 'scan-qr-product',
        label: 'Scan QR Produk',
        icon: Scan,
        activeViews: ['scanned-product-detail'],
      },
    ],
  },
  {
    id: 'system',
    separator: true,
    items: [
      { view: 'reports', label: 'Laporan', icon: BarChart3 },
      { view: 'settings', label: 'Pengaturan', icon: Settings },
    ],
  },
];
