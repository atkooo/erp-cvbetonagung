/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Compass,
  MapPin,
  Calendar,
  Layers,
  DollarSign,
  ChevronLeft,
  Clock,
  Image as ImageIcon,
  CheckCircle,
  HelpCircle,
  Activity,
  AlertTriangle,
  User,
  ExternalLink,
  ChevronRight,
  Handshake,
  Cpu,
  Truck,
  Wrench,
  X,
  Plus
} from '@/src/components/icons';
import { Project, ViewType } from '../types';
import { authStorage } from '../services/api';
import { projectsApi } from '../features/projects/api';

interface ProjectsViewProps {
  selectedProjectId: string | null;
  onSelectProjectId: (id: string | null) => void;
  onNavigate: (view: ViewType) => void;
  onTriggerNotification: (message: string) => void;
}

export default function ProjectsView({
  selectedProjectId,
  onSelectProjectId,
  onNavigate,
  onTriggerNotification,
}: ProjectsViewProps) {
  const [showEventAddModal, setShowEventAddModal] = useState(false);
  const [newStage, setNewStage] = useState('Produksi Workshop');
  const [newDesc, setNewDesc] = useState('');

  // API states
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await projectsApi.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const getStageIcon = (iconName: string) => {
    switch (iconName) {
      case 'Compass':
        return <Compass size={14} className="text-indigo-600" />;
      case 'FileText':
        return <Layers size={14} className="text-blue-600" />;
      case 'Handshake':
        return <Handshake size={14} className="text-teal-600" />;
      case 'Cpu':
        return <Cpu size={14} className="text-amber-600" />;
      case 'Truck':
        return <Truck size={14} className="text-cyan-600" />;
      case 'Wrench':
        return <Wrench size={14} className="text-purple-600" />;
      default:
        return <CheckCircle size={14} className="text-emerald-600" />;
    }
  };

  // Find selected project
  const project = projects.find((p) => p.id === selectedProjectId);

  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newDesc) return;

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      // Map stage to database status and progress
      let progress = project.progress;
      let status = 'production'; // default

      if (newStage.includes('Survey')) {
        progress = 15;
        status = 'survey';
      } else if (newStage.includes('Produksi')) {
        progress = 45;
        status = 'production';
      } else if (newStage.includes('Pengiriman')) {
        progress = 70;
        status = 'shipping';
      } else if (newStage.includes('Pemasangan')) {
        progress = 85;
        status = 'installation';
      } else if (newStage.includes('Penyelesaian')) {
        progress = 95;
        status = 'installation';
      } else if (newStage.includes('Selesai')) {
        progress = 100;
        status = 'completed';
      }

      // 1. Create timeline event
      await projectsApi.createTimelineEvent({
        project_id: project.id,
        event_date: todayStr,
        stage: newStage,
        description: newDesc,
        icon: newStage.includes('Survey') ? 'Compass' : 'CheckCircle'
      });

      // 2. Update project progress and status
      await projectsApi.updateProject(project.id, { progress, status });

      onTriggerNotification(`Sukses merekam timeline progress: ${newStage}`);
      await loadData();
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal merekam progress');
    }

    setNewDesc('');
    setShowEventAddModal(false);
  };

  // 1. DETAIL VIEW OVERLAY DESIGN
  if (project) {
    return (
      <div className="space-y-6 font-sans">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onSelectProjectId(null)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-bold bg-white border px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition-colors"
          >
            <ChevronLeft size={16} />
            <span>Kembali ke Daftar Proyek</span>
          </button>

          <span className="text-[10px] uppercase font-mono bg-slate-100 text-slate-500 border px-2 py-1 rounded">
            Monitoring Workshop ID: {project.code}
          </span>
        </div>

        {/* Top summary card */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 font-black text-[10px] uppercase tracking-wider rounded border border-amber-500/30">
                  {project.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">{project.location}</span>
              </div>
              <h2 className="text-lg md:text-xl font-sans font-black tracking-tight mt-1.5">{project.projectName}</h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                Mitra Pemesan: <strong>{project.customerName}</strong> | Jenis Proyek: <strong>{project.projectType}</strong> | Spesifikasi: <strong>{project.projectSpec}</strong>
              </p>
            </div>

            <div className="text-left md:text-right shrink-0">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Nilai Borongan Kontrak</span>
              <p className="text-lg font-mono font-black text-white mt-1">{formatIDR(project.contractValue)}</p>
              <div className="flex items-center md:justify-end gap-2 mt-2">
                <span className="text-xs font-bold text-amber-400">{project.progress}% Selesai</span>
                <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div style={{ width: `${project.progress}%` }} className="bg-amber-500 h-full rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Bento section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Column Left: Timeline */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-slate-400">Timeline & Sejarah Konstruksi</h3>
              <button
                onClick={() => setShowEventAddModal(true)}
                className="px-2.5 py-1 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 flex items-center gap-1 transition-colors"
              >
                <Plus size={12} />
                <span>Update Progress</span>
              </button>
            </div>

            <div className="relative border-l border-slate-200 pl-5 ml-2.5 space-y-4 flex-1">
              {project.timeline.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">Belum ada aktivitas terekam.</div>
              ) : (
                project.timeline.map((event, idx) => (
                  <div key={idx} className="relative text-xs">
                    {/* Custom icon */}
                    <span className="absolute -left-[28px] top-0.5 p-1 bg-white border rounded-full shadow-sm">
                      {getStageIcon(event.icon)}
                    </span>
                    <div>
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <strong className="text-slate-800 text-xs">{event.stage}</strong>
                        <span className="font-mono text-[10px] text-slate-400">{event.date}</span>
                      </div>
                      <p className="text-slate-500 mt-1 leading-relaxed text-[11px]">{event.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column Right: Termins and Photos */}
          <div className="lg:col-span-5 space-y-5">
            {/* Block 1: Termins of payments */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-slate-400 border-b pb-3 mb-3">Termin & Penyerapan Dana</h3>
              <div className="space-y-2">
                {project.termin.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">Belum ada termin kontrak didaftarkan.</div>
                ) : (
                  project.termin.map((term, tIdx) => (
                    <div key={tIdx} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between text-xs transition-colors">
                      <div className="space-y-1">
                        <strong className="text-slate-700 block leading-tight">{term.phase}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">Tempo: {term.dueDate}</span>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-mono font-bold text-slate-900 leading-none">{formatIDR(term.amount)}</p>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black leading-none ${
                          term.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800 border' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {term.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Block 2: Documentation photos */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-slate-400 border-b pb-3 mb-3">Audit Dokumentasi Lapangan</h3>
              <div className="grid grid-cols-2 gap-3">
                {project.documentation.length === 0 ? (
                  <div className="col-span-2 text-center py-6 text-slate-400 text-xs">
                    <ImageIcon size={24} className="mx-auto mb-1.5 text-slate-300" />
                    <span>Belum ada foto yang diunggah.</span>
                  </div>
                ) : (
                  project.documentation.map((doc, dIdx) => (
                    <div key={dIdx} className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 relative">
                      <img
                        src={doc.imageUrl}
                        alt={doc.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="p-2 text-[10px]">
                        <strong className="text-slate-700 block truncate" title={doc.title}>{doc.title}</strong>
                        <span className="text-slate-400 font-mono text-[9px] mt-0.5 block">{doc.date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal for update stage */}
        {showEventAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-xs font-sans text-slate-800">
            <div className="bg-white rounded-xl shadow-2xl border max-w-sm w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="px-4 py-3 bg-slate-900 text-white flex justify-between items-center">
                <h4 className="font-bold">Update Catatan Progres</h4>
                <button onClick={() => setShowEventAddModal(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
              </div>

              <form onSubmit={handleAddTimeline} className="p-4 space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tahapan / Stage</label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    className="w-full px-2 py-1.5 border hover:bg-slate-50 rounded text-xs bg-transparent"
                  >
                    <option value="Survey Lokasi">Survey Lokasi</option>
                    <option value="Produksi Workshop">Produksi Workshop</option>
                    <option value="Pengiriman Material">Pengiriman Material</option>
                    <option value="Pemasangan Scaffolding">Pemasangan Scaffolding</option>
                    <option value="Penyelesaian Pekerjaan">Penyelesaian Pekerjaan</option>
                    <option value="Selesai & Serah Terima">Selesai & Serah Terima</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Keterangan Aktivitas</label>
                  <textarea
                    rows={3}
                    required
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Contoh: Produksi modul selesai 60%. Material utama sudah masuk QC dan siap dikirim ke lokasi."
                    className="w-full px-2.5 py-1.5 border rounded resize-none"
                  />
                </div>

                <div className="pt-2 border-t flex justify-end gap-1.5 text-xs font-bold">
                  <button type="button" onClick={() => setShowEventAddModal(false)} className="px-3 py-1.5 border rounded">Batal</button>
                  <button type="submit" className="px-4 py-1.5 bg-slate-900 text-white rounded">Simpan Progress</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. LIST VIEW DESIGN
  return (
    <div className="space-y-6">
      {/* Visual Top block */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-sans font-bold text-sm text-slate-850 uppercase tracking-tight flex items-center gap-2">
            Portofolio Pelaksanaan Proyek
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Sistem pelacakan pekerjaan workshop, pengiriman material, progres lapangan, serta penarikan termin pembayaran.</p>
        </div>
        <button
          onClick={() => {
            onTriggerNotification('Fungsi registrasi pengerjaan proyek baru. Membuka form kontrak...');
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5 shrink-0"
        >
          <Compass size={14} />
          <span>Daftarkan Kontrak Proyek</span>
        </button>
      </div>

      {/* Main projects grid listings */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Memuat daftar proyek...</div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center py-16">
          <AlertTriangle size={32} className="mx-auto mb-3 text-slate-300 stroke-[1.5]" />
          <h4 className="font-bold text-slate-700 text-sm">Belum Ada Proyek Terdaftar</h4>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Belum ada data kontrak proyek terdaftar dalam database. Silakan gunakan tombol di atas untuk mendaftarkan kontrak proyek baru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            // Compute status colors
            const statusColors: any = {
              Survey: 'bg-indigo-100 text-indigo-700 border-indigo-200',
              Penawaran: 'bg-blue-50 text-blue-700 border-blue-200',
              Deal: 'bg-teal-50 text-teal-700 border-teal-200',
              Produksi: 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse',
              Pengiriman: 'bg-cyan-50 text-cyan-700 border-cyan-200',
              Pemasangan: 'bg-purple-50 text-purple-700 border-purple-200',
              Selesai: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            };

            return (
              <div
                key={proj.id}
                onClick={() => onSelectProjectId(proj.id)}
                className="bg-white border hover:border-slate-300 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5 space-y-4">
                  {/* Header listing row */}
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-400 font-bold px-1.5 py-0.5 rounded border">
                      {proj.code}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      statusColors[proj.status] || 'bg-slate-100'
                    }`}>
                      {proj.status}
                    </span>
                  </div>

                  {/* Main titles */}
                  <div>
                    <h4 className="font-sans font-bold text-sm text-slate-800 leading-snug truncate" title={proj.projectName}>
                      {proj.projectName}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{proj.location}</span>
                    </div>
                  </div>

                  {/* Spec and contracts */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150/50 text-[11px] leading-relaxed">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Jenis:</span>
                      <strong className="text-slate-700">{proj.projectType}</strong>
                    </div>
                    <div className="flex justify-between mt-1 gap-3">
                      <span className="text-slate-400">Spesifikasi:</span>
                      <strong className="text-slate-700 text-right">{proj.projectSpec}</strong>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-slate-400">Nilai Kontrak:</span>
                      <strong className="text-slate-800 font-bold">{formatIDR(proj.contractValue)}</strong>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between font-bold text-slate-650">
                      <span>Progres Pekerjaan</span>
                      <span className="text-amber-600 font-mono">{proj.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${proj.progress}%` }}
                        className="h-full bg-amber-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer controls */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-mono text-[10px]">
                    <Calendar size={12} className="text-slate-400" />
                    <span>Due: {proj.deadline}</span>
                  </span>
                  <span className="text-cyan-600 font-bold flex items-center gap-1">
                    <span>Lihat Detil</span>
                    <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
