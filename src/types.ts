/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * types.ts — Legacy compatibility barrel.
 *
 * File ini sekarang hanya menjadi re-export dari domain-specific type files.
 * Semua import yang menggunakan `from './types'` atau `from '../types'` tetap
 * kompatibel tanpa perlu mengubah kode yang sudah ada.
 *
 * Untuk kode baru, disarankan import langsung dari domain file:
 *   import type { Customer } from './types/master'
 *   import type { SalesOrder } from './types/sales'
 *   import type { AuthUser } from './types/auth'
 */

// Re-export semua domain types
export type { Customer, Supplier } from './types/master';
export type { Product, Category, QrProduct } from './types/product';
export type { StockMovement } from './types/inventory';
export type {
  SalesOrder,
  Quotation,
  Invoice,
  Payment,
  DeliveryOrder,
  DeliveryOrderItem,
} from './types/sales';
export type {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseRequest,
  PurchaseRequestItem,
  Rfq,
  RfqItem,
  GoodsReceiptNote,
  GoodsReceiptNoteItem,
} from './types/purchasing';
export type { Project } from './types/project';
export type { Employee } from './types/employee';
export type {
  ProductionWorkOrder,
  ProductionWorkLog,
  Bom,
  BomItem,
} from './types/production';
export type {
  AuthPermission,
  AuthRole,
  AuthUser,
  AuthSession,
} from './types/auth';
export type { ViewType } from './types/navigation';
