/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  FileSearch,
  Search,
  FileDown,
  RefreshCw,
  AlertTriangle,
} from "@/src/components/icons";
import { supportApi } from "../features/support/api";
import { AuditLog } from "../features/support/types";

interface AuditLogViewProps {
  onTriggerNotification: (message: string) => void;
}

const Panel = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const Header = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <Panel className="p-5">
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg">{icon}</div>
      <div>
        <h3 className="font-sans font-bold text-sm text-slate-800">{title}</h3>
        <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
      </div>
    </div>
  </Panel>
);

const StatusPill = ({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "cyan" | "amber" | "emerald" | "rose" | "indigo";
}) => {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

export default function AuditLogView({
  onTriggerNotification,
}: AuditLogViewProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await supportApi.getAuditLogs();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      onTriggerNotification("Gagal memuat log audit aktivitas.");
    } finally {
      setIsLoading(false);
    }
  }, [onTriggerNotification]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = [
      "Waktu",
      "User",
      "Role",
      "Aksi",
      "Tipe Objek",
      "Nomor Objek",
      "Ringkasan",
      "IP Address",
    ];
    const rows = filteredLogs.map((log) => [
      log.createdAt,
      log.userName,
      log.roleName,
      log.action,
      log.objectType,
      log.objectNumber,
      log.summary,
      log.ipAddress,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [
        headers.join(","),
        ...rows.map((e) =>
          e
            .map((val) => `"${(val || "").toString().replace(/"/g, '""')}"`)
            .join(","),
        ),
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `audit_log_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onTriggerNotification("Audit log berhasil di-export ke CSV.");
  };

  // Filtering
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.objectType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.objectNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction =
      filterAction === "ALL" || log.action.toUpperCase() === filterAction;

    return matchesSearch && matchesAction;
  });

  const getActionTone = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("CREATE")) return "emerald";
    if (act.includes("UPDATE")) return "amber";
    if (act.includes("DELETE")) return "rose";
    if (act.includes("APPROVE") || act.includes("VERIFY")) return "cyan";
    if (act.includes("LOGIN") || act.includes("LOGOUT")) return "indigo";
    return "slate";
  };

  // Distinct actions for filter dropdown
  const actionOptions = [
    "ALL",
    "CREATE",
    "UPDATE",
    "DELETE",
    "APPROVE",
    "REJECT",
    "LOGIN",
    "EXPORT",
  ];

  return (
    <div className="space-y-6 text-xs font-sans">
      <Header
        icon={<FileSearch size={20} />}
        title="Audit Log Aktivitas Sistem"
        desc="Jejak audit permanen untuk merekam setiap penambahan, pembaruan, penghapusan, verifikasi, dan ekspor data."
      />

      <Panel className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 border border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full md:w-60">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Cari log..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:border-cyan-500 text-xs bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-slate-400 font-medium whitespace-nowrap">
              Aksi:
            </span>
            <select
              className="px-2 py-2 border rounded-lg focus:outline-none focus:border-cyan-500 bg-white font-bold text-slate-700 text-xs w-full md:w-auto"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
              {actionOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "ALL" ? "Semua Aksi" : opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-2 border bg-white hover:bg-slate-50 rounded-lg font-bold text-slate-600 transition"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            <span>Segarkan</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 rounded-lg font-bold transition"
          >
            <FileDown size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="animate-spin text-slate-400" size={24} />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <AlertTriangle size={24} className="mx-auto mb-2 text-slate-300" />
            <p>Tidak ada rekaman log audit yang cocok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-187.5">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                  <th className="p-3.5 pl-5">Waktu</th>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Aksi</th>
                  <th className="p-3.5">Objek / Referensi</th>
                  <th className="p-3.5">Ringkasan Aktivitas</th>
                  <th className="p-3.5 pr-5">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 pl-5 font-mono text-slate-500">
                      {log.createdAt}
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">
                      {log.userName}
                    </td>
                    <td className="p-3.5 text-slate-500">{log.roleName}</td>
                    <td className="p-3.5">
                      <StatusPill tone={getActionTone(log.action)}>
                        {log.action}
                      </StatusPill>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">
                      <span className="block text-slate-400 text-[10px]">
                        {log.objectType}
                      </span>
                      <span className="text-cyan-600 font-bold">
                        {log.objectNumber}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">
                      {log.summary}
                    </td>
                    <td className="p-3.5 pr-5 font-mono text-slate-400">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
