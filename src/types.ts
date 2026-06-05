/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  email: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactName: string;
  phone: string;
  city: string;
  address: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  unit: string;
  location: string;
  minStock: number;
  status: 'Aman' | 'Menipis' | 'Habis';
}

export interface StockMovement {
  id: string;
  sku: string;
  productName: string;
  type: 'Masuk' | 'Keluar';
  quantity: number;
  referenceDoc: string; // e.g. PO-2026-001, SO-2026-004
  date: string;
  handler: string;
  notes: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  date: string;
  total: number;
  status: 'Draft' | 'Diproses' | 'Selesai' | 'Dibatalkan';
  items: {
    productName: string;
    quantity: number;
    price: number;
  }[];
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  customerName: string;
  date: string;
  validUntil: string;
  total: number;
  status: 'Draft' | 'Terkirim' | 'Disetujui' | 'Ditolak';
  items: {
    productName: string;
    quantity: number;
    price: number;
  }[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  date: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  status: 'Belum Lunas' | 'Sebagian Dibayar' | 'Lunas' | 'Overdue';
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceNumber: string;
  customerName: string;
  date: string;
  method: 'Cash' | 'Transfer' | 'QRIS';
  amount: number;
  status: 'Verified' | 'Pending' | 'Gagal';
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  date: string;
  total: number;
  status: 'Draft' | 'Dipesan' | 'Diterima Sebagian' | 'Diterima Penuh' | 'Dibatalkan';
  items: {
    productName: string;
    quantity: number;
    price: number;
  }[];
}

export interface Project {
  id: string;
  code: string;
  customerName: string;
  projectName: string;
  location: string;
  projectType: string;
  projectSpec: string;
  contractValue: number;
  deadline: string;
  progress: number; // 0 - 100
  status: 'Survey' | 'Penawaran' | 'Deal' | 'Produksi' | 'Pengiriman' | 'Pemasangan' | 'Selesai' | 'Dibatalkan';
  timeline: {
    date: string;
    stage: string;
    description: string;
    icon: string;
  }[];
  termin: {
    phase: string;
    amount: number;
    dueDate: string;
    status: 'Belum Bayar' | 'Lunas';
  }[];
  documentation: {
    id: string;
    title: string;
    imageUrl: string;
    date: string;
  }[];
}

export interface QrProduct {
  sku: string;
  name: string;
  stock: number;
  qrValue: string;
}

export interface AuthRole {
  id: string;
  code: string;
  name: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  status: string;
  role?: AuthRole | null;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export type ViewType =
  | 'login'
  | 'dashboard'
  | 'customers'
  | 'employees'
  | 'suppliers'
  | 'products'
  | 'categories'
  | 'stock-management'
  | 'incoming-goods'
  | 'outgoing-goods'
  | 'stock-movement-history'
  | 'quotations'
  | 'sales-orders'
  | 'invoices'
  | 'payments'
  | 'purchase-orders'
  | 'receivables-payables'
  | 'delivery-orders'
  | 'returns'
  | 'multi-warehouse'
  | 'project-budgeting'
  | 'reminders'
  | 'document-exports'
  | 'role-permissions'
  | 'approval-workflows'
  | 'stock-opname'
  | 'audit-logs'
  | 'production-work-orders'
  | 'bom-costing'
  | 'projects'
  | 'project-detail'
  | 'qr-products'
  | 'scan-qr-product'
  | 'scanned-product-detail'
  | 'reports'
  | 'settings';
