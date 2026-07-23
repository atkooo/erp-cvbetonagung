import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Filter,
  Printer,
  FileSpreadsheet,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  AlertOctagon,
  Coins,
  Package,
  Calendar,
} from 'lucide-react';
import {
  reportsApi,
  DeadStockData,
  DeadStockItem,
  DeadStockFilters,
} from '../../api';
import { productsApi } from '../../../products/api';
import { Category } from '../../../../types';

export default function DeadStockPanel() {
  const [data, setData] = useState<DeadStockData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [thresholdDays, setThresholdDays] = useState<number>(30);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: DeadStockFilters = { days: thresholdDays };
      if (debouncedSearch.trim()) filters.search = debouncedSearch.trim();
      if (selectedCategory) filters.category_id = selectedCategory;

      const res = await reportsApi.getDeadStock(filters);
      setData(res);
    } catch (err: any) {
      console.error('Failed to fetch Dead Stock Report', err);
      setError(err?.response?.data?.message || 'Gagal memuat laporan analisis dead stock.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadReport();
  }, [selectedCategory, thresholdDays, debouncedSearch]);

  useEffect(() => {
    productsApi.getCategories().then(setCategories).catch(() => { });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
    setCurrentPage(1);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!data?.rows || data.rows.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'No,SKU,Nama Produk / Bahan,Kategori,Satuan,Stok Mengendap,Lama Tidak Bergerak (Hari),Tgl Terakhir Aktif,Modal COGS Terkunci (Rp),Nilai Jual Terkunci (Rp),Tingkat Risiko\n';

    data.rows.forEach((row, index) => {
      const line = [
        index + 1,
        `"${row.sku}"`,
        `"${row.name.replace(/"/g, '""')}"`,
        `"${row.category_name}"`,
        `"${row.unit_code || row.unit_name}"`,
        row.total_stock,
        row.days_idle,
        `"${row.last_active_date}"`,
        row.tied_cogs_value,
        row.tied_selling_value,
        `"${row.risk_level}"`,
      ].join(',');
      csvContent += line + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Analisis_Dead_Stock_${thresholdDays}hari_${new Date().toISOString().slice(0, 10)}.csv`);
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
  const rows = data?.rows || [];

  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedRows = rows.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div id="printable-report-area" className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 font-sans text-xs bg-slate-50/50">
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
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
        <h1 className="text-xl font-bold text-slate-900">CV. BETON AGUNG — ANALISIS DEAD STOCK (BARANG PASIF)</h1>
        <p className="text-xs text-slate-600">Identifikasi Inventori Mengendap Tanpa Pergerakan & Analisis Modal Terkunci</p>
        <p className="text-[10px] text-slate-400 mt-1">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
      </div>

      {/* TOP ACTION & FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print-hide">

        {/* Search & Select Filters */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 min-w-50 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari SKU atau Nama Produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                title="Hapus Pencarian"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={thresholdDays}
              onChange={(e) => setThresholdDays(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value={30}>⏱️ Tidak Aktif &gt;= 30 Hari</option>
              <option value={60}>⏱️ Tidak Aktif &gt;= 60 Hari</option>
              <option value={90}>🚨 Tidak Aktif &gt;= 90 Hari (Kritis)</option>
              <option value={180}>💀 Dead Stock &gt;= 180 Hari</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="p-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Filter size={13} />
              <span>Filter</span>
            </button>
          </div>
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
            disabled={!rows.length}
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

      {/* KPI SUMMARY CARDS */}
      {summary && (
        <div className="overflow-x-auto pb-1">
          <div className="grid grid-cols-4 gap-3.5 min-w-[750px] lg:min-w-0">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Total Jenis Dead Stock</span>
                <AlertOctagon size={15} className="text-rose-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-lg font-black text-rose-600 font-mono">{summary.total_dead_stock_items}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Item Pasif &gt;= {summary.threshold_days} Hari</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Total Qty Mengendap</span>
                <Package size={15} className="text-amber-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-lg font-black text-amber-600 font-mono">{summary.total_idle_qty.toLocaleString('id-ID')}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Fisik Barang Tidak Bergerak</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Modal COGS Terkunci</span>
                <Coins size={15} className="text-rose-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-base font-black text-rose-700 font-mono truncate">{formatIDR(summary.total_tied_cogs_value)}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Modal HPP Tidak Berputar</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Nilai Pasar Terkunci</span>
                <Calendar size={15} className="text-blue-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-base font-black text-slate-900 font-mono truncate">{formatIDR(summary.total_tied_selling_value)}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Proyeksi Omset Mengendap</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ERROR DISPLAY */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-none text-rose-700 flex items-center gap-3 text-xs">
          <X size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* MAIN DATA TABLE (rounded-none) */}
      <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-mono text-xs">Menganalisis inventori dead stock...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-emerald-600 space-y-2">
            <Clock size={32} className="mx-auto text-emerald-500 mb-2" />
            <p className="font-bold">Tidak ada Dead Stock ditemukan untuk ambang batas &gt;= {thresholdDays} hari!</p>
            <p className="text-[11px] text-slate-500">Semua produk dan bahan baku berputar dengan sehat dalam rentang waktu ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1100px]">
              <thead className="bg-slate-100/80 font-mono font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="py-3 px-3">Kode SKU</th>
                  <th className="py-3 px-3">Nama Produk / Bahan</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3 text-center">Satuan</th>
                  <th className="py-3 px-3 text-center">Stok Mengendap</th>
                  <th className="py-3 px-3 text-center">Lama Diam (Hari)</th>
                  <th className="py-3 px-3 text-center">Tgl Terakhir Aktif</th>
                  <th className="py-3 px-3 text-right">Modal Terkunci (COGS)</th>
                  <th className="py-3 px-3 text-right">Nilai Jual Pasar</th>
                  <th className="py-3 px-3 text-center">Tingkat Risiko</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700">
                {paginatedRows.map((row) => {
                  const isCritical = row.days_idle >= 90;
                  const isHigh = row.days_idle >= 60;

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {row.sku}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {row.name}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {row.category_name}
                      </td>
                      <td className="py-3 px-3 text-center font-mono whitespace-nowrap">
                        {row.unit_code || row.unit_name}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-black text-sm whitespace-nowrap text-amber-700">
                        {row.total_stock.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-black text-sm whitespace-nowrap">
                        <span className={isCritical ? 'text-rose-600' : isHigh ? 'text-amber-600' : 'text-slate-800'}>
                          {row.days_idle} hari
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600 whitespace-nowrap">
                        {row.last_active_date}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                        {formatIDR(row.tied_cogs_value)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-800 whitespace-nowrap">
                        {formatIDR(row.tied_selling_value)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isCritical
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isHigh
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                        >
                          {row.risk_level}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {!isLoading && totalItems > 0 && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs print-hide">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <span>Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value={10}>10 per halaman</option>
                <option value={25}>25 per halaman</option>
                <option value={50}>50 per halaman</option>
                <option value={100}>100 per halaman</option>
              </select>
              <span className="text-slate-300">|</span>
              <span>
                Menampilkan <strong className="text-slate-800">{startIndex + 1}</strong> - <strong className="text-slate-800">{Math.min(startIndex + itemsPerPage, totalItems)}</strong> dari <strong className="text-slate-800">{totalItems}</strong> produk pasif
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safePage <= 1}
                className="p-1 px-2 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-600 transition-colors"
                title="Halaman Pertama"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1 px-2.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-600 transition-colors flex items-center gap-1 text-[11px]"
              >
                <ChevronLeft size={14} />
                <span>Sebelumnya</span>
              </button>

              <div className="px-3 py-1 font-mono font-bold text-slate-700 text-xs">
                {safePage} / {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1 px-2.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-600 transition-colors flex items-center gap-1 text-[11px]"
              >
                <span>Selanjutnya</span>
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage >= totalPages}
                className="p-1 px-2 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-600 transition-colors"
                title="Halaman Terakhir"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
