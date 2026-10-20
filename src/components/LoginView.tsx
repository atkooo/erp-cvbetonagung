/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import {
  ArrowRight,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
} from "@/src/components/icons";
import { authApi } from "../services/api";
import type { AuthSession } from "../types";

interface LoginViewProps {
  onLoginSuccess: (session: AuthSession) => void;
  onTriggerNotification: (message: string) => void;
}

export default function LoginView({
  onLoginSuccess,
  onTriggerNotification,
}: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [logoClicks, setLogoClicks] = useState(0);
  const [showOtpField, setShowOtpField] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const appName = import.meta.env.VITE_APP_NAME;

  const handleLogoClick = () => {
    setLogoClicks((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setShowOtpField(true);
        onTriggerNotification("Mode Akses Khusus Super Admin Aktif.");
        return 0;
      }
      return next;
    });
  };

  const showLoginError = (message: string) => {
    setErrorMessage(message);
    Swal.fire({
      icon: "error",
      title: "Tidak dapat masuk",
      text: message,
      confirmButtonText: "Coba lagi",
      buttonsStyling: false,
      customClass: {
        popup:
          "rounded-xl border border-sky-100 shadow-xl bg-white font-sans text-xs",
        title: "text-sm font-bold text-slate-900 pt-4",
        htmlContainer: "text-xs text-slate-500 py-2",
        confirmButton:
          "px-4 py-2 rounded-lg bg-sky-600 text-white text-[10px] font-bold hover:bg-sky-700 transition-colors shadow-sm",
      },
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showOtpField) {
      if (!otp) {
        showLoginError("Isi OTP untuk melanjutkan.");
        return;
      }
    } else {
      if (!email || !password) {
        showLoginError("Isi email dan password untuk melanjutkan.");
        return;
      }
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const session = await authApi.login(
        email,
        password,
        showOtpField ? otp : undefined,
      );
      onLoginSuccess(session);
      onTriggerNotification(`Selamat datang kembali, ${session.user.name}!`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Login gagal. Silakan coba lagi.";
      showLoginError(message);
      onTriggerNotification(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-blue-50/30 flex items-center justify-center px-4 py-12 font-sans text-xs text-slate-600">
      <main className="w-full max-w-4xl min-h-130 grid lg:grid-cols-[1.1fr_1fr] bg-white/95 backdrop-blur-md border border-sky-100 rounded-2xl shadow-xl shadow-sky-500/5 overflow-hidden">
        {/* Left Side: Brand Panel */}
        <section className="bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800 text-white p-8 md:p-10 flex flex-col justify-between gap-10 relative overflow-hidden">
          {/* Subtle ambient lighting decorations */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-10 relative z-10">
            <div
              className="flex items-center gap-3 select-none cursor-pointer"
              onClick={handleLogoClick}
            >
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center overflow-hidden p-2 shadow-inner">
                <img src="/logo.png" alt={`${appName} Logo`} className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-sm font-black text-white uppercase tracking-wider">
                  {appName}
                </h1>
                <p className="text-[10px] font-mono tracking-widest text-sky-100/80 mt-0.5">
                  Sistem Operasional ERP
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-sky-100 border border-white/20 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-xs">
                Portal Internal
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">
                Sistem Manajemen & Operasional Terpusat.
              </h2>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-sky-200/80 font-mono border-t border-white/15 pt-4 relative z-10">
            <span>© {new Date().getFullYear()} {appName || 'Perusahaan'} - by Lintara Digital</span>
          </div>
        </section>

        {/* Right Side: Login Form */}
        <section className="p-8 md:p-10 flex items-center bg-white/80">
          <div className="w-full space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Sign In</h2>
              <p className="mt-1 text-slate-400 text-xs">
                Masukkan kredensial akun korporat Anda.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {!showOtpField && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono font-bold text-slate-500">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                        <Mail size={13} />
                      </span>
                      <input
                        type="email"
                        required={!showOtpField}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@perusahaan.com"
                        autoComplete="email"
                        className="w-full bg-white border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg py-2 pl-9 pr-3 text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-mono font-bold text-slate-500">
                        Password
                      </label>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                        <KeyRound size={13} />
                      </span>
                      <input
                        type="password"
                        required={!showOtpField}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        className="w-full bg-white border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg py-2 pl-9 pr-3 text-slate-800 focus:outline-none transition-all text-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              {showOtpField && (
                <div className="space-y-1.5 animate-pulse">
                  <label className="text-[10px] uppercase font-mono font-bold text-emerald-600">
                    Super OTP Key
                  </label>
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
                <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-lg px-3 py-2 text-[10px] leading-relaxed">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 border border-sky-600 font-bold text-white rounded-lg shadow-md shadow-sky-500/20 disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
              >
                <span>
                  {isSubmitting
                    ? "Memproses Autentikasi"
                    : "Masuk ke Dashboard"}
                </span>
                {isSubmitting ? (
                  <Loader2 size={13} className="animate-spin stroke-[2.5]" />
                ) : (
                  <ArrowRight size={13} className="stroke-[2.5]" />
                )}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
