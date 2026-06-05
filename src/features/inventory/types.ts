import { ProductDto } from '../products/types';

export interface LocationDto {
  id: string;
  name: string;
  code: string;
}

export interface ProductStockDto {
  id: string;
  product_id: string;
  location_id: string;
  quantity: string | number;
  product?: ProductDto;
  location?: LocationDto;
}

export interface StockMovementDto {
  id: string;
  product_id: string;
  from_location_id: string | null;
  to_location_id: string | null;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: string | number;
  reference_type: string | null;
  reference_number: string | null;
  movement_at: string;
  notes: string | null;
  handled_by: string | null;
  product?: ProductDto;
  handledBy?: { name: string };
  created_at?: string;
}

export interface MovementFormData {
  product_id: string;
  quantity: number;
  location_id: string;
  reference_type?: string;
  reference_number?: string;
  notes?: string;
}
