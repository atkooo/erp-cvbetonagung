/** Domain types: Purchasing (PurchaseOrder, PurchaseRequest, RFQ, GRN) */

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
