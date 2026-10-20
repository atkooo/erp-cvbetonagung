/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, UserCog, RefreshCw, Key, ShieldAlert, Lock, Search, ShieldCheck as ShieldIcon, MoreVertical, Eye, Edit2, Shield, Trash2, Check
} from '@/src/components/icons';
import Swal from 'sweetalert2';
import { identityApi } from '../features/identity/api';
import { Role, Permission } from '../features/identity/types';

interface RolePermissionViewProps {
  onTriggerNotification: (message: string) => void;
}

const Panel = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const Header = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <Panel className="p-5">
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg">{icon}</div>
      <div>
        <h3 className="font-sans font-bold text-sm text-slate-800">{title}</h3>
        <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
      </div>
    </div>
  </Panel>
);

const StatusPill = ({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'cyan' | 'amber' | 'emerald' | 'rose' | 'indigo' }) => {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${tones[tone]}`}>
      {children}
    </span>
  );
};

const HIDDEN_LEGACY_MODULES = new Set([
  'approvals',
  'sales',
  'purchasing',
  'inventory',
  'finance',
  'production',
]);

  const MODULE_LABELS: Record<string, string> = {
    // Coarse / Core modules
    users: 'Pengguna Sistem',
    roles: 'Hak Akses (RBAC)',
    employees: 'Data Karyawan',
    payroll: 'Penggajian (Payroll)',
    customers: 'Pelanggan (Customer)',
    suppliers: 'Pemasok (Supplier)',
    products: 'Master Produk',
    product_categories: 'Kategori Produk',
    units: 'Satuan (UoM)',
    discounts: 'Skema Diskon',
    warehouses: 'Master Gudang',
    storage_locations: 'Lokasi Gudang',
    inventory: 'Persediaan (Inventory)',
    sales: 'Penjualan (Sales)',
    purchasing: 'Pengadaan (Purchasing)',
    projects: 'Manajemen Proyek',
    finance: 'Keuangan (Finance)',
    production: 'Manufaktur & Produksi',
    reports: 'Pusat Laporan',
    settings: 'Pengaturan Sistem',

    // Granular Sales & Orders
    pos: 'Kasir (POS)',
    quotations: 'Penawaran (Quotation)',
    sales_orders: 'Sales Order (SO)',
    delivery_orders: 'Surat Jalan (DO)',
    sales_returns: 'Retur Penjualan',

    // Granular Purchasing
    purchase_requests: 'Permintaan Pembelian (PR)',
    rfqs: 'Penawaran Pemasok (RFQ)',
    purchase_orders: 'Purchase Order (PO)',
    goods_receipts: 'Penerimaan Barang (GR)',
    purchase_returns: 'Retur Pembelian',

    // Granular Inventory
    inventory_stocks: 'Stok Persediaan',
    incoming_goods: 'Barang Masuk',
    outgoing_goods: 'Barang Keluar',
    stock_movements: 'Mutasi Stok',
    berita_acara_gudang: 'Berita Acara (BAG)',
    stock_opname: 'Stock Opname',
    qr_products: 'Barcode Produk',
    qr_scanner: 'Pemindai Barcode',

    // Granular Production & Projects
    production_work_orders: 'Work Order (WO)',
    bom_costing: 'Bill of Materials (BOM)',
    project_budgeting: 'Anggaran Proyek (RAB)',

    // Granular Finance
    accounts: 'Kas & Bank',
    cash_expense: 'Beban Operasional',
    invoices: 'Faktur (Invoice)',
    payments: 'Penerimaan Pembayaran',
    accounts_receivable: 'Piutang (AR)',
    accounts_payable: 'Hutang (AP)',
    finance_reports: 'Laporan Keuangan',

    // Granular HRD
    attendance: 'Presensi Karyawan',
    attendance_scanner: 'Terminal Presensi',
    leave: 'Manajemen Cuti',
    leave_types: 'Kategori Cuti',
    employee_loans: 'Pinjaman Karyawan',

    // Granular Control
    audit_logs: 'Audit Log',
    reminders: 'Pengingat Sistem',
  };

  const MODULE_CATEGORIES: Record<string, string> = {
    // Sales
    sales: 'sales',
    pos: 'sales',
    quotations: 'sales',
    sales_orders: 'sales',
    delivery_orders: 'sales',
    sales_returns: 'sales',

    // Purchasing
    purchasing: 'purchasing',
    purchase_requests: 'purchasing',
    rfqs: 'purchasing',
    purchase_orders: 'purchasing',
    goods_receipts: 'purchasing',
    purchase_returns: 'purchasing',

    // Inventory
    inventory: 'inventory',
    inventory_stocks: 'inventory',
    incoming_goods: 'inventory',
    outgoing_goods: 'inventory',
    stock_movements: 'inventory',
    berita_acara_gudang: 'inventory',
    stock_opname: 'inventory',
    storage_locations: 'inventory',
    qr_products: 'inventory',
    qr_scanner: 'inventory',

    // Finance
    finance: 'finance',
    accounts: 'finance',
    cash_expense: 'finance',
    invoices: 'finance',
    payments: 'finance',
    accounts_receivable: 'finance',
    accounts_payable: 'finance',
    finance_reports: 'finance',

    // Production & Projects
    production: 'production_projects',
    projects: 'production_projects',
    production_work_orders: 'production_projects',
    bom_costing: 'production_projects',
    project_budgeting: 'production_projects',

    // HRD
    employees: 'hrd',
    payroll: 'hrd',
    attendance: 'hrd',
    attendance_scanner: 'hrd',
    leave: 'hrd',
    leave_types: 'hrd',
    employee_loans: 'hrd',

    // Master & System
    users: 'master_system',
    roles: 'master_system',
    customers: 'master_system',
    suppliers: 'master_system',
    products: 'master_system',
    product_categories: 'master_system',
    units: 'master_system',
    discounts: 'master_system',
    warehouses: 'master_system',
    reports: 'master_system',
    settings: 'master_system',
    audit_logs: 'master_system',
    reminders: 'master_system',
  };

  const CATEGORIES = [
    { id: 'all', label: 'Semua Modul' },
    { id: 'sales', label: 'Penjualan (Sales)' },
    { id: 'purchasing', label: 'Pengadaan (Purchasing)' },
    { id: 'inventory', label: 'Persediaan (Inventory)' },
    { id: 'finance', label: 'Keuangan (Finance)' },
    { id: 'production_projects', label: 'Produksi & Proyek' },
    { id: 'hrd', label: 'Kepegawaian (HRD)' },
    { id: 'master_system', label: 'Master & Sistem' },
  ];

  const ACTION_LABELS: Record<string, string> = {
    view: 'Lihat',
    create: 'Tambah',
    update: 'Ubah',
    delete: 'Hapus',
    approve: 'Setujui',
  };

  const getModuleLabel = (module: string) => MODULE_LABELS[module] || module;
  const getActionLabel = (action: string) => ACTION_LABELS[action] || action;

  const BulkActionDropdown = ({ onSelect, disabled }: { onSelect: (level: 'none' | 'read' | 'edit' | 'full') => void, disabled: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="relative inline-block text-left" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`p-1.5 rounded-md focus:outline-none transition-colors ${isOpen ? 'bg-cyan-50 text-cyan-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
          title="Opsi Massal"
        >
          <MoreVertical size={16} />
        </button>
        {isOpen && !disabled && (
          <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-lg shadow-lg border border-slate-100 z-50 overflow-hidden py-1">
            <button
              onClick={() => { onSelect('full'); setIsOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <Shield size={13} className="opacity-70" />
              Full
            </button>
            <button
              onClick={() => { onSelect('edit'); setIsOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
            >
              <Edit2 size={13} className="opacity-70" />
              Edit
            </button>
            <button
              onClick={() => { onSelect('read'); setIsOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 transition-colors"
            >
              <Eye size={13} className="opacity-70" />
              Read
            </button>
            <div className="my-1 border-t border-slate-100"></div>
            <button
              onClick={() => { onSelect('none'); setIsOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 size={13} className="opacity-70" />
              Reset
            </button>
          </div>
        )}
      </div>
    );
};

export default function RolePermissionView({ onTriggerNotification }: RolePermissionViewProps) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleSearchQuery, setRoleSearchQuery] = useState('');
    const [isUpdating, setIsUpdating] = useState<string | null>(null); // roleId-permId key
    const [selectedRoleId, setSelectedRoleId] = useState<string>('');

    useEffect(() => {
      fetchData();
    }, []);

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [rolesData, permsData] = await Promise.all([
          identityApi.getRoles(),
          identityApi.getPermissions()
        ]);
        setRoles(rolesData);
        setPermissions(permsData);
        setSelectedRoleId((current) => current || rolesData[0]?.id || '');
      } catch (error) {
        console.error('Error loading RBAC data:', error);
        onTriggerNotification('Gagal memuat data hak akses.');
      } finally {
        setIsLoading(false);
      }
    };

    // Group unique permission items by module & action to avoid duplicates in view
    const uniquePermissionsMap = permissions.reduce((acc, perm) => {
      const key = `${perm.module}:${perm.action}`;
      if (!acc[key]) {
        acc[key] = perm;
      }
      return acc;
    }, {} as Record<string, Permission>);

    const actionOrder = ['view', 'create', 'update', 'delete', 'approve'];
    const uniquePermissionsList = Object.values(uniquePermissionsMap).sort((a, b) => {
      const moduleCompare = getModuleLabel(a.module).localeCompare(getModuleLabel(b.module));
      if (moduleCompare !== 0) return moduleCompare;
      return actionOrder.indexOf(a.action) - actionOrder.indexOf(b.action);
    });

    const isPermissionChecked = (role: Role, perm: Permission): boolean => {
      return role.permissions.some(
        p => (p.id === perm.id || (p.module === perm.module && p.action === perm.action)) && p.accessLevel !== 'none'
      );
    };

    const getActiveModuleCount = (role: Role) => {
      return new Set(
        role.permissions
          .filter(p => p.accessLevel !== 'none' && !HIDDEN_LEGACY_MODULES.has(p.module))
          .map(p => p.module)
      ).size;
    };

    const getActivePermissionCount = (role: Role) => {
      return role.permissions.filter(
        p => p.accessLevel !== 'none' && !HIDDEN_LEGACY_MODULES.has(p.module)
      ).length;
    };

    const handleTogglePermission = async (role: Role, perm: Permission, enable: boolean) => {
      const updateKey = `${role.id}-${perm.id}`;
      setIsUpdating(updateKey);

      try {
        if (enable) {
          await identityApi.syncRolePermission({
            role_id: role.id,
            permission_id: perm.id,
            access_level: 'full',
          });
          onTriggerNotification(`Mengaktifkan hak akses ${getActionLabel(perm.action)} untuk Role ${role.name}.`);

          setRoles(prevRoles => prevRoles.map(r => {
            if (r.id !== role.id) return r;
            const existIndex = r.permissions.findIndex(p => p.id === perm.id || (p.module === perm.module && p.action === perm.action));
            const updatedPerm: Permission = { ...perm, accessLevel: 'full' };
            const newPermissions = existIndex > -1
              ? r.permissions.map((p, idx) => idx === existIndex ? updatedPerm : p)
              : [...r.permissions, updatedPerm];
            return { ...r, permissions: newPermissions };
          }));
        } else {
          await identityApi.deleteRolePermission(role.id, perm.id).catch(() => { });
          onTriggerNotification(`Mencabut hak akses ${getActionLabel(perm.action)} dari Role ${role.name}.`);

          setRoles(prevRoles => prevRoles.map(r => {
            if (r.id !== role.id) return r;
            return {
              ...r,
              permissions: r.permissions.filter(p => p.id !== perm.id && !(p.module === perm.module && p.action === perm.action)),
            };
          }));
        }
      } catch (error) {
        console.error('Error toggling role permission:', error);
        Swal.fire('Gagal', 'Terjadi kesalahan saat memperbarui hak akses.', 'error');
      } finally {
        setIsUpdating(null);
      }
    };

    const handleBulkAccessLevel = async (role: Role, row: any, preset: 'none' | 'read' | 'edit' | 'full') => {
      const updateKey = `${role.id}-${row.module}-bulk`;
      setIsUpdating(updateKey);

      const allowedActions = preset === 'full'
        ? ['view', 'create', 'update', 'delete', 'approve']
        : preset === 'edit'
          ? ['view', 'create', 'update']
          : preset === 'read'
            ? ['view']
            : [];

      try {
        const actionsList = ['view', 'create', 'update', 'delete', 'approve'];
        const promises: Promise<any>[] = [];

        for (const action of actionsList) {
          const perm = row.permissions[action] as Permission | undefined;
          if (!perm) continue;

          const isCurrentlyActive = role.permissions.some(
            p => (p.id === perm.id || (p.module === perm.module && p.action === perm.action)) && p.accessLevel !== 'none'
          );
          const shouldBeActive = allowedActions.includes(action);

          if (shouldBeActive && !isCurrentlyActive) {
            promises.push(
              identityApi.syncRolePermission({
                role_id: role.id,
                permission_id: perm.id,
                access_level: 'full',
              })
            );
          } else if (!shouldBeActive && isCurrentlyActive) {
            promises.push(
              identityApi.deleteRolePermission(role.id, perm.id).catch(() => { })
            );
          }
        }

        await Promise.all(promises);

        const presetLabels: Record<string, string> = {
          full: 'Full',
          edit: 'Edit',
          read: 'Read',
          none: 'Reset',
        };
        onTriggerNotification(`Berhasil menerapkan akses ${presetLabels[preset]} pada modul ${row.label} (${role.name}).`);

        const rolesData = await identityApi.getRoles();
        setRoles(rolesData);
      } catch (error) {
        console.error('Error during bulk update:', error);
        Swal.fire('Gagal', 'Terjadi kesalahan saat menerapkan hak akses massal.', 'error');
      } finally {
        setIsUpdating(null);
      }
    };

    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const selectedRole = roles.find(role => role.id === selectedRoleId) || roles[0];
    const moduleRows = Array.from(new Set(uniquePermissionsList.map(permission => permission.module)))
      .filter(module => !HIDDEN_LEGACY_MODULES.has(module))
      .map((module) => ({
        module,
        label: getModuleLabel(module),
        category: MODULE_CATEGORIES[module] || 'master_system',
        permissions: actionOrder.reduce<Record<string, Permission | undefined>>((acc, action) => {
          acc[action] = uniquePermissionsList.find(permission => permission.module === module && permission.action === action);
          return acc;
        }, {}),
      }))
      .filter(row => {
        const matchesCategory = selectedCategory === 'all' || row.category === selectedCategory;
        const matchesSearch = (
          row.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
          actionOrder.some(action => getActionLabel(action).toLowerCase().includes(searchQuery.toLowerCase()))
        );
        return matchesCategory && matchesSearch;
      });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    const totalPages = Math.ceil(moduleRows.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRows = moduleRows.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
      setCurrentPage(1);
    }, [searchQuery, selectedRoleId, selectedCategory]);

    const filteredRoles = roles.filter(r =>
      r.name.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(roleSearchQuery.toLowerCase()))
    );

    return (
      <div className="space-y-4 text-xs font-sans">

        {/* Split Layout: Master (Roles) and Detail (Matrix) */}
        <div className="flex flex-col md:flex-row gap-6">

          {/* Left Side: Roles Master List */}
          <div className="w-full md:w-1/3 xl:w-1/4 flex flex-col gap-2 shrink-0">
            <div className="mb-1 flex items-center justify-between px-1">
              <h4 className="font-bold text-slate-800 text-sm">Daftar Role</h4>
              <span className="text-[10px] bg-slate-200/50 text-slate-600 px-2 py-0.5 rounded-full font-bold">{roles.length} Role</span>
            </div>

            <Panel className="overflow-hidden bg-white shadow-sm border-slate-200">
              <div className="p-3 border-b border-slate-100">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                  <Search size={12} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari Role (role)..."
                    className="bg-transparent focus:outline-none text-xs w-full text-slate-700"
                    value={roleSearchQuery}
                    onChange={(e) => setRoleSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col max-h-[calc(100vh-270px)] overflow-y-auto scrollbar-thin">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 animate-pulse bg-slate-50 border-b border-slate-100 h-20" />
                  ))
                ) : filteredRoles.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-[10px]">
                    Role tidak ditemukan.
                  </div>
                ) : (
                  filteredRoles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`text-left p-4 border-b border-slate-100 last:border-b-0 transition-all ${selectedRole?.id === role.id
                        ? 'bg-cyan-50/50 border-l-4 border-l-cyan-500'
                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <UserCog size={14} className={selectedRole?.id === role.id ? "text-cyan-600" : "text-slate-400"} />
                          <h4 className={`font-bold ${selectedRole?.id === role.id ? 'text-cyan-800' : 'text-slate-700'}`}>
                            {role.name}
                          </h4>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight mb-2 line-clamp-1" title={role.description || ''}>
                        {role.description || 'Tidak ada deskripsi.'}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${selectedRole?.id === role.id ? 'text-cyan-600 bg-white border-cyan-200' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                          {role.code}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">
                          {getActiveModuleCount(role)} Modul / {getActivePermissionCount(role)} Hak
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Panel>
          </div>

          {/* Right Side: Matrix Panel */}
          <div className="flex-1 flex flex-col min-w-0">
            <Panel className="overflow-hidden flex flex-col shadow-sm border-slate-200">
              <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-500">
                    <Key size={14} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                      Hak Akses: {selectedRole?.name || '-'}
                    </h4>
                    {selectedRole && (
                      <span className="font-mono text-[9px] uppercase font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {selectedRole.code}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-white border rounded-lg px-2.5 py-1.5 w-full md:w-64">
                    <Search size={12} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari modul..."
                      className="bg-transparent focus:outline-none text-xs w-full text-slate-700"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={fetchData}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
                    title="Muat Ulang"
                  >
                    <RefreshCw size={13} className={isLoading ? 'animate-spin text-cyan-600' : ''} />
                  </button>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {CATEGORIES.map(cat => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1 rounded-md text-[11px] transition-colors whitespace-nowrap ${isSelected
                        ? 'bg-cyan-600 text-white font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
                        }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {isLoading ? (
                <div className="flex justify-center py-24">
                  <RefreshCw className="animate-spin text-slate-400" size={24} />
                </div>
              ) : !selectedRole ? (
                <div className="text-center py-24 text-slate-400">
                  <ShieldAlert size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-bold">Belum ada role yang bisa dikonfigurasi.</p>
                </div>
              ) : moduleRows.length === 0 ? (
                <div className="text-center py-24 text-slate-400">
                  <ShieldAlert size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-bold">Tidak ada permission/modul yang sesuai pencarian.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-190">
                    <thead>
                      <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                        <th className="p-3.5 pl-5 min-w-55">Modul</th>
                        <th className="p-3.5 w-32 font-mono">Kode</th>
                        {actionOrder.map(action => (
                          <th key={action} className="p-3.5 text-center font-bold text-slate-700">
                            {getActionLabel(action)}
                          </th>
                        ))}
                        <th className="p-3.5 text-right font-bold text-slate-700 pr-5">Set Akses</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedRows.map(row => (
                        <tr key={row.module} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-3.5 pl-5">
                            <div className="flex items-center gap-2">
                              <Lock size={12} className="text-slate-400" />
                              <span className="font-bold text-slate-700 text-xs">{row.label}</span>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-[10px] text-slate-500 uppercase">{row.module}</td>
                          {actionOrder.map(action => {
                            const permission = row.permissions[action];

                            if (!permission) {
                              return (
                                <td key={action} className="p-3 text-center text-slate-300">
                                  -
                                </td>
                              );
                            }

                            const isChecked = isPermissionChecked(selectedRole, permission);
                            const isCellUpdating = isUpdating === `${selectedRole.id}-${permission.id}`;

                            return (
                              <td key={action} className="p-2.5 text-center relative">
                                {isCellUpdating && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded z-10">
                                    <RefreshCw size={12} className="animate-spin text-cyan-600" />
                                  </div>
                                )}
                                <label
                                  className="inline-flex items-center justify-center cursor-pointer group p-1"
                                  title={`${getActionLabel(action)} - ${row.label}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={isCellUpdating || isLoading || isUpdating === `${selectedRole.id}-${row.module}-bulk`}
                                    onChange={(e) => handleTogglePermission(selectedRole, permission, e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isChecked
                                    ? 'bg-cyan-600 border-cyan-600 text-white shadow-xs group-hover:bg-cyan-700 group-hover:border-cyan-700'
                                    : 'bg-white border-slate-300 text-transparent group-hover:border-slate-400 hover:bg-slate-50'
                                    } peer-disabled:opacity-40 peer-disabled:cursor-not-allowed`}>
                                    <Check size={13} strokeWidth={3} className={isChecked ? 'block' : 'hidden'} />
                                  </div>
                                </label>
                              </td>
                            );
                          })}
                          <td className="p-3 pr-5 text-right relative">
                            {isUpdating === `${selectedRole.id}-${row.module}-bulk` && (
                              <div className="absolute inset-0 flex items-center justify-end pr-8 bg-white/50 rounded z-10">
                                <RefreshCw size={12} className="animate-spin text-cyan-600" />
                              </div>
                            )}
                            <BulkActionDropdown
                              onSelect={(level) => handleBulkAccessLevel(selectedRole, row, level)}
                              disabled={isUpdating !== null || isLoading}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-slate-200">
                      <div className="text-[10px] text-slate-400 font-mono">
                        Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, moduleRows.length)} dari {moduleRows.length} data
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold shadow-sm"
                        >
                          Prev
                        </button>
                        <span className="text-slate-500 px-2">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold shadow-sm"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500 flex items-center justify-between">
                <span>
                  Total: <b>{moduleRows.length} modul</b>
                </span>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    );
}