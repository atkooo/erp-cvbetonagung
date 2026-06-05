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
  received_date: string;
  notes?: string;
  items: {
    id: string; // PurchaseOrderItem ID
    received_quantity: number;
  }[];
}
