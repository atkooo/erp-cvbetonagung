import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../contexts/AuthContext';
import { WifiOff, CheckCircle2 } from '@/src/components/icons';

export default function AdminLayout() {
  const { isOnline, toast } = useAuth();

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!isOnline && (
          <div className="bg-rose-600 text-white text-[10px] font-sans font-bold text-center py-1.5 px-4 flex items-center justify-center gap-2 shrink-0 animate-in slide-in-from-top duration-300">
            <WifiOff size={12} className="animate-pulse" />
            <span>Koneksi internet terputus. Bekerja dalam mode offline.</span>
          </div>
        )}

        <Topbar />

        <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
            <Outlet />
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed top-5 right-5 bg-slate-900 text-white rounded-lg shadow-xl p-3.5 flex items-center gap-2.5 z-50 animate-in fade-in slide-in-from-top-5 duration-200">
          <CheckCircle2 size={15} className="text-white stroke-[3]" />
          <span className="font-sans font-bold text-[11px]">{toast}</span>
        </div>
      )}
    </div>
  );
}
