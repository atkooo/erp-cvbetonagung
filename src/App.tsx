/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  initialCustomers,
  initialSuppliers,
  initialProducts,
  initialStockMovements,
  initialQuotations,
  initialSalesOrders,
  initialInvoices,
  initialPayments,
  initialPurchaseOrders,
  initialProjects
} from './dummyData';
import type { AuthSession, AuthUser, Customer, Supplier, Product, StockMovement, SalesOrder, Quotation, Invoice, Payment, PurchaseOrder, Project, ViewType } from './types';
import { authApi, authStorage } from './services/api';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Feature sub-modules
import DashboardView from './components/DashboardView';
import CustomersView from './components/CustomersView';
import SuppliersView from './components/SuppliersView';
import ProductsView from './components/ProductsView';
import CategoriesView from './components/CategoriesView';
import InventoryView from './components/InventoryView';
import SalesView from './components/SalesView';
import InvoicesView from './components/InvoicesView';
import PaymentsView from './components/PaymentsView';
import PurchaseView from './components/PurchaseView';
import ProjectsView from './components/ProjectsView';
import QrView from './components/QrView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import EmployeeMasterView from './components/EmployeeMasterView';
import DeliveryOrdersView from './components/DeliveryOrdersView';
import ProductionWorkOrderView from './components/ProductionWorkOrderView';
import BomCostingView from './components/BomCostingView';
import StockOpnameView from './components/StockOpnameView';
import ApprovalWorkflowView from './components/ApprovalWorkflowView';
import AuditLogView from './components/AuditLogView';
import RemindersView from './components/RemindersView';
import DocumentExportsView from './components/DocumentExportsView';
import ReturnsView from './components/ReturnsView';
import ProjectBudgetingView from './components/ProjectBudgetingView';
import MultiWarehouseView from './components/MultiWarehouseView';
import ReceivablesPayablesView from './components/ReceivablesPayablesView';
import RolePermissionView from './components/RolePermissionView';

import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Authentication & Security state
  const storedUser = authStorage.getUser();
  const [currentView, setCurrentView] = useState<ViewType>(storedUser ? 'dashboard' : 'login');
  const [userRole, setUserRole] = useState(storedUser?.role?.name || 'User');
  const [userRoleCode, setUserRoleCode] = useState(storedUser?.role?.code || 'admin');
  const [userEmail, setUserEmail] = useState(storedUser?.email || '');
  const [authUser, setAuthUser] = useState<AuthUser | null>(storedUser);
  const [isRestoringSession, setIsRestoringSession] = useState(Boolean(storedUser && authStorage.getToken()));

  // Global Mock Database States
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(initialStockMovements);
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(initialSalesOrders);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  // Focus detail page state modifiers
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
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
        setCurrentView((view) => (view === 'login' ? 'dashboard' : view));
      })
      .catch((error: Error) => {
        setAuthUser(null);
        setUserEmail('');
        setCurrentView('login');
        triggerNotification(error.message);
      })
      .finally(() => setIsRestoringSession(false));
  }, []);

  // -------------------------------------------------------------
  // DATA MANIPULATION HANDLERS (Simulated CRUD operations)
  // -------------------------------------------------------------

  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  const handleAddSupplier = (newSupplier: Supplier) => {
    setSuppliers((prev) => [newSupplier, ...prev]);
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleAddStockMovement = (newMovement: StockMovement) => {
    setStockMovements((prev) => [newMovement, ...prev]);
    // Synchronize product quantity
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (p.sku === newMovement.sku) {
          const delta = newMovement.type === 'Masuk' ? newMovement.quantity : -newMovement.quantity;
          const nextStock = Math.max(p.stock + delta, 0);
          let nextStatus: 'Aman' | 'Menipis' | 'Habis' = 'Aman';
          if (nextStock === 0) {
            nextStatus = 'Habis';
          } else if (nextStock <= p.minStock) {
            nextStatus = 'Menipis';
          }
          return { ...p, stock: nextStock, status: nextStatus };
        }
        return p;
      })
    );
  };

  const handleAddQuotation = (newQuotation: Quotation) => {
    setQuotations((prev) => [newQuotation, ...prev]);
  };

  const handleAddSalesOrder = (newSO: SalesOrder) => {
    setSalesOrders((prev) => [newSO, ...prev]);
    // Produce mock invoice
    const nextInvNum = `INV-2026-05-10${invoices.length + 8}`;
    const newInv: Invoice = {
      id: `inv${invoices.length + 8}`,
      invoiceNumber: nextInvNum,
      customerName: newSO.customerName,
      date: newSO.date,
      dueDate: '2026-06-30',
      total: newSO.total,
      paidAmount: 0,
      status: 'Belum Lunas',
    };
    setInvoices((prev) => [newInv, ...prev]);
  };

  const handleAddPurchaseOrder = (newPO: PurchaseOrder) => {
    setPurchaseOrders((prev) => [newPO, ...prev]);
  };

  const handleVerifyPayment = (paymentId: string) => {
    setPayments((prevPayments) =>
      prevPayments.map((p) => {
        if (p.id === paymentId) {
          // Sync invoice too
          setInvoices((prevInvoices) =>
            prevInvoices.map((inv) => {
              if (inv.invoiceNumber === p.invoiceNumber) {
                const nextPaid = inv.paidAmount + p.amount;
                const nextStatus = nextPaid >= inv.total ? 'Lunas' : 'Sebagian Dibayar';
                return { ...inv, paidAmount: nextPaid, status: nextStatus };
              }
              return inv;
            })
          );
          return { ...p, status: 'Verified' };
        }
        return p;
      })
    );
  };

  const handleAddTimelineEvent = (projectId: string, date: string, stage: string, desc: string) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id === projectId) {
          const nextEvent = {
            date,
            stage,
            description: desc,
            icon: stage.includes('Survey') ? 'Compass' : 'CheckCircle',
          };
          // Adjust general progress percentage based on stage name
          let nextProgress = proj.progress;
          if (stage.includes('Selesai')) nextProgress = 100;
          else if (stage.includes('Pemasangan')) nextProgress = 85;
          else if (stage.includes('Pengiriman')) nextProgress = 70;
          else if (stage.includes('Produksi')) nextProgress = 45;

          let nextStatus: Project['status'] = proj.status;
          if (stage.includes('Selesai')) nextStatus = 'Selesai';
          else if (stage.includes('Pemasangan')) nextStatus = 'Pemasangan';
          else if (stage.includes('Pengiriman')) nextStatus = 'Pengiriman';
          else if (stage.includes('Produksi')) nextStatus = 'Produksi';
          else if (stage.includes('Survey')) nextStatus = 'Survey';

          return {
            ...proj,
            progress: nextProgress,
            status: nextStatus,
            timeline: [...proj.timeline, nextEvent],
          };
        }
        return proj;
      })
    );
  };

  const handleUpdateProductStock = (sku: string, diff: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.sku === sku) {
          const nextStock = Math.max(p.stock + diff, 0);
          let nextStatus: 'Aman' | 'Menipis' | 'Habis' = 'Aman';
          if (nextStock === 0) {
            nextStatus = 'Habis';
          } else if (nextStock <= p.minStock) {
            nextStatus = 'Menipis';
          }
          return { ...p, stock: nextStock, status: nextStatus };
        }
        return p;
      })
    );
  };

  const applyAuthUser = (user: AuthUser) => {
    setAuthUser(user);
    setUserRole(user.role?.name || 'User');
    setUserRoleCode(user.role?.code || 'admin');
  };

  const handleLoginSuccess = (session: AuthSession) => {
    applyAuthUser(session.user);
    setCurrentView('dashboard');
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
            customers={customers}
            suppliers={suppliers}
            products={products}
            salesOrders={salesOrders}
            invoices={invoices}
            projects={projects}
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
      case 'customers':
        return (
          <CustomersView
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onTriggerNotification={triggerNotification}
          />
        );
      case 'employees':
        return <EmployeeMasterView onTriggerNotification={triggerNotification} />;
      case 'suppliers':
        return (
          <SuppliersView
            suppliers={suppliers}
            onAddSupplier={handleAddSupplier}
            onTriggerNotification={triggerNotification}
          />
        );
      case 'products':
        return (
          <ProductsView
            products={products}
            onAddProduct={handleAddProduct}
            onTriggerNotification={triggerNotification}
          />
        );
      case 'categories':
        return (
          <CategoriesView
            products={products}
            onTriggerNotification={triggerNotification}
          />
        );

      // Inventory Views mapping to direct tabs
      case 'stock-management':
        return (
          <InventoryView
            initialTab="stok"
            products={products}
            stockMovements={stockMovements}
            onAddStockMovement={handleAddStockMovement}
            onUpdateProductStock={handleUpdateProductStock}
            onTriggerNotification={triggerNotification}
          />
        );
      case 'incoming-goods':
        return (
          <InventoryView
            initialTab="masuk"
            products={products}
            stockMovements={stockMovements}
            onAddStockMovement={handleAddStockMovement}
            onUpdateProductStock={handleUpdateProductStock}
            onTriggerNotification={triggerNotification}
          />
        );
      case 'outgoing-goods':
        return (
          <InventoryView
            initialTab="keluar"
            products={products}
            stockMovements={stockMovements}
            onAddStockMovement={handleAddStockMovement}
            onUpdateProductStock={handleUpdateProductStock}
            onTriggerNotification={triggerNotification}
          />
        );
      case 'stock-movement-history':
        return (
          <InventoryView
            initialTab="riwayat"
            products={products}
            stockMovements={stockMovements}
            onAddStockMovement={handleAddStockMovement}
            onUpdateProductStock={handleUpdateProductStock}
            onTriggerNotification={triggerNotification}
          />
        );

      // Quotations & Sales
      case 'quotations':
        return (
          <SalesView
            type="quotation"
            quotations={quotations}
            salesOrders={salesOrders}
            onAddQuotation={handleAddQuotation}
            onAddSalesOrder={handleAddSalesOrder}
            onTriggerNotification={triggerNotification}
            onNavigate={setCurrentView}
          />
        );
      case 'sales-orders':
        return (
          <SalesView
            type="sales-order"
            quotations={quotations}
            salesOrders={salesOrders}
            onAddQuotation={handleAddQuotation}
            onAddSalesOrder={handleAddSalesOrder}
            onTriggerNotification={triggerNotification}
            onNavigate={setCurrentView}
          />
        );

      // Invoicing
      case 'invoices':
        return (
          <InvoicesView
            invoices={invoices}
            onTriggerNotification={triggerNotification}
            onNavigate={setCurrentView}
          />
        );
      case 'payments':
        return (
          <PaymentsView
            payments={payments}
            onVerifyPayment={handleVerifyPayment}
            onTriggerNotification={triggerNotification}
          />
        );

      // Purchasing
      case 'purchase-orders':
        return (
          <PurchaseView
            purchaseOrders={purchaseOrders}
            onAddPurchaseOrder={handleAddPurchaseOrder}
            onTriggerNotification={triggerNotification}
            products={products}
          />
        );
      case 'receivables-payables':
        return <ReceivablesPayablesView onTriggerNotification={triggerNotification} />;
      case 'delivery-orders':
        return <DeliveryOrdersView onTriggerNotification={triggerNotification} />;
      case 'returns':
        return <ReturnsView onTriggerNotification={triggerNotification} />;
      case 'multi-warehouse':
        return <MultiWarehouseView onTriggerNotification={triggerNotification} />;
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
        return <ProductionWorkOrderView onTriggerNotification={triggerNotification} />;
      case 'bom-costing':
        return <BomCostingView onTriggerNotification={triggerNotification} />;

      // Project tracker
      case 'projects':
      case 'project-detail':
        return (
          <ProjectsView
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProjectId={setSelectedProjectId}
            onNavigate={setCurrentView}
            onTriggerNotification={triggerNotification}
            onAddTimelineEvent={handleAddTimelineEvent}
          />
        );

      // QR Code Utility suite
      case 'qr-products':
        return (
          <QrView
            products={products}
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
            onUpdateProductStock={handleUpdateProductStock}
          />
        );
      case 'scan-qr-product':
      case 'scanned-product-detail':
        return (
          <QrView
            products={products}
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
            onUpdateProductStock={handleUpdateProductStock}
          />
        );

      case 'reports':
        return <ReportsView onTriggerNotification={triggerNotification} />;
      case 'settings':
        return <SettingsView onTriggerNotification={triggerNotification} />;

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 mx-auto border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Memulihkan sesi ERP</p>
        </div>
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
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Floating System-wide toast notification overlay */}
      {toast && (
        <div className="fixed bottom-5 right-5 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 z-50 animate-bounce duration-150">
          <CheckCircle2 size={18} className="text-cyan-405 text-cyan-400 stroke-[3]" />
          <span className="font-sans font-bold text-xs">{toast}</span>
        </div>
      )}
    </div>
  );
}
