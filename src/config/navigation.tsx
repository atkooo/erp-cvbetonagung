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
  CalendarCheck,
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
  "stock-management": "Manajemen Stok Produk",
  "incoming-goods": "Penerimaan Barang Masuk",
  "outgoing-goods": "Pengeluaran Barang Keluar",
  "stock-movement-history": "Timeline & Riwayat Pergerakan Stok",
  "stock-opname": "Stock Opname Gudang",
  "multi-warehouse": "Multi Warehouse / Lokasi Stok",
  quotations: "Daftar Quotation (Penawaran Harga)",
  "sales-orders": "Daftar Sales Order (SO)",
  "delivery-orders": "Delivery Order / Surat Jalan",
  returns: "Retur Barang",
  invoices: "Faktur Penjualan (Invoices)",
  payments: "Riwayat Pembayaran Customer",
  "receivables-payables": "Piutang & Hutang",
  "cash-expense": "Kas & Biaya Operasional",
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
  "qr-products": "Daftar QR Code Produk",
  "scan-qr-product": "Scanner QR Produk (Simulasi Kamera)",
  "scanned-product-detail": "Detail Produk Hasil Scan QR",
  "finance-reports": "Laporan Keuangan & Omset",
  "inventory-reports": "Mutasi & Turnover Stok",
  "attendance-dashboard": "Dashboard Absensi",
  "leave-management": "Pengajuan & Approval Cuti",
  "attendance-scanner": "Scan Absensi (QR)",
  "payroll-management": "Sistem Penggajian Dasar",
  "employee-loans": "Kasbon & Pinjaman Karyawan",
  settings: "Pengaturan Sistem ERP",
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
        view: "quotations",
        label: "Quotation",
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
        view: "invoices",
        label: "Invoice",
        icon: Receipt,
        requiredModule: "finance",
      },
      {
        view: "payments",
        label: "Payment",
        icon: CreditCard,
        requiredModule: "finance",
      },
      {
        view: "receivables-payables",
        label: "Piutang & Hutang",
        icon: WalletCards,
        requiredModule: "finance",
      },
      {
        view: "cash-expense",
        label: "Kas & Biaya",
        icon: Calculator,
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
  // {
  //   id: "qr",
  //   title: "QR Code Utility",
  //   collapsible: true,
  //   items: [
  //     {
  //       view: "qr-products",
  //       label: "Daftar QR Produk",
  //       icon: QrCode,
  //       requiredModule: "inventory",
  //     },
  //     {
  //       view: "scan-qr-product",
  //       label: "Scan QR Produk",
  //       icon: Scan,
  //       activeViews: ["scanned-product-detail"],
  //       requiredModule: "inventory",
  //     },
  //   ],
  // },

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
        label: "Dashboard Absensi",
        icon: CalendarCheck,
        requiredModule: "employees",
      },
      {
        view: "attendance-scanner",
        label: "Scan Absensi (QR)",
        icon: Scan,
        requiredModule: "employees",
      },
      {
        view: "leave-management",
        label: "Pengajuan Cuti",
        icon: FileCheck,
        requiredModule: "employees",
      },
      {
        view: "payroll-management",
        label: "Payroll",
        icon: Calculator,
        requiredModule: "finance",
      },
      {
        view: "employee-loans",
        label: "Pinjaman Karyawan",
        icon: Handshake,
        requiredModule: "finance",
      },
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
        label: "Barang Keluar",
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
    id: "reports",
    title: "Report",
    collapsible: true,
    items: [
      {
        view: "document-exports",
        label: "Export Dokumen",
        icon: FileDown,
      },
      {
        view: "finance-reports",
        label: "Laporan Keuangan & Omset",
        icon: TrendingUp,
        requiredModule: "reports",
      },
      {
        view: "inventory-reports",
        label: "Mutasi & Turnover Stok",
        icon: TrendingUp,
        requiredModule: "reports",
      },
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
