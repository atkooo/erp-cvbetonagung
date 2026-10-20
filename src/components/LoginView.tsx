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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-xs text-slate-600 selection:bg-sky-100 selection:text-sky-900 relative overflow-hidden">
      {/* Background Subtle Architectural Grid & Ambient Tint */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c70a_1px,transparent_1px),linear-gradient(to_bottom,#0284c70a_1px,transparent_1px)] bg-size-[32px_32px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-sky-200/25 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <main className="w-full max-w-3xl grid md:grid-cols-[1fr_1.15fr] bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/5 overflow-hidden relative z-10">
        {/* Left Side: Modern Geometric Gradient Block */}
        <section className="bg-linear-to-br from-sky-600 via-sky-700 to-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Internal Geometric Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Block */}
          <div className="relative z-10 space-y-6">
            <div
              onClick={handleLogoClick}
              className="w-13 h-13 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-2.5 flex items-center justify-center cursor-pointer transition-transform active:scale-95 shadow-inner"
              title="Klik 5x untuk mode akses khusus"
            >
              <img src="/logo.png" alt={`${appName} Logo`} className="w-full h-full object-contain" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono tracking-widest uppercase text-sky-200 font-bold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15 inline-block">
                Portal Internal
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
                {appName || "CV. Beton Agung"}
              </h2>
              <div className="h-0.5 w-12 bg-linear-to-r from-sky-300 to-transparent my-2" />
              <p className="text-xs text-sky-100/80 leading-relaxed">
                Sistem Operasional Terpadu
              </p>
            </div>
          </div>

          {/* Bottom Security Mark */}
          <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-[10px] text-sky-200/70 font-mono">
            <span>Sesi Terenkripsi</span>
            <div className="flex items-center gap-1.5 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Online</span>
            </div>
          </div>
        </section>

        {/* Right Side: Clean Form with Top Accent Line */}
        <section className="p-8 sm:p-10 flex flex-col justify-center bg-white relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-sky-500 via-blue-600 to-sky-400 md:hidden" />

          <div className="w-full max-w-xs mx-auto space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Masuk ke Akun
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Masukkan kredensial akun Anda.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {!showOtpField && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Email
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                        <Mail size={14} />
                      </span>
                      <input
                        type="email"
                        required={!showOtpField}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@perusahaan.com"
                        autoComplete="email"
                        className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 rounded-xl py-2 pl-9 pr-3 text-slate-900 placeholder:text-slate-400 outline-none transition-all text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                        <KeyRound size={14} />
                      </span>
                      <input
                        type="password"
                        required={!showOtpField}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 rounded-xl py-2 pl-9 pr-3 text-slate-900 outline-none transition-all text-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              {showOtpField && (
                <div className="space-y-1.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
                    <LockKeyhole size={13} className="text-amber-700" />
                    <span>Super Admin OTP</span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="******"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-white border border-amber-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 rounded-lg py-2 px-3 text-amber-900 placeholder:text-amber-300 outline-none transition-all text-sm font-mono tracking-widest text-center"
                  />
                </div>
              )}

              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3.5 py-2 text-[11px] leading-relaxed">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary btn-md w-full gap-2 shadow-xs mt-2"
              >
                <span>{isSubmitting ? "Memproses..." : "Masuk"}</span>
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin stroke-[2.5]" />
                ) : (
                  <ArrowRight size={14} className="stroke-[2.5]" />
                )}
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="mt-8 text-center text-[11px] text-slate-400">
        © {new Date().getFullYear()} {appName || "CV. Beton Agung"}
      </footer>
    </div>
  );
}
