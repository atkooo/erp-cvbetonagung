export interface PurchaseRequestItemDto {
  id: string;
  purchase_request_id: string;
  product_id: string;
  description: string | null;
  quantity: number;
  status: string;
  product?: {
    id: string;
    sku: string;
    name: string;
    unit?: {
      code: string;
    } | string;
  };
}

export interface PurchaseRequestDto {
  id: string;
  pr_number: string;
  requester_id: string;
  request_date: string;
  required_date: string | null;
  department: string;
  status: string;
  notes: string | null;
  requester?: {
    id: string;
    name: string;
  };
  items?: PurchaseRequestItemDto[];
}

export interface CreatePurchaseRequestDto {
  requester_id: string;
  request_date: string;
  required_date?: string;
  department: string;
  notes?: string;
  items: {
    product_id: string;
    quantity: number;
    description?: string;
  }[];
}

export interface PurchaseOrderItemDto {
  id: string;
  purchase_order_id: string;
  product_id: string;
  description: string | null;
  quantity: number;
  received_qty?: number;
  received_quantity: number;
  unit_price: number;
  subtotal: number;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
}

export interface PurchaseOrderDto {
  id: string;
  po_number?: string;
  purchase_number: string;
  supplier_id: string;
  sales_order_id?: string | null;
  po_date?: string;
  order_date: string;
  expected_date: string | null;
  status: string; // Draft, Dipesan, Diterima Sebagian, Diterima Penuh, Dibatalkan
  notes: string | null;
  total: number;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: string;
    name: string;
  };
  sales_order?: {
    id: string;
    order_number: string;
  };
  items?: PurchaseOrderItemDto[];
}

export interface CreatePurchaseOrderDto {
  supplier_id: string;
  sales_order_id?: string | null;
  order_date: string;
  expected_date?: string;
  notes?: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    description?: string;
  }[];
}

export interface GoodsReceiptNoteItemDto {
  id: string;
  goods_receipt_note_id: string;
  purchase_order_item_id: string | null;
  product_id: string;
  received_quantity: number;
  rejected_quantity: number;
  notes: string | null;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
}

export interface GoodsReceiptNoteDto {
  id: string;
  grn_number: string;
  purchase_order_id: string | null;
  warehouse_id: string | null;
  to_location_id?: string | null;
  received_by: string | null;
  receipt_date: string;
  delivery_order_number: string | null;
  status: string;
  notes: string | null;
  purchase_order?: {
    id: string;
    purchase_number: string;
  };
  warehouse?: {
    id: string;
    name: string;
  };
  to_location?: {
    id: string;
    name: string;
    code?: string;
  };
  receiver?: {
    id: string;
    name: string;
  };
  items?: GoodsReceiptNoteItemDto[];
}

export interface CreateGoodsReceiptNoteDto {
  purchase_order_id?: string | null;
  warehouse_id?: string | null;
  to_location_id: string;
  received_by?: string | null;
  receipt_date: string;
  delivery_order_number?: string | null;
  status?: string;
  notes?: string | null;
  items: {
    purchase_order_item_id?: string | null;
    product_id: string;
    received_quantity: number;
    rejected_quantity?: number;
    notes?: string | null;
  }[];
}

export interface ReturnItemDto {
  id: string;
  return_id: string;
  product_id: string;
  quantity: number;
  notes: string | null;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
}

export interface ReturnDto {
  id: string;
  return_number: string;
  type: string;
  customer_id: string | null;
  supplier_id: string | null;
  sales_order_id: string | null;
  purchase_order_id: string | null;
  reason: string;
  action?: 'refund' | 'replace';
  qc_status: string;
  created_at: string;
  customer?: { id: string; name: string };
  supplier?: { id: string; name: string };
  sales_order?: { 
    id: string; 
    order_number: string; 
    invoices?: { total: number; paid_amount: number; status: string }[];
  };
  purchase_order?: { id: string; purchase_number: string };
  items?: ReturnItemDto[];
}

export interface CreateReturnDto {
  type: 'customer' | 'supplier';
  customer_id?: string | null;
  supplier_id?: string | null;
  sales_order_id?: string | null;
  purchase_order_id?: string | null;
  reason: string;
  action?: 'refund' | 'replace';
  qc_status: string;
  items: {
    product_id: string;
    quantity: number;
    notes?: string;
  }[];
}

export interface ReturnItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  notes: string;
}

export interface Return {
  id: string;
  returnNumber: string;
  type: 'customer' | 'supplier';
  partnerName: string;
  referenceNumber: string;
  reason: string;
  action?: 'refund' | 'replace';
  qcStatus: string;
  createdAt: string;
  overpaymentAmount?: number;
  items: ReturnItem[];
}

export interface RfqItemDto {
  id: string;
  rfq_id: string;
  product_id: string | null;
  description: string | null;
  quantity: number;
  quoted_unit_price: number;
  subtotal: number;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
}

export interface RfqDto {
  id: string;
  rfq_number: string;
  purchase_request_id: string | null;
  supplier_id: string;
  rfq_date: string;
  valid_until: string;
  status: string;
  notes: string | null;
  supplier?: {
    id: string;
    name: string;
  };
  items?: RfqItemDto[];
}

export interface CreateRfqDto {
  purchase_request_id?: string;
  supplier_id: string;
  rfq_date: string;
  valid_until: string;
  status: string;
  notes?: string;
  items: {
    product_id?: string;
    description?: string;
    quantity: number;
    quoted_unit_price: number;
    subtotal: number;
  }[];
}

export interface RestockSuggestionItem {
  product_id: string;
  sku: string;
  name: string;
  type: string;
  category_id?: string;
  category_name: string;
  unit_id?: string;
  unit_name: string;
  unit_code: string;
  current_stock: number;
  min_stock: number;
  deficit_qty: number;
  suggested_order_qty: number;
  cost_price: number;
  estimated_subtotal: number;
  stock_status: 'empty' | 'low';
  stock_status_label: string;
  last_supplier_id?: string | null;
  last_supplier_name?: string | null;
}

export interface RestockSuggestionsResponse {
  summary: {
    total_items: number;
    out_of_stock_count: number;
    low_stock_count: number;
    total_estimated_cost: number;
  };
  rows: RestockSuggestionItem[];
}

export interface GenerateRestockPoPayload {
  supplier_id: string;
  po_date?: string;
  notes?: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    description?: string;
  }[];
}

