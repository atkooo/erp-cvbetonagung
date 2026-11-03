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
      'changelog',
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

  // Support module alias for unified incoming-goods / goods-receipts
  const requiredModules =
    requiredModule === 'incoming_goods' || itemView === 'incoming-goods'
      ? ['incoming_goods', 'goods_receipts']
      : [requiredModule];

  // 6. Find all permissions for the required module (exact match or wildcard '*')
  const modulePerms = userPermissions.filter(
    (p: any) => requiredModules.includes(p.module) || p.module === '*'
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
  // An action is only valid if its access_level satisfies backend requirements:
  // 'view' -> ['read', 'edit', 'full']
  // 'create'/'update' -> ['edit', 'full']
  // 'delete'/'approve' -> ['full']
  const validActions = new Set(
    modulePerms
      .filter((p: any) => {
        const lvl = p.pivot?.access_level ?? p.accessLevel ?? p.access_level;
        if (!lvl || lvl === 'none') return false;
        if (p.action === 'view') return ['read', 'edit', 'full'].includes(lvl);
        if (p.action === 'create' || p.action === 'update') return ['edit', 'full'].includes(lvl);
        if (p.action === 'delete' || p.action === 'approve') return lvl === 'full';
        return true;
      })
      .map((p: any) => p.action)
  );

  if (minAccessLevel === 'full') {
    // Requires valid delete or approve action
    return validActions.has('delete') || validActions.has('approve');
  }

  if (minAccessLevel === 'edit') {
    // Requires valid create, update, delete, or approve action
    return validActions.has('create') || validActions.has('update') || validActions.has('delete') || validActions.has('approve');
  }

  // minAccessLevel === 'read': having any valid action is sufficient
  return validActions.size > 0;
};
