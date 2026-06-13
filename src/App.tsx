/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import type { AuthSession, AuthUser, ViewType } from './types';
import { authApi, authStorage } from './services/api';
import { DEFAULT_AUTHENTICATED_VIEW, normalizePath, pathForView, viewFromPath } from './routes';
import { useToast } from './hooks/useToast';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import LoginView from './components/LoginView';

// Lazy-loaded view modules — code split per route untuk performa optimal
const DashboardView = React.lazy(() => import('./pages/dashboard'));
const EmployeeDashboardView = React.lazy(() => import('./components/EmployeeDashboardView'));
const CustomersView = React.lazy(() => import('./pages/master/customer'));
const SuppliersView = React.lazy(() => import('./pages/master/supplier'));
const ProductsView = React.lazy(() => import('./pages/master/product'));
const CategoriesView = React.lazy(() => import('./components/CategoriesView'));
const UnitsView = React.lazy(() => import('./components/UnitsView'));
const WarehouseMasterView = React.lazy(() => import('./components/WarehouseMasterView'));
const InventoryView = React.lazy(() => import('./components/InventoryView'));
const SalesView = React.lazy(() => import('./pages/sales/quotation'));
const InvoicesView = React.lazy(() => import('./pages/finance/billing'));
const PaymentsView = React.lazy(() => import('./pages/finance/cashier'));
const PurchaseView = React.lazy(() => import('./pages/purchasing/po'));
const PurchaseRequestView = React.lazy(() => import('./components/PurchaseRequestView'));
const RfqView = React.lazy(() => import('./components/RfqView'));
const ProjectsView = React.lazy(() => import('./components/ProjectsView'));
const QrView = React.lazy(() => import('./components/QrView'));
const FinanceReportView = React.lazy(() => import('./pages/reports'));
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
const ReceivablesPayablesView = React.lazy(() => import('./pages/finance/account-payable'));
const CashExpenseView = React.lazy(() => import('./pages/finance/cash-bank'));
const RolePermissionView = React.lazy(() => import('./components/RolePermissionView'));
const UsersView = React.lazy(() => import('./components/UsersView'));
const ProfileView = React.lazy(() => import('./components/ProfileView'));

import { CheckCircle2, WifiOff } from '@/src/components/icons';

export default function App() {
  // --- Auth state ---
  const storedUser = authStorage.getUser();
  const initialRouteView = viewFromPath(window.location.pathname);

  const [authUser, setAuthUser] = useState<AuthUser | null>(storedUser);
  const [isRestoringSession, setIsRestoringSession] = useState(
    Boolean(storedUser && authStorage.getToken())
  );

  // Derived values — tidak butuh useState terpisah, cukup compute dari authUser
  const userRole = authUser?.role?.name ?? 'User';
  const userRoleCode = authUser?.role?.code ?? 'admin';
  const userEmail = authUser?.email ?? '';

  // --- Navigation state ---
  const [currentView, setCurrentView] = useState<ViewType>(
    storedUser ? (initialRouteView || DEFAULT_AUTHENTICATED_VIEW) : 'login'
  );

  // --- Connection state ---
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // --- Detail/sub-navigation state ---
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
  const [scannedSku, setScannedSku] = useState<string | null>(null);

  // --- Toast notification (extracted hook) ---
  const { toast, triggerNotification } = useToast();

  // --- Global event listeners ---
  useEffect(() => {
    const handlePopState = () => {
      const routeView = viewFromPath(window.location.pathname);
      if (routeView) {
        setCurrentView(routeView);
      } else if (authStorage.getToken()) {
        setCurrentView(DEFAULT_AUTHENTICATED_VIEW);
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      triggerNotification('Koneksi internet terhubung kembali.');
    };

    const handleOffline = () => {
      setIsOnline(false);
      triggerNotification('Koneksi internet terputus.');
    };

    const handleUnauthorized = () => {
      setAuthUser(null);
      setCurrentView('login');
      triggerNotification('Sesi Anda telah berakhir. Silakan masuk kembali.');
    };

    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setCurrentView(customEvent.detail as ViewType);
      }
    };

    const handleProfileUpdated = () => {
      const updatedUser = authStorage.getUser();
      if (updatedUser) {
        setAuthUser(updatedUser);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('navigate', handleNavigate);
    window.addEventListener('profile:updated', handleProfileUpdated);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('navigate', handleNavigate);
      window.removeEventListener('profile:updated', handleProfileUpdated);
    };
  }, [triggerNotification]);

  // --- Sync URL dengan currentView ---
  useEffect(() => {
    if (currentView === 'login') {
      if (normalizePath(window.location.pathname) !== '/') {
        window.history.replaceState(null, '', '/');
      }
      return;
    }

    const nextPath = pathForView(currentView);
    if (normalizePath(window.location.pathname) !== nextPath) {
      window.history.pushState(null, '', nextPath);
    }
  }, [currentView]);

  // --- Restore session dari stored token ---
  useEffect(() => {
    if (!authStorage.getToken()) {
      setIsRestoringSession(false);
      return;
    }

    authApi
      .me()
      .then((user) => {
        setAuthUser(user);
        const routeView = viewFromPath(window.location.pathname);
        const defaultView: ViewType =
          user.role?.code === 'employee'
            ? 'employee-dashboard'
            : (routeView || DEFAULT_AUTHENTICATED_VIEW);
        setCurrentView((view) => (view === 'login' ? defaultView : view));
      })
      .catch((error: Error) => {
        setAuthUser(null);
        setCurrentView('login');
        triggerNotification(error.message);
      })
      .finally(() => setIsRestoringSession(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentional: only on mount

  // --- Auth handlers ---
  const handleLoginSuccess = (session: AuthSession) => {
    setAuthUser(session.user);
    const defaultView: ViewType =
      session.user.role?.code === 'employee' ? 'employee-dashboard' : 'dashboard';
    setCurrentView(defaultView);
  };

  const handleLogout = async () => {
    if (authStorage.getToken()) {
      try {
        await authApi.logout();
      } catch (error) {
        triggerNotification(
          error instanceof Error ? error.message : 'Logout gagal. Silakan coba lagi.'
        );
      }
    } else {
      authStorage.clear();
    }

    setAuthUser(null);
    setCurrentView('login');
    triggerNotification('Sampai jumpa! Anda berhasil logout.');
  };

  // -------------------------------------------------------------
  // CENTRAL VIEW RENDERING MATRIX
  // -------------------------------------------------------------
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={(v) => {
              setCurrentView(v);
              if (v === 'project-detail') {
                setSelectedProjectId('proj1');
              }
            }}
            onNavigateToProject={(v, pid) => {
              setCurrentView(v);
              setSelectedProjectId(pid);
            }}
            onTriggerNotification={triggerNotification}
          />
        );
      case 'employee-dashboard':
        return <EmployeeDashboardView onNavigate={setCurrentView} />;

      case 'customers':
        return <CustomersView onTriggerNotification={triggerNotification} />;

      case 'employees':
        return <EmployeeMasterView onTriggerNotification={triggerNotification} />;

      case 'attendance-dashboard':
        return <AttendanceDashboardView onTriggerNotification={triggerNotification} />;

      case 'leave-management':
        return <LeaveManagementView onTriggerNotification={triggerNotification} />;

      case 'payroll-management':
        return <PayrollManagementView onTriggerNotification={triggerNotification} />;

      case 'employee-loans':
        return <EmployeeLoanView onTriggerNotification={triggerNotification} />;

      case 'attendance-scanner':
        return <AttendanceScannerView onTriggerNotification={triggerNotification} />;

      case 'suppliers':
        return <SuppliersView onTriggerNotification={triggerNotification} />;

      case 'products':
        return <ProductsView onTriggerNotification={triggerNotification} />;

      case 'categories':
        return <CategoriesView onTriggerNotification={triggerNotification} />;

      case 'units':
        return <UnitsView onTriggerNotification={triggerNotification} />;

      case 'warehouses':
        return <WarehouseMasterView onTriggerNotification={triggerNotification} />;

      case 'stock-management':
        return (
          <InventoryView
            initialTab="stok"
            onTriggerNotification={triggerNotification}
            onNavigate={setCurrentView}
          />
        );
      case 'incoming-goods':
      case 'goods-receipts':
        return (
          <InventoryView
            initialTab="masuk"
            onTriggerNotification={triggerNotification}
            onNavigate={setCurrentView}
          />
        );
      case 'outgoing-goods':
        return (
          <InventoryView
            initialTab="keluar"
            onTriggerNotification={triggerNotification}
            onNavigate={setCurrentView}
          />
        );
      case 'stock-movement-history':
        return (
          <InventoryView
            initialTab="riwayat"
            onTriggerNotification={triggerNotification}
            onNavigate={setCurrentView}
          />
        );

      case 'quotations':
        return (
          <SalesView
            type="quotation"
            onTriggerNotification={triggerNotification}
            onNavigate={setCurrentView}
          />
        );
      case 'sales-orders':
        return (
          <SalesView
            type="sales-order"
            onTriggerNotification={triggerNotification}
            onNavigate={setCurrentView}
          />
        );

      case 'invoices':
        return (
          <InvoicesView
            onTriggerNotification={triggerNotification}
            onNavigate={setCurrentView}
          />
        );
      case 'payments':
        return <PaymentsView onTriggerNotification={triggerNotification} />;

      case 'purchase-requests':
        return <PurchaseRequestView onTriggerNotification={triggerNotification} />;

      case 'rfq':
        return <RfqView onTriggerNotification={triggerNotification} />;

      case 'approval-workflows':
        return <ApprovalWorkflowView onTriggerNotification={triggerNotification} />;

      case 'users':
        return <UsersView onTriggerNotification={triggerNotification} />;

      case 'purchase-orders':
        return <PurchaseView onTriggerNotification={triggerNotification} />;

      case 'purchase-returns':
      case 'returns':
        return <ReturnsView onTriggerNotification={triggerNotification} />;

      case 'receivables-payables':
        return <ReceivablesPayablesView onTriggerNotification={triggerNotification} />;

      case 'cash-expense':
        return <CashExpenseView onTriggerNotification={triggerNotification} />;

      case 'delivery-orders':
        return <DeliveryOrdersView onTriggerNotification={triggerNotification} />;

      case 'multi-warehouse':
        return (
          <MultiWarehouseView
            onTriggerNotification={triggerNotification}
            onNavigate={setCurrentView}
          />
        );

      case 'project-budgeting':
        return <ProjectBudgetingView onTriggerNotification={triggerNotification} />;

      case 'reminders':
        return <RemindersView onTriggerNotification={triggerNotification} />;

      case 'document-exports':
        return <DocumentExportsView onTriggerNotification={triggerNotification} />;

      case 'role-permissions':
        return <RolePermissionView onTriggerNotification={triggerNotification} />;

      case 'stock-opname':
        return <StockOpnameView onTriggerNotification={triggerNotification} />;

      case 'audit-logs':
        return <AuditLogView onTriggerNotification={triggerNotification} />;

      case 'production-work-orders':
        return (
          <ProductionWorkOrderView
            initialWoId={selectedWorkOrderId}
            onNavigateToProject={(projectId) => {
              setSelectedProjectId(projectId);
              setCurrentView('project-detail');
            }}
            onTriggerNotification={triggerNotification}
          />
        );

      case 'bom-costing':
        return <BomCostingView onTriggerNotification={triggerNotification} />;

      case 'projects':
      case 'project-detail':
        return (
          <ProjectsView
            selectedProjectId={selectedProjectId}
            onSelectProjectId={setSelectedProjectId}
            onNavigate={setCurrentView}
            onNavigateToWorkOrder={(woId) => {
              setSelectedWorkOrderId(woId);
              setCurrentView('production-work-orders');
            }}
            onTriggerNotification={triggerNotification}
          />
        );

      case 'qr-products':
        return (
          <QrView
            currentSubView="list"
            scannedSku={scannedSku}
            onNavigateSubView={(sub, sku) => {
              setScannedSku(sku || null);
              if (sub === 'list') setCurrentView('qr-products');
              else if (sub === 'scanner') setCurrentView('scan-qr-product');
              else setCurrentView('scanned-product-detail');
            }}
            onTriggerNotification={triggerNotification}
          />
        );
      case 'scan-qr-product':
      case 'scanned-product-detail':
        return (
          <QrView
            currentSubView={currentView === 'scan-qr-product' ? 'scanner' : 'detail'}
            scannedSku={scannedSku}
            onNavigateSubView={(sub, sku) => {
              setScannedSku(sku || null);
              if (sub === 'list') setCurrentView('qr-products');
              else if (sub === 'scanner') setCurrentView('scan-qr-product');
              else setCurrentView('scanned-product-detail');
            }}
            onTriggerNotification={triggerNotification}
          />
        );

      case 'finance-reports':
        return <FinanceReportView onTriggerNotification={triggerNotification} />;

      case 'inventory-reports':
        return <InventoryReportView onTriggerNotification={triggerNotification} />;

      case 'settings':
        return <SettingsView onTriggerNotification={triggerNotification} />;

      case 'profile':
        return <ProfileView onTriggerNotification={triggerNotification} />;

      default:
        return (
          <div className="p-8 text-center text-slate-500 font-sans">
            Halaman sedang dalam konstruksi.
          </div>
        );
    }
  };

  // --- Login layout ---
  if (currentView === 'login') {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onTriggerNotification={triggerNotification}
      />
    );
  }

  // --- Session restore loading ---
  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 mx-auto border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Memulihkan Sesi ERP</p>
        </div>
      </div>
    );
  }

  // --- Mobile layout untuk role employee ---
  if (userRoleCode === 'employee') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        {!isOnline && (
          <div className="bg-rose-600 text-white text-[10px] font-bold text-center py-1.5 px-4 flex items-center justify-center gap-2 shrink-0 animate-in slide-in-from-top duration-300">
            <WifiOff size={12} className="animate-pulse" />
            <span>Mode Offline</span>
          </div>
        )}

        {/* Simple Mobile Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            {currentView !== 'employee-dashboard' && (
              <button
                onClick={() => setCurrentView('employee-dashboard')}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"
                title="Kembali ke Beranda"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
            )}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono font-bold text-emerald-600 tracking-wider">CV Beton Agung</span>
              <span className="text-xs font-bold text-slate-800">Portal Karyawan</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100"
          >
            Keluar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
          <React.Suspense fallback={
            <div className="py-12 text-center">
              <div className="w-6 h-6 mx-auto border-2 border-slate-400 border-t-transparent rounded-full animate-spin mb-2.5" />
            </div>
          }>
            {renderContent()}
          </React.Suspense>
        </div>

        {toast && (
          <div className="fixed top-5 right-5 bg-slate-900 text-white rounded-full shadow-xl px-5 py-2.5 flex items-center gap-2.5 z-50 animate-in fade-in slide-in-from-top-5 duration-200 whitespace-nowrap">
            <CheckCircle2 size={15} className="text-white stroke-[3]" />
            <span className="font-sans font-bold text-[11px]">{toast}</span>
          </div>
        )}
      </div>
    );
  }

  // --- Full admin dashboard layout ---
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      <Sidebar
        currentView={currentView}
        onViewChange={(v) => {
          setCurrentView(v);
          if (v === 'projects') setSelectedProjectId(null);
        }}
        onLogout={handleLogout}
        userRoleName={userRole}
        userRoleCode={userRoleCode}
        userPermissions={authUser?.role?.permissions}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!isOnline && (
          <div className="bg-rose-600 text-white text-[10px] font-sans font-bold text-center py-1.5 px-4 flex items-center justify-center gap-2 shrink-0 animate-in slide-in-from-top duration-300">
            <WifiOff size={12} className="animate-pulse" />
            <span>Koneksi internet terputus. Bekerja dalam mode offline.</span>
          </div>
        )}

        <Topbar
          currentView={currentView}
          userRole={userRole}
          onTriggerNotification={triggerNotification}
          userEmail={userEmail}
          userName={authUser?.name}
        />

        <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
            <React.Suspense fallback={
              <div className="p-12 text-center bg-white rounded-lg border border-slate-200/80 shadow-sm">
                <div className="w-6 h-6 mx-auto border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2.5" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Memuat Modul ERP...</p>
              </div>
            }>
              {renderContent()}
            </React.Suspense>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed top-5 right-5 bg-slate-900 text-white rounded-lg shadow-xl p-3.5 flex items-center gap-2.5 z-50 animate-in fade-in slide-in-from-top-5 duration-200">
          <CheckCircle2 size={15} className="text-white stroke-[3]" />
          <span className="font-sans font-bold text-[11px]">{toast}</span>
        </div>
      )}
    </div>
  );
}
