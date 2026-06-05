/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BellRing, Clock, CheckCircle2, AlertTriangle, Eye, Check, RefreshCw
} from 'lucide-react';
import Swal from 'sweetalert2';
import { supportApi } from '../features/support/api';
import { Reminder } from '../features/support/types';

interface RemindersViewProps {
  onTriggerNotification: (message: string) => void;
}

const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
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

const StatusPill = ({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'cyan' | 'amber' | 'emerald' | 'rose' | 'indigo' }) => {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${tones[tone]}`}>
      {children}
    </span>
  );
};

export default function RemindersView({ onTriggerNotification }: RemindersViewProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'completed'>('open');

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const data = await supportApi.getReminders();
      setReminders(data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      onTriggerNotification('Gagal memuat pengingat.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkCompleted = async (id: string, refNum: string) => {
    const result = await Swal.fire({
      title: 'Tandai Selesai?',
      text: `Apakah Anda yakin ingin menandai pengingat ${refNum} sebagai selesai?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Selesai',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await supportApi.updateReminderStatus(id, 'completed');
        Swal.fire('Sukses', 'Pengingat berhasil diselesaikan.', 'success');
        onTriggerNotification(`Pengingat ${refNum} ditandai selesai.`);
        fetchReminders();
      } catch (error) {
        console.error('Error completing reminder:', error);
        Swal.fire('Gagal', 'Terjadi kesalahan saat memperbarui status pengingat.', 'error');
      }
    }
  };

  const filteredReminders = reminders.filter(rem => {
    if (filterStatus === 'all') return true;
    return rem.status === filterStatus;
  });

  const getPriorityTone = (priority: string) => {
    switch (priority) {
      case 'high': return 'rose';
      case 'medium': return 'amber';
      case 'low': return 'slate';
      default: return 'slate';
    }
  };

  const getReminderTypeLabel = (type: string) => {
    switch (type) {
      case 'due_invoice': return 'Tagihan Jatuh Tempo';
      case 'low_stock': return 'Stok Minimum Tercapai';
      case 'project_deadline': return 'Deadline Pekerjaan Proyek';
      case 'po_delivery': return 'Pengiriman PO Jatuh Tempo';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      <Header
        icon={<BellRing size={20} />}
        title="Notifikasi & Reminder"
        desc="Pusat kontrol pengingat otomatis untuk invoice, stok minimum, pengiriman purchasing, dan tenggat waktu proyek."
      />

      {/* Filter Row */}
      <Panel className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 border border-slate-200">
        <div className="flex items-center gap-1.5">
          {[
            ['open', 'Aktif'],
            ['completed', 'Selesai'],
            ['all', 'Semua'],
          ].map(([status, label]) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                filterStatus === status
                  ? 'bg-slate-900 text-white border-slate-950'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={fetchReminders}
          className="flex items-center gap-1.5 px-3 py-2 border bg-white hover:bg-slate-50 rounded-lg font-bold text-slate-600 transition"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          <span>Segarkan</span>
        </button>
      </Panel>

      {/* Reminders Table */}
      <Panel className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="animate-spin text-slate-400" size={24} />
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <CheckCircle2 size={24} className="mx-auto mb-2 text-slate-300" />
            <p>Tidak ada pengingat pada kategori ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                  <th className="p-3.5 pl-5">Jenis Pengingat</th>
                  <th className="p-3.5">Objek Referensi</th>
                  <th className="p-3.5">Divisi</th>
                  <th className="p-3.5">Jadwal Pengingat</th>
                  <th className="p-3.5">Prioritas</th>
                  <th className="p-3.5">Ditugaskan Ke</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReminders.map((rem) => (
                  <tr key={rem.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 pl-5 font-bold text-slate-700">{getReminderTypeLabel(rem.type)}</td>
                    <td className="p-3.5 font-mono text-cyan-600 font-bold">{rem.referenceNumber}</td>
                    <td className="p-3.5 text-slate-600 font-medium">{rem.division}</td>
                    <td className="p-3.5 font-mono text-slate-500 flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" />
                      <span>{rem.scheduleAt}</span>
                    </td>
                    <td className="p-3.5">
                      <StatusPill tone={getPriorityTone(rem.priority)}>{rem.priority}</StatusPill>
                    </td>
                    <td className="p-3.5 text-slate-500">{rem.assignedToName}</td>
                    <td className="p-3.5">
                      <StatusPill tone={rem.status === 'completed' ? 'emerald' : 'cyan'}>{rem.status}</StatusPill>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      {rem.status !== 'completed' ? (
                        <button
                          onClick={() => handleMarkCompleted(rem.id, rem.referenceNumber)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold ml-auto transition text-[10px]"
                        >
                          <Check size={12} />
                          <span>Selesaikan</span>
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5 justify-end">
                          <CheckCircle2 size={12} />
                          <span>Sudah Selesai</span>
                        </span>
                      )}
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
