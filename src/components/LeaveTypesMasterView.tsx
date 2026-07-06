import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, FileSpreadsheet } from "@/src/components/icons";
import { LeaveType } from "../features/hrd/types";
import { hrdApi } from "../features/hrd/api";
import Swal from "sweetalert2";

interface LeaveTypesMasterViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function LeaveTypesMasterView({
  onTriggerNotification,
}: LeaveTypesMasterViewProps) {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isPaid, setIsPaid] = useState<boolean>(true);
  const [maxDays, setMaxDays] = useState<number>(0);

  const fetchData = () => {
    setIsLoading(true);
    hrdApi.getLeaveTypes()
      .then((data) => {
        setLeaveTypes(data);
      })
      .catch((err) => {
        onTriggerNotification(err.message || "Gagal memuat jenis cuti");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setCode("");
    setName("");
    setIsPaid(true);
    setMaxDays(0);
  };

  const handleOpenAddModal = () => {
    setEditingType(null);
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (type: LeaveType) => {
    setEditingType(type);
    setCode(type.code);
    setName(type.name);
    setIsPaid(type.isPaid);
    setMaxDays(type.maxDays);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string, typeName: string) => {
    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: `Menghapus jenis cuti ${typeName} tidak dapat dibatalkan!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    onTriggerNotification(`Menghapus jenis cuti ${typeName}...`);
    try {
      await hrdApi.deleteLeaveType(id);
      setLeaveTypes((prev) => prev.filter((c) => c.id !== id));

      Swal.fire({
        title: "Terhapus!",
        text: `Jenis cuti ${typeName} berhasil dihapus.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus jenis cuti dari backend.";
      Swal.fire({
        title: "Gagal!",
        text: message,
        icon: "error",
      });
      onTriggerNotification(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      onTriggerNotification("Gagal menyimpan: Harap isi Kode dan Nama Jenis Cuti!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<LeaveType> = {
        code,
        name,
        isPaid,
        maxDays,
      };

      if (editingType) {
        const updated = await hrdApi.updateLeaveType(editingType.id, payload);
        setLeaveTypes((prev) => prev.map((c) => (c.id === editingType.id ? updated : c)));
        onTriggerNotification(`Sukses memperbarui Jenis Cuti: ${updated.name}`);
      } else {
        const created = await hrdApi.createLeaveType(payload);
        setLeaveTypes((prev) => [...prev, created]);
        onTriggerNotification(`Sukses menambahkan Jenis Cuti: ${created.name}`);
      }
      resetForm();
      setShowAddModal(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan jenis cuti ke backend.";
      onTriggerNotification(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex items-center justify-between">
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-slate-800">
            Master Data Jenis Cuti
          </h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Sistem mengelola jenis-jenis cuti, batas maksimal hari cuti per tahun, dan ketentuan pemotongan gaji (Paid / Unpaid) bagi karyawan.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Plus size={15} />
          <span>Tambah Jenis Cuti</span>
        </button>
      </div>

      {isLoading && (
        <p className="text-sm text-slate-500">
          Memuat jenis cuti dari backend...
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {leaveTypes.map((type, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden flex flex-col justify-between"
          >
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-lg bg-cyan-700 text-white shadow">
                  <FileSpreadsheet size={20} />
                </div>
                <span className="text-[10px] font-mono tracking-wider font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                  {type.code}
                </span>
              </div>

              <h3 className="font-sans font-bold text-sm text-slate-800 mt-4">
                {type.name}
              </h3>
              
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Maks. Hari / Tahun</span>
                  <span className="font-bold text-slate-700">{type.maxDays === 0 ? "Tidak Dibatasi" : `${type.maxDays} Hari`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status Bayaran</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${type.isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {type.isPaid ? "Paid Leave" : "Unpaid Leave"}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-1">
              <button
                onClick={() => handleOpenEditModal(type)}
                className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded transition-colors"
                title="Edit Jenis Cuti"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => handleDelete(type.id, type.name)}
                className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                title="Hapus Jenis Cuti"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-cyan-400" />
                <h3 className="font-sans font-bold text-sm">
                  {editingType ? "Edit Jenis Cuti" : "Tambah Jenis Cuti"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingType(null);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">
                    Kode Cuti
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Contoh: CT"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">
                    Nama Jenis Cuti
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Cuti Tahunan"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Maksimal Hari / Tahun
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={maxDays}
                  onChange={(e) => setMaxDays(parseInt(e.target.value) || 0)}
                  placeholder="0 untuk tidak dibatasi"
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
                <p className="text-[10px] text-slate-500">Isi dengan 0 jika tidak ada batas cuti.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Ketentuan Bayaran (Paid Leave)
                </label>
                <select
                  value={isPaid ? "Ya" : "Tidak"}
                  onChange={(e) => setIsPaid(e.target.value === "Ya")}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30 font-medium"
                >
                  <option value="Ya">Ya (Paid Leave)</option>
                  <option value="Tidak">Tidak (Unpaid Leave)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingType(null);
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
                      : editingType
                        ? "Simpan Perubahan"
                        : "Simpan Jenis Cuti"}
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
