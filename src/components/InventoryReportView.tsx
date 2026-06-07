/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart2, PieChart, Calendar, FileDown, ArrowUpRight, ArrowDownRight, Printer, Sheet } from '@/src/components/icons';
import { authStorage } from '../services/api';
import { salesApi } from '../features/sales/api';
import { purchasingApi } from '../features/purchasing/api';
import { financeApi } from '../features/finance/api';
import { productsApi } from '../features/products/api';
import { SalesOrder, PurchaseOrder, Invoice, Product } from '../types';

interface ReportsViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function InventoryReportView({ onTriggerNotification }: ReportsViewProps) {
  const [selectedMonth, setSelectedMonth] = useState('2026-05');

  // API states
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sos, pos, invs, prods] = await Promise.all([
        salesApi.getSalesOrders(),
        purchasingApi.getPurchaseOrders(),
        financeApi.getInvoices(),
        productsApi.getProducts()
      ]);
      setSalesOrders(sos);
      setPurchaseOrders(pos);
      setInvoices(invs);
      setProducts(prods);
    } catch (err) {
      console.error('Failed to load reports data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Calculations for stats
  // 1. Total Omset (Sales orders total or Invoices total)
  const totalRevenue = salesOrders.filter(so => so.status !== 'Dibatalkan').reduce((acc, so) => acc + so.total, 0);

  // 2. Total Pembelian (Purchase orders total)
  const totalPurchases = purchaseOrders.filter(po => po.status !== 'Dibatalkan').reduce((acc, po) => acc + po.total, 0);

  // 3. Proyeksi Laba Bersih
  const netProfit = totalRevenue - totalPurchases;

  // 4. Tingkat Penagihan Lunas
  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* 1. Filter Top Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Action Triggers */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="2026-05">Mei 2026</option>
            <option value="2026-04">April 2026</option>
            <option value="2026-03">Maret 2026</option>
          </select>

          <button
            onClick={() => {
              onTriggerNotification(`Mengekspor laporan KPI Turnover Inventory ke spreadsheet format Excel.`);
            }}
            className="p-1 px-3.5 bg-slate-100 hover:bg-slate-150 border text-slate-700 font-bold rounded-lg flex items-center gap-1.5"
            title="Download Excel"
          >
            <Sheet size={14} />
            <span>XLSX</span>
          </button>

          <button
            onClick={() => {
              onTriggerNotification(`Mengirim cetak draf laporan ${selectedMonth} ke printer kantor`);
            }}
            className="p-1 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center gap-1.5"
            title="Print PDF"
          >
            <Printer size={14} />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-12 text-center text-slate-400 font-sans border rounded-xl shadow-sm">
          Memperbarui laporan analitik dari database...
        </div>
      ) : (
        <>
          {/* 2. Primary KPI stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4.5">
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Total Omset Pendapatan</span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <h4 className="text-sm md:text-base font-black text-slate-905 font-mono">{formatIDR(totalRevenue)}</h4>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  <ArrowUpRight size={12} className="stroke-[3]" />
                  <span>+18%</span>
                </span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">Siklus Kontrak Proyek & Penjualan</span>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Total Pembelian Bahan</span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <h4 className="text-sm md:text-base font-black text-slate-950 font-mono">{formatIDR(totalPurchases)}</h4>
                <span className="text-[10px] text-rose-650 font-semibold flex items-center text-rose-600 gap-0.5">
                  <ArrowDownRight size={12} />
                  <span>-4%</span>
                </span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">Restock Bahan Baku Semen & Besi</span>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Proyeksi Laba Bersih</span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <h4 className={`text-sm md:text-base font-black font-mono ${netProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>{formatIDR(netProfit)}</h4>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  <ArrowUpRight size={12} className="stroke-[3]" />
                  <span>+22%</span>
                </span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">Realisasi Margin Operasional</span>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Tingkat Penagihan Lunas</span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <h4 className="text-sm md:text-base font-black text-slate-900 font-mono">{collectionRate.toFixed(1)}%</h4>
                <span className="text-[10px] text-slate-500 font-mono">Target 90%</span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">Rasio Kolektibilitas Tagihan</span>
            </div>
          </div>

          {/* 4. INVENTORY TURNOVER REPORT */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Turnover cards and tables */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h4 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">Index Perputaran Stok Harian</h4>
                  <p className="text-[10px] text-slate-400">Model perulangan stok habis dibandingkan pemesanan restock semen, air, pigment.</p>
                </div>

                <div className="space-y-2 text-center text-slate-400 py-4 text-[10px] font-mono">
                  Data perputaran stok belum tersedia. (Kosong)
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider">Laporan Penyusutan & Rejection Rate</h4>
                  <p className="text-[10px] text-slate-400">Inspeksi batch cetak GRC retak atau gumpil sebelum rilis ekspedisi.</p>
                </div>

                <div className="space-y-3.5 py-4 text-center text-slate-400 text-[10px] font-mono">
                  Data rejection rate belum tersedia. (Kosong)
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-[10px] leading-relaxed">
                  *Tingkat kegagalan cetak seluruh produk Beton Agung dipelihara di bawah batas aman konstruksi sipil nasional (yaitu maksimal sebesar 5%).
                </div>
              </div>
            </div>
        </>
      )}
    </div>
  );
}
