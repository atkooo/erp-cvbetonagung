/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TrendingUp, BarChart2, PieChart, Calendar, FileDown, ArrowUpRight, ArrowDownRight, Printer, Sheet } from 'lucide-react';

interface ReportsViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function ReportsView({ onTriggerNotification }: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<'finance' | 'inventory'>('finance');
  const [selectedMonth, setSelectedMonth] = useState('2026-05');

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

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
              activeTab === 'inventory' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-850'
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
            <option value="2026-05">Mei 22026</option>
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

      {/* 2. Primary KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4.5">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Total Omset Pendapatan</span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <h4 className="text-sm md:text-base font-black text-slate-900 font-mono">{formatIDR(185000000)}</h4>
            <span className="text-[10px] text-emerald-550 font-bold flex items-center text-emerald-600 gap-0.5">
              <ArrowUpRight size={12} className="stroke-[3]" />
              <span>+18%</span>
            </span>
          </div>
          <span className="text-[9px] text-slate-400 block mt-1">Siklus Kontrak GRC Terbayar</span>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Total Pembelian Bahan</span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <h4 className="text-sm md:text-base font-black text-slate-950 font-mono">{formatIDR(46000000)}</h4>
            <span className="text-[10px] text-rose-550 font-semibold flex items-center text-rose-600 gap-0.5">
              <ArrowDownRight size={12} />
              <span>-4%</span>
            </span>
          </div>
          <span className="text-[9px] text-slate-400 block mt-1">Pembelian Semen & Besi Wiremesh</span>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Proyeksi Laba Bersih</span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <h4 className="text-sm md:text-base font-black text-indigo-750 font-mono text-indigo-600">{formatIDR(139000000)}</h4>
            <span className="text-[10px] text-emerald-550 font-bold flex items-center text-emerald-600 gap-0.5">
              <ArrowUpRight size={12} className="stroke-[3]" />
              <span>+22%</span>
            </span>
          </div>
          <span className="text-[9px] text-slate-400 block mt-1">Margin Kotor Rata-rata 75%</span>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Tingkat Penagihan Lunas</span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <h4 className="text-sm md:text-base font-black text-slate-900 font-mono">92.5%</h4>
            <span className="text-[10px] text-slate-450 text-slate-500 font-mono">KPI target 90%</span>
          </div>
          <span className="text-[9px] text-slate-400 block mt-1">Rasio Kolektibilitas Invoice</span>
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
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-cyan-550 bg-cyan-500 rounded" /><span>Target Kontrak</span></div>
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-700 rounded" /><span>Realisasi Kas</span></div>
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
                <text x="345" y="52" fill="#4338ca" fontSize="9" fontWeight="900" fontFamily="monospace">Rp 120M (April)</text>
                <text x="410" y="38" fill="#4338ca" fontSize="9" fontWeight="900" fontFamily="monospace">Rp 185M (Mei)</text>

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
                    <span className="text-slate-705">Kubah Masjid GRC</span>
                  </div>
                  <strong className="text-slate-850">65% (Rp 120,250,000)</strong>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                    <span className="text-slate-705">Roster & Lisplang Beton</span>
                  </div>
                  <strong className="text-slate-850">20% (Rp 37,000,000)</strong>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm" />
                    <span className="text-slate-705">Ornamen Masjid & Mihrab</span>
                  </div>
                  <strong className="text-slate-855">10% (Rp 18,500,000)</strong>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-slate-300 rounded-sm" />
                    <span className="text-slate-705">Tanaman & Konstruktor</span>
                  </div>
                  <strong className="text-slate-850">5% (Rp 9,250,050)</strong>
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
                <span className="px-2 py-0.5 bg-blue-105 bg-blue-50 text-blue-700 font-bold rounded">CUKUP CEPAT</span>
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
                  <span className="font-mono font-bold text-rose-600">1.2% (Aman)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-[12%] h-full bg-cyan-500 rounded-full" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Pecah Rak Basah Roster Gumpil</span>
                  <span className="font-mono font-bold text-rose-600">3.5% (Ekspektasi)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-[35%] h-full bg-amber-500 rounded-full" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Retak Susut Lisplang Beton</span>
                  <span className="font-mono font-bold text-rose-600 font-semibold">0.8% (Sangat Baik)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-[8%] h-full bg-emerald-500 rounded-full" />
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-705 rounded-xl text-[10px] leading-relaxed">
              *Tingkat kegagalan cetak seluruh produk Beton Agung dipelihara di bawah batas aman konstruksi sipil nasional (yaitu maksimal sebesar 5%).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
