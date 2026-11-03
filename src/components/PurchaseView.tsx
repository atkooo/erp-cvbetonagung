/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  Search,
  Filter,
  Plus,
  Printer,
  HelpCircle,
  X,
  ChevronDown,
  ChevronRight,
  PackageCheck,
  Package,
  FileText,
  Trash2,
} from "@/src/components/icons";
import { PurchaseOrder, Supplier, Product, SalesOrder } from "../types";
import { authStorage } from "../services/api";
import { purchasingApi } from "../features/purchasing/api";
import { suppliersApi } from "../features/suppliers/api";
import { productsApi } from "../features/products/api";
import { salesApi } from "../features/sales/api";
import { SkeletonTable, ErrorCard } from "./Skeleton";
import RfqPicker from "./RfqPicker";
import SalesOrderPicker from "./SalesOrderPicker";
import ProductPicker from "./ProductPicker";
import CurrencyInput from "./CurrencyInput";
import RestockModal from "./RestockModal";
import { useReactToPrint } from "react-to-print";
import { formatDate } from "../utils/date";
import { getCompanyProfile, formatAddressForPrint, CompanyProfile } from '../utils/companyProfile';
import Swal from "sweetalert2";

interface PurchaseViewProps {
  onTriggerNotification: (message: string) => void;
  onNavigate?: (view: string) => void;
}

interface PoFormItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
}

export default function PurchaseView({
  onTriggerNotification,
  onNavigate,
}: PurchaseViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(getCompanyProfile());

  useEffect(() => {
    const handleProfileUpdate = () => {
      setCompanyProfile(getCompanyProfile());
    };
    window.addEventListener('erp_company_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('erp_company_profile_updated', handleProfileUpdate);
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockItemCount, setRestockItemCount] = useState(0);
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);
  const [printPoId, setPrintPoId] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: "PO_CV_Beton_Agung",
  });

  // API states
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New PO States
  const [referenceType, setReferenceType] = useState<"rfq" | "so">("rfq");
  const [supplierId, setSupplierId] = useState("");
  const [salesOrderId, setSalesOrderId] = useState("");
  const [salesOrderNumberDisplay, setSalesOrderNumberDisplay] = useState("");
  const [rfqId, setRfqId] = useState<string>("");
  const [rfqNumberDisplay, setRfqNumberDisplay] = useState<string>("");
  const [formItems, setFormItems] = useState<PoFormItem[]>([]);

  const resetPoForm = () => {
    setReferenceType("rfq");
    setSupplierId("");
    setSalesOrderId("");
    setSalesOrderNumberDisplay("");
    setRfqId("");
    setRfqNumberDisplay("");
    setFormItems([]);
  };

  const handleOpenAddModal = () => {
    resetPoForm();
    setShowAddModal(true);
  };

  // Quick add supplier states
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupName, setNewSupName] = useState("");
  const [newSupPhone, setNewSupPhone] = useState("");
  const [newSupCity, setNewSupCity] = useState("");
  const [newSupAddress, setNewSupAddress] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [pos, sups, prods, sos] = await Promise.all([
        purchasingApi.getPurchaseOrders(),
        suppliersApi.getSuppliers(),
        productsApi.getProducts(),
        salesApi.getSalesOrders(),
      ]);
      setPurchaseOrders(pos);
      setSuppliers(sups);
      setProducts(prods);
      setSalesOrders(sos);

      purchasingApi.getRestockSuggestions().then(res => {
        setRestockItemCount(res.summary.total_items);
      }).catch(e => console.error("Error loading restock count", e));

      // Supplier is set based on selected RFQ or chosen manually when SO reference is selected
    } catch (err) {
      console.error("Failed to load purchasing data", err);
      const msg =
        err instanceof Error ? err.message : "Gagal memuat data pembelian";
      setErrorMessage(msg);
      onTriggerNotification(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Workflow shortcut effect (e.g. dari RFQ)
  useEffect(() => {
    const pendingRfqId = sessionStorage.getItem('action_create_po');
    if (pendingRfqId) {
      sessionStorage.removeItem('action_create_po');
      setReferenceType('rfq');
      setRfqId(pendingRfqId);
      setShowAddModal(true);

      purchasingApi.getRfqs().then((allRfqs) => {
        const matched = allRfqs.find(r => r.id === pendingRfqId || r.rfqNumber === pendingRfqId);
        if (matched) {
          setRfqNumberDisplay(matched.rfqNumber);
          setSupplierId(matched.supplierId);
          if (matched.items && matched.items.length > 0) {
            setFormItems(
              matched.items.map((item, index) => {
                const prod = products.find((p) => p.id === item.productId || (item.productId && p.id.toLowerCase() === item.productId.toLowerCase()));
                const pName = (item.productName && item.productName !== 'Unknown Product' && item.productName !== 'Custom Item')
                  ? item.productName
                  : prod?.name || (item as any).description || 'Material / Produk';
                return {
                  id: `form-item-${Date.now()}-${index}`,
                  productId: item.productId,
                  productName: pName,
                  quantity: item.quantity,
                  price: item.quotedUnitPrice || prod?.costPrice || 0,
                  unit: item.unit || prod?.unit || "Unit",
                };
              })
            );
          }
        }
      }).catch(err => console.error("Error loading pending RFQ", err));
    }
  }, [products]);

  const handleAddItem = () => {
    setFormItems(prev => [
      ...prev,
      { id: `form-item-${Date.now()}-${prev.length}`, productId: "", productName: "", quantity: 1, price: 0, unit: "Unit" },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (formItems.length > 1) {
      setFormItems(prev => prev.filter((item) => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof PoFormItem, value: any) => {
    setFormItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getItemDisplayName = (it: { productId?: string; productName?: string; description?: string }) => {
    if (it.productName && it.productName !== 'Unknown Product' && it.productName !== 'Custom Item') {
      return it.productName;
    }
    if (it.productId) {
      const matched = products.find(p => p.id === it.productId || (p.id && it.productId && p.id.toLowerCase() === it.productId.toLowerCase()));
      if (matched) return matched.name;
    }
    return it.description || it.productName || 'Material / Produk';
  };

  const filteredPOs = purchaseOrders.filter((po) => {
    if (po.status === 'Dibatalkan' || po.status === 'cancelled') return false;
    const matchesSearch =
      po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(filteredPOs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPOs = filteredPOs.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (referenceType === 'rfq' && !rfqId) {
      onTriggerNotification(
        "Gagal: Pembuatan Purchase Order wajib memilih dokumen referensi RFQ!",
      );
      return;
    }

    if (referenceType === 'so' && !salesOrderId) {
      onTriggerNotification(
        "Gagal: Pembuatan Purchase Order wajib memilih dokumen referensi Sales Order!",
      );
      return;
    }

    if (!rfqId && !salesOrderId) {
      onTriggerNotification(
        "Gagal: Pembuatan Purchase Order wajib memiliki referensi dari RFQ atau Sales Order!",
      );
      return;
    }

    if (!supplierId) {
      onTriggerNotification("Gagal: Vendor Supplier wajib dipilih!");
      return;
    }

    if (
      formItems.length === 0 ||
      formItems.some(
        (item) => !item.productId || item.quantity <= 0 || item.price < 0,
      )
    ) {
      onTriggerNotification(
        "Gagal: Pastikan semua item memiliki produk, kuantitas positif, dan harga valid!",
      );
      return;
    }

    try {
      const d = new Date();
      const todayStr = d.toISOString().split("T")[0];
      const expectedDate = new Date(d);
      expectedDate.setDate(d.getDate() + 7);

      await purchasingApi.createPurchaseOrder({
        supplier_id: supplierId,
        sales_order_id: referenceType === 'so' ? salesOrderId : undefined,
        rfq_id: referenceType === 'rfq' ? rfqId : undefined,
        order_date: todayStr,
        expected_date: expectedDate.toISOString().split("T")[0],
        items: formItems.map((it) => ({
          product_id: it.productId,
          description: it.productName || undefined,
          quantity: it.quantity,
          unit_price: it.price,
        })),
      });
      onTriggerNotification(`Sukses menerbitkan PO via API`);

      // Reset form
      resetPoForm();
      setShowAddModal(false);
      await loadData();
    } catch (err: any) {
      onTriggerNotification(
        err?.response?.data?.message || (err instanceof Error ? err.message : "Gagal membuat dokumen PO"),
      );
    }
  };

  const handleQuickAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName) return;

    try {
      const newSup = await suppliersApi.createSupplier({
        name: newSupName,
        phone: newSupPhone,
        city: newSupCity,
        address: newSupAddress,
      });

      setSuppliers((prev) => [newSup, ...prev]);
      setSupplierId(newSup.id);
      setShowAddSupplier(false);

      setNewSupName("");
      setNewSupPhone("");
      setNewSupCity("");
      setNewSupAddress("");

      onTriggerNotification(`Supplier ${newSup.name} berhasil ditambahkan!`);
    } catch (err) {
      onTriggerNotification(
        err instanceof Error
          ? err.message
          : "Gagal menambahkan supplier baru",
      );
    }
  };

  const handleApprove = async (id: string, poNumber: string) => {
    const result = await Swal.fire({
      title: "Setujui PO?",
      text: `Apakah Anda yakin ingin menyetujui PO ${poNumber}? Status akan berubah menjadi Dipesan.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Setujui",
      cancelButtonText: "Batal",
      confirmButtonColor: "#059669",
    });

    if (result.isConfirmed) {
      try {
        await purchasingApi.approvePurchaseOrder(id);
        Swal.fire("Berhasil", `PO ${poNumber} berhasil disetujui.`, "success");
        onTriggerNotification(`PO ${poNumber} disetujui.`);
        await loadData();
      } catch (err) {
        Swal.fire(
          "Gagal",
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat menyetujui PO",
          "error",
        );
      }
    }
  };

  const handleCancel = async (id: string, poNumber: string) => {
    const { value: reason } = await Swal.fire({
      title: `Batalkan PO ${poNumber}?`,
      text: "Masukkan alasan pembatalan dokumen Purchase Order:",
      input: "text",
      inputPlaceholder: "Alasan pembatalan...",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Batalkan",
      cancelButtonText: "Kembali",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#94a3b8",
      inputValidator: (value) => {
        if (!value) {
          return "Alasan pembatalan wajib diisi!";
        }
      },
    });

    if (reason) {
      try {
        await purchasingApi.cancelPurchaseOrder(id, reason);
        Swal.fire("Berhasil", `PO ${poNumber} berhasil dibatalkan.`, "success");
        onTriggerNotification(`PO ${poNumber} dibatalkan.`);
        await loadData();
      } catch (err) {
        Swal.fire(
          "Gagal",
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat membatalkan PO",
          "error",
        );
      }
    }
  };

  return (
    <div className="space-y-5 font-sans text-xs">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-sky-50 text-sky-600 border border-sky-100 rounded-xl">
            <ShoppingCart size={22} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">
              Purchase Order (PO)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Penerbitan pesanan resmi logistik dan material ke supplier rekanan
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowRestockModal(true)}
            className="btn btn-secondary btn-md border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 flex items-center gap-1.5 shrink-0"
          >
            <Package size={15} />
            <span>Restok Barang Kosong</span>
            {restockItemCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-600 text-white text-[10px] font-bold rounded-full">
                {restockItemCount}
              </span>
            )}
          </button>
          <button
            onClick={handleOpenAddModal}
            className="btn btn-primary btn-md flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Buat PO Baru</span>
          </button>
        </div>
      </div>

      {/* Query Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari No PO atau nama supplier..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-200/80">
          <Filter size={14} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs text-slate-700 font-medium bg-transparent py-0.5 cursor-pointer outline-none"
          >
            <option value="All">Semua Status</option>
            <option value="Draft">Draft</option>
            <option value="Dipesan">Dipesan</option>
            <option value="Diterima Sebagian">Diterima Sebagian</option>
            <option value="Diterima Penuh">Diterima Penuh</option>
          </select>
        </div>
      </div>

      {/* Main grid table */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={loadData} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 uppercase tracking-wider font-mono text-[10px]">
                  <th className="p-3.5 pl-5">No PO</th>
                  <th className="p-3.5">Pemasok / Supplier</th>
                  <th className="p-3.5">Tanggal Surat</th>
                  <th className="p-3.5">Total Pengadaan</th>
                  <th className="p-3.5">Status Logistik</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-slate-400 font-medium"
                    >
                      Tidak ditemukan data Purchase Order yang terekam.
                    </td>
                  </tr>
                ) : (
                  <>
                    {paginatedPOs.map((po) => {
                      const isExpanded = expandedPoId === po.id;
                      return (
                        <React.Fragment key={po.id}>
                          <tr className="hover:bg-sky-50/20 transition-colors">
                            <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">
                              <button
                                onClick={() =>
                                  setExpandedPoId(isExpanded ? null : po.id)
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
                                )}
                                <span className="group-hover:text-sky-700 transition-colors">{po.poNumber}</span>
                              </button>
                            </td>
                            <td className="p-3.5 font-semibold text-slate-700">
                              {po.supplierName}
                            </td>
                            <td className="p-3.5 font-mono text-slate-500">
                              {formatDate(po.date)}
                            </td>
                            <td className="p-3.5 font-mono font-bold text-slate-900">
                              {formatIDR(po.total)}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border ${
                                  po.status === 'Diterima Penuh'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : po.status === 'Diterima Sebagian'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : po.status === 'Dipesan'
                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                {po.status}
                              </span>
                            </td>
                            <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {po.status === "Draft" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleApprove(po.id, po.poNumber)
                                      }
                                      className="btn btn-sm btn-success"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleCancel(po.id, po.poNumber)
                                      }
                                      className="btn btn-sm btn-danger"
                                    >
                                      Batal
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => {
                                    setPrintPoId(po.id);
                                    onTriggerNotification(
                                      `Menyiapkan dokumen PO ${po.poNumber} untuk dicetak...`,
                                    );
                                    setTimeout(() => handlePrintAction(), 300);
                                  }}
                                  className="btn btn-sm btn-secondary flex items-center gap-1.5"
                                  title="Print PO"
                                >
                                  <Printer size={13} />
                                  <span>Cetak</span>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expandable PO items block */}
                          {isExpanded && (
                            <tr className="bg-slate-50/50">
                              <td
                                colSpan={6}
                                className="p-4 pl-12 border-t border-slate-100"
                              >
                                <div className="space-y-3 max-w-xl">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                                      Komponen Barang Pengadaan
                                    </h5>
                                    {po.salesOrderNumber && (
                                      <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-lg text-[10px] font-medium border border-sky-100 flex items-center gap-1">
                                        <ShoppingCart size={11} />
                                        SO: {po.salesOrderNumber}
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-1.5">
                                    {po.items?.map((it, idx) => {
                                      const displayName = getItemDisplayName(it);
                                      return (
                                        <div
                                          key={idx}
                                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs"
                                        >
                                          <div>
                                            <span className="font-semibold text-slate-800 text-xs block">
                                              {displayName}
                                            </span>
                                            <span className="text-slate-500 font-mono text-[11px]">
                                              {it.quantity} Pcs x {formatIDR(it.price)}
                                            </span>
                                          </div>
                                          <span className="font-mono text-slate-900 font-bold text-xs">
                                            {formatIDR(it.quantity * it.price)}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {onNavigate && po.status === "Dipesan" && (
                                    <div className="pt-2">
                                      <button
                                        onClick={() => {
                                          sessionStorage.setItem('action_receive_po', po.id);
                                          onNavigate('incoming-goods');
                                        }}
                                        className="btn btn-primary btn-md w-full flex items-center justify-center gap-2"
                                      >
                                        <span>Lanjut ke Penerimaan Barang (GRN)</span>
                                        <ChevronRight size={14} />
                                      </button>
                                    </div>
                                  )}
                                  {onNavigate && (po.status === "Diterima Sebagian" || po.status === "Diterima Penuh") && (
                                    <div className="pt-2">
                                      <button
                                        onClick={() => {
                                          sessionStorage.setItem('action_pay_ap', po.poNumber);
                                          onNavigate('accounts-payable');
                                        }}
                                        className="btn btn-primary btn-md w-full flex items-center justify-center gap-2"
                                      >
                                        <span>Lanjut ke Outstanding Payable (AP)</span>
                                        <ChevronRight size={14} />
                                      </button>
                                    </div>
                                  )}

                                  {po.status !== 'cancelled' && po.status !== 'Dibatalkan' && (
                                    <div className="pt-1">
                                      <button
                                        onClick={() => handleCancel(po.id, po.poNumber)}
                                        className="btn btn-secondary btn-md w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 rounded-xl flex items-center justify-center gap-1.5"
                                      >
                                        <X size={14} className="text-rose-500" />
                                        <span>Batalkan Purchase Order</span>
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
                Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredPOs.length)} dari {filteredPOs.length} data
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

      {/* Rilis PO Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-600 border border-sky-100 rounded-lg">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Penerbitan Dokumen PO</h3>
                  <p className="text-[11px] text-slate-500">Buat pesanan resmi pengadaan logistik ke supplier</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetPoForm();
                }}
                className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form
              id="po-form"
              onSubmit={handleSubmit}
              className="p-5 space-y-4 overflow-y-auto flex-1"
            >
              {/* Pilihan Sumber Referensi (Wajib) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Sumber Referensi Dokumen</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (referenceType !== 'rfq') {
                        setReferenceType('rfq');
                        setSalesOrderId('');
                        setSalesOrderNumberDisplay('');
                        setSupplierId('');
                        setFormItems([]);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      referenceType === 'rfq'
                        ? 'bg-sky-50/60 border-sky-500 text-sky-900 ring-2 ring-sky-500/20 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${referenceType === 'rfq' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Penawaran Pemasok (RFQ)</div>
                      <div className="text-[11px] text-slate-400">Penawaran harga vendor yang telah disetujui</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (referenceType !== 'so') {
                        setReferenceType('so');
                        setRfqId('');
                        setRfqNumberDisplay('');
                        setSupplierId(suppliers.length > 0 ? suppliers[0].id : '');
                        setFormItems([]);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      referenceType === 'so'
                        ? 'bg-sky-50/60 border-sky-500 text-sky-900 ring-2 ring-sky-500/20 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${referenceType === 'so' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <ShoppingCart size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Pesanan Penjualan (SO)</div>
                      <div className="text-[11px] text-slate-400">Pengadaan barang untuk pesanan penjualan</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Input Referensi & Supplier berdasarkan Tipe Referensi */}
              {referenceType === 'rfq' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Referensi RFQ <span className="text-rose-500">*</span>
                    </label>
                    <RfqPicker
                      value={rfqNumberDisplay || rfqId}
                      onChange={(rfq) => {
                        setRfqId(rfq.id);
                        setRfqNumberDisplay(rfq.rfqNumber);
                        setSupplierId(rfq.supplierId);
                        if (rfq.items && rfq.items.length > 0) {
                          setFormItems(
                            rfq.items.map((item, index) => {
                              const prod = products.find((p) => p.id === item.productId || (item.productId && p.id.toLowerCase() === item.productId.toLowerCase()));
                              const pName = (item.productName && item.productName !== 'Unknown Product' && item.productName !== 'Custom Item')
                                ? item.productName
                                : prod?.name || (item as any).description || 'Material / Produk';
                              return {
                                id: `form-item-${Date.now()}-${index}`,
                                productId: item.productId,
                                productName: pName,
                                quantity: item.quantity,
                                price:
                                  item.quotedUnitPrice ||
                                  prod?.costPrice ||
                                  0,
                                unit: item.unit || prod?.unit || "Unit",
                              };
                            }),
                          );
                        } else {
                          setFormItems([]);
                        }
                      }}
                      onClear={() => {
                        setRfqId("");
                        setRfqNumberDisplay("");
                        setSupplierId("");
                        setFormItems([]);
                      }}
                      statusFilter="Diterima"
                      placeholder="Pilih Referensi RFQ (Diterima)..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Vendor Supplier <span className="text-rose-500">*</span>
                    </label>
                    {rfqId && supplierId ? (
                      <div className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-between">
                        <span>{suppliers.find(s => s.id === supplierId)?.name || 'Supplier Terkunci dari RFQ'}</span>
                        <span className="text-[10px] text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                          Terkunci dari RFQ
                        </span>
                      </div>
                    ) : (
                      <div className="w-full p-2.5 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-xs">
                        Pilih referensi RFQ terlebih dahulu
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Referensi Sales Order <span className="text-rose-500">*</span>
                    </label>
                    <SalesOrderPicker
                      value={salesOrderNumberDisplay || salesOrderId}
                      excludedSalesOrderIds={purchaseOrders
                        .filter(p => !['cancelled', 'dibatalkan'].includes((p.status || '').toLowerCase()))
                        .map(p => p.salesOrderId)
                        .filter(Boolean) as string[]}
                      onChange={(so) => {
                        setSalesOrderId(so.id);
                        setSalesOrderNumberDisplay(so.orderNumber);
                        if (so && so.items && so.items.length > 0) {
                          const pendingItems = [];
                          
                          so.items.forEach((item) => {
                            if (so.source === 'pos') {
                              const poQty = so.deliveryOrders?.filter(d => d.status === 'draft' || d.status === 'ready_to_load')
                                .flatMap(d => d.items || [])
                                .filter(di => di.productId === item.productId)
                                .reduce((sum, di) => sum + di.quantity, 0) || 0;
                              
                              if (poQty > 0) {
                                pendingItems.push({ ...item, quantity: poQty });
                              }
                            } else {
                              pendingItems.push(item);
                            }
                          });

                          const itemsToUse = pendingItems.length > 0 ? pendingItems : so.items;

                          setFormItems(
                            itemsToUse.map((item, index) => {
                              const prod = products.find((p) => p.id === item.productId || (item.productId && p.id.toLowerCase() === item.productId.toLowerCase()));
                              const pName = item.productName || prod?.name || item.product?.name || (item as any).description || 'Material / Produk';
                              const itemSellingPrice = Number(item.price ?? item.unitPrice ?? (item as any).unit_price ?? prod?.sellingPrice ?? (prod as any)?.price ?? 0);
                              const itemCostPrice = (prod?.costPrice && Number(prod.costPrice) > 0)
                                ? Number(prod.costPrice)
                                : itemSellingPrice;

                              return {
                                id: `form-item-${Date.now()}-${index}`,
                                productId: item.productId || "",
                                productName: pName,
                                quantity: item.quantity,
                                price: itemCostPrice,
                                unit: item.unit || prod?.unit || "Unit",
                              };
                            })
                          );
                        } else {
                          setFormItems([]);
                        }
                      }}
                      onClear={() => {
                        setSalesOrderId("");
                        setSalesOrderNumberDisplay("");
                        setFormItems([]);
                      }}
                      statusFilter=""
                      placeholder="Pilih Referensi Sales Order..."
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Vendor Supplier <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddSupplier(true)}
                        className="text-[10px] text-sky-600 font-bold hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={10} /> Tambah Baru
                      </button>
                    </div>
                    {suppliers.length > 0 ? (
                      <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs font-medium cursor-pointer"
                        required
                      >
                        <option value="">-- Pilih Supplier Vendor --</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.city})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        disabled
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-400 text-xs"
                      >
                        <option>Memuat Supplier...</option>
                      </select>
                    )}
                  </div>
                </div>
              )}

              {/* Item List Header and Actions */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Daftar Item PO
                    </h4>
                    {formItems.length > 0 && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {formItems.length} item
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!rfqId && !salesOrderId}
                    className="btn btn-secondary btn-sm text-sky-700 hover:text-sky-800 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={!rfqId && !salesOrderId ? "Pilih dokumen referensi terlebih dahulu" : "Tambah baris item"}
                  >
                    <Plus size={13} />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                {/* Empty State vs Item Table */}
                {(!rfqId && !salesOrderId) || formItems.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-xl text-slate-500">
                    <FileText className="mx-auto mb-2 text-slate-400" size={24} />
                    <p className="font-semibold text-xs text-slate-700">Wajib Memilih Dokumen Referensi</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                      Silakan pilih dokumen {referenceType === 'rfq' ? 'RFQ (Penawaran Pemasok)' : 'Sales Order (Pesanan Penjualan)'} di atas untuk memuat daftar barang yang akan dipesan.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200/80 rounded-xl overflow-x-auto">
                    <table className="w-full min-w-155 table-fixed text-left">
                      <colgroup>
                        <col className="w-[52%]" />
                        <col className="w-[18%]" />
                        <col className="w-[22%]" />
                        <col className="w-[8%]" />
                      </colgroup>
                      <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200/80">
                        <tr>
                          <th className="p-3">Material / Produk</th>
                          <th className="p-3">Qty</th>
                          <th className="p-3">Harga Satuan</th>
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
                                showCategoryFilter
                                procurementTypeFilter="purchase"
                                onChange={(prod) => {
                                  handleItemChange(item.id, "productId", prod.id);
                                  handleItemChange(item.id, "productName", prod.name);
                                  handleItemChange(item.id, "unit", prod.unit || "Unit");
                                  handleItemChange(
                                    item.id,
                                    "price",
                                    (prod.costPrice && Number(prod.costPrice) > 0)
                                      ? Number(prod.costPrice)
                                      : (Number(prod.sellingPrice || (prod as any).price) || 0),
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
                                value={item.price || ''}
                                onValueChange={(val) =>
                                  handleItemChange(
                                    item.id,
                                    "price",
                                    parseInt(val) || 0,
                                  )
                                }
                                required
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={formItems.length === 1}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
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
                )}
              </div>

              {formItems.length > 0 && (
                <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">
                    Total Estimasi PO:
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {formatIDR(
                      formItems.reduce(
                        (acc, curr) => acc + curr.quantity * curr.price,
                        0,
                      ),
                    )}
                  </span>
                </div>
              )}
            </form>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5 mt-auto">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetPoForm();
                }}
                className="btn btn-secondary btn-md"
              >
                Batal
              </button>
              <button
                type="submit"
                form="po-form"
                disabled={isLoading || (!rfqId && !salesOrderId) || formItems.length === 0}
                className="btn btn-primary btn-md flex items-center gap-2"
              >
                {isLoading ? "Menyimpan..." : "Rilis Surat PO"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Layout */}
      <div className="hidden">
        <div
          ref={printRef}
          className="print:block p-8 font-sans text-sm text-black bg-white"
        >
          {printPoId &&
            (() => {
              const poToPrint = purchaseOrders.find((p) => p.id === printPoId);
              if (!poToPrint) return null;
              return (
                <div className="w-full">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-8">
                    <div className="flex items-center gap-4">
                      {companyProfile.logoUrl ? (
                        <img src={companyProfile.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
                      ) : (
                        <div className="w-16 h-16 bg-slate-900 flex items-center justify-center text-white font-black text-2xl tracking-tighter">
                          {companyProfile.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase">
                          {companyProfile.name}
                        </h1>
                        <p className="text-sm font-medium mt-1">
                          General Contractor & Supplier Material Alam
                        </p>
                        <p className="text-xs mt-1 max-w-xs text-gray-600">
                          {formatAddressForPrint(companyProfile.address)}
                        </p>
                        <p className="text-[10px] mt-0.5">Telp: {companyProfile.phone} | Email: {companyProfile.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-black text-gray-400 uppercase tracking-widest border border-gray-300 inline-block px-4 py-1 rounded">
                        PURCHASE ORDER
                      </h2>
                      <p className="font-mono font-bold mt-2 text-lg">
                        {poToPrint.poNumber}
                      </p>
                      <p className="text-sm">
                        Tanggal: {formatDate(poToPrint.date)}
                      </p>
                    </div>
                  </div>

                  {/* To */}
                  <div className="mb-8 p-4 border border-black rounded-lg inline-block min-w-75">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                      Kepada Yth. (Supplier)
                    </p>
                    <p className="font-bold text-lg">
                      {poToPrint.supplierName}
                    </p>
                  </div>

                  {/* Items */}
                  <table className="w-full mb-8 border-collapse border border-black">
                    <thead>
                      <tr className="bg-gray-100 uppercase text-xs">
                        <th className="p-3 border border-black text-left w-12">
                          No
                        </th>
                        <th className="p-3 border border-black text-left">
                          Nama Produk / Material
                        </th>
                        <th className="p-3 border border-black text-center w-24">
                          Qty
                        </th>
                        <th className="p-3 border border-black text-right w-40">
                          Harga Satuan
                        </th>
                        <th className="p-3 border border-black text-right w-48">
                          Jumlah
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {poToPrint.items?.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="p-3 border border-black text-center">
                            {idx + 1}
                          </td>
                          <td className="p-3 border border-black font-medium">
                            {getItemDisplayName(item)}
                          </td>
                          <td className="p-3 border border-black text-center">
                            {item.quantity}
                          </td>
                          <td className="p-3 border border-black text-right font-mono">
                            {formatIDR(item.price)}
                          </td>
                          <td className="p-3 border border-black text-right font-mono font-bold">
                            {formatIDR(item.quantity * item.price)}
                          </td>
                        </tr>
                      ))}
                      {!poToPrint.items?.length && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center italic">
                            Tidak ada rincian material
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100">
                        <td
                          colSpan={4}
                          className="p-3 border border-black text-right font-bold"
                        >
                          TOTAL KESELURUHAN
                        </td>
                        <td className="p-3 border border-black text-right font-bold font-mono text-lg">
                          {formatIDR(poToPrint.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  <div className="text-xs mb-12">
                    <p>
                      <strong>Catatan Tambahan:</strong> Harap menyertakan
                      salinan dokumen PO ini pada saat pengiriman faktur tagihan
                      dan surat jalan (GRN).
                    </p>
                  </div>
                </div>
              );
            })()}
        </div>
      </div>

      {/* Quick Add Supplier Modal */}
      {showAddSupplier && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-60 p-4 font-sans text-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden">
            <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-50 text-sky-600 border border-sky-100 rounded-lg">
                  <ShoppingCart size={16} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Tambah Supplier Baru
                </h3>
              </div>
              <button
                onClick={() => setShowAddSupplier(false)}
                className="p-1 hover:bg-slate-200/70 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleQuickAddSupplier} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Nama Supplier *
                </label>
                <input
                  required
                  type="text"
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  value={newSupPhone}
                  onChange={(e) => setNewSupPhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Kota
                </label>
                <input
                  type="text"
                  value={newSupCity}
                  onChange={(e) => setNewSupCity(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Alamat Lengkap
                </label>
                <textarea
                  rows={2}
                  value={newSupAddress}
                  onChange={(e) => setNewSupAddress(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-xs resize-none"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs font-bold mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplier(false)}
                  className="btn btn-secondary btn-md"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-md"
                >
                  Simpan Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Restok Barang Kosong */}
      <RestockModal
        isOpen={showRestockModal}
        onClose={() => setShowRestockModal(false)}
        suppliers={suppliers}
        onTriggerNotification={onTriggerNotification}
        onPoCreated={() => loadData()}
      />
    </div>
  );
}
