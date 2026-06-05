/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PermissionDto {
  id: string;
  module: string;
  action: string;
  label: string;
  created_at?: string;
  updated_at?: string;
  pivot?: {
    role_id: string;
    permission_id: string;
    access_level: 'none' | 'read' | 'edit' | 'full';
  };
}

export interface RoleDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
  permissions?: PermissionDto[];
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  label: string;
  accessLevel: 'none' | 'read' | 'edit' | 'full';
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  permissions: Permission[];
}
