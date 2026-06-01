/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Compass, ShieldAlert, KeyRound, Mail, ArrowRight, CornerDownRight, Landmark } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (email: string, role: string) => void;
  onTriggerNotification: (message: string) => void;
}

export default function LoginView({ onLoginSuccess, onTriggerNotification }: LoginViewProps) {
  const [email, setEmail] = useState('admin@betonagung.co.id');
  const [password, setPassword] = useState('••••••••');
  const [role, setRole] = useState('Super Admin');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      onTriggerNotification('Gagal masuk: Harap isi alamat email!');
      return;
    }
    onLoginSuccess(email, role);
    onTriggerNotification(`Selamat Datang kembali! Masuk sebagai ${role}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative font-sans text-xs">
      {/* Visual background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-705 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main card box container */}
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative z-10 space-y-6">
        
        {/* Logo and company headers */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
            <Compass size={24} className="text-slate-950 stroke-[2.5]" />
          </div>
          <div className="pt-2">
            <h2 className="text-base font-sans font-black text-white uppercase tracking-wider">CV. BETON AGUNG</h2>
            <p className="text-[10px] text-slate-450 tracking-widest text-slate-400 font-mono">ERP INTEGRASI INTERNAL</p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-slate-300">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat E-mail</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                <Mail size={14} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="administrator@betonagung.co.id"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-550 focus:border-cyan-500 rounded-lg py-2.5 pl-9 pr-4 text-white focus:outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kunci Akses / Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                <KeyRound size={14} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg py-2.5 pl-9 pr-4 text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hak Otoritas Akun</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg py-2 pl-3 pr-4 text-white text-xs cursor-pointer focus:outline-none"
            >
              <option value="Super Admin">Super Admin (Otoritas Penuh)</option>
              <option value="Manager Operasional">Manager Operasional (Workshop)</option>
              <option value="Supervisor Lapangan">Supervisor Lapangan (Survey & GRC)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 font-bold text-slate-950 rounded-lg text-xs hover:opacity-90 flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <span>Masuk ke Dashboard</span>
            <ArrowRight size={14} className="stroke-[2.5]" />
          </button>
        </form>

        {/* Demo profiles bypass login options */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <p className="text-[9px] uppercase font-mono font-bold tracking-widest text-slate-500">Demo User Single-click Bypass:</p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <button
              onClick={() => {
                onLoginSuccess('kasir@betonagung.co.id', 'Super Admin');
                onTriggerNotification('Simulasi masuk: Bypass berhasil!');
              }}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded text-left transition-colors text-slate-300"
            >
              <strong className="text-cyan-400 block font-mono">FINANCE</strong>
              <span>Super Admin</span>
            </button>
            <button
              onClick={() => {
                onLoginSuccess('wh-supervisor@betonagung.co.id', 'Manager Operasional');
                onTriggerNotification('Simulasi masuk: Bypass berhasil!');
              }}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded text-left transition-colors text-slate-300"
            >
              <strong className="text-amber-400 block font-mono">WORKSHOP</strong>
              <span>Manager Ops</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trust Badge and legal info */}
      <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mt-6">
        CV. BETON AGUNG SURABAYA SIDOARJO INDONESIA © 2026
      </span>
    </div>
  );
}
