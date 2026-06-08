import { GoodsReceiptNote, PurchaseOrder, PurchaseRequest, PurchaseRequestItem } from '../../types';
import { GoodsReceiptNoteDto, GoodsReceiptNoteItemDto, PurchaseOrderDto, ReturnItemDto, ReturnItem, ReturnDto, Return, PurchaseRequestDto, PurchaseRequestItemDto } from './types';

export const mapPurchaseRequestItemFromDto = (dto: PurchaseRequestItemDto): PurchaseRequestItem => ({
  id: dto.id,
  productId: dto.product_id,
  productName: dto.product?.name || dto.description || 'Unknown Product',
  quantity: Number(dto.quantity),
  status: dto.status,
  unit: (typeof dto.product?.unit === 'object' ? (dto.product.unit as any).code : dto.product?.unit) || 'Unit'
});

export const mapPurchaseRequestFromDto = (dto: PurchaseRequestDto): PurchaseRequest => ({
  id: dto.id,
  prNumber: dto.pr_number,
  requesterId: dto.requester_id,
  requesterName: dto.requester?.name || 'Unknown',
  requestDate: dto.request_date,
  requiredDate: dto.required_date || dto.request_date,
  department: dto.department,
  status: dto.status,
  notes: dto.notes || undefined,
  items: (dto.items || []).map(mapPurchaseRequestItemFromDto)
});

export const mapPurchaseOrderFromDto = (dto: PurchaseOrderDto): PurchaseOrder => ({
  id: dto.id,
  poNumber: dto.purchase_number || dto.po_number || `PO-${dto.id.substring(0, 8)}`,
  supplierName: dto.supplier?.name || 'Unknown Supplier',
  date: (dto as any).po_date || dto.order_date,
  total: Number(dto.total) || (dto.items || []).reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0),
  status: mapPurchaseOrderStatus(dto.status),
  items: (dto.items || []).map(item => ({
    id: item.id, // For receiving logic
    productId: item.product?.id || item.product_id,
    productSku: item.product?.sku || '',
    productName: item.product?.name || item.description || 'Unknown Product',
    quantity: Number(item.quantity),
    receivedQty: Number(item.received_quantity ?? item.received_qty ?? 0),
    price: Number(item.unit_price)
  }))
});

const mapPurchaseOrderStatus = (status: string): PurchaseOrder['status'] => {
  const s = status.toLowerCase();
  if (s === 'draft') return 'Draft';
  if (s === 'ordered' || s === 'dipesan') return 'Dipesan';
  if (s === 'partially_received' || s === 'diterima sebagian') return 'Diterima Sebagian';
  if (s === 'received' || s === 'fully_received' || s === 'diterima penuh') return 'Diterima Penuh';
  if (s === 'cancelled' || s === 'dibatalkan') return 'Dibatalkan';
  return 'Draft'; // fallback
};

export const mapGoodsReceiptNoteItemFromDto = (dto: GoodsReceiptNoteItemDto) => ({
  id: dto.id,
  productId: dto.product_id,
  productSku: dto.product?.sku || '',
  productName: dto.product?.name || 'Produk Tidak Dikenal',
  receivedQty: Number(dto.received_quantity || 0),
  rejectedQty: Number(dto.rejected_quantity || 0),
  notes: dto.notes || undefined,
});

export const mapGoodsReceiptNoteFromDto = (dto: GoodsReceiptNoteDto): GoodsReceiptNote => ({
  id: dto.id,
  grnNumber: dto.grn_number,
  purchaseOrderId: dto.purchase_order_id || '',
  poNumber: dto.purchase_order?.purchase_number,
  warehouseId: dto.warehouse_id || dto.to_location_id || undefined,
  warehouseName: dto.warehouse?.name || dto.to_location?.name,
  receivedBy: dto.received_by || '',
  receiverName: dto.receiver?.name,
  receiptDate: dto.receipt_date,
  deliveryOrderNumber: dto.delivery_order_number || undefined,
  status: dto.status,
  notes: dto.notes || undefined,
  items: (dto.items || []).map(mapGoodsReceiptNoteItemFromDto),
});

export const mapReturnItemFromDto = (dto: ReturnItemDto): ReturnItem => ({
  id: dto.id,
  productId: dto.product_id,
  productName: dto.product?.name || 'Produk Tidak Dikenal',
  productSku: dto.product?.sku || '-',
  quantity: Number(dto.quantity),
  notes: dto.notes || '-',
});

export const mapReturnFromDto = (dto: ReturnDto): Return => ({
  id: dto.id,
  returnNumber: dto.return_number,
  type: dto.type as 'customer' | 'supplier',
  partnerName: dto.type === 'customer' ? (dto.customer?.name || '-') : (dto.supplier?.name || '-'),
  referenceNumber: dto.type === 'customer' ? (dto.sales_order?.order_number || '-') : (dto.purchase_order?.purchase_number || '-'),
  reason: dto.reason,
  qcStatus: dto.qc_status,
  createdAt: dto.created_at ? dto.created_at.replace('T', ' ').replace('.000000Z', '').substring(0, 16) : '',
  items: (dto.items || []).map(mapReturnItemFromDto),
});

export const mapRfqItemFromDto = (dto: any): any => ({
  id: dto.id,
  productId: dto.product_id || '',
  productName: dto.product?.name || dto.description || 'Custom Item',
  quantity: Number(dto.quantity),
  quotedUnitPrice: Number(dto.quoted_unit_price),
  subtotal: Number(dto.subtotal),
  unit: (typeof dto.product?.unit === 'object' ? (dto.product.unit as any).code : dto.product?.unit) || 'Unit'
});

export const mapRfqFromDto = (dto: any): any => ({
  id: dto.id,
  rfqNumber: dto.rfq_number,
  purchaseRequestId: dto.purchase_request?.pr_number || dto.purchase_request_id || '-',
  supplierId: dto.supplier_id,
  supplierName: dto.supplier?.name || 'Unknown Supplier',
  rfqDate: dto.rfq_date,
  validUntil: dto.valid_until,
  status: dto.status,
  notes: dto.notes || undefined,
  items: (dto.items || []).map(mapRfqItemFromDto)
});
