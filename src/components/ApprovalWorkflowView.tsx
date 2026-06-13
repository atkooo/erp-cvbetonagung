/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck, Clock, CheckCircle2, XCircle, AlertTriangle, Eye, X, RefreshCw, Search
} from '@/src/components/icons';
import Swal from 'sweetalert2';
import { inventoryApi } from '../features/inventory/api';
import { ApprovalRequest } from '../features/inventory/types';

interface ApprovalWorkflowViewProps {
  onTriggerNotification: (message: string) => void;
}

const formatIDR = (num: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
};

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

export default function ApprovalWorkflowView({ onTriggerNotification }: ApprovalWorkflowViewProps) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await inventoryApi.getApprovalRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
      onTriggerNotification('Gagal memuat daftar pengajuan persetujuan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecision = async (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;

    const actionText = status === 'approved' ? 'Menyetujui' : 'Menolak';
    const confirmButtonColor = status === 'approved' ? '#0891b2' : '#e11d48';

    const result = await Swal.fire({
      title: `${actionText} Pengajuan?`,
      text: `Apakah Anda yakin ingin ${status === 'approved' ? 'menyetujui' : 'menolak'} pengajuan ${selectedRequest.approvalNumber}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: status === 'approved' ? 'Ya, Setujui' : 'Ya, Tolak',
      cancelButtonText: 'Batal',
      confirmButtonColor: confirmButtonColor
    });

    if (result.isConfirmed) {
      try {
        await inventoryApi.updateApprovalRequest(selectedRequest.id, status, decisionNotes);
        Swal.fire(
          status === 'approved' ? 'Disetujui' : 'Ditolak',
          `Pengajuan ${selectedRequest.approvalNumber} berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}.`,
          'success'
        );
        onTriggerNotification(`Pengajuan ${selectedRequest.approvalNumber} ${status === 'approved' ? 'DISETUJUI' : 'DITOLAK'}.`);
        setSelectedRequest(null);
        setDecisionNotes('');
        fetchRequests();
      } catch (error) {
        console.error('Error deciding request:', error);
        Swal.fire('Gagal', 'Terjadi kesalahan saat memproses keputusan.', 'error');
      }
    }
  };

  const handleBulkDecision = async (status: 'approved' | 'rejected') => {
    if (selectedRequestIds.length === 0) return;

    const actionText = status === 'approved' ? 'Menyetujui' : 'Menolak';
    const confirmButtonColor = status === 'approved' ? '#0891b2' : '#e11d48';

    const result = await Swal.fire({
      title: `${actionText} Massal?`,
      text: `Apakah Anda yakin ingin ${status === 'approved' ? 'menyetujui' : 'menolak'} ${selectedRequestIds.length} pengajuan sekaligus?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: status === 'approved' ? 'Ya, Setujui' : 'Ya, Tolak',
      cancelButtonText: 'Batal',
      confirmButtonColor: confirmButtonColor
    });

    if (result.isConfirmed) {
      setIsSubmittingBulk(true);
      let successCount = 0;
      try {
        for (const reqId of selectedRequestIds) {
          await inventoryApi.updateApprovalRequest(reqId, status, '');
          successCount++;
        }
        Swal.fire(
          status === 'approved' ? 'Disetujui' : 'Ditolak',
          `${successCount} pengajuan berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}.`,
          'success'
        );
        onTriggerNotification(`${successCount} pengajuan ${status === 'approved' ? 'DISETUJUI' : 'DITOLAK'}.`);
        setSelectedRequestIds([]);
        fetchRequests();
      } catch (error) {
        console.error('Error deciding bulk requests:', error);
        Swal.fire('Info', `Hanya ${successCount} dari ${selectedRequestIds.length} pengajuan yang berhasil diproses.`, 'warning');
        fetchRequests();
      } finally {
        setIsSubmittingBulk(false);
      }
    }
  };

  // Metrics calculations
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  const filteredRequests = requests.filter(r => 
    r.approvalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.requestType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.changeSummary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'stock_opname_adjustment': return 'Koreksi Stok Opname';
      case 'quotation_discount': return 'Diskon Penawaran';
      case 'purchase_order': return 'PO Supplier';
      case 'invoice_cancellation': return 'Pembatalan Invoice';
      default: return type;
    }
  };

  const getStatusTone = (status: string) => {
    switch (status) {
      case 'pending': return 'amber';
      case 'approved': return 'emerald';
      case 'rejected': return 'rose';
      default: return 'slate';
    }
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      <Header
        icon={<ClipboardCheck size={20} />}
        title="Pusat Approval & Workflow"
        desc="Verifikasi dan berikan otorisasi untuk transaksi operasional penting, pengeluaran dana, atau penyesuaian inventaris."
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          ['Menunggu Persetujuan', pendingCount.toString(), 'amber', <Clock size={16} className="text-amber-500" />],
          ['Disetujui', approvedCount.toString(), 'emerald', <CheckCircle2 size={16} className="text-emerald-500" />],
          ['Ditolak', rejectedCount.toString(), 'rose', <XCircle size={16} className="text-rose-500" />],
          ['Total Pengajuan', requests.length.toString(), 'indigo', <ClipboardCheck size={16} className="text-indigo-500" />]
        ] as const).map(([label, value, tone, icon]) => (
          <Panel key={label} className="p-4">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase font-mono font-bold">{label}</span>
              {icon}
            </div>
            <h4 className="mt-1 text-base font-black text-slate-900">{value}</h4>
          </Panel>
        ))}
      </div>

      {/* Requests Table Panel */}
      <Panel className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full md:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Cari pengajuan..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:border-cyan-500 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {selectedRequestIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkDecision('rejected')}
                disabled={isSubmittingBulk}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition disabled:opacity-50 text-[11px]"
              >
                <XCircle size={14} />
                <span>Tolak ({selectedRequestIds.length})</span>
              </button>
              <button
                onClick={() => handleBulkDecision('approved')}
                disabled={isSubmittingBulk}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition disabled:opacity-50 text-[11px]"
              >
                <CheckCircle2 size={14} />
                <span>Setujui ({selectedRequestIds.length})</span>
              </button>
            </div>
          )}

          <button 
            onClick={fetchRequests}
            className="flex items-center gap-1.5 px-3 py-2 border bg-white hover:bg-slate-50 rounded-lg font-bold text-slate-600 transition"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="animate-spin text-slate-400" size={24} />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <AlertTriangle size={24} className="mx-auto mb-2 text-slate-300" />
            <p>Tidak ada pengajuan persetujuan yang ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                  <th className="p-3.5 pl-5 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                      checked={selectedRequestIds.length > 0 && filteredRequests.filter(r => r.status === 'pending').length > 0 && filteredRequests.filter(r => r.status === 'pending').every(r => selectedRequestIds.includes(r.id))}
                      onChange={(e) => {
                        const pendingIds = filteredRequests.filter(r => r.status === 'pending').map(r => r.id);
                        if (e.target.checked) {
                          setSelectedRequestIds(prev => Array.from(new Set([...prev, ...pendingIds])));
                        } else {
                          setSelectedRequestIds(prev => prev.filter(id => !pendingIds.includes(id)));
                        }
                      }}
                    />
                  </th>
                  <th className="p-3.5">No Approval</th>
                  <th className="p-3.5">Jenis Request</th>
                  <th className="p-3.5">Pemohon</th>
                  <th className="p-3.5">Referensi</th>
                  <th className="p-3.5">Perubahan / Nilai</th>
                  <th className="p-3.5">Tanggal Pengajuan</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 pl-5">
                      {req.status === 'pending' && (
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                          checked={selectedRequestIds.includes(req.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRequestIds(prev => [...prev, req.id]);
                            } else {
                              setSelectedRequestIds(prev => prev.filter(id => id !== req.id));
                            }
                          }}
                        />
                      )}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">{req.approvalNumber}</td>
                    <td className="p-3.5 font-bold text-slate-700">{getRequestTypeLabel(req.requestType)}</td>
                    <td className="p-3.5 text-slate-600">{req.requesterName}</td>
                    <td className="p-3.5 font-mono text-cyan-600">{req.referenceNumber}</td>
                    <td className="p-3.5">
                      <span className="block font-medium text-slate-700">{req.changeSummary}</span>
                      {req.amount > 0 && (
                        <span className="font-mono text-slate-500 font-semibold">{formatIDR(req.amount)}</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{req.requestedAt}</td>
                    <td className="p-3.5">
                      <StatusPill tone={getStatusTone(req.status)}>{req.status}</StatusPill>
                    </td>
                    <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="flex items-center gap-1 px-3 py-1.5 border rounded-lg bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 ml-auto transition"
                      >
                        <Eye size={12} />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Modal: Request Detail & Decision Form */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h4 className="font-mono font-bold text-slate-800">{selectedRequest.approvalNumber}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Detail Pengajuan Verifikasi</p>
              </div>
              <button onClick={() => { setSelectedRequest(null); setDecisionNotes(''); }} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b pb-4 border-slate-100">
                <div>
                  <span className="text-[9px] uppercase font-mono text-slate-400 block">Jenis Pengajuan</span>
                  <strong className="text-slate-700 text-[11px]">{getRequestTypeLabel(selectedRequest.requestType)}</strong>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-mono text-slate-400 block">Pemohon (Requester)</span>
                  <strong className="text-slate-700 text-[11px]">{selectedRequest.requesterName}</strong>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-mono text-slate-400 block">Dokumen Referensi</span>
                  <strong className="font-mono text-cyan-600 text-[11px]">{selectedRequest.referenceNumber}</strong>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-mono text-slate-400 block">Status Saat Ini</span>
                  <div className="mt-0.5">
                    <StatusPill tone={getStatusTone(selectedRequest.status)}>{selectedRequest.status}</StatusPill>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[9px] uppercase font-mono text-slate-400 block">Ringkasan Perubahan</span>
                <p className="text-slate-700 text-xs font-semibold mt-0.5 bg-slate-50 p-3 rounded-lg border">
                  {selectedRequest.changeSummary}
                </p>
              </div>

              {selectedRequest.amount > 0 && (
                <div>
                  <span className="text-[9px] uppercase font-mono text-slate-400 block">Nominal Terkait</span>
                  <strong className="text-slate-800 text-sm font-mono">{formatIDR(selectedRequest.amount)}</strong>
                </div>
              )}

              {selectedRequest.status !== 'pending' && (
                <div className="border-t pt-4 border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] uppercase font-mono text-slate-400 block">Diverifikasi Oleh</span>
                      <strong className="text-slate-700">{selectedRequest.approverName}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono text-slate-400 block">Tanggal Keputusan</span>
                      <strong className="text-slate-700 font-mono">{selectedRequest.decidedAt || '-'}</strong>
                    </div>
                  </div>
                  {selectedRequest.decisionNotes && (
                    <div>
                      <span className="text-[9px] uppercase font-mono text-slate-400 block">Catatan Keputusan</span>
                      <p className="text-slate-600 bg-slate-50/50 p-2.5 rounded border italic">
                        "{selectedRequest.decisionNotes}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons for Pending request */}
              {selectedRequest.status === 'pending' && (
                <div className="border-t pt-4 border-slate-100 space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Catatan Keputusan / Alasan</label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500 text-xs"
                      placeholder="Masukkan catatan persetujuan atau alasan penolakan..."
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleDecision('rejected')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-750 text-white rounded-lg font-bold"
                    >
                      Tolak Pengajuan
                    </button>
                    <button
                      onClick={() => handleDecision('approved')}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-750 text-white rounded-lg font-bold"
                    >
                      Setujui (Approve)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
