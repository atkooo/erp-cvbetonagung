/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  ChevronRight,
  X,
  Clock,
  HelpCircle,
  FileText,
  Send,
  Check,
  Printer,
  XCircle,
} from "@/src/components/icons";
import Swal from 'sweetalert2';
import { authStorage, apiClient } from "../services/api";
import { salesApi } from "../features/sales/api";
import { DeliveryOrder, SalesOrder } from "../types";
import { SkeletonTable, SkeletonCard, ErrorCard } from "./Skeleton";
import SearchableSelect from "./SearchableSelect";
import { getCompanyProfile, formatAddressForPrint, CompanyProfile } from '../utils/companyProfile';

interface DeliveryOrdersViewProps {
  onTriggerNotification: (message: string) => void;
  onNavigate?: (view: string) => void;
}

interface StorageLocationOption {
  id: string;
  name: string;
  code: string;
  warehouse?: {
    name: string;
  };
}

export default function DeliveryOrdersView({
  onTriggerNotification,
  onNavigate,
}: DeliveryOrdersViewProps) {
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [storageLocations, setStorageLocations] = useState<
    StorageLocationOption[]
  >([]);
  const [allStocks, setAllStocks] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(getCompanyProfile());

  useEffect(() => {
    const handleProfileUpdate = () => {
      setCompanyProfile(getCompanyProfile());
    };
    window.addEventListener('erp_company_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('erp_company_profile_updated', handleProfileUpdate);
  }, []);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDo, setSelectedDo] = useState<DeliveryOrder | null>(null);
  const [printDoId, setPrintDoId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Create DO form states
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState("");
  const [deliveryNumber, setDeliveryNumber] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");

  // Ship DO form states
  const [selectedLocationId, setSelectedLocationId] = useState("");

  // Receive DO form states
  const [receiverName, setReceiverName] = useState("");
  const printDo = deliveryOrders.find((item) => item.id === printDoId) || null;
  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: printDo?.deliveryNumber || "surat-jalan",
  });

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [dos, sos, locs, stocksRes] = await Promise.all([
        salesApi.getDeliveryOrders(),
        salesApi.getSalesOrders(),
        apiClient.get<{ data: StorageLocationOption[] }>(
          "/master-data/storage-locations",
        ),
        apiClient.get<{ data: any[] }>("/inventory/stocks"),
      ]);
      setDeliveryOrders(dos);
      setSalesOrders(sos);
      setStorageLocations(locs.data || []);
      setAllStocks(stocksRes.data || []);
    } catch (err) {
      console.error("Failed to load delivery order resources", err);
      const msg =
        err instanceof Error ? err.message : "Gagal mengambil data surat jalan";
      setErrorMessage(msg);
      onTriggerNotification(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Workflow shortcut effect
  useEffect(() => {
    const pendingSalesOrderId = sessionStorage.getItem('action_create_do');
    if (pendingSalesOrderId) {
      sessionStorage.removeItem('action_create_do');
      setTimeout(() => {
        handleOpenCreateModal();
        setSelectedSalesOrderId(pendingSalesOrderId);
      }, 500);
    }
  }, []);

  const handleOpenCreateModal = () => {
    // Generate auto DO number
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    setDeliveryNumber(`DO-${dateStr}-${randomSuffix}`);
    setSelectedSalesOrderId("");
    setDeliveryDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setIsCreateModalOpen(true);
  };

  const handleCreateDo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSalesOrderId || !deliveryNumber) {
      onTriggerNotification("Pilih Sales Order dan isi nomor surat jalan.");
      return;
    }

    try {
      const created = await salesApi.createDeliveryOrder(selectedSalesOrderId, {
        delivery_number: deliveryNumber,
        delivery_date: deliveryDate,
        notes,
      });
      setDeliveryOrders((prev) => [created, ...prev]);
      onTriggerNotification(`Surat Jalan ${deliveryNumber} berhasil dibuat`);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      console.error("Failed to create delivery order", err);
      const msg = err.message || "Gagal membuat surat jalan. Pastikan order belum memiliki DO.";
      onTriggerNotification(msg);
    }
  };

  const handleSetReadyToLoad = async (doOrder: DeliveryOrder) => {
    try {
      await salesApi.updateDeliveryOrderStatus(doOrder.id, {
        status: 'ready_to_load',
        notes: doOrder.notes ? `${doOrder.notes}\n[Sistem]: Ditandai Siap Muat manual` : '[Sistem]: Ditandai Siap Muat manual'
      });
      onTriggerNotification(`Delivery Order ${doOrder.deliveryNumber} berhasil disiapkan untuk muat.`);
      fetchData();
    } catch (error: any) {
      console.error('Error setting DO to ready:', error);
      const msg = error.message || 'Gagal menyiapkan Delivery Order.';
      onTriggerNotification(msg);
    }
  };

  const handleOpenShipModal = (doOrder: DeliveryOrder) => {
    setSelectedDo(doOrder);
    setSelectedLocationId(storageLocations[0]?.id || "");
    setIsShipModalOpen(true);
  };

  const handleShipDo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDo || !selectedLocationId) return;

    try {
      const updated = await salesApi.shipDeliveryOrder(selectedDo.id, {
        from_location_id: selectedLocationId,
        movement_at: new Date().toISOString(),
      });
      setDeliveryOrders((prev) =>
        prev.map((item) => (item.id === selectedDo.id ? updated : item)),
      );
      onTriggerNotification(
        `Surat Jalan ${selectedDo.deliveryNumber} status diubah ke: Dikirim`,
      );
      setIsShipModalOpen(false);

      // Auto-print after shipping
      handlePrintDo(updated);
    } catch (err) {
      console.error("Failed to ship delivery order", err);
      onTriggerNotification(
        "Gagal memproses pengiriman. Cek saldo stok gudang!",
      );
    }
  };

  const handleOpenReceiveModal = (doOrder: DeliveryOrder) => {
    setSelectedDo(doOrder);
    setReceiverName("");
    setIsReceiveModalOpen(true);
  };

  const handleReceiveDo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDo || !receiverName) {
      onTriggerNotification("Isi nama penerima barang.");
      return;
    }

    try {
      const updated = await salesApi.updateDeliveryOrderStatus(selectedDo.id, {
        status: "received",
        receiver_name: receiverName,
        received_at: new Date().toISOString(),
      });
      setDeliveryOrders((prev) =>
        prev.map((item) => (item.id === selectedDo.id ? updated : item)),
      );
      onTriggerNotification(
        `Surat Jalan ${selectedDo.deliveryNumber} dikonfirmasi Diterima oleh ${receiverName}`,
      );
      setIsReceiveModalOpen(false);
    } catch (err) {
      console.error("Failed to mark delivery order as received", err);
      onTriggerNotification("Gagal mengupdate status surat jalan.");
    }
  };

  const handlePrintDo = (doOrder: DeliveryOrder) => {
    setPrintDoId(doOrder.id);
    onTriggerNotification(
      `Surat Jalan ${doOrder.deliveryNumber} disiapkan untuk dicetak. Membuka print layout...`,
    );
    setTimeout(() => handlePrintAction(), 150);
  };

  const handleCancelDo = async (doId: string, doNum: string) => {
    const { value: reason } = await Swal.fire({
      title: `Batalkan Surat Jalan ${doNum}?`,
      text: "Apakah Anda yakin? Masukkan alasan pembatalan:",
      input: 'text',
      inputPlaceholder: 'Misal: Salah alamat',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Batalkan',
      cancelButtonText: 'Kembali',
      inputValidator: (value) => {
        if (!value) {
          return 'Alasan pembatalan wajib diisi!';
        }
      }
    });

    if (reason) {
      try {
        await salesApi.cancelDeliveryOrder(doId, reason);
        onTriggerNotification(`Surat Jalan ${doNum} berhasil dibatalkan`);
        setIsDetailModalOpen(false);
        fetchData();
      } catch (err: any) {
        console.error("Failed to cancel Delivery Order", err);
        const msg = err.response?.data?.message || err.message || "Gagal membatalkan Surat Jalan";
        Swal.fire('Gagal!', msg, 'error');
      }
    }
  };

  // Filters & Counts
  const totalDos = deliveryOrders.length;
  const countReady = deliveryOrders.filter(
    (d) => d.status === "ready_to_load",
  ).length;
  const countShipped = deliveryOrders.filter(
    (d) => d.status === "shipped",
  ).length;
  const countReceived = deliveryOrders.filter(
    (d) => d.status === "received",
  ).length;

  const filteredOrders = deliveryOrders.filter(
    (d) =>
      d.deliveryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.customer?.name &&
        d.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.salesOrder?.orderNumber &&
        d.salesOrder.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Banner */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
            <Truck size={20} />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-slate-800 flex items-center gap-2">
              Delivery Order / Surat Jalan
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Buat dokumen surat jalan resmi dari Sales Order, lakukan shipment
              untuk mengurangi stok secara live, dan catat bukti terima barang.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-md flex items-center justify-center gap-2 shrink-0 transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={14} />
          <span>Buat Surat Jalan</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <SkeletonCard count={4} />
          <SkeletonTable rows={5} cols={8} />
        </div>
      ) : errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={fetchData} />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                  Total Pengiriman
                </span>
                <h4 className="text-lg font-black text-slate-800 mt-1">
                  {totalDos} Surat
                </h4>
              </div>
              <div className="p-2.5 bg-slate-50 text-slate-500 rounded-lg">
                <Truck size={18} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                  Siap Muat
                </span>
                <h4 className="text-lg font-black text-cyan-600 mt-1">
                  {countReady} Surat
                </h4>
              </div>
              <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg">
                <Clock size={18} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                  Dalam Pengiriman
                </span>
                <h4 className="text-lg font-black text-amber-600 mt-1">
                  {countShipped} Surat
                </h4>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                <Send size={18} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                  Sudah Diterima
                </span>
                <h4 className="text-lg font-black text-emerald-600 mt-1">
                  {countReceived} Surat
                </h4>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckCircle2 size={18} />
              </div>
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search
                  className="absolute left-3 top-2.5 text-slate-400"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Cari no. DO, customer, sales order..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Menampilkan {filteredOrders.length} dari {totalDos} data surat
                jalan
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-225">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                    <th className="p-3.5 pl-5">No Surat Jalan</th>
                    <th className="p-3.5">Sales Order</th>
                    <th className="p-3.5">Customer / Relasi</th>
                    <th className="p-3.5">Tanggal Muat</th>
                    <th className="p-3.5">Nama Penerima</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((doOrder) => (
                    <tr
                      key={doOrder.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-3.5 pl-5 font-mono font-bold text-cyan-600">
                        {doOrder.deliveryNumber}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {doOrder.salesOrder?.orderNumber || "-"}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {doOrder.customer?.name}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {doOrder.deliveryDate}
                      </td>
                      <td className="p-3.5 font-mono text-slate-650 text-slate-700">
                        {doOrder.receiverName ? (
                          <div>
                            <div className="font-bold text-slate-800">
                              {doOrder.receiverName}
                            </div>
                            {doOrder.receivedAt && (
                              <div className="text-[9px] text-slate-400 font-mono">
                                Tgl: {doOrder.receivedAt}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${doOrder.status === "draft"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : doOrder.status === "ready_to_load"
                              ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                              : doOrder.status === "shipped"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : doOrder.status === "received"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                        >
                          {doOrder.status === 'draft' ? 'Draft (PO)' :
                            doOrder.status === 'ready_to_load' ? 'Siap Muat' :
                              doOrder.status === 'shipped' ? 'Dikirim' :
                                doOrder.status === 'received' ? 'Diterima' : 'Dibatalkan'}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedDo(doOrder);
                              setIsDetailModalOpen(true);
                            }}
                            className="px-2.5 py-1 border rounded bg-slate-50 hover:bg-white text-[10px] font-bold text-slate-600 transition-all flex items-center gap-1"
                          >
                            <FileText size={10} />
                            <span>Detail</span>
                          </button>
                          {doOrder.status === "draft" && (
                            <button
                              onClick={() => handleSetReadyToLoad(doOrder)}
                              className="px-2.5 py-1 bg-purple-600 text-white text-[10px] font-bold rounded-lg hover:bg-purple-700 transition-all flex items-center gap-1"
                            >
                              <Check size={10} />
                              <span>Siap Muat</span>
                            </button>
                          )}
                          {doOrder.status === "ready_to_load" && (
                            <button
                              onClick={() => handleOpenShipModal(doOrder)}
                              className="px-2.5 py-1 bg-cyan-600 text-white text-[10px] font-bold rounded-lg hover:bg-cyan-700 transition-all flex items-center gap-1"
                            >
                              <Send size={10} />
                              <span>Kirim</span>
                            </button>
                          )}
                          {doOrder.status === "shipped" && (
                            <button
                              onClick={() => handleOpenReceiveModal(doOrder)}
                              className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-1"
                            >
                              <Check size={10} />
                              <span>Terima</span>
                            </button>
                          )}
                          {doOrder.status !== "ready_to_load" && doOrder.status !== 'cancelled' && (
                            <button
                              onClick={() => handlePrintDo(doOrder)}
                              className="px-2.5 py-1 border rounded bg-slate-50 hover:bg-white text-[10px] font-bold text-slate-600 transition-all flex items-center gap-1"
                            >
                              <Printer size={10} />
                              <span>Cetak</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-8 text-center text-slate-400 font-medium"
                      >
                        Tidak ada Surat Jalan yang terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="hidden">
        <div
          ref={printRef}
          className="print:block bg-white text-black print-a4-container"
        >
          {printDo && (
            <div className="w-full flex flex-col h-full">
              {/* Header / Letterhead */}
              <div className="flex justify-between items-center border-b-4 border-double border-slate-900 pb-5 mb-8 mt-4">
                <div className="flex items-center gap-4">
                  {companyProfile.logoUrl ? (
                    <img src={companyProfile.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
                  ) : (
                    <div className="w-16 h-16 bg-slate-900 flex items-center justify-center text-white font-black text-2xl tracking-tighter">
                      {companyProfile.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">{companyProfile.name}</h1>
                    <p className="text-xs font-bold text-slate-700 tracking-wide mt-0.5">GENERAL CONTRACTOR & SUPPLIER MATERIAL ALAM</p>
                    <p className="text-[10px] mt-1 text-slate-600 max-w-sm">{formatAddressForPrint(companyProfile.address)}</p>
                    <p className="text-[10px] mt-0.5 text-slate-600">Telp: {companyProfile.phone} | Email: {companyProfile.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-black text-cyan-700 uppercase tracking-widest mb-2">
                    SURAT JALAN
                  </h2>
                  <div className="inline-block text-left bg-slate-50 p-3 border border-slate-200 rounded">
                    <p className="text-xs flex justify-between gap-4"><span className="font-bold text-slate-500">No. Surat Jalan:</span> <span className="font-mono font-bold text-sm">{printDo.deliveryNumber}</span></p>
                    <p className="text-xs flex justify-between gap-4 mt-1"><span className="font-bold text-slate-500">Tgl. Kirim:</span> <span>{printDo.deliveryDate}</span></p>
                    <p className="text-xs flex justify-between gap-4 border-t border-slate-200 pt-1 mt-1"><span className="font-bold text-slate-500">Ref. SO:</span> <span className="font-mono">{printDo.salesOrder?.orderNumber || "-"}</span></p>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="flex gap-10 mb-8">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dikirim Kepada / Tujuan:</p>
                  <div className="border-l-4 border-cyan-700 pl-3">
                    <p className="font-bold text-base text-slate-900 uppercase">{printDo.customer?.name || "-"}</p>
                    <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap">Alamat pengiriman sesuai dengan kesepakatan Sales Order.</p>
                  </div>
                </div>
                <div className="w-1/3 border border-slate-200 rounded p-3 bg-slate-50">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Informasi Penerimaan:</p>
                  <div className="text-xs text-slate-800 space-y-1">
                    <p className="flex justify-between"><span className="font-bold">Status:</span> <span className="uppercase font-bold text-slate-900">{printDo.status}</span></p>
                    <p className="flex justify-between"><span className="font-bold">Penerima:</span> <span>{printDo.receiverName || "-"}</span></p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8 flex-1">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3 text-center w-12 border-b-2 border-slate-900">No</th>
                      <th className="py-2.5 px-3 text-left border-b-2 border-slate-900">Nama Barang / Material</th>
                      <th className="py-2.5 px-3 text-center w-28 border-b-2 border-slate-900">SKU</th>
                      <th className="py-2.5 px-3 text-right w-24 border-b-2 border-slate-900">Qty Kirim</th>
                      <th className="py-2.5 px-3 text-left w-32 border-b-2 border-slate-900">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 border-b-2 border-slate-900">
                    {printDo.items?.map((item, idx) => (
                      <tr key={item.id || `${item.product?.name}-${idx}`}>
                        <td className="py-3 px-3 text-center text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{item.product?.name}</p>
                          {item.salesOrderItem?.length && <p className="text-[10px] text-slate-600 mt-0.5">Panjang: {item.salesOrderItem.length}m</p>}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600">{item.product?.sku || "-"}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-base">{item.quantity}</td>
                        <td className="py-3 px-3 text-slate-600 text-xs">Baik</td>
                      </tr>
                    ))}
                    {!printDo.items?.length && (
                      <tr>
                        <td className="py-6 px-3 text-center text-slate-500" colSpan={5}>
                          {printDo.notes || "Muatan custom belum memiliki rincian item."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-xs leading-relaxed mb-8 border border-slate-200 p-3 rounded bg-slate-50">
                <p><strong>Catatan Pengiriman:</strong> {printDo.notes || "-"}</p>
                <p className="text-[10px] text-slate-500 mt-1">Barang yang tercantum di atas telah diserahkan dan diperiksa sesuai dokumen Sales Order terkait. Komplain setelah supir meninggalkan lokasi tidak dapat dilayani.</p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-10 mt-auto pt-8">
                <div className="text-center text-sm">
                  <p className="text-slate-600 mb-20">Disiapkan Oleh,</p>
                  <p className="border-t border-slate-900 mx-6 pt-2 font-bold text-slate-800">
                    KEPALA GUDANG
                  </p>
                  <p className="text-[10px] text-slate-500">{companyProfile.name}</p>
                </div>
                <div className="text-center text-sm">
                  <p className="text-slate-600 mb-20">Dikirim Oleh (Supir),</p>
                  <p className="border-t border-slate-900 mx-6 pt-2 font-bold text-slate-800">
                    &nbsp;
                  </p>
                  <p className="text-[10px] text-slate-500">Nama Terang & No. Kendaraan</p>
                </div>
                <div className="text-center text-sm">
                  <p className="text-slate-600 mb-20">Diterima Oleh,</p>
                  <p className="border-t border-slate-900 mx-6 pt-2 font-bold uppercase text-slate-800">
                    {printDo.receiverName || printDo.customer?.name || "CUSTOMER"}
                  </p>
                  <p className="text-[10px] text-slate-500">Ttd & Stempel</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400 font-mono">
                Surat Jalan generated by Sistem ERP {companyProfile.name} &copy; {new Date().getFullYear()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Detail Surat Jalan */}
      {isDetailModalOpen && selectedDo && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-cyan-400" />
                <h3 className="font-bold text-sm">Detail Surat Jalan: {selectedDo.deliveryNumber}</h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div>
                  <div className="text-slate-400 font-bold uppercase mb-1">Customer</div>
                  <div className="font-bold text-slate-800 text-sm">{selectedDo.customer?.name}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold uppercase mb-1">Sales Order</div>
                  <div className="font-mono text-cyan-700 font-bold">{selectedDo.salesOrder?.orderNumber || "-"}</div>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 font-bold uppercase mb-2">Rincian Muatan / Barang</div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-500 font-bold">
                      <tr>
                        <th className="p-2.5">Produk</th>
                        <th className="p-2.5 text-center">SKU</th>
                        <th className="p-2.5 text-right">Kuantitas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {selectedDo.items && selectedDo.items.length > 0 ? (
                        selectedDo.items.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td className="p-2.5 font-bold text-slate-700">
                              {item.product?.name}
                              {item.salesOrderItem?.length && <span className="ml-1 text-[10px] text-slate-400 font-normal">({item.salesOrderItem.length}m)</span>}
                            </td>
                            <td className="p-2.5 text-center font-mono text-slate-500">{item.product?.sku || "-"}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">{item.quantity} pcs</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-slate-400 italic">
                            {selectedDo.notes || "Tidak ada detail item (Muatan Custom)"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedDo.notes && (
                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase mb-1">Catatan Pengiriman</div>
                  <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs italic border border-amber-100">
                    "{selectedDo.notes}"
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 justify-end">
              {selectedDo.status === 'received' && onNavigate && (
                <button
                  onClick={() => {
                    sessionStorage.setItem('action_create_invoice', selectedDo.salesOrderId);
                    setIsDetailModalOpen(false);
                    onNavigate('invoices');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors text-xs flex items-center gap-1.5 shadow"
                >
                  <span>Lanjut Buat Tagihan (Invoice)</span>
                  <ChevronRight size={14} />
                </button>
              )}
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors text-xs"
              >
                Tutup
              </button>
            </div>

            {/* Cancel Action */}
            {selectedDo.status !== 'cancelled' && (
              <div className="p-4 border-t border-slate-100 bg-white">
                <button
                  onClick={() => handleCancelDo(selectedDo.id, selectedDo.deliveryNumber)}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <XCircle size={13} className="text-rose-500" />
                  <span>Batalkan Surat Jalan</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Buat Surat Jalan */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-cyan-400" />
                <h3 className="font-bold text-sm">Buat Surat Jalan</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDo} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Pilih Sales Order *
                </label>
                <SearchableSelect
                  value={selectedSalesOrderId}
                  onChange={(val) => setSelectedSalesOrderId(val)}
                  options={salesOrders
                    .filter(
                      (so) => so.status === "Disetujui" && so.hasInvoice,
                    )
                    .map((so) => ({
                      value: so.id,
                      label: `${so.orderNumber} - ${so.customerName || so.customer?.name || '-'}`
                    }))}
                  placeholder="-- Cari atau Pilih Sales Order --"
                />
                {salesOrders.filter((so) => so.status === "Disetujui" && so.hasInvoice).length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">Tidak ada Sales Order siap kirim (belum dibayar/approve).</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    No. Surat Jalan *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryNumber}
                    onChange={(e) => setDeliveryNumber(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Tanggal Kirim *
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Catatan Muatan / Pengiriman
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Instruksi pengiriman supir atau rincian muatan khusus..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold transition-all border border-slate-200/50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ship / Kirim Surat Jalan */}
      {isShipModalOpen && selectedDo && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-cyan-400" />
                <h3 className="font-bold text-sm">Shipment: Kirim Barang</h3>
              </div>
              <button
                onClick={() => setIsShipModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleShipDo} className="p-5 space-y-4">
              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-900 leading-relaxed space-y-1">
                <div className="font-bold text-xs">Informasi Surat Jalan:</div>
                <div>
                  No. DO:{" "}
                  <span className="font-mono font-bold">
                    {selectedDo.deliveryNumber}
                  </span>
                </div>
                <div>
                  Customer:{" "}
                  <span className="font-bold">{selectedDo.customer?.name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700">
                  Pilih Asal Gudang / Lokasi Stok *
                </label>

                <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col max-h-60 overflow-y-auto">
                  {storageLocations.map((loc) => {
                    const doItems = selectedDo.items || [];
                    const itemStockDetails = doItems.map(item => {
                      const stockRecord = allStocks.find(s => s.location_id === loc.id && s.product_id === item.productId);
                      const available = stockRecord ? Number(stockRecord.quantity) : 0;
                      const required = Number(item.quantity);
                      return { name: item.product?.name, required, available, length: item.salesOrderItem?.length };
                    });

                    return (
                      <label
                        key={loc.id}
                        className={`p-3 border-b border-slate-100 last:border-0 cursor-pointer transition-colors flex flex-col gap-2
                          ${selectedLocationId === loc.id ? 'bg-cyan-50' : 'hover:bg-slate-50'}
                        `}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="location"
                            value={loc.id}
                            checked={selectedLocationId === loc.id}
                            onChange={() => setSelectedLocationId(loc.id)}
                            className="text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5 mt-0.5"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-slate-800">
                              {loc.warehouse?.name ? `${loc.warehouse.name} - ` : ''}{loc.name}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px] mt-0.5">Kode: {loc.code}</span>
                          </div>
                        </div>

                        <div className="pl-6 space-y-1.5">
                          {itemStockDetails.map((detail, idx) => (
                            <div key={idx} className="flex justify-between items-start text-[10px] bg-white p-2 rounded border border-slate-100 shadow-sm gap-2">
                              <span className="text-slate-600 font-bold leading-tight flex-1">
                                {detail.name}
                                {detail.length && <span className="ml-1 font-normal text-slate-400">({detail.length}m)</span>}
                              </span>
                              <div className="flex items-center gap-2 font-mono shrink-0 mt-0.5">
                                <span className="text-slate-500">Butuh: {detail.required}</span>
                                <span className={detail.available >= detail.required ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                                  Stok: {detail.available}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pilih lokasi yang memiliki stok mencukupi. Stok barang akan otomatis terpotong.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsShipModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold transition-all border border-slate-200/50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Kirim Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Received / Konfirmasi Penerimaan */}
      {isReceiveModalOpen && selectedDo && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <h3 className="font-bold text-sm">Konfirmasi Diterima</h3>
              </div>
              <button
                onClick={() => setIsReceiveModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleReceiveDo} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Nama Penerima Barang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pak Slamet (Security / Owner)"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold transition-all border border-slate-200/50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Konfirmasi Diterima
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
