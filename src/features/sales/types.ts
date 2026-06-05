export interface QuotationItemDto {
  id: string;
  quotation_id: string;
  product_id: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
}

export interface QuotationDto {
  id: string;
  quotation_number: string;
  customer_id: string;
  quotation_date: string;
  valid_until: string;
  status: string; // Draft, Terkirim, Disetujui, Ditolak
  notes: string | null;
  total: number;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
  };
  items?: QuotationItemDto[];
}

export interface SalesOrderItemDto {
  id: string;
  sales_order_id: string;
  product_id: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
}

export interface SalesOrderDto {
  id: string;
  quotation_id: string | null;
  customer_id: string;
  order_number: string;
  order_date: string;
  status: string; // Draft, Diproses, Selesai, Dibatalkan
  notes: string | null;
  total: number;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
  };
  items?: SalesOrderItemDto[];
}

export interface CreateQuotationDto {
  customer_id: string;
  quotation_date: string;
  valid_until: string;
  notes?: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    description?: string;
  }[];
}

export interface CreateSalesOrderDto {
  customer_id: string;
  quotation_id?: string;
  order_date: string;
  notes?: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    description?: string;
  }[];
}

export interface DeliveryOrderItemDto {
  id: string;
  delivery_order_id: string;
  sales_order_item_id: string | null;
  product_id: string;
  quantity: number;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
}

export interface DeliveryOrderDto {
  id: string;
  delivery_number: string;
  sales_order_id: string;
  customer_id: string;
  delivery_date: string | null;
  received_at: string | null;
  receiver_name: string | null;
  status: 'ready_to_load' | 'shipped' | 'received' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
  sales_order?: {
    id: string;
    order_number: string;
  };
  customer?: {
    id: string;
    name: string;
  };
  items?: DeliveryOrderItemDto[];
}

