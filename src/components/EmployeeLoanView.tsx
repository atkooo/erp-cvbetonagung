/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HandCoins, Plus, Search, CheckCircle, AlertCircle, X } from '@/src/components/icons';

interface EmployeeLoanViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function EmployeeLoanView({ onTriggerNotification }: EmployeeLoanViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loans = [
    { id: 1, number: 'LOAN-2026-001', employee: 'Ahmad Mulyadi', amount: 2000000, date: '2026-06-01', remaining: 1500000, installment: 500000, status: 'Approved' },
    { id: 2, number: 'LOAN-2026-002', employee: 'Siti Aminah', amount: 1000000, date: '2026-06-05', remaining: 1000000, installment: 250000, status: 'Pending' },
  ];

  return (
    <div className="space-y-6 font-sans text-xs">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              MODUL PAYROLL ADVANCED
            </span>
            <h1 className="font-sans font-black tracking-tight text-xl mt-3 text-slate-800 flex items-center gap-2">
              Kasbon & Pinjaman Karyawan
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
              Kelola pengajuan pinjaman/kasbon dan atur pemotongan otomatis per payroll.
            </p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm hover:bg-slate-800 transition-colors">
            <Plus size={14} />
            <span>Pengajuan Kasbon Baru</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Total Pinjaman Aktif</span>
            <h4 className="text-lg font-black text-slate-800 mt-1">Rp 3.000.000</h4>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-500 rounded-lg">
            <HandCoins size={18} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Menunggu Approval</span>
            <h4 className="text-lg font-black text-amber-600 mt-1">1 Pengajuan</h4>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <AlertCircle size={18} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Sisa Tagihan Karyawan</span>
            <h4 className="text-lg font-black text-indigo-600 mt-1">Rp 2.500.000</h4>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <HandCoins size={18} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Cari nama atau nomor referensi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
              <th className="p-3.5 pl-5">Nomor Pinjaman</th>
              <th className="p-3.5">Karyawan</th>
              <th className="p-3.5">Tanggal</th>
              <th className="p-3.5">Total Pinjaman</th>
              <th className="p-3.5">Sisa Belum Lunas</th>
              <th className="p-3.5">Potongan /Bulan</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 pr-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loans.map(l => (
              <tr key={l.id} className="hover:bg-slate-50/50">
                <td className="p-3.5 pl-5 font-mono font-bold text-indigo-600">{l.number}</td>
                <td className="p-3.5 font-bold text-slate-800">{l.employee}</td>
                <td className="p-3.5 font-mono text-slate-500">{l.date}</td>
                <td className="p-3.5 font-mono">Rp {l.amount.toLocaleString('id-ID')}</td>
                <td className="p-3.5 font-mono font-bold text-rose-600">Rp {l.remaining.toLocaleString('id-ID')}</td>
                <td className="p-3.5 font-mono">Rp {l.installment.toLocaleString('id-ID')}</td>
                <td className="p-3.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${l.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {l.status}
                  </span>
                </td>
                <td className="p-3.5 pr-5 text-right">
                  {l.status === 'Pending' && (
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => onTriggerNotification('Pinjaman disetujui')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-200">
                        <CheckCircle size={14} />
                      </button>
                      <button onClick={() => onTriggerNotification('Pinjaman ditolak')} className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-200">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {l.status === 'Approved' && (
                    <button className="px-2 py-1 bg-slate-100 hover:bg-slate-200 font-bold rounded text-slate-600">Detail</button>
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
              <h3 className="font-bold text-lg">Pengajuan Kasbon Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Pilih Karyawan</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none">
                  <option>Siti Aminah</option>
                  <option>Budi Santoso</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Pengajuan</label>
                  <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none" defaultValue="2026-06-06" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Total Pinjaman (Rp)</label>
                  <input type="number" placeholder="0" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Potongan per Payroll (Rp)</label>
                <input type="number" placeholder="0" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Alasan Pengajuan</label>
                <textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none"></textarea>
              </div>
              <button onClick={() => { onTriggerNotification('Pengajuan kasbon berhasil disimpan'); setIsModalOpen(false); }} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg mt-2 transition-colors">
                Simpan & Ajukan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
