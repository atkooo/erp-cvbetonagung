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

export const pathForView = (view: ViewType): string => {
  return VIEW_TO_PATH[view] || `/${view}`;
};

export const viewFromPath = (path: string): ViewType | undefined => {
  const entry = Object.entries(VIEW_TO_PATH).find(([, p]) => p === path || path.startsWith(p + '/'));
  return entry ? (entry[0] as ViewType) : undefined;
};
