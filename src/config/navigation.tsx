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
} from '@/src/components/icons';
import type { LucideIcon } from '@/src/components/icons';
import { ViewType } from '../types';

export interface NavigationItem {
  view: ViewType;
  label: string;
  icon: LucideIcon;
  activeViews?: ViewType[];
  requiredModule?: string;
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

// Dynamic RBAC: Backend Modules -> users, roles, employees, customers, suppliers, products, inventory, sales, purchasing, projects, finance, production, approvals, reports, settings
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
      { view: 'customers', label: 'Customer', icon: Users, requiredModule: 'customers' },
      { view: 'employees', label: 'Karyawan', icon: UserCog, requiredModule: 'employees' },
      { view: 'suppliers', label: 'Supplier', icon: Handshake, requiredModule: 'suppliers' },
      { view: 'products', label: 'Produk', icon: Package, requiredModule: 'products' },
      { view: 'categories', label: 'Kategori Produk', icon: FolderTree, requiredModule: 'products' },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory',
    collapsible: true,
    items: [
      { view: 'stock-management', label: 'Stok Produk', icon: Boxes, requiredModule: 'inventory' },
      { view: 'incoming-goods', label: 'Barang Masuk', icon: Download, requiredModule: 'inventory' },
      { view: 'outgoing-goods', label: 'Barang Keluar', icon: Upload, requiredModule: 'inventory' },
      { view: 'stock-movement-history', label: 'Riwayat Stok', icon: History, requiredModule: 'inventory' },
      { view: 'stock-opname', label: 'Stock Opname', icon: PackageCheck, requiredModule: 'inventory' },
      { view: 'multi-warehouse', label: 'Multi Warehouse', icon: Warehouse, requiredModule: 'inventory' },
    ],
  },
  {
    id: 'sales',
    title: 'Sales & Orders',
    collapsible: true,
    items: [
      { view: 'quotations', label: 'Quotation', icon: FileSpreadsheet, requiredModule: 'sales' },
      { view: 'sales-orders', label: 'Sales Order', icon: FileCheck, requiredModule: 'sales' },
      { view: 'delivery-orders', label: 'Surat Jalan', icon: Truck, requiredModule: 'sales' },
      { view: 'returns', label: 'Retur Barang', icon: RotateCcw, requiredModule: 'sales' },
    ],
  },
  {
    id: 'billing',
    title: 'Billing & Payment',
    collapsible: true,
    items: [
      { view: 'invoices', label: 'Invoice', icon: Receipt, requiredModule: 'finance' },
      { view: 'payments', label: 'Payment', icon: CreditCard, requiredModule: 'finance' },
      { view: 'receivables-payables', label: 'Piutang & Hutang', icon: WalletCards, requiredModule: 'finance' },
    ],
  },
  {
    id: 'purchasing',
    title: 'Purchasing',
    items: [
      { view: 'purchase-orders', label: 'Purchase Order', icon: ShoppingCart, requiredModule: 'purchasing' },
    ],
  },
  {
    id: 'workshop',
    title: 'Workshop & Proyek',
    collapsible: true,
    items: [
      { view: 'production-work-orders', label: 'Work Order Produksi', icon: Factory, requiredModule: 'production' },
      { view: 'bom-costing', label: 'BOM & HPP', icon: Layers, requiredModule: 'production' },
      { view: 'projects', label: 'Proyek', icon: Compass, activeViews: ['project-detail'], requiredModule: 'projects' },
      { view: 'project-budgeting', label: 'Budget Proyek', icon: Calculator, requiredModule: 'projects' },
    ],
  },
  {
    id: 'control',
    title: 'Kontrol Sistem',
    collapsible: true,
    items: [
      { view: 'role-permissions', label: 'Role & Permission', icon: ShieldCheck, requiredModule: 'roles' },
      { view: 'approval-workflows', label: 'Approval Center', icon: ClipboardCheck, requiredModule: 'approvals' },
      { view: 'audit-logs', label: 'Audit Log', icon: FileSearch, requiredModule: 'settings' }, // or audit log module
      { view: 'reminders', label: 'Reminder Center', icon: BellRing },
      { view: 'document-exports', label: 'Export Dokumen', icon: FileDown },
    ],
  },
  {
    id: 'qr',
    title: 'QR Code Utility',
    collapsible: true,
    items: [
      { view: 'qr-products', label: 'Daftar QR Produk', icon: QrCode, requiredModule: 'inventory' },
      { view: 'scan-qr-product', label: 'Scan QR Produk', icon: Scan, activeViews: ['scanned-product-detail'], requiredModule: 'inventory' },
    ],
  },
  {
    id: 'system',
    separator: true,
    items: [
      { view: 'reports', label: 'Laporan', icon: BarChart3, requiredModule: 'reports' },
      { view: 'settings', label: 'Pengaturan', icon: Settings, requiredModule: 'settings' },
    ],
  },
];
