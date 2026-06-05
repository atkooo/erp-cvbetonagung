import { PurchaseOrder } from '../../types';
import { PurchaseOrderDto, ReturnItemDto, ReturnItem, ReturnDto, Return } from './types';

export const mapPurchaseOrderFromDto = (dto: PurchaseOrderDto): PurchaseOrder => ({
  id: dto.id,
  poNumber: dto.purchase_number || `PO-${dto.id.substring(0, 8)}`,
  supplierName: dto.supplier?.name || 'Unknown Supplier',
  date: dto.order_date,
  total: Number(dto.total),
  status: mapPurchaseOrderStatus(dto.status),
  items: (dto.items || []).map(item => ({
    id: item.id, // For receiving logic
    productName: item.product?.name || item.description || 'Unknown Product',
    quantity: Number(item.quantity),
    price: Number(item.unit_price)
  }))
});

const mapPurchaseOrderStatus = (status: string): PurchaseOrder['status'] => {
  const s = status.toLowerCase();
  if (s === 'draft') return 'Draft';
  if (s === 'ordered' || s === 'dipesan') return 'Dipesan';
  if (s === 'partially_received' || s === 'diterima sebagian') return 'Diterima Sebagian';
  if (s === 'received' || s === 'diterima penuh') return 'Diterima Penuh';
  if (s === 'cancelled' || s === 'dibatalkan') return 'Dibatalkan';
  return 'Draft'; // fallback
};

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

