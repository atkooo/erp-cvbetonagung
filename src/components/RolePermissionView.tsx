/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, UserCog, RefreshCw, Key, ShieldAlert, Lock, Search, ShieldCheck as ShieldIcon
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

export default function RolePermissionView({ onTriggerNotification }: RolePermissionViewProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleCycleAccessLevel = async (role: Role, perm: Permission) => {
    const current = getAccessLevel(role, perm);
    const levels: ('none' | 'read' | 'edit' | 'full')[] = ['none', 'read', 'edit', 'full'];
    const currentIndex = levels.indexOf(current);
    const nextIndex = (currentIndex + 1) % levels.length;
    const nextLevel = levels[nextIndex];

    const updateKey = `${role.id}-${perm.id}`;
    setIsUpdating(updateKey);

    try {
      if (nextLevel === 'none') {
        // Find the specific permission ID that corresponds to this module/action in the role's permissions or general list
        // Wait, the API delete requires roleId and permissionId. We use the permission ID of the permission row.
        await identityApi.deleteRolePermission(role.id, perm.id);
        onTriggerNotification(`Menghapus hak akses ${perm.label} dari Peran ${role.name}.`);
      } else {
        await identityApi.syncRolePermission({
          role_id: role.id,
          permission_id: perm.id,
          access_level: nextLevel
        });
        onTriggerNotification(`Mengubah hak akses ${perm.label} untuk Peran ${role.name} menjadi ${nextLevel.toUpperCase()}.`);
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

  const getLevelPill = (level: 'none' | 'read' | 'edit' | 'full', updating: boolean) => {
    if (updating) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border rounded bg-slate-50 text-[10px] text-slate-400 font-bold">
          <RefreshCw size={10} className="animate-spin" />
          <span>Proses...</span>
        </span>
      );
    }

    switch (level) {
      case 'full':
        return <StatusPill tone="emerald">Full</StatusPill>;
      case 'edit':
        return <StatusPill tone="amber">Edit</StatusPill>;
      case 'read':
        return <StatusPill tone="cyan">Read</StatusPill>;
      default:
        return <StatusPill tone="slate">None</StatusPill>;
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

  return (
    <div className="space-y-6 text-xs font-sans">
      <Header
        icon={<ShieldCheck size={20} />}
        title="Role & Permission Matrix (RBAC)"
        desc="Pusat konfigurasi tingkat keamanan dan otorisasi hak akses modul ERP berdasarkan peran divisi masing-masing."
      />

      {/* Role Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Panel key={i} className="p-4 animate-pulse bg-slate-50 h-24" />
          ))
        ) : (
          roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRoleId(role.id)}
              className={`text-left rounded-xl transition focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                selectedRole?.id === role.id ? 'ring-2 ring-slate-900' : 'hover:-translate-y-0.5'
              }`}
            >
              <Panel className={`p-4 flex flex-col justify-between min-h-[110px] h-full ${
                selectedRole?.id === role.id ? 'border-slate-900 bg-slate-50' : ''
              }`}>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <UserCog size={14} className="text-slate-500" />
                    <h4 className="font-bold text-slate-800">{role.name}</h4>
                  </div>
                  <span className="font-mono text-[9px] uppercase font-bold text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">
                    {role.code}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {role.description || 'Tidak ada deskripsi peran.'}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-400">Modul / Hak</span>
                <span className="font-bold text-slate-700">
                  {getActiveModuleCount(role)} Modul / {getActivePermissionCount(role)} Hak
                </span>
              </div>
              </Panel>
            </button>
          ))
        )}
      </div>

      {/* Matrix Panel */}
      <Panel className="overflow-hidden">
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {moduleRows.map(row => (
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
                        <td key={action} className="p-3 text-center">
                          <button
                            onClick={() => handleCycleAccessLevel(selectedRole, permission)}
                            disabled={isCellUpdating || isLoading}
                            className="focus:outline-none transform hover:scale-105 active:scale-95 transition-transform"
                            title="Klik untuk mengubah tingkat hak akses"
                          >
                            {getLevelPill(level, isCellUpdating)}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <span>
            Alur klik badge: <b>None</b> {'->'} <b>Read</b> {'->'} <b>Edit</b> {'->'} <b>Full</b> {'->'} <b>None</b>.
          </span>
          <span>
            Total modul tampil: <b>{moduleRows.length}</b>
          </span>
        </div>
      </Panel>

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

