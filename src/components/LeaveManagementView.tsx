/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, X, Plus } from '@/src/components/icons';
import { hrdApi } from '../features/hrd/api';
import { employeesApi } from '../features/employees/api';
import { Leave, LeaveType } from '../features/hrd/types';
import { Employee } from '../types';

interface LeaveManagementViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function LeaveManagementView({ onTriggerNotification }: LeaveManagementViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [leavesData, typesData, employeesData] = await Promise.all([
        hrdApi.getLeaves(),
        hrdApi.getLeaveTypes(),
        employeesApi.getEmployees(),
      ]);
      setLeaves(leavesData);
      setLeaveTypes(typesData);
      setEmployees(employeesData);
      if (employeesData.length > 0) setSelectedEmployeeId(employeesData[0].id);
      if (typesData.length > 0) setSelectedLeaveTypeId(typesData[0].id);
    } catch (err: any) {
      onTriggerNotification(err.message || 'Gagal memuat data cuti');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const updated = await hrdApi.updateLeaveStatus(id, status);
      setLeaves(prev => prev.map(l => l.id === id ? updated : l));
      onTriggerNotification(`Cuti berhasil di-${status === 'approved' ? 'Setujui' : 'Tolak'}`);
    } catch (err: any) {
      onTriggerNotification(err.message || 'Gagal memperbarui status cuti');
    }
  };

  const handleSubmitLeave = async () => {
    if (!selectedEmployeeId || !selectedLeaveTypeId || !startDate || !endDate) {
      onTriggerNotification('Harap lengkapi semua field!');
      return;
    }
    try {
      const created = await hrdApi.createLeave({
        employeeId: selectedEmployeeId,
        leaveTypeId: selectedLeaveTypeId,
        startDate,
        endDate,
        reason,
        status: 'pending',
      });
      setLeaves([created, ...leaves]);
      onTriggerNotification('Pengajuan cuti berhasil dibuat.');
      setIsModalOpen(false);
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch (err: any) {
      onTriggerNotification(err.message || 'Gagal mengajukan cuti');
    }
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.max(1, Math.ceil(leaves.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeaves = leaves.slice(startIndex, startIndex + itemsPerPage);

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
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">Memuat data cuti...</td>
              </tr>
            ) : paginatedLeaves.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="p-3.5 pl-5 font-bold text-slate-800">{item.employeeName}</td>
                <td className="p-3.5 text-slate-700 font-medium">{item.leaveTypeName}</td>
                <td className="p-3.5 font-mono text-slate-500">{item.startDate}</td>
                <td className="p-3.5 font-mono text-slate-500">{item.endDate}</td>
                <td className="p-3.5 font-bold">{calculateDays(item.startDate, item.endDate)} Hari</td>
                <td className="p-3.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    item.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    item.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {item.status === 'approved' ? 'Disetujui' : item.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                  </span>
                </td>
                <td className="p-3.5 pr-5 text-right">
                  {item.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleUpdateStatus(item.id, 'approved')} className="px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded text-[10px] font-bold">Approve</button>
                      <button onClick={() => handleUpdateStatus(item.id, 'rejected')} className="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded text-[10px] font-bold">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && paginatedLeaves.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Tidak ada data cuti.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-slate-200">
            <div className="text-[10px] text-slate-400 font-mono">
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, leaves.length)} dari {leaves.length} data
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold shadow-sm"
              >
                Prev
              </button>
              <span className="text-slate-500 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
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
                <select value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none">
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Jenis Cuti</label>
                <select value={selectedLeaveTypeId} onChange={e => setSelectedLeaveTypeId(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none">
                  {leaveTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mulai</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Selesai</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Keterangan / Alasan</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-400 focus:outline-none"></textarea>
              </div>
              <button onClick={handleSubmitLeave} className="w-full bg-slate-900 text-white font-bold py-2 rounded-lg mt-2">
                Simpan & Ajukan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
