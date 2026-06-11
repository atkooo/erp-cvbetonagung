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
  type: 'raw_material' | 'finished_good' | 'service';
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  unit: string;
  unitId?: string;
  location: string;
  minStock: number;
  status: 'Aman' | 'Menipis' | 'Habis';
  qrValue?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  status: 'active' | 'inactive';
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
  customerId?: string;
  customerName: string;
  date: string;
  total: number;
  status: 'Draft' | 'Diproses' | 'Disetujui' | 'Selesai' | 'Dibatalkan';
  items: {
    productName: string;
    quantity: number;
    price: number;
  }[];
  hasPaidInvoice?: boolean;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  customerId?: string;
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

export interface PurchaseOrderItem {
  id?: string;
  productId?: string;
  productSku?: string;
  productName: string;
  quantity: number;
  receivedQty?: number;
  price: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  date: string;
  total: number;
  status: 'Draft' | 'Dipesan' | 'Diterima Sebagian' | 'Diterima Penuh' | 'Dibatalkan' | string;
  notes?: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseRequestItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  status: string;
  unit?: string;
}

export interface PurchaseRequest {
  id: string;
  prNumber: string;
  requesterId: string;
  requesterName: string;
  requestDate: string;
  requiredDate: string;
  department: string;
  status: string;
  notes?: string;
  items: PurchaseRequestItem[];
}

export interface RfqItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  quotedUnitPrice: number;
  subtotal: number;
  unit?: string;
}

export interface Rfq {
  id: string;
  rfqNumber: string;
  purchaseRequestId: string;
  supplierId: string;
  supplierName: string;
  rfqDate: string;
  validUntil: string;
  status: string;
  notes?: string;
  items: RfqItem[];
}

export interface GoodsReceiptNoteItem {
  id: string;
  productId: string;
  productSku?: string;
  productName: string;
  receivedQty: number;
  rejectedQty: number;
  notes?: string;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  poNumber?: string;
  warehouseId?: string;
  warehouseName?: string;
  receivedBy: string;
  receiverName?: string;
  receiptDate: string;
  deliveryOrderNumber?: string;
  status: string;
  notes?: string;
  items: GoodsReceiptNoteItem[];
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

export interface Employee {
  id: string;
  userId?: string | null;
  employeeNumber: string;
  name: string;
  roleName: string;
  department: string;
  phone: string;
  address: string;
  joinDate: string;
  employeeType: 'Tetap' | 'Kontrak' | 'Borongan' | 'Harian';
  dailyRate: number;
  pieceRate: number;
  status: 'Aktif' | 'Nonaktif';
  
  // HRD Fields
  gender?: string;
  placeOfBirth?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  religion?: string;
  bloodType?: string;
  idCardNumber?: string;
  taxIdNumber?: string;
  bankName?: string;
  bankAccount?: string;
}

export interface QrProduct {
  sku: string;
  name: string;
  stock: number;
  qrValue: string;
}

export interface AuthPermission {
  id: string;
  module: string;
  action: string;
  pivot?: {
    access_level: string;
  };
}

export interface DeliveryOrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
}

export interface DeliveryOrder {
  id: string;
  deliveryNumber: string;
  salesOrderId: string;
  salesOrderNumber?: string;
  customerId: string;
  customerName?: string;
  deliveryDate: string;
  receivedAt?: string;
  receiverName?: string;
  status: 'Siap Muat' | 'Dikirim' | 'Diterima' | 'Dibatalkan';
  notes?: string;
  items?: DeliveryOrderItem[];
}

export interface ProductionWorkLog {
  id: string;
  workOrderId: string;
  employeeId?: string;
  employeeName?: string;
  workDate: string;
  stage: string;
  madeQty: number;
  rejectQty: number;
  okQty: number;
  pieceRate: number;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface ProductionWorkOrder {
  id: string;
  workOrderNumber: string;
  productId: string;
  productName?: string;
  productSku?: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
  projectId?: string;
  projectName?: string;
  sourceLabel?: string;
  stage: string;
  targetQty: number;
  completedQty: number;
  progress: number;
  dueDate?: string;
  logs?: ProductionWorkLog[];
}

export interface BomItem {
  id: string;
  bomId: string;
  componentProductId?: string;
  componentSku?: string;
  componentName?: string;
  quantity: number;
  unitCode?: string;
  unitCost: number;
  subtotal: number;
}

export interface Bom {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  version: string;
  effectiveFrom?: string;
  status: 'active' | 'inactive';
  totalCost: number;
  items?: BomItem[];
}

export interface AuthRole {
  id: string;
  code: string;
  name: string;
  permissions?: AuthPermission[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  status: string;
  role?: AuthRole | null;
  employee_id?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export type ViewType =
  | 'login'
  | 'dashboard'
  | 'employee-dashboard'
  | 'customers'
  | 'employees'
  | 'suppliers'
  | 'products'
  | 'categories'
  | 'units'
  | 'warehouses'
  | 'stock-management'
  | 'incoming-goods'
  | 'outgoing-goods'
  | 'stock-movement-history'
  | 'quotations'
  | 'sales-orders'
  | 'invoices'
  | 'payments'
  | 'receivables-payables'
  | 'cash-expense'
  | 'purchase-orders'
  | 'delivery-orders'
  | 'returns'
  | 'purchase-requests'
  | 'rfq'
  | 'goods-receipts'
  | 'purchase-returns'
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
  | 'finance-reports'
  | 'inventory-reports'
  | 'attendance-dashboard'
  | 'leave-management'
  | 'payroll-management'
  | 'employee-loans'
  | 'attendance-scanner'
  | 'settings'
  | 'users';
