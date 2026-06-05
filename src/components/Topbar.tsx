/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bell, Search, User, Globe, AlertTriangle, ChevronDown } from 'lucide-react';
import { VIEW_TITLES } from '../config/navigation';
import type { ViewType } from '../types';

interface TopbarProps {
  currentView: ViewType;
  userRole: string;
  onRoleChange: (role: string) => void;
  onTriggerNotification: (message: string) => void;
  userEmail: string;
  userName?: string;
}

export default function Topbar({ currentView, userRole, onRoleChange, onTriggerNotification, userEmail, userName }: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const notifications = [
    { id: 1, text: 'Stok menipis: Lisplang Beton Minimalis M20 sisa 45 Meter!', type: 'warning' },
    { id: 2, text: 'Pembayaran Termin 1 Masjid Baiturrahman lunas divalidasi.', type: 'info' },
    { id: 3, text: 'Invoice INV-2026-05-106 (H. Ahmad Syukur) melewati jatuh tempo!', type: 'danger' },
    { id: 4, text: 'Proyek workshop Baiturrahman memasuki tahap produksi.', type: 'project' },
  ];

  return (
    <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
      {/* View Title */}
      <div className="flex items-center gap-3">
        <h2 className="font-sans font-bold text-slate-800 text-lg uppercase tracking-tight">
          {VIEW_TITLES[currentView] || 'CV Beton Agung'}
        </h2>
        <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-500 rounded border border-slate-200">
          PROTOTYPE VIEW
        </span>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-4">
        {/* Quick Website link */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500">
          <Globe size={14} className="text-cyan-500" />
          <span>http://cvbetonagung.com</span>
        </div>

        {/* Role Quick Selector */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSelector(!showRoleSelector)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 transition-colors"
          >
            <span className="text-[10px] uppercase font-mono text-slate-400">Hak Akses:</span>
            <span className="text-cyan-600 font-bold">{userRole}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showRoleSelector && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-30 font-sans text-xs">
              <div className="px-3 py-1.5 font-bold text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                Pilih Role Simulasi
              </div>
              {['Owner', 'Admin', 'Sales', 'Gudang', 'Finance', 'Produksi'].map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    onRoleChange(role);
                    setShowRoleSelector(false);
                    onTriggerNotification(`Berhasil berpindah role simulasi sebagai: ${role}`);
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                    userRole === role ? 'font-bold text-cyan-600 bg-cyan-50/40' : 'text-slate-600'
                  }`}
                >
                  <span>{role}</span>
                  {userRole === role && <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full relative transition-colors focus:outline-none"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-30">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">Pemberitahuan Sistem ERP</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 font-bold rounded">
                  4 Baru
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      onTriggerNotification(`Membuka detail alert: ${notif.text.substring(0, 30)}...`);
                      setShowNotifications(false);
                    }}
                    className="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex gap-2.5 transition-colors"
                  >
                    <div className="mt-0.5 shrink-0">
                      {notif.type === 'danger' ? (
                        <div className="p-1 rounded bg-red-50 text-red-500">
                          <AlertTriangle size={14} />
                        </div>
                      ) : notif.type === 'warning' ? (
                        <div className="p-1 rounded bg-amber-50 text-amber-500">
                          <AlertTriangle size={14} />
                        </div>
                      ) : (
                        <div className="p-1 rounded bg-blue-50 text-blue-500">
                          <Bell size={14} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-700 leading-relaxed">{notif.text}</p>
                      <span className="text-[9px] text-slate-400 font-mono mt-1 block">Baru saja</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onTriggerNotification('Semua notifikasi ditandai telah dibaca');
                  }}
                  className="text-[10px] text-cyan-600 hover:text-cyan-700 font-semibold"
                >
                  Tandai Semua Selesai dibaca
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs">
            <User size={16} />
          </div>
          <div className="hidden sm:block text-left text-xs">
            <p className="font-bold text-slate-800 leading-none">{userName || 'Internal Team'}</p>
            <p className="text-[10px] text-slate-400 font-mono leading-none mt-1">{userEmail || 'CV Beton Agung'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
