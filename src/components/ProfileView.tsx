import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, KeyRound } from '@/src/components/icons';
import { authApi, authStorage } from '../services/api';

interface ProfileViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function ProfileView({ onTriggerNotification }: ProfileViewProps) {
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = authStorage.getUser();
    if (user) {
      setName(user.name);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    if (newPassword && !currentPassword) {
      setError('Kata sandi saat ini harus diisi jika ingin mengubah kata sandi.');
      return;
    }

    try {
      setIsLoading(true);
      await authApi.updateProfile({
        name,
        ...(newPassword && {
          password: newPassword,
          password_confirmation: confirmPassword,
          current_password: currentPassword,
        })
      });

      onTriggerNotification('Profil berhasil diperbarui!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Update global state if needed by reloading or triggering an event
      window.dispatchEvent(new Event('profile:updated'));
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan profil.');
    } finally {
      setIsLoading(false);
    }
  };

  const user = authStorage.getUser();

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-xs text-slate-800">
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 border text-white rounded-lg">
            <User size={20} />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-slate-800">Profil & Akun Saya</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Kelola informasi pribadi dan pengaturan keamanan akun Anda.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-1 bg-white p-5 rounded-xl border shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <User size={48} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-800">{user?.name}</h4>
            <p className="text-xs text-slate-500 mt-1">{user?.email}</p>
          </div>
          <div className="px-3 py-1.5 bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 flex items-center gap-2">
            <ShieldCheck size={14} className="text-slate-500" />
            <span className="text-slate-900 font-bold">{user?.role?.name || 'User'}</span>
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-5 rounded-xl border shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b pb-2">Informasi Pribadi</h4>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2">
                <KeyRound size={14} /> Keamanan Akun
              </h4>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">Kata Sandi Saat Ini</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                  placeholder="Isi jika ingin mengubah kata sandi"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 block">Kata Sandi Baru</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                    placeholder="Minimal 8 karakter"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 block">Konfirmasi Kata Sandi</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                    placeholder="Ketik ulang kata sandi baru"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg transition-all hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
