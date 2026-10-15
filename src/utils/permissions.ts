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
  itemView?: string
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

  // 6. Check if user has view permission for the required module
  return userPermissions.some((p: any) => {
    // Check module match (exact or wildcard)
    const moduleMatch = p.module === requiredModule || p.module === '*';
    if (!moduleMatch) return false;

    // Check action match: must have 'view' permission, or wildcard / all
    const actionMatch = !p.action || p.action === 'view' || p.action === '*' || p.action === 'all';
    if (!actionMatch) return false;

    // Check access level: cannot be 'none'
    const level = p.pivot?.access_level ?? p.accessLevel ?? p.access_level;
    if (level !== undefined && level !== null && level !== '') {
      return ['read', 'edit', 'full'].includes(level);
    }

    return true;
  });
};
