/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  BarChart2,
  PieChart,
  Calendar,
  FileDown,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Sheet,
} from "@/src/components/icons";
import { authStorage } from "../services/api";
import { salesApi } from "../features/sales/api";
import { purchasingApi } from "../features/purchasing/api";
import { financeApi } from "../features/finance/api";
import { productsApi } from "../features/products/api";
import { SalesOrder, PurchaseOrder, Invoice, Product } from "../types";

interface ReportsViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function FinanceReportView({
  onTriggerNotification,
}: ReportsViewProps) {
  const [selectedMonth, setSelectedMonth] = useState("2026-05");

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
        productsApi.getProducts(),
      ]);
      setSalesOrders(sos);
      setPurchaseOrders(pos);
      setInvoices(invs);
      setProducts(prods);
    } catch (err) {
      console.error("Failed to load reports data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Calculations for stats
  // 1. Total Omset (Sales orders total or Invoices total)
  const totalRevenue = salesOrders
    .filter((so) => so.status !== "Dibatalkan")
    .reduce((acc, so) => acc + so.total, 0);

  // 2. Total Pembelian (Purchase orders total)
  const totalPurchases = purchaseOrders
    .filter((po) => po.status !== "Dibatalkan")
    .reduce((acc, po) => acc + po.total, 0);

  // 3. Proyeksi Laba Bersih
  const netProfit = totalRevenue - totalPurchases;

  // 4. Tingkat Penagihan Lunas
  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const collectionRate =
    totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

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
              onTriggerNotification(
                `Mengekspor laporan KPI Omset Keuangan ke spreadsheet format Excel.`,
              );
            }}
            className="p-1 px-3.5 bg-slate-100 hover:bg-slate-150 border text-slate-700 font-bold rounded-lg flex items-center gap-1.5"
            title="Download Excel"
          >
            <Sheet size={14} />
            <span>XLSX</span>
          </button>

          <button
            onClick={() => {
              onTriggerNotification(
                `Mengirim cetak draf laporan ${selectedMonth} ke printer kantor`,
              );
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
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                Total Omset Pendapatan
              </span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <h4 className="text-sm md:text-base font-black text-slate-905 font-mono">
                  {formatIDR(totalRevenue)}
                </h4>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  <ArrowUpRight size={12} className="stroke-3" />
                  <span>+18%</span>
                </span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">
                Siklus Kontrak Proyek & Penjualan
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                Total Pembelian Bahan
              </span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <h4 className="text-sm md:text-base font-black text-slate-950 font-mono">
                  {formatIDR(totalPurchases)}
                </h4>
                <span className="text-[10px] text-rose-650 font-semibold flex items-center text-rose-600 gap-0.5">
                  <ArrowDownRight size={12} />
                  <span>-4%</span>
                </span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">
                Restock Bahan Baku Semen & Besi
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                Proyeksi Laba Bersih
              </span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <h4
                  className={`text-sm md:text-base font-black font-mono ${netProfit >= 0 ? "text-indigo-600" : "text-rose-600"}`}
                >
                  {formatIDR(netProfit)}
                </h4>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  <ArrowUpRight size={12} className="stroke-3" />
                  <span>+22%</span>
                </span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">
                Realisasi Margin Operasional
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                Tingkat Penagihan Lunas
              </span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <h4 className="text-sm md:text-base font-black text-slate-900 font-mono">
                  {collectionRate.toFixed(1)}%
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  Target 90%
                </span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">
                Rasio Kolektibilitas Tagihan
              </span>
            </div>
          </div>

          {/* 3. FINANCE GRAPHICS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Column Line graph */}
            <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center pb-3.5 border-b mb-4">
                <div className="space-y-0.5">
                  <h4 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Tren Pendapatan Bulanan (2026)
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Omset penjualan terekam dari invoice lunas & serah terima
                    termin proyek.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-cyan-500 rounded" />
                    <span className="text-slate-600">Target Kontrak</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-indigo-700 rounded" />
                    <span className="text-slate-600">Realisasi Kas</span>
                  </div>
                </div>
              </div>

              {/* Custom line and area representation */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                  Grafik penjualan belum tersedia. (Kosong)
                </div>
              </div>
            </div>

            {/* Product Category distribution pie */}
            <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-center py-6 text-[10px] text-slate-400 font-mono">
                  Data produk terlaris belum tersedia.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
