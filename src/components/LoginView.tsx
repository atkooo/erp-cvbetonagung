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
} from '@/src/components/icons';
import { authApi } from '../services/api';
import type { AuthSession } from '../types';

interface LoginViewProps {
  onLoginSuccess: (session: AuthSession) => void;
  onTriggerNotification: (message: string) => void;
}

export default function LoginView({ onLoginSuccess, onTriggerNotification }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [logoClicks, setLogoClicks] = useState(0);
  const [showOtpField, setShowOtpField] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const appName = import.meta.env.VITE_APP_NAME || 'CV. Beton Agung';

  const handleLogoClick = () => {
    setLogoClicks((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setShowOtpField(true);
        onTriggerNotification('Mode Akses Khusus Super Admin Aktif.');
        return 0;
      }
      return next;
    });
  };

  const showLoginError = (message: string) => {
    setErrorMessage(message);
    Swal.fire({
      icon: 'error',
      title: 'Tidak dapat masuk',
      text: message,
      confirmButtonText: 'Coba lagi',
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-xl border border-slate-200 shadow-xl bg-white font-sans text-xs',
        title: 'text-sm font-bold text-slate-900 pt-4',
        htmlContainer: 'text-xs text-slate-500 py-2',
        confirmButton: 'px-4 py-2 rounded-lg bg-slate-900 text-white text-[10px] font-bold hover:bg-slate-800 transition-colors',
      },
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || (!password && !otp)) {
      showLoginError(showOtpField ? 'Isi email dan OTP untuk melanjutkan.' : 'Isi email dan password untuk melanjutkan.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const session = await authApi.login(email, password, showOtpField ? otp : undefined);
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 font-sans text-xs text-slate-600">
      <main className="w-full max-w-4xl grid lg:grid-cols-[1.1fr_1fr] bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        {/* Left Side: Brand Panel */}
        <section className="bg-slate-900 text-slate-200 p-8 md:p-10 flex flex-col justify-between gap-10">
          <div className="space-y-10">
            <div className="flex items-center gap-3 select-none cursor-pointer" onClick={handleLogoClick}>
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center">
                <Building2 size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-black text-white uppercase tracking-wider">{appName}</h1>
                <p className="text-[10px] font-mono tracking-widest text-slate-400 mt-0.5">Sistem Operasional ERP</p>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 border border-slate-800 bg-slate-800/40 px-2 py-0.5 rounded">
                Portal Internal
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">
                Manajemen Aliran Kerja & Operasional Terpusat.
              </h2>
              <p className="text-xs leading-relaxed text-slate-400">
                Masuk untuk mengakses dasbor utama, modul logistik surat jalan, manajemen produksi cetak beton, approval workflow, serta laporan keuangan terintegrasi.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 pt-2">
              {[
                { icon: ShieldCheck, title: 'Otorisasi Ketat', desc: 'Hak akses ketat berbasis matriks peran divisi.' },
                { icon: CheckCircle2, title: 'Integritas Transaksi', desc: 'Pencatatan real-time untuk audit & kepatuhan.' },
                { icon: LockKeyhole, title: 'Pelacakan Aktivitas', desc: 'Setiap perubahan penting terdaftar dalam sistem.' }
              ].map(({ icon: Icon, title, desc }, idx) => {
                return (
                  <div key={idx} className="flex gap-3 bg-slate-800/30 border border-slate-800/60 rounded-lg p-3.5">
                    <Icon size={16} className="text-slate-300 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-[11px]">{title}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400 leading-normal">{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-slate-800/60 pt-4">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700/40 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Sistem Aktif
            </span>
            <span>© 2026 {appName}</span>
          </div>
        </section>

        {/* Right Side: Login Form */}
        <section className="p-8 md:p-10 flex items-center bg-white">
          <div className="w-full space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Sign In</h2>
              <p className="mt-1 text-slate-400 text-xs">
                Masukkan kredensial akun korporat Anda.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-500">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <Mail size={13} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@betonagung.co.id"
                    autoComplete="email"
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-lg py-2 pl-9 pr-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all text-xs"
                  />
                </div>
              </div>

              {!showOtpField && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-mono font-bold text-slate-500">Password</label>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <KeyRound size={13} />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-lg py-2 pl-9 pr-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all text-xs"
                    />
                  </div>
                </div>
              )}

              {showOtpField && (
                <div className="space-y-1.5 animate-pulse">
                  <label className="text-[10px] uppercase font-mono font-bold text-emerald-600">Super OTP Key</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-emerald-600">
                      <LockKeyhole size={13} />
                    </span>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="******"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-emerald-50/50 border border-emerald-200 focus:border-emerald-500 rounded-lg py-2 pl-9 pr-3 text-emerald-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-xs font-mono tracking-widest text-center"
                    />
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg px-3 py-2 text-[10px] leading-relaxed">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-slate-900 border border-slate-900 font-bold text-white rounded-lg hover:bg-slate-800 disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
              >
                <span>{isSubmitting ? 'Memproses Autentikasi' : 'Masuk ke Dashboard'}</span>
                {isSubmitting ? <Loader2 size={13} className="animate-spin stroke-[2.5]" /> : <ArrowRight size={13} className="stroke-[2.5]" />}
              </button>
            </form>

            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[10px] leading-normal text-slate-400">
              Penggunaan sistem ini diawasi oleh kebijakan keamanan internal perusahaan. Kehilangan kata sandi wajib dilaporkan ke Administrator IT.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
