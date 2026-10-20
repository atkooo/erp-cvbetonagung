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
  customers: "Pelanggan (Customer)",
  employees: "Data Karyawan",
  suppliers: "Pemasok (Supplier)",
  products: "Master Produk",
  categories: "Kategori Produk",
  units: "Satuan (UoM)",
  warehouses: "Master Gudang",
  discounts: "Skema Diskon",
  "stock-management": "Stok Persediaan",
  "incoming-goods": "Barang Masuk",
  "outgoing-goods": "Barang Keluar",
  "stock-movement-history": "Mutasi Stok",
  "berita-acara-gudang": "Berita Acara (BAG)",
  "stock-opname": "Stock Opname",
  "multi-warehouse": "Lokasi Gudang",
  pos: "Kasir (POS)",
  quotations: "Penawaran (Quotation)",
  "sales-orders": "Sales Order (SO)",
  "delivery-orders": "Surat Jalan (DO)",
  returns: "Retur Penjualan",
  invoices: "Faktur (Invoice)",
  payments: "Penerimaan Pembayaran",
  "accounts-receivable": "Piutang (AR)",
  "accounts-payable": "Hutang (AP)",
  "cash-expense": "Beban Operasional",
  accounts: "Kas & Bank",
  "purchase-requests": "Permintaan Pembelian (PR)",
  rfq: "Penawaran Pemasok (RFQ)",
  "purchase-orders": "Purchase Order (PO)",
  "goods-receipts": "Penerimaan Barang (GR)",
  "purchase-returns": "Retur Pembelian",
  "production-work-orders": "Work Order (WO)",
  "bom-costing": "Bill of Materials (BOM)",
  projects: "Manajemen Proyek",
  "project-detail": "Detail Proyek",
  "project-budgeting": "Anggaran Proyek (RAB)",
  "role-permissions": "Hak Akses (RBAC)",
  "approval-workflows": "Alur Persetujuan",
  "audit-logs": "Audit Log",
  reminders: "Pengingat Sistem",
  "document-exports": "Ekspor Dokumen",
  "qr-products": "Barcode Produk",
  "scan-qr-product": "Pemindai Barcode",
  "scanned-product-detail": "Detail Scan Produk",
  "finance-reports": "Laporan Keuangan",
  "inventory-reports": "Laporan Mutasi Stok",
  "attendance-dashboard": "Presensi Karyawan",
  "leave-management": "Manajemen Cuti",
  "leave-types": "Kategori Cuti",
  "attendance-scanner": "Terminal Presensi",
  "payroll-management": "Penggajian (Payroll)",
  "employee-loans": "Pinjaman Karyawan",
  settings: "Pengaturan Sistem",
  profile: "Profil Saya",
  users: "Pengguna Sistem",
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
    title: "Penjualan",
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
        label: "Penawaran (Quotation)",
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
        label: "Surat Jalan (DO)",
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
    title: "Keuangan",
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
        label: "Beban Operasional",
        icon: History,
        requiredModule: "cash_expense",
      },
      {
        view: "invoices",
        label: "Faktur (Invoice)",
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
        label: "Piutang (AR)",
        icon: WalletCards,
        requiredModule: "accounts_receivable",
      },
      {
        view: "accounts-payable",
        label: "Hutang (AP)",
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
    title: "Pengadaan",
    collapsible: true,
    items: [
      {
        view: "purchase-requests",
        label: "Permintaan Pembelian (PR)",
        icon: FileSpreadsheet,
        requiredModule: "purchase_requests",
      },
      {
        view: "rfq",
        label: "Penawaran Pemasok (RFQ)",
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
        label: "Penerimaan Barang (GR)",
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
        label: "Work Order (WO)",
        icon: Factory,
        requiredModule: "production_work_orders",
      },
      {
        view: "bom-costing",
        label: "Bill of Materials (BOM)",
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
        label: "Anggaran Proyek (RAB)",
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
        label: "Pemindai Barcode",
        icon: Scan,
        activeViews: ["scanned-product-detail"],
        requiredModule: "qr_scanner",
      },
    ],
  },

  {
    id: "hrd",
    title: "Kepegawaian (HRD)",
    collapsible: true,
    items: [
      {
        view: "employees",
        label: "Data Karyawan",
        icon: UserCog,
        requiredModule: "employees",
      },
      {
        view: "attendance-dashboard",
        label: "Presensi Karyawan",
        icon: ClipboardCheck,
        requiredModule: "attendance",
      },
      {
        view: "attendance-scanner",
        label: "Terminal Presensi",
        icon: Scan,
        requiredModule: "attendance_scanner",
      },
      {
        view: "leave-management",
        label: "Manajemen Cuti",
        icon: FileSpreadsheet,
        requiredModule: "leave",
      },
      {
        view: "leave-types",
        label: "Kategori Cuti",
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
        label: "Pinjaman Karyawan",
        icon: CreditCard,
        requiredModule: "employee_loans",
      }
    ],
  },
  {
    id: "inventory",
    title: "Persediaan",
    collapsible: true,
    items: [
      {
        view: "stock-management",
        label: "Stok Persediaan",
        icon: Boxes,
        requiredModule: "inventory_stocks",
      },
      {
        view: "incoming-goods",
        label: "Barang Masuk",
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
        label: "Mutasi Stok",
        icon: History,
        requiredModule: "stock_movements",
      },
      {
        view: "berita-acara-gudang",
        label: "Berita Acara (BAG)",
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
        label: "Lokasi Gudang",
        icon: Warehouse,
        requiredModule: "storage_locations",
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
        label: "Pelanggan (Customer)",
        icon: Users,
        requiredModule: "customers",
        minAccessLevel: "edit",
      },
      {
        view: "suppliers",
        label: "Pemasok (Supplier)",
        icon: Handshake,
        requiredModule: "suppliers",
        minAccessLevel: "edit",
      },
      {
        view: "products",
        label: "Master Produk",
        icon: Package,
        requiredModule: "products",
        minAccessLevel: "edit",
      },
      {
        view: "categories",
        label: "Kategori Produk",
        icon: FolderTree,
        requiredModule: "product_categories",
        minAccessLevel: "edit",
      },
      {
        view: "units",
        label: "Satuan (UoM)",
        icon: Tag,
        requiredModule: "units",
        minAccessLevel: "edit",
      },
      {
        view: "discounts",
        label: "Skema Diskon",
        icon: Tag,
        requiredModule: "discounts",
        minAccessLevel: "edit",
      },
      {
        view: "warehouses",
        label: "Master Gudang",
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
        label: "Hak Akses (RBAC)",
        icon: ShieldCheck,
        requiredModule: "roles",
      },
      {
        view: "users",
        label: "Pengguna Sistem",
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
        label: "Pengingat Sistem",
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
