export interface ProductionWorkOrderItemDto {
  id: string;
  work_order_id: string;
  product_id: string;
  quantity: number;
  notes: string | null;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
}

export interface ProductionWorkLogDto {
  id: string;
  work_order_id: string;
  employee_id: string | null;
  work_date: string;
  stage: string;
  made_qty: number;
  reject_qty: number;
  ok_qty: number;
  piece_rate: number;
  notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  employee?: {
    id: string;
    name: string;
  };
}

export interface ProductionWorkOrderDto {
  id: string;
  work_order_number: string;
  product_id: string;
  sales_order_id: string | null;
  project_id: string | null;
  source_label: string | null;
  stage: string;
  target_qty: number;
  completed_qty: number;
  progress: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
  sales_order?: {
    id: string;
    order_number: string;
  };
  project?: {
    id: string;
    name: string;
  };
  items?: ProductionWorkOrderItemDto[];
  logs?: ProductionWorkLogDto[];
}

export interface BomItemDto {
  id: string;
  bom_id: string;
  component_product_id: string | null;
  component_name: string | null;
  quantity: number;
  unit_id: string | null;
  unit_cost: number;
  subtotal: number;
  component_product?: {
    id: string;
    sku: string;
    name: string;
  };
  unit?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface BomDto {
  id: string;
  product_id: string;
  version: string;
  effective_from: string | null;
  status: 'active' | 'inactive';
  total_cost: number;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
  items?: BomItemDto[];
}

export interface CreateWorkOrderDto {
  work_order_number: string;
  product_id: string;
  sales_order_id?: string;
  project_id?: string;
  source_label?: string;
  stage: string;
  target_qty: number;
  due_date?: string;
}

export interface CreateWorkLogDto {
  work_order_id: string;
  employee_id: string;
  work_date: string;
  stage: string;
  made_qty: number;
  reject_qty: number;
  ok_qty: number;
  notes?: string;
}

export interface CreateBomDto {
  product_id: string;
  version: string;
  effective_from?: string;
  status: 'active' | 'inactive';
  items: {
    component_product_id?: string;
    component_name?: string;
    quantity: number;
    unit_id?: string;
    unit_cost: number;
    subtotal: number;
  }[];
}
