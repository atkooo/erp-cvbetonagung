/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Warehouse, ArrowRightLeft, RefreshCw, AlertTriangle, Plus, X, Box, Tag, Layers
} from 'lucide-react';
import Swal from 'sweetalert2';
import { apiClient } from '../services/api';
import { inventoryApi } from '../features/inventory/api';
import { productsApi } from '../features/products/api';
import { LocationDto, ProductStockDto } from '../features/inventory/types';
import { Product } from '../types';

interface MultiWarehouseViewProps {
  onTriggerNotification: (message: string) => void;
}

const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const Header = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <Panel className="p-5">
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg">{icon}</div>
      <div>
        <h3 className="font-sans font-bold text-sm text-slate-800">{title}</h3>
        <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
      </div>
    </div>
  </Panel>
);

const StatusPill = ({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'cyan' | 'amber' | 'emerald' | 'rose' | 'indigo' }) => {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${tones[tone]}`}>
      {children}
    </span>
  );
};

export default function MultiWarehouseView({ onTriggerNotification }: MultiWarehouseViewProps) {
  const [warehouses, setWarehouses] = useState<{ id: string; name: string; code: string; type?: string; address?: string }[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [productStocks, setProductStocks] = useState<ProductStockDto[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Transfer Form State
  const [transferProduct, setTransferProduct] = useState('');
  const [transferFromLocation, setTransferFromLocation] = useState('');
  const [transferToLocation, setTransferToLocation] = useState('');
  const [transferQuantity, setTransferQuantity] = useState<number>(0);
  const [transferNotes, setTransferNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [whRes, locRes, stocksRes, prodRes] = await Promise.all([
        apiClient.get<{ data: any[] }>('/master-data/warehouses'),
        apiClient.get<{ data: LocationDto[] }>('/master-data/storage-locations'),
        inventoryApi.getProductStocks(),
        productsApi.getProducts()
      ]);

      setWarehouses(whRes.data);
      setLocations(locRes.data);
      setProductStocks(stocksRes);
      setProducts(prodRes);

      if (whRes.data.length > 0 && !selectedWarehouseId) {
        setSelectedWarehouseId(whRes.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching warehouse data:', error);
      onTriggerNotification('Gagal memuat data pergudangan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProduct || !transferFromLocation || !transferToLocation || transferQuantity <= 0) {
      Swal.fire('Error', 'Semua kolom form harus diisi dengan benar.', 'error');
      return;
    }
    if (transferFromLocation === transferToLocation) {
      Swal.fire('Error', 'Lokasi asal dan tujuan tidak boleh sama.', 'error');
      return;
    }

    // Check availability of stock in origin location
    const sourceStock = productStocks.find(
      s => s.product_id === transferProduct && s.location_id === transferFromLocation
    );
    const sourceQty = sourceStock ? Number(sourceStock.quantity) : 0;
    if (sourceQty < transferQuantity) {
      Swal.fire('Error', `Stok di lokasi asal tidak mencukupi (Tersedia: ${sourceQty}).`, 'error');
      return;
    }

    // Check destination stock
    const destStock = productStocks.find(
      s => s.product_id === transferProduct && s.location_id === transferToLocation
    );
    const destQty = destStock ? Number(destStock.quantity) : 0;

    try {
      // 1. Decrement source stock in DB
      await inventoryApi.updateProductStock(transferProduct, transferFromLocation, sourceQty - transferQuantity);
      
      // 2. Increment destination stock in DB
      await inventoryApi.updateProductStock(transferProduct, transferToLocation, destQty + transferQuantity);

      // 3. Create transfer movement log
      await inventoryApi.transferStock({
        product_id: transferProduct,
        from_location_id: transferFromLocation,
        to_location_id: transferToLocation,
        quantity: transferQuantity,
        notes: transferNotes || 'Transfer stok antar rak/gudang'
      });

      Swal.fire('Sukses', 'Stok berhasil ditransfer.', 'success');
      onTriggerNotification(`Transfer ${transferQuantity} barang berhasil.`);
      
      setShowTransferModal(false);
      // Reset form
      setTransferProduct('');
      setTransferFromLocation('');
      setTransferToLocation('');
      setTransferQuantity(0);
      setTransferNotes('');

      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error transferring stock:', error);
      Swal.fire('Gagal', 'Terjadi kesalahan saat memproses transfer stok.', 'error');
    }
  };

  const openTransferForProduct = (productId: string, locationId: string) => {
    setTransferProduct(productId);
    setTransferFromLocation(locationId);
    // Find matching stock quantity
    const stock = productStocks.find(s => s.product_id === productId && s.location_id === locationId);
    setTransferQuantity(stock ? Number(stock.quantity) : 0);
    setShowTransferModal(true);
  };

  // Filter storage locations for the active warehouse
  const activeLocations = locations.filter(loc => loc.warehouse_id === selectedWarehouseId);

  // Group active stocks by location_id
  const stocksByLocation = activeLocations.reduce((acc, loc) => {
    const locStocks = productStocks.filter(s => s.location_id === loc.id && Number(s.quantity) > 0);
    acc[loc.id] = locStocks;
    return acc;
  }, {} as Record<string, ProductStockDto[]>);

  const activeWarehouse = warehouses.find(w => w.id === selectedWarehouseId);

  return (
    <div className="space-y-6 text-xs font-sans">
      <Header
        icon={<Warehouse size={20} />}
        title="Multi Warehouse & Tata Letak Rak"
        desc="Monitoring sebaran stok secara fisik di berbagai gudang, area produksi, dan titik rak penyimpanan."
      />

      {/* Control Panel */}
      <Panel className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="font-bold text-slate-700 whitespace-nowrap">Pilih Gudang:</span>
          <select
            className="flex-1 md:w-80 px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500 bg-white font-bold text-slate-800 text-xs"
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
          >
            {warehouses.map(wh => (
              <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 border bg-white hover:bg-slate-50 rounded-lg font-bold text-slate-600 transition"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
          
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition"
          >
            <ArrowRightLeft size={12} />
            <span>Transfer Stok Barang</span>
          </button>
        </div>
      </Panel>

      {/* Warehouse Info Card */}
      {activeWarehouse && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Panel className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Kode & Nama Gudang</span>
              <h4 className="text-sm font-bold text-slate-800 mt-1">{activeWarehouse.name} ({activeWarehouse.code})</h4>
            </div>
            <StatusPill tone="indigo">{activeWarehouse.type || 'Internal'}</StatusPill>
          </Panel>
          <Panel className="p-4">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Lokasi / Alamat Gudang</span>
            <p className="text-slate-600 font-medium mt-1">{activeWarehouse.address || 'Alamat tidak diinput'}</p>
          </Panel>
          <Panel className="p-4">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Total Kuantitas SKU</span>
            <h4 className="text-sm font-black text-slate-800 mt-1">
              {activeLocations.reduce((sum, loc) => sum + (stocksByLocation[loc.id]?.length || 0), 0)} SKU Terdaftar
            </h4>
          </Panel>
        </div>
      )}

      {/* Locations Grid */}
      {isLoading ? (
        <div className="flex justify-center py-24">
          <RefreshCw className="animate-spin text-slate-400" size={24} />
        </div>
      ) : activeLocations.length === 0 ? (
        <div className="text-center py-24 text-slate-400 bg-white rounded-xl border p-8">
          <AlertTriangle size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="font-bold text-slate-600">Belum ada lokasi penyimpanan / rak di gudang ini.</p>
          <p className="text-slate-400 max-w-xs mx-auto mt-1">Gunakan master data lokasi penyimpanan untuk menambahkan rak baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {activeLocations.map(loc => {
            const locStocks = stocksByLocation[loc.id] || [];

            return (
              <Panel key={loc.id} className="flex flex-col min-h-[220px]">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-slate-400" />
                    <strong className="font-bold text-slate-800">{loc.name}</strong>
                  </div>
                  <span className="font-mono text-cyan-600 font-bold bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                    {loc.code}
                  </span>
                </div>

                <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[250px]">
                  {locStocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 py-6">
                      <Box size={20} className="text-slate-300 mb-1" />
                      <span>Rak Kosong / Tanpa Stok</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {locStocks.map(stock => (
                        <div key={stock.id || stock.product_id} className="py-2 flex items-center justify-between first:pt-0 last:pb-0 hover:bg-slate-50/30">
                          <div>
                            <span className="font-bold text-slate-700 block">{stock.product?.name}</span>
                            <span className="font-mono text-slate-400 text-[9px]">{stock.product?.sku}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-black text-slate-900">
                              {Number(stock.quantity).toLocaleString('id-ID')}
                            </span>
                            <button
                              onClick={() => openTransferForProduct(stock.product_id, loc.id)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded text-[9px] transition"
                            >
                              Transfer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {loc.description && (
                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-medium italic">
                    Keterangan: {loc.description}
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}

      {/* Modal: Transfer Stock */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Transfer Stok Barang</h4>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleTransfer} className="p-5 space-y-4">
              {/* Product selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Pilih Produk</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                  value={transferProduct}
                  onChange={(e) => {
                    setTransferProduct(e.target.value);
                    setTransferFromLocation('');
                  }}
                  required
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              {/* Source location */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Rak Asal (Lokasi Sumber)</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                  value={transferFromLocation}
                  onChange={(e) => setTransferFromLocation(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Lokasi Asal --</option>
                  {locations.map(loc => {
                    // Check if there is stock for active product here
                    const stock = productStocks.find(s => s.product_id === transferProduct && s.location_id === loc.id);
                    const qty = stock ? Number(stock.quantity) : 0;
                    if (qty <= 0) return null;

                    return (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code}) - Stok: {qty}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Destination location */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Rak Tujuan (Lokasi Destinasi)</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                  value={transferToLocation}
                  onChange={(e) => setTransferToLocation(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Lokasi Tujuan --</option>
                  {locations.map(loc => {
                    // Don't show source location
                    if (loc.id === transferFromLocation) return null;
                    return (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Transfer quantity */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Jumlah Kuantitas Transfer</label>
                <input
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500 font-mono font-bold"
                  value={transferQuantity || ''}
                  onChange={(e) => setTransferQuantity(Number(e.target.value) || 0)}
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Catatan / Alasan Transfer</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Keterangan pergerakan barang..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800"
                >
                  Proses Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
