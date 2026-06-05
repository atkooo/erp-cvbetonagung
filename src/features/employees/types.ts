export interface EmployeeDto {
  id: string;
  employee_number: string;
  user_id: string | null;
  name: string;
  role_name: string;
  department: string;
  phone: string | null;
  address: string | null;
  join_date: string | null;
  employee_type: 'permanent' | 'contract' | 'daily' | 'borongan';
  daily_rate: string | number;
  piece_rate: string | number;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface CreateEmployeeDto {
  employee_number: string;
  user_id?: string | null;
  name: string;
  role_name: string;
  department: string;
  phone?: string | null;
  address?: string | null;
  join_date?: string | null;
  employee_type: 'permanent' | 'contract' | 'daily' | 'borongan';
  daily_rate?: number;
  piece_rate?: number;
  status?: 'active' | 'inactive';
}
