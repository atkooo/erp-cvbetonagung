import React from 'react';
import { createBrowserRouter, RouteObject, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { pathForView, viewFromPath } from './routes';
import type { ViewType } from './types';
import ErrorBoundaryClass, { RouteErrorFallback } from './components/ErrorBoundary';
import { NAVIGATION_SECTIONS, type NavigationItem } from './config/navigation';
import { hasViewAccess } from './utils/permissions';

/**
 * Robust lazy import wrapper with automatic retry on chunk load failure.
 * Handles Vite dev server restarts, HMR cache invalidations, and network glitches.
 */
const lazyWithRetry = <T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T } | { [key: string]: T }>
) =>
  React.lazy(async () => {
    const pageHasBeenRefreshed = JSON.parse(
      window.sessionStorage.getItem('page_has_been_refreshed') || 'false'
    );
    try {
      const module = await componentImport();
      window.sessionStorage.setItem('page_has_been_refreshed', 'false');
      if ('default' in module) {
        return { default: module.default };
      }
      return { default: Object.values(module)[0] as T };
    } catch (error) {
      if (!pageHasBeenRefreshed) {
        window.sessionStorage.setItem('page_has_been_refreshed', 'true');
        window.location.reload();
        return new Promise(() => {}); // Pause until page reloads
      }
      throw error;
    }
  });

// Lazy-loaded view modules
const DashboardView = lazyWithRetry(() => import('./components/DashboardView'));
const EmployeeDashboardView = lazyWithRetry(() => import('./components/EmployeeDashboardView'));
const CustomersView = lazyWithRetry(() => import('./components/CustomersView'));
const SuppliersView = lazyWithRetry(() => import('./components/SuppliersView'));
const ProductsView = lazyWithRetry(() => import('./components/ProductsView'));
const CategoriesView = lazyWithRetry(() => import('./components/CategoriesView'));
const UnitsView = lazyWithRetry(() => import('./components/UnitsView'));
const WarehouseMasterView = lazyWithRetry(() => import('./components/WarehouseMasterView'));
const DiscountsView = lazyWithRetry(() => import('./components/DiscountsView'));
const InventoryView = lazyWithRetry(() => import('./components/InventoryView'));
const PosView = lazyWithRetry(() => import('./features/sales/components/PosView'));
const SalesView = lazyWithRetry(() => import('./components/SalesView'));
const InvoicesView = lazyWithRetry(() => import('./components/InvoicesView'));
const PaymentsView = lazyWithRetry(() => import('./components/PaymentsView'));
const PurchaseView = lazyWithRetry(() => import('./components/PurchaseView'));
const PurchaseRequestView = lazyWithRetry(() => import('./components/PurchaseRequestView'));
const RfqView = lazyWithRetry(() => import('./components/RfqView'));
const ProjectsView = lazyWithRetry(() => import('./components/ProjectsView'));
const QrView = lazyWithRetry(() => import('./components/QrView'));
const FinanceReportView = lazyWithRetry(() => import('./components/FinanceReportView'));
const InventoryReportView = lazyWithRetry(() => import('./components/InventoryReportView'));
const ReportCenterView = lazyWithRetry(() => import('./features/reports/components/ReportCenterView'));
const SettingsView = lazyWithRetry(() => import('./components/SettingsView'));
const EmployeeMasterView = lazyWithRetry(() => import('./components/EmployeeMasterView'));
const AttendanceDashboardView = lazyWithRetry(() => import('./components/AttendanceDashboardView'));
const LeaveManagementView = lazyWithRetry(() => import('./components/LeaveManagementView'));
const LeaveTypesMasterView = lazyWithRetry(() => import('./components/LeaveTypesMasterView'));
const PayrollManagementView = lazyWithRetry(() => import('./components/PayrollManagementView'));
const EmployeeLoanView = lazyWithRetry(() => import('./components/EmployeeLoanView'));
const AttendanceScannerView = lazyWithRetry(() => import('./components/AttendanceScannerView'));
const DeliveryOrdersView = lazyWithRetry(() => import('./components/DeliveryOrdersView'));
const ProductionWorkOrderView = lazyWithRetry(() => import('./components/ProductionWorkOrderView'));
const BomCostingView = lazyWithRetry(() => import('./components/BomCostingView'));
const BagView = lazyWithRetry(() => import('./features/inventory/components/BagView'));
const StockOpnameView = lazyWithRetry(() => import('./components/StockOpnameView'));
const ApprovalWorkflowView = lazyWithRetry(() => import('./components/ApprovalWorkflowView'));
const AuditLogView = lazyWithRetry(() => import('./components/AuditLogView'));
const RemindersView = lazyWithRetry(() => import('./components/RemindersView'));
const DocumentExportsView = lazyWithRetry(() => import('./components/DocumentExportsView'));
const ReturnsView = lazyWithRetry(() => import('./components/ReturnsView'));
const ProjectBudgetingView = lazyWithRetry(() => import('./components/ProjectBudgetingView'));
const MultiWarehouseView = lazyWithRetry(() => import('./components/MultiWarehouseView'));
const ReceivablesPayablesView = lazyWithRetry(() => import('./components/ReceivablesPayablesView'));
const CashExpenseView = lazyWithRetry(() => import('./components/CashExpenseView'));
const FinanceAccountsView = lazyWithRetry(() => import('./features/finance/components/FinanceAccountsView').then(m => ({ default: m.FinanceAccountsView })));
const RolePermissionView = lazyWithRetry(() => import('./components/RolePermissionView'));
const UsersView = lazyWithRetry(() => import('./components/UsersView'));
const ProfileView = lazyWithRetry(() => import('./components/ProfileView'));

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
  const { triggerNotification, userRoleCode, authUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Guard direct URL navigation based on role permissions and minAccessLevel
  const currentView = viewFromPath(location.pathname);
  if (currentView) {
    let navItem: NavigationItem | undefined;
    for (const section of NAVIGATION_SECTIONS) {
      const found = section.items.find(i => i.view === currentView);
      if (found) {
        navItem = found;
        break;
      }
    }
    if (navItem && !hasViewAccess(userRoleCode, authUser?.role?.permissions, navItem.requiredModule, navItem.view, navItem.minAccessLevel)) {
      return <Navigate to="/" replace />;
    }
  }

  const handleNavigate = (view: ViewType | string) => {
    // If it's a known view type, use pathForView. Otherwise, treat as raw path (like 'project-detail/proj1')
    navigate(pathForView(view as ViewType) || `/${view}`);
  };

  const handleNavigateToProject = (view: ViewType, pid: string) => {
    navigate(`/projects/detail/${pid}`);
  };

  return (
    <ErrorBoundaryClass>
      <React.Suspense fallback={<LoadingFallback />}>
        <Component
          {...componentProps}
          onNavigate={handleNavigate}
          onNavigateToProject={handleNavigateToProject}
          onTriggerNotification={triggerNotification}
        />
      </React.Suspense>
    </ErrorBoundaryClass>
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
    <ErrorBoundaryClass>
      <React.Suspense fallback={<LoadingFallback />}>
        <QrView
          currentSubView={currentSubView}
          scannedSku={scannedSku}
          onNavigateSubView={handleNavigateSubView}
          onTriggerNotification={triggerNotification}
        />
      </React.Suspense>
    </ErrorBoundaryClass>
  );
};

const lazyRoute = (Component: React.ComponentType<any>, props?: any) => (
  <ViewWrapper Component={Component} componentProps={props} />
);

const NavigateToHome = () => {
  const { userRoleCode, authUser } = useAuth();
  if (userRoleCode === 'employee') {
    return <Navigate to="/employee-dashboard" replace />;
  }

  const userPermissions = authUser?.role?.permissions;
  if (!hasViewAccess(userRoleCode, userPermissions, 'reports', 'dashboard')) {
    for (const section of NAVIGATION_SECTIONS) {
      for (const item of section.items) {
        if (hasViewAccess(userRoleCode, userPermissions, item.requiredModule, item.view, item.minAccessLevel)) {
          return <Navigate to={pathForView(item.view)} replace />;
        }
      }
    }
  }

  return <Navigate to="/dashboard" replace />;
};

const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorFallback />,
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
      { path: 'sales/order/:id', element: lazyRoute(SalesView, { type: 'sales-order' }) },
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
      { path: 'purchasing/receiving', element: lazyRoute(InventoryView, { initialTab: 'masuk' }) },
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
      { path: 'hrd/leave-types', element: lazyRoute(LeaveTypesMasterView) },
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
