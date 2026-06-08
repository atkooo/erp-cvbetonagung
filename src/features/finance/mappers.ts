import { Invoice, Payment } from '../../types';
import { InvoiceDto, PaymentDto, SupplierPayableDto, SupplierPayable } from './types';

export const mapInvoiceFromDto = (dto: InvoiceDto): Invoice => ({
  id: dto.id,
  invoiceNumber: dto.invoice_number,
  customerName: dto.customer?.name || 'Unknown Customer',
  date: dto.invoice_date,
  dueDate: dto.due_date,
  total: Number(dto.total),
  paidAmount: Number(dto.paid_amount),
  status: mapInvoiceStatus(dto.status),
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
  date: dto.payment_date,
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
  status: dto.status.toLowerCase() === 'paid' ? 'Lunas' : 'Open',
});

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

