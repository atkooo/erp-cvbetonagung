/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bell, User, AlertTriangle, ShieldCheck, Settings, LogOut, Check, Clock, Sparkles } from '@/src/components/icons';
import { VIEW_TITLES } from '../config/navigation';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { viewFromPath, pathForView } from '../routes';
import { NotificationBell } from './NotificationBell';
import { API_BASE_URL } from '../services/api';

export default function Topbar() {
  const { userRoleName, authUser, userEmail, handleLogout } = useAuth();
  const userName = authUser?.name;
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = viewFromPath(location.pathname) || 'dashboard';
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Server Time Tracking (WIB - UTC+7 / Asia/Jakarta)
  const [serverOffset, setServerOffset] = useState<number>(0);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    let isMounted = true;

    const syncServerTime = async () => {
      try {
        const start = Date.now();
        const res = await fetch(`${API_BASE_URL}/system/time`);
        if (res.ok) {
          const data = await res.json();
          const end = Date.now();
          const latency = (end - start) / 2;
          const serverMs = (data.timestamp_ms || new Date(data.server_time).getTime()) + latency;
          if (isMounted) {
            setServerOffset(serverMs - end);
          }
        }
      } catch {
        // Fallback: continue with current offset
      }
    };

    syncServerTime();

    // Re-sync with server periodically (every 5 minutes) to prevent drift
    const syncInterval = setInterval(syncServerTime, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(syncInterval);
    };
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date(Date.now() + serverOffset));
    }, 1000);

    return () => clearInterval(timer);
  }, [serverOffset]);

  // Formatters with strict WIB (Asia/Jakarta) timezone
  const dayName = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
  }).format(now);

  const dateFormatted = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(now);

  const timeFormatted = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now).replace(/\./g, ':');

  const appName = import.meta.env.VITE_APP_NAME || 'Lintara Digital';

  return (
    <div className="h-16 bg-white/85 backdrop-blur-md border-b border-sky-100/90 px-6 flex items-center justify-between sticky top-0 z-20 shrink-0 transition-colors">
      {/* View Title */}
      <div className="flex items-center gap-3">
        <h2 className="font-sans font-bold text-slate-800 text-lg uppercase tracking-tight">
          {VIEW_TITLES[currentView] || appName}
        </h2>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-4">
        {/* Server Time (WIB) Display: Hari, Tanggal, Jam hingga Detik Server */}
        <div 
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-sky-50/80 text-slate-700 rounded-xl border border-sky-100 shadow-2xs select-none"
          title={`Waktu Server (WIB): ${dayName}, ${dateFormatted} ${timeFormatted} WIB`}
        >
          <div className="w-6 h-6 rounded-lg bg-white border border-sky-200/70 flex items-center justify-center text-sky-600 shrink-0">
            <Clock size={13} />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-700 hidden md:inline">
              {dayName}, {dateFormatted}
            </span>
            <span className="text-slate-300 hidden md:inline">•</span>
            <span className="font-mono font-bold text-sky-900 tracking-wider">
              {timeFormatted}
            </span>
            <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-sky-600 text-white shadow-2xs">
              WIB
            </span>
          </div>
        </div>

        {/* Role display */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50/90 text-xs font-semibold text-slate-700 rounded-lg border border-sky-100">
          <ShieldCheck size={14} className="text-sky-600" />
          <span className="text-[10px] uppercase font-mono text-slate-400">Hak Akses:</span>
          <span className="text-slate-900 font-bold">{userRoleName}</span>
        </div>

        {/* Notifications Toggle */}
        <NotificationBell />

        {/* Profile Info */}
        <div className="relative">
          <div 
            className="flex items-center gap-2 pl-2 border-l border-sky-100 cursor-pointer hover:bg-sky-50/50 p-2 rounded-lg transition-colors select-none"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            title="Menu Profil"
          >
            <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 font-semibold text-xs">
              <User size={16} />
            </div>
            <div className="hidden sm:block text-left text-xs pr-1">
              <p className="font-bold text-slate-800 leading-none">{userName || 'Internal Team'}</p>
              <p className="text-[10px] text-slate-400 font-mono leading-none mt-1">{userEmail || 'Administrator'}</p>
            </div>
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-sky-100 py-1.5 z-30 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-2 border-b border-sky-50 sm:hidden">
                <p className="font-bold text-slate-800 text-xs">{userName || 'Internal Team'}</p>
                <p className="text-[10px] text-slate-400 font-mono">{userEmail || 'Administrator'}</p>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate(pathForView('profile'));
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-sky-700 hover:bg-sky-50 transition-colors text-left"
              >
                <User size={14} className="opacity-70" />
                Profil Saya
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate(pathForView('settings'));
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-sky-700 hover:bg-sky-50 transition-colors text-left"
              >
                <Settings size={14} className="opacity-70" />
                Pengaturan
              </button>
              <div className="my-1 border-t border-sky-50"></div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut size={14} className="opacity-70" />
                Keluar (Logout)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
