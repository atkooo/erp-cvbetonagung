import { Invoice, Payment } from '../../types';
import { InvoiceDto, PaymentDto } from './types';

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

export const mapPaymentFromDto = (dto: PaymentDto): Payment => ({
  id: dto.id,
  paymentNumber: dto.payment_number,
  invoiceNumber: dto.invoice?.invoice_number || 'N/A',
  customerName: dto.invoice?.customer?.name || 'Unknown Customer',
  date: dto.payment_date,
  method: dto.method,
  amount: Number(dto.amount),
  status: mapPaymentStatus(dto.status),
});

const mapInvoiceStatus = (status: string): Invoice['status'] => {
  const s = status.toLowerCase();
  if (s === 'unpaid' || s === 'belum lunas') return 'Belum Lunas';
  if (s === 'partially_paid' || s === 'sebagian dibayar') return 'Sebagian Dibayar';
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
