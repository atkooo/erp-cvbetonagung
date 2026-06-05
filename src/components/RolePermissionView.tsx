/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, UserCog, BadgeCheck, RefreshCw, Key, ShieldAlert, Lock, Search, ShieldCheck as ShieldIcon
} from 'lucide-react';
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

export default function RolePermissionView({ onTriggerNotification }: RolePermissionViewProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // roleId-permId key

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

  const uniquePermissionsList = Object.values(uniquePermissionsMap);

  const getAccessLevel = (role: Role, perm: Permission): 'none' | 'read' | 'edit' | 'full' => {
    const matched = role.permissions.find(p => p.module === perm.module && p.action === perm.action);
    return matched ? matched.accessLevel : 'none';
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
        return <StatusPill tone="emerald">⚡ Full</StatusPill>;
      case 'edit':
        return <StatusPill tone="amber">✏️ Edit</StatusPill>;
      case 'read':
        return <StatusPill tone="cyan">👁️ Read</StatusPill>;
      default:
        return <StatusPill tone="slate">❌ None</StatusPill>;
    }
  };

  const filteredPermissions = uniquePermissionsList.filter(p =>
    p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Panel key={role.id} className="p-4 flex flex-col justify-between min-h-[110px]">
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
                <span className="text-[9px] font-mono text-slate-400">Hak Akses</span>
                <span className="font-bold text-slate-700">{role.permissions.length} Modul Aktif</span>
              </div>
            </Panel>
          ))
        )}
      </div>

      {/* Matrix Panel */}
      <Panel className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Key size={14} className="text-slate-500" />
            <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Matriks Otorisasi Hak Akses</h4>
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
        ) : filteredPermissions.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <ShieldAlert size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="font-bold">Tidak ada permission/modul yang sesuai pencarian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                  <th className="p-3.5 pl-5 w-1/4">Nama Modul / Deskripsi</th>
                  <th className="p-3.5 w-1/8 font-mono">Kode Modul</th>
                  {roles.map(role => (
                    <th key={role.id} className="p-3.5 text-center font-bold text-slate-700">
                      {role.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPermissions.map(perm => (
                  <tr key={perm.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3.5 pl-5">
                      <div className="flex items-center gap-2">
                        <Lock size={12} className="text-slate-400" />
                        <div>
                          <span className="font-bold text-slate-700 block text-xs">{perm.label}</span>
                          <span className="text-[9px] text-slate-400 uppercase font-mono">{perm.action}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-500 uppercase">{perm.module}</td>
                    {roles.map(role => {
                      const level = getAccessLevel(role, perm);
                      const isCellUpdating = isUpdating === `${role.id}-${perm.id}`;

                      return (
                        <td key={role.id} className="p-3 text-center">
                          <button
                            onClick={() => handleCycleAccessLevel(role, perm)}
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
