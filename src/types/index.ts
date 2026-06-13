/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * types/index.ts — Re-exports semua domain types agar import lama tetap kompatibel.
 * Impor per domain jika memungkinkan untuk tree-shaking yang lebih baik.
 */

export type { Customer, Supplier } from './master';
export type { Product, Category, QrProduct } from './product';
export type { StockMovement } from './inventory';
export type { SalesOrder, Quotation, Invoice, Payment, DeliveryOrder, DeliveryOrderItem } from './sales';
export type {
  PurchaseOrder, PurchaseOrderItem,
  PurchaseRequest, PurchaseRequestItem,
  Rfq, RfqItem,
  GoodsReceiptNote, GoodsReceiptNoteItem,
} from './purchasing';
export type { Project } from './project';
export type { Employee } from './employee';
export type {
  ProductionWorkOrder, ProductionWorkLog,
  Bom, BomItem,
} from './production';
export type { AuthPermission, AuthRole, AuthUser, AuthSession } from './auth';
export type { ViewType } from './navigation';
