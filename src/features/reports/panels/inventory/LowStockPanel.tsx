import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
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
  XCircle,
  Package,
  ShoppingCart,
} from 'lucide-react';
import {
  reportsApi,
  LowStockData,
  LowStockItem,
  LowStockFilters,
} from '../../api';
import { productsApi } from '../../../products/api';
import { Category } from '../../../../types';

export default function LowStockPanel() {
  const [data, setData] = useState<LowStockData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [stockStatus, setStockStatus] = useState<string>('');

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
      const filters: LowStockFilters = {};
      if (debouncedSearch.trim()) filters.search = debouncedSearch.trim();
      if (selectedCategory) filters.category_id = selectedCategory;
      if (stockStatus) filters.stock_status = stockStatus;

      const res = await reportsApi.getLowStock(filters);
      setData(res);
    } catch (err: any) {
      console.error('Failed to fetch Low Stock Report', err);
      setError(err?.response?.data?.message || 'Gagal memuat laporan barang hampir habis.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadReport();
  }, [selectedCategory, stockStatus, debouncedSearch]);

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
    csvContent += 'No,SKU,Nama Bahan / Produk,Kategori,Satuan,Stok Fisik,Min. Stok,Defisit Qty,Rekomendasi Restock Qty,Harga COGS (Rp),Est. Total Restock (Rp),Status Stok\n';

    data.rows.forEach((row, index) => {
      const line = [
        index + 1,
        `"${row.sku}"`,
        `"${row.name.replace(/"/g, '""')}"`,
        `"${row.category_name}"`,
        `"${row.unit_code || row.unit_name}"`,
        row.total_stock,
        row.min_stock,
        row.deficit_qty,
        row.suggested_reorder_qty,
        row.cost_price,
        row.estimated_reorder_cost,
        `"${row.stock_status_label}"`,
      ].join(',');
      csvContent += line + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Barang_Hampir_Habis_${new Date().toISOString().slice(0, 10)}.csv`);
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
        <h1 className="text-xl font-bold text-slate-900">CV. BETON AGUNG — LAPORAN BARANG HAMPIR HABIS & REORDER ALERT</h1>
        <p className="text-xs text-slate-600">Pemantauan Stok Kritis (Menipis & Habis) Beserta Proyeksi Modal Reorder</p>
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

            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="">Semua Status Kritis</option>
              <option value="menipis">🟡 Stok Menipis</option>
              <option value="habis">🔴 Stok Habis</option>
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
                <span className="text-[10px] uppercase font-mono font-bold">Total Item Kritis</span>
                <Package size={15} className="text-amber-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-lg font-black text-slate-900 font-mono">{summary.total_low_stock_items}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Perlu Tindakan Restock</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Item Stok Menipis</span>
                <AlertTriangle size={15} className="text-amber-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-lg font-black text-amber-600 font-mono">{summary.low_stock_count}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Stok ≤ Min. Stok</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Item Stok Habis (0)</span>
                <XCircle size={15} className="text-rose-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-lg font-black text-rose-600 font-mono">{summary.out_of_stock_count}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Kosong / Stock Out</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Estimasi Modal Restock</span>
                <ShoppingCart size={15} className="text-indigo-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-base font-black text-indigo-600 font-mono truncate">{formatIDR(summary.total_estimated_reorder_cost)}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Total Modal Pembelian (COGS)</span>
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
            <p className="font-mono text-xs">Memuat laporan barang hampir habis...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-emerald-600 space-y-2">
            <Package size={32} className="mx-auto text-emerald-500 mb-2" />
            <p className="font-bold">Semua stok produk dan bahan baku dalam kondisi Aman!</p>
            <p className="text-[11px] text-slate-500">Tidak ada barang yang menyentuh atau di bawah batas stok minimum saat ini.</p>
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
                  <th className="py-3 px-3 text-center">Stok Fisik</th>
                  <th className="py-3 px-3 text-center">Min. Stok</th>
                  <th className="py-3 px-3 text-center">Defisit Qty</th>
                  <th className="py-3 px-3 text-center">Saran Reorder Qty</th>
                  <th className="py-3 px-3 text-right">Harga Beli (COGS)</th>
                  <th className="py-3 px-3 text-right">Est. Modal Restock</th>
                  <th className="py-3 px-3 text-center">Status Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700">
                {paginatedRows.map((row) => {
                  const isHabis = row.stock_status === 'habis';

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
                      <td className="py-3 px-3 text-center font-mono font-black text-sm whitespace-nowrap">
                        <span className={isHabis ? 'text-rose-600' : 'text-amber-600'}>
                          {row.total_stock.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-500 whitespace-nowrap">
                        {row.min_stock}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-rose-600 whitespace-nowrap">
                        -{row.deficit_qty.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-indigo-600 whitespace-nowrap">
                        +{row.suggested_reorder_qty.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-800 whitespace-nowrap">
                        {formatIDR(row.cost_price)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {formatIDR(row.estimated_reorder_cost)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isHabis
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                        >
                          {isHabis ? <XCircle size={11} className="print-hide" /> : <AlertTriangle size={11} className="print-hide" />}
                          <span>{row.stock_status_label}</span>
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
                Menampilkan <strong className="text-slate-800">{startIndex + 1}</strong> - <strong className="text-slate-800">{Math.min(startIndex + itemsPerPage, totalItems)}</strong> dari <strong className="text-slate-800">{totalItems}</strong> produk
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
