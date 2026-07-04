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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-50 rounded-xl text-cyan-600">
              <Tag className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Master Diskon
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 ml-1">
            Kelola data dan pengaturan diskon harga produk
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto px-4 py-2.5 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Diskon</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Diskon
            </p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">
              {totalDiscounts}
            </h3>
          </div>
        </div>

        {/* Card 2: Active */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Diskon Aktif
            </p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">
              {activeDiscounts}
            </h3>
          </div>
        </div>

        {/* Card 3: Percentage Type */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tipe Persen
            </p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">
              {percentageDiscounts}
            </h3>
          </div>
        </div>

        {/* Card 4: Nominal Type */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tipe Nominal
            </p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">
              {nominalDiscounts}
            </h3>
          </div>
        </div>
      </div>

      {/* Control Bar (Search & Filter) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama diskon..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-cyan-500 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all bg-slate-50/50 focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Semua Tipe</option>
            <option value="percentage">Persentase (%)</option>
            <option value="nominal">Nominal (Rp)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] font-bold text-slate-400 bg-slate-50/65 border-b border-slate-100 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nama Diskon</th>
                <th className="px-6 py-4">Tipe</th>
                <th className="px-6 py-4">Nilai</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-slate-400 font-medium mt-1">
                        Memuat data diskon...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredDiscounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-16 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <FolderTree className="w-12 h-12 text-slate-200 mb-3" />
                      <p className="text-xs font-semibold text-slate-400">
                        Tidak ada data diskon ditemukan
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Silakan tambahkan diskon baru atau sesuaikan filter
                        pencarian Anda
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
                    <td className="px-6 py-4 font-semibold text-slate-800 text-sm">
                      {discount.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold tracking-wide uppercase text-[9px] ${
                          discount.type === "percentage"
                            ? "bg-cyan-50 text-cyan-600"
                            : "bg-violet-50 text-violet-600"
                        }`}
                      >
                        {discount.type === "percentage"
                          ? "Persentase"
                          : "Nominal"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-700 text-xs">
                      {discount.type === "percentage"
                        ? `${discount.value}%`
                        : `Rp ${discount.value.toLocaleString("id-ID")}`}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                          discount.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-slate-50 text-slate-500 border-slate-100"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${discount.is_active ? "bg-emerald-500" : "bg-slate-400"}`}
                        ></span>
                        {discount.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(discount)}
                          className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(discount.id, discount.name)
                          }
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
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
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-50 text-cyan-600 rounded-lg">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  {editingDiscount ? "Ubah Data Diskon" : "Tambah Diskon Baru"}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Field: Nama */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">
                  Nama Diskon <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-cyan-500 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all bg-slate-50/30 focus:bg-white"
                  placeholder="Contoh: Diskon Karyawan, Diskon Volume"
                  required
                />
              </div>

              {/* Field: Tipe & Nilai (Side-by-side) */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Tipe */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">
                    Tipe Diskon
                  </label>
                  <select
                    value={type}
                    onChange={(e) =>
                      setType(e.target.value as "percentage" | "nominal")
                    }
                    className="w-full px-3 py-2 border border-slate-200 focus:border-cyan-500 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all bg-slate-50/30 focus:bg-white"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="nominal">Nominal (Rp)</option>
                  </select>
                </div>

                {/* Nilai */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">
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
                      className={`w-full py-2 border border-slate-200 focus:border-cyan-500 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all bg-slate-50/30 focus:bg-white ${
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
              <div className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">
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
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/20 ${
                    isActive ? "bg-cyan-500" : "bg-slate-200"
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
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold transition-colors focus:outline-none"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-500/10 hover:shadow-cyan-500/25 flex items-center gap-1.5 transition-all focus:outline-none"
                  disabled={isSubmitting}
                >
                  <Save className="w-3.5 h-3.5" />
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
