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
  "employee-dashboard": "Portal Karyawan",
  customers: "Customer",
  employees: "Master Karyawan",
  suppliers: "Supplier",
  products: "Produk",
  categories: "Kategori Produk",
  units: "Satuan Produk",
  warehouses: "Gudang & Rak",
  discounts: "Diskon",
  "stock-management": "Stok Produk",
  "incoming-goods": "Penerimaan Barang Masuk",
  "outgoing-goods": "Barang Keluar",
  "stock-movement-history": "Riwayat Stok",
  "berita-acara-gudang": "Berita Acara Gudang",
  "stock-opname": "Stock Opname",
  "multi-warehouse": "Gudang & Rak",
  pos: "Kasir",
  quotations: "Penawaran Harga",
  "sales-orders": "Sales Order",
  "delivery-orders": "Delivery Order",
  returns: "Retur Penjualan",
  invoices: "Invoice",
  payments: "Penerimaan Pembayaran",
  "accounts-receivable": "Piutang Usaha",
  "accounts-payable": "Hutang Usaha",
  "cash-expense": "Biaya Operasional",
  accounts: "Kas & Bank",
  "purchase-requests": "Purchase Request",
  rfq: "Permintaan Penawaran",
  "purchase-orders": "Purchase Order",
  "goods-receipts": "Penerimaan Barang",
  "purchase-returns": "Retur Pembelian",
  "production-work-orders": "Work Order Produksi",
  "bom-costing": "Bill of Materials",
  projects: "Manajemen Proyek",
  "project-detail": "Detail Proyek",
  "project-budgeting": "Budgeting Proyek",
  "role-permissions": "Role & Hak Akses",
  "approval-workflows": "Approval Workflow",
  "audit-logs": "Audit Log",
  reminders: "Reminder",
  "document-exports": "Export Dokumen",
  "qr-products": "Barcode Produk",
  "scan-qr-product": "Scanner Barcode",
  "scanned-product-detail": "Detail Scan Produk",
  "finance-reports": "Laporan Keuangan",
  "inventory-reports": "Laporan Mutasi Stok",
  "attendance-dashboard": "Absensi",
  "leave-management": "Pengajuan Cuti",
  "leave-types": "Jenis Cuti",
  "attendance-scanner": "Scan Absensi",
  "payroll-management": "Penggajian",
  "employee-loans": "Kasbon Karyawan",
  settings: "Pengaturan Sistem",
  profile: "Profil Saya",
  users: "User & Akun",
  "report-center": "Pusat Laporan",
};

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
    title: "Sales",
    collapsible: true,
    items: [
      {
        view: "pos",
        label: "Kasir",
        icon: Calculator,
        requiredModule: "pos",
      },
      {
        view: "quotations",
        label: "Penawaran Harga",
        icon: FileSpreadsheet,
        requiredModule: "quotations",
      },
      {
        view: "sales-orders",
        label: "Sales Order",
        icon: FileCheck,
        requiredModule: "sales_orders",
      },
      {
        view: "delivery-orders",
        label: "Delivery Order",
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
    title: "Finance",
    collapsible: true,
    items: [
      {
        view: "accounts",
        label: "Kas & Bank",
        icon: WalletCards,
        requiredModule: "accounts",
      },
      {
        view: "cash-expense",
        label: "Biaya Operasional",
        icon: History,
        requiredModule: "cash_expense",
      },
      {
        view: "invoices",
        label: "Invoice",
        icon: Receipt,
        requiredModule: "invoices",
      },
      {
        view: "payments",
        label: "Penerimaan Pembayaran",
        icon: CreditCard,
        requiredModule: "payments",
      },
      {
        view: "accounts-receivable",
        label: "Piutang Usaha",
        icon: WalletCards,
        requiredModule: "accounts_receivable",
      },
      {
        view: "accounts-payable",
        label: "Hutang Usaha",
        icon: WalletCards,
        requiredModule: "accounts_payable",
      },
      {
        view: "finance-reports",
        label: "Laporan Keuangan",
        icon: BarChart3,
        requiredModule: "finance_reports",
      },
    ],
  },
  {
    id: "purchasing",
    title: "Purchasing",
    collapsible: true,
    items: [
      {
        view: "purchase-requests",
        label: "Purchase Request",
        icon: FileSpreadsheet,
        requiredModule: "purchase_requests",
      },
      {
        view: "rfq",
        label: "Permintaan Penawaran",
        icon: FileSearch,
        requiredModule: "rfqs",
      },
      {
        view: "purchase-orders",
        label: "Purchase Order",
        icon: ShoppingCart,
        requiredModule: "purchase_orders",
      },
      {
        view: "goods-receipts",
        label: "Penerimaan Barang",
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
    title: "Produksi & Proyek",
    collapsible: true,
    items: [
      {
        view: "production-work-orders",
        label: "Work Order Produksi",
        icon: Factory,
        requiredModule: "production_work_orders",
      },
      {
        view: "bom-costing",
        label: "Bill of Materials",
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
        label: "Budgeting Proyek",
        icon: Calculator,
        requiredModule: "project_budgeting",
      },
    ],
  },
  {
    id: "qr",
    title: "Barcode",
    collapsible: true,
    items: [
      {
        view: "qr-products",
        label: "Barcode Produk",
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
    title: "HRD",
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
        label: "Absensi",
        icon: ClipboardCheck,
        requiredModule: "attendance",
      },
      {
        view: "attendance-scanner",
        label: "Scan Absensi",
        icon: Scan,
        requiredModule: "attendance_scanner",
      },
      {
        view: "leave-management",
        label: "Pengajuan Cuti",
        icon: FileSpreadsheet,
        requiredModule: "leave",
      },
      {
        view: "leave-types",
        label: "Jenis Cuti",
        icon: Tag,
        requiredModule: "leave_types",
      },
      {
        view: "payroll-management",
        label: "Penggajian",
        icon: WalletCards,
        requiredModule: "payroll",
      },
      {
        view: "employee-loans",
        label: "Kasbon Karyawan",
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
        label: "Barang Keluar",
        icon: Upload,
        requiredModule: "outgoing_goods",
      },
      {
        view: "stock-movement-history",
        label: "Riwayat Stok",
        icon: History,
        requiredModule: "stock_movements",
      },
      {
        view: "berita-acara-gudang",
        label: "Berita Acara Gudang",
        icon: FileCheck,
        requiredModule: "berita_acara_gudang",
      },
      {
        view: "stock-opname",
        label: "Stock Opname",
        icon: PackageCheck,
        requiredModule: "stock_opname",
      },
      {
        view: "multi-warehouse",
        label: "Gudang & Rak",
        icon: Warehouse,
        requiredModule: "warehouses",
      },
    ],
  },
  {
    id: "reports",
    title: "Laporan",
    collapsible: true,
    items: [
      {
        view: "report-center",
        label: "Pusat Laporan",
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
        label: "Customer",
        icon: Users,
        requiredModule: "customers",
        minAccessLevel: "edit",
      },
      {
        view: "suppliers",
        label: "Supplier",
        icon: Handshake,
        requiredModule: "suppliers",
        minAccessLevel: "edit",
      },
      {
        view: "products",
        label: "Produk",
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
        label: "Diskon",
        icon: Tag,
        requiredModule: "products",
        minAccessLevel: "edit",
      },
      {
        view: "warehouses",
        label: "Gudang & Rak",
        icon: Warehouse,
        requiredModule: "warehouses",
        minAccessLevel: "edit",
      },
    ],
  },
  {
    id: "control",
    title: "Sistem",
    collapsible: true,
    items: [
      {
        view: "role-permissions",
        label: "Role & Hak Akses",
        icon: ShieldCheck,
        requiredModule: "roles",
      },
      {
        view: "users",
        label: "User & Akun",
        icon: Users,
        requiredModule: "users",
      },
      {
        view: "audit-logs",
        label: "Audit Log",
        icon: FileSearch,
        requiredModule: "audit_logs",
      },
      {
        view: "reminders",
        label: "Reminder",
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
        label: "Pengaturan Sistem",
        icon: Settings,
        requiredModule: "settings",
      },
    ],
  },
];
