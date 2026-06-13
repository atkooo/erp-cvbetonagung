/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  X,
  AlertTriangle,
  Trash2,
  Clipboard,
  Edit2,
  LockKeyhole,
  DollarSign,
  ArrowRight,
} from "@/src/components/icons";
import { authStorage } from "../services/api";
import { productionApi } from "../features/production/api";
import { productsApi } from "../features/products/api";
import { Bom, BomItem, Product } from "../types";
import { ErrorCard } from "./Skeleton";
import ProductPicker from "./ProductPicker";
import Swal from "sweetalert2";

interface BomCostingViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function BomCostingView({
  onTriggerNotification,
}: BomCostingViewProps) {
  const [boms, setBoms] = useState<Bom[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<
    { id: string; name: string; code: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBomId, setSelectedBomId] = useState<string | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form States - Create BOM
  const [productId, setProductId] = useState("");
  const [version, setVersion] = useState("v1.0");
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [formItems, setFormItems] = useState<
    {
      component_product_id?: string;
      component_name?: string;
      quantity: number;
      unit_id?: string;
      unit_cost: number;
      subtotal: number;
    }[]
  >([]);

  // Temp form item fields
  const [tempIsMaterial, setTempIsMaterial] = useState(true);
  const [tempProductId, setTempProductId] = useState("");
  const [tempCustomName, setTempCustomName] = useState("");
  const [tempQty, setTempQty] = useState(1);
  const [tempUnitId, setTempUnitId] = useState("");
  const [tempUnitCost, setTempUnitCost] = useState(0);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [bomList, prodList] = await Promise.all([
        productionApi.getBoms(),
        productsApi.getProducts(),
      ]);
      setBoms(bomList);
      setProducts(prodList);

      // Fetch units
      try {
        const uList = await productsApi.getUnits();
        setUnits(uList);
      } catch {
        // fallback units
        setUnits([
          { id: "u1", name: "Pcs", code: "pcs" },
          { id: "u2", name: "Sak", code: "sak" },
          { id: "u3", name: "Meter Kubik", code: "m3" },
          { id: "u4", name: "Kilogram", code: "kg" },
          { id: "u5", name: "Lembar", code: "lembar" },
          { id: "u6", name: "Batch", code: "batch" },
        ]);
      }

      if (bomList.length > 0) {
        setSelectedBomId(bomList[0].id);
      }
    } catch (err) {
      console.error("Failed to load BOM costing data", err);
      const msg =
        err instanceof Error ? err.message : "Gagal mengambil data BOM HPP";
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
    setProductId("");
    setVersion(`v1.${boms.length + 1}`);
    setEffectiveFrom(new Date().toISOString().split("T")[0]);
    setStatus("active");
    setFormItems([]);

    // Clear temp item
    setTempIsMaterial(true);
    setTempProductId("");
    setTempCustomName("");
    setTempQty(1);
    setTempUnitId(units[0]?.id || "");
    setTempUnitCost(0);

    setIsCreateModalOpen(true);
  };

  const handleAddTempItem = () => {
    if (tempIsMaterial && !tempProductId) {
      alert("Pilih produk material dahulu.");
      return;
    }
    if (!tempIsMaterial && !tempCustomName) {
      alert("Masukkan nama komponen biaya.");
      return;
    }
    if (tempQty <= 0 || tempUnitCost < 0) {
      alert("Target Qty dan Biaya Satuan harus bernilai positif.");
      return;
    }

    const subtotal = tempQty * tempUnitCost;

    if (tempIsMaterial) {
      const prod = products.find((p) => p.id === tempProductId);
      setFormItems((prev) => [
        ...prev,
        {
          component_product_id: tempProductId,
          component_name: prod ? prod.name : "",
          quantity: tempQty,
          unit_id: tempUnitId || undefined,
          unit_cost: tempUnitCost,
          subtotal,
        },
      ]);
    } else {
      setFormItems((prev) => [
        ...prev,
        {
          component_name: tempCustomName,
          quantity: tempQty,
          unit_id: tempUnitId || undefined,
          unit_cost: tempUnitCost,
          subtotal,
        },
      ]);
    }

    // Reset temp inputs
    setTempProductId("");
    setTempCustomName("");
    setTempQty(1);
    setTempUnitCost(0);
  };

  const handleRemoveFormItem = (idx: number) => {
    setFormItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateBom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !version || formItems.length === 0) {
      onTriggerNotification("Mohon isi minimal satu item komponen BOM.");
      return;
    }

    try {
      const calculatedTotalCost = formItems.reduce(
        (sum, item) => sum + item.subtotal,
        0,
      );

      const payload = {
        product_id: productId,
        version,
        effective_from: effectiveFrom || undefined,
        status,
        items: formItems,
      };

      const created = await productionApi.createBom(payload);
      setBoms((prev) => [created, ...prev]);
      setSelectedBomId(created.id);
      onTriggerNotification(`Resep BOM versi ${version} berhasil disimpan`);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("Failed to create BOM", err);
      onTriggerNotification("Gagal membuat BOM baru.");
    }
  };

  const handleDeleteBom = async (id: string, ver: string) => {
    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: `Menghapus BOM versi ${ver} tidak dapat dibatalkan!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      await productionApi.deleteBom(id);
      setBoms((prev) => prev.filter((b) => b.id !== id));
      if (selectedBomId === id) {
        setSelectedBomId(null);
      }
      Swal.fire({
        title: "Terhapus!",
        text: `BOM versi ${ver} berhasil dihapus.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Failed to delete BOM", err);
      Swal.fire({
        title: "Gagal!",
        text: "Gagal menghapus BOM.",
        icon: "error",
      });
      onTriggerNotification("Gagal menghapus BOM.");
    }
  };

  const handleToggleStatus = async (bom: Bom) => {
    const nextStatus = bom.status === "active" ? "inactive" : "active";
    try {
      const updated = await productionApi.updateBom(bom.id, {
        product_id: bom.productId,
        version: bom.version,
        status: nextStatus,
      });
      setBoms((prev) => prev.map((b) => (b.id === bom.id ? updated : b)));
      onTriggerNotification(
        `Status BOM ${bom.version} diubah ke: ${nextStatus === "active" ? "Aktif" : "Nonaktif"}`,
      );
    } catch (err) {
      console.error("Failed to update BOM status", err);
      onTriggerNotification("Gagal memperbarui status BOM.");
    }
  };

  // Calculations & Filtering
  const selectedBom = boms.find((b) => b.id === selectedBomId);

  const filteredBoms = boms.filter(
    (b) =>
      b.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.productName &&
        b.productName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.productSku &&
        b.productSku.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const relatedProduct = products.find((p) => p.id === selectedBom?.productId);
  const sellingPrice = relatedProduct?.sellingPrice || 0;
  const totalCost = selectedBom?.totalCost || 0;
  const margin = sellingPrice - totalCost;
  const marginPercentage = sellingPrice
    ? Math.round((margin / sellingPrice) * 100)
    : 0;

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Banner */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
            <Layers size={20} />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-slate-800 flex items-center gap-2">
              Bill of Materials (BOM) & Costing
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Buat resep campuran beton (semen, pasir, wiremesh, zat aditif)
              atau upah tenaga kerja cetak untuk menghitung Harga Pokok Produksi
              (HPP) aktual.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-md flex items-center justify-center gap-2 shrink-0 transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={14} />
          <span>Buat BOM Baru</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-4 h-120 bg-slate-100 rounded-xl animate-pulse" />
            <div className="xl:col-span-8 h-120 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        </div>
      ) : errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={fetchData} />
      ) : (
        <>
          {/* KPI Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-400">
                Rencana Produk
              </span>
              <h4 className="text-base font-black text-slate-800 mt-1 truncate">
                {relatedProduct ? relatedProduct.name : "Roster Beton"}
              </h4>
              <span className="text-[9px] text-slate-400 font-mono">
                {relatedProduct ? relatedProduct.sku : "RST-001"}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-400">
                Total HPP BOM
              </span>
              <h4 className="text-base font-black text-rose-600 mt-1">
                {formatIDR(totalCost)}
              </h4>
              <span className="text-[9px] text-slate-400 font-mono">
                BOM {selectedBom ? selectedBom.version : "N/A"}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-400">
                Harga Jual Unit
              </span>
              <h4 className="text-base font-black text-slate-800 mt-1">
                {formatIDR(sellingPrice)}
              </h4>
              <span className="text-[9px] text-slate-400 font-mono">
                Tabel Master Harga Jual
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-400">
                Margin Kotor Perkiraan
              </span>
              <h4 className="text-base font-black text-emerald-600 mt-1">
                {formatIDR(margin)}
              </h4>
              <span className="text-[9px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded ml-1">
                {marginPercentage}% Margin
              </span>
            </div>
          </div>

          {/* Main Grid: BOM List & Table Detail */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left: Recipe List */}
            <div className="xl:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-120">
              <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
                <h3 className="font-bold text-slate-850 text-sm">
                  Resep BOM Aktif
                </h3>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-2.5 text-slate-400"
                    size={14}
                  />
                  <input
                    type="text"
                    placeholder="Cari versi, nama produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                {filteredBoms.map((bom) => (
                  <div
                    key={bom.id}
                    onClick={() => setSelectedBomId(bom.id)}
                    className={`p-4 cursor-pointer hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-3 ${
                      selectedBomId === bom.id
                        ? "bg-cyan-50/45 border-l-4 border-cyan-500 pl-3"
                        : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-indigo-600">
                          {bom.version}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(bom);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                            bom.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-650 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {bom.status === "active" ? "Aktif" : "Nonaktif"}
                        </button>
                      </div>
                      <h4 className="font-bold text-slate-800 mt-1">
                        {bom.productName}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                        Berlaku: {bom.effectiveFrom || "-"}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-slate-800">
                        {formatIDR(bom.totalCost)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBom(bom.id, bom.version);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded mt-1.5 inline-block"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredBoms.length === 0 && (
                  <div className="p-12 text-center text-slate-400">
                    Tidak ada resep BOM ditemukan.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Item Recipe Details */}
            <div className="xl:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-120">
              {selectedBom ? (
                <>
                  {/* Card Header details */}
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-cyan-600" />
                        <h3 className="font-bold text-slate-800">
                          Komposisi Bahan & Jasa Produksi
                        </h3>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Produk:{" "}
                        <span className="font-bold text-slate-700">
                          {selectedBom.productName}
                        </span>{" "}
                        | SKU:{" "}
                        <span className="font-mono">
                          {selectedBom.productSku}
                        </span>
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-[9px] text-slate-450 uppercase block font-bold">
                        Total HPP Terhitung
                      </span>
                      <span className="text-sm font-black text-rose-600">
                        {formatIDR(selectedBom.totalCost)}
                      </span>
                    </div>
                  </div>

                  {/* Table list */}
                  <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead className="bg-slate-50 border-b sticky top-0 z-10">
                        <tr className="font-mono text-slate-500 uppercase tracking-wider">
                          <th className="p-3 pl-5">Komponen Resep BOM</th>
                          <th className="p-3">Kebutuhan Qty</th>
                          <th className="p-3">Harga Satuan</th>
                          <th className="p-3 pr-5 text-right">Subtotal HPP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(selectedBom.items || []).map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="p-3 pl-5">
                              <div className="font-bold text-slate-800">
                                {item.componentName}
                              </div>
                              {item.componentSku && (
                                <span className="text-[8px] font-mono text-slate-400">
                                  {item.componentSku}
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-slate-700 font-medium">
                              {item.quantity} {item.unitCode}
                            </td>
                            <td className="p-3 font-mono text-slate-500">
                              {formatIDR(item.unitCost)}
                            </td>
                            <td className="p-3 pr-5 text-right font-mono font-black text-slate-800">
                              {formatIDR(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                        {(selectedBom.items || []).length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="p-12 text-center text-slate-400 italic"
                            >
                              BOM ini tidak memiliki item bahan baku.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom notice panel */}
                  <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                      <AlertTriangle
                        size={14}
                        className="text-amber-500 shrink-0"
                      />
                      <span>
                        BOM HPP memengaruhi estimasi margin laba kotor saat
                        menyusun surat penawaran (Quotation) penjualan.
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        onTriggerNotification(
                          "BOM ini telah dikunci. Buat BOM versi baru untuk mengubah resep.",
                        )
                      }
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold flex items-center gap-1 shrink-0"
                    >
                      <LockKeyhole size={11} />
                      <span>Kunci Resep</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 border-t border-slate-200 h-full flex flex-col items-center justify-center text-slate-400 italic font-sans p-12 text-center">
                  <Clipboard size={32} className="text-slate-300 mb-2" />
                  Pilih salah satu resep BOM di kiri untuk melihat komposisi
                  HPP.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal: Buat Resep BOM Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-cyan-400" />
                <h3 className="font-bold text-sm">
                  Buat Bill of Materials (BOM) & HPP
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleCreateBom}
              className="p-5 flex-1 overflow-y-auto space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Produk Akhir Beton *
                  </label>
                  <ProductPicker
                    value={productId}
                    onChange={(product) => setProductId(product.id)}
                    typeFilter="finished_good"
                    placeholder="-- Pilih Produk --"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Versi Resep *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="v1.0"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Tanggal Aktif *
                    </label>
                    <input
                      type="date"
                      required
                      value={effectiveFrom}
                      onChange={(e) => setEffectiveFrom(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Add Item Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">
                    Tambah Komponen Biaya / Material
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTempIsMaterial(true)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${tempIsMaterial ? "bg-cyan-500 text-white" : "bg-slate-200 text-slate-650"}`}
                    >
                      Bahan Baku (Stok)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempIsMaterial(false)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${!tempIsMaterial ? "bg-cyan-500 text-white" : "bg-slate-200 text-slate-650"}`}
                    >
                      Upah / Overhead
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  {tempIsMaterial ? (
                    <div className="md:col-span-4 space-y-1">
                      <label className="block font-bold text-slate-700">
                        Pilih Material *
                      </label>
                      <ProductPicker
                        value={tempProductId}
                        onChange={(product) => {
                          setTempProductId(product.id);
                          setTempUnitCost(
                            Math.round((product.sellingPrice || 0) * 0.65),
                          );
                        }}
                        typeFilter="raw_material"
                        placeholder="-- Pilih Material --"
                      />
                    </div>
                  ) : (
                    <div className="md:col-span-4 space-y-1">
                      <label className="block font-bold text-slate-700">
                        Nama Biaya / Komponen *
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Tenaga Borongan"
                        value={tempCustomName}
                        onChange={(e) => setTempCustomName(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2 space-y-1">
                    <label className="block font-bold text-slate-700">
                      Qty *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0.01}
                      value={tempQty}
                      onChange={(e) => setTempQty(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-center font-mono"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="block font-bold text-slate-700">
                      Satuan *
                    </label>
                    <select
                      value={tempUnitId}
                      onChange={(e) => setTempUnitId(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="block font-bold text-slate-700">
                      Biaya Satuan *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={tempUnitCost}
                      onChange={(e) => setTempUnitCost(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-right font-mono"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <button
                      type="button"
                      onClick={handleAddTempItem}
                      className="w-full py-1.5 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Added Items Preview */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">
                  Daftar Komponen BOM HPP
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-50 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead className="bg-slate-50 border-b">
                      <tr className="font-mono text-slate-500 uppercase">
                        <th className="p-2 pl-4">Komponen</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Biaya Satuan</th>
                        <th className="p-2 text-right">Subtotal</th>
                        <th className="p-2 text-center">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formItems.map((fi, idx) => {
                        const uCode =
                          units.find((u) => u.id === fi.unit_id)?.code || "pcs";
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2 pl-4 font-bold text-slate-700">
                              {fi.component_name}
                            </td>
                            <td className="p-2 text-right font-mono">
                              {fi.quantity} {uCode}
                            </td>
                            <td className="p-2 text-right font-mono text-slate-500">
                              {formatIDR(fi.unit_cost)}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-slate-800">
                              {formatIDR(fi.subtotal)}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveFormItem(idx)}
                                className="text-slate-400 hover:text-rose-500"
                              >
                                <X size={14} className="mx-auto" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {formItems.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-8 text-center text-slate-400 italic"
                          >
                            Belum ada resep bahan ditambahkan. Gunakan form di
                            atas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-200 font-mono text-xs">
                <span className="font-bold text-slate-650">
                  ESTIMASI TOTAL HPP:
                </span>
                <strong className="text-lg font-black text-rose-600">
                  {formatIDR(
                    formItems.reduce((sum, item) => sum + item.subtotal, 0),
                  )}
                </strong>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-md transition-all active:scale-95"
                >
                  Simpan Resep BOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
