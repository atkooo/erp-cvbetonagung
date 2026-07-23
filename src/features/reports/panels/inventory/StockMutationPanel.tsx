import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
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
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  Package,
} from 'lucide-react';
import {
  reportsApi,
  StockMutationData,
  StockMutationItem,
  StockMutationFilters,
  ReportFilters,
} from '../../api';

interface StockMutationPanelProps {
  filters?: ReportFilters;
}

export default function StockMutationPanel({ filters: globalFilters }: StockMutationPanelProps) {
  const [data, setData] = useState<StockMutationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFrom, setDateFrom] = useState(globalFilters?.date_from || '');
  const [dateTo, setDateTo] = useState(globalFilters?.date_to || '');
  const [mutationType, setMutationType] = useState<string>('');

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

  // Sync global date filters if provided
  useEffect(() => {
    if (globalFilters?.date_from) setDateFrom(globalFilters.date_from);
    if (globalFilters?.date_to) setDateTo(globalFilters.date_to);
  }, [globalFilters?.date_from, globalFilters?.date_to]);

  const loadReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: StockMutationFilters = {};
      if (debouncedSearch.trim()) filters.search = debouncedSearch.trim();
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;
      if (mutationType) filters.type = mutationType;

      const res = await reportsApi.getStockMutation(filters);
      setData(res);
    } catch (err: any) {
      console.error('Failed to fetch Stock Mutation Report', err);
      setError(err?.response?.data?.message || 'Gagal memuat laporan mutasi stok.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadReport();
  }, [dateFrom, dateTo, mutationType, debouncedSearch]);

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
    csvContent += 'No,Tanggal & Waktu,No. Referensi,Tipe Mutasi,SKU,Nama Produk,Kategori,Jumlah Qty,Satuan,Lokasi Asal,Lokasi Tujuan,Petugas,Catatan\n';

    data.rows.forEach((row, index) => {
      const line = [
        index + 1,
        `"${row.movement_date}"`,
        `"${row.reference_number}"`,
        `"${row.type_label}"`,
        `"${row.sku}"`,
        `"${row.product_name.replace(/"/g, '""')}"`,
        `"${row.category_name}"`,
        row.quantity,
        `"${row.unit_code || row.unit_name}"`,
        `"${row.from_location}"`,
        `"${row.to_location}"`,
        `"${row.handled_by_name}"`,
        `"${(row.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
      csvContent += line + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Mutasi_Stok_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <h1 className="text-xl font-bold text-slate-900">CV. BETON AGUNG — LAPORAN MUTASI STOK</h1>
        <p className="text-xs text-slate-600">Riwayat Pergerakan Stok Masuk, Keluar, Transfer & Penyesuaian (Adjustment)</p>
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
              placeholder="Cari Ref No, SKU, Nama Produk, Catatan..."
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

          <div className="flex items-center gap-2 flex-wrap">
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

            <select
              value={mutationType}
              onChange={(e) => setMutationType(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="">Semua Tipe Mutasi</option>
              <option value="in">🟢 Stok Masuk (In)</option>
              <option value="out">🔴 Stok Keluar (Out)</option>
              <option value="transfer">🔵 Transfer Lokasi</option>
              <option value="adjustment">🟡 Penyesuaian (Adjustment)</option>
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
          <div className="grid grid-cols-5 gap-3.5 min-w-[900px] lg:min-w-0">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Total Transaksi Mutasi</span>
                <ArrowRightLeft size={15} className="text-blue-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-lg font-black text-slate-900 font-mono">{summary.total_movements}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Catatan Pergerakan</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Total Stok Masuk</span>
                <ArrowDownLeft size={15} className="text-emerald-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-lg font-black text-emerald-600 font-mono">+{summary.total_qty_in.toLocaleString('id-ID')}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Akumulasi Stock In</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Total Stok Keluar</span>
                <ArrowUpRight size={15} className="text-rose-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-lg font-black text-rose-600 font-mono">-{summary.total_qty_out.toLocaleString('id-ID')}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Akumulasi Stock Out</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Total Transfer Lokasi</span>
                <SlidersHorizontal size={15} className="text-indigo-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-lg font-black text-indigo-600 font-mono">{summary.total_qty_transfer.toLocaleString('id-ID')}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Qty Pindah Lokasi</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Penyesuaian Stok</span>
                <Package size={15} className="text-amber-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-lg font-black text-amber-600 font-mono">{summary.total_qty_adjustment.toLocaleString('id-ID')}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Qty Opname / Adjustment</span>
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
            <p className="font-mono text-xs">Memuat laporan mutasi stok...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ArrowRightLeft size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-600">Tidak ada riwayat mutasi stok ditemukan.</p>
            <p className="text-[11px]">Coba sesuaikan kata kunci pencarian, rentang tanggal, atau filter tipe mutasi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1200px]">
              <thead className="bg-slate-100/80 font-mono font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="py-3 px-3">Tanggal & Waktu</th>
                  <th className="py-3 px-3">No. Referensi</th>
                  <th className="py-3 px-3 text-center">Tipe Mutasi</th>
                  <th className="py-3 px-3">Kode SKU</th>
                  <th className="py-3 px-3">Nama Produk / Bahan</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3 text-center">Jumlah Qty</th>
                  <th className="py-3 px-3">Lokasi Asal</th>
                  <th className="py-3 px-3">Lokasi Tujuan</th>
                  <th className="py-3 px-3">Petugas</th>
                  <th className="py-3 px-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700">
                {paginatedRows.map((row) => {
                  const isIn = row.type === 'in';
                  const isOut = row.type === 'out';
                  const isTransfer = row.type === 'transfer';

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {row.movement_date}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {row.reference_number}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${isIn
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isOut
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isTransfer
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                        >
                          {row.type_label}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {row.sku}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {row.product_name}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {row.category_name}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-black text-sm whitespace-nowrap">
                        <span className={isIn ? 'text-emerald-600' : isOut ? 'text-rose-600' : 'text-slate-900'}>
                          {isIn ? '+' : isOut ? '-' : ''}{row.quantity.toLocaleString('id-ID')} {row.unit_code || row.unit_name}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {row.from_location}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {row.to_location}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {row.handled_by_name}
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-xs truncate" title={row.notes}>
                        {row.notes}
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
                Menampilkan <strong className="text-slate-800">{startIndex + 1}</strong> - <strong className="text-slate-800">{Math.min(startIndex + itemsPerPage, totalItems)}</strong> dari <strong className="text-slate-800">{totalItems}</strong> mutasi
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
