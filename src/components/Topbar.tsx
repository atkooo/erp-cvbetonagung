/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bell, User, AlertTriangle, ShieldCheck } from '@/src/components/icons';
import { VIEW_TITLES } from '../config/navigation';
import type { ViewType } from '../types';

interface TopbarProps {
  currentView: ViewType;
  userRole: string;
  onTriggerNotification: (message: string) => void;
  userEmail: string;
  userName?: string;
}

export default function Topbar({ currentView, userRole, onTriggerNotification, userEmail, userName }: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const appName = import.meta.env.VITE_APP_NAME || 'CV. Beton Agung';

  return (
    <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
      {/* View Title */}
      <div className="flex items-center gap-3">
        <h2 className="font-sans font-bold text-slate-800 text-lg uppercase tracking-tight">
          {VIEW_TITLES[currentView] || appName}
        </h2>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-4">
        {/* Role display */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200">
          <ShieldCheck size={14} className="text-slate-500" />
          <span className="text-[10px] uppercase font-mono text-slate-400">Hak Akses:</span>
          <span className="text-slate-900 font-bold">{userRole}</span>
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
              </div>
              <div className="py-8 text-center">
                <Bell size={24} className="mx-auto mb-2 text-slate-200" />
                <p className="text-[11px] text-slate-400">Belum ada notifikasi baru.</p>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    window.dispatchEvent(new CustomEvent('navigate', { detail: 'reminders' }));
                  }}
                  className="mt-3 text-[10px] text-indigo-600 hover:text-indigo-800 font-bold"
                >
                  Lihat Semua Pengingat →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div 
          className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
          onClick={() => {
            // Trigger navigation to profile
            window.dispatchEvent(new CustomEvent('navigate', { detail: 'profile' }));
          }}
          title="Buka Profil Saya"
        >
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
