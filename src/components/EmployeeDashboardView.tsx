import React from "react";
import { authStorage } from "../services/api";
import {
  Scan,
  FileCheck,
  Calculator,
  User,
  Handshake,
  ChevronRight,
} from "@/src/components/icons";
import type { ViewType } from "../types";

interface EmployeeDashboardViewProps {
  onNavigate: (view: ViewType) => void;
}

export default function EmployeeDashboardView({
  onNavigate,
}: EmployeeDashboardViewProps) {
  const currentUser = authStorage.getUser();
  const userName = currentUser?.name || "Karyawan";

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Header Banner */}
      <div className="bg-linear-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-lg shadow-emerald-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <User size={36} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight mb-1">
                Halo, {userName}!
              </h1>
              <p className="text-emerald-100 text-sm">
                Selamat datang di Portal Layanan Karyawan Mandiri CV Beton
                Agung.
              </p>
            </div>
          </div>
          <div className="bg-black/20 backdrop-blur rounded-xl p-4 border border-white/10 flex items-center gap-4 text-sm">
            <div className="text-center px-4 border-r border-white/20">
              <span className="block text-emerald-200 text-[10px] uppercase tracking-wider font-bold mb-1">
                Sisa Cuti
              </span>
              <span className="text-xl font-black">
                12 <span className="text-xs font-normal opacity-70">hari</span>
              </span>
            </div>
            <div className="text-center px-4">
              <span className="block text-emerald-200 text-[10px] uppercase tracking-wider font-bold mb-1">
                Status Kehadiran
              </span>
              <span className="bg-emerald-500/40 text-emerald-50 px-2 py-0.5 rounded font-bold">
                Hadir
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate("attendance-scanner")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 text-left active:bg-slate-50 transition-colors"
        >
          <div className="w-12 h-12 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Scan size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 text-sm mb-0.5">
              Scan Absensi QR
            </h3>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              Lakukan Clock In / Out mandiri dari HP.
            </p>
          </div>
          <ChevronRight size={16} className="text-slate-300" />
        </button>

        <button
          onClick={() => onNavigate("leave-management")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 text-left active:bg-slate-50 transition-colors"
        >
          <div className="w-12 h-12 shrink-0 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileCheck size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 text-sm mb-0.5">
              Pengajuan Cuti
            </h3>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              Ajukan cuti, sakit, atau izin ke HRD.
            </p>
          </div>
          <ChevronRight size={16} className="text-slate-300" />
        </button>

        <button
          onClick={() => onNavigate("payroll-management")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 text-left active:bg-slate-50 transition-colors"
        >
          <div className="w-12 h-12 shrink-0 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calculator size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 text-sm mb-0.5">
              Slip Gaji (Payroll)
            </h3>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              Unduh detail potongan & tunjangan.
            </p>
          </div>
          <ChevronRight size={16} className="text-slate-300" />
        </button>

        <button
          onClick={() => onNavigate("employee-loans")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 text-left active:bg-slate-50 transition-colors"
        >
          <div className="w-12 h-12 shrink-0 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Handshake size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 text-sm mb-0.5">
              Pinjaman & Kasbon
            </h3>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              Ajukan kasbon atau lihat sisa pinjaman.
            </p>
          </div>
          <ChevronRight size={16} className="text-slate-300" />
        </button>
      </div>

      {/* Info Widget */}
      <div className="bg-slate-900 rounded-2xl p-6 text-slate-300">
        <h3 className="font-bold text-white mb-2 text-sm">Butuh Bantuan?</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Jika Anda mengalami kendala saat melakukan absensi QR, mesin absen
          lambat membaca, atau jika ada ketidaksesuaian pada slip gaji Anda,
          segera hubungi departemen <strong>HRD & Personalia</strong> di
          ekstensi 102 atau langsung menemui staf HRD di ruang kantor.
        </p>
      </div>
    </div>
  );
}
