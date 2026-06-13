/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  UserCog,
  Plus,
  Search,
  Trash2,
  Edit,
  X,
  Save,
  AlertCircle,
} from "@/src/components/icons";
import { authStorage } from "../services/api";
import { employeesApi } from "../features/employees/api";
import { Employee } from "../types";
import { SkeletonCard, SkeletonTable, ErrorCard } from "./Skeleton";
import Swal from "sweetalert2";

interface EmployeeMasterViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function EmployeeMasterView({
  onTriggerNotification,
}: EmployeeMasterViewProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [name, setName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [department, setDepartment] = useState("");
  const [employeeType, setEmployeeType] = useState<
    "Tetap" | "Kontrak" | "Borongan" | "Harian"
  >("Harian");
  const [dailyRate, setDailyRate] = useState(0);
  const [pieceRate, setPieceRate] = useState(0);
  const [status, setStatus] = useState<"Aktif" | "Nonaktif">("Aktif");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [joinDate, setJoinDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // HRD fields
  const [gender, setGender] = useState("Laki-laki");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("Lajang");
  const [religion, setReligion] = useState("Islam");
  const [bloodType, setBloodType] = useState("-");
  const [idCardNumber, setIdCardNumber] = useState("");
  const [taxIdNumber, setTaxIdNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  // UI State
  const [activeTab, setActiveTab] = useState<"utama" | "pribadi" | "bank">(
    "utama",
  );

  const fetchEmployees = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await employeesApi.getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error("Failed to load employees", err);
      const msg =
        err instanceof Error ? err.message : "Gagal mengambil data karyawan.";
      setErrorMessage(msg);
      onTriggerNotification(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setEmployeeNumber(`EMP00${employees.length + 1}`);
    setName("");
    setRoleName("");
    setDepartment("");
    setEmployeeType("Harian");
    setDailyRate(0);
    setPieceRate(0);
    setStatus("Aktif");
    setAddress("");
    setPhone("");
    setJoinDate(new Date().toISOString().split("T")[0]);
    setGender("Laki-laki");
    setPlaceOfBirth("");
    setDateOfBirth("");
    setMaritalStatus("Lajang");
    setReligion("Islam");
    setBloodType("-");
    setIdCardNumber("");
    setTaxIdNumber("");
    setBankName("");
    setBankAccount("");
    setActiveTab("utama");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmployeeNumber(emp.employeeNumber);
    setName(emp.name);
    setRoleName(emp.roleName);
    setDepartment(emp.department);
    setEmployeeType(emp.employeeType);
    setDailyRate(emp.dailyRate);
    setPieceRate(emp.pieceRate);
    setStatus(emp.status);
    setAddress(emp.address || "");
    setPhone(emp.phone || "");
    setJoinDate(emp.joinDate || "");
    setGender(emp.gender || "Laki-laki");
    setPlaceOfBirth(emp.placeOfBirth || "");
    setDateOfBirth(emp.dateOfBirth || "");
    setMaritalStatus(emp.maritalStatus || "Lajang");
    setReligion(emp.religion || "Islam");
    setBloodType(emp.bloodType || "-");
    setIdCardNumber(emp.idCardNumber || "");
    setTaxIdNumber(emp.taxIdNumber || "");
    setBankName(emp.bankName || "");
    setBankAccount(emp.bankAccount || "");
    setActiveTab("utama");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !employeeNumber || !roleName || !department) {
      onTriggerNotification("Lengkapi formulir data wajib!");
      return;
    }

    const payload: Omit<Employee, "id"> = {
      employeeNumber,
      name,
      roleName,
      department,
      employeeType,
      dailyRate: Number(dailyRate),
      pieceRate: Number(pieceRate),
      status,
      address,
      phone,
      joinDate,
      gender,
      placeOfBirth,
      dateOfBirth,
      maritalStatus,
      religion,
      bloodType,
      idCardNumber,
      taxIdNumber,
      bankName,
      bankAccount,
    };

    try {
      if (editingEmployee) {
        const updated = await employeesApi.updateEmployee(
          editingEmployee.id,
          payload,
        );
        setEmployees((prev) =>
          prev.map((item) => (item.id === editingEmployee.id ? updated : item)),
        );
        onTriggerNotification(`Berhasil memperbarui data karyawan ${name}`);
      } else {
        const created = await employeesApi.createEmployee(payload);
        setEmployees((prev) => [created, ...prev]);
        onTriggerNotification(`Karyawan baru ${name} ditambahkan`);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save employee", err);
      onTriggerNotification("Gagal menyimpan data karyawan.");
    }
  };

  const handleDelete = async (id: string, empName: string) => {
    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: `Menghapus data karyawan ${empName} tidak dapat dibatalkan!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      await employeesApi.deleteEmployee(id);
      setEmployees((prev) => prev.filter((item) => item.id !== id));
      Swal.fire({
        title: "Terhapus!",
        text: `Data karyawan ${empName} berhasil dihapus.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Failed to delete employee", err);
      Swal.fire({
        title: "Gagal!",
        text: "Gagal menghapus data karyawan.",
        icon: "error",
      });
      onTriggerNotification("Gagal menghapus data karyawan.");
    }
  };

  // Calculations for KPI Cards
  const totalEmployees = employees.length;
  const activeCount = employees.filter((e) => e.status === "Aktif").length;
  const workshopCount = employees.filter(
    (e) => e.department.toLowerCase() === "workshop",
  ).length;
  const boronganCount = employees.filter(
    (e) => e.employeeType === "Borongan",
  ).length;

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.roleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              MODUL ADMINISTRASI SDM
            </span>
            <h1 className="font-sans font-black tracking-tight text-xl mt-3 text-slate-800 flex items-center gap-2">
              Master Data Karyawan & Tukang
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
              Manajemen komprehensif data staf internal, supir logistik, tenaga
              harian, serta tim borongan workshop cetakan beton.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus size={14} />
            <span>Tambah Karyawan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <SkeletonCard count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                Total Anggota Tim
              </span>
              <h4 className="text-lg font-black text-slate-800 mt-1">
                {totalEmployees} Orang
              </h4>
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-500 rounded-lg">
              <UserCog size={18} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                Status Aktif
              </span>
              <h4 className="text-lg font-black text-emerald-650 text-emerald-600 mt-1">
                {activeCount} Orang
              </h4>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <UserCog size={18} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                Tim Workshop Cetak
              </span>
              <h4 className="text-lg font-black text-indigo-600 mt-1">
                {workshopCount} Orang
              </h4>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <UserCog size={18} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                Tenaga Borongan
              </span>
              <h4 className="text-lg font-black text-amber-600 mt-1">
                {boronganCount} Orang
              </h4>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <UserCog size={18} />
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <SkeletonTable rows={5} cols={10} />
      ) : errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={fetchEmployees} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Search Filter Panel */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-3 top-2.5 text-slate-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Cari nama, kode, jabatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Menampilkan {filteredEmployees.length} dari {totalEmployees} entri
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-225">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                  <th className="p-3.5 pl-5">Kode Karyawan</th>
                  <th className="p-3.5">Nama</th>
                  <th className="p-3.5">Jabatan & Divisi</th>
                  <th className="p-3.5">Tipe Kontrak</th>
                  <th className="p-3.5">Tarif Harian</th>
                  <th className="p-3.5">Tarif Borongan</th>
                  <th className="p-3.5">No. Telepon</th>
                  <th className="p-3.5">Tanggal Gabung</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-3.5 pl-5 font-mono font-bold text-indigo-650 text-indigo-600">
                      {emp.employeeNumber}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {emp.name}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-700">
                        {emp.roleName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {emp.department}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          emp.employeeType === "Borongan"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : emp.employeeType === "Harian"
                              ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                              : emp.employeeType === "Tetap"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {emp.employeeType}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {emp.dailyRate > 0 ? formatIDR(emp.dailyRate) : "-"}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {emp.pieceRate > 0
                        ? `${formatIDR(emp.pieceRate)} /pcs`
                        : "-"}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono">
                      {emp.phone || "-"}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono">
                      {emp.joinDate || "-"}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          emp.status === "Aktif"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(emp)}
                          className="p-1 hover:bg-slate-100 border text-slate-500 hover:text-slate-800 rounded transition-all"
                          title="Edit"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, emp.name)}
                          className="p-1 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 text-slate-400 hover:text-rose-600 rounded transition-all"
                          title="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="p-8 text-center text-slate-400 font-medium"
                    >
                      Tidak ada data karyawan yang cocok dengan kriteria
                      pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dialog Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCog size={16} className="text-indigo-400" />
                <h3 className="font-bold text-sm">
                  {editingEmployee
                    ? "Edit Data Karyawan"
                    : "Tambah Karyawan Baru"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} className="flex flex-col h-[70vh]">
              {/* Tabs */}
              <div className="flex border-b border-slate-200 px-5 pt-3 gap-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("utama")}
                  className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === "utama" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                >
                  Data Utama
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("pribadi")}
                  className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === "pribadi" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                >
                  Data Pribadi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("bank")}
                  className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === "bank" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                >
                  Informasi Bank & NIK
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {activeTab === "utama" && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">
                          Kode Karyawan *
                        </label>
                        <input
                          type="text"
                          required
                          value={employeeNumber}
                          onChange={(e) => setEmployeeNumber(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-650 text-slate-700">
                          Nama Lengkap *
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-650 text-slate-700">
                          Jabatan Pekerjaan *
                        </label>
                        <select
                          required
                          value={roleName}
                          onChange={(e) => setRoleName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-400"
                        >
                          <option value="">-- Pilih Jabatan --</option>
                          <option value="Tukang Cetak">Tukang Cetak</option>
                          <option value="Tukang Besi">Tukang Besi</option>
                          <option value="Helper">Helper / Kenek</option>
                          <option value="Mandor">Mandor</option>
                          <option value="Supir Logistik">Supir Logistik</option>
                          <option value="Admin Gudang">Admin Gudang</option>
                          <option value="Kepala Gudang">Kepala Gudang</option>
                          <option value="Admin Sales">Admin Sales</option>
                          <option value="Finance">Finance / Akuntan</option>
                          <option value="HRD">HRD & General Affair</option>
                          <option value="Manager Operasional">
                            Manager Operasional
                          </option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-650 text-slate-700">
                          Divisi Departemen *
                        </label>
                        <select
                          required
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-400"
                        >
                          <option value="">-- Pilih Divisi --</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Logistik">Logistik</option>
                          <option value="Gudang">Gudang</option>
                          <option value="Sales & Marketing">
                            Sales & Marketing
                          </option>
                          <option value="Keuangan">Keuangan (Finance)</option>
                          <option value="HRD & GA">HRD & GA</option>
                          <option value="Manajemen">Manajemen</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-650 text-slate-700">
                          Tipe Anggota Karyawan
                        </label>
                        <select
                          value={employeeType}
                          onChange={(e: any) => setEmployeeType(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-400"
                        >
                          <option value="Tetap">Tetap (Permanent)</option>
                          <option value="Kontrak">Kontrak (Contract)</option>
                          <option value="Harian">Harian (Daily)</option>
                          <option value="Borongan">
                            Borongan (Piece-rate)
                          </option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-650 text-slate-700">
                          Status Aktivitas
                        </label>
                        <select
                          value={status}
                          onChange={(e: any) => setStatus(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-400"
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Nonaktif">Nonaktif</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-650 text-slate-700">
                          Tarif Gaji Harian (Rp)
                        </label>
                        <input
                          type="number"
                          value={dailyRate}
                          onChange={(e) => setDailyRate(Number(e.target.value))}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-650 text-slate-700">
                          Tarif Borongan per Pcs (Rp)
                        </label>
                        <input
                          type="number"
                          value={pieceRate}
                          onChange={(e) => setPieceRate(Number(e.target.value))}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-650 text-slate-700">
                          No. Telepon / WA
                        </label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-650 text-slate-700">
                          Tanggal Gabung
                        </label>
                        <input
                          type="date"
                          value={joinDate}
                          onChange={(e) => setJoinDate(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">
                        Alamat Rumah
                      </label>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 resize-none"
                      />
                    </div>
                  </div>
                )}

                {activeTab === "pribadi" && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">
                          Jenis Kelamin
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">
                          Status Pernikahan
                        </label>
                        <select
                          value={maritalStatus}
                          onChange={(e) => setMaritalStatus(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="Lajang">Lajang</option>
                          <option value="Menikah">Menikah</option>
                          <option value="Duda/Janda">Duda/Janda</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">
                          Tempat Lahir
                        </label>
                        <input
                          type="text"
                          value={placeOfBirth}
                          onChange={(e) => setPlaceOfBirth(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">
                          Tanggal Lahir
                        </label>
                        <input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">
                          Agama
                        </label>
                        <select
                          value={religion}
                          onChange={(e) => setReligion(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="Islam">Islam</option>
                          <option value="Kristen">Kristen</option>
                          <option value="Katolik">Katolik</option>
                          <option value="Hindu">Hindu</option>
                          <option value="Buddha">Buddha</option>
                          <option value="Konghucu">Konghucu</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">
                          Golongan Darah
                        </label>
                        <select
                          value={bloodType}
                          onChange={(e) => setBloodType(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="-">-</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="AB">AB</option>
                          <option value="O">O</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "bank" && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">
                          NIK (KTP)
                        </label>
                        <input
                          type="text"
                          value={idCardNumber}
                          onChange={(e) => setIdCardNumber(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">
                          NPWP
                        </label>
                        <input
                          type="text"
                          value={taxIdNumber}
                          onChange={(e) => setTaxIdNumber(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">
                          Nama Bank
                        </label>
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="Contoh: BCA, Mandiri"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">
                          No. Rekening
                        </label>
                        <input
                          type="text"
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save size={14} />
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
