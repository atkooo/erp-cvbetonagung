/** Domain types: Sales (Quotation, SalesOrder, Invoice, Payment, DeliveryOrder) */

export interface SalesOrder {
  id: string;
  orderNumber: string;
  quotationNumber?: string;
  customerId?: string;
  customerName: string;
  date: string;
  total: number;
  status: 'Draft' | 'Diproses' | 'Disetujui' | 'Selesai' | 'Dibatalkan';
  source?: 'erp' | 'pos';
  notes?: string;
  items: {
    id?: string; // Add id to items for matching with DO items
    productId?: string;
    productName: string;
    pieceCount?: number;
    length?: number;
    specification?: string;
    description?: string;
    quantity: number;
    price: number;
    unit?: string;
  }[];
  hasPaidInvoice?: boolean;
  hasInvoice?: boolean;
  deliveryOrders?: DeliveryOrder[];
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
    pieceCount?: number;
    length?: number;
    specification?: string;
    description?: string;
    quantity: number;
    price: number;
    unit?: string;
  }[];
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  productName: string;
  description?: string;
  pieceCount?: number;
  length?: number;
  unit?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  status: 'Belum Lunas' | 'Sebagian Dibayar' | 'Lunas' | 'Overdue';
  items?: InvoiceItem[];
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
  length?: number;
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
  status: 'Draft' | 'Siap Muat' | 'Dikirim' | 'Diterima' | 'Dibatalkan';
  notes?: string;
  items?: DeliveryOrderItem[];
}
