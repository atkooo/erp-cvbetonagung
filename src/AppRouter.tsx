import React from 'react';
import { createBrowserRouter, RouteObject, useNavigate, useLocation, Navigate } from 'react-router-dom';
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
const DiscountsView = React.lazy(() => import('./components/DiscountsView'));
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
const ReportCenterView = React.lazy(() => import('./features/reports/components/ReportCenterView'));
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
const BagView = React.lazy(() => import('./features/inventory/components/BagView'));
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
const FinanceAccountsView = React.lazy(() => import('./features/finance/components/FinanceAccountsView').then(m => ({ default: m.FinanceAccountsView })));
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

// TODO: remove ViewWrapper after all views use hooks (useNavigate, useAuth) directly
const ViewWrapper = ({ Component, componentProps }: { Component: React.ComponentType<any>, componentProps?: any }) => {
  const { triggerNotification } = useAuth();
  const navigate = useNavigate();

  const handleNavigate = (view: ViewType | string) => {
    // If it's a known view type, use pathForView. Otherwise, treat as raw path (like 'project-detail/proj1')
    navigate(pathForView(view as ViewType) || `/${view}`);
  };

  const handleNavigateToProject = (view: ViewType, pid: string) => {
    navigate(`/projects/detail/${pid}`);
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
  
  const currentSubView = location.pathname.includes('/inventory/scan/detail')
    ? 'detail'
    : location.pathname.includes('/inventory/scan')
      ? 'scanner'
      : 'list';

  const [scannedSku, setScannedSku] = React.useState<string | null>(null);

  const handleNavigateSubView = (subView: 'list' | 'scanner' | 'detail', sku?: string | null) => {
    if (sku) setScannedSku(sku);
    if (subView === 'list') navigate('/inventory/qr');
    if (subView === 'scanner') navigate('/inventory/scan');
    if (subView === 'detail') navigate('/inventory/scan/detail');
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

const NavigateToHome = () => {
  const { userRoleCode } = useAuth();
  return <Navigate to={userRoleCode === 'employee' ? '/employee-dashboard' : '/dashboard'} replace />;
};

const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <NavigateToHome /> },
      { path: 'dashboard', element: lazyRoute(DashboardView) },
      { path: 'employee-dashboard', element: lazyRoute(EmployeeDashboardView) },

      // Master Data
      { path: 'master/customer', element: lazyRoute(CustomersView) },
      { path: 'master/supplier', element: lazyRoute(SuppliersView) },
      { path: 'master/product', element: lazyRoute(ProductsView) },
      { path: 'master/categories', element: lazyRoute(CategoriesView) },
      { path: 'master/units', element: lazyRoute(UnitsView) },
      { path: 'master/warehouses', element: lazyRoute(WarehouseMasterView) },
      { path: 'master/discounts', element: lazyRoute(DiscountsView) },

      // Sales
      { path: 'sales/pos', element: lazyRoute(PosView) },
      { path: 'sales/quotation', element: lazyRoute(SalesView, { type: 'quotation' }) },
      { path: 'sales/order', element: lazyRoute(SalesView, { type: 'sales-order' }) },
      { path: 'sales/delivery-orders', element: lazyRoute(DeliveryOrdersView) },
      { path: 'sales/returns', element: lazyRoute(ReturnsView, { defaultType: 'customer' }) },

      // Finance
      { path: 'finance/billing', element: lazyRoute(InvoicesView) },
      { path: 'finance/cashier', element: lazyRoute(PaymentsView) },
      { path: 'finance/account-receivable', element: lazyRoute(ReceivablesPayablesView, { initialMode: 'ar' }) },
      { path: 'finance/account-payable', element: lazyRoute(ReceivablesPayablesView, { initialMode: 'ap' }) },
      { path: 'finance/cash-bank', element: lazyRoute(CashExpenseView) },
      { path: 'finance/accounts', element: lazyRoute(FinanceAccountsView) },
      { path: 'finance/reports', element: lazyRoute(FinanceReportView) },

      // Purchasing
      { path: 'purchasing/requests', element: lazyRoute(PurchaseRequestView) },
      { path: 'purchasing/rfq', element: lazyRoute(RfqView) },
      { path: 'purchasing/po', element: lazyRoute(PurchaseView) },
      { path: 'purchasing/returns', element: lazyRoute(ReturnsView, { defaultType: 'supplier' }) },

      // Inventory
      { path: 'inventory/stock', element: lazyRoute(InventoryView, { initialTab: 'stok' }) },
      { path: 'inventory/stock-in', element: lazyRoute(InventoryView, { initialTab: 'masuk' }) },
      { path: 'inventory/stock-out', element: lazyRoute(InventoryView, { initialTab: 'keluar' }) },
      { path: 'inventory/history', element: lazyRoute(InventoryView, { initialTab: 'riwayat' }) },
      { path: 'inventory/bag', element: lazyRoute(BagView) },
      { path: 'inventory/opname', element: lazyRoute(StockOpnameView) },
      { path: 'inventory/warehouses', element: lazyRoute(MultiWarehouseView) },
      { path: 'inventory/qr', element: <QrViewWrapper /> },
      { path: 'inventory/scan', element: <QrViewWrapper /> },
      { path: 'inventory/scan/detail', element: <QrViewWrapper /> },

      // Production & Projects
      { path: 'production/work-orders', element: lazyRoute(ProductionWorkOrderView) },
      { path: 'production/bom', element: lazyRoute(BomCostingView) },
      { path: 'projects', element: lazyRoute(ProjectsView) },
      { path: 'projects/detail/:id', element: lazyRoute(ProjectsView) },
      { path: 'projects/budgeting', element: lazyRoute(ProjectBudgetingView) },

      // HRD
      { path: 'hrd/employees', element: lazyRoute(EmployeeMasterView) },
      { path: 'hrd/attendance', element: lazyRoute(AttendanceDashboardView) },
      { path: 'hrd/attendance/scan', element: lazyRoute(AttendanceScannerView) },
      { path: 'hrd/leave', element: lazyRoute(LeaveManagementView) },
      { path: 'hrd/payroll', element: lazyRoute(PayrollManagementView) },
      { path: 'hrd/loans', element: lazyRoute(EmployeeLoanView) },

      // Reports
      { path: 'reports', element: lazyRoute(ReportCenterView) },
      { path: 'reports/inventory', element: lazyRoute(InventoryReportView) },

      // System & Control
      { path: 'system/approvals', element: lazyRoute(ApprovalWorkflowView) },
      { path: 'system/audit', element: lazyRoute(AuditLogView) },
      { path: 'system/reminders', element: lazyRoute(RemindersView) },
      { path: 'system/exports', element: lazyRoute(DocumentExportsView) },
      { path: 'system/roles', element: lazyRoute(RolePermissionView) },
      { path: 'system/users', element: lazyRoute(UsersView) },

      { path: 'settings', element: lazyRoute(SettingsView) },
      { path: 'profile', element: lazyRoute(ProfileView) },

      // Fallback
      { path: '*', element: <div className="p-8 text-center text-slate-500 font-sans">Halaman tidak ditemukan atau sedang dalam konstruksi.</div> }
    ]
  }
];

export const appRouter = createBrowserRouter(routes);
