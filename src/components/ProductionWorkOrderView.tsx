/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Factory, Plus, Search, CheckCircle2, X, Clock, HelpCircle, 
  FileText, Send, Check, UserCheck, Calendar, Clipboard, AlertCircle, Trash2 
} from '@/src/components/icons';
import { authStorage } from '../services/api';
import { productionApi } from '../features/production/api';
import { productsApi } from '../features/products/api';
import { employeesApi } from '../features/employees/api';
import { projectsApi } from '../features/projects/api';
import { salesApi } from '../features/sales/api';
import { ErrorCard } from './Skeleton';
import { ProductionWorkOrder, ProductionWorkLog, Employee, Product, Project, SalesOrder } from '../types';

interface ProductionWorkOrderViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function ProductionWorkOrderView({ onTriggerNotification }: ProductionWorkOrderViewProps) {
  const [workOrders, setWorkOrders] = useState<ProductionWorkOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWoId, setSelectedWoId] = useState<string | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isUpdateStageModalOpen, setIsUpdateStageModalOpen] = useState(false);

  // Form States - Create WO
  const [newWoNumber, setNewWoNumber] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [targetQty, setTargetQty] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [stage, setStage] = useState('Cetak');

  // Form States - Input Log
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [logWorkDate, setLogWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [logStage, setLogStage] = useState('Cetak');
  const [madeQty, setMadeQty] = useState(0);
  const [rejectQty, setRejectQty] = useState(0);
  const [okQty, setOkQty] = useState(0);
  const [logNotes, setLogNotes] = useState('');

  // Form States - Update Stage
  const [updateStageValue, setUpdateStageValue] = useState('Cetak');

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [wos, prods, emps, projs, sos] = await Promise.all([
        productionApi.getWorkOrders(),
        productsApi.getProducts(),
        employeesApi.getEmployees(),
        projectsApi.getProjects(),
        salesApi.getSalesOrders()
      ]);
      setWorkOrders(wos);
      setProducts(prods);
      setEmployees(emps.filter(e => e.status === 'Aktif'));
      setProjects(projs);
      setSalesOrders(sos);

      if (wos.length > 0) {
        setSelectedWoId(wos[0].id);
      }
    } catch (err) {
      console.error('Failed to load production data', err);
      const msg = err instanceof Error ? err.message : 'Gagal mengambil data produksi';
      setErrorMessage(msg);
      onTriggerNotification(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    const nextNum = workOrders.length + 1;
    setNewWoNumber(`WO-2026-06${nextNum < 10 ? '0' + nextNum : nextNum}`);
    setSelectedProductId('');
    setSelectedSalesOrderId('');
    setSelectedProjectId('');
    setSourceLabel('');
    setTargetQty(100);
    setDueDate(new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]);
    setStage('Cetak');
    setIsCreateModalOpen(true);
  };

  const handleCreateWo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWoNumber || !selectedProductId || targetQty <= 0) {
      onTriggerNotification('Mohon lengkapi semua field utama.');
      return;
    }

    try {
      let label = sourceLabel;
      if (!label && selectedSalesOrderId) {
        const so = salesOrders.find(s => s.id === selectedSalesOrderId);
        label = so ? so.orderNumber : '';
      } else if (!label && selectedProjectId) {
        const pr = projects.find(p => p.id === selectedProjectId);
        label = pr ? pr.projectName : '';
      }

      const payload: any = {
        work_order_number: newWoNumber,
        product_id: selectedProductId,
        stage,
        target_qty: targetQty,
        due_date: dueDate || null,
        source_label: label || 'Stok Gudang',
      };
      if (selectedSalesOrderId) payload.sales_order_id = selectedSalesOrderId;
      if (selectedProjectId) payload.project_id = selectedProjectId;

      const created = await productionApi.createWorkOrder(payload);
      setWorkOrders(prev => [created, ...prev]);
      setSelectedWoId(created.id);
      onTriggerNotification(`Work Order ${newWoNumber} berhasil dibuat`);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Failed to create Work Order', err);
      onTriggerNotification('Gagal membuat Work Order baru.');
    }
  };

  const handleOpenLogModal = () => {
    setSelectedEmployeeId(employees[0]?.id || '');
    setLogWorkDate(new Date().toISOString().split('T')[0]);
    setLogStage(selectedWo?.stage || 'Cetak');
    setMadeQty(0);
    setRejectQty(0);
    setOkQty(0);
    setLogNotes('');
    setIsLogModalOpen(true);
  };

  const handleMadeQtyChange = (val: number) => {
    setMadeQty(val);
    setOkQty(Math.max(0, val - rejectQty));
  };

  const handleRejectQtyChange = (val: number) => {
    setRejectQty(val);
    setOkQty(Math.max(0, madeQty - val));
  };

  const handleCreateWorkLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWoId || !selectedEmployeeId || madeQty <= 0) {
      onTriggerNotification('Mohon lengkapi data hasil produksi.');
      return;
    }

    try {
      const payload = {
        work_order_id: selectedWoId,
        employee_id: selectedEmployeeId,
        work_date: logWorkDate,
        stage: logStage,
        made_qty: madeQty,
        reject_qty: rejectQty,
        ok_qty: okQty,
        notes: logNotes || undefined
      };

      const createdLog = await productionApi.createWorkLog(payload);
      
      // Refresh work orders to recalculate progress & logs
      const refreshedWos = await productionApi.getWorkOrders();
      setWorkOrders(refreshedWos);
      onTriggerNotification(`Input harian untuk WO berhasil disimpan`);
      setIsLogModalOpen(false);
    } catch (err) {
      console.error('Failed to save production log', err);
      onTriggerNotification('Gagal menyimpan hasil harian.');
    }
  };

  const handleOpenUpdateStageModal = () => {
    if (!selectedWo) return;
    setUpdateStageValue(selectedWo.stage);
    setIsUpdateStageModalOpen(true);
  };

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWoId || !selectedWo) return;

    try {
      const updated = await productionApi.updateWorkOrder(selectedWoId, {
        stage: updateStageValue
      });
      setWorkOrders(prev => prev.map(w => w.id === selectedWoId ? updated : w));
      onTriggerNotification(`WO ${selectedWo.workOrderNumber} tahap diubah ke: ${updateStageValue}`);
      setIsUpdateStageModalOpen(false);
    } catch (err) {
      console.error('Failed to update WO stage', err);
      onTriggerNotification('Gagal mengubah tahap produksi.');
    }
  };

  const handleDeleteWo = async (id: string, num: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus Work Order ${num}?`)) return;

    try {
      await productionApi.deleteWorkOrder(id);
      setWorkOrders(prev => prev.filter(w => w.id !== id));
      if (selectedWoId === id) {
        setSelectedWoId(null);
      }
      onTriggerNotification(`Work Order ${num} berhasil dihapus.`);
    } catch (err) {
      console.error('Failed to delete work order', err);
      onTriggerNotification('Gagal menghapus Work Order.');
    }
  };

  // Calculations & Filtering
  const selectedWo = workOrders.find(wo => wo.id === selectedWoId);

  const filteredWos = workOrders.filter(w => 
    w.workOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.productName && w.productName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (w.sourceLabel && w.sourceLabel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group counts
  const countDraft = workOrders.filter(w => w.stage === 'Draft').length;
  const countCetak = workOrders.filter(w => w.stage === 'Cetak').length;
  const countCuring = workOrders.filter(w => w.stage === 'Curing').length;
  const countFinishing = workOrders.filter(w => w.stage === 'Finishing').length;
  const countQC = workOrders.filter(w => w.stage === 'QC').length;

  // Worker rekap summary for selected WO
  const logsList = selectedWo?.logs || [];
  const totalMade = logsList.reduce((sum, l) => sum + l.madeQty, 0);
  const totalReject = logsList.reduce((sum, l) => sum + l.rejectQty, 0);
  const totalOk = logsList.reduce((sum, l) => sum + l.okQty, 0);

  const workerSummary = logsList.reduce<Record<string, { made: number; ok: number; reject: number }>>((acc, log) => {
    const worker = log.employeeName || 'Unknown';
    acc[worker] = acc[worker] || { made: 0, ok: 0, reject: 0 };
    acc[worker].made += log.madeQty;
    acc[worker].reject += log.rejectQty;
    acc[worker].ok += log.okQty;
    return acc;
  }, {});

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-cyan-400 font-bold uppercase bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-800/50">
              MANUFAKTUR & PRODUKSI
            </span>
            <h1 className="font-sans font-black tracking-tight text-xl md:text-2xl mt-3 text-slate-100 flex items-center gap-2">
              Work Order & SPK Cetak
              <span className="text-[9px] font-mono font-normal tracking-normal normal-case border border-cyan-400/35 bg-cyan-950/50 text-cyan-400 rounded px-1.5 py-0.5 ml-2">
                API MODE
              </span>
            </h1>
            <p className="text-xs text-slate-350 mt-1 max-w-xl leading-relaxed">
              Keluarkan Surat Perintah Kerja (SPK) untuk tukang, monitor progress cetak harian, hitung persentase barang reject, dan monitor produksi beton secara live.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-gradient-to-br from-cyan-500 to-indigo-650 text-white font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 shrink-0"
          >
            <Plus size={14} />
            <span>Buat SPK / WO</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-5 h-[550px] bg-slate-100 rounded-xl animate-pulse" />
            <div className="xl:col-span-7 h-[550px] bg-slate-100 rounded-xl animate-pulse" />
          </div>
        </div>
      ) : errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={fetchData} />
      ) : (
        <>
          {/* Stage KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Draft', count: countDraft, color: 'text-slate-500 bg-slate-50' },
              { label: 'Cetak', count: countCetak, color: 'text-cyan-600 bg-cyan-50' },
              { label: 'Curing', count: countCuring, color: 'text-amber-600 bg-amber-50' },
              { label: 'Finishing', count: countFinishing, color: 'text-indigo-600 bg-indigo-50' },
              { label: 'QC & Siap', count: countQC, color: 'text-emerald-600 bg-emerald-50' },
            ].map((stageItem) => (
              <div key={stageItem.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400">{stageItem.label}</span>
                  <h4 className="text-lg font-black text-slate-800 mt-1">{stageItem.count} SPK</h4>
                </div>
                <div className={`p-2.5 rounded-lg ${stageItem.color}`}>
                  <Factory size={16} />
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid: WO List & Detailed Monitor */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left: WO List */}
            <div className="xl:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[550px]">
              <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
                <h3 className="font-bold text-slate-850 text-sm">Daftar Antrian Produksi</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Cari WO, produk, proyek..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                {filteredWos.map((wo) => (
                  <div 
                    key={wo.id}
                    onClick={() => setSelectedWoId(wo.id)}
                    className={`p-4 cursor-pointer hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-3 ${
                      selectedWoId === wo.id ? 'bg-cyan-50/45 border-l-4 border-cyan-500 pl-3' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-600">{wo.workOrderNumber}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                          wo.stage === 'QC' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          wo.stage === 'Finishing' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          wo.stage === 'Curing' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-cyan-50 text-cyan-700 border-cyan-100'
                        }`}>
                          {wo.stage}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800">{wo.productName}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Order: {wo.sourceLabel || 'Stok'}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-slate-700 font-semibold">{wo.completedQty} / {wo.targetQty} pcs</div>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 ml-auto">
                        <div className="h-full bg-cyan-500" style={{ width: `${wo.progress}%` }} />
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 mt-1">{wo.progress}%</div>
                    </div>
                  </div>
                ))}
                {filteredWos.length === 0 && (
                  <div className="p-12 text-center text-slate-400">Tidak ada Work Order ditemukan.</div>
                )}
              </div>
            </div>

            {/* Right: Detailed Monitor Card */}
            <div className="xl:col-span-7 space-y-6">
              {selectedWo ? (
                <>
                  {/* Detailed Header Card */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded">
                            {selectedWo.workOrderNumber}
                          </span>
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">
                            {selectedWo.stage}
                          </span>
                        </div>
                        <h3 className="font-sans font-black text-slate-800 text-base mt-2">{selectedWo.productName}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Sumber Order: <span className="font-semibold text-slate-700">{selectedWo.sourceLabel || 'Stok Gudang'}</span>
                          {selectedWo.dueDate && ` | Target Selesai: ${selectedWo.dueDate}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleOpenUpdateStageModal}
                          className="px-3 py-1.5 border border-slate-200 bg-slate-50 hover:bg-white text-slate-650 font-bold rounded-lg transition-all"
                        >
                          Ubah Tahap
                        </button>
                        <button
                          onClick={handleOpenLogModal}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-all"
                        >
                          Input Hasil Harian
                        </button>
                        <button
                          onClick={() => handleDeleteWo(selectedWo.id, selectedWo.workOrderNumber)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Progress Stats bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-100 text-center">
                      {[
                        { label: 'Target Produksi', value: `${selectedWo.targetQty} pcs`, color: 'text-slate-800' },
                        { label: 'Total Output', value: `${totalMade} pcs`, color: 'text-cyan-600' },
                        { label: 'Bagus (OK)', value: `${totalOk} pcs`, color: 'text-emerald-600' },
                        { label: 'Reject QC', value: `${totalReject} pcs`, color: 'text-rose-600' }
                      ].map((stat) => (
                        <div key={stat.label} className="p-4 border-r last:border-r-0 border-slate-100">
                          <span className="text-[9px] uppercase font-mono font-bold text-slate-400">{stat.label}</span>
                          <p className={`mt-1 text-base font-black ${stat.color}`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Progress Qty OK Terhadap Target</span>
                        <span className="font-mono font-black text-cyan-600">{selectedWo.progress}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${selectedWo.progress}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Sub Grid: Log Harian & Rekap per Worker */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Log Harian */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden md:col-span-8 flex flex-col max-h-[300px]">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <h4 className="font-bold text-slate-800">Catatan Harian Cetak/Finishing</h4>
                        <span className="text-[10px] text-slate-400 font-mono">Total {logsList.length} Entri</span>
                      </div>
                      <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                        <table className="w-full text-left border-collapse text-[10px]">
                          <thead className="bg-slate-50 sticky top-0 border-b z-10">
                            <tr className="font-mono text-slate-500 uppercase tracking-wider">
                              <th className="p-2.5 pl-4">Tanggal</th>
                              <th className="p-2.5">Tukang</th>
                              <th className="p-2.5">Tahap</th>
                              <th className="p-2.5 text-right">Dibuat</th>
                              <th className="p-2.5 text-right">OK</th>
                              <th className="p-2.5 text-right">Reject</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {logsList.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50/55">
                                <td className="p-2.5 pl-4 font-mono text-slate-500">{log.workDate}</td>
                                <td className="p-2.5 font-bold text-slate-800">{log.employeeName}</td>
                                <td className="p-2.5 text-slate-600">{log.stage}</td>
                                <td className="p-2.5 text-right font-mono">{log.madeQty}</td>
                                <td className="p-2.5 text-right font-mono text-emerald-600 font-bold">{log.okQty}</td>
                                <td className="p-2.5 text-right font-mono text-rose-500">{log.rejectQty}</td>
                              </tr>
                            ))}
                            {logsList.length === 0 && (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                                  Belum ada catatan laporan harian untuk WO ini.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Rekap per worker */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:col-span-4 max-h-[300px] overflow-y-auto">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-3">
                        <UserCheck size={14} className="text-cyan-600" />
                        <h4 className="font-bold text-slate-800">Rekap Per Tukang</h4>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(workerSummary).map(([worker, summary]) => {
                          const rejectRate = summary.made ? Math.round((summary.reject / summary.made) * 100) : 0;
                          return (
                            <div key={worker} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px]">
                              <div className="flex items-center justify-between gap-1 font-bold">
                                <span className="text-slate-800 truncate">{worker}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                  rejectRate > 4 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                  {rejectRate}% reject
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-1 mt-2 text-center font-mono">
                                <div>
                                  <div className="text-[8px] text-slate-400">Total</div>
                                  <div className="font-bold text-slate-700">{summary.made}</div>
                                </div>
                                <div>
                                  <div className="text-[8px] text-slate-400 text-emerald-600">OK</div>
                                  <div className="font-bold text-emerald-700">{summary.ok}</div>
                                </div>
                                <div>
                                  <div className="text-[8px] text-slate-400 text-rose-500">Rej</div>
                                  <div className="font-bold text-rose-600">{summary.reject}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {Object.keys(workerSummary).length === 0 && (
                          <div className="text-center text-slate-400 py-8 italic">Tidak ada rekap.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400 font-sans">
                  <Clipboard size={32} className="mx-auto text-slate-300 mb-2" />
                  Pilih Work Order di sebelah kiri untuk memantau aktivitas produksi secara detail.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal: Buat SPK / WO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Factory size={16} className="text-cyan-400" />
                <h3 className="font-bold text-sm">Buat Work Order / SPK</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateWo} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">No. Work Order *</label>
                  <input
                    type="text"
                    required
                    value={newWoNumber}
                    onChange={(e) => setNewWoNumber(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Tahap Awal *</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Cetak">Cetak</option>
                    <option value="Curing">Curing</option>
                    <option value="Finishing">Finishing</option>
                    <option value="QC">QC</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Produk yang Dicetak *</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Target Qty (pcs) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={targetQty}
                    onChange={(e) => setTargetQty(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Batas Selesai *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Kaitkan Dengan Penjualan / Proyek (Opsional)
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Sales Order</label>
                    <select
                      value={selectedSalesOrderId}
                      onChange={(e) => {
                        setSelectedSalesOrderId(e.target.value);
                        setSelectedProjectId('');
                      }}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
                    >
                      <option value="">-- Tanpa SO --</option>
                      {salesOrders.map(so => (
                        <option key={so.id} value={so.id}>{so.orderNumber} ({so.customerName})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Proyek Konstruksi</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        setSelectedSalesOrderId('');
                      }}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
                    >
                      <option value="">-- Tanpa Proyek --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.projectName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Sumber Keterangan Kustom</label>
                  <input
                    type="text"
                    placeholder="Contoh: Stok Gudang Utama / GRC Masjid"
                    value={sourceLabel}
                    onChange={(e) => setSourceLabel(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-br from-cyan-500 to-indigo-650 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
                >
                  Simpan SPK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Input Hasil Harian */}
      {isLogModalOpen && selectedWo && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-cyan-400" />
                <h3 className="font-bold text-sm">Input Output Tukang Harian</h3>
              </div>
              <button onClick={() => setIsLogModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateWorkLog} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Tukang / Pekerja *</label>
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- Pilih Tukang --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeType})</option>
                  ))}
                  {employees.length === 0 && (
                    <option value="" disabled>Tidak ada karyawan aktif</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Tanggal Kerja *</label>
                  <input
                    type="date"
                    required
                    value={logWorkDate}
                    onChange={(e) => setLogWorkDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Tahap SPK *</label>
                  <select
                    value={logStage}
                    onChange={(e) => setLogStage(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="Cetak">Cetak</option>
                    <option value="Curing">Curing</option>
                    <option value="Finishing">Finishing</option>
                    <option value="QC">QC</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-y border-slate-100 py-3">
                <div className="space-y-1 text-center">
                  <label className="block font-bold text-slate-700">Dibuat *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={madeQty}
                    onChange={(e) => handleMadeQtyChange(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-center font-mono text-slate-800"
                  />
                </div>

                <div className="space-y-1 text-center">
                  <label className="block font-bold text-slate-700">Reject</label>
                  <input
                    type="number"
                    min={0}
                    value={rejectQty}
                    onChange={(e) => handleRejectQtyChange(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-center font-mono text-rose-600"
                  />
                </div>

                <div className="space-y-1 text-center">
                  <label className="block font-bold text-slate-700">Bagus (OK)</label>
                  <input
                    type="number"
                    disabled
                    value={okQty}
                    className="w-full px-2 py-1.5 border border-slate-250 bg-slate-50 rounded-lg text-center font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Keterangan / Notes</label>
                <input
                  type="text"
                  placeholder="Contoh: Bagian pinggir retak tipis / Batch pagi"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-br from-cyan-500 to-indigo-650 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
                >
                  Simpan Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ubah Tahap WO */}
      {isUpdateStageModalOpen && selectedWo && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clipboard size={16} className="text-cyan-400" />
                <h3 className="font-bold text-sm">Ubah Tahap Produksi SPK</h3>
              </div>
              <button onClick={() => setIsUpdateStageModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateStage} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Pilih Tahap Baru *</label>
                <select
                  value={updateStageValue}
                  onChange={(e) => setUpdateStageValue(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
                >
                  <option value="Draft">Draft (Dalam Rencana)</option>
                  <option value="Cetak">Cetak (Proses Pembuatan)</option>
                  <option value="Curing">Curing (Proses Pengeringan)</option>
                  <option value="Finishing">Finishing (Proses Pemolesan)</option>
                  <option value="QC">QC & Siap (Selesai QC / Siap Kirim)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUpdateStageModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-br from-cyan-500 to-indigo-650 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
                >
                  Ubah Tahap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
