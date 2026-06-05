/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart2, PieChart, Calendar, FileDown, ArrowUpRight, ArrowDownRight, Printer, Sheet } from 'lucide-react';
import { authStorage } from '../services/api';
import { salesApi } from '../features/sales/api';
import { purchasingApi } from '../features/purchasing/api';
import { financeApi } from '../features/finance/api';
import { productsApi } from '../features/products/api';
import { SalesOrder, PurchaseOrder, Invoice, Product } from '../types';

interface ReportsViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function ReportsView({ onTriggerNotification }: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<'finance' | 'inventory'>('finance');
  const [selectedMonth, setSelectedMonth] = useState('2026-05');

  // API states
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const hasBackendSession = Boolean(authStorage.getToken());

  const loadData = async () => {
    if (!hasBackendSession) return;
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
  }, [hasBackendSession]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Calculations for stats
  // 1. Total Omset (Sales orders total or Invoices total)
  const totalRevenue = hasBackendSession
    ? salesOrders.filter(so => so.status !== 'Dibatalkan').reduce((acc, so) => acc + so.total, 0)
    : 185000000;

  // 2. Total Pembelian (Purchase orders total)
  const totalPurchases = hasBackendSession
    ? purchaseOrders.filter(po => po.status !== 'Dibatalkan').reduce((acc, po) => acc + po.total, 0)
    : 46000000;

  // 3. Proyeksi Laba Bersih
  const netProfit = hasBackendSession ? (totalRevenue - totalPurchases) : 139000000;

  // 4. Tingkat Penagihan Lunas
  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const collectionRate = hasBackendSession
    ? (totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0)
    : 92.5;

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* 1. Filter Top Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navigation states */}
        <div className="flex gap-1.5 p-1 bg-slate-50 border rounded-xl">
          <button
            onClick={() => setActiveTab('finance')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'finance' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Laporan Keuangan & Omset
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'inventory' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-855'
            }`}
          >
            Mutasi & Turnover Stok
          </button>
        </div>

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
              onTriggerNotification(`Mengekspor laporan KPI ${activeTab === 'finance' ? 'Omset Keuangan' : 'Turnover Inventory'} ke spreadsheet format Excel.`);
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

          {activeTab === 'finance' ? (
            // 3. FINANCE GRAPHICS TAB
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Column Line graph */}
              <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-center pb-3.5 border-b mb-4">
                  <div className="space-y-0.5">
                    <h4 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider">Tren Pendapatan Bulanan (2026)</h4>
                    <p className="text-[10px] text-slate-400">Omset penjualan terekam dari invoice lunas & serah terima termin proyek.</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-cyan-500 rounded" /><span className="text-slate-600">Target Kontrak</span></div>
                    <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-700 rounded" /><span className="text-slate-600">Realisasi Kas</span></div>
                  </div>
                </div>

                {/* Custom line and area representation */}
                <div className="relative py-4">
                  <svg viewBox="0 0 500 150" className="w-full h-44 overflow-visible">
                    {/* Grid guidelines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeDasharray="4 4" />
                    <line x1="0" y1="70" x2="500" y2="70" stroke="#f1f5f9" strokeDasharray="4 4" />
                    <line x1="0" y1="110" x2="500" y2="110" stroke="#f1f5f9" strokeDasharray="4 4" />
                    <line x1="0" y1="140" x2="500" y2="140" stroke="#cbd5e1" />

                    {/* Shaded Area for Realisasi Kas */}
                    <path
                      d="M 20 120 L 100 110 L 180 90 L 260 95 L 340 60 L 420 50 Z L 420 140 L 20 140 Z"
                      fill="url(#indigoGrad)"
                      opacity="0.15"
                    />

                    {/* Target line: cyan color */}
                    <path
                      d="M 20 130 Q 100 100 180 110 T 340 70 T 420 40"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Realisasi line: indigo color */}
                    <path
                      d="M 20 120 L 100 110 L 180 90 L 260 95 L 340 60 L 420 50"
                      fill="none"
                      stroke="#4338ca"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Dot markers */}
                    <circle cx="340" cy="60" r="5.5" fill="#4338ca" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="420" cy="50" r="5.5" fill="#4338ca" stroke="#ffffff" strokeWidth="2" />

                    {/* Label coordinate callouts */}
                    <text x="315" y="50" fill="#4338ca" fontSize="9" fontWeight="900" fontFamily="monospace">Rp 120M (April)</text>
                    <text x="390" y="38" fill="#4338ca" fontSize="9" fontWeight="900" fontFamily="monospace">Rp 185M (Mei)</text>

                    {/* Linear gradient definition */}
                    <defs>
                      <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4338ca" />
                        <stop offset="100%" stopColor="#ffffff" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Bottom calendar labels */}
                  <div className="flex justify-between px-2 text-[9px] font-mono text-slate-400 mt-2">
                    <span>Januari</span>
                    <span>Februari</span>
                    <span>Maret</span>
                    <span>April</span>
                    <span>Mei</span>
                  </div>
                </div>
              </div>

              {/* Product Category distribution pie */}
              <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider pb-3 border-b mb-4">Kontribusi Produk Terlaris</h4>
                  
                  {/* Fake donut display list */}
                  <div className="space-y-3 py-1 text-[11px] leading-relaxed">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-indigo-700 rounded-sm" />
                        <span className="text-slate-700">Kubah Masjid GRC</span>
                      </div>
                      <strong className="text-slate-800">65%</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                        <span className="text-slate-700">Roster & Lisplang Beton</span>
                      </div>
                      <strong className="text-slate-800">20%</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm" />
                        <span className="text-slate-700">Ornamen Mihrab Custom</span>
                      </div>
                      <strong className="text-slate-800">10%</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-slate-300 rounded-sm" />
                        <span className="text-slate-700">Pekerjaan Sipil Lainnya</span>
                      </div>
                      <strong className="text-slate-800">5%</strong>
                    </div>
                  </div>
                </div>

                {/* Custom SVG ring diagram */}
                <div className="flex justify-center mt-5">
                  <svg width="100" height="100" viewBox="0 0 40 40" className="rotate-[-90deg]">
                    {/* 65% Kubah GRC (indigo-700) */}
                    <circle cx="20" cy="20" r="15.915" fill="none" stroke="#4338ca" strokeWidth="6" strokeDasharray="65 35" strokeDashoffset="0" />
                    {/* 20% Roster (emerald-500) */}
                    <circle cx="20" cy="20" r="15.915" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray="20 80" strokeDashoffset="-65" />
                    {/* 10% Ornamen (amber-500) */}
                    <circle cx="20" cy="20" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="6" strokeDasharray="10 90" strokeDashoffset="-85" />
                    {/* 5% Tanaman (slate-300) */}
                    <circle cx="20" cy="20" r="15.915" fill="none" stroke="#cbd5e1" strokeWidth="6" strokeDasharray="5 95" strokeDashoffset="-95" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            // 4. INVENTORY TURNOVER REPORT TAB
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Turnover cards and tables */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h4 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">Index Perputaran Stok Harian</h4>
                  <p className="text-[10px] text-slate-400">Model perulangan stok habis dibandingkan pemesanan restock semen, air, pigment.</p>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800 block">Semen Portland OPC 50Kg</strong>
                      <span className="text-slate-400 text-[10px]">Turnover Rata-rata: 4.2 hari</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">SANGAT CEPAT</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800 block">Roster Beton Kotak Silang</strong>
                      <span className="text-slate-400 text-[10px]">Turnover Rata-rata: 8.5 hari</span>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">CUKUP CEPAT</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800 block">Lisplang Klasik Lebar 30cm</strong>
                      <span className="text-slate-400 text-[10px]">Turnover Rata-rata: 14.0 hari</span>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded">SEDANG</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider">Laporan Penyusutan & Rejection Rate</h4>
                  <p className="text-[10px] text-slate-400">Inspeksi batch cetak GRC retak atau gumpil sebelum rilis ekspedisi.</p>
                </div>

                {/* Custom bar chart representation of broken castings */}
                <div className="space-y-3.5 py-4">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Rejection Rate Cetakan GRC</span>
                      <span className="font-mono font-bold text-rose-600 font-semibold">1.2% (Aman)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[12%] h-full bg-cyan-500 rounded-full" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Pecah Rak Basah Roster Gumpil</span>
                      <span className="font-mono font-bold text-rose-600 font-semibold">3.5% (Ekspektasi)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[35%] h-full bg-amber-500 rounded-full" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Retak Susut Lisplang Beton</span>
                      <span className="font-mono font-bold text-rose-600 font-semibold font-semibold">0.8% (Sangat Baik)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[8%] h-full bg-emerald-500 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-[10px] leading-relaxed">
                  *Tingkat kegagalan cetak seluruh produk Beton Agung dipelihara di bawah batas aman konstruksi sipil nasional (yaitu maksimal sebesar 5%).
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
