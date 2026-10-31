import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Receipt,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  Bluetooth,
  Printer,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Eye,
  ExternalLink,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import {
  convertSalesOrderToPosPrintInfo,
  printReceipt,
  downloadReceipt,
  printBluetoothReceipt,
} from './pos/PosPrintService';
import { getCompanyProfile, CompanyProfile } from '../../../utils/companyProfile';

interface PosHistoryViewProps {
  onTriggerNotification?: (message: string) => void;
  onNavigate?: (view: any) => void;
}

export default function PosHistoryView({ onTriggerNotification, onNavigate }: PosHistoryViewProps) {
  const navigate = useNavigate();
  const { authUser, triggerNotification: contextTriggerNotification } = useAuth();
  const notify = onTriggerNotification || contextTriggerNotification;

  // Data State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Company Profile for receipt printing
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(getCompanyProfile());
  const [stocks, setStocks] = useState<any[]>([]);

  useEffect(() => {
    const handleProfileUpdate = () => setCompanyProfile(getCompanyProfile());
    window.addEventListener('erp_company_profile_updated', handleProfileUpdate);

    // Fetch stocks for inventory comparison during print
    apiClient.get<{ data: any[] }>('/inventory/stocks?per_page=1000')
      .then(res => setStocks(res.data || []))
      .catch(() => setStocks([]));

    return () => window.removeEventListener('erp_company_profile_updated', handleProfileUpdate);
  }, []);

  const fetchTransactions = useCallback(async (
    page = currentPage,
    search = searchQuery,
    start = startDate,
    end = endDate,
    status = statusFilter,
    size = perPage
  ) => {
    setIsLoading(true);
    try {
      const qParam = search ? `&q=${encodeURIComponent(search)}` : '';
      const dateParams = (start && end) ? `&start_date=${start}&end_date=${end}` : '';
      const statusParam = status ? `&status=${status}` : '';

      const res = await apiClient.get<{ data: any[]; meta: any }>(
        `/sales/sales-orders?source=pos&include=customer,items.product.unit,invoices.payments,createdBy&per_page=${size}&sort=-created_at&page=${page}${qParam}${dateParams}${statusParam}`
      );

      setTransactions(res.data || []);
      setTotalPages(res.meta?.last_page || 1);
      setTotalRecords(res.meta?.total || (res.data?.length || 0));
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching POS transactions:', err);
      notify('Gagal memuat riwayat transaksi POS.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, startDate, endDate, statusFilter, perPage, notify]);

  useEffect(() => {
    fetchTransactions(1);
  }, [perPage]);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchTransactions(1, searchQuery, startDate, endDate, statusFilter, perPage);
  };

  const handleResetFilter = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    fetchTransactions(1, '', '', '', '', perPage);
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  };

  // Printing Handlers
  const handlePrintReceipt = (tx: any) => {
    const printInfo = convertSalesOrderToPosPrintInfo(tx);
    printReceipt(printInfo, companyProfile, stocks, notify);
  };

  const handleDownloadReceipt = (tx: any) => {
    const printInfo = convertSalesOrderToPosPrintInfo(tx);
    downloadReceipt(printInfo, companyProfile, stocks, notify);
  };

  const handleBluetoothReceipt = (tx: any) => {
    const printInfo = convertSalesOrderToPosPrintInfo(tx);
    printBluetoothReceipt(printInfo, companyProfile, stocks, notify);
  };

  // Quick stats calculation
  const stats = useMemo(() => {
    const totalRevenue = transactions.reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
    const completedCount = transactions.filter(tx => {
      const s = String(tx.status || '').toLowerCase();
      return s === 'completed' || s === 'selesai';
    }).length;
    const pendingCount = transactions.filter(tx => {
      const s = String(tx.status || '').toLowerCase();
      return s === 'pending_delivery' || s === 'processing' || s === 'diproses';
    }).length;

    return { totalRevenue, completedCount, pendingCount };
  }, [transactions]);

  const getStatusBadge = (tx: any) => {
    const rawStatus = String(tx.status || '').toLowerCase();

    if (rawStatus === 'completed' || rawStatus === 'selesai') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} />
          Selesai (Kasir)
        </span>
      );
    }
    if (rawStatus === 'pending_delivery') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock size={12} />
          Diantar (Delivery)
        </span>
      );
    }
    if (rawStatus === 'cancelled' || rawStatus === 'dibatalkan') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle size={12} />
          Dibatalkan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
        {tx.status || 'Diproses'}
      </span>
    );
  };

  const getPaymentMethod = (tx: any): string => {
    const invoices = tx.invoices || [];
    const payments = invoices.flatMap((inv: any) => inv.payments || []);
    if (payments.length > 0) {
      const methods = Array.from(new Set(payments.map((p: any) => p.payment_method || p.method).filter(Boolean)));
      if (methods.length > 0) return methods.join(', ');
    }
    return 'Tunai (Kasir)';
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate('pos');
              else navigate('/sales/pos');
            }}
            className="btn btn-secondary btn-md text-slate-600 hover:text-sky-700"
            title="Kembali ke Layar Kasir"
          >
            <ArrowLeft size={16} />
            <span>Kasir</span>
          </button>
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-2xs">
            <Receipt size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Riwayat Transaksi Kasir (POS)</h1>
            <p className="text-xs text-slate-500">Arsip penjualan langsung kasir toko dan cetak ulang struk nota belanja.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={() => fetchTransactions(currentPage)}
            disabled={isLoading}
            className="btn btn-secondary btn-md text-slate-700"
            title="Segarkan data"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate('pos');
              else navigate('/sales/pos');
            }}
            className="btn btn-primary btn-md shadow-xs shadow-sky-500/20"
          >
            <Calculator size={15} />
            <span>Buka Kasir</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Transaksi (Sesuai Filter)</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{totalRecords} <span className="text-xs font-normal text-slate-400">struk</span></h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <Receipt size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Nilai Penjualan (Halaman Ini)</p>
            <h3 className="text-2xl font-black text-sky-900 mt-0.5 font-mono">{formatRupiah(stats.totalRevenue)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Kategori Pemenuhan (Halaman Ini)</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                {stats.completedCount} Selesai
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                {stats.pendingCount} Diantar
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
            <Package size={20} />
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <form onSubmit={handleApplyFilter} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari nomor nota, pelanggan, atau nama kasir..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
            />
          </div>

          {/* Date Range */}
          <div className="md:col-span-4 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-sky-500 outline-none transition-all"
                title="Tanggal Mulai"
              />
            </div>
            <span className="text-slate-400 text-xs shrink-0">s/d</span>
            <div className="relative flex-1">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-sky-500 outline-none transition-all"
                title="Tanggal Akhir"
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-sky-500 outline-none transition-all cursor-pointer font-medium text-slate-700"
            >
              <option value="">Semua Status Operasional</option>
              <option value="completed">Selesai (Kasir Toko)</option>
              <option value="pending_delivery">Menunggu Pengiriman / Diantar</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
          {(searchQuery || startDate || endDate || statusFilter) && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="btn btn-secondary btn-sm text-slate-600"
            >
              Reset Filter
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary btn-sm shadow-xs shadow-sky-500/20"
          >
            <Filter size={13} />
            <span>Terapkan Filter</span>
          </button>
        </div>
      </form>

      {/* Transaction Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">No. Struk / Nota</th>
                <th className="py-3 px-4">Waktu Transaksi</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Kasir</th>
                <th className="py-3 px-4">Muatan Produk</th>
                <th className="py-3 px-4">Status & Metode</th>
                <th className="py-3 px-4 text-right">Total Bayar</th>
                <th className="py-3 px-4 text-center w-48">Aksi Cetak & Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-sky-600" />
                    <span>Memuat data riwayat transaksi kasir...</span>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <Package size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600 text-sm">Tidak ada transaksi ditemukan</p>
                    <p className="text-[11px] text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau rentang tanggal.</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx, idx) => {
                  const itemsCount = tx.items?.length || 0;
                  const totalPieces = (tx.items || []).reduce((acc: number, it: any) => acc + (Number(it.quantity) || 0), 0);
                  const cashier = tx.createdBy?.name || tx.created_by?.name || tx.created_by_user?.name || '-';

                  return (
                    <tr key={tx.id || idx} className="hover:bg-sky-50/40 transition-colors">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                        {(currentPage - 1) * perPage + idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => navigate(`/sales/order/${tx.id}`)}
                          className="font-bold font-mono text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-1 text-xs cursor-pointer"
                          title="Buka rincian Sales Order"
                        >
                          {tx.order_number || tx.orderNumber}
                          <ExternalLink size={11} className="opacity-60" />
                        </button>
                        {tx.notes && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1 max-w-xs">
                            Ket: {tx.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div className="font-medium">{tx.order_date || '-'}</div>
                        {tx.created_at && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{tx.customer?.name || tx.customerName || 'Pelanggan'}</div>
                        {tx.customer?.phone && (
                          <div className="text-[10px] text-slate-400 font-mono">{tx.customer.phone}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-medium text-slate-700">{cashier}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-700">{itemsCount} Macam Produk</div>
                        <div className="text-[10px] text-slate-400 font-mono">Total: {totalPieces} Unit/Pcs</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div>{getStatusBadge(tx)}</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {getPaymentMethod(tx)}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-black font-mono text-slate-900 text-sm">
                          {formatRupiah(Number(tx.total) || 0)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePrintReceipt(tx)}
                            className="btn btn-secondary btn-sm p-1.5 text-slate-700 hover:text-sky-700"
                            title="Cetak Struk Thermal (80mm)"
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(tx)}
                            className="btn btn-secondary btn-sm p-1.5 text-slate-700 hover:text-sky-700"
                            title="Unduh Struk PDF (80mm)"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBluetoothReceipt(tx)}
                            className="btn btn-secondary btn-sm p-1.5 text-blue-700 hover:bg-blue-50"
                            title="Cetak via Bluetooth ESC/POS"
                          >
                            <Bluetooth size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/sales/order/${tx.id}`)}
                            className="btn btn-secondary btn-sm p-1.5 text-sky-700 hover:bg-sky-50"
                            title="Lihat Detail Pesanan"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalRecords > 0 && (
          <div className="px-5 py-3 border-t border-slate-200/80 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              Menampilkan <strong className="text-slate-800">{(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, totalRecords)}</strong> dari <strong className="text-slate-800">{totalRecords}</strong> transaksi
            </div>

            <div className="flex items-center gap-3">
              {/* Per Page Selector */}
              <div className="flex items-center gap-1.5 text-slate-500">
                <span>Per hal:</span>
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:border-sky-500 outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Prev / Next Pagination */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fetchTransactions(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1 || isLoading}
                  className="btn btn-secondary btn-sm p-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft size={15} />
                </button>

                <div className="px-2 text-xs font-semibold text-slate-700 font-mono">
                  Hal {currentPage} / {totalPages}
                </div>

                <button
                  type="button"
                  onClick={() => fetchTransactions(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages || isLoading}
                  className="btn btn-secondary btn-sm p-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
