import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, X, Edit, Trash2, Shield, Save, Key, Mail, UserCircle } from '@/src/components/icons';
import { identityApi } from '../features/identity/api';
import { IdentityUser, Role } from '../features/identity/types';
import { SkeletonTable, ErrorCard } from './Skeleton';
import Swal from 'sweetalert2';

interface UsersViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function UsersView({ onTriggerNotification }: UsersViewProps) {
  const [users, setUsers] = useState<IdentityUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<IdentityUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedUsers, fetchedRoles] = await Promise.all([
        identityApi.getUsers(),
        identityApi.getRoles(),
      ]);
      setUsers(fetchedUsers);
      setRoles(fetchedRoles);
    } catch (err: any) {
      const msg = err.message || 'Gagal mengambil data user.';
      setError(msg);
      onTriggerNotification(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || u.roleId === roleFilter;
    return matchSearch && matchRole;
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRoleId(roles[0]?.id || '');
    setStatus('active');
    setShowModal(true);
  };

  const handleOpenEdit = (user: IdentityUser) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // Empty for edit, only filled if changing
    setRoleId(user.roleId);
    setStatus(user.status);
    setShowModal(true);
  };

  const handleDelete = async (id: string, userName: string) => {
    const result = await Swal.fire({
      title: 'Hapus Akun?',
      text: `Anda yakin ingin menghapus akun ${userName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      onTriggerNotification(`Menghapus ${userName}...`);
      await identityApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      Swal.fire({ title: 'Terhapus!', text: 'Akun berhasil dihapus.', icon: 'success', timer: 2000, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire('Gagal', err.message || 'Gagal menghapus akun', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !roleId) {
      onTriggerNotification('Lengkapi semua field wajib!');
      return;
    }

    if (!editingUser && !password) {
      onTriggerNotification('Password wajib diisi untuk akun baru!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = { name, email, role_id: roleId, status };
      if (password) payload.password = password;

      if (editingUser) {
        const updated = await identityApi.updateUser(editingUser.id, payload);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        onTriggerNotification(`Akun ${updated.name} berhasil diperbarui.`);
      } else {
        const created = await identityApi.createUser(payload);
        setUsers((prev) => [created, ...prev]);
        onTriggerNotification(`Akun ${created.name} berhasil dibuat.`);
      }
      setShowModal(false);
    } catch (err: any) {
      onTriggerNotification(err.message || 'Gagal menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Cari nama atau email akun..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none cursor-pointer"
          >
            <option value="All">Semua Role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap w-full md:w-auto justify-center"
        >
          <Plus size={16} />
          <span>Registrasi Akun</span>
        </button>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : error ? (
        <ErrorCard message={error} onRetry={fetchData} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <Users size={16} className="text-slate-500" />
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Daftar Akun Pengguna ({filteredUsers.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-500 uppercase tracking-widest font-mono text-[10px] border-b border-slate-200">
                  <th className="p-4 pl-5">Nama / Identitas</th>
                  <th className="p-4">Email Login</th>
                  <th className="p-4">Otoritas (Role)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-5">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      Tidak ada akun yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{user.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {user.id.substring(0,8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail size={13} className="text-slate-400" />
                          <span>{user.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-100">
                          <Shield size={12} />
                          {user.roleName}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {user.status === 'active' ? 'Aktif' : 'Dibekukan'}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-5">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit Akun"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Hapus Akun"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                  <UserCircle size={16} />
                </div>
                <h3 className="font-bold text-sm text-slate-800">
                  {editingUser ? 'Edit Akun Pengguna' : 'Registrasi Akun Baru'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Budi Santoso"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Email Login</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400"><Mail size={14} /></span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="budi@cvbetonagung.com"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase">
                  <span>Password</span>
                  {editingUser && <span className="text-slate-400 lowercase font-normal">(kosongkan jika tidak diubah)</span>}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400"><Key size={14} /></span>
                  <input
                    type="password"
                    required={!editingUser}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser ? "••••••••" : "Buat password minimal 8 karakter"}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Otoritas Role</label>
                  <select
                    required
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="" disabled>Pilih Role</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Status Akun</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="active">Aktif (Dapat Login)</option>
                    <option value="inactive">Dibekukan (Tidak Dapat Login)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  <Save size={14} />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Akun'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
