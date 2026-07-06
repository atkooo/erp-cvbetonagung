/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, UserCog, RefreshCw, Key, ShieldAlert, Lock, Search, ShieldCheck as ShieldIcon, MoreVertical, Eye, Edit2, Shield, Trash2
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

const MODULE_LABELS: Record<string, string> = {
  users: 'User Akun',
  roles: 'Role & Permission',
  employees: 'Karyawan',
  customers: 'Customer',
  suppliers: 'Supplier',
  products: 'Produk',
  inventory: 'Inventory',
  sales: 'Sales & Orders',
  purchasing: 'Purchasing',
  projects: 'Proyek',
  finance: 'Finance',
  production: 'Produksi',
  approvals: 'Approval',
  reports: 'Laporan',
  settings: 'Pengaturan',
};

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
        <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 z-50 overflow-hidden py-1.5">
          <button
            onClick={() => { onSelect('full'); setIsOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            <Shield size={14} className="opacity-70" />
            Full Access
          </button>
          <button
            onClick={() => { onSelect('edit'); setIsOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 transition-colors"
          >
            <Edit2 size={14} className="opacity-70" />
            Edit Access
          </button>
          <button
            onClick={() => { onSelect('read'); setIsOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-50 transition-colors"
          >
            <Eye size={14} className="opacity-70" />
            Read Access
          </button>
          <div className="my-1.5 border-t border-slate-100"></div>
          <button
            onClick={() => { onSelect('none'); setIsOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 size={14} className="opacity-70" />
            Hapus Semua
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

  const getAccessLevel = (role: Role, perm: Permission): 'none' | 'read' | 'edit' | 'full' => {
    const matched = role.permissions.find(p => p.module === perm.module && p.action === perm.action);
    return matched ? matched.accessLevel : 'none';
  };

  const getActiveModuleCount = (role: Role) => {
    return new Set(role.permissions.filter(p => p.accessLevel !== 'none').map(p => p.module)).size;
  };

  const getActivePermissionCount = (role: Role) => {
    return role.permissions.filter(p => p.accessLevel !== 'none').length;
  };

  const handleAccessLevelChange = async (role: Role, perm: Permission, nextLevel: 'none' | 'read' | 'edit' | 'full') => {
    const current = getAccessLevel(role, perm);
    if (current === nextLevel) return;

    const updateKey = `${role.id}-${perm.id}`;
    setIsUpdating(updateKey);

    try {
      if (nextLevel === 'none') {
        // Find the specific permission ID that corresponds to this module/action in the role's permissions or general list
        // Wait, the API delete requires roleId and permissionId. We use the permission ID of the permission row.
        await identityApi.deleteRolePermission(role.id, perm.id);
        onTriggerNotification(`Menghapus hak akses ${perm.label} dari Role ${role.name}.`);
      } else {
        await identityApi.syncRolePermission({
          role_id: role.id,
          permission_id: perm.id,
          access_level: nextLevel
        });
        onTriggerNotification(`Mengubah hak akses ${perm.label} untuk Role ${role.name} menjadi ${nextLevel.toUpperCase()}.`);
      }

      // Update local state immediately to avoid full reload lag
      setRoles(prevRoles => prevRoles.map(r => {
        if (r.id !== role.id) return r;

        let newPermissions = [...r.permissions];
        const existIndex = newPermissions.findIndex(p => p.id === perm.id);

        if (nextLevel === 'none') {
          if (existIndex > -1) {
            newPermissions.splice(existIndex, 1);
          }
        } else {
          const updatedPerm: Permission = { ...perm, accessLevel: nextLevel };
          if (existIndex > -1) {
            newPermissions[existIndex] = updatedPerm;
          } else {
            newPermissions.push(updatedPerm);
          }
        }

        return { ...r, permissions: newPermissions };
      }));

    } catch (error) {
      console.error('Error updating role permission:', error);
      Swal.fire('Gagal', 'Terjadi kesalahan saat memperbarui hak akses.', 'error');
    } finally {
      setIsUpdating(null);
    }
  };



  const handleBulkAccessLevel = async (role: Role, row: any, nextLevel: 'none' | 'read' | 'edit' | 'full') => {
    const permsToUpdate = Object.values(row.permissions).filter(Boolean) as Permission[];
    const updateKey = `${role.id}-${row.module}-bulk`;
    setIsUpdating(updateKey);

    try {
      for (const perm of permsToUpdate) {
        if (nextLevel === 'none') {
          await identityApi.deleteRolePermission(role.id, perm.id).catch(() => { }); // ignore individual 404s
        } else {
          await identityApi.syncRolePermission({
            role_id: role.id,
            permission_id: perm.id,
            access_level: nextLevel
          });
        }
      }
      onTriggerNotification(`Berhasil mengubah semua hak akses ${row.label} untuk Role ${role.name} menjadi ${nextLevel.toUpperCase()}.`);
      // Re-fetch roles completely to sync the state instead of manual array mutation for bulk
      const rolesData = await identityApi.getRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Error during bulk update:', error);
      Swal.fire('Gagal', 'Terjadi kesalahan saat menerapkan hak akses massal.', 'error');
    } finally {
      setIsUpdating(null);
    }
  };

  const selectedRole = roles.find(role => role.id === selectedRoleId) || roles[0];
  const moduleRows = Array.from(new Set(uniquePermissionsList.map(permission => permission.module)))
    .map((module) => ({
      module,
      label: getModuleLabel(module),
      permissions: actionOrder.reduce<Record<string, Permission | undefined>>((acc, action) => {
        acc[action] = uniquePermissionsList.find(permission => permission.module === module && permission.action === action);
        return acc;
      }, {}),
    }))
    .filter(row => (
      row.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actionOrder.some(action => getActionLabel(action).toLowerCase().includes(searchQuery.toLowerCase()))
    ));

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(moduleRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = moduleRows.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRoleId]);

  const filteredRoles = roles.filter(r =>
    r.name.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
    r.code.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(roleSearchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-xs font-sans">
      <Header
        icon={<ShieldCheck size={20} />}
        title="Role & Permission Matrix (RBAC)"
        desc="Pusat konfigurasi tingkat keamanan dan otorisasi hak akses modul ERP berdasarkan Role divisi masing-masing."
      />

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
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500">
                  <Key size={14} />
                </div>
                <div>
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
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pilih role di atas, lalu klik badge akses per modul untuk mengubah izin.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white border rounded-lg px-2.5 py-1.5 w-full md:w-72">
                <Search size={12} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari modul atau deskripsi..."
                  className="bg-transparent focus:outline-none text-xs w-full text-slate-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
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
                <table className="w-full text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                      <th className="p-3.5 pl-5 min-w-[220px]">Modul</th>
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
                            <div>
                              <span className="font-bold text-slate-700 block text-xs">{row.label}</span>
                              <span className="text-[9px] text-slate-400 uppercase font-mono">
                                {Object.values(row.permissions).filter(Boolean).length} aksi tersedia
                              </span>
                            </div>
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

                          const level = getAccessLevel(selectedRole, permission);
                          const isCellUpdating = isUpdating === `${selectedRole.id}-${permission.id}`;

                          return (
                            <td key={action} className="p-2 text-center relative">
                              {isCellUpdating && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded z-10">
                                  <RefreshCw size={12} className="animate-spin text-cyan-600" />
                                </div>
                              )}
                              <select
                                value={level}
                                onChange={(e) => handleAccessLevelChange(selectedRole, permission, e.target.value as any)}
                                disabled={isCellUpdating || isLoading || isUpdating === `${selectedRole.id}-${row.module}-bulk`}
                                className={`block w-[75px] mx-auto appearance-none text-center px-1 py-1 text-[10px] font-bold border rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 cursor-pointer ${level === 'full' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  level === 'edit' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    level === 'read' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                                      'bg-slate-50 text-slate-500 border-slate-200'
                                  }`}
                              >
                                <option value="none">None</option>
                                <option value="read">Read</option>
                                <option value="edit">Edit</option>
                                <option value="full">Full</option>
                              </select>
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
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <span>
                Pilih tingkat izin dari <b>Dropdown</b> untuk mengubah hak akses.
              </span>
              <span>
                Total modul tampil: <b>{moduleRows.length}</b>
              </span>
            </div>
          </Panel>
        </div>
      </div>

      {/* Info Warning Card */}
      <Panel className="p-4 bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldIcon className="text-slate-400" size={18} />
          <span className="text-slate-600 font-medium leading-relaxed">
            Perubahan hak akses pada matriks di atas langsung tersimpan ke database dan akan diberlakukan saat pengguna log masuk kembali.
          </span>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition"
        >
          <RefreshCw size={10} />
          <span>Refresh</span>
        </button>
      </Panel>
    </div>
  );
}

