/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FolderTree, Sparkles, LayoutGrid, Plus, Compass, BrickWall, Flower, FileCode, CheckCircle2 } from 'lucide-react';
import { Product, Category } from '../types';
import { authStorage } from '../services/api';
import { productsApi } from '../features/products/api';

interface CategoriesViewProps {
  products: Product[];
  onTriggerNotification: (message: string) => void;
}

export default function CategoriesView({ products, onTriggerNotification }: CategoriesViewProps) {
  const [apiCategories, setApiCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasBackendSession = Boolean(authStorage.getToken());

  React.useEffect(() => {
    if (!hasBackendSession) return;
    let isMounted = true;
    setIsLoading(true);
    productsApi.getCategories()
      .then(data => { if (isMounted) setApiCategories(data); })
      .catch(err => { if (isMounted) onTriggerNotification(err.message); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [hasBackendSession]);

  // Static categories definition
  const staticCategories = [
    {
      name: 'Kubah Masjid',
      icon: Compass,
      description: 'Kubah precast GRC bermotif artistik dan kubah logam enamel platinum untuk masjid jami & musholla.',
      color: 'from-amber-500 to-orange-600',
      tag: 'Produk Utama',
    },
    {
      name: 'Lisplang',
      icon: LayoutGrid,
      description: 'Lisplang beton cor kualitas tinggi untuk pelindung tepi atau talang atap rumah bergaya klasik & minimalis.',
      color: 'from-blue-500 to-cyan-650',
      tag: 'Eksterior Atap',
    },
    {
      name: 'Roster',
      icon: BrickWall,
      description: 'Roster beton angin-angin dekoratif beraneka ragam motif untuk dinding sirkulasi partisi modern.',
      color: 'from-indigo-500 to-purple-600',
      tag: 'Sirkulasi & Fasad',
    },
    {
      name: 'Ornamen Beton',
      icon: LayoutGrid,
      description: 'Pilar korintian klasik, mihrab kaligrafi, ornamen dinding GRC, serta relief beton pencetakan khusus.',
      color: 'from-teal-500 to-emerald-600',
      tag: 'Seni Pracetak',
    },
    {
      name: 'Tanaman',
      icon: Flower,
      description: 'Pot beton pracetak minimalis dan aneka tanaman hias perdu rimbun untuk pengasrian taman.',
      color: 'from-emerald-500 to-green-650',
      tag: 'Taman & Lanskap',
    },
    {
      name: 'Produk Custom',
      icon: FileCode,
      description: 'Sistem cetakan kustomor GRC, pilar lengkung tinggi, ornamen kubah eksternal, dan pracetak khusus.',
      color: 'from-slate-600 to-slate-800',
      tag: 'Desain Arsitek',
    },
  ];

  const activeCategories = hasBackendSession ? apiCategories : staticCategories;

  return (
    <div className="space-y-6">
      {/* Visual Banner introduction */}
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-bold uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded">
            <Sparkles size={12} />
            <span>Klip Klasifikasi Produk</span>
          </div>
          <h2 className="text-base font-bold text-slate-800">Manajemen Partisi & Klasifikasi Produk</h2>
          <p className="text-xs text-slate-500 max-w-xl">
            CV Beton Agung mengelompokkan katalog produk ke dalam 6 lini utama produksi guna menstandardisasi proses precast cetakan beton, penentuan harga borongan, dan pemantauan material logistik.
          </p>
        </div>
        <button
          onClick={() => onTriggerNotification('Fungsi menambahkan Kategori baru draf prototype. Hubungi admin database.')}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Plus size={15} />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {/* Grid of categories cards */}
      {isLoading && <p className="text-sm text-slate-500">Memuat kategori dari backend...</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeCategories.map((cat, idx) => {
          const IconComponent = (cat as any).icon || FolderTree;
          // Count active products in this category
          const productCount = products.filter((p) => p.category === cat.name).length;

          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5">
                {/* Header card info */}
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-lg bg-gradient-to-br ${(cat as any).color || 'from-slate-500 to-slate-600'} text-white shadow`}>
                    <IconComponent size={20} />
                  </div>
                  <span className="text-[10px] font-mono tracking-wider font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                    {(cat as any).tag || 'Kategori Baru'}
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
                <button
                  onClick={() => onTriggerNotification(`Menyaring katalog berdasarkan kategori: ${cat.name}`)}
                  className="font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1.5"
                >
                  <span>Mulai Desain &rarr;</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
