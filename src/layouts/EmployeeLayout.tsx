import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { WifiOff, CheckCircle2 } from '@/src/components/icons';
import { pathForView } from '../routes';

export default function EmployeeLayout() {
  const { isOnline, toast, handleLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === pathForView('employee-dashboard');

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {!isOnline && (
        <div className="bg-rose-600 text-white text-[10px] font-bold text-center py-1.5 px-4 flex items-center justify-center gap-2 shrink-0 animate-in slide-in-from-top duration-300">
          <WifiOff size={12} className="animate-pulse" />
          <span>Mode Offline</span>
        </div>
      )}

      {/* Simple Mobile Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          {!isDashboard && (
            <button
              onClick={() => navigate(pathForView('employee-dashboard'))}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"
              title="Kembali ke Beranda"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono font-bold text-emerald-600 tracking-wider">{import.meta.env.VITE_APP_NAME || 'Lintara Digital'}</span>
            <span className="text-xs font-bold text-slate-800">Portal Karyawan</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-100 transition-colors"
        >
          Keluar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
        <React.Suspense fallback={
          <div className="py-12 text-center">
            <div className="w-6 h-6 mx-auto border-2 border-slate-400 border-t-transparent rounded-full animate-spin mb-2.5" />
          </div>
        }>
          <Outlet />
        </React.Suspense>
      </div>

      {toast && (
        <div className="fixed top-5 right-5 bg-slate-900 text-white rounded-full shadow-xl px-5 py-2.5 flex items-center gap-2.5 z-50 animate-in fade-in slide-in-from-top-5 duration-200 whitespace-nowrap">
          <CheckCircle2 size={15} className="text-white stroke-[3]" />
          <span className="font-sans font-bold text-[11px]">{toast}</span>
        </div>
      )}
    </div>
  );
}
