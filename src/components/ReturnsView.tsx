/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
  Eye,
  Trash2,
  X,
  Filter,
} from "@/src/components/icons";
import SearchableSelect from "./SearchableSelect";
import ProductPicker from "./ProductPicker";
import Swal from "sweetalert2";
import { purchasingApi } from "../features/purchasing/api";
import {
  Return,
  ReturnItem,
  CreateReturnDto,
} from "../features/purchasing/types";
import { productsApi } from "../features/products/api";
import { Product } from "../types";
import { customersApi } from "../features/customers/api";
import { suppliersApi } from "../features/suppliers/api";
import { salesApi } from "../features/sales/api";
import { financeApi } from "../features/finance/api";
import { Supplier, Customer, SalesOrder, PurchaseOrder } from "../types";
import { AccountDto } from "../features/finance/types";

interface ReturnsViewProps {
  onTriggerNotification: (message: string) => void;
  defaultType?: "customer" | "supplier";
}

interface ReturnFormItem {
  product_id: string;
  productName: string;
  quantity: number;
  notes: string;
  max_qty?: number;
}

const StatusPill = ({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "amber" | "emerald" | "rose" | "sky";
}) => {
  const tones: Record<string, string> = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border ${tones[tone] || tones.slate}`}
    >
      {children}
    </span>
  );
};

export default function ReturnsView({
  onTriggerNotification,
  defaultType,
}: ReturnsViewProps) {
  const [returns, setReturns] = useState<Return[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "customer" | "supplier">(
    defaultType || "all",
  );

  // Modals
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  // Form State
  const [type, setType] = useState<"customer" | "supplier">(defaultType || "customer");

  useEffect(() => {
    if (defaultType) {
      setFilterType(defaultType);
      setType(defaultType);
    }
  }, [defaultType]);

  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [selectedRefId, setSelectedRefId] = useState("");
  const [reason, setReason] = useState("");
  const [action, setAction] = useState<"refund" | "replace">("refund");
  const [items, setItems] = useState<ReturnFormItem[]>([]);

  useEffect(() => {
    fetchReturns();
    loadMasterData();
  }, []);

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const data = await purchasingApi.getReturns();
      setReturns(data);
    } catch (error) {
      console.error("Error fetching returns:", error);
      onTriggerNotification("Gagal memuat daftar retur barang.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedReturn || !selectedAccountId) return;
    setIsSubmittingRefund(true);
    try {
      await purchasingApi.refundReturn(selectedReturn.id, selectedAccountId);
      onTriggerNotification("Refund berhasil diproses.");
      setShowRefundModal(false);
      setSelectedReturn(null);
      fetchReturns();
    } catch (error) {
      console.error(error);
      const message = (error as any).message || (error as any).response?.data?.message || "Terjadi kesalahan saat memproses refund.";
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: message,
      });
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const loadMasterData = async () => {
    try {
      const [prods, custsRes, supps, sos, pos, cashBankData] = await Promise.all([
        productsApi.getProducts(),
        customersApi.listCustomers(),
        suppliersApi.getSuppliers(),
        salesApi.getSalesOrders(),
        purchasingApi.getPurchaseOrders(),
        financeApi.getCashBank(),
      ]);
      setProducts(prods);
      setCustomers(custsRes.customers);
      setSuppliers(supps);
      setSalesOrders(sos);
      setPurchaseOrders(pos);
      setAccounts(cashBankData.accounts);
    } catch (error) {
      console.error("Error loading master data for returns:", error);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, allowBackorder: boolean = false) => {
    const statusLabels: Record<string, string> = {
      approved: "Setujui & Restock",
      rejected: "Tolak",
      supplier_claim: "Klaim Supplier",
    };

    if (!allowBackorder) {
      const result = await Swal.fire({
        title: "Ubah Status QC?",
        text: `Apakah Anda yakin ingin mengubah status retur menjadi "${statusLabels[status]}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, Ubah",
        cancelButtonText: "Batal",
        confirmButtonColor: "#0284c7",
      });

      if (!result.isConfirmed) return;
    }

    try {
      await purchasingApi.updateReturnQcStatus(id, status, allowBackorder);
      Swal.fire("Sukses", "Status QC berhasil diperbarui.", "success");
      onTriggerNotification(
        `Status retur diubah menjadi ${statusLabels[status]}.`,
      );
      setSelectedReturn(null);
      fetchReturns();
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.message || "";
      if (errorMessage.includes("Stok tidak mencukupi untuk barang pengganti") && status === "approved") {
        const backorderResult = await Swal.fire({
          title: "Stok Tidak Mencukupi",
          text: `${errorMessage}. Tetap setujui dan masukkan ke antrean tunggu (Backorder)?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Ya, Tetap Setujui",
          cancelButtonText: "Batal",
          confirmButtonColor: "#0284c7",
        });

        if (backorderResult.isConfirmed) {
          handleUpdateStatus(id, status, true);
        }
      } else {
        console.error("Error updating status:", error);
        Swal.fire("Error", errorMessage || "Gagal mengubah status", "error");
      }
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId) {
      Swal.fire("Error", "Silakan pilih Pelanggan/Pemasok.", "error");
      return;
    }
    if (!selectedRefId) {
      Swal.fire("Error", "Silakan pilih referensi transaksi (SO/PO).", "error");
      return;
    }
    if (items.length === 0) {
      Swal.fire("Error", "Silakan tambah minimal satu item barang.", "error");
      return;
    }
    if (items.some((item) => !item.product_id || item.quantity <= 0)) {
      Swal.fire(
        "Error",
        "Silakan isi produk dan kuantitas dengan benar.",
        "error",
      );
      return;
    }

    const payload: CreateReturnDto = {
      type,
      customer_id: type === "customer" ? selectedPartnerId : null,
      supplier_id: type === "supplier" ? selectedPartnerId : null,
      sales_order_id: type === "customer" ? selectedRefId : null,
      purchase_order_id: type === "supplier" ? selectedRefId : null,
      reason,
      action: type === "customer" ? action : undefined,
      qc_status: "pending_qc",
      items: items.map((i) => ({
        product_id: i.product_id,
        quantity: Number(i.quantity),
        notes: i.notes || undefined,
      })),
    };

    try {
      await purchasingApi.createReturn(payload);
      Swal.fire("Sukses", "Transaksi retur berhasil dibuat.", "success");
      onTriggerNotification(`Retur barang baru berhasil dibuat.`);
      setShowCreateModal(false);
      resetForm();
      fetchReturns();
    } catch (error) {
      console.error("Error creating return:", error);
      Swal.fire(
        "Gagal",
        "Terjadi kesalahan saat menyimpan transaksi retur.",
        "error",
      );
    }
  };

  const resetForm = () => {
    setSelectedPartnerId("");
    setSelectedRefId("");
    setReason("");
    setAction("refund");
    setItems([]);
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { product_id: "", productName: "", quantity: 1, notes: "" }]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof ReturnFormItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      if (field === "quantity") {
        const max = updated[idx].max_qty;
        if (max !== undefined && value > max) {
          value = max;
        }
      }
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  // Filter & Search
  const activeSalesOrders = React.useMemo(() => {
    return salesOrders.filter(so => so.status === 'Disetujui' || so.status === 'Selesai');
  }, [salesOrders]);

  const activePurchaseOrders = React.useMemo(() => {
    return purchaseOrders.filter(po => po.status === 'Dikirim' || po.status === 'Selesai' || po.status === 'Disetujui');
  }, [purchaseOrders]);

  const filteredReturns = returns.filter((ret) => {
    const matchesSearch =
      ret.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || ret.type === filterType;

    return matchesSearch && matchesType;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReturns = filteredReturns.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

  const getQcStatusLabel = (status: string) => {
    switch (status) {
      case "pending_qc":
        return "Menunggu QC";
      case "approved":
        return "Disetujui";
      case "rejected":
        return "Ditolak";
      case "supplier_claim":
        return "Klaim Supplier";
      default:
        return status;
    }
  };

  const getQcStatusTone = (status: string): "amber" | "emerald" | "rose" | "sky" | "slate" => {
    switch (status) {
      case "pending_qc":
        return "amber";
      case "approved":
        return "emerald";
      case "rejected":
        return "rose";
      case "supplier_claim":
        return "sky";
      default:
        return "slate";
    }
  };

  return (
    <div className="space-y-5 text-xs font-sans">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-sky-50 text-sky-600 border border-sky-100 rounded-xl">
            <RotateCcw size={22} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">
              {defaultType === 'customer' 
                ? "Retur Penjualan (Customer)" 
                : defaultType === 'supplier' 
                ? "Retur Pembelian (Supplier)" 
                : "Retur Barang & Pengembalian Dana"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {defaultType === 'customer' 
                ? "Pusat pencatatan retur barang masuk dan klaim dari pelanggan" 
                : defaultType === 'supplier' 
                ? "Pusat pengembalian klaim barang cacat/rusak ke pemasok" 
                : "Pencatatan retur barang dari pelanggan dan pengembalian klaim ke pemasok"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchReturns}
            className="btn btn-secondary btn-md flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            <span>Segarkan</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="btn btn-primary btn-md flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Buat Retur Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari No Retur, Partner, atau Alasan..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs bg-white transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          {!defaultType && (
            <div className="flex items-center gap-1.5 bg-slate-50/80 p-1 rounded-xl border border-slate-200/80">
              {[
                ["all", "Semua Retur"],
                ["customer", "Retur Pelanggan"],
                ["supplier", "Retur Pemasok"],
              ].map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterType === t
                      ? "bg-white text-sky-700 shadow-2xs font-bold border border-slate-200/60"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="animate-spin text-slate-400" size={24} />
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <AlertTriangle size={24} className="mx-auto mb-2 text-slate-300" />
            <p>Tidak ditemukan data transaksi retur.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-187.5">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] uppercase tracking-wider font-mono text-slate-500">
                    <th className="p-3.5 pl-5">No Retur</th>
                    <th className="p-3.5">Jenis</th>
                    <th className="p-3.5">Nama Partner</th>
                    <th className="p-3.5">Referensi SO/PO</th>
                    <th className="p-3.5">Alasan Retur</th>
                    <th className="p-3.5">Status QC</th>
                    <th className="p-3.5">Tanggal</th>
                    <th className="p-3.5 pr-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedReturns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-sky-50/20 transition-colors">
                      <td className="p-3.5 pl-5 font-mono text-sky-700 font-bold">
                        {ret.returnNumber}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border ${
                            ret.type === "customer"
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          {ret.type === "customer" ? "Customer" : "Supplier"}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">
                        {ret.partnerName}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 font-medium">
                        {ret.referenceNumber}
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">
                        {ret.reason}
                      </td>
                      <td className="p-3.5">
                        <StatusPill tone={getQcStatusTone(ret.qcStatus)}>
                          {getQcStatusLabel(ret.qcStatus)}
                        </StatusPill>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {ret.createdAt}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          onClick={() => setSelectedReturn(ret)}
                          className="btn btn-secondary btn-sm ml-auto flex items-center gap-1.5"
                        >
                          <Eye size={13} />
                          <span>QC Detail</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-slate-200/80">
                <div className="text-[11px] text-slate-400 font-mono">
                  Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredReturns.length)} dari {filteredReturns.length} data
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
          </>
        )}
      </div>

      {/* Modal: View & QC Details */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-600 border border-sky-100 rounded-lg">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Transaksi Retur {selectedReturn.returnNumber}
                  </h4>
                  <p className="text-[11px] text-slate-500">Detail pemeriksaan kualitas dan status klaim retur</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Partner Details info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                    Jenis Retur
                  </span>
                  <span className="font-semibold text-slate-700 capitalize">
                    {selectedReturn.type === 'customer' ? 'Retur Pelanggan' : 'Retur Pemasok'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                    Pelanggan / Pemasok
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedReturn.partnerName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                    Referensi Transaksi
                  </span>
                  <span className="font-mono text-sky-700 font-bold">
                    {selectedReturn.referenceNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                    Alasan Retur
                  </span>
                  <span className="font-medium text-slate-600">
                    {selectedReturn.reason}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                    Tindakan Penyelesaian
                  </span>
                  <span className="font-medium text-slate-700">
                    {selectedReturn.action === 'refund' ? 'Refund / Potong Tagihan' : 'Ganti Barang (Replacement)'}
                  </span>
                </div>
              </div>

              {/* Items list */}
              <div className="space-y-2">
                {selectedReturn.overpaymentAmount && selectedReturn.overpaymentAmount > 0 && selectedReturn.qcStatus === 'approved' && selectedReturn.action !== 'replace' && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
                    <div>
                      Terdapat kelebihan bayar sebesar <strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(selectedReturn.overpaymentAmount)}</strong> pada tagihan ini.
                    </div>
                    <button
                      onClick={() => setShowRefundModal(true)}
                      className="btn btn-sm btn-primary"
                    >
                      Proses Refund
                    </button>
                  </div>
                )}
                <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Item Barang Retur
                </h5>
                <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] uppercase font-mono text-slate-500">
                        <th className="p-3 pl-4">Barang / SKU</th>
                        <th className="p-3">Kuantitas</th>
                        <th className="p-3 pr-4">Catatan Item</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedReturn.items && selectedReturn.items.length > 0 ? (
                        selectedReturn.items.map((item) => {
                          const matched = products.find(p => p.id === item.productId || (item.productId && p.id.toLowerCase() === item.productId.toLowerCase()));
                          const pName = (item.productName && item.productName !== 'Produk Tidak Dikenal')
                            ? item.productName
                            : matched?.name || 'Material / Produk';
                          const pSku = (item.productSku && item.productSku !== '-') ? item.productSku : matched?.sku || '-';
                          return (
                            <tr key={item.id} className="text-slate-600 hover:bg-slate-50/30">
                              <td className="p-3 pl-4">
                                <span className="font-semibold text-slate-800 block text-xs">
                                  {pName}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {pSku}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-800 text-xs">
                                {item.quantity} pcs
                              </td>
                              <td className="p-3 pr-4 text-slate-500 text-xs">
                                {item.notes || '-'}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={3}
                            className="p-6 text-center text-slate-400"
                          >
                            Tidak ada item terdaftar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* QC Actions footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">
                  Status QC:
                </span>
                <StatusPill tone={getQcStatusTone(selectedReturn.qcStatus)}>
                  {getQcStatusLabel(selectedReturn.qcStatus)}
                </StatusPill>
              </div>

              {selectedReturn.qcStatus === "pending_qc" ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedReturn.id, "rejected")
                    }
                    className="btn btn-sm btn-danger flex items-center gap-1.5"
                  >
                    <XCircle size={14} />
                    <span>Tolak Retur</span>
                  </button>

                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedReturn.id, "supplier_claim")
                    }
                    className="btn btn-sm btn-secondary flex items-center gap-1.5"
                  >
                    <Truck size={14} />
                    <span>Klaim Supplier</span>
                  </button>

                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedReturn.id, "approved")
                    }
                    className="btn btn-sm btn-success flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    <span>Setujui & Restock</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedReturn(null)}
                  className="btn btn-secondary btn-md"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Refund Return */}
      {showRefundModal && selectedReturn && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Proses Pengembalian Dana (Refund)
              </h4>
              <button
                onClick={() => setShowRefundModal(false)}
                className="p-1 hover:bg-slate-200/70 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs">
                Terdapat kelebihan bayar sebesar <strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(selectedReturn.overpaymentAmount || 0)}</strong>. Silakan pilih kas atau bank asal untuk melakukan pengembalian dana.
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block text-xs">Pilih Kas / Bank *</label>
                <select
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-xs font-medium"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                >
                  <option value="">-- Pilih Akun --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} - {acc.code}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowRefundModal(false)}
                className="btn btn-secondary btn-md"
              >
                Batal
              </button>
              <button
                disabled={!selectedAccountId || isSubmittingRefund}
                onClick={handleRefund}
                className="btn btn-sm btn-danger min-w-30"
              >
                {isSubmittingRefund ? "Memproses..." : "Refund Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Return */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-600 border border-sky-100 rounded-lg">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Buat Transaksi Retur Baru
                  </h4>
                  <p className="text-[11px] text-slate-500">Pencatatan barang retur dan alasan klaim</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block text-xs">
                    Tipe Retur *
                  </label>
                  <select
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white disabled:bg-slate-50 disabled:text-slate-500 text-xs font-medium"
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value as any);
                      resetForm();
                    }}
                    disabled={!!defaultType}
                    required
                  >
                    <option value="customer">
                      Retur Masuk dari Pelanggan (Customer)
                    </option>
                    <option value="supplier">
                      Retur Keluar ke Pemasok (Supplier)
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block text-xs">
                    {type === "customer"
                      ? "Pilih Transaksi / Sales Order (SO) *"
                      : "Pilih Transaksi / Purchase Order (PO) *"}
                  </label>
                  <SearchableSelect
                    value={selectedRefId}
                    onChange={(val) => {
                      setSelectedRefId(val);
                      if (type === "customer") {
                        const so = salesOrders.find(s => s.id === val);
                        if (so) {
                          setSelectedPartnerId(so.customerId || "");
                          if (so.items) {
                            setItems(
                              so.items.map((i) => {
                                const prod = products.find(p => p.id === i.productId || (i.productId && p.id.toLowerCase() === i.productId.toLowerCase()));
                                const pName = i.productName || prod?.name || i.product?.name || (i as any).description || 'Material / Produk';
                                return {
                                  product_id: i.productId,
                                  productName: pName,
                                  quantity: i.quantity,
                                  notes: "",
                                  max_qty: i.quantity,
                                };
                              })
                            );
                          } else {
                            setItems([]);
                          }
                        }
                      } else {
                        const po = purchaseOrders.find(p => p.id === val);
                        if (po) {
                          setSelectedPartnerId(po.supplierId);
                          if (po.items) {
                            setItems(
                              po.items.map((i) => {
                                const prod = products.find(p => p.id === i.productId || (i.productId && p.id.toLowerCase() === i.productId.toLowerCase()));
                                const pName = i.productName || prod?.name || (i as any).description || 'Material / Produk';
                                return {
                                  product_id: i.productId || "",
                                  productName: pName,
                                  quantity: i.quantity,
                                  notes: "",
                                  max_qty: i.quantity,
                                };
                              })
                            );
                          } else {
                            setItems([]);
                          }
                        }
                      }
                    }}
                    placeholder={type === "customer" ? "-- Cari Nomor SO --" : "-- Cari Nomor PO --"}
                    options={type === "customer"
                      ? activeSalesOrders.map((so) => ({ value: so.id, label: `${so.orderNumber} - ${so.customerName || 'Pelanggan'}` }))
                      : activePurchaseOrders.map((po) => ({ value: po.id, label: `${po.poNumber} - ${po.supplierName}` }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block text-xs">
                    Alasan Pengajuan Retur *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Barang cacat, patah saat bongkar, salah ukuran..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs bg-white"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                {type === "customer" && (
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block text-xs">
                      Tindakan Penyelesaian
                    </label>
                    <select
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-xs font-medium"
                      value={action}
                      onChange={(e) => setAction(e.target.value as any)}
                    >
                      <option value="refund">Refund / Potong Tagihan</option>
                      <option value="replace">Ganti Barang (Replacement)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Items Section */}
              <div className="space-y-2.5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Item Barang Retur
                  </h5>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="btn btn-secondary btn-sm text-sky-700 hover:text-sky-800 flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>Tambah Item</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2.5 items-center bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80"
                    >
                      <div className="flex-1">
                        <ProductPicker
                          value={item.product_id}
                          selectedProductName={item.productName}
                          onChange={(prod) => {
                            handleItemChange(idx, "product_id", prod.id);
                            handleItemChange(idx, "productName", prod.name);
                          }}
                          placeholder="Pilih Produk..."
                        />
                      </div>

                      <div className="w-24 shrink-0">
                        <input
                          type="number"
                          min={1}
                          max={item.max_qty}
                          className="w-full p-2 border border-slate-200 rounded-xl text-center text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white font-mono font-bold"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              idx,
                              "quantity",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          required
                        />
                        {item.max_qty !== undefined && (
                          <div className="text-[10px] text-slate-400 mt-0.5 text-center font-mono">Max: {item.max_qty}</div>
                        )}
                      </div>

                      <div className="flex-1">
                        <input
                          type="text"
                          className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
                          placeholder="Catatan kerusakan..."
                          value={item.notes}
                          onChange={(e) =>
                            handleItemChange(idx, "notes", e.target.value)
                          }
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                        title="Hapus baris"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}

                  {items.length === 0 && (
                    <p className="text-center text-slate-400 py-6 text-xs">
                      Belum ada item ditambahkan. Pilih referensi SO/PO atau klik "Tambah Item".
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary btn-md"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-md"
                >
                  Simpan Transaksi Retur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
