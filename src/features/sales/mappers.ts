import { Quotation, SalesOrder, DeliveryOrder } from '../../types';
import { QuotationDto, SalesOrderDto, DeliveryOrderDto } from './types';

const mapDeliveryOrderStatus = (status: string): DeliveryOrder['status'] => {
  const s = status.toLowerCase();
  if (s === 'ready_to_load' || s === 'siap muat' || s === 'siap_muat') return 'Siap Muat';
  if (s === 'shipped' || s === 'dikirim') return 'Dikirim';
  if (s === 'received' || s === 'diterima') return 'Diterima';
  if (s === 'cancelled' || s === 'dibatalkan') return 'Dibatalkan';
  return 'Siap Muat';
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
    quantity: Number(item.quantity)
  }))
});

export const mapQuotationFromDto = (dto: QuotationDto): Quotation => ({
  id: dto.id,
  quoteNumber: dto.quotation_number,
  customerName: dto.customer?.name || 'Unknown Customer',
  date: dto.quotation_date,
  validUntil: dto.valid_until,
  total: Number(dto.total),
  status: mapQuotationStatus(dto.status),
  items: (dto.items || []).map(item => ({
    productName: item.product?.name || item.description || 'Unknown Product',
    quantity: Number(item.quantity),
    price: Number(item.unit_price)
  }))
});

export const mapSalesOrderFromDto = (dto: SalesOrderDto): SalesOrder => ({
  id: dto.id,
  orderNumber: dto.order_number,
  customerName: dto.customer?.name || 'Unknown Customer',
  date: dto.order_date,
  total: Number(dto.total),
  status: mapSalesOrderStatus(dto.status),
  items: (dto.items || []).map(item => ({
    productName: item.product?.name || item.description || 'Unknown Product',
    quantity: Number(item.quantity),
    price: Number(item.unit_price)
  }))
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

const mapSalesOrderStatus = (status: string): SalesOrder['status'] => {
  const s = status.toLowerCase();
  if (s === 'draft') return 'Draft';
  if (s === 'processing' || s === 'diproses') return 'Diproses';
  if (s === 'completed' || s === 'selesai') return 'Selesai';
  if (s === 'cancelled' || s === 'dibatalkan') return 'Dibatalkan';
  return 'Draft'; // default fallback
};
