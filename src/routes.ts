import type { ViewType } from './types';

// ponytail: single source of truth — semua view punya path eksplisit, terstruktur per modul
export const VIEW_TO_PATH: Record<ViewType, string> = {
  login:                    '/login',
  dashboard:                '/dashboard',
  'employee-dashboard':     '/employee-dashboard',

  // Master Data
  customers:                '/master/customer',
  suppliers:                '/master/supplier',
  products:                 '/master/product',
  categories:               '/master/categories',
  units:                    '/master/units',
  warehouses:               '/master/warehouses',
  discounts:                '/master/discounts',

  // Sales
  pos:                      '/sales/pos',
  quotations:               '/sales/quotation',
  'sales-orders':           '/sales/order',
  'delivery-orders':        '/sales/delivery-orders',
  returns:                  '/sales/returns',

  // Finance
  invoices:                 '/finance/billing',
  payments:                 '/finance/cashier',
  'accounts-receivable':    '/finance/account-receivable',
  'accounts-payable':       '/finance/account-payable',
  'cash-expense':           '/finance/cash-bank',
  accounts:                 '/finance/accounts',
  'finance-reports':        '/finance/reports',

  // Purchasing
  'purchase-requests':      '/purchasing/requests',
  rfq:                      '/purchasing/rfq',
  'purchase-orders':        '/purchasing/po',
  'goods-receipts':         '/purchasing/receiving',
  'purchase-returns':       '/purchasing/returns',

  // Inventory
  'stock-management':       '/inventory/stock',
  'incoming-goods':         '/inventory/stock-in',
  'outgoing-goods':         '/inventory/stock-out',
  'stock-movement-history': '/inventory/history',
  'berita-acara-gudang':    '/inventory/bag',
  'stock-opname':           '/inventory/opname',
  'multi-warehouse':        '/inventory/warehouses',
  'qr-products':            '/inventory/qr',
  'scan-qr-product':        '/inventory/scan',
  'scanned-product-detail': '/inventory/scan/detail',

  // Production & Projects
  'production-work-orders': '/production/work-orders',
  'bom-costing':            '/production/bom',
  projects:                 '/projects',
  'project-detail':         '/projects/detail',
  'project-budgeting':      '/projects/budgeting',

  // HRD
  employees:                '/hrd/employees',
  'attendance-dashboard':   '/hrd/attendance',
  'attendance-scanner':     '/hrd/attendance/scan',
  'leave-management':       '/hrd/leave',
  'payroll-management':     '/hrd/payroll',
  'employee-loans':         '/hrd/loans',

  // Reports
  'report-center':          '/reports',
  'inventory-reports':      '/reports/inventory',

  // Support & System
  'approval-workflows':     '/system/approvals',
  'audit-logs':             '/system/audit',
  reminders:                '/system/reminders',
  'document-exports':       '/system/exports',
  'role-permissions':       '/system/roles',
  users:                    '/system/users',
  settings:                 '/settings',
  profile:                  '/profile',
};

export const pathForView = (view: ViewType): string => VIEW_TO_PATH[view] ?? `/${view}`;

// Reverse lookup: path → view. Sorted by length desc so longer paths match first.
const PATH_ENTRIES = Object.entries(VIEW_TO_PATH).sort(([, a], [, b]) => b.length - a.length) as [ViewType, string][];

export const viewFromPath = (path: string): ViewType | undefined => {
  const match = PATH_ENTRIES.find(([, p]) => path === p || path.startsWith(p + '/'));
  return match?.[0];
};
