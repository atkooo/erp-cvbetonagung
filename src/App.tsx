/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import type { AuthSession, AuthUser, Customer, Supplier, Product, StockMovement, SalesOrder, Quotation, Invoice, Payment, PurchaseOrder, Project, ViewType } from './types';
import { authApi, authStorage } from './services/api';
import { DEFAULT_AUTHENTICATED_VIEW, normalizePath, pathForView, viewFromPath } from './routes';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Feature sub-modules
import LoginView from './components/LoginView';

const DashboardView = React.lazy(() => import('./pages/dashboard'));
const EmployeeDashboardView = React.lazy(() => import('./components/EmployeeDashboardView'));
const CustomersView = React.lazy(() => import('./pages/master/customer'));
const SuppliersView = React.lazy(() => import('./pages/master/supplier'));
const ProductsView = React.lazy(() => import('./pages/master/product'));
const CategoriesView = React.lazy(() => import('./components/CategoriesView'));
const UnitsView = React.lazy(() => import('./components/UnitsView'));
const WarehouseMasterView = React.lazy(() => import('./components/WarehouseMasterView'));
const InventoryView = React.lazy(() => import('./pages/inventory/stock'));
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
  // Authentication & Security state
  const storedUser = authStorage.getUser();
  const initialRouteView = viewFromPath(window.location.pathname);
  const [currentView, setCurrentView] = useState<ViewType>(storedUser ? (initialRouteView || DEFAULT_AUTHENTICATED_VIEW) : 'login');
  const [userRole, setUserRole] = useState(storedUser?.role?.name || 'User');
  const [userRoleCode, setUserRoleCode] = useState(storedUser?.role?.code || 'admin');
  const [userEmail, setUserEmail] = useState(storedUser?.email || '');
  const [authUser, setAuthUser] = useState<AuthUser | null>(storedUser);
  const [isRestoringSession, setIsRestoringSession] = useState(Boolean(storedUser && authStorage.getToken()));
  
  // Connection / Online state
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Focus detail page state modifiers
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
  const [scannedSku, setScannedSku] = useState<string | null>(null);

  // Central Notification Toast engine
  const [toast, setToast] = useState<string | null>(null);
  const [toastTimeout, setToastTimeout] = useState<any>(null);

  const triggerNotification = (message: string) => {
    setToast(message);
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    const timeout = setTimeout(() => {
      setToast(null);
    }, 4000);
    setToastTimeout(timeout);
  };

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
      setUserEmail('');
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
  }, []);

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

  useEffect(() => {
    if (!authStorage.getToken()) {
      setIsRestoringSession(false);
      return;
    }

    authApi
      .me()
      .then((user) => {
        setAuthUser(user);
        setUserEmail(user.email);
        setUserRole(user.role?.name || 'User');
        setUserRoleCode(user.role?.code || 'admin');
        const routeView = viewFromPath(window.location.pathname);
        const defaultView = user.role?.code === 'employee' ? 'employee-dashboard' : (routeView || DEFAULT_AUTHENTICATED_VIEW);
        setCurrentView((view) => (view === 'login' ? defaultView : view));
      })
      .catch((error: Error) => {
        setAuthUser(null);
        setUserEmail('');
        setCurrentView('login');
        triggerNotification(error.message);
      })
      .finally(() => setIsRestoringSession(false));
  }, []);

  const applyAuthUser = (user: AuthUser) => {
    setAuthUser(user);
    setUserRole(user.role?.name || 'User');
    setUserRoleCode(user.role?.code || 'admin');
  };

  const handleLoginSuccess = (session: AuthSession) => {
    applyAuthUser(session.user);
    const defaultView = session.user.role?.code === 'employee' ? 'employee-dashboard' : 'dashboard';
    setCurrentView(defaultView);
  };

  const handleLogout = async () => {
    if (authStorage.getToken()) {
      try {
        await authApi.logout();
      } catch (error) {
        triggerNotification(error instanceof Error ? error.message : 'Logout gagal. Silakan coba lagi.');
      }
    } else {
      authStorage.clear();
    }

    setAuthUser(null);
    setUserEmail('');
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
        return (
          <EmployeeDashboardView
            onNavigate={setCurrentView}
          />
        );
      case 'customers':
        return (
          <CustomersView
            onTriggerNotification={triggerNotification}
          />
        );
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
        return (
          <SuppliersView
            onTriggerNotification={triggerNotification}
          />
        );
      case 'products':
        return (
          <ProductsView
            onTriggerNotification={triggerNotification}
          />
        );
      case 'categories':
        return (
          <CategoriesView
            onTriggerNotification={triggerNotification}
          />
        );
      case 'units':
        return (
          <UnitsView
            onTriggerNotification={triggerNotification}
          />
        );
      case 'warehouses':
        return <WarehouseMasterView onTriggerNotification={triggerNotification} />;

      // Inventory Views mapping to direct tabs
      case 'stock-management':
        return (
          <InventoryView
            initialTab="stok"
            onTriggerNotification={triggerNotification}
            onNavigate={setCurrentView}
          />
        );
      case 'incoming-goods':
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

      // Quotations & Sales
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

      // Invoicing
      case 'invoices':
        return (
          <InvoicesView
            onTriggerNotification={triggerNotification}
            onNavigate={setCurrentView}
          />
        );
      case 'payments':
        return (
          <PaymentsView
            onTriggerNotification={triggerNotification}
          />
        );

      // Purchasing & Procurement
      case 'purchase-requests':
        return (
          <PurchaseRequestView
            onTriggerNotification={triggerNotification}
          />
        );
      case 'rfq':
        return (
          <RfqView
            onTriggerNotification={triggerNotification}
          />
        );
      case 'approval-workflows':
        return (
          <ApprovalWorkflowView
            onTriggerNotification={triggerNotification}
          />
        );
      case 'users':
        return (
          <UsersView
            onTriggerNotification={triggerNotification}
          />
        );
      case 'purchase-orders':
        return (
          <PurchaseView
            onTriggerNotification={triggerNotification}
          />
        );
      case 'goods-receipts':
        return (
          <InventoryView
            initialTab="masuk"
            onTriggerNotification={triggerNotification}
            onNavigate={setCurrentView}
          />
        );
      case 'purchase-returns':
        return <ReturnsView onTriggerNotification={triggerNotification} />;
      case 'receivables-payables':
        return <ReceivablesPayablesView onTriggerNotification={triggerNotification} />;
      case 'cash-expense':
        return <CashExpenseView onTriggerNotification={triggerNotification} />;
      case 'delivery-orders':
        return <DeliveryOrdersView onTriggerNotification={triggerNotification} />;
      case 'returns':
        return <ReturnsView onTriggerNotification={triggerNotification} />;
      case 'multi-warehouse':
        return <MultiWarehouseView onTriggerNotification={triggerNotification} onNavigate={setCurrentView} />;
      case 'project-budgeting':
        return <ProjectBudgetingView onTriggerNotification={triggerNotification} />;
      case 'reminders':
        return <RemindersView onTriggerNotification={triggerNotification} />;
      case 'document-exports':
        return <DocumentExportsView onTriggerNotification={triggerNotification} />;
      case 'role-permissions':
        return <RolePermissionView onTriggerNotification={triggerNotification} />;
      case 'approval-workflows':
        return <ApprovalWorkflowView onTriggerNotification={triggerNotification} />;
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

      // Project tracker
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

      // QR Code Utility suite
      case 'qr-products':
        return (
          <QrView
            currentSubView="list"
            scannedSku={scannedSku}
            onNavigateSubView={(sub, sku) => {
              setScannedSku(sku || null);
              if (sub === 'list') {
                setCurrentView('qr-products');
              } else if (sub === 'scanner') {
                setCurrentView('scan-qr-product');
              } else {
                setCurrentView('scanned-product-detail');
              }
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
              if (sub === 'list') {
                setCurrentView('qr-products');
              } else if (sub === 'scanner') {
                setCurrentView('scan-qr-product');
              } else {
                setCurrentView('scanned-product-detail');
              }
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
            Halaman sedang dalam konstruksi pra-cetak.
          </div>
        );
    }
  };

  // Render pure Login layout if view equals 'login'
  if (currentView === 'login') {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onTriggerNotification={triggerNotification}
      />
    );
  }

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

  // Mobile Layout for Employee
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
          <button onClick={handleLogout} className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
            Keluar
          </button>
        </div>

        {/* Dynamic viewport scroll canvas container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
          <React.Suspense fallback={
            <div className="py-12 text-center">
              <div className="w-6 h-6 mx-auto border-2 border-slate-400 border-t-transparent rounded-full animate-spin mb-2.5" />
            </div>
          }>
            {renderContent()}
          </React.Suspense>
        </div>

        {/* Floating System-wide toast notification overlay */}
        {toast && (
          <div className="fixed top-5 right-5 bg-slate-900 text-white rounded-full shadow-xl px-5 py-2.5 flex items-center gap-2.5 z-50 animate-in fade-in slide-in-from-top-5 duration-200 whitespace-nowrap">
            <CheckCircle2 size={15} className="text-white stroke-[3]" />
            <span className="font-sans font-bold text-[11px]">{toast}</span>
          </div>
        )}
      </div>
    );
  }

  // Render Full Dashboard Layout with Sidebar and Topbar Navigation
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* 1. Left Fixed Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={(v) => {
          setCurrentView(v);
          // Auto-reset filters
          if (v === 'projects') {
            setSelectedProjectId(null);
          }
        }}
        onLogout={handleLogout}
        userRoleName={userRole}
        userRoleCode={userRoleCode}
        userPermissions={authUser?.role?.permissions}
      />

      {/* 2. Main content block viewport container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!isOnline && (
          <div className="bg-rose-600 text-white text-[10px] font-sans font-bold text-center py-1.5 px-4 flex items-center justify-center gap-2 shrink-0 animate-in slide-in-from-top duration-300">
            <WifiOff size={12} className="animate-pulse" />
            <span>Koneksi internet terputus. Bekerja dalam mode offline.</span>
          </div>
        )}
        {/* Top Header bar */}
        <Topbar
          currentView={currentView}
          userRole={userRole}
          onTriggerNotification={triggerNotification}
          userEmail={userEmail}
          userName={authUser?.name}
        />

        {/* Dynamic viewport scroll canvas container */}
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

      {/* Floating System-wide toast notification overlay */}
      {toast && (
        <div className="fixed top-5 right-5 bg-slate-900 text-white rounded-lg shadow-xl p-3.5 flex items-center gap-2.5 z-50 animate-in fade-in slide-in-from-top-5 duration-200">
          <CheckCircle2 size={15} className="text-white stroke-[3]" />
          <span className="font-sans font-bold text-[11px]">{toast}</span>
        </div>
      )}
    </div>
  );
}
