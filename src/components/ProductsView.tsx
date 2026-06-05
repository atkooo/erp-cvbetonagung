/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Package, Search, Plus, Filter, DollarSign, Archive, Eye, Wrench, X, Tag } from 'lucide-react';
import { Product, Category } from '../types';
import { authStorage } from '../services/api';
import { productsApi } from '../features/products/api';
import { UnitDto } from '../features/products/types';

interface ProductsViewProps {
  products: Product[];
  onAddProduct: (newProduct: Product) => void;
  onTriggerNotification: (message: string) => void;
}

export default function ProductsView({ products, onAddProduct, onTriggerNotification }: ProductsViewProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New product states
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Kubah Masjid');
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [unit, setUnit] = useState('Pcs');
  const [location, setLocation] = useState('Gudang Utama');
  const [minStock, setMinStock] = useState(10);

  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasBackendSession = Boolean(authStorage.getToken());

  const activeProducts = hasBackendSession ? apiProducts : products;

  React.useEffect(() => {
    if (!hasBackendSession) return;
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    Promise.all([productsApi.getProducts(), productsApi.getCategories(), productsApi.getUnits()])
      .then(([productsData, catsData, unitsData]) => {
        if (isMounted) {
          setApiProducts(productsData);
          setCategories(catsData);
          setUnits(unitsData);
          if (catsData.length > 0) {
            setCategory(catsData[0].id); // Select first category by default for new product
          }
          if (unitsData.length > 0) {
            setUnit(unitsData[0].id); // Select first unit by default
          }
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          setErrorMessage(err.message);
          onTriggerNotification(err.message);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [hasBackendSession]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Filter products
  const filteredProducts = activeProducts.filter((prod) => {
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
    if (!sku || !name || !costPrice || !sellingPrice) {
      onTriggerNotification('Gagal menyimpan: Harap lengkapi semua kolom produk!');
      return;
    }

    if (hasBackendSession) {
      setIsSubmitting(true);
      setErrorMessage(null);
      try {
        const newProd = await productsApi.createProduct({
          sku,
          name,
          category_id: category, // The category select now holds the ID when backend is active
          unit_id: hasBackendSession ? unit : 'default',
          cost_price: costPrice,
          selling_price: sellingPrice,
          min_stock: minStock,
          status: 'active',
        });
        setApiProducts((prev) => [newProd, ...prev]);
        onAddProduct(newProd);
        onTriggerNotification(`Sukses menambahkan Produk Baru: ${name} SKU [${sku}]`);
        setShowAddModal(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gagal menyimpan produk';
        setErrorMessage(msg);
        onTriggerNotification(msg);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Determine status
    let initialStatus: 'Aman' | 'Menipis' | 'Habis' = 'Aman';
    if (stock <= 0) initialStatus = 'Habis';
    else if (stock <= minStock) initialStatus = 'Menipis';

    const newProduct: Product = {
      id: `p${products.length + 1}`,
      sku,
      name,
      category,
      costPrice,
      sellingPrice,
      stock,
      unit,
      location,
      minStock,
      status: initialStatus,
    };

    onAddProduct(newProduct);
    onTriggerNotification(`Sukses menambahkan Produk Baru: ${name} SKU [${sku}]`);

    // Reset Form
    setSku('');
    setName('');
    setCategory('Kubah Masjid');
    setCostPrice(0);
    setSellingPrice(0);
    setStock(0);
    setUnit('Pcs');
    setLocation('Gudang Utama');
    setMinStock(10);
    setShowAddModal(false);
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
                {hasBackendSession 
                  ? categories.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)
                  : ['Kubah Masjid', 'Lisplang', 'Roster', 'Ornamen Beton', 'Tanaman', 'Produk Custom'].map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
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
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition-all shadow flex items-center justify-center gap-2 shrink-0"
        >
          <Plus size={16} />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      {/* Main product display table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wider">
            Katalog Umum & Daftar Item Pabrik CV Beton Agung ({filteredProducts.length} Item)
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            {hasBackendSession ? 'Backend API' : 'Demo Lokal'}
          </span>
        </div>

        {errorMessage && (
          <div className="px-5 py-3 bg-rose-50 border-b border-rose-100 text-[11px] font-semibold text-rose-700">
            {errorMessage}
          </div>
        )}

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
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-medium">
                    Memuat data produk dari backend...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
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
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'Aman' ? 'bg-emerald-100 text-emerald-800' :
                        p.status === 'Menipis' ? 'bg-amber-100 text-amber-800 animate-pulse border border-amber-200' :
                        'bg-red-100 text-red-800 font-sans'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <button
                        onClick={() => onTriggerNotification(`Melihat log detail audit item ${p.sku}`)}
                        className="p-1 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                        title="Audit Log"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Catalog pagination summary */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-slate-500 text-[11px]">
          <span>Menampilkan {filteredProducts.length} dari total {activeProducts.length} SKU katalog terdaftar</span>
          <span className="font-medium text-slate-400">CV Beton Agung Admin Desk</span>
        </div>
      </div>

      {/* Modal Add Product Form */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-cyan-400" />
                <h3 className="font-sans font-bold text-sm">Entri SKU & Desain Produk Baru</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Nomor SKU Produk (Unik)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: KBH-ENM-D5"
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
                    {hasBackendSession
                      ? categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)
                      : ['Kubah Masjid', 'Lisplang', 'Roster', 'Ornamen Beton', 'Tanaman', 'Produk Custom'].map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
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
                  {hasBackendSession ? (
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    >
                      {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Pcs/Set/Meter"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    />
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
                <label className="text-[11px] font-bold text-slate-600">Lokasi Penempatan Rak</label>
                <input
                  type="text"
                  placeholder="Contoh: Workshop Area B atau Rak Blok G-4"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
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
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan SKU Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
