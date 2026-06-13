/** Domain types: Sales (Quotation, SalesOrder, Invoice, Payment, DeliveryOrder) */

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  date: string;
  total: number;
  status: 'Draft' | 'Diproses' | 'Disetujui' | 'Selesai' | 'Dibatalkan';
  notes?: string;
  items: {
    productId?: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  hasPaidInvoice?: boolean;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  customerId?: string;
  customerName: string;
  date: string;
  validUntil: string;
  total: number;
  status: 'Draft' | 'Terkirim' | 'Disetujui' | 'Ditolak';
  notes?: string;
  items: {
    productId?: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  date: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  status: 'Belum Lunas' | 'Sebagian Dibayar' | 'Lunas' | 'Overdue';
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceNumber: string;
  customerName: string;
  date: string;
  method: 'Cash' | 'Transfer' | 'QRIS';
  amount: number;
  status: 'Verified' | 'Pending' | 'Gagal';
}

export interface DeliveryOrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
}

export interface DeliveryOrder {
  id: string;
  deliveryNumber: string;
  salesOrderId: string;
  salesOrderNumber?: string;
  customerId: string;
  customerName?: string;
  deliveryDate: string;
  receivedAt?: string;
  receiverName?: string;
  status: 'Siap Muat' | 'Dikirim' | 'Diterima' | 'Dibatalkan';
  notes?: string;
  items?: DeliveryOrderItem[];
}
