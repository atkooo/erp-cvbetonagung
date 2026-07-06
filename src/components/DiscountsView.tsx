import React, { useState, useEffect } from "react";
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Tag,
  Percent,
  Coins,
  CheckCircle,
  Search,
  SlidersHorizontal,
} from "@/src/components/icons";
import { Discount } from "../types";
import { discountsApi } from "../features/discounts/api";
import Swal from "sweetalert2";

interface DiscountsViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function DiscountsView({
  onTriggerNotification,
}: DiscountsViewProps) {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<"percentage" | "nominal">("percentage");
  const [value, setValue] = useState("");
  const [isActive, setIsActive] = useState<boolean>(true);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "percentage" | "nominal"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const fetchData = () => {
    setIsLoading(true);
    discountsApi
      .getDiscounts()
      .then((data) => {
        setDiscounts(data);
      })
      .catch((err) => {
        onTriggerNotification(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setName("");
    setType("percentage");
    setValue("");
    setIsActive(true);
  };

  const handleOpenAddModal = () => {
    setEditingDiscount(null);
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (discount: Discount) => {
    setEditingDiscount(discount);
    setName(discount.name);
    setType(discount.type);
    setValue(discount.value.toString());
    setIsActive(discount.is_active);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string, discountName: string) => {
    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: `Menghapus diskon ${discountName} tidak dapat dibatalkan!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0ea5e9",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
      customClass: {
        popup: "rounded-xl",
        confirmButton: "px-4 py-2 text-sm rounded-lg font-medium",
        cancelButton: "px-4 py-2 text-sm rounded-lg font-medium",
      },
    });

    if (!result.isConfirmed) return;

    onTriggerNotification(`Menghapus diskon ${discountName}...`);
    try {
      await discountsApi.deleteDiscount(id);
      setDiscounts((prev) => prev.filter((d) => d.id !== id));
      onTriggerNotification(`Diskon ${discountName} berhasil dihapus.`);
    } catch (err: any) {
      onTriggerNotification(err.message || "Gagal menghapus diskon");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !value) {
      onTriggerNotification("Harap lengkapi semua field yang wajib");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        type,
        value: Number(value),
        is_active: isActive,
      };

      if (editingDiscount) {
        const updated = await discountsApi.updateDiscount(
          editingDiscount.id,
          payload,
        );
        setDiscounts((prev) =>
          prev.map((d) => (d.id === editingDiscount.id ? updated : d)),
        );
        onTriggerNotification("Diskon berhasil diubah");
      } else {
        const created = await discountsApi.createDiscount(payload);
        setDiscounts((prev) => [created, ...prev]);
        onTriggerNotification("Diskon berhasil ditambahkan");
      }
      setShowAddModal(false);
    } catch (err: any) {
      onTriggerNotification(
        err.message || "Terjadi kesalahan saat menyimpan diskon",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Card summary statistics
  const totalDiscounts = discounts.length;
  const activeDiscounts = discounts.filter((d) => d.is_active).length;
  const percentageDiscounts = discounts.filter(
    (d) => d.type === "percentage",
  ).length;
  const nominalDiscounts = discounts.filter((d) => d.type === "nominal").length;

  // Filtered discounts
  const filteredDiscounts = discounts.filter((d) => {
    const matchesSearch = d.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || d.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? d.is_active : !d.is_active);
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Banner */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-50 text-cyan-700">
            <Tag size={20} />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-slate-800 flex items-center gap-2">
              Master Diskon
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Kelola data dan pengaturan diskon harga produk
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-md flex items-center justify-center gap-2 shrink-0 transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={14} />
          <span>Tambah Diskon</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[9px] uppercase font-mono font-bold text-slate-400">
            Total Diskon
          </span>
          <h4 className="text-base font-black text-slate-800 mt-1">
            {totalDiscounts}
          </h4>
        </div>

        {/* Card 2: Active */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[9px] uppercase font-mono font-bold text-slate-400">
            Diskon Aktif
          </span>
          <h4 className="text-base font-black text-emerald-600 mt-1">
            {activeDiscounts}
          </h4>
        </div>

        {/* Card 3: Percentage Type */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[9px] uppercase font-mono font-bold text-slate-400">
            Tipe Persentase
          </span>
          <h4 className="text-base font-black text-cyan-600 mt-1">
            {percentageDiscounts}
          </h4>
        </div>

        {/* Card 4: Nominal Type */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[9px] uppercase font-mono font-bold text-slate-400">
            Tipe Nominal
          </span>
          <h4 className="text-base font-black text-violet-600 mt-1">
            {nominalDiscounts}
          </h4>
        </div>
      </div>

      {/* Control Bar (Search & Filter) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama diskon..."
            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 focus:border-cyan-400 rounded-lg text-xs focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-600 focus:outline-none focus:border-cyan-400"
          >
            <option value="all">Semua Tipe</option>
            <option value="percentage">Persentase (%)</option>
            <option value="nominal">Nominal (Rp)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-600 focus:outline-none focus:border-cyan-400"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="font-mono text-slate-500 uppercase tracking-wider">
                <th className="p-3 pl-5">Nama Diskon</th>
                <th className="p-3">Tipe</th>
                <th className="p-3">Nilai</th>
                <th className="p-3">Status</th>
                <th className="p-3 pr-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-slate-400 font-bold mt-1">
                        Memuat data diskon...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredDiscounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-16 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <FolderTree className="w-8 h-8 text-slate-300 mb-3" />
                      <p className="text-xs font-bold text-slate-400">
                        Tidak ada data diskon ditemukan
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Silakan tambahkan diskon baru atau sesuaikan filter
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDiscounts.map((discount) => (
                  <tr
                    key={discount.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-3 pl-5 font-bold text-slate-800 text-xs">
                      {discount.name}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded font-bold uppercase text-[9px] border ${
                          discount.type === "percentage"
                            ? "bg-cyan-50 text-cyan-600 border-cyan-100"
                            : "bg-violet-50 text-violet-600 border-violet-100"
                        }`}
                      >
                        {discount.type === "percentage"
                          ? "Persentase"
                          : "Nominal"}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700 text-xs">
                      {discount.type === "percentage"
                        ? `${discount.value}%`
                        : `Rp ${discount.value.toLocaleString("id-ID")}`}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold border ${
                          discount.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {discount.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="p-3 pr-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(discount)}
                          className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(discount.id, discount.name)
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-cyan-400" />
                <h3 className="font-bold text-sm">
                  {editingDiscount ? "Ubah Data Diskon" : "Tambah Diskon Baru"}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Field: Nama */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Nama Diskon <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 focus:border-cyan-400 rounded-lg focus:outline-none"
                  placeholder="Contoh: Diskon Karyawan, Diskon Volume"
                  required
                />
              </div>

              {/* Field: Tipe & Nilai (Side-by-side) */}
              <div className="grid grid-cols-2 gap-4">
                {/* Tipe */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Tipe Diskon
                  </label>
                  <select
                    value={type}
                    onChange={(e) =>
                      setType(e.target.value as "percentage" | "nominal")
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 focus:border-cyan-400 rounded-lg focus:outline-none bg-white"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="nominal">Nominal (Rp)</option>
                  </select>
                </div>

                {/* Nilai */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Nilai Diskon <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    {/* Prefix/Suffix helper */}
                    {type === "nominal" && (
                      <span className="absolute left-3 top-2 text-[10px] font-bold text-slate-400 select-none">
                        Rp
                      </span>
                    )}

                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className={`w-full py-1.5 border border-slate-200 focus:border-cyan-400 rounded-lg font-mono focus:outline-none ${
                        type === "nominal" ? "pl-8 pr-3" : "pl-3 pr-8"
                      }`}
                      placeholder={type === "percentage" ? "10" : "50000"}
                      min="0"
                      step={type === "percentage" ? "0.01" : "1"}
                      required
                    />

                    {type === "percentage" && (
                      <span className="absolute right-3 top-2 text-xs font-bold text-slate-400 select-none">
                        %
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Field: Status Aktif */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 mt-2">
                <div>
                  <label className="block font-bold text-slate-700">
                    Status Aktif
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Tentukan apakah diskon ini langsung aktif atau di-hold
                  </span>
                </div>

                {/* Custom Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                    isActive ? "bg-cyan-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                      isActive ? "translate-x-5.5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Modal Footer / Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg font-bold transition-all"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-md flex items-center gap-2 transition-all active:scale-95"
                  disabled={isSubmitting}
                >
                  <Save size={14} />
                  <span>{isSubmitting ? "Menyimpan..." : "Simpan Diskon"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
