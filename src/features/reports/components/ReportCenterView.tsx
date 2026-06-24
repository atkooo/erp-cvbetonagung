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
  Filter,
  BarChart3
} from 'lucide-react';

interface ReportCategory {
  id: string;
  title: string;
  icon: any;
  reports: { id: string; name: string }[];
}

const REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: 'sales',
    title: 'Eksekutif & Penjualan',
    icon: TrendingUp,
    reports: [
      { id: 'sales_daily', name: 'Laporan Omset Harian' },
      { id: 'sales_profit', name: 'Laporan Laba Kotor' },
      { id: 'sales_ar', name: 'Laporan Piutang Jatuh Tempo (AR)' },
      { id: 'sales_top_products', name: 'Analisis Produk Terlaris' },
    ]
  },
  {
    id: 'inventory',
    title: 'Bahan & Inventori',
    icon: Package,
    reports: [
      { id: 'inv_mutation', name: 'Laporan Mutasi Stok' },
      { id: 'inv_low_stock', name: 'Laporan Barang Hampir Habis' },
      { id: 'inv_valuation', name: 'Laporan Nilai Valuasi Gudang' },
      { id: 'inv_dead_stock', name: 'Analisis Dead Stock' },
    ]
  },
  {
    id: 'production',
    title: 'Produksi & Work Order',
    icon: Factory,
    reports: [
      { id: 'prod_completion', name: 'Laporan Penyelesaian Produksi' },
      { id: 'prod_efficiency', name: 'Efisiensi Bahan Baku (BOM vs Aktual)' },
      { id: 'prod_active_wo', name: 'Rekap Work Order Aktif' },
    ]
  },
  {
    id: 'purchasing',
    title: 'Pembelian & Hutang',
    icon: ShoppingCart,
    reports: [
      { id: 'pur_supplier', name: 'Laporan Pembelian per Supplier' },
      { id: 'pur_ap', name: 'Laporan Hutang Jatuh Tempo (AP)' },
      { id: 'pur_price_analysis', name: 'Analisis Harga Beli (RFQ)' },
    ]
  },
  {
    id: 'hrd',
    title: 'SDM & Operasional',
    icon: Users,
    reports: [
      { id: 'hr_attendance', name: 'Rekap Kehadiran Karyawan' },
      { id: 'hr_loans', name: 'Laporan Kasbon & Pinjaman' },
      { id: 'hr_overtime', name: 'Laporan Lembur & Overtime' },
    ]
  },
  {
    id: 'finance',
    title: 'Keuangan & Kas',
    icon: WalletCards,
    reports: [
      { id: 'fin_cashflow', name: 'Buku Besar & Arus Kas' },
      { id: 'fin_expenses', name: 'Laporan Pengeluaran Operasional' },
      { id: 'fin_profit_loss', name: 'Laba Rugi Sederhana' },
    ]
  }
];

export default function ReportCenterView() {
  const [selectedReportId, setSelectedReportId] = useState<string>('sales_daily');
  const [dateRangeType, setDateRangeType] = useState('daily'); // daily, monthly, yearly
  
  // Find selected report name
  let selectedReportName = '';
  REPORT_CATEGORIES.forEach(cat => {
    const found = cat.reports.find(r => r.id === selectedReportId);
    if (found) selectedReportName = found.name;
  });

  return (
    <div className="flex h-[calc(100vh-120px)] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR: Report Categories */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col">
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
              <div key={category.id} className="space-y-1">
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
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedReportId === report.id ? 'bg-blue-500' : 'bg-transparent'}`} />
                    {report.name}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT MAIN PANEL: Filter & Content */}
      <div className="flex-1 flex flex-col bg-slate-50/50">
        
        {/* Top Filter Bar */}
        <div className="p-4 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between z-10">
          <div>
            <h1 className="text-lg font-bold text-slate-800">{selectedReportName}</h1>
            <p className="text-xs text-slate-500">Konfigurasi parameter laporan sebelum mengekspor data.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
              <button 
                onClick={() => setDateRangeType('daily')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${dateRangeType === 'daily' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >Harian</button>
              <button 
                onClick={() => setDateRangeType('monthly')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${dateRangeType === 'monthly' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >Bulanan</button>
              <button 
                onClick={() => setDateRangeType('yearly')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${dateRangeType === 'yearly' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >Tahunan</button>
            </div>
            
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700">
              <Calendar size={14} className="text-slate-400" />
              <span>Pilih Tanggal / Rentang</span>
            </div>
            
            <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50" title="Filter Spesifik">
              <Filter size={16} />
            </button>
            
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-xs font-bold transition-colors">
              <FileSpreadsheet size={14} className="text-green-600" />
              Export Excel
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold shadow-sm transition-colors">
              <Download size={14} />
              Export PDF
            </button>
          </div>
        </div>

        {/* Placeholder Content Area */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
            <BarChart3 size={48} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Tampilan Preview Laporan</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-8">
            Modul <strong className="text-slate-700">{selectedReportName}</strong> saat ini <strong>sedang dibuat / dikerjakan</strong>. Nantinya, preview tabel data akan tampil di sini sebelum diekspor.
          </p>
          
          {/* Skeleton Mockup */}
          <div className="w-full max-w-4xl bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden opacity-50 pointer-events-none">
            <div className="h-12 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-4">
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 w-48 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse ml-auto"></div>
            </div>
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="h-3 w-32 bg-slate-100 rounded"></div>
                  <div className="h-3 w-24 bg-slate-100 rounded"></div>
                  <div className="h-3 w-48 bg-slate-100 rounded"></div>
                  <div className="h-3 w-20 bg-slate-100 rounded ml-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
