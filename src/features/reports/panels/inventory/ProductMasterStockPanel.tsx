import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Coins,
  DollarSign,
  ArrowUpRight,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X
} from 'lucide-react';
import {
  reportsApi,
  ProductMasterStockData,
  ProductMasterStockItem,
  ProductMasterStockFilters
} from '../../api';
import { productsApi } from '../../../products/api';
import { Category } from '../../../../types';

export default function ProductMasterStockPanel() {
  const [data, setData] = useState<ProductMasterStockData | null>(null);
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

  // Debounce search input for instant real-time filtering
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
      const filters: ProductMasterStockFilters = {};
      if (debouncedSearch.trim()) filters.search = debouncedSearch.trim();
      if (selectedCategory) filters.category_id = selectedCategory;
      if (stockStatus) filters.stock_status = stockStatus;

      const res = await reportsApi.getProductMasterStock(filters);
      setData(res);
    } catch (err: any) {
      console.error('Failed to fetch Product Master Stock Report', err);
      setError(err?.response?.data?.message || 'Gagal memuat laporan master produk & stok.');
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

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const handleExportExcel = () => {
    if (!data || !data.rows.length) return;

    const exportDate = new Date().toLocaleString('id-ID');
    const summary = data.summary;

    let excelHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Master Stok Produk</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; }
          .title { font-size: 16px; font-weight: bold; color: #0f172a; }
          .subtitle { font-size: 11px; color: #475569; }
          .header-table th { background-color: #1e293b; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0f172a; padding: 6px; }
          .data-table td { border: 1px solid #cbd5e1; padding: 5px; vertical-align: middle; }
          .kpi-table td { border: 1px solid #e2e8f0; padding: 6px; background-color: #f8fafc; font-weight: bold; }
          .number { text-align: right; mso-number-format: "\\#\\,\\#\\#0"; }
          .currency { text-align: right; mso-number-format: "\\"Rp\\"\\ \\#\\,\\#\\#0"; }
          .percentage { text-align: right; mso-number-format: "0\\.00%"; }
          .center { text-align: center; }
          .total-row td { background-color: #e2e8f0; font-weight: bold; border-top: 2px solid #0f172a; }
          .badge-aman { color: #15803d; font-weight: bold; }
          .badge-menipis { color: #b45309; font-weight: bold; }
          .badge-habis { color: #b91c1c; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="16" class="title">CV. BETON AGUNG — LAPORAN MASTER PRODUK & STOK</td></tr>
          <tr><td colspan="16" class="subtitle">Laporan Komprehensif Stok, HPP (COGS), Harga Jual, Margin & Valuasi</td></tr>
          <tr><td colspan="16" class="subtitle">Tanggal Ekspor: ${exportDate}</td></tr>
          <tr><td colspan="16"></td></tr>
        </table>

        <table class="kpi-table">
          <tr>
            <td colspan="3">Total Jenis Produk: ${summary.total_products} Item</td>
            <td colspan="3">Total Fisik Stok: ${summary.total_stock_qty.toLocaleString('id-ID')}</td>
            <td colspan="3">Valuasi Stok COGS: ${formatIDR(summary.total_cogs_value)}</td>
            <td colspan="4">Valuasi Stok Jual: ${formatIDR(summary.total_selling_value)}</td>
            <td colspan="3">Potensi Laba Stok: ${formatIDR(summary.total_potential_profit)}</td>
          </tr>
          <tr>
            <td colspan="8">Alert Stok Menipis: ${summary.low_stock_count} Produk</td>
            <td colspan="8">Alert Stok Habis: ${summary.out_of_stock_count} Produk</td>
          </tr>
        </table>
        <br>

        <table class="data-table" border="1">
          <thead>
            <tr class="header-table">
              <th style="width: 40px;">No</th>
              <th style="width: 110px;">Kode SKU</th>
              <th style="width: 220px;">Nama Produk</th>
              <th style="width: 140px;">Kategori</th>
              <th style="width: 100px;">Tipe</th>
              <th style="width: 70px;">Satuan</th>
              <th style="width: 90px;">Stok Total</th>
              <th style="width: 80px;">Min. Stok</th>
              <th style="width: 120px;">Harga Beli (COGS)</th>
              <th style="width: 120px;">Harga Jual</th>
              <th style="width: 110px;">Margin / Unit (Rp)</th>
              <th style="width: 90px;">Margin (%)</th>
              <th style="width: 130px;">Valuasi COGS (Rp)</th>
              <th style="width: 130px;">Valuasi Jual (Rp)</th>
              <th style="width: 130px;">Potensi Laba (Rp)</th>
              <th style="width: 100px;">Status Stok</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.rows.forEach((r, idx) => {
      const statusClass = r.stock_status === 'aman' ? 'badge-aman' : r.stock_status === 'menipis' ? 'badge-menipis' : 'badge-habis';

      excelHTML += `
        <tr>
          <td class="center">${idx + 1}</td>
          <td>${r.sku || ''}</td>
          <td>${r.name || ''}</td>
          <td>${r.category_name || '-'}</td>
          <td class="center">${(r.type || '-').replace('_', ' ')}</td>
          <td class="center">${r.unit_name || '-'}</td>
          <td class="number">${r.total_stock}</td>
          <td class="number">${r.min_stock}</td>
          <td class="currency">${r.cost_price}</td>
          <td class="currency">${r.selling_price}</td>
          <td class="currency">${r.margin_amount}</td>
          <td class="percentage">${(r.margin_percentage / 100).toFixed(4)}</td>
          <td class="currency">${r.stock_value_cogs}</td>
          <td class="currency">${r.stock_value_selling}</td>
          <td class="currency">${r.potential_profit}</td>
          <td class="center ${statusClass}">${r.stock_status_label}</td>
        </tr>
      `;
    });

    excelHTML += `
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="6" class="center">TOTAL KESELURUHAN (${data.rows.length} Produk)</td>
              <td class="number">${summary.total_stock_qty}</td>
              <td class="center">-</td>
              <td class="center">-</td>
              <td class="center">-</td>
              <td class="center">-</td>
              <td class="center">-</td>
              <td class="currency">${summary.total_cogs_value}</td>
              <td class="currency">${summary.total_selling_value}</td>
              <td class="currency">${summary.total_potential_profit}</td>
              <td class="center">-</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHTML], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Master_Stok_Produk_CV_Beton_Agung_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!data || !data.rows.length) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const exportDate = new Date().toLocaleString('id-ID');
    const summary = data.summary;

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Master Produk & Stok — CV. Beton Agung</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #0f172a; margin: 0; padding: 12px; }
          .title { font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 2px; }
          .subtitle { font-size: 10px; color: #475569; margin-bottom: 4px; }
          .header-box { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
          .kpi-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 9px; }
          .kpi-table td { border: 1px solid #cbd5e1; padding: 6px 8px; background-color: #f8fafc; font-weight: bold; }
          .kpi-label { color: #64748b; font-size: 8px; text-transform: uppercase; display: block; margin-bottom: 2px; }
          .data-table { width: 100%; border-collapse: collapse; font-size: 8.5px; }
          .data-table th { background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0f172a; padding: 5px 4px; text-transform: uppercase; font-size: 8px; }
          .data-table td { border: 1px solid #cbd5e1; padding: 4px 5px; vertical-align: middle; }
          .number { text-align: right; font-family: monospace; }
          .currency { text-align: right; font-family: monospace; font-weight: 500; }
          .center { text-align: center; }
          .total-row td { background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #0f172a; font-family: monospace; }
          .badge-aman { color: #15803d; font-weight: bold; }
          .badge-menipis { color: #b45309; font-weight: bold; }
          .badge-habis { color: #b91c1c; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="title">CV. BETON AGUNG — LAPORAN MASTER PRODUK & STOK</div>
          <div class="subtitle">Laporan Komprehensif Stok, HPP (COGS), Harga Jual, Margin & Valuasi</div>
          <div class="subtitle">Tanggal Ekspor Cetak: ${exportDate}</div>
        </div>

        <table class="kpi-table">
          <tr>
            <td><span class="kpi-label">Total Jenis Produk</span>${summary.total_products} Item</td>
            <td><span class="kpi-label">Total Fisik Stok</span>${summary.total_stock_qty.toLocaleString('id-ID')}</td>
            <td><span class="kpi-label">Valuasi Stok COGS</span>${formatIDR(summary.total_cogs_value)}</td>
            <td><span class="kpi-label">Valuasi Stok Jual</span>${formatIDR(summary.total_selling_value)}</td>
            <td><span class="kpi-label">Potensi Laba Stok</span>${formatIDR(summary.total_potential_profit)}</td>
            <td><span class="kpi-label">Alert Menipis / Habis</span>Menipis: ${summary.low_stock_count} | Habis: ${summary.out_of_stock_count}</td>
          </tr>
        </table>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 25px;">No</th>
              <th style="width: 85px;">Kode SKU</th>
              <th>Nama Produk</th>
              <th style="width: 100px;">Kategori</th>
              <th style="width: 75px;">Tipe</th>
              <th style="width: 50px;">Satuan</th>
              <th style="width: 60px;">Stok</th>
              <th style="width: 50px;">Min</th>
              <th style="width: 85px;">Harga Beli (COGS)</th>
              <th style="width: 85px;">Harga Jual</th>
              <th style="width: 80px;">Margin (Rp)</th>
              <th style="width: 55px;">Margin %</th>
              <th style="width: 95px;">Valuasi COGS</th>
              <th style="width: 95px;">Valuasi Jual</th>
              <th style="width: 95px;">Potensi Laba</th>
              <th style="width: 65px;">Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.rows.forEach((r, idx) => {
      const statusClass = r.stock_status === 'aman' ? 'badge-aman' : r.stock_status === 'menipis' ? 'badge-menipis' : 'badge-habis';

      htmlContent += `
        <tr>
          <td class="center">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold;">${r.sku || ''}</td>
          <td style="font-weight: 600;">${r.name || ''}</td>
          <td>${r.category_name || '-'}</td>
          <td class="center">${(r.type || '-').replace('_', ' ')}</td>
          <td class="center">${r.unit_name || '-'}</td>
          <td class="number" style="font-weight: bold;">${r.total_stock.toLocaleString('id-ID')}</td>
          <td class="number" style="color: #64748b;">${r.min_stock}</td>
          <td class="currency">${formatIDR(r.cost_price)}</td>
          <td class="currency" style="font-weight: bold;">${formatIDR(r.selling_price)}</td>
          <td class="currency" style="color: ${r.margin_amount >= 0 ? '#16a34a' : '#dc2626'};">${formatIDR(r.margin_amount)}</td>
          <td class="number" style="font-weight: 600;">${r.margin_percentage}%</td>
          <td class="currency">${formatIDR(r.stock_value_cogs)}</td>
          <td class="currency" style="color: #15803d; font-weight: bold;">${formatIDR(r.stock_value_selling)}</td>
          <td class="currency" style="color: #2563eb; font-weight: bold;">${formatIDR(r.potential_profit)}</td>
          <td class="center ${statusClass}">${r.stock_status_label}</td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="6" class="center">TOTAL KESELURUHAN (${data.rows.length} Produk)</td>
              <td class="number" style="color: #4338ca;">${summary.total_stock_qty.toLocaleString('id-ID')}</td>
              <td class="center">—</td>
              <td class="center">—</td>
              <td class="center">—</td>
              <td class="center">—</td>
              <td class="center">—</td>
              <td class="currency">${formatIDR(summary.total_cogs_value)}</td>
              <td class="currency" style="color: #15803d;">${formatIDR(summary.total_selling_value)}</td>
              <td class="currency" style="color: #2563eb;">${formatIDR(summary.total_potential_profit)}</td>
              <td class="center">—</td>
            </tr>
          </tfoot>
        </table>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
        <h1 className="text-xl font-bold text-slate-900">CV. BETON AGUNG — LAPORAN MASTER PRODUK & STOK</h1>
        <p className="text-xs text-slate-600">Laporan Komprehensif Stok, COGS (HPP), Harga Jual, Margin & Valuasi</p>
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
              <option value="">Semua Status Stok</option>
              <option value="aman">🟢 Stok Aman</option>
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

        {/* Action Triggers (Refresh, Excel, Print) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadReport}
            disabled={isLoading}
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
            title="Ekspor Format Excel (.xls) Terstruktur"
          >
            <FileSpreadsheet size={14} />
            <span>Excel (.xls)</span>
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
          <div className="grid grid-cols-6 gap-3.5 min-w-[1050px] lg:min-w-0">
            {/* Total Product Count */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Total Jenis Produk</span>
                <Package size={15} className="text-blue-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-lg font-black text-slate-900 font-mono">{summary.total_products}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Item Terdaftar</span>
              </div>
            </div>

            {/* Total Stock Quantity */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Total Fisik Stok</span>
                <Layers size={15} className="text-indigo-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-lg font-black text-indigo-600 font-mono">{summary.total_stock_qty.toLocaleString('id-ID')}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Akumulasi Seluruh Lokasi</span>
              </div>
            </div>

            {/* Valuasi COGS (HPP / Beli) */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Valuasi Stok (COGS)</span>
                <Coins size={15} className="text-amber-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-sm md:text-base font-black text-slate-900 font-mono truncate">{formatIDR(summary.total_cogs_value)}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Total Modal HPP</span>
              </div>
            </div>

            {/* Valuasi Selling Price (Jual) */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Valuasi Stok (Jual)</span>
                <DollarSign size={15} className="text-emerald-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-sm md:text-base font-black text-emerald-600 font-mono truncate">{formatIDR(summary.total_selling_value)}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Total Harga Jual Pasar</span>
              </div>
            </div>

            {/* Potensi Margin Laba */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Potensi Margin Laba</span>
                <TrendingUp size={15} className="text-blue-600 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-sm md:text-base font-black text-blue-600 font-mono truncate">{formatIDR(summary.total_potential_profit)}</h3>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5">
                  <ArrowUpRight size={11} className="print-hide" /> Proyeksi keuntungan
                </span>
              </div>
            </div>

            {/* Alert Status Menipis / Habis */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Alert Stok Alert</span>
                <AlertTriangle size={15} className="text-rose-500 print-hide" />
              </div>
              <div className="mt-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-amber-600">Menipis: {summary.low_stock_count}</span>
                  <span className="text-xs font-bold text-rose-600">Habis: {summary.out_of_stock_count}</span>
                </div>
                <span className="text-[9px] text-slate-400 block mt-0.5">Memerlukan Restock Segera</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-700 flex items-center gap-3 text-xs">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* MAIN DATA TABLE */}
      <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-mono text-xs">Memuat laporan master produk & stok dari database...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Package size={36} className="mx-auto text-slate-300 stroke-[1.5]" />
            <p className="font-bold text-slate-700 text-sm">Tidak Ada Data Produk Ditemukan</p>
            <p className="text-xs text-slate-400">Coba ubah filter pencarian atau kategori di bagian atas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs min-w-[1300px]">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] uppercase font-mono font-bold text-slate-600 tracking-wider whitespace-nowrap">
                  <th className="py-3 px-3">Kode SKU</th>
                  <th className="py-3 px-3">Nama Produk</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3 text-center">Tipe</th>
                  <th className="py-3 px-3 text-center">Satuan</th>
                  <th className="py-3 px-3 text-center">Stok Total</th>
                  <th className="py-3 px-3 text-center">Min. Stok</th>
                  <th className="py-3 px-3 text-right">Harga Beli (COGS)</th>
                  <th className="py-3 px-3 text-right">Harga Jual</th>
                  <th className="py-3 px-3 text-right">Margin / Unit</th>
                  <th className="py-3 px-3 text-right">Valuasi COGS</th>
                  <th className="py-3 px-3 text-right">Valuasi Jual</th>
                  <th className="py-3 px-3 text-center">Status Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700">
                {paginatedRows.map((product) => {
                  const isAman = product.stock_status === 'aman';
                  const isMenipis = product.stock_status === 'menipis';
                  const isHabis = product.stock_status === 'habis';

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Kode SKU */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {product.sku}
                      </td>

                      {/* Nama Produk */}
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {product.name}
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {product.category_name || '-'}
                      </td>

                      {/* Tipe */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono inline-block">
                          {product.type.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Satuan */}
                      <td className="py-3 px-3 text-center font-mono text-slate-700 whitespace-nowrap">
                        {product.unit_name || product.unit_code ? `${product.unit_name || '-'} (${product.unit_code || '-'})` : '-'}
                      </td>

                      {/* Stok Total */}
                      <td className="py-3 px-3 text-center font-mono">
                        <span className="font-black text-sm text-slate-900">
                          {product.total_stock.toLocaleString('id-ID')}
                        </span>
                      </td>

                      {/* Min. Stok */}
                      <td className="py-3 px-3 text-center font-mono text-slate-500">
                        {product.min_stock}
                      </td>

                      {/* Cost Price / COGS */}
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                        {formatIDR(product.cost_price)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatIDR(product.selling_price)}
                      </td>

                      {/* Margin per Unit */}
                      <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                        <div className={`font-bold ${product.margin_amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatIDR(product.margin_amount)}
                        </div>
                        <span className={`text-[9px] px-1 rounded font-sans font-semibold inline-block ${product.margin_percentage >= 20 ? 'bg-emerald-50 text-emerald-700' : product.margin_percentage >= 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                          {product.margin_percentage}%
                        </span>
                      </td>

                      {/* Valuasi COGS */}
                      <td className="py-3 px-3 text-right font-mono text-slate-700 font-medium whitespace-nowrap">
                        {formatIDR(product.stock_value_cogs)}
                      </td>

                      {/* Valuasi Selling */}
                      <td className="py-3 px-3 text-right font-mono text-emerald-700 font-bold whitespace-nowrap">
                        {formatIDR(product.stock_value_selling)}
                      </td>

                      {/* Stock Status Badge */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isAman
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isMenipis
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                        >
                          {isAman && <CheckCircle2 size={11} className="print-hide" />}
                          {isMenipis && <AlertTriangle size={11} className="print-hide" />}
                          {isHabis && <XCircle size={11} className="print-hide" />}
                          <span>{product.stock_status_label}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* TABLE FOOTER TOTALS */}
              <tfoot className="bg-slate-100/90 font-mono font-bold text-slate-900 border-t-2 border-slate-300 whitespace-nowrap">
                <tr>
                  <td colSpan={5} className="py-3 px-3 uppercase text-[10px] tracking-wider">
                    TOTAL KESELURUHAN LAPORAN ({rows.length} Produk)
                  </td>
                  <td className="py-3 px-3 text-center text-sm text-indigo-700">
                    {summary?.total_stock_qty.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-400">—</td>
                  <td className="py-3 px-3 text-right text-slate-400">—</td>
                  <td className="py-3 px-3 text-right text-slate-400">—</td>
                  <td className="py-3 px-3 text-right text-slate-400">—</td>
                  <td className="py-3 px-3 text-right text-slate-900">
                    {formatIDR(summary?.total_cogs_value || 0)}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-700 text-sm">
                    {formatIDR(summary?.total_selling_value || 0)}
                  </td>
                  <td className="py-3 px-3 text-center text-blue-700 text-xs">
                    Potensi Margin: {formatIDR(summary?.total_potential_profit || 0)}
                  </td>
                </tr>
              </tfoot>
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
