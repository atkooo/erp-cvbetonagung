/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from '../../services/api';
import { RoleDto, PermissionDto, Role, Permission } from './types';
import { mapRoleFromDto, mapPermissionFromDto } from './mappers';

export const identityApi = {
  async getRoles(): Promise<Role[]> {
    const response = await apiClient.get<{ data: RoleDto[] }>('/identity/roles?include=permissions&per_page=100');
    return response.data.map(mapRoleFromDto);
  },

  async getPermissions(): Promise<Permission[]> {
    const response = await apiClient.get<{ data: PermissionDto[] }>('/identity/permissions?per_page=100');
    return response.data.map(mapPermissionFromDto);
  },

  async syncRolePermission(data: {
    role_id: string;
    permission_id: string;
    access_level: 'none' | 'read' | 'edit' | 'full';
  }): Promise<void> {
    await apiClient.post('/identity/role-permissions', data);
  },

  async deleteRolePermission(roleId: string, permissionId: string): Promise<void> {
    await apiClient.delete(`/identity/role-permissions/${roleId}/${permissionId}`);
  }
};
