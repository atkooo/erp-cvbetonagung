import type { ViewType } from './types';

export const DEFAULT_AUTHENTICATED_VIEW: ViewType = 'dashboard';

export const VIEW_TO_PATH: Partial<Record<ViewType, string>> = {
  dashboard: '/dashboard',
  customers: '/master/customer',
  suppliers: '/master/supplier',
  products: '/master/product',
  quotations: '/sales/quotation',
  'sales-orders': '/sales/order',
  invoices: '/finance/billing',
  'purchase-orders': '/purchasing/po',
  'goods-receipts': '/purchasing/receiving',
  'stock-management': '/inventory/stock',
  'incoming-goods': '/inventory/stock-in',
  'outgoing-goods': '/inventory/stock-out',
  payments: '/finance/cashier',
  'receivables-payables': '/finance/account-payable',
  'cash-expense': '/finance/cash-bank',
  'finance-reports': '/reports',
};

export const PATH_TO_VIEW: Record<string, ViewType> = {
  '/': DEFAULT_AUTHENTICATED_VIEW,
  '/dashboard': 'dashboard',
  '/employee-dashboard': 'employee-dashboard',
  '/master/customer': 'customers',
  '/master/supplier': 'suppliers',
  '/master/product': 'products',
  '/customers': 'customers',
  '/suppliers': 'suppliers',
  '/products': 'products',
  '/categories': 'categories',
  '/units': 'units',
  '/warehouses': 'warehouses',
  '/sales/quotation': 'quotations',
  '/sales/order': 'sales-orders',
  '/sales/invoice': 'invoices',
  '/quotations': 'quotations',
  '/sales-orders': 'sales-orders',
  '/delivery-orders': 'delivery-orders',
  '/returns': 'returns',
  '/purchasing/po': 'purchase-orders',
  '/purchasing/receiving': 'goods-receipts',
  '/purchase-requests': 'purchase-requests',
  '/rfq': 'rfq',
  '/purchase-orders': 'purchase-orders',
  '/goods-receipts': 'goods-receipts',
  '/purchase-returns': 'purchase-returns',
  '/inventory/stock': 'stock-management',
  '/inventory/stock-in': 'incoming-goods',
  '/inventory/stock-out': 'outgoing-goods',
  '/stock-management': 'stock-management',
  '/incoming-goods': 'incoming-goods',
  '/outgoing-goods': 'outgoing-goods',
  '/stock-movement-history': 'stock-movement-history',
  '/stock-opname': 'stock-opname',
  '/multi-warehouse': 'multi-warehouse',
  '/finance/billing': 'invoices',
  '/finance/cashier': 'payments',
  '/finance/account-payable': 'receivables-payables',
  '/finance/cash-bank': 'cash-expense',
  '/invoices': 'invoices',
  '/payments': 'payments',
  '/receivables-payables': 'receivables-payables',
  '/cash-expense': 'cash-expense',
  '/reports': 'finance-reports',
  '/finance-reports': 'finance-reports',
  '/inventory-reports': 'inventory-reports',
  '/employees': 'employees',
  '/attendance-dashboard': 'attendance-dashboard',
  '/leave-management': 'leave-management',
  '/attendance-scanner': 'attendance-scanner',
  '/payroll-management': 'payroll-management',
  '/employee-loans': 'employee-loans',
  '/production-work-orders': 'production-work-orders',
  '/bom-costing': 'bom-costing',
  '/projects': 'projects',
  '/project-detail': 'project-detail',
  '/project-budgeting': 'project-budgeting',
  '/role-permissions': 'role-permissions',
  '/approval-workflows': 'approval-workflows',
  '/audit-logs': 'audit-logs',
  '/reminders': 'reminders',
  '/document-exports': 'document-exports',
  '/qr-products': 'qr-products',
  '/scan-qr-product': 'scan-qr-product',
  '/scanned-product-detail': 'scanned-product-detail',
  '/settings': 'settings',
};

export const normalizePath = (path: string) => {
  const normalized = path.replace(/\/+$/, '');
  return normalized || '/';
};

export const viewFromPath = (path: string): ViewType | null => {
  return PATH_TO_VIEW[normalizePath(path)] || null;
};

export const pathForView = (view: ViewType): string => {
  return VIEW_TO_PATH[view] || `/${view}`;
};
