/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Package,
  AlertTriangle,
  AlertOctagon,
  CheckSquare,
  Square,
  ShoppingCart,
  Building2,
  DollarSign,
  Layers,
  ArrowRight,
  Filter
} from '@/src/components/icons';
import { Supplier, PurchaseOrder } from '../types';
import { purchasingApi } from '../features/purchasing/api';
import { RestockSuggestionItem, RestockSuggestionsResponse } from '../features/purchasing/types';
import Swal from 'sweetalert2';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  onTriggerNotification: (message: string) => void;
  onPoCreated?: (po: PurchaseOrder) => void;
}

export default function RestockModal({
  isOpen,
  onClose,
  suppliers,
  onTriggerNotification,
  onPoCreated,
}: RestockModalProps) {
  const [data, setData] = useState<RestockSuggestionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'empty' | 'low'>('all');

  // Form selections & adjustments
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [unitPrices, setUnitPrices] = useState<Record<string, number>>({});
  const [targetSupplierId, setTargetSupplierId] = useState('');
  const [poNotes, setPoNotes] = useState('PO Restok Otomatis Barang Kosong / Menipis');

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await purchasingApi.getRestockSuggestions();
      setData(response);

      // Initialize default quantities and prices
      const defaultQty: Record<string, number> = {};
      const defaultPrices: Record<string, number> = {};
      const initialSelected = new Set<string>();

      response.rows.forEach((item) => {
        defaultQty[item.product_id] = item.suggested_order_qty;
        defaultPrices[item.product_id] = item.cost_price;
        // Default select all empty items
        if (item.stock_status === 'empty') {
          initialSelected.add(item.product_id);
        }
      });

      setOrderQuantities(defaultQty);
      setUnitPrices(defaultPrices);
      setSelectedProductIds(initialSelected);

      // Default supplier from first item if available
      if (response.rows.length > 0 && response.rows[0].last_supplier_id) {
        setTargetSupplierId(response.rows[0].last_supplier_id);
      } else if (suppliers.length > 0) {
        setTargetSupplierId(suppliers[0].id);
      }
    } catch (err) {
      console.error('Failed to load restock suggestions', err);
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal memuat saran restok');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
    }
  }, [isOpen]);

  const filteredRows = useMemo(() => {
    if (!data) return [];
    return data.rows.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.category_name.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'empty' && item.stock_status === 'empty') ||
        (statusFilter === 'low' && item.stock_status === 'low');

      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  const toggleSelectAll = () => {
    if (selectedProductIds.size === filteredRows.length && filteredRows.length > 0) {
      setSelectedProductIds(new Set());
    } else {
      const newSelected = new Set<string>(filteredRows.map((r) => r.product_id));
      setSelectedProductIds(newSelected);
    }
  };

  const toggleSelectProduct = (productId: string) => {
    const next = new Set(selectedProductIds);
    if (next.has(productId)) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    setSelectedProductIds(next);
  };

  const handleQtyChange = (productId: string, val: number) => {
    setOrderQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0.01, val),
    }));
  };

  const handlePriceChange = (productId: string, val: number) => {
    setUnitPrices((prev) => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  // Compute selected summary
  const selectedSummary = useMemo(() => {
    if (!data) return { count: 0, totalAmount: 0 };
    let total = 0;
    let count = 0;

    data.rows.forEach((item) => {
      if (selectedProductIds.has(item.product_id)) {
        count++;
        const qty = orderQuantities[item.product_id] ?? item.suggested_order_qty;
        const price = unitPrices[item.product_id] ?? item.cost_price;
        total += qty * price;
      }
    });

    return { count, totalAmount: total };
  }, [data, selectedProductIds, orderQuantities, unitPrices]);

  const handleCreatePo = async () => {
    if (selectedProductIds.size === 0) {
      onTriggerNotification('Silakan pilih minimal satu barang untuk direstok.');
      return;
    }

    if (!targetSupplierId) {
      onTriggerNotification('Silakan pilih Supplier tujuan pemasok.');
      return;
    }

    const selectedSupplier = suppliers.find((s) => s.id === targetSupplierId);
    const supplierName = selectedSupplier ? selectedSupplier.name : 'Supplier';

    const confirmResult = await Swal.fire({
      title: 'Terbitkan Purchase Order?',
      text: `Buat draft PO ke ${supplierName} untuk ${selectedSummary.count} item (Total Rp ${selectedSummary.totalAmount.toLocaleString('id-ID')})?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Terbitkan PO',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#0f172a',
    });

    if (!confirmResult.isConfirmed) return;

    setIsSubmitting(true);
    try {
      const itemsPayload = Array.from(selectedProductIds).map((prodId) => {
        const itemInfo = data?.rows.find((r) => r.product_id === prodId);
        return {
          product_id: prodId,
          quantity: orderQuantities[prodId] ?? 1,
          unit_price: unitPrices[prodId] ?? 0,
          description: itemInfo ? `Restok ${itemInfo.name}` : undefined,
        };
      });

      const newPo = await purchasingApi.generateRestockPo({
        supplier_id: targetSupplierId,
        po_date: new Date().toISOString().split('T')[0],
        notes: poNotes.trim() || undefined,
        items: itemsPayload,
      });

      onTriggerNotification(`PO ${newPo.poNumber} berhasil diterbitkan.`);
      if (onPoCreated) {
        onPoCreated(newPo);
      }
      onClose();
    } catch (err) {
      console.error('Failed to create restock PO', err);
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal membuat Purchase Order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/75">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Package size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Restok Barang Kosong & Menipis</h2>
              <p className="text-xs text-slate-500">
                Pilih barang yang berada di bawah batas stok minimum untuk diterbitkan Purchase Order (PO) ke pemasok
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* KPI Mini Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3 bg-slate-50/40 border-b border-slate-100 text-xs">
          <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold">Total Perlu Restok</span>
              <p className="text-base font-black text-slate-800">{data?.summary.total_items ?? 0} Item</p>
            </div>
            <Layers size={18} className="text-slate-400" />
          </div>

          <div className="p-2.5 bg-rose-50/70 rounded-lg border border-rose-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-rose-600 uppercase text-[10px] font-bold">Stok Habis (0)</span>
              <p className="text-base font-black text-rose-700">{data?.summary.out_of_stock_count ?? 0} Item</p>
            </div>
            <AlertOctagon size={18} className="text-rose-500" />
          </div>

          <div className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-amber-600 uppercase text-[10px] font-bold">Stok Menipis</span>
              <p className="text-base font-black text-amber-700">{data?.summary.low_stock_count ?? 0} Item</p>
            </div>
            <AlertTriangle size={18} className="text-amber-500" />
          </div>

          <div className="p-2.5 bg-indigo-50/70 rounded-lg border border-indigo-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-indigo-600 uppercase text-[10px] font-bold">Estimasi Kebutuhan</span>
              <p className="text-sm font-black text-indigo-700 truncate">
                Rp {(data?.summary.total_estimated_cost ?? 0).toLocaleString('id-ID')}
              </p>
            </div>
            <DollarSign size={18} className="text-indigo-500" />
          </div>
        </div>

        {/* Toolbar & Filter */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Cari SKU atau nama barang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter size={14} className="text-slate-400" />
            <span className="text-slate-500 font-medium">Status:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('empty')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === 'empty' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Habis
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('low')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === 'low' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Menipis
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
              <span>Memuat data stok produk...</span>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Package size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-600">Tidak ada barang yang membutuhkan restok</p>
              <p className="text-slate-400 text-[11px]">Semua stok barang saat ini berada dalam kondisi aman.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-2 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {selectedProductIds.size === filteredRows.length && filteredRows.length > 0 ? (
                        <CheckSquare size={16} className="text-indigo-600" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-2">Nama Barang & SKU</th>
                  <th className="py-3 px-2">Status Stok</th>
                  <th className="py-3 px-2 text-right">Stok / Min</th>
                  <th className="py-3 px-2 text-right">Defisit</th>
                  <th className="py-3 px-2 text-center w-28">Qty Order</th>
                  <th className="py-3 px-2 text-right w-32">Harga Satuan</th>
                  <th className="py-3 px-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRows.map((row) => {
                  const isSelected = selectedProductIds.has(row.product_id);
                  const qty = orderQuantities[row.product_id] ?? row.suggested_order_qty;
                  const price = unitPrices[row.product_id] ?? row.cost_price;
                  const subtotal = qty * price;

                  return (
                    <tr
                      key={row.product_id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectProduct(row.product_id)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-indigo-600" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <p className="font-bold text-slate-800">{row.name}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span className="font-mono">{row.sku}</span>
                          <span>•</span>
                          <span>{row.category_name}</span>
                          <span>•</span>
                          <span className="bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono">
                            {row.unit_code}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        {row.stock_status === 'empty' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            Habis (0)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            Menipis
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-bold text-slate-700">{row.current_stock}</span>
                        <span className="text-slate-400 text-[10px]"> / {row.min_stock}</span>
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-rose-600">
                        {row.deficit_qty > 0 ? `-${row.deficit_qty}` : '0'}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={qty}
                          onChange={(e) => handleQtyChange(row.product_id, parseFloat(e.target.value) || 0)}
                          disabled={!isSelected}
                          className={`w-24 text-right px-2 py-1 text-xs border rounded-md font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            isSelected
                              ? 'bg-white border-slate-300 text-slate-800'
                              : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        />
                      </td>
                      <td className="py-3 px-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={price}
                          onChange={(e) => handlePriceChange(row.product_id, parseFloat(e.target.value) || 0)}
                          disabled={!isSelected}
                          className={`w-28 text-right px-2 py-1 text-xs border rounded-md font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            isSelected
                              ? 'bg-white border-slate-300 text-slate-800'
                              : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        />
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-slate-800">
                        Rp {Math.round(subtotal).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Configuration & Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-slate-400 shrink-0" />
              <div className="text-xs">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Pilih Supplier PO</label>
                <select
                  value={targetSupplierId}
                  onChange={(e) => setTargetSupplierId(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500 min-w-[220px]"
                >
                  <option value="">-- Pilih Supplier --</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Catatan Dokumen</label>
              <input
                type="text"
                value={poNotes}
                onChange={(e) => setPoNotes(e.target.value)}
                placeholder="Catatan PO..."
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-500 w-64"
              />
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                {selectedSummary.count} Item Dipilih
              </span>
              <p className="text-base font-black text-slate-900">
                Rp {Math.round(selectedSummary.totalAmount).toLocaleString('id-ID')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleCreatePo}
                disabled={isSubmitting || selectedSummary.count === 0}
                className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                  selectedSummary.count === 0 || isSubmitting
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Menerbitkan PO...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={15} />
                    <span>Terbitkan PO Restok</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
