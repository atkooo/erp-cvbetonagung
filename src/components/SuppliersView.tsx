/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Handshake, Search, Plus, Filter, MapPin, Phone, User, X, Edit, Trash2, Save } from '@/src/components/icons';
import { Supplier } from '../types';
import { authStorage } from '../services/api';
import { suppliersApi } from '../features/suppliers/api';
import { SkeletonTable, ErrorCard } from './Skeleton';

interface SuppliersViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function SuppliersView({ onTriggerNotification }: SuppliersViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');

  const fetchData = () => {
    setIsLoading(true);
    setErrorMessage(null);

    suppliersApi
      .getSuppliers()
      .then((data) => {
        setSuppliers(data);
      })
      .catch((err: Error) => {
        setErrorMessage(err.message);
        onTriggerNotification(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  // Filter & Search
  const filteredSuppliers = suppliers.filter((supp) => {
    const matchesSearch =
      supp.name.toLowerCase().includes(search.toLowerCase()) ||
      supp.code.toLowerCase().includes(search.toLowerCase()) ||
      supp.contactName.toLowerCase().includes(search.toLowerCase()) ||
      supp.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || supp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setName('');
    setContactName('');
    setPhone('');
    setCity('');
    setAddress('');
    setStatus('Aktif');
  };

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (supp: Supplier) => {
    setEditingSupplier(supp);
    setName(supp.name);
    setContactName(supp.contactName === '-' ? '' : supp.contactName);
    setPhone(supp.phone === '-' ? '' : supp.phone);
    setCity(supp.city === '-' ? '' : supp.city);
    setAddress(supp.address === '-' ? '' : supp.address);
    setStatus(supp.status);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string, suppName: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus supplier ${suppName}?`)) return;

    onTriggerNotification(`Menghapus supplier ${suppName}...`);
    try {
      await suppliersApi.deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      onTriggerNotification(`Sukses menghapus supplier: ${suppName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menghapus supplier dari backend.';
      onTriggerNotification(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactName || !phone || !city) {
      onTriggerNotification('Gagal menyimpan: Lengkapi kolom wajib isi!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (editingSupplier) {
        const updated = await suppliersApi.updateSupplier(editingSupplier.id, {
          code: editingSupplier.code,
          name,
          contact_name: contactName,
          phone,
          city,
          address,
          status: status === 'Aktif' ? 'active' : 'inactive',
        });
        setSuppliers((prev) => prev.map((s) => (s.id === editingSupplier.id ? updated : s)));
        onTriggerNotification(`Sukses memperbarui Supplier: ${updated.name}`);
      } else {
        const nextCode = `SPL00${suppliers.length + 1}`;
        const newSupp = await suppliersApi.createSupplier({
          code: nextCode,
          name,
          contact_name: contactName,
          phone,
          city,
          address,
          status: status === 'Aktif' ? 'active' : 'inactive',
        });
        setSuppliers((prev) => [newSupp, ...prev]);
        onTriggerNotification(`Sukses mendaftarkan Supplier: ${newSupp.name} (${newSupp.code})`);
      }
      resetForm();
      setShowAddModal(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan supplier';
      setErrorMessage(msg);
      onTriggerNotification(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Action bar */}
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
              placeholder="Cari kode supplier, nama perusahaan, PIC, atau kota..."
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
              <option value="All">Semua Supplier</option>
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
          <span>Tambah Supplier</span>
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
              Buku Rekanan Vendor / Supplier Material ({filteredSuppliers.length} Item)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Backend API
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                  <th className="p-3.5 pl-5">Kode Vendor</th>
                  <th className="p-3.5">Nama Perusahaan / Unit Usaha</th>
                  <th className="p-3.5">PIC / Kontak Utama</th>
                  <th className="p-3.5">Kontak Desk</th>
                  <th className="p-3.5">Kota Asal</th>
                  <th className="p-3.5">Alamat Gudang Vendor</th>
                  <th className="p-3.5">Status Polisi PO</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      Tidak ada data supplier yang beraliansi dengan kriteria tersebut.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supp) => (
                    <tr key={supp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 pl-5 font-mono font-bold text-slate-700">
                        {supp.code}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {supp.name}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <User size={12} className="text-slate-400" />
                          <span className="font-medium">{supp.contactName}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400" />
                          <span>{supp.phone}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-slate-700">
                          <MapPin size={12} className="text-cyan-500" />
                          <span>{supp.city}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-500 max-w-[200px] truncate" title={supp.address}>
                        {supp.address}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          supp.status === 'Aktif' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {supp.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(supp)}
                            className="p-1 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 rounded transition-all"
                            title="Edit"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(supp.id, supp.name)}
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

          {/* Footer Pagination */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Menampilkan 1-{filteredSuppliers.length} dari {suppliers.length} item</span>
            <div className="flex gap-1">
              <button className="px-2.5 py-1 border border-slate-200 rounded bg-white hover:bg-slate-100 disabled:opacity-50 text-[10px]" disabled>Sebelumnya</button>
              <button className="px-2.5 py-1 border border-slate-200 rounded bg-white hover:bg-slate-100 disabled:opacity-50 text-[10px]" disabled>Berikutnya</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Supplier */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Handshake size={18} className="text-cyan-400" />
                <h3 className="font-sans font-bold text-sm">
                  {editingSupplier ? `Edit Data Supplier: ${editingSupplier.code}` : 'Registrasi Pemasok Baru'}
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Nama Badan Usaha / Toko</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Baja Jaya Abadi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Nama Kontak PIC</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pak Danang"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Kota Pabrik Vendor</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Tuban"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Nomor Telepon Kantor/Sales</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 0811XXXXXXXX atau (031) XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Alamat Kantor/Pabrik Utama</label>
                <textarea
                  rows={2}
                  placeholder="Kawasan Industri Manyar Kav 12, Gresik"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Status Kelayakan PO</label>
                <div className="flex gap-4 mt-1.5">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="supp_status"
                      checked={status === 'Aktif'}
                      onChange={() => setStatus('Aktif')}
                      className="text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>Aktif (Dapat dikirim PO otomatis)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="supp_status"
                      checked={status === 'Nonaktif'}
                      onChange={() => setStatus('Nonaktif')}
                      className="text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>Dibekukan sementara (Hold PO)</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1.5"
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
