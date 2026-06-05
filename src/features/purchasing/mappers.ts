import { PurchaseOrder } from '../../types';
import { PurchaseOrderDto } from './types';

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
