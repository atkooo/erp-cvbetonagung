/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Package, Search, Plus, Filter, Archive, Edit, Trash2, X, Tag } from '@/src/components/icons';
import { Product, Category } from '../types';
import { DEFAULT_UNITS, productsApi } from '../features/products/api';
import { UnitDto } from '../features/products/types';
import { inventoryApi } from '../features/inventory/api';
import { apiClient } from '../services/api';
import { SkeletonTable, ErrorCard } from './Skeleton';

interface ProductsViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function ProductsView({ onTriggerNotification }: ProductsViewProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New product states
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [unit, setUnit] = useState('');
  const [location, setLocation] = useState('Gudang Utama');
  const [minStock, setMinStock] = useState(10);

  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [storageLocations, setStorageLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const visibleUnits = units.length > 0 ? units : DEFAULT_UNITS;

  const fetchData = () => {
    setIsLoading(true);
    setErrorMessage(null);

    Promise.all([
      productsApi.getProducts(),
      productsApi.getCategories(),
      productsApi.getUnits(),
      inventoryApi.getProductStocks(),
      apiClient.get<{ data: any[] }>('/master-data/storage-locations'),
    ])
      .then(([productsData, catsData, unitsData, stockData, locRes]) => {
        const productsWithStock = productsData.map((product) => {
          const productStocks = stockData.filter((stockRow) => (
            stockRow.product_id === product.id || stockRow.product?.sku === product.sku
          ));
          const totalStock = productStocks.reduce((sum, stockRow) => sum + Number(stockRow.quantity || 0), 0);
          const locationNames = Array.from(new Set(
            productStocks
              .filter((stockRow) => Number(stockRow.quantity || 0) > 0)
              .map((stockRow) => stockRow.location?.name)
              .filter(Boolean)
          ));
          const stockStatus: Product['status'] = totalStock <= 0
            ? 'Habis'
            : totalStock <= product.minStock
              ? 'Menipis'
              : 'Aman';

          return {
            ...product,
            stock: totalStock,
            location:
              locationNames.length === 0
                ? 'Belum ada stok'
                : locationNames.length === 1
                  ? locationNames[0]
                  : `${locationNames.length} lokasi`,
            status: stockStatus,
          };
        });

        setProducts(productsWithStock);
        setCategories(catsData);
        setStorageLocations(locRes.data || []);
        const nextUnits = unitsData.length > 0 ? unitsData : DEFAULT_UNITS;
        setUnits(unitsData);
        if (catsData.length > 0) {
          setCategory(catsData[0].id); // Select first category by default for new product
        }
        if (nextUnits.length > 0) {
          setUnit(nextUnits[0].id); // Select first unit by default
        }
        if (locRes.data && locRes.data.length > 0) {
          setLocation(locRes.data[0].id);
        }
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

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const resetForm = () => {
    setSku('');
    setName('');
    setCategory(categories[0]?.id || '');
    setCostPrice(0);
    setSellingPrice(0);
    setStock(0);
    setUnit(visibleUnits[0]?.id || '');
    setLocation(storageLocations[0]?.id || '');
    setMinStock(10);
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
    const selectedCategory = categories.find((cat) => cat.name === product.category);
    const selectedUnit = visibleUnits.find((u) => u.id === product.unitId || u.code === product.unit || u.name === product.unit);

    setEditingProduct(product);
    setSku(product.sku);
    setName(product.name);
    setCategory(selectedCategory?.id || categories[0]?.id || '');
    setCostPrice(product.costPrice);
    setSellingPrice(product.sellingPrice);
    setStock(product.stock);
    setUnit(selectedUnit?.id || visibleUnits[0]?.id || '');
    setLocation(product.location);
    setMinStock(product.minStock);
    setShowAddModal(true);
  };

  // Filter products
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(search.toLowerCase()) ||
      prod.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || prod.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter !== 'All') {
      matchesStatus = prod.status === statusFilter;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !costPrice || !sellingPrice) {
      onTriggerNotification('Gagal menyimpan: Harap lengkapi semua kolom produk!');
      return;
    }
    if (units.length === 0) {
      onTriggerNotification('Gagal menyimpan: Master satuan belum tersedia. Tambahkan data satuan di backend terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = {
        sku,
        name,
        category_id: category, // The category select holds the ID
        unit_id: unit,
        cost_price: costPrice,
        selling_price: sellingPrice,
        min_stock: minStock,
        status: 'active',
      } as const;

      if (editingProduct) {
        const updatedProduct = await productsApi.updateProduct(editingProduct.id, payload);
        setProducts((prev) => prev.map((prod) => (prod.id === editingProduct.id ? updatedProduct : prod)));
        onTriggerNotification(`Sukses memperbarui Produk: ${updatedProduct.name}`);
      } else {
        const newProd = await productsApi.createProduct(payload);
        if (stock > 0 && location) {
          await inventoryApi.updateProductStock(newProd.id, location, stock);
          // Update the list immediately to reflect new stock
          await fetchData();
        } else {
          setProducts((prev) => [newProd, ...prev]);
        }
        onTriggerNotification(`Sukses menambahkan Produk Baru: ${name}`);
      }
      setShowAddModal(false);
      setEditingProduct(null);
      resetForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan produk';
      setErrorMessage(msg);
      onTriggerNotification(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus produk ${product.name} (${product.sku})?`)) return;

    onTriggerNotification(`Menghapus produk ${product.sku}...`);
    try {
      await productsApi.deleteProduct(product.id);
      setProducts((prev) => prev.filter((prod) => prod.id !== product.id));
      onTriggerNotification(`Sukses menghapus Produk: ${product.name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus produk';
      setErrorMessage(msg);
      onTriggerNotification(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and filter controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan SKU atau nama produk konstruksi..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-sans text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <Filter size={13} className="text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-[11px] font-sans text-slate-600 bg-transparent py-1 focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="All">Semua Kategori</option>
                {categories.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <Archive size={13} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-[11px] font-sans text-slate-600 bg-transparent py-1 focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="All">Semua Ketersediaan</option>
                <option value="Aman">Ketersediaan: Aman</option>
                <option value="Menipis">Ketersediaan: Menipis</option>
                <option value="Habis">Ketersediaan: Habis / Kosong</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition-all shadow flex items-center justify-center gap-2 shrink-0"
        >
          <Plus size={16} />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      {/* Main product display table */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={9} />
      ) : errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={fetchData} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wider">
              Katalog Umum & Daftar Item Pabrik CV Beton Agung ({filteredProducts.length} Item)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Backend API
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                  <th className="p-3.5 pl-5">SKU No.</th>
                  <th className="p-3.5">Nama Item Produk</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Harga Modal (COGS)</th>
                  <th className="p-3.5">Harga Jual (MSRP)</th>
                  <th className="p-3.5">Stok Saat Ini</th>
                  <th className="p-3.5">Gudang / Lokasi</th>
                  <th className="p-3.5">Status Alaram</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400 font-medium">
                      Tidak ditemukan kecocokan produk untuk kata kunci pencarian tersebut.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-3.5 pl-5 font-mono font-bold text-slate-700 bg-slate-50/20">
                        {p.sku}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{p.name}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-semibold border border-slate-200/50">
                          <Tag size={10} className="text-slate-400" />
                          <span>{p.category}</span>
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {formatIDR(p.costPrice)}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-800">
                        {formatIDR(p.sellingPrice)}
                      </td>
                      <td className="p-3.5">
                        <div className="font-mono font-bold">
                          {p.stock} <span className="text-[10px] font-normal text-slate-400">{p.unit}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-500 font-medium">
                        {p.location}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${p.status === 'Aman' ? 'bg-emerald-100 text-emerald-800' :
                          p.status === 'Menipis' ? 'bg-amber-100 text-amber-800 animate-pulse border border-amber-200' :
                            'bg-red-100 text-red-800 font-sans'
                          }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded transition-colors"
                            title="Edit Produk"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Hapus Produk"
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

          {/* Catalog pagination summary */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-slate-500 text-[11px]">
            <span>Menampilkan {filteredProducts.length} dari total {products.length} SKU katalog terdaftar</span>
            <span className="font-medium text-slate-400">CV Beton Agung Admin Desk</span>
          </div>
        </div>
      )}

      {/* Modal Add Product Form */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-cyan-400" />
                <h3 className="font-sans font-bold text-sm">
                  {editingProduct ? 'Edit SKU & Desain Produk' : 'Entri SKU & Desain Produk Baru'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Nomor SKU Produk</label>
                  <input
                    type="text"
                    placeholder="Otomatis (atau isi manual)"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs placeholder:text-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Kategori Konstruksi</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30 font-medium"
                  >
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Deskripsi / Nama Varian Item</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kubah GRC Motif Madinah Diameter 5M dengan Rangka Baja"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Harga Pokok Modal (Rp)</label>
                  <input
                    type="number"
                    required
                    value={costPrice || ''}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Harga Jual Pasar (Rp)</label>
                  <input
                    type="number"
                    required
                    value={sellingPrice || ''}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Stok Awal</label>
                  <input
                    type="number"
                    value={stock || ''}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Satuan</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    {visibleUnits.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
                  </select>
                  {units.length === 0 && (
                    <p className="text-[10px] text-amber-600 font-semibold">
                      Master satuan belum tersedia di database.
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Batas Minim Alaram</label>
                  <input
                    type="number"
                    value={minStock || ''}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Lokasi Penempatan Rak</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                >
                  {storageLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                  ))}
                </select>
                {storageLocations.length === 0 && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-1">Master lokasi rak belum tersedia di database.</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? 'Menyimpan...' : editingProduct ? 'Simpan Perubahan' : 'Simpan SKU Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
