import { Invoice, Payment } from '../../types';
import { InvoiceDto, PaymentDto, SupplierPayableDto, SupplierPayable } from './types';

export const mapInvoiceFromDto = (dto: InvoiceDto): Invoice => ({
  id: dto.id,
  invoiceNumber: dto.invoice_number,
  salesOrderId: dto.sales_order_id || undefined,
  salesOrder: dto.sales_order ? { id: dto.sales_order.id, orderNumber: dto.sales_order.order_number } : undefined,
  customerName: dto.customer?.name || 'Unknown Customer',
  customer: dto.customer ? { name: dto.customer.name, phone: dto.customer.phone } : undefined,
  date: dto.invoice_date,
  invoiceDate: dto.invoice_date,
  dueDate: dto.due_date,
  total: Number(dto.total),
  paidAmount: Number(dto.paid_amount),
  status: mapInvoiceStatus(dto.status),
  items: dto.items?.map(item => ({
    id: item.id,
    productId: item.product_id || undefined,
    productName: item.product?.name || item.description || 'Item Tanpa Nama',
    description: item.description || undefined,
    pieceCount: item.piece_count != null ? Number(item.piece_count) : undefined,
    length: item.length != null ? Number(item.length) : undefined,
    unit: item.product?.unit?.name,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
    subtotal: Number(item.subtotal),
  })),
});

const mapPaymentMethod = (method: string): Payment['method'] => {
  const m = method.toLowerCase();
  if (m === 'cash' || m === 'tunai') return 'Cash';
  if (m === 'transfer') return 'Transfer';
  if (m === 'qris') return 'QRIS';
  return 'Cash';
};

export const mapPaymentFromDto = (dto: PaymentDto): Payment => ({
  id: dto.id,
  paymentNumber: dto.payment_number,
  invoiceNumber: dto.invoice?.invoice_number || 'N/A',
  customerName: dto.invoice?.customer?.name || 'Unknown Customer',
  paymentDate: dto.payment_date,
  method: mapPaymentMethod(dto.method),
  amount: Number(dto.amount),
  status: mapPaymentStatus(dto.status),
});

export const mapSupplierPayableFromDto = (dto: SupplierPayableDto): SupplierPayable => ({
  id: dto.id,
  payableNumber: dto.payable_number,
  supplierName: dto.supplier?.name || 'Pemasok Tidak Dikenal',
  poNumber: dto.purchase_order?.po_number || 'Tanpa PO',
  dueDate: dto.due_date || '-',
  amount: Number(dto.amount),
  paidAmount: Number(dto.paid_amount),
  status: mapSupplierPayableStatus(dto.status),
});

const mapSupplierPayableStatus = (status: string): SupplierPayable['status'] => {
  const s = status.toLowerCase();
  if (s === 'paid' || s === 'lunas') return 'Lunas';
  if (s === 'partial' || s === 'partially_paid' || s === 'sebagian dibayar') return 'Sebagian Dibayar';
  if (s === 'cancelled' || s === 'dibatalkan') return 'Dibatalkan';
  return 'Open';
};

const mapInvoiceStatus = (status: string): Invoice['status'] => {
  const s = status.toLowerCase();
  if (s === 'unpaid' || s === 'belum lunas') return 'Belum Lunas';
  if (s === 'partial' || s === 'partially_paid' || s === 'sebagian dibayar') return 'Sebagian Dibayar';
  if (s === 'paid' || s === 'lunas') return 'Lunas';
  if (s === 'overdue') return 'Overdue';
  return 'Belum Lunas'; // fallback
};

const mapPaymentStatus = (status: string): Payment['status'] => {
  const s = status.toLowerCase();
  if (s === 'verified' || s === 'lunas' || s === 'sukses') return 'Verified';
  if (s === 'pending') return 'Pending';
  if (s === 'failed' || s === 'gagal') return 'Gagal';
  return 'Pending'; // fallback
};
