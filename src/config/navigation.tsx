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
  Barcode,
  Receipt,
  RotateCcw,
  Scan,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Truck,
  TrendingUp,
  Upload,
  Users,
  UserCog,
  WalletCards,
  Warehouse,
} from "@/src/components/icons";
import type { LucideIcon } from "@/src/components/icons";
import { ViewType } from "../types";

export interface NavigationItem {
  view: ViewType;
  label: string;
  icon: LucideIcon;
  activeViews?: ViewType[];
  requiredModule?: string;
  minAccessLevel?: 'read' | 'edit' | 'full';
}

export interface NavigationSection {
  id: string;
  title?: string;
  collapsible?: boolean;
  separator?: boolean;
  items: NavigationItem[];
}

export const VIEW_TITLES: Record<ViewType, string> = {
  login: "Masuk Sistem",
  dashboard: "Dashboard Utama",
  "employee-dashboard": "Portal Karyawan (Self-Service)",
  customers: "Manajemen Customer (Pelanggan)",
  employees: "Master Data Karyawan",
  suppliers: "Manajemen Supplier (Pemasok)",
  products: "Daftar Produk Konstruksi",
  categories: "Kategori Produk",
  units: "Master Satuan Produk",
  warehouses: "Master Gudang & Rak",
  discounts: "Master Diskon",
  "stock-management": "Manajemen Stok Produk",
  "incoming-goods": "Penerimaan Barang Masuk",
  "outgoing-goods": "Barang Keluar (Internal)",
  "stock-movement-history": "Timeline & Riwayat Pergerakan Stok",
  "berita-acara-gudang": "Berita Acara Gudang (BAG)",
  "stock-opname": "Stock Opname Gudang",
  "multi-warehouse": "Multi Warehouse / Lokasi Stok",
  pos: "Kasir / Point of Sale",
  quotations: "Daftar Quotation (Penawaran Harga)",
  "sales-orders": "Daftar Sales Order (SO)",
  "delivery-orders": "Delivery Order / Surat Jalan",
  returns: "Retur Barang",
  invoices: "Billing (Invoice Customer)",
  payments: "Kasir (Penerimaan Customer)",
  "accounts-receivable": "Outstanding Receivable (AR)",
  "accounts-payable": "Outstanding Payable (AP)",
  "cash-expense": "Kas & Biaya Operasional",
  "accounts": "Buku Kas & Bank",
  "purchase-requests": "Purchase Request (PR)",
  rfq: "Request For Quotation (RFQ)",
  "purchase-orders": "Purchase Order (PO Pemasok)",
  "goods-receipts": "Penerimaan Barang (GRN)",
  "purchase-returns": "Retur Pembelian",
  "production-work-orders": "Production / Work Order",
  "bom-costing": "Bill of Materials & HPP",
  projects: "Manajemen Proyek",
  "project-detail": "Detail Progress Proyek",
  "project-budgeting": "Project Budgeting",
  "role-permissions": "Role & Permission Matrix",
  "approval-workflows": "Approval Workflow Center",
  "audit-logs": "Audit Log Aktivitas Sistem",
  reminders: "Notifikasi & Reminder",
  "document-exports": "Export / Print Dokumen",
  "qr-products": "Daftar Barcode Produk",
  "scan-qr-product": "Scanner Barcode",
  "scanned-product-detail": "Detail Produk Hasil Scan",
  "finance-reports": "Laporan Keuangan & Omset",
  "inventory-reports": "Mutasi & Turnover Stok",
  "attendance-dashboard": "Dashboard Absensi",
  "leave-management": "Pengajuan & Approval Cuti",
  "leave-types": "Master Jenis Cuti",
  "attendance-scanner": "Scan Absensi (QR)",
  "payroll-management": "Sistem Penggajian Dasar",
  "employee-loans": "Kasbon & Pinjaman Karyawan",
  settings: "Pengaturan Sistem ERP",
  profile: "Profil & Akun Saya",
  users: "Manajemen User & Akun",
  "report-center": "Pusat Laporan Terpadu",
};

// Dynamic RBAC: Backend Modules -> users, roles, employees, customers, suppliers, products, inventory, sales, purchasing, projects, finance, production, approvals, reports, settings
export const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    id: "core",
    items: [
      { view: "dashboard", label: "Dashboard Utama", icon: LayoutDashboard, requiredModule: "reports" },
      { view: "employee-dashboard", label: "Portal Karyawan", icon: LayoutDashboard },
    ],
  },
  {
    id: "sales",
    title: "Sales & Orders",
    collapsible: true,
    items: [
      {
        view: "pos",
        label: "Kasir (POS)",
        icon: Calculator,
        requiredModule: "pos",
      },
      {
        view: "quotations",
        label: "Penawaran Harga (Quotation)",
        icon: FileSpreadsheet,
        requiredModule: "quotations",
      },
      {
        view: "sales-orders",
        label: "Sales Order (SO)",
        icon: FileCheck,
        requiredModule: "sales_orders",
      },
      {
        view: "delivery-orders",
        label: "Delivery Order (DO)",
        icon: Truck,
        requiredModule: "delivery_orders",
      },
      {
        view: "returns",
        label: "Retur Penjualan",
        icon: RotateCcw,
        requiredModule: "sales_returns",
      },
    ],
  },

  {
    id: "finance",
    title: "Finance & Accounting",
    collapsible: true,
    items: [
      {
        view: "accounts",
        label: "Buku Kas & Bank",
        icon: WalletCards,
        requiredModule: "accounts",
      },
      {
        view: "cash-expense",
        label: "Kas & Biaya Operasional",
        icon: History,
        requiredModule: "cash_expense",
      },
      {
        view: "invoices",
        label: "Billing (Invoice Customer)",
        icon: Receipt,
        requiredModule: "invoices",
      },
      {
        view: "payments",
        label: "Kasir (Penerimaan Customer)",
        icon: CreditCard,
        requiredModule: "payments",
      },
      {
        view: "accounts-receivable",
        label: "Piutang Usaha (AR)",
        icon: WalletCards,
        requiredModule: "accounts_receivable",
      },
      {
        view: "accounts-payable",
        label: "Hutang Usaha (AP)",
        icon: WalletCards,
        requiredModule: "accounts_payable",
      },
      {
        view: "finance-reports",
        label: "Laporan Keuangan & Omset",
        icon: BarChart3,
        requiredModule: "finance_reports",
      },
    ],
  },
  {
    id: "purchasing",
    title: "Procurement / Purchasing",
    collapsible: true,
    items: [
      {
        view: "purchase-requests",
        label: "Purchase Request (PR)",
        icon: FileSpreadsheet,
        requiredModule: "purchase_requests",
      },
      {
        view: "rfq",
        label: "Permintaan Penawaran (RFQ)",
        icon: FileSearch,
        requiredModule: "rfqs",
      },
      {
        view: "purchase-orders",
        label: "Purchase Order (PO)",
        icon: ShoppingCart,
        requiredModule: "purchase_orders",
      },
      {
        view: "goods-receipts",
        label: "Penerimaan Barang (GRN)",
        icon: Download,
        activeViews: ["incoming-goods"],
        requiredModule: "goods_receipts",
      },
      {
        view: "purchase-returns",
        label: "Retur Pembelian",
        icon: RotateCcw,
        requiredModule: "purchase_returns",
      },
    ],
  },

  {
    id: "workshop",
    title: "Workshop & Proyek",
    collapsible: true,
    items: [
      {
        view: "production-work-orders",
        label: "Work Order Produksi (SPK)",
        icon: Factory,
        requiredModule: "production_work_orders",
      },
      {
        view: "bom-costing",
        label: "Bill of Materials & HPP",
        icon: Layers,
        requiredModule: "bom_costing",
      },
      {
        view: "projects",
        label: "Manajemen Proyek",
        icon: Compass,
        activeViews: ["project-detail"],
        requiredModule: "projects",
      },
      {
        view: "project-budgeting",
        label: "Budgeting & RAB Proyek",
        icon: Calculator,
        requiredModule: "project_budgeting",
      },
    ],
  },
  {
    id: "qr",
    title: "Barcode Utility",
    collapsible: true,
    items: [
      {
        view: "qr-products",
        label: "Daftar Barcode Produk",
        icon: Barcode,
        requiredModule: "qr_products",
      },
      {
        view: "scan-qr-product",
        label: "Scanner Barcode",
        icon: Scan,
        activeViews: ["scanned-product-detail"],
        requiredModule: "qr_scanner",
      },
    ],
  },

  {
    id: "hrd",
    title: "HRD & Personalia",
    collapsible: true,
    items: [
      {
        view: "employees",
        label: "Master Karyawan",
        icon: UserCog,
        requiredModule: "employees",
      },
      {
        view: "attendance-dashboard",
        label: "Absensi & Kehadiran",
        icon: ClipboardCheck,
        requiredModule: "attendance",
      },
      {
        view: "attendance-scanner",
        label: "Scan Absensi (QR)",
        icon: Scan,
        requiredModule: "attendance_scanner",
      },
      {
        view: "leave-management",
        label: "Pengajuan & Approval Cuti",
        icon: FileSpreadsheet,
        requiredModule: "leave",
      },
      {
        view: "leave-types",
        label: "Master Jenis Cuti",
        icon: Tag,
        requiredModule: "leave_types",
      },
      {
        view: "payroll-management",
        label: "Penggajian (Payroll)",
        icon: WalletCards,
        requiredModule: "payroll",
      },
      {
        view: "employee-loans",
        label: "Kasbon & Pinjaman Karyawan",
        icon: CreditCard,
        requiredModule: "employee_loans",
      }
    ],
  },
  {
    id: "inventory",
    title: "Inventory",
    collapsible: true,
    items: [
      {
        view: "stock-management",
        label: "Stok Produk",
        icon: Boxes,
        requiredModule: "inventory_stocks",
      },
      {
        view: "incoming-goods",
        label: "Penerimaan Barang Masuk",
        icon: Download,
        activeViews: ["goods-receipts"],
        requiredModule: "incoming_goods",
      },
      {
        view: "outgoing-goods",
        label: "Barang Keluar (Internal)",
        icon: Upload,
        requiredModule: "outgoing_goods",
      },
      {
        view: "stock-movement-history",
        label: "Riwayat Pergerakan Stok",
        icon: History,
        requiredModule: "stock_movements",
      },
      {
        view: "berita-acara-gudang",
        label: "Berita Acara Gudang (BAG)",
        icon: FileCheck,
        requiredModule: "berita_acara_gudang",
      },
      {
        view: "stock-opname",
        label: "Stock Opname Gudang",
        icon: PackageCheck,
        requiredModule: "stock_opname",
      },
      {
        view: "multi-warehouse",
        label: "Master Gudang & Rak",
        icon: Warehouse,
        requiredModule: "warehouses",
      },
    ],
  },
  {
    id: "reports",
    title: "Pusat Laporan & Analitik",
    collapsible: true,
    items: [
      {
        view: "report-center",
        label: "Pusat Laporan Terpadu",
        icon: TrendingUp,
        requiredModule: "reports",
      },
    ],
  },
  {
    id: "master-data",
    title: "Master Data",
    collapsible: true,
    items: [
      {
        view: "customers",
        label: "Manajemen Customer (Pelanggan)",
        icon: Users,
        requiredModule: "customers",
        minAccessLevel: "edit",
      },
      {
        view: "suppliers",
        label: "Manajemen Supplier (Pemasok)",
        icon: Handshake,
        requiredModule: "suppliers",
        minAccessLevel: "edit",
      },
      {
        view: "products",
        label: "Master Produk Konstruksi",
        icon: Package,
        requiredModule: "products",
        minAccessLevel: "edit",
      },
      {
        view: "categories",
        label: "Kategori Produk",
        icon: FolderTree,
        requiredModule: "products",
        minAccessLevel: "edit",
      },
      {
        view: "units",
        label: "Satuan Produk",
        icon: Tag,
        requiredModule: "products",
        minAccessLevel: "edit",
      },
      {
        view: "discounts",
        label: "Master Diskon",
        icon: Tag,
        requiredModule: "products",
        minAccessLevel: "edit",
      },
      {
        view: "warehouses",
        label: "Master Gudang & Rak",
        icon: Warehouse,
        requiredModule: "warehouses",
        minAccessLevel: "edit",
      },
    ],
  },
  {
    id: "control",
    title: "Kontrol Sistem",
    collapsible: true,
    items: [
      {
        view: "role-permissions",
        label: "Role & Hak Akses (RBAC)",
        icon: ShieldCheck,
        requiredModule: "roles",
      },
      {
        view: "users",
        label: "Manajemen User & Akun",
        icon: Users,
        requiredModule: "users",
      },
      {
        view: "approval-workflows",
        label: "Approval Workflow Center",
        icon: ClipboardCheck,
        requiredModule: "approvals",
      },
      {
        view: "audit-logs",
        label: "Audit Log Aktivitas Sistem",
        icon: FileSearch,
        requiredModule: "audit_logs",
      },
      {
        view: "reminders",
        label: "Reminder & Notifikasi",
        icon: BellRing,
        requiredModule: "reminders",
      },
    ],
  },
  {
    id: "system",
    separator: true,
    items: [
      {
        view: "settings",
        label: "Pengaturan Sistem ERP",
        icon: Settings,
        requiredModule: "settings",
      },
    ],
  },
];
