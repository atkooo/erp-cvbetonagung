/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, CheckCircle, X, Plus } from '@/src/components/icons';

interface LeaveManagementViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function LeaveManagementView({ onTriggerNotification }: LeaveManagementViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const leaves = [
    { id: 1, name: 'Siti Aminah', type: 'Cuti Tahunan', startDate: '2026-06-10', endDate: '2026-06-12', days: 3, status: 'Menunggu' },
    { id: 2, name: 'Budi Santoso', type: 'Sakit', startDate: '2026-06-05', endDate: '2026-06-06', days: 2, status: 'Disetujui' },
  ];

  return (
    <div className="space-y-6 font-sans text-xs">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex justify-between items-center relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <span className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            MODUL HRD
          </span>
          <h1 className="font-sans font-black tracking-tight text-xl mt-3 text-slate-800">
            Pengajuan & Approval Cuti
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 px-4 py-2 bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all shadow flex items-center gap-2"
        >
          <Plus size={14} />
          <span>Pengajuan Cuti</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
              <th className="p-3.5 pl-5">Nama Karyawan</th>
              <th className="p-3.5">Jenis Cuti</th>
              <th className="p-3.5">Tanggal Mulai</th>
              <th className="p-3.5">Tanggal Selesai</th>
              <th className="p-3.5">Total Hari</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right pr-5">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leaves.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="p-3.5 pl-5 font-bold text-slate-800">{item.name}</td>
                <td className="p-3.5 text-slate-700 font-medium">{item.type}</td>
                <td className="p-3.5 font-mono text-slate-500">{item.startDate}</td>
                <td className="p-3.5 font-mono text-slate-500">{item.endDate}</td>
                <td className="p-3.5 font-bold">{item.days} Hari</td>
                <td className="p-3.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    item.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-3.5 pr-5 text-right">
                  {item.status === 'Menunggu' && (
                    <div className="flex justify-end gap-2">
                      <button className="px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded text-[10px] font-bold">Approve</button>
                      <button className="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded text-[10px] font-bold">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Form Pengajuan Cuti</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Karyawan</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none">
                  <option>Siti Aminah</option>
                  <option>Budi Santoso</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Jenis Cuti</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none">
                  <option>Cuti Tahunan</option>
                  <option>Cuti Sakit</option>
                  <option>Cuti Menikah</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mulai</label>
                  <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Selesai</label>
                  <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Keterangan / Alasan</label>
                <textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none"></textarea>
              </div>
              <button onClick={() => { onTriggerNotification('Pengajuan cuti berhasil dibuat.'); setIsModalOpen(false); }} className="w-full bg-slate-900 text-white font-bold py-2 rounded-lg mt-2">
                Simpan & Ajukan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
