/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileDown, Plus, CheckCircle2, AlertTriangle, FileText, X, RefreshCw
} from '@/src/components/icons';
import Swal from 'sweetalert2';
import { supportApi } from '../features/support/api';
import { DocumentExport } from '../features/support/types';

interface DocumentExportsViewProps {
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

export default function DocumentExportsView({ onTriggerNotification }: DocumentExportsViewProps) {
  const [exports, setExports] = useState<DocumentExport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [showNewExportModal, setShowNewExportModal] = useState(false);
  const [newDocType, setNewDocType] = useState('Quotation');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newExportFormat, setNewExportFormat] = useState('pdf');
  const [newDivision, setNewDivision] = useState('Sales');

  useEffect(() => {
    fetchExports();
  }, []);

  const fetchExports = async () => {
    setIsLoading(true);
    try {
      const data = await supportApi.getDocumentExports();
      setExports(data);
    } catch (error) {
      console.error('Error fetching exports:', error);
      onTriggerNotification('Gagal memuat riwayat ekspor dokumen.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocNumber) {
      Swal.fire('Error', 'Silakan masukkan nomor/nama dokumen.', 'error');
      return;
    }

    try {
      // 1. Create Export Log
      await supportApi.createDocumentExport({
        document_type: newDocType,
        document_number: newDocNumber,
        export_format: newExportFormat,
        division: newDivision,
      });

      // 2. Simulate File Download
      const dataStr = `DOKUMEN RESMI CV BETON AGUNG\n=================================\nJenis Dokumen  : ${newDocType}\nNomor Dokumen  : ${newDocNumber}\nDivisi Pembuat : ${newDivision}\nFormat Ekspor  : ${newExportFormat.toUpperCase()}\nWaktu Ekspor   : ${new Date().toLocaleString()}\n\nCatatan: Dokumen ini telah diverifikasi oleh sistem ERP.`;
      const blob = new Blob([dataStr], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${newDocType.toLowerCase().replace(/\s+/g, '_')}_${newDocNumber.replace(/\//g, '_')}.${newExportFormat === 'pdf' ? 'txt' : newExportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Swal.fire('Sukses', 'Dokumen berhasil diekspor dan diunduh.', 'success');
      onTriggerNotification(`Ekspor ${newDocType} ${newDocNumber} berhasil.`);
      setShowNewExportModal(false);
      setNewDocNumber('');
      fetchExports();
    } catch (error) {
      console.error('Error creating export:', error);
      Swal.fire('Gagal', 'Terjadi kesalahan saat mengekspor dokumen.', 'error');
    }
  };

  const handleDownloadExisting = (exp: DocumentExport) => {
    const dataStr = `DOKUMEN RESMI CV BETON AGUNG\n=================================\nJenis Dokumen  : ${exp.documentType}\nNomor Dokumen  : ${exp.documentNumber}\nDivisi Pembuat : ${exp.division}\nFormat Ekspor  : ${exp.exportFormat}\nWaktu Ekspor   : ${exp.exportedAt}\n\nCatatan: Re-download arsip ekspor sistem ERP.`;
    const blob = new Blob([dataStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exp.documentType.toLowerCase().replace(/\s+/g, '_')}_${exp.documentNumber.replace(/\//g, '_')}.${exp.exportFormat === 'PDF' ? 'txt' : exp.exportFormat.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onTriggerNotification(`Mengunduh ulang dokumen ${exp.documentNumber}.`);
  };

  // Metrics
  const pdfCount = exports.filter(e => e.exportFormat === 'PDF').length;
  const spreadsheetCount = exports.filter(e => e.exportFormat === 'XLSX' || e.exportFormat === 'CSV').length;

  return (
    <div className="space-y-6 text-xs font-sans">
      <Header
        icon={<FileDown size={20} />}
        title="Export & Print Dokumen"
        desc="Arsip pencetakan dokumen formal perusahaan. Konversikan laporan atau transaksi menjadi format PDF siap cetak atau spreadsheet XLSX."
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          ['PDF Siap Cetak', `${pdfCount} Dokumen`, 'cyan'],
          ['Spreadsheet (XLSX)', `${spreadsheetCount} Laporan`, 'amber'],
          ['Total Riwayat Ekspor', `${exports.length} Entri`, 'emerald']
        ].map(([label, value, tone]) => (
          <Panel key={label} className="p-4">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">{label}</span>
            <div className="mt-1.5 flex items-center justify-between">
              <strong className="text-lg font-black text-slate-900">{value}</strong>
              <StatusPill tone={tone as any}>Terarsip</StatusPill>
            </div>
          </Panel>
        ))}
      </div>

      {/* Table & Controls Panel */}
      <Panel className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Riwayat Ekspor Dokumen</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchExports}
              className="flex items-center gap-1.5 px-3 py-2 border bg-white hover:bg-slate-50 rounded-lg font-bold text-slate-600 transition"
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
              <span>Segarkan</span>
            </button>
            <button
              onClick={() => setShowNewExportModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition"
            >
              <Plus size={14} />
              <span>Ekspor Dokumen Baru</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="animate-spin text-slate-400" size={24} />
          </div>
        ) : exports.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <AlertTriangle size={24} className="mx-auto mb-2 text-slate-300" />
            <p>Belum ada riwayat dokumen yang diekspor.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                  <th className="p-3.5 pl-5">Jenis Dokumen</th>
                  <th className="p-3.5">Nomor / Nama File</th>
                  <th className="p-3.5">Format</th>
                  <th className="p-3.5">Divisi</th>
                  <th className="p-3.5">Diunduh Oleh</th>
                  <th className="p-3.5">Waktu Ekspor</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exports.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 pl-5 font-bold text-slate-700">{exp.documentType}</td>
                    <td className="p-3.5 font-mono text-cyan-600 font-bold">{exp.documentNumber}</td>
                    <td className="p-3.5">
                      <StatusPill tone={exp.exportFormat === 'PDF' ? 'cyan' : 'amber'}>
                        {exp.exportFormat}
                      </StatusPill>
                    </td>
                    <td className="p-3.5 text-slate-600">{exp.division}</td>
                    <td className="p-3.5 text-slate-500">{exp.exportedByName}</td>
                    <td className="p-3.5 font-mono text-slate-500">{exp.exportedAt}</td>
                    <td className="p-3.5 pr-5 text-right">
                      <button
                        onClick={() => handleDownloadExisting(exp)}
                        className="px-2.5 py-1.5 border rounded-lg bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 ml-auto transition flex items-center gap-1"
                      >
                        <FileText size={12} />
                        <span>Unduh File</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Modal: New Export */}
      {showNewExportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Ekspor Dokumen Baru</h4>
              <button onClick={() => setShowNewExportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateExport} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Tipe Dokumen</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  required
                >
                  <option value="Quotation">Quotation Penawaran</option>
                  <option value="Sales Order">Sales Order (SO)</option>
                  <option value="Invoice">Invoice Tagihan</option>
                  <option value="Surat Jalan">Surat Jalan (DO)</option>
                  <option value="Purchase Order">Purchase Order (PO)</option>
                  <option value="Laporan Stok">Laporan Stok Gudang</option>
                  <option value="Laporan Kas">Laporan Buku Kas Besar</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Nomor / Nama Dokumen</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                  value={newDocNumber}
                  onChange={(e) => setNewDocNumber(e.target.value)}
                  placeholder="Contoh: QT-2026-05-011 atau STOCK-2026-06"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Format Ekspor</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                    value={newExportFormat}
                    onChange={(e) => setNewExportFormat(e.target.value)}
                    required
                  >
                    <option value="pdf">PDF (Siap Cetak)</option>
                    <option value="xlsx">XLSX (Spreadsheet)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Divisi Peminta</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                    value={newDivision}
                    onChange={(e) => setNewDivision(e.target.value)}
                    required
                  >
                    <option value="Sales">Sales & Marketing</option>
                    <option value="Finance">Finance & Kasir</option>
                    <option value="Gudang">Logistik & Gudang</option>
                    <option value="Purchasing">Pembelian / Procurement</option>
                    <option value="Admin">Administrasi Umum</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewExportModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800"
                >
                  Generate & Unduh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
