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
