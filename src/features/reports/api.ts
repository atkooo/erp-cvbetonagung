import { apiClient } from '../../services/api';

export interface ReportFilters {
  period?: 'daily' | 'monthly' | 'yearly';
  date_from?: string;
  date_to?: string;
}

// ── Daily Sales ────────────────────────────────────────────
export interface DailySalesSummary {
  total_invoices: number;
  total_revenue: number;
  total_paid: number;
  total_outstanding: number;
}

export interface DailySalesRow {
  period_label: string;
  invoice_count: number;
  gross_revenue: number;
  total_paid: number;
  outstanding: number;
}

export interface DailySalesData {
  summary: DailySalesSummary;
  rows: DailySalesRow[];
}

// ── Gross Profit ───────────────────────────────────────────
export interface GrossProfitSummary {
  revenue: number;
  cogs: number;
  gross_profit: number;
  margin_pct: number;
}

export interface GrossProfitCategory {
  category: string;
  order_count: number;
  total_qty: number;
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  margin_pct: number;
}

export interface GrossProfitData {
  summary: GrossProfitSummary;
  by_category: GrossProfitCategory[];
}

// ── AR Aging ───────────────────────────────────────────────
export interface ArBuckets {
  current: number;
  '1_30': number;
  '31_60': number;
  '61_90': number;
  over_90: number;
}

export interface ArInvoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  invoice_date: string;
  due_date: string | null;
  total: number;
  paid_amount: number;
  outstanding: number;
  days_overdue: number;
}

export interface ArAgingData {
  as_of_date: string;
  buckets: ArBuckets;
  invoices: ArInvoice[];
}

// ── Top Products ───────────────────────────────────────────
export interface TopProductRow {
  rank: number;
  sku: string;
  product_name: string;
  category: string;
  unit: string;
  order_count: number;
  total_qty: number;
  total_revenue: number;
  contribution_pct: number;
}

export interface TopProductsData {
  grand_total: number;
  rows: TopProductRow[];
}

// ── Product Master Stock ────────────────────────────────────
export interface ProductMasterStockItem {
  id: string;
  sku: string;
  name: string;
  type: string;
  category_id?: string | null;
  category_name: string;
  unit_id?: string | null;
  unit_name: string;
  unit_code: string;
  cost_price: number;
  selling_price: number;
  margin_amount: number;
  margin_percentage: number;
  min_stock: number;
  total_stock: number;
  stock_value_cogs: number;
  stock_value_selling: number;
  potential_profit: number;
  stock_status: 'aman' | 'menipis' | 'habis';
  stock_status_label: string;
  qr_value?: string | null;
  image_url?: string | null;
  status: string;
}

export interface ProductMasterStockSummary {
  total_products: number;
  total_stock_qty: number;
  total_cogs_value: number;
  total_selling_value: number;
  total_potential_profit: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

export interface ProductMasterStockData {
  summary: ProductMasterStockSummary;
  rows: ProductMasterStockItem[];
}

export interface ProductMasterStockFilters {
  category_id?: string;
  stock_status?: string;
  search?: string;
  type?: string;
}

// ── Helpers ────────────────────────────────────────────────
function buildUrl(path: string, params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  }
  const query = qs.toString();
  return query ? `${path}?${query}` : path;
}

// ── API ────────────────────────────────────────────────────
export const reportsApi = {
  async getDailySales(filters: ReportFilters = {}): Promise<DailySalesData> {
    const url = buildUrl('/reports/exec/daily-sales', filters as Record<string, string>);
    const res = await apiClient.get<{ data: DailySalesData }>(url);
    return res.data;
  },

  async getGrossProfit(filters: ReportFilters = {}): Promise<GrossProfitData> {
    const url = buildUrl('/reports/exec/gross-profit', filters as Record<string, string>);
    const res = await apiClient.get<{ data: GrossProfitData }>(url);
    return res.data;
  },

  async getArAging(asOfDate?: string): Promise<ArAgingData> {
    const url = buildUrl('/reports/exec/ar-aging', asOfDate ? { as_of_date: asOfDate } : {});
    const res = await apiClient.get<{ data: ArAgingData }>(url);
    return res.data;
  },

  async getTopProducts(filters: ReportFilters & { limit?: number } = {}): Promise<TopProductsData> {
    const url = buildUrl('/reports/exec/top-products', filters as Record<string, string | number>);
    const res = await apiClient.get<{ data: TopProductsData }>(url);
    return res.data;
  },

  async getProductMasterStock(filters: ProductMasterStockFilters = {}): Promise<ProductMasterStockData> {
    const url = buildUrl('/reports/product-master-stock', filters as Record<string, string>);
    const res = await apiClient.get<{ data: ProductMasterStockData }>(url);
    return res.data;
  },
};
