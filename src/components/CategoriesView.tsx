/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  FolderTree,
  Sparkles,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
} from "@/src/components/icons";
import { Product, Category } from "../types";
import { productsApi } from "../features/products/api";

interface CategoriesViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function CategoriesView({
  onTriggerNotification,
}: CategoriesViewProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"Aktif" | "Nonaktif">("Aktif");

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([productsApi.getCategories(), productsApi.getProducts()])
      .then(([catsData, productsData]) => {
        setCategories(catsData);
        setProducts(productsData);
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
    setDescription("");
    setStatus("Aktif");
  };

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    const categoryStatus = String((cat as { status?: string }).status || "");

    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    setStatus(
      categoryStatus === "active" || categoryStatus === "Aktif"
        ? "Aktif"
        : "Nonaktif",
    );
    setShowAddModal(true);
  };

  const handleDelete = async (id: string, catName: string) => {
    if (
      !window.confirm(`Apakah Anda yakin ingin menghapus kategori ${catName}?`)
    )
      return;

    onTriggerNotification(`Menghapus kategori ${catName}...`);
    try {
      await productsApi.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      onTriggerNotification(`Sukses menghapus kategori: ${catName}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal menghapus kategori dari backend.";
      onTriggerNotification(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      onTriggerNotification("Gagal menyimpan: Harap isi Nama Kategori!");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const updated = await productsApi.updateCategory(editingCategory.id, {
          name,
          description,
          status: status === "Aktif" ? "active" : "inactive",
        });
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? updated : c)),
        );
        onTriggerNotification(`Sukses memperbarui Kategori: ${updated.name}`);
      } else {
        const created = await productsApi.createCategory({
          name,
          description,
          status: status === "Aktif" ? "active" : "inactive",
        });
        setCategories((prev) => [...prev, created]);
        onTriggerNotification(`Sukses menambahkan Kategori: ${created.name}`);
      }
      resetForm();
      setShowAddModal(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal menyimpan kategori ke backend.";
      onTriggerNotification(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Banner introduction */}
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex items-center justify-between">
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-slate-800">
            Manajemen Partisi & Klasifikasi Produk
          </h2>
          <p className="text-xs text-slate-500 max-w-xl">
            CV Beton Agung mengelompokkan katalog produk ke dalam lini utama
            produksi guna menstandardisasi proses precast cetakan beton,
            penentuan harga borongan, dan pemantauan material logistik.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Plus size={15} />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {/* Grid of categories cards */}
      {isLoading && (
        <p className="text-sm text-slate-500">
          Memuat kategori dari backend...
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat, idx) => {
          const IconComponent = (cat as any).icon || FolderTree;
          // Count active products in this category
          const productCount = products.filter(
            (p) => p.category === cat.name,
          ).length;

          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5">
                {/* Header card info */}
                <div className="flex items-start justify-between">
                  <div
                    className={`p-2.5 rounded-lg bg-gradient-to-br ${(cat as any).color || "from-slate-500 to-slate-650"} text-white shadow`}
                  >
                    <IconComponent size={20} />
                  </div>
                  <span className="text-[10px] font-mono tracking-wider font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                    {(cat as any).tag || "Kategori Baru"}
                  </span>
                </div>

                {/* Info Text */}
                <h3 className="font-sans font-bold text-sm text-slate-800 mt-4">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              {/* Stats & Actions row */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-200/50 px-2 py-0.5 rounded">
                  {productCount} SKU Terdaftar
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(cat)}
                    className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded transition-colors"
                    title="Edit Kategori"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Hapus Kategori"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderTree size={18} className="text-cyan-400" />
                <h3 className="font-sans font-bold text-sm">
                  {editingCategory
                    ? "Edit Kategori Produk"
                    : "Tambah Kategori Produk"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCategory(null);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kubah Masjid"
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Deskripsi
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ringkasan lini produk dan penggunaan kategori."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "Aktif" | "Nonaktif")
                  }
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30 font-medium"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCategory(null);
                    resetForm();
                  }}
                  className="px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  <Save size={13} />
                  <span>
                    {isSubmitting
                      ? "Menyimpan..."
                      : editingCategory
                        ? "Simpan Perubahan"
                        : "Simpan Kategori"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
