import { Quotation, SalesOrder, DeliveryOrder } from '../../types';
import { QuotationDto, SalesOrderDto, DeliveryOrderDto } from './types';

const mapDeliveryOrderStatus = (status: string): DeliveryOrder['status'] => {
  const s = status.toLowerCase();
  if (s === 'draft') return 'draft';
  if (s === 'ready_to_load' || s === 'siap muat' || s === 'siap_muat') return 'ready_to_load';
  if (s === 'shipped' || s === 'dikirim') return 'shipped';
  if (s === 'received' || s === 'diterima') return 'received';
  if (s === 'cancelled' || s === 'dibatalkan') return 'cancelled';
  return 'draft';
};

export const mapDeliveryOrderFromDto = (dto: DeliveryOrderDto): DeliveryOrder => ({
  id: dto.id,
  deliveryNumber: dto.delivery_number,
  salesOrderId: dto.sales_order_id,
  salesOrder: dto.sales_order ? { id: dto.sales_order.id, orderNumber: dto.sales_order.order_number } : undefined,
  customerId: dto.customer_id,
  customer: dto.customer ? { id: dto.customer_id, name: dto.customer.name } : undefined,
  deliveryDate: dto.delivery_date ? dto.delivery_date.split('T')[0] : '',
  receivedAt: dto.received_at ? dto.received_at.split('T')[0] : '',
  receiverName: dto.receiver_name || '',
  status: mapDeliveryOrderStatus(dto.status),
  notes: dto.notes || '',
  items: (dto.items || []).map(item => ({
    id: item.id,
    deliveryOrderId: item.delivery_order_id || '',
    salesOrderItemId: item.sales_order_item_id || null,
    productId: item.product_id,
    quantity: Number(item.quantity),
    product: item.product ? {
      id: item.product.id || '',
      sku: item.product.sku || '',
      name: item.product.name || 'Unknown Product',
      unit: item.product.unit ? { code: item.product.unit.code || '', name: item.product.unit.name || '' } : undefined
    } : undefined,
    salesOrderItem: item.sales_order_item ? { length: item.sales_order_item.length != null ? Number(item.sales_order_item.length) : null } : undefined
  }))
});

export const mapQuotationFromDto = (dto: QuotationDto): Quotation => ({
  id: dto.id,
  quotationNumber: dto.quotation_number,
  customerId: dto.customer_id,
  customerName: dto.customer?.name || 'Unknown Customer',
  quotationDate: dto.quotation_date ? dto.quotation_date.split('T')[0] : '',
  validUntil: dto.valid_until ? dto.valid_until.split('T')[0] : '',
  total: Number(dto.total),
  status: mapQuotationStatus(dto.status),
  globalDiscountType: dto.global_discount_type,
  globalDiscountValue: dto.global_discount_value != null ? Number(dto.global_discount_value) : undefined,
  globalDiscountAmount: dto.global_discount_amount != null ? Number(dto.global_discount_amount) : undefined,
  notes: dto.notes || undefined,
  items: (dto.items || []).map(item => ({
    productId: item.product_id || item.product?.id || '',
    description: item.description || undefined,
    pieceCount: item.piece_count != null ? Number(item.piece_count) : undefined,
    length: item.length != null ? Number(item.length) : undefined,
    specification: item.specification || undefined,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
    price: Number(item.unit_price),
    discountAmount: item.discount_amount != null ? Number(item.discount_amount) : undefined,
    product: item.product ? {
      id: item.product.id || '',
      sku: item.product.sku || '',
      name: item.product.name || 'Unknown Product',
      unit: item.product.unit ? { code: item.product.unit.code || '', name: item.product.unit.name || '' } : undefined
    } : undefined
  }))
});

export const mapSalesOrderFromDto = (dto: SalesOrderDto): SalesOrder => ({
  id: dto.id,
  orderNumber: dto.order_number,
  quotation: dto.quotation ? { id: dto.quotation.id, quotationNumber: dto.quotation.quotation_number } : undefined,
  customerId: dto.customer_id,
  customerName: dto.customer?.name || 'Unknown Customer',
  orderDate: dto.order_date ? dto.order_date.split('T')[0] : '',
  total: Number(dto.total),
  status: mapSalesOrderStatus(dto.status),
  source: dto.source,
  globalDiscountType: dto.global_discount_type,
  globalDiscountValue: dto.global_discount_value != null ? Number(dto.global_discount_value) : undefined,
  globalDiscountAmount: dto.global_discount_amount != null ? Number(dto.global_discount_amount) : undefined,
  notes: dto.notes || undefined,
  items: (dto.items || []).map(item => ({
    id: item.id,
    productId: item.product_id || item.product?.id || '',
    description: item.description || undefined,
    pieceCount: item.piece_count != null ? Number(item.piece_count) : undefined,
    length: item.length != null ? Number(item.length) : undefined,
    specification: item.specification || undefined,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
    price: Number(item.unit_price),
    discountAmount: item.discount_amount != null ? Number(item.discount_amount) : undefined,
    product: item.product ? {
      id: item.product.id || '',
      sku: item.product.sku || '',
      name: item.product.name || 'Unknown Product',
      unit: item.product.unit ? { code: item.product.unit.code || '', name: item.product.unit.name || '' } : undefined
    } : undefined
  })),
  hasPaidInvoice: (dto.invoices || []).some(inv => Number(inv.paid_amount) > 0 && inv.status !== 'cancelled' && inv.status !== 'dibatalkan'),
  hasInvoice: (dto.invoices || []).some(inv => inv.status !== 'cancelled' && inv.status !== 'dibatalkan'),
  invoices: (dto.invoices || []).map((inv: any) => ({
    id: inv.id,
    paidAmount: Number(inv.paid_amount || 0),
    total: Number(inv.total || 0),
    status: inv.status
  })),
  deliveryOrders: (dto.deliveryOrders || (dto as any).delivery_orders || []).map(mapDeliveryOrderFromDto)
});

// Helper for status translations
const mapQuotationStatus = (status: string): Quotation['status'] => {
  const s = status.toLowerCase();
  if (s === 'draft') return 'Draft';
  if (s === 'sent') return 'Terkirim';
  if (s === 'approved') return 'Disetujui';
  if (s === 'rejected') return 'Ditolak';
  return 'Draft'; // default fallback
};

const mapSalesOrderStatus = (status: string): SalesOrder['status'] | any => {
  const s = status.toLowerCase();
  if (s === 'draft') return 'Draft';
  if (s === 'processing' || s === 'diproses' || s === 'pending_delivery') return 'Diproses';
  if (s === 'approved' || s === 'disetujui') return 'Disetujui';
  if (s === 'completed' || s === 'selesai') return 'Selesai';
  if (s === 'cancelled' || s === 'dibatalkan') return 'Dibatalkan';
  return 'Draft'; // default fallback
};
