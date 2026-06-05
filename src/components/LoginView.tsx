/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { authApi } from '../services/api';
import type { AuthSession } from '../types';

interface LoginViewProps {
  onLoginSuccess: (session: AuthSession) => void;
  onTriggerNotification: (message: string) => void;
}

export default function LoginView({ onLoginSuccess, onTriggerNotification }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const showLoginError = (message: string) => {
    setErrorMessage(message);
    Swal.fire({
      icon: 'error',
      title: 'Tidak bisa masuk',
      text: message,
      confirmButtonText: 'Coba lagi',
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-lg border border-slate-200 shadow-xl',
        title: 'text-base font-bold text-slate-900',
        htmlContainer: 'text-xs text-slate-600',
        confirmButton: 'px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-bold hover:bg-sky-700',
      },
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showLoginError('Isi email dan password untuk melanjutkan.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const session = await authApi.login(email, password);
      onLoginSuccess(session);
      onTriggerNotification(`Selamat datang kembali, ${session.user.name}!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login gagal. Silakan coba lagi.';
      showLoginError(message);
      onTriggerNotification(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center px-4 py-8 font-sans text-xs text-slate-700">
      <main className="w-full max-w-5xl grid lg:grid-cols-[1fr_420px] bg-white border border-sky-100 rounded-lg shadow-sm overflow-hidden">
        <section className="bg-sky-50 border-b lg:border-b-0 lg:border-r border-sky-100 p-6 md:p-8 flex flex-col justify-between gap-8">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-sky-700 flex items-center justify-center shadow-sm">
                <Building2 size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 uppercase">CV. Beton Agung</h1>
                <p className="text-[11px] font-semibold text-sky-700">Sistem Operasional Perusahaan</p>
              </div>
            </div>

            <div className="max-w-xl space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Portal Internal</p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-950 leading-tight">
                Kelola pekerjaan harian dengan akses yang sesuai peran.
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Masuk untuk membuka dashboard, transaksi, persediaan, proyek, dan laporan sesuai otorisasi akun Anda.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="bg-white border border-sky-100 rounded-lg p-4">
                <ShieldCheck size={18} className="text-sky-700 mb-3" />
                <p className="font-bold text-slate-900">Akses Aman</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">Setiap akun memiliki batas akses masing-masing.</p>
              </div>
              <div className="bg-white border border-sky-100 rounded-lg p-4">
                <CheckCircle2 size={18} className="text-sky-700 mb-3" />
                <p className="font-bold text-slate-900">Data Terkendali</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">Transaksi dan aktivitas tersimpan terpusat.</p>
              </div>
              <div className="bg-white border border-sky-100 rounded-lg p-4">
                <LockKeyhole size={18} className="text-sky-700 mb-3" />
                <p className="font-bold text-slate-900">Audit Aktivitas</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">Perubahan penting dapat ditelusuri kembali.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-sky-200 bg-white text-sky-800 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Sistem siap digunakan
            </span>
            <span>CV. Beton Agung © 2026</span>
          </div>
        </section>

        <section className="p-6 md:p-8 flex items-center">
          <div className="w-full">
            <div className="mb-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Selamat datang</p>
              <h2 className="mt-2 text-xl font-black text-slate-950">Masuk ke akun Anda</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Gunakan email dan password yang diberikan oleh perusahaan.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@betonagung.co.id"
                    autoComplete="email"
                    className="w-full bg-white border border-slate-300 focus:border-sky-600 rounded-lg py-2.5 pl-9 pr-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                    <KeyRound size={14} />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full bg-white border border-slate-300 focus:border-sky-600 rounded-lg py-2.5 pl-9 pr-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2 text-[11px] leading-relaxed">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-sky-700 border border-sky-700 font-bold text-white rounded-lg hover:bg-sky-800 disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2 transition-colors"
              >
                <span>{isSubmitting ? 'Memeriksa akun' : 'Masuk ke Sistem'}</span>
                {isSubmitting ? <Loader2 size={14} className="animate-spin stroke-[2.5]" /> : <ArrowRight size={14} className="stroke-[2.5]" />}
              </button>
            </form>

            <div className="mt-5 border border-sky-100 bg-sky-50 rounded-lg p-3 text-[11px] leading-5 text-slate-600">
              Jika Anda lupa akses masuk, hubungi penanggung jawab sistem di perusahaan.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
