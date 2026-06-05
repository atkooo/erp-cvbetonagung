export interface CustomerDto {
  id: string;
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  address?: string | null;
  status?: 'active' | 'inactive';
}

export interface CreateCustomerPayload {
  code: string;
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  status: 'active' | 'inactive';
}
