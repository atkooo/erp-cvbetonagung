/** Domain types: Sales (Quotation, SalesOrder, Invoice, Payment, DeliveryOrder) */

export interface SalesOrder {
  id: string;
  orderNumber: string;
  quotationId?: string | null;
  customerId?: string;
  orderDate: string;
  total: number;
  status: string; // Draft, Diproses, Disetujui, Selesai, Dibatalkan
  source?: 'erp' | 'pos';
  notes?: string | null;
  items: {
    id?: string;
    productId: string;
    description?: string | null;
    pieceCount?: number | null;
    length?: number | null;
    specification?: string | null;
    quantity: number;
    unitPrice: number;
    discountAmount?: number | string | null;
    subtotal?: number;
    product?: {
      id: string;
      sku: string;
      name: string;
      unit?: {
        code: string;
        name: string;
      };
    };
  }[];
  globalDiscountType?: 'percentage' | 'nominal' | null;
  globalDiscountValue?: number | string | null;
  globalDiscountAmount?: number | string | null;
  customer?: {
    id: string;
    name: string;
  };
  customerName?: string;
  hasInvoice?: boolean;
  hasPaidInvoice?: boolean;
  quotation?: {
    id: string;
    quotationNumber: string;
  };
  invoices?: {
    id: string;
    paidAmount: number;
    total?: number;
    status?: string;
  }[];
  deliveryOrders?: DeliveryOrder[];
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  quoteNumber?: string;
  customerId: string;
  customerName?: string;
  hasInvoice?: boolean;
  invoices?: Invoice[];
  quotationDate: string;
  date?: string;
  validUntil: string;
  total: number;
  status: string; // Draft, Terkirim, Disetujui, Ditolak
  notes?: string | null;
  items: {
    id?: string;
    productId: string;
    productName?: string;
    description?: string | null;
    pieceCount?: number | null;
    length?: number | null;
    specification?: string | null;
    quantity: number;
    unitPrice: number;
    price?: number;
    discountAmount?: number | string | null;
    subtotal?: number;
    unit?: string;
    product?: {
      id: string;
      sku: string;
      name: string;
      unit?: {
        code: string;
        name: string;
      };
    };
  }[];
  globalDiscountType?: 'percentage' | 'nominal' | null;
  globalDiscountValue?: number | string | null;
  globalDiscountAmount?: number | string | null;
  customer?: {
    id: string;
    name: string;
  };
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  description?: string;
  pieceCount?: number;
  length?: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: {
    id: string;
    name: string;
    unit?: {
      name: string;
    };
  };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  salesOrderId?: string;
  salesOrder?: {
    id: string;
    orderNumber: string;
  };
  customer?: {
    name: string;
    phone?: string;
  };
  customerName?: string; // mapped from customer.name for display convenience
  date?: string; // mapped from invoice_date for display convenience
  invoiceDate: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  status: string; // Belum Lunas, Sebagian Dibayar, Lunas, Overdue
  items?: InvoiceItem[];
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceNumber: string;
  customerName: string;
  paymentDate: string;
  method: 'Cash' | 'Transfer' | 'QRIS';
  amount: number;
  status: 'Verified' | 'Pending' | 'Gagal' | 'Cancelled';
}

export interface DeliveryOrderItem {
  id: string;
  deliveryOrderId: string;
  salesOrderItemId: string | null;
  productId: string;
  quantity: number;
  product?: {
    id: string;
    sku: string;
    name: string;
    unit?: {
      code: string;
      name: string;
    };
  };
  salesOrderItem?: {
    length?: number | null;
  };
}

export interface DeliveryOrder {
  id: string;
  deliveryNumber: string;
  salesOrderId: string;
  customerId: string;
  deliveryDate: string | null;
  receivedAt: string | null;
  receiverName: string | null;
  status: 'draft' | 'ready_to_load' | 'shipped' | 'received' | 'cancelled';
  notes: string | null;
  salesOrder?: {
    id: string;
    orderNumber: string;
  };
  customer?: {
    id: string;
    name: string;
  };
  items?: DeliveryOrderItem[];
}
