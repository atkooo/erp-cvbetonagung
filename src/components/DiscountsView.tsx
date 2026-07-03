import React, { useState, useEffect } from "react";
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
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

  const fetchData = () => {
    setIsLoading(true);
    discountsApi.getDiscounts()
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
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
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
        const updated = await discountsApi.updateDiscount(editingDiscount.id, payload);
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
      onTriggerNotification(err.message || "Terjadi kesalahan saat menyimpan diskon");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Master Diskon</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data master diskon
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Diskon</span>
        </button>
      </div>

      <div className="card p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50/80 border-b border-slate-200 uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Nama Diskon</th>
                <th className="px-6 py-4 font-medium">Tipe</th>
                <th className="px-6 py-4 font-medium">Nilai</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FolderTree className="w-12 h-12 text-slate-300 mb-3" />
                      <p>Belum ada diskon yang ditambahkan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                discounts.map((discount) => (
                  <tr
                    key={discount.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {discount.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {discount.type === "percentage" ? "Persentase" : "Nominal"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {discount.type === "percentage" ? `${discount.value}%` : `Rp ${discount.value.toLocaleString('id-ID')}`}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          discount.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {discount.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(discount)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(discount.id, discount.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingDiscount ? "Edit Diskon" : "Tambah Diskon"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Diskon <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Contoh: Diskon Grosir"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tipe Diskon <span className="text-rose-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "percentage" | "nominal")}
                  className="input-field"
                >
                  <option value="percentage">Persentase (%)</option>
                  <option value="nominal">Nominal (Rp)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nilai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="input-field"
                  placeholder="Masukkan nilai"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={isActive ? "true" : "false"}
                  onChange={(e) => setIsActive(e.target.value === "true")}
                  className="input-field"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? "Menyimpan..." : "Simpan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
