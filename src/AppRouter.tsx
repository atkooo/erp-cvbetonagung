import React from 'react';
import { createBrowserRouter, RouteObject, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { pathForView } from './routes';
import type { ViewType } from './types';

// Lazy-loaded view modules
const DashboardView = React.lazy(() => import('./components/DashboardView'));
const EmployeeDashboardView = React.lazy(() => import('./components/EmployeeDashboardView'));
const CustomersView = React.lazy(() => import('./components/CustomersView'));
const SuppliersView = React.lazy(() => import('./components/SuppliersView'));
const ProductsView = React.lazy(() => import('./components/ProductsView'));
const CategoriesView = React.lazy(() => import('./components/CategoriesView'));
const UnitsView = React.lazy(() => import('./components/UnitsView'));
const WarehouseMasterView = React.lazy(() => import('./components/WarehouseMasterView'));
const InventoryView = React.lazy(() => import('./components/InventoryView'));
const PosView = React.lazy(() => import('./features/sales/components/PosView'));
const SalesView = React.lazy(() => import('./components/SalesView'));
const InvoicesView = React.lazy(() => import('./components/InvoicesView'));
const PaymentsView = React.lazy(() => import('./components/PaymentsView'));
const PurchaseView = React.lazy(() => import('./components/PurchaseView'));
const PurchaseRequestView = React.lazy(() => import('./components/PurchaseRequestView'));
const RfqView = React.lazy(() => import('./components/RfqView'));
const ProjectsView = React.lazy(() => import('./components/ProjectsView'));
const QrView = React.lazy(() => import('./components/QrView'));
const FinanceReportView = React.lazy(() => import('./components/FinanceReportView'));
const InventoryReportView = React.lazy(() => import('./components/InventoryReportView'));
const SettingsView = React.lazy(() => import('./components/SettingsView'));
const EmployeeMasterView = React.lazy(() => import('./components/EmployeeMasterView'));
const AttendanceDashboardView = React.lazy(() => import('./components/AttendanceDashboardView'));
const LeaveManagementView = React.lazy(() => import('./components/LeaveManagementView'));
const PayrollManagementView = React.lazy(() => import('./components/PayrollManagementView'));
const EmployeeLoanView = React.lazy(() => import('./components/EmployeeLoanView'));
const AttendanceScannerView = React.lazy(() => import('./components/AttendanceScannerView'));
const DeliveryOrdersView = React.lazy(() => import('./components/DeliveryOrdersView'));
const ProductionWorkOrderView = React.lazy(() => import('./components/ProductionWorkOrderView'));
const BomCostingView = React.lazy(() => import('./components/BomCostingView'));
const StockOpnameView = React.lazy(() => import('./components/StockOpnameView'));
const ApprovalWorkflowView = React.lazy(() => import('./components/ApprovalWorkflowView'));
const AuditLogView = React.lazy(() => import('./components/AuditLogView'));
const RemindersView = React.lazy(() => import('./components/RemindersView'));
const DocumentExportsView = React.lazy(() => import('./components/DocumentExportsView'));
const ReturnsView = React.lazy(() => import('./components/ReturnsView'));
const ProjectBudgetingView = React.lazy(() => import('./components/ProjectBudgetingView'));
const MultiWarehouseView = React.lazy(() => import('./components/MultiWarehouseView'));
const ReceivablesPayablesView = React.lazy(() => import('./components/ReceivablesPayablesView'));
const CashExpenseView = React.lazy(() => import('./components/CashExpenseView'));
import { FinanceAccountsView } from './features/finance/components/FinanceAccountsView';
const RolePermissionView = React.lazy(() => import('./components/RolePermissionView'));
const UsersView = React.lazy(() => import('./components/UsersView'));
const ProfileView = React.lazy(() => import('./components/ProfileView'));

import RootLayout from './layouts/RootLayout';

// Fallback loader component
const LoadingFallback = () => (
  <div className="p-12 text-center bg-white rounded-lg border border-slate-200/80 shadow-sm h-full w-full">
    <div className="w-6 h-6 mx-auto border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2.5" />
    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Memuat Modul ERP...</p>
  </div>
);

// Helper to wrap lazy components and inject legacy props for backward compatibility during migration
const ViewWrapper = ({ Component, componentProps }: { Component: React.ComponentType<any>, componentProps?: any }) => {
  const { triggerNotification } = useAuth();
  const navigate = useNavigate();

  const handleNavigate = (view: ViewType | string) => {
    // If it's a known view type, use pathForView. Otherwise, treat as raw path (like 'project-detail/proj1')
    navigate(pathForView(view as ViewType) || `/${view}`);
  };

  const handleNavigateToProject = (view: ViewType, pid: string) => {
    navigate(`/project-detail/${pid}`);
  };

  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <Component 
        {...componentProps} 
        onNavigate={handleNavigate}
        onNavigateToProject={handleNavigateToProject}
        onTriggerNotification={triggerNotification}
      />
    </React.Suspense>
  );
};

const QrViewWrapper = () => {
  const { triggerNotification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentSubView = location.pathname.includes('scan-qr-product') 
    ? 'scanner' 
    : location.pathname.includes('scanned-product-detail') 
      ? 'detail' 
      : 'list';

  const [scannedSku, setScannedSku] = React.useState<string | null>(null);

  const handleNavigateSubView = (subView: 'list' | 'scanner' | 'detail', sku?: string | null) => {
    if (sku) setScannedSku(sku);
    if (subView === 'list') navigate('/qr-products');
    if (subView === 'scanner') navigate('/scan-qr-product');
    if (subView === 'detail') navigate('/scanned-product-detail');
  };

  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <QrView
        currentSubView={currentSubView}
        scannedSku={scannedSku}
        onNavigateSubView={handleNavigateSubView}
        onTriggerNotification={triggerNotification}
      />
    </React.Suspense>
  );
};

const lazyRoute = (Component: React.ComponentType<any>, props?: any) => (
  <ViewWrapper Component={Component} componentProps={props} />
);

// We define a standard set of routes that will eventually replace the switch(currentView) logic.
// This is the "Shadow Router" for Phase 1. It is not yet active in main.tsx.
const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { path: 'dashboard', element: lazyRoute(DashboardView) },
      { path: 'employee-dashboard', element: lazyRoute(EmployeeDashboardView) },
      
      // Master Data
      { path: 'master/customer', element: lazyRoute(CustomersView) },
      { path: 'master/supplier', element: lazyRoute(SuppliersView) },
      { path: 'master/product', element: lazyRoute(ProductsView) },
      { path: 'categories', element: lazyRoute(CategoriesView) },
      { path: 'units', element: lazyRoute(UnitsView) },
      { path: 'warehouses', element: lazyRoute(WarehouseMasterView) },
      
      // Sales & POS
      { path: 'pos', element: lazyRoute(PosView) },
      { path: 'sales/quotation', element: lazyRoute(SalesView, { type: 'quotation' }) },
      { path: 'sales/order', element: lazyRoute(SalesView, { type: 'sales-order' }) },
      { path: 'delivery-orders', element: lazyRoute(DeliveryOrdersView) },
      { path: 'returns', element: lazyRoute(ReturnsView, { defaultType: 'customer' }) },
      
      // Finance
      { path: 'finance/billing', element: lazyRoute(InvoicesView) },
      { path: 'finance/cashier', element: lazyRoute(PaymentsView) },
      { path: 'finance/account-payable', element: lazyRoute(ReceivablesPayablesView) },
      { path: 'finance/cash-bank', element: lazyRoute(CashExpenseView) },
      { path: 'accounts', element: <FinanceAccountsView /> },
      
      // Purchasing
      { path: 'purchasing/po', element: lazyRoute(PurchaseView) },
      { path: 'purchase-requests', element: lazyRoute(PurchaseRequestView) },
      { path: 'rfq', element: lazyRoute(RfqView) },
      { path: 'purchase-returns', element: lazyRoute(ReturnsView, { defaultType: 'supplier' }) },
      
      // Inventory
      { path: 'inventory/stock', element: lazyRoute(InventoryView, { initialTab: 'stok' }) },
      { path: 'inventory/stock-in', element: lazyRoute(InventoryView, { initialTab: 'masuk' }) },
      { path: 'inventory/stock-out', element: lazyRoute(InventoryView, { initialTab: 'keluar' }) },
      { path: 'stock-movement-history', element: lazyRoute(InventoryView, { initialTab: 'riwayat' }) },
      { path: 'stock-opname', element: lazyRoute(StockOpnameView) },
      { path: 'multi-warehouse', element: lazyRoute(MultiWarehouseView) },
      
      // HR / Employee
      { path: 'employees', element: lazyRoute(EmployeeMasterView) },
      { path: 'attendance-dashboard', element: lazyRoute(AttendanceDashboardView) },
      { path: 'attendance-scanner', element: lazyRoute(AttendanceScannerView) },
      { path: 'leave-management', element: lazyRoute(LeaveManagementView) },
      { path: 'payroll-management', element: lazyRoute(PayrollManagementView) },
      { path: 'employee-loans', element: lazyRoute(EmployeeLoanView) },
      
      // Production & Projects
      { path: 'production-work-orders', element: lazyRoute(ProductionWorkOrderView) },
      { path: 'bom-costing', element: lazyRoute(BomCostingView) },
      { path: 'projects', element: lazyRoute(ProjectsView) },
      { path: 'project-detail/:id', element: lazyRoute(ProjectsView) },
      { path: 'project-budgeting', element: lazyRoute(ProjectBudgetingView) },
      
      // Reporting & Misc
      { path: 'reports', element: lazyRoute(FinanceReportView) },
      { path: 'inventory-reports', element: lazyRoute(InventoryReportView) },
      { path: 'audit-logs', element: lazyRoute(AuditLogView) },
      { path: 'approval-workflows', element: lazyRoute(ApprovalWorkflowView) },
      { path: 'role-permissions', element: lazyRoute(RolePermissionView) },
      { path: 'users', element: lazyRoute(UsersView) },
      { path: 'profile', element: lazyRoute(ProfileView) },
      { path: 'settings', element: lazyRoute(SettingsView) },
      { path: 'reminders', element: lazyRoute(RemindersView) },
      { path: 'document-exports', element: lazyRoute(DocumentExportsView) },
      
      // QR / Barcode
      { path: 'qr-products', element: <QrViewWrapper /> },
      { path: 'scan-qr-product', element: <QrViewWrapper /> },
      { path: 'scanned-product-detail', element: <QrViewWrapper /> },
      
      // Fallback
      { path: '*', element: <div className="p-8 text-center text-slate-500 font-sans">Halaman tidak ditemukan atau sedang dalam konstruksi.</div> }
    ]
  }
];

export const appRouter = createBrowserRouter(routes);

// Default export for potential future use
export default appRouter;
