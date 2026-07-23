import React, { useState, useEffect } from 'react';
import {
  Wallet,
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
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  reportsApi,
  ApAgingData,
  ApPayableRow,
  ApAgingFilters,
} from '../../api';

interface ApAgingPanelProps {
  asOfDate?: string;
}

export default function ApAgingPanel({ asOfDate: globalAsOfDate }: ApAgingPanelProps) {
  const [data, setData] = useState<ApAgingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [asOfDate, setAsOfDate] = useState(globalAsOfDate || new Date().toISOString().slice(0, 10));

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

  useEffect(() => {
    if (globalAsOfDate) setAsOfDate(globalAsOfDate);
  }, [globalAsOfDate]);

  const loadReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: ApAgingFilters = { as_of_date: asOfDate };
      if (debouncedSearch.trim()) filters.search = debouncedSearch.trim();

      const res = await reportsApi.getApAgingReport(filters);
      setData(res);
    } catch (err: any) {
      console.error('Failed to fetch AP Aging Report', err);
      setError(err?.response?.data?.message || 'Gagal memuat laporan hutang jatuh tempo (AP Aging).');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadReport();
  }, [asOfDate, debouncedSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
    setCurrentPage(1);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!data?.payables || data.payables.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'No,No. Hutang / Faktur,No. PO,Kode Supplier,Nama Supplier,Tgl Faktur,Jatuh Tempo,Total Hutang (Rp),Sudah Dibayar (Rp),Sisa Outstanding (Rp),Keterlambatan (Hari),Kategori Age\n';

    data.payables.forEach((row, index) => {
      const line = [
        index + 1,
        `"${row.payable_number}"`,
        `"${row.po_number}"`,
        `"${row.supplier_code}"`,
        `"${row.supplier_name.replace(/"/g, '""')}"`,
        `"${row.created_at}"`,
        `"${row.due_date}"`,
        row.amount,
        row.paid_amount,
        row.outstanding,
        row.days_overdue,
        `"${row.bucket_label}"`,
      ].join(',');
      csvContent += line + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Hutang_AP_Aging_${asOfDate}.csv`);
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
  const buckets = data?.buckets;
  const payables = data?.payables || [];

  const totalItems = payables.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedRows = payables.slice(startIndex, startIndex + itemsPerPage);

  const bucketCards = [
    { key: 'current', label: 'Belum Jatuh Tempo', amount: buckets?.current || 0, color: 'border-blue-300 bg-blue-50 text-blue-800' },
    { key: '1_30', label: '1 - 30 Hari', amount: buckets?.['1_30'] || 0, color: 'border-amber-300 bg-amber-50 text-amber-800' },
    { key: '31_60', label: '31 - 60 Hari', amount: buckets?.['31_60'] || 0, color: 'border-orange-300 bg-orange-50 text-orange-800' },
    { key: '61_90', label: '61 - 90 Hari', amount: buckets?.['61_90'] || 0, color: 'border-rose-300 bg-rose-50 text-rose-800' },
    { key: 'over_90', label: '> 90 Hari (Kritis)', amount: buckets?.over_90 || 0, color: 'border-red-400 bg-red-100 text-red-900 font-bold' },
  ];

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
        <h1 className="text-xl font-bold text-slate-900">CV. BETON AGUNG — LAPORAN HUTANG JATUH TEMPO (AP AGING)</h1>
        <p className="text-xs text-slate-600">Analisis Umur Hutang Ke Supplier Per Tanggal Acuan {data?.as_of_date}</p>
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
              placeholder="Cari No. AP, PO, Nama Supplier..."
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
            <label className="text-xs font-bold text-slate-700">Per Tanggal:</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />

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
            disabled={!payables.length}
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

      {/* AP AGING BUCKETS CARDS */}
      {buckets && (
        <div className="overflow-x-auto pb-1">
          <div className="grid grid-cols-5 gap-3.5 min-w-[900px] lg:min-w-0">
            {bucketCards.map((b) => (
              <div key={b.key} className={`p-3.5 rounded-xl border shadow-sm flex flex-col justify-between ${b.color}`}>
                <div className="flex items-center justify-between opacity-80 mb-1">
                  <span className="text-[10px] uppercase font-mono font-bold">{b.label}</span>
                  <Clock size={14} className="print-hide" />
                </div>
                <div className="mt-1">
                  <h3 className="text-base font-black font-mono truncate">{formatIDR(b.amount)}</h3>
                  <span className="text-[10px] opacity-75 block mt-0.5">
                    {summary?.total_outstanding_ap ? `${((b.amount / summary.total_outstanding_ap) * 100).toFixed(1)}% dari total AP` : '0%'}
                  </span>
                </div>
              </div>
            ))}
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
            <p className="font-mono text-xs">Memuat laporan AP aging hutang...</p>
          </div>
        ) : payables.length === 0 ? (
          <div className="p-12 text-center text-emerald-600 space-y-2">
            <Wallet size={32} className="mx-auto text-emerald-500 mb-2" />
            <p className="font-bold">Tidak ada hutang (AP) outstanding yang belum lunas!</p>
            <p className="text-[11px] text-slate-500">Semua kewajiban pembayaran ke supplier dalam posisi Lunas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1100px]">
              <thead className="bg-slate-100/80 font-mono font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="py-3 px-3">No. Hutang / PO</th>
                  <th className="py-3 px-3">Kode Supplier</th>
                  <th className="py-3 px-3">Nama Supplier</th>
                  <th className="py-3 px-3 text-center">Tgl Faktur</th>
                  <th className="py-3 px-3 text-center">Jatuh Tempo</th>
                  <th className="py-3 px-3 text-right">Total Hutang (Rp)</th>
                  <th className="py-3 px-3 text-right">Sudah Dibayar (Rp)</th>
                  <th className="py-3 px-3 text-right">Sisa AP (Rp)</th>
                  <th className="py-3 px-3 text-center">Keterlambatan</th>
                  <th className="py-3 px-3 text-center">Kategori Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700">
                {paginatedRows.map((row) => {
                  const isOverdue = row.days_overdue > 0;
                  const isCritical = row.days_overdue > 90;

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {row.payable_number}
                        {row.po_number !== row.payable_number && (
                          <span className="block text-[10px] text-slate-400 font-normal">PO: {row.po_number}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {row.supplier_code}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {row.supplier_name}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600 whitespace-nowrap">
                        {row.created_at}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-800 whitespace-nowrap">
                        {row.due_date}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-800 whitespace-nowrap">
                        {formatIDR(row.amount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-700 whitespace-nowrap">
                        {formatIDR(row.paid_amount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-rose-600 text-sm whitespace-nowrap">
                        {formatIDR(row.outstanding)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold whitespace-nowrap">
                        <span className={isCritical ? 'text-red-700' : isOverdue ? 'text-rose-600' : 'text-slate-600'}>
                          {isOverdue ? `${row.days_overdue} hari` : 'Belum'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isCritical
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : isOverdue
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                        >
                          {isOverdue && <AlertTriangle size={11} className="print-hide" />}
                          <span>{row.bucket_label}</span>
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
                Menampilkan <strong className="text-slate-800">{startIndex + 1}</strong> - <strong className="text-slate-800">{Math.min(startIndex + itemsPerPage, totalItems)}</strong> dari <strong className="text-slate-800">{totalItems}</strong> hutang AP
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
