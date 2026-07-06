/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bell, User, AlertTriangle, ShieldCheck, Settings, LogOut, Check } from '@/src/components/icons';
import { VIEW_TITLES } from '../config/navigation';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { viewFromPath, pathForView } from '../routes';
import { notificationApi } from '../services/api';
import type { SystemNotification } from '../types';

export default function Topbar() {
  const { userRoleName, authUser, userEmail, handleLogout } = useAuth();
  const userName = authUser?.name;
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = viewFromPath(location.pathname) || 'dashboard';
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getNotifications();
      setNotifications(res.data);
      setUnreadCount(res.unread_count);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // poll every minute
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const appName = import.meta.env.VITE_APP_NAME || 'Lintara Digital';

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
          <span className="text-slate-900 font-bold">{userRoleName}</span>
        </div>

        {/* Notifications Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full relative transition-colors focus:outline-none"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 py-2 z-30 overflow-hidden flex flex-col max-h-[80vh]">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="font-bold text-slate-800 text-xs">Pemberitahuan</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] text-cyan-600 hover:text-cyan-800 font-semibold flex items-center gap-1"
                  >
                    <Check size={12} /> Tandai dibaca
                  </button>
                )}
              </div>
              <div className="overflow-y-auto overflow-x-hidden scrollbar-thin max-h-[300px]">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell size={24} className="mx-auto mb-2 text-slate-200" />
                    <p className="text-[11px] text-slate-400">Belum ada notifikasi baru.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.read_at ? 'bg-cyan-50/30' : ''}`}
                        onClick={() => {
                          if (!notif.read_at) handleMarkAsRead(notif.id);
                        }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-bold text-slate-800">{notif.data?.title || 'Info'}</span>
                          <span className="text-[9px] text-slate-400">{new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{notif.data?.message || 'Tidak ada pesan'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-center mt-auto">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate(pathForView('reminders'));
                  }}
                  className="text-[10px] text-slate-500 hover:text-slate-800 font-bold"
                >
                  Lihat Semua Pengingat →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="relative">
          <div 
            className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors select-none"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            title="Menu Profil"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs">
              <User size={16} />
            </div>
            <div className="hidden sm:block text-left text-xs pr-1">
              <p className="font-bold text-slate-800 leading-none">{userName || 'Internal Team'}</p>
              <p className="text-[10px] text-slate-400 font-mono leading-none mt-1">{userEmail || 'Administrator'}</p>
            </div>
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-1.5 z-30 overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-100 sm:hidden">
                <p className="font-bold text-slate-800 text-xs">{userName || 'Internal Team'}</p>
                <p className="text-[10px] text-slate-400 font-mono">{userEmail || 'Administrator'}</p>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate(pathForView('profile'));
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 transition-colors text-left"
              >
                <User size={14} className="opacity-70" />
                Profil Saya
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate(pathForView('settings'));
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 transition-colors text-left"
              >
                <Settings size={14} className="opacity-70" />
                Pengaturan
              </button>
              <div className="my-1 border-t border-slate-100"></div>
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
