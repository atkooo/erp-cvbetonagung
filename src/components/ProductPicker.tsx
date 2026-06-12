/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, X, Package, Check, Box } from '@/src/components/icons';
import { Product } from '../types';
import { productsApi } from '../features/products/api';
import { inventoryApi } from '../features/inventory/api';

interface ProductPickerProps {
  value?: string; // Product ID that is currently selected
  onChange: (product: Product) => void;
  categoryFilter?: string; // Deprecated: Use typeFilter instead
  typeFilter?: 'raw_material' | 'finished_good' | 'service';
  excludedProductIds?: string[];
  placeholder?: string;
  className?: string;
}

export default function ProductPicker({
  value,
  onChange,
  categoryFilter,
  typeFilter,
  excludedProductIds = [],
  placeholder = 'Pilih Produk / Material...',
  className = ''
}: ProductPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  // To display the selected product name in the button
  const selectedProduct = products.find(p => p.id === value);

  useEffect(() => {
    if ((isOpen || value) && products.length === 0) {
      loadProducts();
    }
  }, [isOpen, value, products.length]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const [prods, stocks] = await Promise.all([
        productsApi.getProducts(),
        inventoryApi.getProductStocks()
      ]);

      const productsWithStock = prods.map(p => {
        const productStocks = stocks.filter(s => s.product_id === p.id);
        const totalStock = productStocks.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
        return { ...p, stock: totalStock };
      });

      // Apply filters if provided
      let filtered = productsWithStock;
      if (categoryFilter) {
        filtered = filtered.filter(p => p.category.toLowerCase() === categoryFilter.toLowerCase());
      }
      if (typeFilter) {
        filtered = filtered.filter(p => p.type === typeFilter);
      }
      setProducts(filtered);
    } catch (error) {
      console.error('Failed to load products', error);
    } finally {
      setIsLoading(false);
    }
  };

  const excludedProductIdSet = new Set(excludedProductIds);
  const filteredProducts = products.filter((p) => {
    if (excludedProductIdSet.has(p.id) && p.id !== value) {
      return false;
    }

    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleSelect = (product: Product) => {
    onChange(product);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(true)}
        className={`w-full p-2.5 border rounded-lg flex items-center justify-between cursor-pointer bg-white hover:bg-slate-50 transition-colors ${className}`}
      >
        <div className="flex items-center gap-2 overflow-hidden w-full">
          <Package size={16} className="text-slate-400 shrink-0" />
          {isLoading && value && !selectedProduct ? (
            <div className="h-4 bg-slate-200 animate-pulse rounded w-2/3"></div>
          ) : (
            <span className={`text-xs truncate ${selectedProduct ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
              {selectedProduct ? selectedProduct.name : placeholder}
            </span>
          )}
        </div>
      </div>

      {/* Modal Picker */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">

            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-slate-50 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-100 text-cyan-600 rounded">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Pilih Data {typeFilter === 'raw_material' ? 'Material Baku' : categoryFilter ? categoryFilter : 'Produk/Material'}</h3>
                  <p className="text-[10px] text-slate-500">Pilih dari daftar master data gudang</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
                <X size={20} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b bg-white">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari berdasarkan nama, SKU, atau kategori..."
                  className="w-full pl-9 pr-4 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-2 bg-slate-50">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs">Memuat data...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Data tidak ditemukan.</div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => handleSelect(product)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between
                        ${value === product.id
                          ? 'bg-cyan-50 border-cyan-300 ring-1 ring-cyan-500'
                          : 'bg-white border-slate-200 hover:border-cyan-300 hover:shadow-sm'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 border flex items-center justify-center shrink-0">
                          <Package size={20} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-800">{product.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{product.sku}</span>
                            <span className="text-[10px] text-slate-500">{product.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 mb-0.5">Stok Tersedia</div>
                          <div className="font-mono text-xs font-bold text-slate-800">
                            {product.stock} {product.unit}
                          </div>
                        </div>
                        {value === product.id && (
                          <div className="text-cyan-600">
                            <Check size={20} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
