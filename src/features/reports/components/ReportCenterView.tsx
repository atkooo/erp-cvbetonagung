import React, { useState } from 'react';
import {
  TrendingUp,
  Package,
  Factory,
  ShoppingCart,
  Users,
  WalletCards,
  FileSpreadsheet,
  Download,
  Calendar,
  BarChart3,
  ChevronDown,
} from 'lucide-react';
import DailySalesPanel from '../panels/sales/DailySalesPanel';
import GrossProfitPanel from '../panels/sales/GrossProfitPanel';
import ArAgingPanel from '../panels/sales/ArAgingPanel';
import TopProductsPanel from '../panels/sales/TopProductsPanel';
import { ReportFilters } from '../api';

interface ReportCategory {
  id: string;
  title: string;
  icon: any;
  reports: { id: string; name: string; implemented?: boolean }[];
}

const REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: 'sales',
    title: 'Eksekutif & Penjualan',
    icon: TrendingUp,
    reports: [
      { id: 'sales_daily',        name: 'Laporan Omset Harian',          implemented: true },
      { id: 'sales_profit',       name: 'Laporan Laba Kotor',             implemented: true },
      { id: 'sales_ar',           name: 'Laporan Piutang Jatuh Tempo (AR)', implemented: true },
      { id: 'sales_top_products', name: 'Analisis Produk Terlaris',       implemented: true },
    ],
  },
  {
    id: 'inventory',
    title: 'Bahan & Inventori',
    icon: Package,
    reports: [
      { id: 'inv_mutation',   name: 'Laporan Mutasi Stok' },
      { id: 'inv_low_stock',  name: 'Laporan Barang Hampir Habis' },
      { id: 'inv_valuation',  name: 'Laporan Nilai Valuasi Gudang' },
      { id: 'inv_dead_stock', name: 'Analisis Dead Stock' },
    ],
  },
  {
    id: 'production',
    title: 'Produksi & Work Order',
    icon: Factory,
    reports: [
      { id: 'prod_completion', name: 'Laporan Penyelesaian Produksi' },
      { id: 'prod_efficiency', name: 'Efisiensi Bahan Baku (BOM vs Aktual)' },
      { id: 'prod_active_wo',  name: 'Rekap Work Order Aktif' },
    ],
  },
  {
    id: 'purchasing',
    title: 'Pembelian & Hutang',
    icon: ShoppingCart,
    reports: [
      { id: 'pur_supplier',       name: 'Laporan Pembelian per Supplier' },
      { id: 'pur_ap',             name: 'Laporan Hutang Jatuh Tempo (AP)' },
      { id: 'pur_price_analysis', name: 'Analisis Harga Beli (RFQ)' },
    ],
  },
  {
    id: 'hrd',
    title: 'SDM & Operasional',
    icon: Users,
    reports: [
      { id: 'hr_attendance', name: 'Rekap Kehadiran Karyawan' },
      { id: 'hr_loans',      name: 'Laporan Kasbon & Pinjaman' },
      { id: 'hr_overtime',   name: 'Laporan Lembur & Overtime' },
    ],
  },
  {
    id: 'finance',
    title: 'Keuangan & Kas',
    icon: WalletCards,
    reports: [
      { id: 'fin_cashflow',    name: 'Buku Besar & Arus Kas' },
      { id: 'fin_expenses',    name: 'Laporan Pengeluaran Operasional' },
      { id: 'fin_profit_loss', name: 'Laba Rugi Sederhana' },
    ],
  },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function firstOfMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function ReportCenterView() {
  const [selectedReportId, setSelectedReportId] = useState<string>('sales_daily');
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [dateFrom, setDateFrom] = useState(firstOfMonthStr());
  const [dateTo, setDateTo] = useState(todayStr());

  const filters: ReportFilters = { period, date_from: dateFrom, date_to: dateTo };

  let selectedReportName = '';
  let isImplemented = false;
  REPORT_CATEGORIES.forEach(cat => {
    const found = cat.reports.find(r => r.id === selectedReportId);
    if (found) {
      selectedReportName = found.name;
      isImplemented = found.implemented ?? false;
    }
  });

  const renderPanel = () => {
    if (!isImplemented) return <PlaceholderPanel name={selectedReportName} />;
    switch (selectedReportId) {
      case 'sales_daily':        return <DailySalesPanel filters={filters} />;
      case 'sales_profit':       return <GrossProfitPanel filters={filters} />;
      case 'sales_ar':           return <ArAgingPanel asOfDate={dateTo} />;
      case 'sales_top_products': return <TopProductsPanel filters={filters} />;
      default:                   return <PlaceholderPanel name={selectedReportName} />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden font-sans">

      {/* LEFT SIDEBAR */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-500" />
            Pusat Laporan Terpadu
          </h2>
          <p className="text-[10px] text-slate-500 mt-1">Pilih kategori laporan untuk memulai</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {REPORT_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.id} className="space-y-0.5">
                <div className="flex items-center gap-2 px-2 py-1 mb-1">
                  <Icon size={14} className="text-blue-500" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{category.title}</span>
                </div>
                {category.reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                      selectedReportId === report.id
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedReportId === report.id ? 'bg-blue-500' : 'bg-transparent'}`} />
                    <span className="flex-1">{report.name}</span>
                    {!report.implemented && (
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full shrink-0">Soon</span>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT MAIN PANEL */}
      <div className="flex-1 flex flex-col bg-slate-50/50 min-w-0">

        {/* Top Filter Bar */}
        <div className="p-4 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between gap-4 z-10 shrink-0">
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-800 truncate">{selectedReportName}</h1>
            <p className="text-[10px] text-slate-500">Konfigurasi parameter laporan sebelum mengekspor data.</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Period toggle */}
            <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
              {(['daily', 'monthly', 'yearly'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${period === p ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {p === 'daily' ? 'Harian' : p === 'monthly' ? 'Bulanan' : 'Tahunan'}
                </button>
              ))}
            </div>

            {/* Date From */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Calendar size={13} className="text-slate-400 shrink-0" />
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="text-xs text-slate-700 bg-transparent outline-none w-28"
              />
            </div>

            <span className="text-xs text-slate-400">—</span>

            {/* Date To */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Calendar size={13} className="text-slate-400 shrink-0" />
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="text-xs text-slate-700 bg-transparent outline-none w-28"
              />
            </div>

            <div className="h-6 w-px bg-slate-200" />

            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-xs font-bold transition-colors">
              <FileSpreadsheet size={13} className="text-green-600" />
              Excel
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold shadow-sm transition-colors">
              <Download size={13} />
              PDF
            </button>
          </div>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {renderPanel()}
        </div>
      </div>
    </div>
  );
}

function PlaceholderPanel({ name }: { name: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
      <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-5 shadow-sm border border-blue-100">
        <BarChart3 size={40} strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-bold text-slate-700 mb-1">Segera Hadir</h3>
      <p className="text-xs text-slate-400 max-w-sm">
        Modul <strong className="text-slate-600">{name}</strong> sedang dalam pengembangan.
      </p>

      {/* Skeleton */}
      <div className="w-full max-w-3xl mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden opacity-40 pointer-events-none">
        <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-3">
          {[32, 24, 48, 20].map((w, i) => <div key={i} className={`h-3 w-${w} bg-slate-200 rounded animate-pulse`} />)}
        </div>
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="h-2.5 w-32 bg-slate-100 rounded" />
              <div className="h-2.5 w-24 bg-slate-100 rounded" />
              <div className="h-2.5 w-40 bg-slate-100 rounded" />
              <div className="h-2.5 w-20 bg-slate-100 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
