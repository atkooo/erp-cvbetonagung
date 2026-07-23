import React, { useState, useEffect } from 'react';
import {
  Coins,
  Printer,
  FileSpreadsheet,
  RefreshCw,
  Warehouse as WarehouseIcon,
  Layers,
  DollarSign,
  TrendingUp,
  Package,
} from 'lucide-react';
import {
  reportsApi,
  InventoryValuationData,
  InventoryValuationFilters,
} from '../../api';
import { productsApi } from '../../../products/api';
import { Category } from '../../../../types';

export default function InventoryValuationPanel() {
  const [data, setData] = useState<InventoryValuationData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const loadReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: InventoryValuationFilters = {};
      if (selectedCategory) filters.category_id = selectedCategory;

      const res = await reportsApi.getInventoryValuation(filters);
      setData(res);
    } catch (err: any) {
      console.error('Failed to fetch Inventory Valuation Report', err);
      setError(err?.response?.data?.message || 'Gagal memuat laporan valuasi stok gudang.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [selectedCategory]);

  useEffect(() => {
    productsApi.getCategories().then(setCategories).catch(() => { });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!data) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += '--- REKAP VALUASI PER GUDANG ---\n';
    csvContent += 'Gudang,Jumlah Item Produk,Total Qty Stok,Valuasi COGS (Rp),Valuasi Harga Jual (Rp),Potensi Margin (Rp)\n';

    data.by_warehouse.forEach((wh) => {
      csvContent += `"${wh.warehouse_name}",${wh.total_items},${wh.total_stock_qty},${wh.total_cogs_value},${wh.total_selling_value},${wh.potential_profit}\n`;
    });

    csvContent += '\n--- REKAP VALUASI PER KATEGORI PRODUK ---\n';
    csvContent += 'Kategori Produk,Jumlah Item Produk,Total Qty Stok,Valuasi COGS (Rp),Valuasi Harga Jual (Rp),Potensi Margin (Rp)\n';

    data.by_category.forEach((cat) => {
      csvContent += `"${cat.category_name}",${cat.total_items},${cat.total_stock_qty},${cat.total_cogs_value},${cat.total_selling_value},${cat.potential_profit}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Valuasi_Stok_${new Date().toISOString().slice(0, 10)}.csv`);
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
        <h1 className="text-xl font-bold text-slate-900">CV. BETON AGUNG — LAPORAN VALUASI STOK GUDANG & KATEGORI</h1>
        <p className="text-xs text-slate-600">Breakdown Nilai Aset Inventori Mengendap berdasarkan Lokasi Penyimpanan dan Kategori</p>
        <p className="text-[10px] text-slate-400 mt-1">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
      </div>

      {/* TOP ACTION & FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print-hide">

        {/* Category Filter */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700">Filter Kategori:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="">Semua Kategori Produk</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

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
            disabled={!data}
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
          <div className="grid grid-cols-4 gap-3.5 min-w-[800px] lg:min-w-0">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Total Fisik Stok</span>
                <Layers size={15} className="text-blue-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-lg font-black text-slate-900 font-mono">{summary.grand_total_qty.toLocaleString('id-ID')}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Seluruh Lokasi Penyimpanan</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Valuasi Modal (COGS)</span>
                <Coins size={15} className="text-amber-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-base font-black text-slate-900 font-mono truncate">{formatIDR(summary.grand_total_cogs_value)}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Nilai Modal HPP Inventori</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Valuasi Pasar (Jual)</span>
                <DollarSign size={15} className="text-emerald-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-base font-black text-emerald-600 font-mono truncate">{formatIDR(summary.grand_total_selling_value)}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Nilai Pasar Omset Jual</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold">Proyeksi Laba Kunci</span>
                <TrendingUp size={15} className="text-indigo-500 print-hide" />
              </div>
              <div className="mt-1">
                <h3 className="text-base font-black text-indigo-600 font-mono truncate">{formatIDR(summary.grand_potential_profit)}</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Potensi Laba Kotor (Margin)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ERROR DISPLAY */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-none text-rose-700 flex items-center gap-3 text-xs">
          <RefreshCw size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* TABLE 1: REKAP VALUASI PER GUDANG (rounded-none) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <WarehouseIcon size={16} className="text-blue-600" />
            Breakdown Valuasi per Lokasi Gudang
          </h3>
        </div>

        <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-mono text-xs">Memuat data valuasi gudang...</p>
            </div>
          ) : !data?.by_warehouse.length ? (
            <div className="p-8 text-center text-slate-400">Tidak ada data valuasi gudang.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[800px]">
                <thead className="bg-slate-100/80 font-mono font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200 whitespace-nowrap">
                  <tr>
                    <th className="py-3 px-3">Gudang / Lokasi Storage</th>
                    <th className="py-3 px-3 text-center">Jumlah Jenis Item</th>
                    <th className="py-3 px-3 text-center">Total Qty Stok</th>
                    <th className="py-3 px-3 text-right">Valuasi COGS (HPP)</th>
                    <th className="py-3 px-3 text-right">Valuasi Harga Jual</th>
                    <th className="py-3 px-3 text-right">Potensi Margin Laba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-700">
                  {data.by_warehouse.map((wh) => (
                    <tr key={wh.warehouse_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {wh.warehouse_name}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600 whitespace-nowrap">
                        {wh.total_items} item
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 whitespace-nowrap">
                        {wh.total_stock_qty.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                        {formatIDR(wh.total_cogs_value)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {formatIDR(wh.total_selling_value)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600 whitespace-nowrap">
                        {formatIDR(wh.potential_profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* TABLE 2: REKAP VALUASI PER KATEGORI (rounded-none) */}
      <div className="space-y-2 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Package size={16} className="text-indigo-600" />
            Breakdown Valuasi per Kategori Produk
          </h3>
        </div>

        <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-mono text-xs">Memuat data valuasi kategori...</p>
            </div>
          ) : !data?.by_category.length ? (
            <div className="p-8 text-center text-slate-400">Tidak ada data valuasi kategori.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[800px]">
                <thead className="bg-slate-100/80 font-mono font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200 whitespace-nowrap">
                  <tr>
                    <th className="py-3 px-3">Kategori Produk / Bahan</th>
                    <th className="py-3 px-3 text-center">Jumlah Jenis Item</th>
                    <th className="py-3 px-3 text-center">Total Qty Stok</th>
                    <th className="py-3 px-3 text-right">Valuasi COGS (HPP)</th>
                    <th className="py-3 px-3 text-right">Valuasi Harga Jual</th>
                    <th className="py-3 px-3 text-right">Potensi Margin Laba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-700">
                  {data.by_category.map((cat) => (
                    <tr key={cat.category_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {cat.category_name}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600 whitespace-nowrap">
                        {cat.total_items} item
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 whitespace-nowrap">
                        {cat.total_stock_qty.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                        {formatIDR(cat.total_cogs_value)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {formatIDR(cat.total_selling_value)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600 whitespace-nowrap">
                        {formatIDR(cat.potential_profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
