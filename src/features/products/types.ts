export interface CategoryDto {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface UnitDto {
  id: string;
  code: string;
  name: string;
}

export interface UnitFormData {
  code: string;
  name: string;
}

export interface ProductDto {
  id: string;
  sku: string;
  type: 'raw_material' | 'finished_good' | 'service';
  name: string;
  category_id: string;
  unit_id: string;
  cost_price: string;
  selling_price: string;
  min_stock: string;
  stock_status: 'safe' | 'low' | 'out_of_stock';
  qr_value: string | null;
  status: 'active' | 'inactive';
  category?: CategoryDto;
  unit?: UnitDto;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFormData {
  sku?: string;
  type?: 'raw_material' | 'finished_good' | 'service';
  name: string;
  category_id: string;
  unit_id: string;
  cost_price: number;
  selling_price: number;
  min_stock: number;
  status?: 'active' | 'inactive';
}
