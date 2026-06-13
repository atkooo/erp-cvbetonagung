/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
} from "@/src/components/icons";

interface AttendanceDashboardViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function AttendanceDashboardView({
  onTriggerNotification,
}: AttendanceDashboardViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Data will be fetched from API later
  const attendances: any[] = [];

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              MODUL HRD
            </span>
            <h1 className="font-sans font-black tracking-tight text-xl mt-3 text-slate-800 flex items-center gap-2">
              Dashboard Absensi & Kehadiran
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
              Pantau kehadiran karyawan, keterlambatan, dan status cuti harian.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
              Total Hadir
            </span>
            <h4 className="text-lg font-black text-emerald-600 mt-1">
              45 Orang
            </h4>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle size={18} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
              Terlambat
            </span>
            <h4 className="text-lg font-black text-amber-600 mt-1">3 Orang</h4>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Clock size={18} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
              Cuti / Izin
            </span>
            <h4 className="text-lg font-black text-indigo-600 mt-1">2 Orang</h4>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Calendar size={18} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
              Tanpa Keterangan
            </span>
            <h4 className="text-lg font-black text-rose-600 mt-1">1 Orang</h4>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
            <AlertCircle size={18} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-72">
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Cari nama karyawan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
            />
          </div>
          <input
            type="date"
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 focus:outline-none focus:border-indigo-400"
            defaultValue="2026-06-06"
          />
        </div>

        <table className="w-full text-left border-collapse min-w-200">
          <thead>
            <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
              <th className="p-3.5 pl-5">Nama Karyawan</th>
              <th className="p-3.5">Tanggal</th>
              <th className="p-3.5">Clock In</th>
              <th className="p-3.5">Clock Out</th>
              <th className="p-3.5">Keterlambatan</th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {attendances.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-slate-400 text-xs"
                >
                  Belum ada data absensi.
                </td>
              </tr>
            ) : (
              attendances.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3.5 pl-5 font-bold text-slate-800">
                    {item.name}
                  </td>
                  <td className="p-3.5 font-mono text-slate-500">
                    {item.date}
                  </td>
                  <td className="p-3.5 font-mono text-slate-700">
                    {item.clockIn}
                  </td>
                  <td className="p-3.5 font-mono text-slate-700">
                    {item.clockOut}
                  </td>
                  <td className="p-3.5">
                    {item.lateMinutes > 0 ? (
                      <span className="text-rose-600 font-bold">
                        {item.lateMinutes} mnt
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.status === "Hadir"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : item.status === "Terlambat"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
