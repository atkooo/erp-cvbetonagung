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
  type?: 'raw_material' | 'finished_good' | 'both';
}

export interface UnitFormData {
  code: string;
  name: string;
  type?: 'raw_material' | 'finished_good' | 'both';
}

export interface ProductDto {
  id: string;
  business_unit?: string;
  sku: string;
  type: 'raw_material' | 'finished_good' | 'service';
  name: string;
  is_customizable?: boolean;
  pricing_method?: 'per_item' | 'per_dimension';
  category_id: string;
  unit_id: string;
  cost_price: string;
  selling_price: string;
  min_stock: string;
  stock_status: 'safe' | 'low' | 'out_of_stock';
  booked_stock?: string | number;
  qr_value: string | null;
  image?: string | null;
  image_url?: string | null;
  status: 'active' | 'inactive';
  discount_type?: 'percentage' | 'nominal' | null;
  discount_value?: number | null;
  category?: CategoryDto;
  unit?: UnitDto;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFormData {
  business_unit?: string;
  sku?: string;
  qr_value?: string | null;
  type?: 'raw_material' | 'finished_good' | 'service';
  name: string;
  is_customizable?: boolean;
  pricing_method?: 'per_item' | 'per_dimension';
  category_id: string;
  unit_id: string;
  cost_price: number;
  selling_price: number;
  min_stock: number;
  status?: 'active' | 'inactive';
  discount_type?: 'percentage' | 'nominal' | null;
  discount_value?: number | null;
}
