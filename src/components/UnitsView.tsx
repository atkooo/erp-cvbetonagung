/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Edit, Plus, Save, Tag, Trash2, X } from "@/src/components/icons";
import { productsApi } from "../features/products/api";
import type { UnitDto } from "../features/products/types";
import Swal from "sweetalert2";

interface UnitsViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function UnitsView({ onTriggerNotification }: UnitsViewProps) {
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitDto | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const fetchUnits = () => {
    setIsLoading(true);
    productsApi
      .getUnits()
      .then(setUnits)
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : "Gagal memuat master satuan.";
        onTriggerNotification(message);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const resetForm = () => {
    setCode("");
    setName("");
  };

  const openAddModal = () => {
    setEditingUnit(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (unit: UnitDto) => {
    setEditingUnit(unit);
    setCode(unit.code);
    setName(unit.name);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUnit(null);
    resetForm();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedCode = code.trim().toLowerCase();
    const normalizedName = name.trim();

    if (!normalizedCode || !normalizedName) {
      onTriggerNotification("Gagal menyimpan: kode dan nama satuan wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUnit) {
        const updated = await productsApi.updateUnit(editingUnit.id, {
          code: normalizedCode,
          name: normalizedName,
        });
        setUnits((prev) =>
          prev.map((unit) => (unit.id === editingUnit.id ? updated : unit)),
        );
        onTriggerNotification(`Sukses memperbarui satuan: ${updated.name}`);
      } else {
        const created = await productsApi.createUnit({
          code: normalizedCode,
          name: normalizedName,
        });
        setUnits((prev) => [...prev, created]);
        onTriggerNotification(`Sukses menambahkan satuan: ${created.name}`);
      }

      closeModal();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menyimpan satuan.";
      onTriggerNotification(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (unit: UnitDto) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Menghapus satuan ${unit.name} (${unit.code}) tidak dapat dibatalkan!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      await productsApi.deleteUnit(unit.id);
      setUnits((prev) => prev.filter((item) => item.id !== unit.id));
      Swal.fire({
        title: 'Terhapus!',
        text: `Satuan ${unit.name} berhasil dihapus.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menghapus satuan.";
      Swal.fire({
        title: 'Gagal!',
        text: message,
        icon: 'error'
      });
      onTriggerNotification(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex items-center justify-between">
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-slate-800">
            Master Satuan Produk
          </h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Kelola satuan stok dan transaksi produk seperti pcs, sak, kg, m3,
            lembar, atau batch.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Plus size={15} />
          <span>Tambah Satuan</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-3.5 text-left">Kode</th>
              <th className="p-3.5 text-left">Nama Satuan</th>
              <th className="p-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-400">
                  Memuat master satuan...
                </td>
              </tr>
            ) : units.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-400">
                  Belum ada satuan. Tambahkan satuan pertama untuk produk.
                </td>
              </tr>
            ) : (
              units.map((unit) => (
                <tr key={unit.id} className="hover:bg-slate-50/60">
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-slate-700 font-mono font-bold">
                      <Tag size={11} />
                      {unit.code}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-800">
                    {unit.name}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(unit)}
                        className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded transition-colors"
                        title="Edit Satuan"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(unit)}
                        className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Hapus Satuan"
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

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-cyan-400" />
                <h3 className="font-sans font-bold text-sm">
                  {editingUnit ? "Edit Satuan" : "Tambah Satuan"}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Kode Satuan
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Contoh: pcs"
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs placeholder:text-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Nama Satuan
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Contoh: Pieces"
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
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
