/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calculator, Plus, Trash2, RefreshCw, AlertTriangle, X, CheckCircle2
} from 'lucide-react';
import Swal from 'sweetalert2';
import { projectsApi } from '../features/projects/api';
import { ProjectBudgetItem, ProjectDto } from '../features/projects/types';
import { Project } from '../types';

interface ProjectBudgetingViewProps {
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

const formatIDR = (num: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
};

export default function ProjectBudgetingView({ onTriggerNotification }: ProjectBudgetingViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgetItems, setBudgetItems] = useState<ProjectBudgetItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [newComponent, setNewComponent] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState<number>(0);
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [projs, budgets] = await Promise.all([
        projectsApi.getProjects(),
        projectsApi.getProjectBudgets()
      ]);
      setProjects(projs);
      setBudgetItems(budgets);
      if (projs.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projs[0].id);
      }
    } catch (error) {
      console.error('Error fetching project budget data:', error);
      onTriggerNotification('Gagal memuat data anggaran proyek.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      Swal.fire('Error', 'Silakan pilih Proyek terlebih dahulu.', 'error');
      return;
    }
    if (!newComponent || newBudgetAmount <= 0) {
      Swal.fire('Error', 'Komponen dan Nilai Budget harus diisi.', 'error');
      return;
    }

    try {
      await projectsApi.createProjectBudget({
        project_id: selectedProjectId,
        component: newComponent,
        budget_amount: newBudgetAmount,
        notes: newNotes
      });

      Swal.fire('Sukses', 'Komponen anggaran berhasil ditambahkan.', 'success');
      onTriggerNotification(`Anggaran ${newComponent} ditambahkan.`);
      setShowAddModal(false);
      setNewComponent('');
      setNewBudgetAmount(0);
      setNewNotes('');
      
      // refresh budget items
      const budgets = await projectsApi.getProjectBudgets();
      setBudgetItems(budgets);
    } catch (error) {
      console.error('Error creating project budget:', error);
      Swal.fire('Gagal', 'Terjadi kesalahan saat menambahkan anggaran.', 'error');
    }
  };

  const handleDeleteBudget = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Hapus Anggaran?',
      text: `Apakah Anda yakin ingin menghapus anggaran "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await projectsApi.deleteProjectBudget(id);
        Swal.fire('Terhapus', 'Anggaran telah dihapus.', 'success');
        onTriggerNotification(`Anggaran ${name} telah dihapus.`);
        
        // refresh list
        const budgets = await projectsApi.getProjectBudgets();
        setBudgetItems(budgets);
      } catch (error) {
        console.error('Error deleting project budget:', error);
        Swal.fire('Gagal', 'Terjadi kesalahan saat menghapus anggaran.', 'error');
      }
    }
  };

  // Selected Project Details
  const activeProject = projects.find(p => p.id === selectedProjectId);
  const activeBudgets = budgetItems.filter(item => item.projectId === selectedProjectId);

  // Calculations
  const contractValue = activeProject?.contractValue || 0;
  const totalBudget = activeBudgets.reduce((acc, curr) => acc + curr.budgetAmount, 0);
  const totalActual = activeBudgets.reduce((acc, curr) => acc + curr.actualAmount, 0);
  const projectedMargin = contractValue - totalBudget;
  const projectedMarginPercent = contractValue > 0 ? (projectedMargin / contractValue) * 100 : 0;

  const getVariance = (actual: number, budget: number) => {
    if (budget === 0) return '0%';
    const pct = ((actual - budget) / budget) * 100;
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
  };

  const getVarianceTone = (actual: number, budget: number) => {
    if (actual > budget) return 'rose'; // over budget
    if (actual === budget) return 'cyan';
    return 'emerald'; // under budget
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      <Header
        icon={<Calculator size={20} />}
        title="Project Budgeting & RAB"
        desc="Rencana Anggaran Biaya (RAB) Proyek. Bandingkan proyeksi estimasi biaya dengan realisasi pengeluaran lapangan secara real-time."
      />

      {/* Selector Row */}
      <Panel className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 border border-slate-200">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="font-bold text-slate-700 whitespace-nowrap">Pilih Proyek:</span>
          <select
            className="flex-1 md:w-80 px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500 bg-white font-bold text-slate-800 text-xs"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.projectName} ({p.code})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 border bg-white hover:bg-slate-50 rounded-lg font-bold text-slate-600 transition"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            disabled={!selectedProjectId}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-bold transition"
          >
            <Plus size={14} />
            <span>Tambah Anggaran RAB</span>
          </button>
        </div>
      </Panel>

      {selectedProjectId && activeProject && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['Nilai Kontrak Proyek', formatIDR(contractValue), 'indigo', 'Kontrak'],
              ['Total Budget RAB', formatIDR(totalBudget), 'cyan', 'Estimasi'],
              ['Realisasi Biaya Lapangan', formatIDR(totalActual), totalActual > totalBudget ? 'rose' : 'emerald', 'Aktual'],
              ['Margin Proyeksi', `${formatIDR(projectedMargin)} (${projectedMarginPercent.toFixed(1)}%)`, projectedMargin < 0 ? 'rose' : 'emerald', 'Profitability']
            ].map(([label, value, tone, sub]) => (
              <Panel key={label} className="p-4">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">{label}</span>
                <div className="mt-1.5 flex items-center justify-between">
                  <strong className="text-base font-black text-slate-900">{value}</strong>
                  <StatusPill tone={tone as any}>{sub}</StatusPill>
                </div>
              </Panel>
            ))}
          </div>

          {/* Details Table */}
          <Panel className="overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Rincian Anggaran: {activeProject.projectName}
              </h4>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <RefreshCw className="animate-spin text-slate-400" size={24} />
              </div>
            ) : activeBudgets.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <AlertTriangle size={24} className="mx-auto mb-2 text-slate-300" />
                <p>Belum ada rincian RAB untuk proyek ini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                      <th className="p-3.5 pl-5">Komponen Biaya</th>
                      <th className="p-3.5">Budget Anggaran</th>
                      <th className="p-3.5">Realisasi Biaya</th>
                      <th className="p-3.5">Variance (%)</th>
                      <th className="p-3.5">Catatan/Notes</th>
                      <th className="p-3.5 pr-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeBudgets.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5 pl-5 font-bold text-slate-700">{item.component}</td>
                        <td className="p-3.5 font-mono text-slate-600">{formatIDR(item.budgetAmount)}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">{formatIDR(item.actualAmount)}</td>
                        <td className="p-3.5">
                          <StatusPill tone={getVarianceTone(item.actualAmount, item.budgetAmount)}>
                            {getVariance(item.actualAmount, item.budgetAmount)}
                          </StatusPill>
                        </td>
                        <td className="p-3.5 text-slate-500 font-medium">{item.notes}</td>
                        <td className="p-3.5 pr-5 text-right">
                          <button
                            onClick={() => handleDeleteBudget(item.id, item.component)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded ml-auto transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}

      {/* Modal: Add Budget Item */}
      {showAddModal && selectedProjectId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Tambah Item Anggaran RAB</h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleCreateBudget} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Proyek Terpilih</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-slate-500 font-bold"
                  value={activeProject ? `${activeProject.projectName} (${activeProject.code})` : ''}
                  disabled
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Komponen Biaya</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                  placeholder="Contoh: Pembelian Semen Portland, Upah Cor Harian"
                  value={newComponent}
                  onChange={(e) => setNewComponent(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Jumlah Anggaran (IDR)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500 font-mono font-bold"
                  placeholder="Masukkan nominal"
                  value={newBudgetAmount || ''}
                  onChange={(e) => setNewBudgetAmount(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Keterangan / Notes</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                  placeholder="Catatan tambahan spesifikasi..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
                >
                  Simpan Anggaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
