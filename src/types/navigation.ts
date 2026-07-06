/**
 * Domain types: Navigation (ViewType)
 *
 * Definisi semua view yang valid di aplikasi SPA.
 * Digunakan oleh App.tsx, Sidebar, dan routing system.
 */
export type ViewType =
  | 'login'
  | 'dashboard'
  | 'employee-dashboard'
  // Master Data
  | 'customers'
  | 'employees'
  | 'suppliers'
  | 'products'
  | 'categories'
  | 'units'
  | 'warehouses'
  | 'discounts'
  // Inventory
  | 'stock-management'
  | 'incoming-goods'
  | 'outgoing-goods'
  | 'stock-movement-history'
  | 'goods-receipts'
  | 'berita-acara-gudang'
  | 'stock-opname'
  | 'multi-warehouse'
  | 'qr-products'
  | 'scan-qr-product'
  | 'scanned-product-detail'
  // Sales
  | 'pos'
  | 'quotations'
  | 'sales-orders'
  | 'delivery-orders'
  | 'invoices'
  | 'payments'
  | 'accounts-receivable'
  | 'accounts-payable'
  | 'cash-expense'
  | 'accounts'
  // Purchasing
  | 'purchase-orders'
  | 'purchase-requests'
  | 'rfq'
  | 'purchase-returns'
  | 'returns'
  // Production
  | 'production-work-orders'
  | 'bom-costing'
  // Projects
  | 'projects'
  | 'project-detail'
  | 'project-budgeting'
  // HRD
  | 'attendance-dashboard'
  | 'leave-management'
  | 'leave-types'
  | 'payroll-management'
  | 'employee-loans'
  | 'attendance-scanner'
  // Reports
  | 'report-center'
  | 'finance-reports'
  | 'inventory-reports'
  // Support & System
  | 'approval-workflows'
  | 'audit-logs'
  | 'reminders'
  | 'document-exports'
  // Settings
  | 'role-permissions'
  | 'users'
  | 'settings'
  | 'profile';
