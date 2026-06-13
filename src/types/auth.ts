/** Domain types: Authentication & Authorization */

export interface AuthPermission {
  id: string;
  module: string;
  action: string;
  pivot?: {
    access_level: string;
  };
}

export interface AuthRole {
  id: string;
  code: string;
  name: string;
  permissions?: AuthPermission[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  status: string;
  role?: AuthRole | null;
  employee_id?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}
