import { Quotation, SalesOrder, DeliveryOrder } from '../../types';
import { QuotationDto, SalesOrderDto, DeliveryOrderDto } from './types';

const mapDeliveryOrderStatus = (status: string): DeliveryOrder['status'] => {
  const s = status.toLowerCase();
  if (s === 'draft') return 'Draft';
  if (s === 'ready_to_load' || s === 'siap muat' || s === 'siap_muat') return 'Siap Muat';
  if (s === 'shipped' || s === 'dikirim') return 'Dikirim';
  if (s === 'received' || s === 'diterima') return 'Diterima';
  if (s === 'cancelled' || s === 'dibatalkan') return 'Dibatalkan';
  return 'Draft';
};

export const mapDeliveryOrderFromDto = (dto: DeliveryOrderDto): DeliveryOrder => ({
  id: dto.id,
  deliveryNumber: dto.delivery_number,
  salesOrderId: dto.sales_order_id,
  salesOrderNumber: dto.sales_order?.order_number || '',
  customerId: dto.customer_id,
  customerName: dto.customer?.name || 'Unknown Customer',
  deliveryDate: dto.delivery_date ? dto.delivery_date.split('T')[0] : '',
  receivedAt: dto.received_at ? dto.received_at.split('T')[0] : '',
  receiverName: dto.receiver_name || '',
  status: mapDeliveryOrderStatus(dto.status),
  notes: dto.notes || '',
  items: (dto.items || []).map(item => ({
    id: item.id,
    productId: item.product_id,
    productName: item.product?.name || 'Unknown Product',
    productSku: item.product?.sku || '',
    quantity: Number(item.quantity),
    length: item.sales_order_item?.length != null ? Number(item.sales_order_item.length) : undefined
  }))
});

export const mapQuotationFromDto = (dto: QuotationDto): Quotation => ({
  id: dto.id,
  quoteNumber: dto.quotation_number,
  customerId: dto.customer_id,
  customerName: dto.customer?.name || 'Unknown Customer',
  date: dto.quotation_date ? dto.quotation_date.split('T')[0] : '',
  validUntil: dto.valid_until ? dto.valid_until.split('T')[0] : '',
  total: Number(dto.total),
  status: mapQuotationStatus(dto.status),
  notes: dto.notes || undefined,
  items: (dto.items || []).map(item => ({
    productId: item.product_id || item.product?.id || '',
    productName: item.product?.name || item.description || 'Unknown Product',
    pieceCount: item.piece_count != null ? Number(item.piece_count) : undefined,
    length: item.length != null ? Number(item.length) : undefined,
    specification: item.specification || undefined,
    description: item.description || undefined,
    quantity: Number(item.quantity),
    price: Number(item.unit_price),
    unit: item.product?.unit?.name
  }))
});

export const mapSalesOrderFromDto = (dto: SalesOrderDto): SalesOrder => ({
  id: dto.id,
  orderNumber: dto.order_number,
  quotationNumber: dto.quotation?.quotation_number || undefined,
  customerId: dto.customer_id,
  customerName: dto.customer?.name || 'Unknown Customer',
  date: dto.order_date ? dto.order_date.split('T')[0] : '',
  total: Number(dto.total),
  status: mapSalesOrderStatus(dto.status),
  source: dto.source,
  notes: dto.notes || undefined,
  items: (dto.items || []).map(item => ({
    id: item.id,
    productId: item.product_id || item.product?.id || '',
    productName: item.product?.name || item.description || 'Unknown Product',
    pieceCount: item.piece_count != null ? Number(item.piece_count) : undefined,
    length: item.length != null ? Number(item.length) : undefined,
    specification: item.specification || undefined,
    description: item.description || undefined,
    quantity: Number(item.quantity),
    price: Number(item.unit_price),
    unit: item.product?.unit?.name
  })),
  hasPaidInvoice: (dto.invoices || []).some(inv => Number(inv.paid_amount) > 0),
  hasInvoice: (dto.invoices || []).length > 0,
  deliveryOrders: (dto.deliveryOrders || []).map(mapDeliveryOrderFromDto)
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
