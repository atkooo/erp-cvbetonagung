import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Filter,
  Printer,
  FileSpreadsheet,
  RefreshCw,
  X,
  DollarSign,
  PieChart,
  CheckCircle,
  AlertCircle,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import {
  reportsApi,
  ProfitLossData,
  ReportFilters,
} from '../../api';

interface ProfitLossPanelProps {
  filters?: ReportFilters;
}

export default function ProfitLossPanel({ filters: globalFilters }: ProfitLossPanelProps) {
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState(globalFilters?.date_from || '');
  const [dateTo, setDateTo] = useState(globalFilters?.date_to || '');

  useEffect(() => {
    if (globalFilters?.date_from) setDateFrom(globalFilters.date_from);
    if (globalFilters?.date_to) setDateTo(globalFilters.date_to);
  }, [globalFilters?.date_from, globalFilters?.date_to]);

  const loadReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: ReportFilters = {};
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;

      const res = await reportsApi.getProfitLoss(filters);
      setData(res);
    } catch (err: any) {
      console.error('Failed to fetch Profit Loss Report', err);
      setError(err?.response?.data?.message || 'Gagal memuat laporan laba rugi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [dateFrom, dateTo]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReport();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!data?.summary) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Kategori Laporan,Deskripsi,Nominal (Rp),Persentase (%)\n';

    const s = data.summary;
    csvContent += `PENDAPATAN UTAMA,Omset Penjualan Bersih,${s.total_revenue},100%\n`;
    csvContent += `HARGA POKOK PENJUALAN,Total HPP (COGS),${s.total_cogs},${s.total_revenue ? ((s.total_cogs / s.total_revenue) * 100).toFixed(1) : 0}%\n`;
    csvContent += `LABA KOTOR,Gross Profit,${s.gross_profit},${s.gross_margin_pct}%\n`;
    csvContent += `BEBAN OPERASIONAL,Total Biaya Usaha & Fabrikasi,${s.total_operating_expenses},${s.total_revenue ? ((s.total_operating_expenses / s.total_revenue) * 100).toFixed(1) : 0}%\n`;
    csvContent += `LABA BERSIH,Net Profit (Laba Bersih),${s.net_profit},${s.net_margin_pct}%\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Laba_Rugi_Sederhana_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const summary = data?.summary;
  const breakdown = data?.breakdown;

  return (
    <div id="printable-report-area" className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 font-sans text-xs bg-slate-50/50">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-report-area, #printable-report-area * {
            visibility: visible !important;
          }
          #printable-report-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            overflow: visible !important;
          }
          .print-hide {
            display: none !important;
          }
          .print-only-block {
            display: block !important;
          }
        }
      `}</style>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print-only-block mb-6 border-b-2 border-slate-900 pb-3">
        <h1 className="text-xl font-bold text-slate-900">CV. BETON AGUNG — LAPORAN LABA RUGI (PROFIT & LOSS)</h1>
        <p className="text-xs text-slate-600">Laporan Kinerja Keuangan Periode {dateFrom || 'Awal'} s/d {dateTo || 'Sekarang'}</p>
        <p className="text-[10px] text-slate-400 mt-1">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
      </div>

      {/* TOP ACTION & FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print-hide">

        <form onSubmit={handleFilterSubmit} className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-bold text-slate-700">Periode:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <span className="text-slate-400 text-xs">s/d</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />

          <button
            type="submit"
            className="p-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Filter size={13} />
            <span>Filter Periode</span>
          </button>
        </form>

        {/* Export & Action Buttons */}
        <div className="flex items-center gap-2 print-hide shrink-0">
          <button
            onClick={loadReport}
            className="p-1.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1.5 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={!summary}
            className="p-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            title="Ekspor CSV / Excel"
          >
            <FileSpreadsheet size={14} />
            <span>Excel (.csv)</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-1.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            title="Cetak Laporan PDF"
          >
            <Printer size={14} />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-none text-rose-700 flex items-center gap-3 text-xs">
          <X size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* PROFIT LOSS FINANCIAL STATEMENT BOARD */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm text-center text-slate-400 space-y-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-mono text-xs">Mengkonsolidasi laporan laba rugi perusahaan...</p>
        </div>
      ) : summary ? (
        <div className="space-y-6 max-w-4xl mx-auto">

          {/* NET PROFIT HIGHLIGHT HERO */}
          <div className={`p-6 rounded-2xl border shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${summary.net_profit >= 0
              ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-slate-800'
              : 'bg-gradient-to-r from-red-950 via-rose-900 to-slate-900 text-white border-red-800'
            }`}>
            <div>
              <span className="text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Coins size={14} className="text-amber-400" />
                LABA BERSIH OPERASIONAL (NET PROFIT)
              </span>
              <h2 className="text-3xl font-black font-mono mt-1">
                {formatIDR(summary.net_profit)}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Profit Margin Net: <span className="font-mono font-bold text-amber-300">{summary.net_margin_pct}%</span> dari total omset penjualan
              </p>
            </div>

            <div className="px-4 py-2 bg-white/10 backdrop-blur rounded-xl border border-white/10 flex items-center gap-3">
              {summary.net_profit >= 0 ? (
                <CheckCircle size={28} className="text-emerald-400" />
              ) : (
                <AlertCircle size={28} className="text-rose-400" />
              )}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-300 block">Status Kinerja</span>
                <span className="text-sm font-bold">{summary.net_profit >= 0 ? 'Surplus / Profit' : 'Defisit / Loss'}</span>
              </div>
            </div>
          </div>

          {/* FINANCIAL STATEMENT TABLE BOARD (rounded-none) */}
          <div className="bg-white rounded-none border border-slate-300 shadow-sm overflow-hidden font-sans">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" />
                <span>LAPORAN LABA RUGI (INCOME STATEMENT)</span>
              </h3>
              <span className="font-mono text-xs text-slate-400">CV. BETON AGUNG</span>
            </div>

            <div className="p-4 md:p-6 space-y-6 text-slate-800">

              {/* 1. PENDAPATAN UTAMA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-800">
                  <h4 className="font-black text-xs uppercase font-mono text-slate-900">1. PENDAPATAN OPERASIONAL (REVENUE)</h4>
                  <span className="font-mono font-bold text-emerald-700 text-sm">{formatIDR(summary.total_revenue)}</span>
                </div>
                {breakdown?.revenue_items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-1 text-slate-600 pl-4 border-b border-dashed border-slate-200">
                    <span>{item.description}</span>
                    <span className="font-mono font-semibold text-slate-900">{formatIDR(item.amount)}</span>
                  </div>
                ))}
              </div>

              {/* 2. HARGA POKOK PENJUALAN (HPP) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-800">
                  <h4 className="font-black text-xs uppercase font-mono text-slate-900">2. HARGA POKOK PENJUALAN (COGS)</h4>
                  <span className="font-mono font-bold text-rose-700 text-sm">({formatIDR(summary.total_cogs)})</span>
                </div>
                {breakdown?.cogs_items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-1 text-slate-600 pl-4 border-b border-dashed border-slate-200">
                    <span>{item.description}</span>
                    <span className="font-mono font-semibold text-rose-600">({formatIDR(item.amount)})</span>
                  </div>
                ))}
              </div>

              {/* SUB-TOTAL LABA KOTOR */}
              <div className="bg-slate-100 p-3.5 border-y-2 border-slate-900 flex justify-between items-center">
                <div>
                  <h4 className="font-black text-xs font-mono text-slate-900 uppercase">LABA KOTOR (GROSS PROFIT)</h4>
                  <span className="text-[10px] text-slate-500 block">Gross Margin: {summary.gross_margin_pct}%</span>
                </div>
                <span className="font-mono font-black text-base text-slate-900">{formatIDR(summary.gross_profit)}</span>
              </div>

              {/* 3. BEBAN OPERASIONAL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-800">
                  <h4 className="font-black text-xs uppercase font-mono text-slate-900">3. BEBAN OPERASIONAL & USAHA (EXPENSES)</h4>
                  <span className="font-mono font-bold text-rose-700 text-sm">({formatIDR(summary.total_operating_expenses)})</span>
                </div>
                {breakdown?.expense_categories.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic pl-4">Belum ada rincian pengeluaran operasional.</p>
                ) : (
                  breakdown?.expense_categories.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1 text-slate-600 pl-4 border-b border-dashed border-slate-200">
                      <span>Beban {item.category} ({item.count} transaksi)</span>
                      <span className="font-mono font-semibold text-rose-600">({formatIDR(item.amount)})</span>
                    </div>
                  ))
                )}
              </div>

              {/* FINAL LABA BERSIH */}
              <div className={`p-4 border-2 flex justify-between items-center ${summary.net_profit >= 0
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                  : 'bg-rose-50 border-rose-600 text-rose-950'
                }`}>
                <div>
                  <h3 className="font-black text-sm font-mono uppercase">LABA BERSIH SEBELUM PAJAK (NET PROFIT)</h3>
                  <span className="text-[11px] font-medium opacity-80 block">Proyeksi Hasil Bersih Operasional Perusahaan</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-xl block">{formatIDR(summary.net_profit)}</span>
                  <span className="text-[10px] font-bold font-mono">Net Margin: {summary.net_margin_pct}%</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      ) : null}

    </div>
  );
}
