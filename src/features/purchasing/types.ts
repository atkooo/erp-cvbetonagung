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
  purchase_number: string;
  supplier_id: string;
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
  items?: PurchaseOrderItemDto[];
}

export interface CreatePurchaseOrderDto {
  supplier_id: string;
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

export interface ReceivePurchaseOrderDto {
  to_location_id: string;
  handled_by?: string | null;
  movement_at: string;
  notes?: string | null;
  items?: { id: string; quantity: number }[];
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
  qc_status: string;
  created_at: string;
  customer?: { id: string; name: string };
  supplier?: { id: string; name: string };
  sales_order?: { id: string; order_number: string };
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
  qcStatus: string;
  createdAt: string;
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
