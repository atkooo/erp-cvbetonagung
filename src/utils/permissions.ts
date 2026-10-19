/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AuthPermission } from '../types';

const PARENT_MODULES: Record<string, string> = {
  // Purchasing
  purchase_requests: 'purchasing',
  rfqs: 'purchasing',
  purchase_orders: 'purchasing',
  goods_receipts: 'purchasing',
  purchase_returns: 'purchasing',

  // Inventory
  inventory_stocks: 'inventory',
  incoming_goods: 'inventory',
  outgoing_goods: 'inventory',
  stock_movements: 'inventory',
  berita_acara_gudang: 'inventory',
  stock_opname: 'inventory',
  warehouses: 'inventory',
  qr_products: 'inventory',
  qr_scanner: 'qr_products',

  // Sales
  pos: 'sales',
  quotations: 'sales',
  sales_orders: 'sales',
  delivery_orders: 'sales',
  sales_returns: 'sales',

  // Finance
  accounts: 'finance',
  cash_expense: 'finance',
  invoices: 'finance',
  payments: 'finance',
  accounts_receivable: 'finance',
  accounts_payable: 'finance',
  finance_reports: 'finance',

  // Production
  production_work_orders: 'production',
  bom_costing: 'production',

  // Projects
  project_budgeting: 'projects',

  // HRD
  attendance: 'employees',
  attendance_scanner: 'attendance',
  leave: 'employees',
  leave_types: 'leave',
  employee_loans: 'employees',

  // System
  audit_logs: 'reports',
  reminders: 'reports',
};

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

  // Collect valid module names for hierarchical match (exact, parents recursively, wildcard)
  const validModules = [requiredModule, '*'];
  let cur: string | undefined = requiredModule;
  while (cur && PARENT_MODULES[cur]) {
    const parent = PARENT_MODULES[cur];
    if (parent === cur || validModules.includes(parent)) {
      break;
    }
    validModules.push(parent);
    cur = parent;
  }

  // 6. Check if user has view permission for the required module
  return userPermissions.some((p: any) => {
    // Check module match: exact match, wildcard, or parent-level fallback
    const moduleMatch = validModules.includes(p.module);
    if (!moduleMatch) return false;

    // Check action match: must have 'view' permission, or wildcard / all
    const actionMatch = !p.action || p.action === 'view' || p.action === '*' || p.action === 'all';
    if (!actionMatch) return false;

    // Check access level against minimum required level
    const level = p.pivot?.access_level ?? p.accessLevel ?? p.access_level;
    if (level !== undefined && level !== null && level !== '') {
      return allowedLevels.includes(level);
    }

    return true;
  });
};
