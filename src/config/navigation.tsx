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
      { view: "dashboard", label: "Dashboard Utama", icon: LayoutDashboard },
      // { view: "employee-dashboard", label: "Portal Karyawan", icon: LayoutDashboard, requiredModule: "employees" },
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
        requiredModule: "sales",
      },
      {
        view: "quotations",
        label: "Penawaran (quotations)",
        icon: FileSpreadsheet,
        requiredModule: "sales",
      },
      {
        view: "sales-orders",
        label: "Sales Order",
        icon: FileCheck,
        requiredModule: "sales",
      },
      {
        view: "delivery-orders",
        label: "Delivery Order (DO)",
        icon: Truck,
        requiredModule: "sales",
      },
      {
        view: "returns",
        label: "Retur Penjualan",
        icon: RotateCcw,
        requiredModule: "sales",
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
        requiredModule: "finance",
      },
      {
        view: "invoices",
        label: "Billing (Invoice)",
        icon: Receipt,
        requiredModule: "finance",
      },
      {
        view: "payments",
        label: "Kasir Customer",
        icon: CreditCard,
        requiredModule: "finance",
      },
      {
        view: "accounts-receivable",
        label: "Outstanding Receivable (AR)",
        icon: WalletCards,
        requiredModule: "finance",
      },
      {
        view: "accounts-payable",
        label: "Outstanding Payable (AP)",
        icon: WalletCards,
        requiredModule: "finance",
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
        requiredModule: "purchasing",
      },
      {
        view: "rfq",
        label: "RFQ",
        icon: FileSearch,
        requiredModule: "purchasing",
      },
      {
        view: "purchase-orders",
        label: "Purchase Order (PO)",
        icon: ShoppingCart,
        requiredModule: "purchasing",
      },
      {
        view: "purchase-returns",
        label: "Retur Pembelian",
        icon: RotateCcw,
        requiredModule: "purchasing",
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
        label: "Work Order Produksi",
        icon: Factory,
        requiredModule: "production",
      },
      {
        view: "bom-costing",
        label: "BOM & HPP",
        icon: Layers,
        requiredModule: "production",
      },
      {
        view: "projects",
        label: "Proyek",
        icon: Compass,
        activeViews: ["project-detail"],
        requiredModule: "projects",
      },
      {
        view: "project-budgeting",
        label: "Budget Proyek",
        icon: Calculator,
        requiredModule: "projects",
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
        requiredModule: "inventory",
      },
      {
        view: "scan-qr-product",
        label: "Scanner Barcode",
        icon: Scan,
        activeViews: ["scanned-product-detail"],
        requiredModule: "inventory",
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
        requiredModule: "employees",
      },
      {
        view: "leave-management",
        label: "Cuti Karyawan",
        icon: FileSpreadsheet,
        requiredModule: "employees",
      },
      {
        view: "payroll-management",
        label: "Penggajian (Payroll)",
        icon: WalletCards,
        requiredModule: "payroll",
      },
      {
        view: "employee-loans",
        label: "Kasbon & Pinjaman",
        icon: CreditCard,
        requiredModule: "employees",
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
        requiredModule: "inventory",
      },
      {
        view: "incoming-goods",
        label: "Penerimaan (GRN)",
        icon: Download,
        requiredModule: "inventory",
      },
      {
        view: "outgoing-goods",
        label: "Barang Keluar (Internal)",
        icon: Upload,
        requiredModule: "inventory",
      },
      {
        view: "stock-movement-history",
        label: "Riwayat Stok",
        icon: History,
        requiredModule: "inventory",
      },
      {
        view: "berita-acara-gudang",
        label: "Berita Acara Gudang",
        icon: FileCheck,
        requiredModule: "inventory",
      },
      {
        view: "stock-opname",
        label: "Stock Opname",
        icon: PackageCheck,
        requiredModule: "inventory",
      },
      {
        view: "multi-warehouse",
        label: "Multi Warehouse",
        icon: Warehouse,
        requiredModule: "inventory",
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
        label: "Semua Laporan",
        icon: TrendingUp,
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
      },
      {
        view: "suppliers",
        label: "Supplier",
        icon: Handshake,
        requiredModule: "suppliers",
      },
      {
        view: "products",
        label: "Produk",
        icon: Package,
        requiredModule: "products",
      },
      {
        view: "categories",
        label: "Kategori Produk",
        icon: FolderTree,
        requiredModule: "products",
      },
      {
        view: "units",
        label: "Satuan Produk",
        icon: Tag,
        requiredModule: "products",
      },
      {
        view: "discounts",
        label: "Master Diskon",
        icon: Tag,
        requiredModule: "products",
      },
      {
        view: "warehouses",
        label: "Gudang & Rak",
        icon: Warehouse,
        requiredModule: "inventory",
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
        label: "Role & Permission",
        icon: ShieldCheck,
        requiredModule: "roles",
      },
      {
        view: "users",
        label: "Master User / Akun",
        icon: Users,
        requiredModule: "roles",
      },
      {
        view: "approval-workflows",
        label: "Approval Center",
        icon: ClipboardCheck,
        requiredModule: "approvals",
      },
      {
        view: "audit-logs",
        label: "Audit Log",
        icon: FileSearch,
        requiredModule: "settings",
      }, // or audit log module
      { view: "reminders", label: "Reminder Center", icon: BellRing },
    ],
  },
  {
    id: "system",
    separator: true,
    items: [
      {
        view: "settings",
        label: "Pengaturan",
        icon: Settings,
        requiredModule: "settings",
      },
    ],
  },
];
