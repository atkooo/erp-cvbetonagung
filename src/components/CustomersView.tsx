/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Users, Search, Plus, Filter, Mail, MapPin, Phone, Building2, UserPlus, X, Edit, Trash2, Save } from '@/src/components/icons';
import { Customer } from '../types';
import { authStorage } from '../services/api';
import { customersApi } from '../features/customers/api';
import { SkeletonTable, ErrorCard } from './Skeleton';
import Swal from 'sweetalert2';

interface CustomersViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function CustomersView({ onTriggerNotification }: CustomersViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');

  const fetchData = () => {
    setIsLoading(true);
    setErrorMessage(null);

    customersApi
      .listCustomers()
      .then(({ customers }) => {
        setCustomers(customers);
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
        onTriggerNotification(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter & Search
  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.name.toLowerCase().includes(search.toLowerCase()) ||
      cust.code.toLowerCase().includes(search.toLowerCase()) ||
      cust.phone.includes(search) ||
      cust.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || cust.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setCity('');
    setAddress('');
    setStatus('Aktif');
  };

  const generateCustomerCode = () => {
    return 'AUTO GENERATED';
  };

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone === '-' ? '' : cust.phone);
    setEmail(cust.email === '-' ? '' : cust.email);
    setCity(cust.city === '-' ? '' : cust.city);
    setAddress(cust.address === '-' ? '' : cust.address);
    setStatus(cust.status);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string, custName: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Menghapus customer ${custName} tidak dapat dibatalkan!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    onTriggerNotification(`Menghapus customer ${custName}...`);
    try {
      await customersApi.deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      
      Swal.fire({
        title: 'Terhapus!',
        text: `Customer ${custName} berhasil dihapus.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menghapus customer dari backend.';
      Swal.fire({
        title: 'Gagal!',
        text: message,
        icon: 'error'
      });
      onTriggerNotification(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !city) {
      onTriggerNotification('Gagal menyimpan: Harap isi Nama, No HP, dan Kota!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (editingCustomer) {
        const updated = await customersApi.updateCustomer(editingCustomer.id, {
          code: editingCustomer.code,
          name,
          phone,
          email,
          city,
          address,
          status,
        });

        setCustomers((prev) => prev.map((c) => (c.id === editingCustomer.id ? updated : c)));
        onTriggerNotification(`Sukses memperbarui Customer: ${updated.name}`);
      } else {
        const nextCode = generateCustomerCode();
        const newCustomer = await customersApi.createCustomer({
          code: nextCode,
          name,
          phone,
          email,
          city,
          address,
          status,
        });

        setCustomers((prev) => [newCustomer, ...prev]);
        onTriggerNotification(`Sukses menambahkan Customer: ${newCustomer.name} (${newCustomer.code})`);
      }
      resetForm();
      setShowAddModal(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan customer ke backend.';
      setErrorMessage(message);
      onTriggerNotification(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode, nama, nomor HP, atau kota customer..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-sans text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            <Filter size={13} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-[11px] font-sans text-slate-600 bg-transparent py-1 focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="All">Semua Status</option>
              <option value="Aktif">Status: Aktif</option>
              <option value="Nonaktif">Status: Nonaktif</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition-all shadow flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          <span>Tambah Customer</span>
        </button>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} cols={8} />
      ) : errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={fetchData} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wider">
              Refferal Buku Alamat Pelanggan ({filteredCustomers.length} Item)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Backend API
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                  <th className="p-3.5 pl-5">Kode</th>
                  <th className="p-3.5">Nama Customer</th>
                  <th className="p-3.5">Nomor Telepon / WA</th>
                  <th className="p-3.5">Kota Operasional</th>
                  <th className="p-3.5">Alamat Lengkap</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      Tidak ada data customer yang cocok dengan pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 pl-5 font-mono font-bold text-cyan-600">
                        {cust.code}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          {cust.name}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400" />
                          <span>{cust.phone}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <MapPin size={12} className="text-emerald-500" />
                          <span>{cust.city}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-500 truncate max-w-[200px]" title={cust.address}>
                        {cust.address}
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono">
                        <span>{cust.email}</span>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${cust.status === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                          }`}>
                          {cust.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(cust)}
                            className="p-1 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 rounded transition-all"
                            title="Edit"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(cust.id, cust.name)}
                            className="p-1 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 text-slate-400 hover:text-rose-600 rounded transition-all"
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination UI */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Menampilkan 1-{filteredCustomers.length} dari {customers.length} item</span>
            <div className="flex gap-1">
              <button className="px-2.5 py-1 border border-slate-200 rounded bg-white hover:bg-slate-100 disabled:opacity-50 text-[10px]" disabled>Sebelumnya</button>
              <button className="px-2.5 py-1 border border-slate-200 rounded bg-white hover:bg-slate-100 disabled:opacity-50 text-[10px]" disabled>Berikutnya</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Customer */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-cyan-400" />
                <h3 className="font-sans font-bold text-sm">
                  {editingCustomer ? `Edit Data Customer: ${editingCustomer.code}` : 'Registrasi Customer Baru'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Nama Lengkap / Instansi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: H. Munir, S.Ag / Masjid Al-Furqon"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Nomor HP / WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 0812XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Kota Operasional</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Mojokerto"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Email (Opsional)</label>
                <input
                  type="email"
                  placeholder="Contoh: munir.giri@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Alamat Pengiriman / Pabrikasi</label>
                <textarea
                  rows={2}
                  placeholder="Jl. Pahlawan Barat No. 129, Kebomas"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Status Awal</label>
                <div className="flex gap-4 mt-1.5">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="add_status"
                      checked={status === 'Aktif'}
                      onChange={() => setStatus('Aktif')}
                      className="text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>Aktif (Mengikuti order aktif)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="add_status"
                      checked={status === 'Nonaktif'}
                      onChange={() => setStatus('Nonaktif')}
                      className="text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>Nonaktif / Blacklist</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Save size={13} />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
