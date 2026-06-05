export interface SupplierDto {
  id: string;
  code: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface SupplierFormData {
  code?: string;
  name: string;
  contact_name?: string;
  phone?: string;
  city?: string;
  address?: string;
  status?: 'active' | 'inactive';
}
