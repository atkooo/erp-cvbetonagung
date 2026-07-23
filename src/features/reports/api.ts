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

// ── Stock Mutation ──────────────────────────────────────────
export interface StockMutationItem {
  id: string;
  movement_at: string | null;
  movement_date: string;
  type: string;
  type_label: string;
  reference_number: string;
  reference_type: string;
  product_id: string;
  sku: string;
  product_name: string;
  category_name: string;
  unit_name: string;
  unit_code: string;
  quantity: number;
  from_location: string;
  to_location: string;
  handled_by_name: string;
  notes: string;
}

export interface StockMutationSummary {
  total_movements: number;
  total_qty_in: number;
  total_qty_out: number;
  total_qty_transfer: number;
  total_qty_adjustment: number;
}

export interface StockMutationData {
  summary: StockMutationSummary;
  rows: StockMutationItem[];
}

export interface StockMutationFilters {
  date_from?: string;
  date_to?: string;
  type?: string;
  product_id?: string;
  search?: string;
}

// ── Low Stock Alert ────────────────────────────────────────
export interface LowStockItem {
  id: string;
  sku: string;
  name: string;
  type: string;
  category_name: string;
  unit_name: string;
  unit_code: string;
  total_stock: number;
  min_stock: number;
  deficit_qty: number;
  suggested_reorder_qty: number;
  cost_price: number;
  estimated_reorder_cost: number;
  stock_status: 'aman' | 'menipis' | 'habis';
  stock_status_label: string;
}

export interface LowStockSummary {
  total_low_stock_items: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_estimated_reorder_cost: number;
}

export interface LowStockData {
  summary: LowStockSummary;
  rows: LowStockItem[];
}

export interface LowStockFilters {
  category_id?: string;
  stock_status?: string;
  search?: string;
}

// ── Inventory Valuation ────────────────────────────────────
export interface ValuationWarehouse {
  warehouse_id: string;
  warehouse_name: string;
  total_items: number;
  total_stock_qty: number;
  total_cogs_value: number;
  total_selling_value: number;
  potential_profit: number;
}

export interface ValuationCategory {
  category_id: string;
  category_name: string;
  total_items: number;
  total_stock_qty: number;
  total_cogs_value: number;
  total_selling_value: number;
  potential_profit: number;
}

export interface ValuationSummary {
  total_warehouses: number;
  total_categories: number;
  grand_total_qty: number;
  grand_total_cogs_value: number;
  grand_total_selling_value: number;
  grand_potential_profit: number;
}

export interface InventoryValuationData {
  summary: ValuationSummary;
  by_warehouse: ValuationWarehouse[];
  by_category: ValuationCategory[];
}

export interface InventoryValuationFilters {
  warehouse_id?: string;
  category_id?: string;
}

// ── Dead Stock ─────────────────────────────────────────────
export interface DeadStockItem {
  id: string;
  sku: string;
  name: string;
  type: string;
  category_name: string;
  unit_name: string;
  unit_code: string;
  total_stock: number;
  cost_price: number;
  selling_price: number;
  tied_cogs_value: number;
  tied_selling_value: number;
  last_active_date: string;
  days_idle: number;
  risk_level: string;
}

export interface DeadStockSummary {
  total_dead_stock_items: number;
  total_idle_qty: number;
  total_tied_cogs_value: number;
  total_tied_selling_value: number;
  threshold_days: number;
}

export interface DeadStockData {
  summary: DeadStockSummary;
  rows: DeadStockItem[];
}

export interface DeadStockFilters {
  days?: number;
  category_id?: string;
  search?: string;
}

// ── Supplier Purchases ──────────────────────────────────────
export interface SupplierPurchaseRow {
  supplier_id: string;
  supplier_code: string;
  supplier_name: string;
  contact_name: string;
  phone: string;
  city: string;
  po_count: number;
  total_purchase_amount: number;
  total_paid_amount: number;
  total_outstanding_ap: number;
  avg_transaction_value: number;
}

export interface SupplierPurchasesSummary {
  total_suppliers: number;
  total_po_count: number;
  total_purchase_amount: number;
  total_paid_amount: number;
  total_outstanding_ap: number;
}

export interface SupplierPurchasesData {
  summary: SupplierPurchasesSummary;
  rows: SupplierPurchaseRow[];
}

export interface SupplierPurchasesFilters {
  date_from?: string;
  date_to?: string;
  supplier_id?: string;
  search?: string;
}

// ── AP Aging ───────────────────────────────────────────────
export interface ApBuckets {
  current: number;
  '1_30': number;
  '31_60': number;
  '61_90': number;
  over_90: number;
}

export interface ApPayableRow {
  id: string;
  payable_number: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  supplier_code: string;
  created_at: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  outstanding: number;
  days_overdue: number;
  bucket_key: string;
  bucket_label: string;
  status: string;
}

export interface ApAgingSummary {
  total_open_payables: number;
  total_ap_amount: number;
  total_paid_amount: number;
  total_outstanding_ap: number;
}

export interface ApAgingData {
  as_of_date: string;
  buckets: ApBuckets;
  summary: ApAgingSummary;
  payables: ApPayableRow[];
}

export interface ApAgingFilters {
  as_of_date?: string;
  supplier_id?: string;
  search?: string;
}

// ── Purchase Price Analysis ────────────────────────────────
export interface PriceAnalysisRow {
  id: string;
  sku: string;
  name: string;
  category_name: string;
  unit_name: string;
  unit_code: string;
  master_cost_price: number;
  po_count: number;
  latest_purchase_price: number;
  min_purchase_price: number;
  max_purchase_price: number;
  avg_purchase_price: number;
  latest_supplier_name: string;
  price_variance_pct: number;
  price_trend: string;
}

export interface PriceAnalysisSummary {
  total_analyzed_products: number;
  total_po_items: number;
}

export interface PriceAnalysisData {
  summary: PriceAnalysisSummary;
  rows: PriceAnalysisRow[];
}

export interface PriceAnalysisFilters {
  date_from?: string;
  date_to?: string;
  product_id?: string;
  search?: string;
}

// ── Cashflow ───────────────────────────────────────────────
export interface CashflowRow {
  id: string;
  transaction_number: string;
  transaction_date: string;
  account_name: string;
  type: string;
  type_label: string;
  category: string;
  description: string;
  debit: number;
  credit: number;
  running_balance: number;
  recorded_by: string;
}

export interface CashflowSummary {
  opening_balance: number;
  total_cash_in: number;
  total_cash_out: number;
  net_cash_flow: number;
  ending_balance: number;
}

export interface CashflowData {
  summary: CashflowSummary;
  rows: CashflowRow[];
}

export interface CashflowFilters {
  date_from?: string;
  date_to?: string;
  account_id?: string;
  type?: string;
  search?: string;
}

// ── Expenses ───────────────────────────────────────────────
export interface ExpenseCategorySummary {
  category: string;
  transaction_count: number;
  total_amount: number;
  percentage: number;
}

export interface ExpenseRow {
  id: string;
  transaction_number: string;
  transaction_date: string;
  account_name: string;
  category: string;
  description: string;
  amount: number;
  recorded_by: string;
}

export interface ExpensesSummary {
  total_expense_transactions: number;
  total_expenses_amount: number;
  top_expense_category: string;
}

export interface ExpensesData {
  summary: ExpensesSummary;
  by_category: ExpenseCategorySummary[];
  rows: ExpenseRow[];
}

export interface ExpensesFilters {
  date_from?: string;
  date_to?: string;
  category?: string;
  search?: string;
}

// ── Profit & Loss ──────────────────────────────────────────
export interface ProfitLossSummary {
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  gross_margin_pct: number;
  total_operating_expenses: number;
  net_profit: number;
  net_margin_pct: number;
}

export interface ProfitLossBreakdownItem {
  description: string;
  amount: number;
}

export interface ProfitLossExpenseCategory {
  category: string;
  amount: number;
  count: number;
}

export interface ProfitLossData {
  period: {
    date_from?: string | null;
    date_to?: string | null;
  };
  summary: ProfitLossSummary;
  breakdown: {
    revenue_items: ProfitLossBreakdownItem[];
    cogs_items: ProfitLossBreakdownItem[];
    expense_categories: ProfitLossExpenseCategory[];
  };
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

  async getStockMutation(filters: StockMutationFilters = {}): Promise<StockMutationData> {
    const url = buildUrl('/reports/inventory/mutation', filters as Record<string, string>);
    const res = await apiClient.get<{ data: StockMutationData }>(url);
    return res.data;
  },

  async getLowStock(filters: LowStockFilters = {}): Promise<LowStockData> {
    const url = buildUrl('/reports/inventory/low-stock', filters as Record<string, string>);
    const res = await apiClient.get<{ data: LowStockData }>(url);
    return res.data;
  },

  async getInventoryValuation(filters: InventoryValuationFilters = {}): Promise<InventoryValuationData> {
    const url = buildUrl('/reports/inventory/valuation', filters as Record<string, string>);
    const res = await apiClient.get<{ data: InventoryValuationData }>(url);
    return res.data;
  },

  async getDeadStock(filters: DeadStockFilters = {}): Promise<DeadStockData> {
    const url = buildUrl('/reports/inventory/dead-stock', filters as Record<string, string | number>);
    const res = await apiClient.get<{ data: DeadStockData }>(url);
    return res.data;
  },

  async getSupplierPurchases(filters: SupplierPurchasesFilters = {}): Promise<SupplierPurchasesData> {
    const url = buildUrl('/reports/purchasing/supplier', filters as Record<string, string>);
    const res = await apiClient.get<{ data: SupplierPurchasesData }>(url);
    return res.data;
  },

  async getApAgingReport(filters: ApAgingFilters = {}): Promise<ApAgingData> {
    const url = buildUrl('/reports/purchasing/ap-aging', filters as Record<string, string>);
    const res = await apiClient.get<{ data: ApAgingData }>(url);
    return res.data;
  },

  async getPurchasePriceAnalysis(filters: PriceAnalysisFilters = {}): Promise<PriceAnalysisData> {
    const url = buildUrl('/reports/purchasing/price-analysis', filters as Record<string, string>);
    const res = await apiClient.get<{ data: PriceAnalysisData }>(url);
    return res.data;
  },

  async getCashflow(filters: CashflowFilters = {}): Promise<CashflowData> {
    const url = buildUrl('/reports/finance/cashflow', filters as Record<string, string>);
    const res = await apiClient.get<{ data: CashflowData }>(url);
    return res.data;
  },

  async getExpenses(filters: ExpensesFilters = {}): Promise<ExpensesData> {
    const url = buildUrl('/reports/finance/expenses', filters as Record<string, string>);
    const res = await apiClient.get<{ data: ExpensesData }>(url);
    return res.data;
  },

  async getProfitLoss(filters: ReportFilters = {}): Promise<ProfitLossData> {
    const url = buildUrl('/reports/finance/profit-loss', filters as Record<string, string>);
    const res = await apiClient.get<{ data: ProfitLossData }>(url);
    return res.data;
  },
};
