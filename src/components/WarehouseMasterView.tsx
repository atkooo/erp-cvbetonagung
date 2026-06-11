/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Edit, Layers, Plus, RefreshCw, Trash2, Warehouse, X } from '@/src/components/icons';
import { apiClient } from '../services/api';
import { LocationDto } from '../features/inventory/types';

interface WarehouseMasterViewProps {
  onTriggerNotification: (message: string) => void;
}

interface WarehouseDto {
  id: string;
  name: string;
  code: string;
  type?: string;
  address?: string | null;
}

const emptyWarehouse = {
  id: '',
  code: 'AUTO GENERATED',
  name: '',
  type: 'Internal',
  address: '',
};

const emptyLocation = {
  id: '',
  warehouse_id: '',
  code: 'AUTO GENERATED',
  name: '',
  description: '',
};

export default function WarehouseMasterView({ onTriggerNotification }: WarehouseMasterViewProps) {
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState(emptyWarehouse);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationForm, setLocationForm] = useState(emptyLocation);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [whRes, locRes] = await Promise.all([
        apiClient.get<{ data: WarehouseDto[] }>('/master-data/warehouses'),
        apiClient.get<{ data: LocationDto[] }>('/master-data/storage-locations'),
      ]);

      setWarehouses(whRes.data);
      setLocations(locRes.data);
      setSelectedWarehouseId(prev => prev || whRes.data[0]?.id || '');
    } catch (error) {
      onTriggerNotification(error instanceof Error ? error.message : 'Gagal memuat master gudang.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId);
  const selectedLocations = locations.filter(loc => loc.warehouse_id === selectedWarehouseId);

  const openWarehouseCreate = () => {
    setWarehouseForm(emptyWarehouse);
    setShowWarehouseModal(true);
  };

  const openWarehouseEdit = (warehouse: WarehouseDto) => {
    setWarehouseForm({
      id: warehouse.id,
      code: warehouse.code,
      name: warehouse.name,
      type: warehouse.type || 'Internal',
      address: warehouse.address || '',
    });
    setShowWarehouseModal(true);
  };

  const openLocationCreate = () => {
    setLocationForm({
      ...emptyLocation,
      warehouse_id: selectedWarehouseId,
    });
    setShowLocationModal(true);
  };

  const openLocationEdit = (location: LocationDto) => {
    setLocationForm({
      id: location.id,
      warehouse_id: location.warehouse_id || selectedWarehouseId,
      code: location.code || 'AUTO GENERATED',
      name: location.name,
      description: location.description || '',
    });
    setShowLocationModal(true);
  };

  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseForm.name.trim()) {
      Swal.fire('Error', 'Nama gudang wajib diisi.', 'error');
      return;
    }

    const payload = {
      code: warehouseForm.code === 'AUTO GENERATED' ? '' : warehouseForm.code.trim().toUpperCase(),
      name: warehouseForm.name.trim(),
      type: warehouseForm.type.trim() || 'Internal',
      address: warehouseForm.address.trim() || null,
    };

    try {
      if (warehouseForm.id) {
        await apiClient.put(`/master-data/warehouses/${warehouseForm.id}`, payload);
        onTriggerNotification(`Gudang ${payload.name} diperbarui.`);
      } else {
        const response = await apiClient.post<{ data: WarehouseDto }>('/master-data/warehouses', payload);
        setSelectedWarehouseId(response.data.id);
        onTriggerNotification(`Gudang ${response.data.name} ditambahkan.`);
      }
      setShowWarehouseModal(false);
      await fetchData();
    } catch (error) {
      Swal.fire('Gagal', error instanceof Error ? error.message : 'Gagal menyimpan gudang.', 'error');
    }
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationForm.warehouse_id || !locationForm.name.trim()) {
      Swal.fire('Error', 'Gudang dan nama rak wajib diisi.', 'error');
      return;
    }

    const payload = {
      warehouse_id: locationForm.warehouse_id,
      code: locationForm.code === 'AUTO GENERATED' ? '' : locationForm.code.trim().toUpperCase(),
      name: locationForm.name.trim(),
      description: locationForm.description.trim() || null,
    };

    try {
      if (locationForm.id) {
        await apiClient.put(`/master-data/storage-locations/${locationForm.id}`, payload);
        onTriggerNotification(`Lokasi ${payload.name} diperbarui.`);
      } else {
        await apiClient.post('/master-data/storage-locations', payload);
        onTriggerNotification(`Lokasi ${payload.name} ditambahkan.`);
      }
      setShowLocationModal(false);
      await fetchData();
    } catch (error) {
      Swal.fire('Gagal', error instanceof Error ? error.message : 'Gagal menyimpan lokasi/rak.', 'error');
    }
  };

  const handleDeleteWarehouse = async (warehouse: WarehouseDto) => {
    const result = await Swal.fire({
      title: 'Hapus Gudang?',
      text: `Gudang ${warehouse.name} akan dihapus. Pastikan tidak ada lokasi atau stok aktif.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    try {
      await apiClient.delete(`/master-data/warehouses/${warehouse.id}`);
      onTriggerNotification(`Gudang ${warehouse.name} dihapus.`);
      setSelectedWarehouseId('');
      await fetchData();
    } catch (error) {
      Swal.fire('Gagal', error instanceof Error ? error.message : 'Gudang tidak bisa dihapus.', 'error');
    }
  };

  const handleDeleteLocation = async (location: LocationDto) => {
    const result = await Swal.fire({
      title: 'Hapus Lokasi?',
      text: `Lokasi ${location.name} akan dihapus. Pastikan tidak ada stok aktif di lokasi ini.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    try {
      await apiClient.delete(`/master-data/storage-locations/${location.id}`);
      onTriggerNotification(`Lokasi ${location.name} dihapus.`);
      await fetchData();
    } catch (error) {
      Swal.fire('Gagal', error instanceof Error ? error.message : 'Lokasi tidak bisa dihapus.', 'error');
    }
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg">
            <Warehouse size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">Master Gudang & Rak</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Kelola gudang, area penyimpanan, dan kode rak sebagai master data inventory.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="px-3 py-2 border rounded-lg font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
          <button onClick={openWarehouseCreate} className="px-3 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 flex items-center gap-1.5">
            <Plus size={12} />
            <span>Tambah Gudang</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Daftar Gudang</h4>
            <span className="text-[10px] text-slate-400 font-mono">{warehouses.length} data</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
            {warehouses.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Belum ada gudang.</div>
            ) : (
              warehouses.map(warehouse => (
                <button
                  key={warehouse.id}
                  onClick={() => setSelectedWarehouseId(warehouse.id)}
                  className={`w-full p-4 text-left transition ${selectedWarehouseId === warehouse.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`font-mono text-[10px] ${selectedWarehouseId === warehouse.id ? 'text-slate-300' : 'text-slate-400'}`}>{warehouse.code}</span>
                      <p className="font-bold mt-0.5">{warehouse.name}</p>
                      <p className={`text-[10px] mt-1 ${selectedWarehouseId === warehouse.id ? 'text-slate-300' : 'text-slate-500'}`}>{warehouse.address || 'Alamat belum diisi'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${selectedWarehouseId === warehouse.id ? 'border-slate-600 text-slate-200' : 'border-slate-200 text-slate-500 bg-slate-50'}`}>
                      {warehouse.type || 'Internal'}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Lokasi / Rak Penyimpanan</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">{selectedWarehouse ? `${selectedWarehouse.name} (${selectedWarehouse.code})` : 'Pilih gudang terlebih dahulu'}</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedWarehouse && (
                <>
                  <button onClick={() => openWarehouseEdit(selectedWarehouse)} className="px-3 py-2 border rounded-lg font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                    <Edit size={12} />
                    <span>Edit Gudang</span>
                  </button>
                  <button onClick={() => handleDeleteWarehouse(selectedWarehouse)} className="px-3 py-2 border border-rose-200 rounded-lg font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5">
                    <Trash2 size={12} />
                    <span>Hapus</span>
                  </button>
                </>
              )}
              <button disabled={!selectedWarehouseId} onClick={openLocationCreate} className="px-3 py-2 bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold hover:bg-slate-800 flex items-center gap-1.5">
                <Plus size={12} />
                <span>Tambah Rak</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest font-mono text-[10px]">
                <tr>
                  <th className="p-3.5 pl-5">Kode</th>
                  <th className="p-3.5">Nama Lokasi</th>
                  <th className="p-3.5">Keterangan</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!selectedWarehouseId ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">Pilih gudang untuk melihat lokasi/rak.</td>
                  </tr>
                ) : selectedLocations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">Belum ada rak di gudang ini.</td>
                  </tr>
                ) : (
                  selectedLocations.map(location => (
                    <tr key={location.id} className="hover:bg-slate-50/50">
                      <td className="p-3.5 pl-5 font-mono font-bold text-slate-700">{location.code}</td>
                      <td className="p-3.5 font-bold text-slate-800">{location.name}</td>
                      <td className="p-3.5 text-slate-500">{location.description || '-'}</td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => openLocationEdit(location)} className="px-2 py-1 border rounded text-[10px] font-bold text-slate-600 hover:bg-slate-50">Edit</button>
                          <button onClick={() => handleDeleteLocation(location)} className="px-2 py-1 border border-rose-200 rounded text-[10px] font-bold text-rose-600 hover:bg-rose-50">Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showWarehouseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">{warehouseForm.id ? 'Edit Gudang' : 'Tambah Gudang'}</h4>
              <button onClick={() => setShowWarehouseModal(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveWarehouse} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="font-bold text-slate-700 block">Kode (Otomatis)</span>
                  <input value={warehouseForm.code} readOnly disabled className="w-full px-3 py-2 border rounded-lg font-mono uppercase bg-slate-100 text-slate-500 cursor-not-allowed" />
                </label>
                <label className="space-y-1.5">
                  <span className="font-bold text-slate-700 block">Tipe</span>
                  <select value={warehouseForm.type} onChange={e => setWarehouseForm(prev => ({ ...prev, type: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                    <option value="Internal">Internal</option>
                    <option value="Eksternal">Eksternal (Vendor/Titipan)</option>
                    <option value="Produksi">Produksi / Pabrikasi</option>
                    <option value="Showroom">Showroom / Toko</option>
                    <option value="Transit">Virtual / Transit</option>
                  </select>
                </label>
              </div>
              <label className="space-y-1.5 block">
                <span className="font-bold text-slate-700 block">Nama Gudang</span>
                <input value={warehouseForm.name} onChange={e => setWarehouseForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" required />
              </label>
              <label className="space-y-1.5 block">
                <span className="font-bold text-slate-700 block">Alamat</span>
                <textarea value={warehouseForm.address} onChange={e => setWarehouseForm(prev => ({ ...prev, address: e.target.value }))} rows={3} className="w-full px-3 py-2 border rounded-lg resize-none" />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowWarehouseModal(false)} className="px-4 py-2 border rounded-lg font-bold text-slate-600">Batal</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLocationModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">{locationForm.id ? 'Edit Rak' : 'Tambah Rak'}</h4>
              <button onClick={() => setShowLocationModal(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveLocation} className="p-5 space-y-4">
              <label className="space-y-1.5 block">
                <span className="font-bold text-slate-700 block">Gudang</span>
                <select value={locationForm.warehouse_id} onChange={e => setLocationForm(prev => ({ ...prev, warehouse_id: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">-- Pilih Gudang --</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="font-bold text-slate-700 block">Kode Rak (Otomatis)</span>
                  <input value={locationForm.code} readOnly disabled className="w-full px-3 py-2 border rounded-lg font-mono uppercase bg-slate-100 text-slate-500 cursor-not-allowed" />
                </label>
                <label className="space-y-1.5">
                  <span className="font-bold text-slate-700 block">Nama Lokasi</span>
                  <input value={locationForm.name} onChange={e => setLocationForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" required />
                </label>
              </div>
              <label className="space-y-1.5 block">
                <span className="font-bold text-slate-700 block">Keterangan</span>
                <textarea value={locationForm.description} onChange={e => setLocationForm(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border rounded-lg resize-none" />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowLocationModal(false)} className="px-4 py-2 border rounded-lg font-bold text-slate-600">Batal</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
