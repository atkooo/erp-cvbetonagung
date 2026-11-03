/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Filter,
  Plus,
  Printer,
  X,
  FileText,
  ChevronDown,
  ChevronRight,
  Building2,
  Trash2,
} from "@/src/components/icons";
import { Rfq, Supplier, Product } from "../types";
import { suppliersApi } from "../features/suppliers/api";
import { purchasingApi } from "../features/purchasing/api";
import { productsApi } from "../features/products/api";
import PurchaseRequestPicker from "./PurchaseRequestPicker";
import ProductPicker from "./ProductPicker";
import CurrencyInput from "./CurrencyInput";
import { useReactToPrint } from "react-to-print";
import { formatDate } from "../utils/date";
import { getCompanyProfile, CompanyProfile, formatAddressForPrint } from "../utils/companyProfile";
import Swal from 'sweetalert2';

interface RfqViewProps {
  onTriggerNotification: (message: string) => void;
  onNavigate?: (view: string) => void;
}

interface RfqFormItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  quotedUnitPrice: number;
  unit: string;
}

export default function RfqView({ onTriggerNotification, onNavigate }: RfqViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedRfqId, setExpandedRfqId] = useState<string | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(getCompanyProfile());

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setCompanyProfile(getCompanyProfile());
    };
    window.addEventListener('erp_company_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('erp_company_profile_updated', handleProfileUpdate);
  }, []);

  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: "RFQ_CV_Beton_Agung",
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creatingPoRfqId, setCreatingPoRfqId] = useState<string | null>(null);

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [prId, setPrId] = useState<string>("");
  const [prNumberDisplay, setPrNumberDisplay] = useState<string>("");
  const [rfqDate, setRfqDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  );

  const [formItems, setFormItems] = useState<RfqFormItem[]>([
    { id: `form-item-${Date.now()}`, productId: "", productName: "", quantity: 1, quotedUnitPrice: 0, unit: "Unit" }
  ]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sups, rfqData, prods] = await Promise.all([
        suppliersApi.getSuppliers(),
        purchasingApi.getRfqs(),
        productsApi.getProducts(),
      ]);
      setSuppliers(sups);
      if (sups.length > 0 && !supplierId) setSupplierId(sups[0].id);
      setRfqs(rfqData);
      setProducts(prods);
    } catch (err) {
      console.error(err);
      onTriggerNotification("Gagal memuat data RFQ");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Workflow shortcut effect
  useEffect(() => {
    const pendingPrId = sessionStorage.getItem('action_create_rfq');
    if (pendingPrId) {
      sessionStorage.removeItem('action_create_rfq');
      setPrId(pendingPrId);
      setShowAddModal(true);
    }
  }, []);

  const handleAddItem = () => {
    setFormItems(prev => [
      ...prev,
      {
        id: `form-item-${Date.now()}-${prev.length}`,
        productId: "",
        productName: "",
        quantity: 1,
        quotedUnitPrice: 0,
        unit: "Unit",
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (formItems.length > 1) {
      setFormItems(prev => prev.filter((item) => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof RfqFormItem, value: any) => {
    setFormItems(prev =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const getItemDisplayName = (it: { productId?: string; productName?: string; description?: string }) => {
    if (it.productName && it.productName !== 'Custom Item' && it.productName !== 'Unknown Product') {
      return it.productName;
    }
    if (it.productId) {
      const matched = products.find(p => p.id === it.productId || (p.id && it.productId && p.id.toLowerCase() === it.productId.toLowerCase()));
      if (matched) return matched.name;
    }
    return it.description || it.productName || 'Material / Produk';
  };

  const getItemUnit = (it: { productId?: string; unit?: string }) => {
    if (it.unit && it.unit !== 'Unit') {
      return it.unit;
    }
    if (it.productId) {
      const matched = products.find(p => p.id === it.productId || (p.id && it.productId && p.id.toLowerCase() === it.productId.toLowerCase()));
      if (matched?.unit) return matched.unit;
    }
    return it.unit || 'Unit';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formItems.some((item) => !item.productId || item.quantity <= 0)) {
      onTriggerNotification("Pilih produk dan pastikan kuantitas lebih dari 0");
      return;
    }

    if (!supplierId || !rfqDate || !validUntil || !prId) {
      alert("Harap isi semua field wajib termasuk Referensi PR.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        purchase_request_id: prId || undefined,
        supplier_id: supplierId,
        rfq_date: rfqDate,
        valid_until: validUntil,
        status: "Dikirim",
        items: formItems.map((it) => ({
          product_id: it.productId,
          description: it.productName || undefined,
          quantity: it.quantity,
          quoted_unit_price: it.quotedUnitPrice,
          subtotal: it.quantity * it.quotedUnitPrice,
        })),
      };

      await purchasingApi.createRfq(payload);
      onTriggerNotification("RFQ berhasil dikirim ke Vendor");
      setShowAddModal(false);

      // Reset form
      setFormItems([
        {
          id: `form-item-${Date.now()}`,
          productId: "",
          productName: "",
          quantity: 1,
          quotedUnitPrice: 0,
          unit: "Unit",
        },
      ]);
      setPrId("");
      setPrNumberDisplay("");

      await loadData();
    } catch (err) {
      console.error(err);
      onTriggerNotification("Gagal menyimpan RFQ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePo = async (rfq: any) => {
    if (creatingPoRfqId) {
      return;
    }

    setCreatingPoRfqId(rfq.id);
    try {
      const d = new Date();
      const todayStr = d.toISOString().split("T")[0];
      const expectedDate = new Date(d);
      expectedDate.setDate(d.getDate() + 7);

      await purchasingApi.createPurchaseOrder({
        supplier_id: rfq.supplierId,
        order_date: todayStr,
        expected_date: expectedDate.toISOString().split("T")[0],
        rfq_id: rfq.id,
        purchase_request_id:
          rfq.purchaseRequestId !== "-" ? rfq.purchaseRequestId : undefined,
        items: rfq.items.map((it: any) => ({
          product_id: it.productId,
          quantity: it.quantity,
          unit_price: it.quotedUnitPrice,
          description: getItemDisplayName(it),
        })),
      });
      onTriggerNotification(
        `Tawaran dari ${rfq.rfqNumber} disetujui, PO berstatus Draft berhasil digenerate!`,
      );
      await purchasingApi.updateRfqStatus(rfq.id, "Selesai");
      await loadData();
    } catch (err) {
      console.error(err);
      onTriggerNotification(
        err instanceof Error
          ? err.message
          : `Gagal membuat PO dari tawaran ${rfq.rfqNumber}`,
      );
    } finally {
      setCreatingPoRfqId(null);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await purchasingApi.updateRfqStatus(id, status);
      onTriggerNotification(`Status tawaran berhasil diubah menjadi ${status}`);
      await loadData();
    } catch (err) {
      onTriggerNotification(
        err instanceof Error ? err.message : "Gagal mengubah status RFQ",
      );
    }
  };

  const handleCancelRfq = async (id: string, rfqNumber: string) => {
    const { value: reason } = await Swal.fire({
      title: `Batalkan RFQ ${rfqNumber}?`,
      text: "Apakah Anda yakin? Masukkan alasan pembatalan:",
      input: 'text',
      inputPlaceholder: 'Misal: Batal dari pihak supplier',
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
        await purchasingApi.cancelRfq(id, reason);
        setRfqs(prev => prev.filter(rfq => rfq.id !== id));
        Swal.fire('Berhasil', `RFQ ${rfqNumber} berhasil dibatalkan.`, 'success');
        onTriggerNotification(`RFQ ${rfqNumber} dibatalkan.`);
      } catch (err: any) {
        console.error("Failed to cancel RFQ", err);
        const msg = err.response?.data?.message || err.message || "Gagal membatalkan RFQ";
        Swal.fire('Gagal!', msg, 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const filteredRfqs = rfqs.filter((r) => {
    if (r.status === 'cancelled' || r.status === 'Dibatalkan') return false;
    const matchesSearch =
      r.rfqNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.supplierName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(filteredRfqs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRfqs = filteredRfqs.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const formatIDR = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);

  return (
    <>
      <div className="print:hidden space-y-5 font-sans text-xs">
        {/* Header Banner */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-sky-50 text-sky-600 border border-sky-100 rounded-xl">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Request For Quotation (RFQ)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Permintaan penawaran harga dari supplier untuk pengadaan logistik dan material
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-md flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Kirim RFQ Baru</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-2.5 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari No RFQ atau Supplier..."
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
              <option value="Dikirim">Dikirim</option>
              <option value="Diterima">Diterima</option>
              <option value="Selesai">Selesai</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">
              Memuat data RFQ...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 uppercase tracking-wider font-mono text-[10px]">
                    <th className="p-3.5 pl-5">No RFQ</th>
                    <th className="p-3.5">Vendor / Supplier</th>
                    <th className="p-3.5">Referensi PR</th>
                    <th className="p-3.5">Tanggal</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right pr-5">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRfqs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-12 text-slate-400 font-medium"
                      >
                        Belum ada data RFQ.
                      </td>
                    </tr>
                  ) : (
                    paginatedRfqs.map((rfq) => {
                      const isExpanded = expandedRfqId === rfq.id;
                      return (
                        <React.Fragment key={rfq.id}>
                          <tr className="hover:bg-sky-50/20 transition-colors">
                            <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">
                              <button
                                onClick={() =>
                                  setExpandedRfqId(isExpanded ? null : rfq.id)
                                }
                                className="flex items-center gap-2 focus:outline-none text-left cursor-pointer group"
                              >
                                {isExpanded ? (
                                  <ChevronDown
                                    size={14}
                                    className="text-sky-600"
                                  />
                                ) : (
                                  <ChevronRight
                                    size={14}
                                    className="text-slate-400 group-hover:text-sky-600 transition-colors"
                                  />
                                )}{" "}
                                <span className="group-hover:text-sky-700 transition-colors">{rfq.rfqNumber}</span>
                              </button>
                            </td>
                            <td className="p-3.5 font-semibold text-slate-700">
                              <div className="flex items-center gap-1.5">
                                <Building2 size={14} className="text-slate-400 shrink-0" />{" "}
                                <span>{rfq.supplierName}</span>
                              </div>
                            </td>
                            <td className="p-3.5 font-mono text-sky-700 font-medium">
                              {rfq.purchaseRequestId !== "-"
                                ? rfq.purchaseRequestId
                                : "-"}
                            </td>
                            <td className="p-3.5 font-mono text-slate-500">
                              {formatDate(rfq.rfqDate)}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border ${
                                  rfq.status === "Diterima" || rfq.status === "Selesai"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                    : rfq.status === 'cancelled' || rfq.status === 'Dibatalkan' 
                                    ? "bg-rose-50 text-rose-700 border-rose-200" 
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {rfq.status === 'cancelled' ? 'Dibatalkan' : rfq.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-right pr-5 whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {rfq.status === "Dikirim" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleUpdateStatus(rfq.id, "Diterima")
                                      }
                                      className="btn btn-sm btn-success"
                                    >
                                      Terima
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleUpdateStatus(rfq.id, "Ditolak")
                                      }
                                      className="btn btn-sm btn-danger"
                                    >
                                      Tolak
                                    </button>
                                  </>
                                )}

                                <button
                                  onClick={() => {
                                    if (expandedRfqId !== rfq.id) {
                                      setExpandedRfqId(rfq.id);
                                    }
                                    onTriggerNotification(
                                      `Menyiapkan dokumen ${rfq.rfqNumber} untuk dicetak...`,
                                    );
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
                                    Penawaran Harga Item
                                  </div>
                                  <div className="space-y-1.5">
                                    {rfq.items.map((it: any) => {
                                      const displayName = getItemDisplayName(it);
                                      const displayUnit = getItemUnit(it);
                                      return (
                                        <div
                                          key={it.id}
                                          className="p-3 border border-slate-200 bg-white rounded-xl flex items-center justify-between shadow-2xs"
                                        >
                                          <div className="flex flex-col">
                                            <span className="font-semibold text-slate-800 text-xs">
                                              {displayName}
                                            </span>
                                            <span className="text-[11px] text-slate-500 font-medium">
                                              {it.quantity} {displayUnit} x{" "}
                                              {formatIDR(it.quotedUnitPrice)}
                                            </span>
                                          </div>
                                          <span className="font-mono text-slate-800 font-bold text-xs">
                                            {formatIDR(it.subtotal)}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <div className="pt-2 border-t border-slate-200/80 flex justify-between font-bold text-xs">
                                    <span className="text-slate-600">Total Estimasi</span>
                                    <span className="font-mono text-slate-900 text-sm">
                                      {formatIDR(
                                        rfq.items.reduce(
                                          (acc, curr) => acc + curr.subtotal,
                                          0,
                                        ),
                                      )}
                                    </span>
                                  </div>

                                  {onNavigate && (rfq.status === 'Disetujui' || rfq.status === 'Diterima') && (
                                    <div className="pt-2">
                                      <button
                                        onClick={() => {
                                          sessionStorage.setItem('action_create_po', rfq.id);
                                          onNavigate('purchase-orders');
                                        }}
                                        className="btn btn-primary btn-md w-full flex items-center justify-center gap-2"
                                      >
                                        <span>Lanjut Buat Purchase Order (PO)</span>
                                        <ChevronRight size={14} />
                                      </button>
                                    </div>
                                  )}
                                  
                                  {rfq.status !== 'cancelled' && rfq.status !== 'Dibatalkan' && (
                                    <div className="pt-1">
                                      <button
                                        onClick={() => handleCancelRfq(rfq.id, rfq.rfqNumber)}
                                        className="btn btn-secondary btn-md w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 rounded-xl flex items-center justify-center gap-1.5"
                                      >
                                        <X size={14} className="text-rose-500" />
                                        <span>Batalkan Request For Quotation</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-slate-200/80">
                  <div className="text-[11px] text-slate-400 font-mono">
                    Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredRfqs.length)} dari {filteredRfqs.length} data
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
          )}
        </div>

        {/* Modal RFQ Baru */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
              <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-sky-50 text-sky-600 border border-sky-100 rounded-lg">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      Kirim Permintaan Kuotasi (RFQ) Baru
                    </h3>
                    <p className="text-[11px] text-slate-500">Ajukan permohonan harga material ke supplier rekanan</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto p-5 flex-1">
                <form
                  id="rfq-form"
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Pilih Supplier / Vendor *
                        </label>
                        <select
                          value={supplierId}
                          onChange={(e) => setSupplierId(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all text-xs font-medium"
                          required
                        >
                          <option value="">Pilih Supplier...</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Referensi PR *
                        </label>
                        <PurchaseRequestPicker
                          value={prNumberDisplay}
                          onChange={(pr) => {
                            setPrId(pr.id);
                            setPrNumberDisplay(pr.prNumber);
                            if (pr.items && pr.items.length > 0) {
                              setFormItems(
                                pr.items.map((item, index) => {
                                  const matched = products.find(p => p.id === item.productId || (item.productId && p.id.toLowerCase() === item.productId.toLowerCase()));
                                  const pName = (item.productName && item.productName !== 'Unknown Product' && item.productName !== 'Custom Item')
                                    ? item.productName
                                    : matched?.name || (item as any).description || 'Material / Produk';
                                  return {
                                    id: `form-item-${Date.now()}-${index}`,
                                    productId: item.productId,
                                    productName: pName,
                                    quantity: item.quantity,
                                    quotedUnitPrice: 0,
                                    unit: item.unit || matched?.unit || "Unit",
                                  };
                                }),
                              );
                            }
                          }}
                          statusFilter="Disetujui"
                        />
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Tanggal RFQ *
                        </label>
                        <input
                          type="date"
                          value={rfqDate}
                          onChange={(e) => setRfqDate(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Berlaku Sampai *
                        </label>
                        <input
                          type="date"
                          value={validUntil}
                          onChange={(e) => setValidUntil(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-xs"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                        Daftar Material (Request Harga)
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="btn btn-secondary btn-sm text-sky-700 hover:text-sky-800 flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>Tambah Baris</span>
                      </button>
                    </div>

                    <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200/80">
                          <tr>
                            <th className="p-3 w-1/2">Material / Produk</th>
                            <th className="p-3 w-1/5">Qty</th>
                            <th className="p-3 w-1/4">Target Harga (Satuan)</th>
                            <th className="p-3 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formItems.map((item) => (
                            <tr key={item.id} className="bg-white hover:bg-slate-50/30">
                              <td className="p-2.5">
                                <ProductPicker
                                  value={item.productId}
                                  selectedProductName={item.productName}
                                  procurementTypeFilter="purchase"
                                  onChange={(prod) => {
                                    handleItemChange(
                                      item.id,
                                      "productId",
                                      prod.id,
                                    );
                                    handleItemChange(
                                      item.id,
                                      "productName",
                                      prod.name,
                                    );
                                    handleItemChange(
                                      item.id,
                                      "unit",
                                      prod.unit || "Unit",
                                    );
                                  }}
                                  placeholder="Pilih Material / Produk..."
                                />
                              </td>
                              <td className="p-2.5">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min="1"
                                    className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleItemChange(
                                        item.id,
                                        "quantity",
                                        parseInt(e.target.value) || 0,
                                      )
                                    }
                                    required
                                  />
                                  <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0 w-8">
                                    {item.unit || "Unit"}
                                  </span>
                                </div>
                              </td>
                              <td className="p-2.5">
                                <CurrencyInput
                                  className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs"
                                  value={item.quotedUnitPrice || ''}
                                  onValueChange={(val) =>
                                    handleItemChange(
                                      item.id,
                                      "quotedUnitPrice",
                                      parseInt(val) || 0,
                                    )
                                  }
                                />
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.id)}
                                  disabled={formItems.length === 1}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                  title="Hapus baris"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary btn-md"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="rfq-form"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-md flex items-center gap-2"
                >
                  {isSubmitting ? "Menyimpan..." : "Kirim RFQ"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PRINT TEMPLATE (Hidden by default, used by react-to-print) */}
      <div style={{ display: "none" }}>
        <div
          ref={printRef}
          className="bg-white text-black p-8 font-sans w-200 mx-auto print:block"
        >
          {(() => {
            const rfq = rfqs.find((p) => p.id === expandedRfqId);
            if (!rfq)
              return (
                <div className="p-8 text-center text-gray-500">
                  Pilih RFQ untuk dicetak
                </div>
              );
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
                      <h1 className="text-2xl font-black uppercase tracking-widest text-black">
                        {companyProfile.name}
                      </h1>
                      <p className="text-xs text-black font-medium mt-1">
                        General Contractor & Supplier Material Alam
                      </p>
                      <p className="text-[10px] text-gray-700 mt-0.5 max-w-xs">
                        {formatAddressForPrint(companyProfile.address)}
                      </p>
                      <p className="text-[10px] text-gray-700 mt-0.5">
                        Telp: {companyProfile.phone} | Email: {companyProfile.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-black uppercase tracking-widest border-b border-black pb-1 mb-1">
                      Request For Quotation
                    </h2>
                    <p className="font-mono text-sm font-bold">
                      {rfq.rfqNumber}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
                  <div>
                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className="py-1 w-32 font-bold">Kepada Vendor</td>
                          <td className="py-1 font-bold">
                            : {rfq.supplierName}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 font-bold">Ref PR</td>
                          <td className="py-1 font-mono">
                            :{" "}
                            {rfq.purchaseRequestId !== "-"
                              ? rfq.purchaseRequestId
                              : "Tanpa Referensi"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className="py-1 w-32 font-bold">
                            Tanggal Terbit
                          </td>
                          <td className="py-1">: {formatDate(rfq.rfqDate)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-bold">Berlaku Sampai</td>
                          <td className="py-1">
                            : {formatDate(rfq.validUntil)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mb-4 text-xs">
                  <p>
                    Bersama surat ini, kami memohon agar pihak Vendor dapat
                    memberikan penawaran harga terbaik untuk daftar kebutuhan
                    material berikut:
                  </p>
                </div>

                <table className="w-full text-left border-collapse border border-black text-xs mb-4">
                  <thead>
                    <tr className="border-b border-black bg-gray-100">
                      <th className="p-3 border-r border-black w-12 text-center font-bold">
                        No
                      </th>
                      <th className="p-3 border-r border-black font-bold">
                        Deskripsi Material / Produk
                      </th>
                      <th className="p-3 border-r border-black w-28 text-center font-bold">
                        Kuantitas
                      </th>
                      <th className="p-3 border-r border-black w-36 text-right font-bold">
                        Target Harga Satuan
                      </th>
                      <th className="p-3 w-40 text-right font-bold">
                        Subtotal Estimasi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfq.items.map((item, idx) => (
                      <tr key={item.id} className="border-b border-black">
                        <td className="p-3 border-r border-black text-center">
                          {idx + 1}
                        </td>
                        <td className="p-3 border-r border-black font-medium">
                          {getItemDisplayName(item)}
                        </td>
                        <td className="p-3 border-r border-black text-center">
                          {item.quantity} {getItemUnit(item)}
                        </td>
                        <td className="p-3 border-r border-black text-right font-mono text-gray-700">
                          {formatIDR(item.quotedUnitPrice)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold">
                          {formatIDR(item.quantity * item.quotedUnitPrice)}
                        </td>
                      </tr>
                    ))}
                    {rfq.items.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-4 text-center italic text-gray-500"
                        >
                          Tidak ada item
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {rfq.items.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-100">
                        <td
                          colSpan={4}
                          className="p-3 border-r border-t border-black text-right font-bold"
                        >
                          Grand Total Estimasi
                        </td>
                        <td className="p-3 border-t border-black text-right font-bold font-mono text-sm">
                          {formatIDR(
                            rfq.items.reduce(
                              (sum, item) =>
                                sum + item.quantity * item.quotedUnitPrice,
                              0,
                            ),
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>

                <div className="mb-12 text-xs">
                  <p>
                    Mohon kirimkan balasan penawaran resmi (Quotation) sebelum
                    batas waktu yang telah ditentukan di atas.
                  </p>
                  <p className="mt-2">
                    Demikian Request For Quotation ini kami sampaikan, atas
                    kerja samanya kami ucapkan terima kasih.
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
