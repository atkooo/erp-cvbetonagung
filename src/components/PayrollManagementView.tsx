/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  WalletCards,
  Calculator,
  Plus,
  Settings,
  CheckCircle2,
} from "@/src/components/icons";

interface PayrollManagementViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function PayrollManagementView({
  onTriggerNotification,
}: PayrollManagementViewProps) {
  const [activeTab, setActiveTab] = useState<"generate" | "components">(
    "generate",
  );

  const payrolls = [
    {
      id: 1,
      number: "PAY-2026-06-001",
      employee: "Siti Aminah",
      period: "Juni 2026",
      total: 4500000,
      status: "Draft",
    },
    {
      id: 2,
      number: "PAY-2026-06-002",
      employee: "Budi Santoso",
      period: "Juni 2026",
      total: 4200000,
      status: "Paid",
    },
  ];

  const components = [
    {
      id: 1,
      code: "GJP",
      name: "Gaji Pokok",
      type: "Pendapatan",
      amount: 3000000,
    },
    {
      id: 2,
      code: "TJK",
      name: "Tunjangan Kehadiran",
      type: "Pendapatan",
      amount: 500000,
    },
    {
      id: 3,
      code: "PPH",
      name: "Potongan PPh 21",
      type: "Potongan",
      amount: 150000,
    },
  ];

  return (
    <div className="space-y-6 font-sans text-xs">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              MODUL PAYROLL
            </span>
            <h1 className="font-sans font-black tracking-tight text-xl mt-3 text-slate-800 flex items-center gap-2">
              Sistem Penggajian Dasar
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
              Generate slip gaji, kelola komponen pendapatan & potongan.
            </p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-4 gap-6">
        <button
          onClick={() => setActiveTab("generate")}
          className={`pb-3 font-bold border-b-2 transition-all ${activeTab === "generate" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Generate & Slip Gaji
        </button>
        <button
          onClick={() => setActiveTab("components")}
          className={`pb-3 font-bold border-b-2 transition-all ${activeTab === "components" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Komponen Gaji
        </button>
      </div>

      {activeTab === "generate" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg">Daftar Payroll</h2>
            <button
              onClick={() =>
                onTriggerNotification("Memulai proses generate payroll...")
              }
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Calculator size={14} />
              <span>Generate Payroll Baru</span>
            </button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse min-w-200">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                  <th className="p-3.5 pl-5">No. Slip</th>
                  <th className="p-3.5">Karyawan</th>
                  <th className="p-3.5">Periode</th>
                  <th className="p-3.5">Total Gaji Bersih</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 pl-5 font-mono font-bold text-indigo-600">
                      {p.number}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {p.employee}
                    </td>
                    <td className="p-3.5">{p.period}</td>
                    <td className="p-3.5 font-mono">
                      Rp {p.total.toLocaleString("id-ID")}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${p.status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded font-bold text-slate-600">
                        Lihat Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "components" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg">Master Komponen Gaji</h2>
            <button
              onClick={() => onTriggerNotification("Form tambah komponen")}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <Plus size={14} />
              <span>Tambah Komponen</span>
            </button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse min-w-200">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                  <th className="p-3.5 pl-5">Kode</th>
                  <th className="p-3.5">Nama Komponen</th>
                  <th className="p-3.5">Tipe</th>
                  <th className="p-3.5">Nilai Default</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {components.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 pl-5 font-mono font-bold">{c.code}</td>
                    <td className="p-3.5 font-bold text-slate-800">{c.name}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${c.type === "Pendapatan" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono">
                      Rp {c.amount.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
