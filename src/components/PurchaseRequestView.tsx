/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, Filter, Plus, Printer, X, ChevronDown, ChevronRight, Check, Trash2 } from '@/src/components/icons';
import { PurchaseRequest, Product } from '../types';
import { productsApi } from '../features/products/api';
import { purchasingApi } from '../features/purchasing/api';
import { apiClient, authStorage } from '../services/api';
import ProductPicker from './ProductPicker';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';
import { formatDate, toApiDate } from '../utils/date';

import { getCompanyProfile, formatAddressForPrint, CompanyProfile } from '../utils/companyProfile';

interface PurchaseRequestViewProps {
  onTriggerNotification: (message: string) => void;
  onNavigate?: (view: string) => void;
}

interface PrFormItem {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  qty: number;
}

export default function PurchaseRequestView({ onTriggerNotification, onNavigate }: PurchaseRequestViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedPrId, setExpandedPrId] = useState<string | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(getCompanyProfile());

  useEffect(() => {
    const handleProfileUpdate = () => {
      setCompanyProfile(getCompanyProfile());
    };
    window.addEventListener('erp_company_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('erp_company_profile_updated', handleProfileUpdate);
  }, []);

  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Purchase_Request_CV_Beton_Agung'
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);

  // Form State
  const [formItems, setFormItems] = useState<PrFormItem[]>([
    { id: `form-item-${Date.now()}`, productId: '', productName: '', unit: '', qty: 1 }
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

  const handleAddItem = () => {
    setFormItems(prev => [
      ...prev,
      { id: `form-item-${Date.now()}-${prev.length}`, productId: '', productName: '', unit: '', qty: 1 }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (formItems.length > 1) {
      setFormItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleProductChange = (index: number, product: Product) => {
    setFormItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        productId: product.id,
        productName: product.name,
        unit: product.unit || 'Unit'
      };
      return updated;
    });
  };

  const handleQtyChange = (index: number, qty: number) => {
    setFormItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        qty: Math.max(1, qty)
      };
      return updated;
    });
  };

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
        requester_id: user?.id || '00000000-0000-0000-0000-000000000000',
        request_date: toApiDate(),
        required_date: toApiDate(),
        department,
        items: validItems.map(item => ({
          product_id: item.productId,
          description: item.productName || undefined,
          quantity: item.qty
        }))
      });

      // Augment items with known product names if needed
      const augmentedItems = newPr.items.map(it => {
        const local = validItems.find(v => v.productId === it.productId || (v.productId && it.productId && v.productId.toLowerCase() === it.productId.toLowerCase()));
        const matchedProd = products.find(p => p.id === it.productId || (it.productId && p.id.toLowerCase() === it.productId.toLowerCase()));
        return {
          ...it,
          productName: (it.productName && it.productName !== 'Unknown Product' && it.productName !== 'Custom Item') 
            ? it.productName 
            : local?.productName || matchedProd?.name || it.description || 'Material / Produk',
          unit: it.unit || local?.unit || matchedProd?.unit || 'Unit'
        };
      });

      const finalizedPr: PurchaseRequest = {
        ...newPr,
        items: augmentedItems
      };

      setPurchaseRequests([finalizedPr, ...purchaseRequests]);
      onTriggerNotification('Purchase Request berhasil diajukan dan disimpan di sistem');
      setShowAddModal(false);
      
      // Reset Form
      setFormItems([{ id: `form-item-${Date.now()}`, productId: '', productName: '', unit: '', qty: 1 }]);
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

  const handleCancelPr = async (id: string, prNumber: string) => {
    const { value: reason } = await Swal.fire({
      title: `Batalkan PR ${prNumber}?`,
      text: "Apakah Anda yakin? Masukkan alasan pembatalan:",
      input: 'text',
      inputPlaceholder: 'Misal: Kesalahan input',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Batalkan',
      cancelButtonText: 'Kembali',
      inputValidator: (value) => {
        if (!value) {
          return 'Alasan pembatalan wajib diisi!';
        }
      }
    });

    if (reason) {
      try {
        setIsLoading(true);
        await purchasingApi.cancelPurchaseRequest(id, reason);
        setPurchaseRequests(prev => prev.filter(pr => pr.id !== id));
        Swal.fire('Berhasil', `PR ${prNumber} berhasil dibatalkan.`, 'success');
        onTriggerNotification(`Purchase Request ${prNumber} dibatalkan.`);
      } catch (err: any) {
        console.error("Failed to cancel PR", err);
        const msg = err.response?.data?.message || err.message || "Gagal membatalkan PR";
        Swal.fire('Gagal!', msg, 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getItemDisplayName = (it: { productId: string; productName?: string; description?: string }) => {
    if (it.productName && it.productName !== 'Unknown Product' && it.productName !== 'Custom Item') {
      return it.productName;
    }
    const matched = products.find(p => p.id === it.productId || (it.productId && p.id.toLowerCase() === it.productId.toLowerCase()));
    return matched?.name || it.description || it.productName || 'Material / Produk';
  };

  const getItemUnit = (it: { productId: string; unit?: string }) => {
    if (it.unit && it.unit !== 'Unit') {
      return it.unit;
    }
    const matched = products.find(p => p.id === it.productId || (it.productId && p.id.toLowerCase() === it.productId.toLowerCase()));
    return matched?.unit || it.unit || 'Unit';
  };

  const filteredPRs = purchaseRequests.filter((pr) => {
    if (pr.status === 'cancelled' || pr.status === 'Dibatalkan') return false;
    const matchesSearch = pr.prNumber.toLowerCase().includes(search.toLowerCase()) || pr.department.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || pr.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(filteredPRs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPRs = filteredPRs.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  return (
    <>
    <div className="print:hidden space-y-5 font-sans text-xs">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-sky-50 text-sky-600 border border-sky-100 rounded-xl">
            <ShoppingCart size={22} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">Purchase Request (PR)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Pengajuan kebutuhan logistik dan material divisi gudang atau produksi</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="btn btn-primary btn-md flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Ajukan PR Baru</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Cari No PR atau Divisi..." 
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all" 
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-200/80">
          <Filter size={14} className="text-slate-400" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="bg-transparent py-0.5 outline-none text-slate-700 text-xs font-medium cursor-pointer"
          >
            <option value="All">Semua Status</option>
            <option value="Draft">Draft</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 uppercase tracking-wider font-mono text-[10px]">
                <th className="p-3.5 pl-5">No PR</th>
                <th className="p-3.5">Pemohon</th>
                <th className="p-3.5">Divisi</th>
                <th className="p-3.5">Tanggal Butuh</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right pr-5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
            {filteredPRs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                  Tidak ditemukan data Purchase Request yang terekam.
                </td>
              </tr>
            ) : (
              <>
                {paginatedPRs.map((pr) => {
                  const isExpanded = expandedPrId === pr.id;
                  return (
                    <React.Fragment key={pr.id}>
                      <tr className="hover:bg-sky-50/20 transition-colors">
                        <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">
                          <button 
                            onClick={() => setExpandedPrId(isExpanded ? null : pr.id)} 
                            className="flex items-center gap-2 focus:outline-none text-left cursor-pointer group"
                          >
                            {isExpanded ? (
                              <ChevronDown size={14} className="text-sky-600" />
                            ) : (
                              <ChevronRight size={14} className="text-slate-400 group-hover:text-sky-600 transition-colors" />
                            )} 
                            <span className="group-hover:text-sky-700 transition-colors">{pr.prNumber}</span>
                          </button>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">{pr.requesterName}</td>
                        <td className="p-3.5 font-medium text-slate-600">{pr.department}</td>
                        <td className="p-3.5 font-mono text-slate-500">{formatDate(pr.requiredDate)}</td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border ${
                            pr.status === 'Disetujui' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : pr.status === 'cancelled' || pr.status === 'Dibatalkan' 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {pr.status === 'cancelled' ? 'Dibatalkan' : pr.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right pr-5 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {pr.status === 'Draft' && (
                              <button 
                                onClick={() => handleApprove(pr.id, pr.prNumber)} 
                                className="btn btn-sm btn-success"
                              >
                                Approve
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                if (expandedPrId !== pr.id) {
                                  setExpandedPrId(pr.id);
                                }
                                onTriggerNotification(`Menyiapkan dokumen ${pr.prNumber} untuk dicetak...`);
                                setTimeout(() => handlePrintAction(), 300);
                              }} 
                              className="btn btn-sm btn-secondary flex items-center gap-1.5"
                            >
                              <Printer size={13} />
                              <span>Cetak</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={6} className="p-4 pl-12 border-t border-slate-100">
                            <div className="space-y-3 max-w-xl">
                              <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                                Rincian Kebutuhan Barang
                              </div>
                              <div className="space-y-1.5">
                                {pr.items.map(it => {
                                  const displayName = getItemDisplayName(it);
                                  const displayUnit = getItemUnit(it);
                                  return (
                                    <div key={it.id} className="p-2.5 border border-slate-200 bg-white rounded-xl flex justify-between items-center shadow-2xs">
                                      <span className="font-semibold text-slate-800 text-xs">{displayName}</span>
                                      <span className="font-mono text-sky-700 font-bold text-xs">{it.quantity} {displayUnit}</span>
                                    </div>
                                  );
                                })}
                              </div>

                              {onNavigate && pr.status === 'Disetujui' && (
                                <div className="pt-2">
                                  <button
                                    onClick={() => {
                                      sessionStorage.setItem('action_create_rfq', pr.id);
                                      onNavigate('rfq');
                                    }}
                                    className="btn btn-primary btn-md w-full flex items-center justify-center gap-2"
                                  >
                                    <span>Lanjut Buat Request for Quotation (RFQ)</span>
                                    <ChevronRight size={14} />
                                  </button>
                                </div>
                              )}
                              
                              {pr.status !== 'cancelled' && pr.status !== 'Dibatalkan' && (
                                <div className="pt-1">
                                  <button
                                    onClick={() => handleCancelPr(pr.id, pr.prNumber)}
                                    className="btn btn-secondary btn-md w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 rounded-xl flex items-center justify-center gap-1.5"
                                  >
                                    <X size={14} className="text-rose-500" />
                                    <span>Batalkan Purchase Request</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </>
            )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-slate-200/80">
            <div className="text-[11px] text-slate-400 font-mono">
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredPRs.length)} dari {filteredPRs.length} data
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary btn-sm"
              >
                Prev
              </button>
              <span className="text-slate-500 px-2 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Ajukan PR Baru */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-600 border border-sky-100 rounded-lg">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Ajukan Purchase Request</h3>
                  <p className="text-[11px] text-slate-500">Input material dan kebutuhan pengadaan barang</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Daftar Material (Multi-item)</label>
                  <button 
                    type="button" 
                    onClick={handleAddItem} 
                    className="btn btn-secondary btn-sm text-sky-700 hover:text-sky-800 flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>Tambah Baris</span>
                  </button>
                </div>
                
                {formItems.map((item, index) => (
                  <div key={item.id} className="p-3.5 border border-slate-200/80 bg-slate-50/50 rounded-xl relative space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-600">Material #{index + 1}</span>
                      {formItems.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(item.id)} 
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus baris"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-8">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Pilih Produk / Material *</label>
                        <ProductPicker 
                          value={item.productId}
                          selectedProductName={item.productName}
                          onChange={(product) => handleProductChange(index, product)}
                          procurementTypeFilter="purchase"
                          placeholder="Pilih Material / Produk..."
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Kuantitas *</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="1" 
                            value={item.qty} 
                            onChange={e => handleQtyChange(index, Number(e.target.value))} 
                            className="w-full p-2.5 pr-12 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white" 
                            required 
                          />
                          {item.unit && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {item.unit}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Divisi Pemohon</label>
                <select 
                  value={department} 
                  onChange={e => setDepartment(e.target.value)} 
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 gap-2.5 mt-5">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="btn btn-secondary btn-md"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="btn btn-primary btn-md flex items-center gap-2"
                >
                  {isLoading ? 'Menyimpan...' : 'Ajukan PR'}
                </button>
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
                  <div className="flex items-center gap-4">
                    {companyProfile.logoUrl ? (
                      <img src={companyProfile.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
                    ) : (
                      <div className="w-16 h-16 bg-slate-900 flex items-center justify-center text-white font-black text-2xl tracking-tighter">
                        {companyProfile.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h1 className="text-2xl font-black uppercase tracking-widest text-black">{companyProfile.name}</h1>
                      <p className="text-xs text-black font-medium mt-1">General Contractor & Supplier Material Alam</p>
                      <p className="text-[10px] text-gray-700 mt-0.5">{formatAddressForPrint(companyProfile.address)}</p>
                      <p className="text-[10px] text-gray-700">Telp: {companyProfile.phone} | Email: {companyProfile.email}</p>
                    </div>
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
                      <td className="p-3 border-r border-black font-medium">{getItemDisplayName(item)}</td>
                      <td className="p-3 text-center">{item.quantity} {getItemUnit(item)}</td>
                    </tr>
                  ))}
                  {pr.items.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center italic text-gray-500">Tidak ada item</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
    </>
  );
}
