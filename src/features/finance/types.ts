export interface InvoiceDto {
  id: string;
  invoice_number: string;
  customer_id: string;
  sales_order_id: string | null;
  project_id: string | null;
  invoice_date: string;
  due_date: string;
  status: string; // Belum Lunas, Sebagian Dibayar, Lunas, Overdue
  notes: string | null;
  total: number;
  paid_amount: number;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
  };
}

export interface PaymentDto {
  id: string;
  payment_number: string;
  invoice_id: string;
  payment_date: string;
  method: 'Cash' | 'Transfer' | 'QRIS';
  amount: number;
  status: 'Verified' | 'Pending' | 'Gagal';
  notes: string | null;
  created_at: string;
  updated_at: string;
  invoice?: {
    id: string;
    invoice_number: string;
    customer?: {
      id: string;
      name: string;
    };
  };
}

export interface SupplierPayableDto {
  id: string;
  purchase_order_id: string | null;
  supplier_id: string;
  payable_number: string;
  due_date: string | null;
  amount: number | string;
  paid_amount: number | string;
  status: string;
  created_at: string;
  supplier?: {
    id: string;
    name: string;
  };
  purchase_order?: {
    id: string;
    po_number: string;
  };
}

export interface SupplierPayable {
  id: string;
  payableNumber: string;
  supplierName: string;
  poNumber: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'Open' | 'Lunas';
}

