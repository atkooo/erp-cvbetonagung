/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AuthPermission } from '../types';

/**
 * Checks whether an authenticated user has permission to view a specific module/menu item.
 * Used for dynamic sidebar filtering and access control.
 */
export const hasViewAccess = (
  userRoleCode: string,
  userPermissions: AuthPermission[] | undefined,
  requiredModule?: string,
  itemView?: string,
  minAccessLevel: 'read' | 'edit' | 'full' = 'read'
): boolean => {
  // 1. Superadmin has full access to all ERP modules (except employee self-service portal)
  if (userRoleCode === 'admin') {
    return itemView !== 'employee-dashboard';
  }

  // 2. Employee role only has access to self-service views
  if (userRoleCode === 'employee') {
    if (itemView === 'dashboard') return false;
    if (itemView === 'employee-dashboard') return true;
    const employeeAllowedViews = [
      'attendance-scanner',
      'leave-management',
      'payroll-management',
      'employee-loans',
    ];
    return employeeAllowedViews.includes(itemView || '');
  }

  // 3. Employee self-service dashboard is hidden for non-employees
  if (itemView === 'employee-dashboard') {
    return false;
  }

  // 4. If no specific module is required, allow by default
  if (!requiredModule) {
    return true;
  }

  // 5. If no permissions loaded, deny access
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  const allowedLevels = minAccessLevel === 'full'
    ? ['full']
    : minAccessLevel === 'edit'
      ? ['edit', 'full']
      : ['read', 'edit', 'full'];

  // 6. Find all permissions for the required module (exact match or wildcard '*')
  const modulePerms = userPermissions.filter(
    (p: any) => p.module === requiredModule || p.module === '*'
  );

  if (modulePerms.length === 0) {
    return false;
  }

  // If user has wildcard module permission ('*'), allow
  if (modulePerms.some((p: any) => p.module === '*')) {
    return true;
  }

  // Check if user has wildcard action ('*' or 'all' or missing action)
  const wildcardPerm = modulePerms.find((p: any) => !p.action || p.action === '*' || p.action === 'all');
  if (wildcardPerm) {
    const coarseLevel = wildcardPerm.pivot?.access_level ?? (wildcardPerm as any).accessLevel ?? (wildcardPerm as any).access_level;
    if (coarseLevel !== undefined && coarseLevel !== null && coarseLevel !== '') {
      return allowedLevels.includes(coarseLevel);
    }
    return true;
  }

  // For granular permissions (action: 'view', 'create', 'update', 'delete', 'approve'):
  const actions = new Set(modulePerms.map((p: any) => p.action));

  if (minAccessLevel === 'full') {
    // Requires delete or approve action
    return actions.has('delete') || actions.has('approve');
  }

  if (minAccessLevel === 'edit') {
    // Requires create, update, delete, or approve action (having ONLY 'view' is read-only)
    return actions.has('create') || actions.has('update') || actions.has('delete') || actions.has('approve');
  }

  // minAccessLevel === 'read': having any action (including 'view') is sufficient
  return actions.has('view') || actions.has('create') || actions.has('update') || actions.has('delete') || actions.has('approve');
};
