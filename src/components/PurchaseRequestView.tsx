/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, Filter, Plus, Printer, X, ChevronDown, ChevronRight, Check } from '@/src/components/icons';
import { PurchaseRequest, Product } from '../types';
import { productsApi } from '../features/products/api';
import { purchasingApi } from '../features/purchasing/api';
import { apiClient, authStorage } from '../services/api';
import ProductPicker from './ProductPicker';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';
import { formatDate } from '../utils/date';

interface PurchaseRequestViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function PurchaseRequestView({ onTriggerNotification }: PurchaseRequestViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedPrId, setExpandedPrId] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Purchase_Request_CV_Beton_Agung'
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);

  // Form State
  const [formItems, setFormItems] = useState<{ id: string; productId: string; qty: number }[]>([
    { id: `form-item-${Date.now()}`, productId: '', qty: 1 }
  ]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [department, setDepartment] = useState('Gudang Utama');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [prods, empRes, prs] = await Promise.all([
          productsApi.getProducts(),
          apiClient.get<{data: any[]}>('/identity/employees'),
          purchasingApi.getPurchaseRequests()
        ]);
        setProducts(prods);

        const depts = Array.from(new Set(empRes.data.map(e => e.department).filter(Boolean))) as string[];
        if (depts.length > 0) {
          setDepartments(depts);
          setDepartment(depts[0]);
        } else {
          setDepartments(['Gudang Utama', 'Produksi', 'Proyek A']);
        }

        setPurchaseRequests(prs);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = formItems.filter(item => item.productId && item.qty > 0);
    if (validItems.length === 0) {
      onTriggerNotification('Minimal satu material harus diisi dengan benar');
      return;
    }

    try {
      setIsLoading(true);
      const user = authStorage.getUser();
      const newPr = await purchasingApi.createPurchaseRequest({
        requester_id: user?.id || '00000000-0000-0000-0000-000000000000', // fallback to uuid if no user
        request_date: new Date().toISOString().split('T')[0],
        required_date: new Date().toISOString().split('T')[0],
        department,
        items: validItems.map(item => ({
          product_id: item.productId,
          quantity: item.qty
        }))
      });

      setPurchaseRequests([newPr, ...purchaseRequests]);
      onTriggerNotification('Purchase Request berhasil diajukan dan disimpan di sistem');
      setShowAddModal(false);
      
      // Reset Form
      setFormItems([{ id: `form-item-${Date.now()}`, productId: '', qty: 1 }]);
    } catch (error: any) {
      console.error(error);
      onTriggerNotification(error.message || 'Gagal menyimpan Purchase Request ke server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string, prNumber: string) => {
    const result = await Swal.fire({
      title: 'Approve PR?',
      text: `Apakah Anda yakin ingin menyetujui Purchase Request ${prNumber}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Setujui',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#059669', // emerald-600
    });

    if (result.isConfirmed) {
      try {
        setIsLoading(true);
        await purchasingApi.updatePurchaseRequestStatus(id, 'Disetujui');
        setPurchaseRequests(prev => prev.map(pr => pr.id === id ? { ...pr, status: 'Disetujui' } : pr));
        Swal.fire('Berhasil', `PR ${prNumber} berhasil disetujui.`, 'success');
        onTriggerNotification('Purchase Request disetujui, siap untuk RFQ.');
      } catch (err) {
        console.error(err);
        Swal.fire('Gagal', 'Terjadi kesalahan saat menyetujui PR.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const filteredPRs = purchaseRequests.filter((pr) => {
    const matchesSearch = pr.prNumber.toLowerCase().includes(search.toLowerCase()) || pr.department.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || pr.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
    <div className="print:hidden space-y-6 font-sans text-xs">
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg">
            <ShoppingCart size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">Purchase Request (PR)</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Pengajuan kebutuhan logistik dari divisi gudang atau produksi</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold shadow hover:bg-slate-800 flex items-center gap-1.5">
          <Plus size={16} /><span>Ajukan PR Baru</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari No PR atau Divisi..." className="w-full pl-9 pr-4 py-2 border rounded-lg" />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border">
          <Filter size={13} className="text-slate-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent py-1 outline-none text-slate-600">
            <option value="All">Semua PR</option>
            <option value="Draft">Draft</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                <th className="p-3.5 pl-5">No PR</th>
                <th className="p-3.5">Pemohon</th>
                <th className="p-3.5">Divisi</th>
                <th className="p-3.5">Tanggal Butuh</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right pr-5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
            {filteredPRs.map((pr) => {
              const isExpanded = expandedPrId === pr.id;
              return (
                <React.Fragment key={pr.id}>
                  <tr className="hover:bg-slate-50/40">
                    <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">
                      <button onClick={() => setExpandedPrId(isExpanded ? null : pr.id)} className="flex items-center gap-1.5 focus:outline-none text-left">
                        {isExpanded ? <ChevronDown size={14} className="text-cyan-500" /> : <ChevronRight size={14} className="text-slate-400" />} <span>{pr.prNumber}</span>
                      </button>
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">{pr.requesterName}</td>
                    <td className="p-3.5 font-bold">{pr.department}</td>
                    <td className="p-3.5 font-mono text-slate-500">{formatDate(pr.requiredDate)}</td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${pr.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>{pr.status}</span>
                    </td>
                    <td className="p-3.5 text-right pr-5">
                      {pr.status === 'Draft' && (
                        <button onClick={() => handleApprove(pr.id, pr.prNumber)} className="px-2 py-1 bg-emerald-600 text-white rounded mr-2 text-[10px] font-bold shadow-sm">Approve</button>
                      )}
                      <button onClick={() => {
                        if (expandedPrId !== pr.id) {
                          setExpandedPrId(pr.id);
                        }
                        onTriggerNotification(`Menyiapkan dokumen ${pr.prNumber} untuk dicetak...`);
                        setTimeout(() => handlePrintAction(), 300);
                      }} className="p-1 px-2 border rounded bg-slate-50 hover:bg-slate-100 hover:border-slate-200 text-xs text-slate-650">Cetak</button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={6} className="p-4 pl-12">
                        <div className="space-y-2">
                          <div className="font-bold text-[10px] text-slate-400 mb-2">RINCIAN KEBUTUHAN BARANG</div>
                          {pr.items.map(it => (
                            <div key={it.id} className="p-2 border bg-white rounded flex justify-between">
                              <span className="font-bold">{it.productName}</span>
                              <span className="font-mono text-cyan-600">{it.quantity} {it.unit || 'Unit'}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
            <div className="p-4 bg-slate-900 text-white flex justify-between">
              <h3 className="font-bold">Ajukan Purchase Request</h3>
              <button onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500">Daftar Material (Multi-item)</label>
                  <button type="button" onClick={() => setFormItems([...formItems, { id: `form-item-${Date.now()}`, productId: '', qty: 1 }])} className="text-[10px] text-cyan-600 font-bold hover:underline">+ Tambah Baris</button>
                </div>
                
                {formItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 border border-slate-100 bg-slate-50 rounded-lg relative">
                    {formItems.length > 1 && (
                      <button type="button" onClick={() => setFormItems(formItems.filter(i => i.id !== item.id))} className="absolute -top-2 -right-2 bg-rose-100 text-rose-600 p-1 rounded-full"><X size={12}/></button>
                    )}
                    <div className="col-span-8">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Material {index + 1}</label>
                      <ProductPicker 
                        value={item.productId}
                        onChange={(product) => {
                          const newItems = [...formItems];
                          newItems[index].productId = product.id;
                          setFormItems(newItems);
                        }}
                        typeFilter="raw_material"
                        placeholder="Pilih Material..."
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Kuantitas</label>
                      <div className="relative">
                        <input type="number" min="1" value={item.qty} onChange={e => {
                          const newItems = [...formItems];
                          newItems[index].qty = Number(e.target.value);
                          setFormItems(newItems);
                        }} className="w-full p-2 pr-12 border border-slate-200 rounded focus:outline-none focus:border-cyan-400" required />
                        {item.productId && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-xs font-bold text-slate-400 uppercase">
                              {products.find(p => p.id === item.productId)?.unit}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Divisi Pemohon</label>
                <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full p-2 border border-slate-200 rounded">
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-4 border-t gap-2 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded font-bold hover:bg-slate-800 transition-colors">Ajukan PR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

    {/* PRINT TEMPLATE (Hidden by default, used by react-to-print) */}
    <div style={{ display: 'none' }}>
      <div ref={printRef} className="bg-white text-black p-8 font-sans w-[800px] mx-auto print:block">
        {(() => {
          const pr = purchaseRequests.find(p => p.id === expandedPrId);
          if (!pr) return <div className="p-8 text-center text-gray-500">Pilih PR untuk dicetak</div>;
          return (
            <div className="print-container">
              <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-6">
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-widest text-black">CV BETON AGUNG</h1>
                  <p className="text-xs text-black font-medium mt-1">General Contractor & Supplier Material Alam</p>
                  <p className="text-[10px] text-gray-700 mt-0.5">Jl. Raya Puspiptek No. 88, Tangerang Selatan</p>
                  <p className="text-[10px] text-gray-700">Telp: (021) 123-4567 | Email: info@cvbetonagung.com</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-black uppercase tracking-widest border-b border-black pb-1 mb-1">Purchase Request</h2>
                  <p className="font-mono text-sm font-bold">{pr.prNumber}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
                <div>
                  <table className="w-full">
                    <tbody>
                      <tr><td className="py-1 w-32 font-bold">Pemohon</td><td className="py-1">: {pr.requesterName}</td></tr>
                      <tr><td className="py-1 font-bold">Divisi</td><td className="py-1">: {pr.department}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <table className="w-full">
                    <tbody>
                      <tr><td className="py-1 w-32 font-bold">Tanggal Pengajuan</td><td className="py-1">: {formatDate(pr.requestDate)}</td></tr>
                      <tr><td className="py-1 font-bold">Tgl. Dibutuhkan</td><td className="py-1">: {formatDate(pr.requiredDate)}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <table className="w-full text-left border-collapse border border-black text-xs mb-12">
                <thead>
                  <tr className="border-b border-black bg-gray-100">
                    <th className="p-3 border-r border-black w-12 text-center font-bold">No</th>
                    <th className="p-3 border-r border-black font-bold">Deskripsi Kebutuhan Material / Barang</th>
                    <th className="p-3 w-32 text-center font-bold">Kuantitas</th>
                  </tr>
                </thead>
                <tbody>
                  {pr.items.map((item, idx) => (
                    <tr key={item.id} className="border-b border-black">
                      <td className="p-3 border-r border-black text-center">{idx + 1}</td>
                      <td className="p-3 border-r border-black font-medium">{item.productName}</td>
                      <td className="p-3 text-center">{item.quantity} {item.unit || 'Unit'}</td>
                    </tr>
                  ))}
                  {pr.items.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center italic text-gray-500">Tidak ada item</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="flex justify-between text-center mt-16 px-12 text-xs">
                <div>
                  <p className="mb-20">Dibuat Oleh,</p>
                  <p className="font-bold border-b border-black pb-1 inline-block min-w-[150px] uppercase">{pr.requesterName}</p>
                  <p className="mt-1">Pemohon</p>
                </div>
                <div>
                  <p className="mb-20">Mengetahui,</p>
                  <p className="font-bold border-b border-black pb-1 inline-block min-w-[150px]"></p>
                  <p className="mt-1">Manajer Departemen</p>
                </div>
                <div>
                  <p className="mb-20">Disetujui Oleh,</p>
                  <p className="font-bold border-b border-black pb-1 inline-block min-w-[150px]"></p>
                  <p className="mt-1">Purchasing / Direktur</p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
    </>
  );
}
