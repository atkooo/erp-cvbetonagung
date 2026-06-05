/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoleDto, PermissionDto, Role, Permission } from './types';

export const mapPermissionFromDto = (dto: PermissionDto): Permission => ({
  id: dto.id,
  module: dto.module,
  action: dto.action,
  label: dto.label,
  accessLevel: dto.pivot?.access_level || 'none',
});

export const mapRoleFromDto = (dto: RoleDto): Role => ({
  id: dto.id,
  code: dto.code,
  name: dto.name,
  description: dto.description || '',
  permissions: dto.permissions ? dto.permissions.map(mapPermissionFromDto) : [],
});
