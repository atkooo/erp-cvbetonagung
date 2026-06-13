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
} from "@/src/components/icons";
import { authStorage, apiClient } from "../services/api";
import { salesApi } from "../features/sales/api";
import { DeliveryOrder, SalesOrder } from "../types";
import { SkeletonTable, SkeletonCard, ErrorCard } from "./Skeleton";

interface DeliveryOrdersViewProps {
  onTriggerNotification: (message: string) => void;
}

interface StorageLocationOption {
  id: string;
  name: string;
  code: string;
}

export default function DeliveryOrdersView({
  onTriggerNotification,
}: DeliveryOrdersViewProps) {
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [storageLocations, setStorageLocations] = useState<
    StorageLocationOption[]
  >([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
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
      const [dos, sos, locs] = await Promise.all([
        salesApi.getDeliveryOrders(),
        salesApi.getSalesOrders(),
        apiClient.get<{ data: StorageLocationOption[] }>(
          "/master-data/storage-locations",
        ),
      ]);
      setDeliveryOrders(dos);
      setSalesOrders(sos);
      setStorageLocations(locs.data || []);
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

  const handleOpenCreateModal = () => {
    // Generate auto DO number
    const count = deliveryOrders.length + 1;
    setDeliveryNumber(`DO-2026-06${count < 10 ? "0" + count : count}`);
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
    } catch (err) {
      console.error("Failed to create delivery order", err);
      onTriggerNotification(
        "Gagal membuat surat jalan. Pastikan order belum memiliki DO.",
      );
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

  // Filters & Counts
  const totalDos = deliveryOrders.length;
  const countReady = deliveryOrders.filter(
    (d) => d.status === "Siap Muat",
  ).length;
  const countShipped = deliveryOrders.filter(
    (d) => d.status === "Dikirim",
  ).length;
  const countReceived = deliveryOrders.filter(
    (d) => d.status === "Diterima",
  ).length;

  const filteredOrders = deliveryOrders.filter(
    (d) =>
      d.deliveryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.customerName &&
        d.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.salesOrderNumber &&
        d.salesOrderNumber.toLowerCase().includes(searchQuery.toLowerCase())),
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
                    <th className="p-3.5">Detail Muatan</th>
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
                        {doOrder.salesOrderNumber || "-"}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {doOrder.customerName}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {doOrder.deliveryDate}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {doOrder.items && doOrder.items.length > 0 ? (
                          <div className="space-y-0.5">
                            {doOrder.items.map((item) => (
                              <div
                                key={item.id}
                                className="font-semibold text-slate-700"
                              >
                                {item.productName} ({item.quantity} pcs)
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            {doOrder.notes || "Muatan Custom"}
                          </span>
                        )}
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
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            doOrder.status === "Siap Muat"
                              ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                              : doOrder.status === "Dikirim"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : doOrder.status === "Diterima"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {doOrder.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex justify-end gap-1.5">
                          {doOrder.status === "Siap Muat" && (
                            <button
                              onClick={() => handleOpenShipModal(doOrder)}
                              className="px-2.5 py-1 bg-cyan-600 text-white text-[10px] font-bold rounded-lg hover:bg-cyan-700 transition-all flex items-center gap-1"
                            >
                              <Send size={10} />
                              <span>Kirim</span>
                            </button>
                          )}
                          {doOrder.status === "Dikirim" && (
                            <button
                              onClick={() => handleOpenReceiveModal(doOrder)}
                              className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-1"
                            >
                              <Check size={10} />
                              <span>Terima</span>
                            </button>
                          )}
                          <button
                            onClick={() => handlePrintDo(doOrder)}
                            className="px-2.5 py-1 border rounded bg-slate-50 hover:bg-white text-[10px] font-bold text-slate-600 transition-all flex items-center gap-1"
                          >
                            <Printer size={10} />
                            <span>Cetak</span>
                          </button>
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

      <div className="hidden print:block">
        <div
          ref={printRef}
          className="print:block p-8 font-sans text-sm text-black bg-white"
        >
          {printDo && (
            <div className="max-w-200 mx-auto">
              <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                <div>
                  <h1 className="text-2xl font-black tracking-tight">
                    CV BETON AGUNG
                  </h1>
                  <p className="font-bold text-xs">
                    General Contractor & Supplier Material Alam
                  </p>
                  <p className="text-[11px] mt-1">
                    Jl. Raya Sukomanunggal Jaya No. 12, Surabaya, Jawa Timur
                  </p>
                </div>
                <div className="text-right">
                  <div className="border px-4 py-1 font-black tracking-[0.2em] text-slate-500 text-lg">
                    SURAT JALAN
                  </div>
                  <p className="font-mono font-bold mt-2 text-lg">
                    {printDo.deliveryNumber}
                  </p>
                  <p className="text-sm">
                    Tanggal Kirim: {printDo.deliveryDate}
                  </p>
                  <p className="text-sm">Status: {printDo.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="border border-black rounded-md p-4">
                  <p className="text-[10px] font-mono font-bold text-slate-500 tracking-widest">
                    DIKIRIM KEPADA
                  </p>
                  <p className="font-bold text-lg mt-1">
                    {printDo.customerName || "-"}
                  </p>
                  <p className="mt-2 text-xs text-slate-700">
                    Referensi SO:{" "}
                    <strong>{printDo.salesOrderNumber || "-"}</strong>
                  </p>
                </div>
                <div className="border border-black rounded-md p-4">
                  <p className="text-[10px] font-mono font-bold text-slate-500 tracking-widest">
                    INFORMASI PENERIMAAN
                  </p>
                  <p className="mt-1">
                    Penerima: <strong>{printDo.receiverName || "-"}</strong>
                  </p>
                  <p>
                    Tanggal Terima: <strong>{printDo.receivedAt || "-"}</strong>
                  </p>
                </div>
              </div>

              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-black p-2 w-10">NO</th>
                    <th className="border border-black p-2 text-left">
                      NAMA BARANG / MATERIAL
                    </th>
                    <th className="border border-black p-2 w-28">SKU</th>
                    <th className="border border-black p-2 w-28 text-right">
                      QTY KIRIM
                    </th>
                    <th className="border border-black p-2 w-32">KETERANGAN</th>
                  </tr>
                </thead>
                <tbody>
                  {printDo.items?.map((item, idx) => (
                    <tr key={item.id || `${item.productName}-${idx}`}>
                      <td className="border border-black p-2 text-center">
                        {idx + 1}
                      </td>
                      <td className="border border-black p-2 font-bold">
                        {item.productName}
                      </td>
                      <td className="border border-black p-2 text-center font-mono">
                        {item.productSku || "-"}
                      </td>
                      <td className="border border-black p-2 text-right font-mono font-bold">
                        {item.quantity}
                      </td>
                      <td className="border border-black p-2">Baik</td>
                    </tr>
                  ))}
                  {!printDo.items?.length && (
                    <tr>
                      <td
                        className="border border-black p-4 text-center text-slate-500"
                        colSpan={5}
                      >
                        {printDo.notes ||
                          "Muatan custom belum memiliki rincian item."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="mt-5 text-[11px] leading-relaxed">
                <p>
                  <strong>Catatan Pengiriman:</strong> {printDo.notes || "-"}
                </p>
                <p>
                  Barang yang tercantum di atas telah diserahkan sesuai dokumen
                  Sales Order terkait.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-10 mt-10 text-center text-xs">
                <div>
                  <p>Disiapkan Oleh,</p>
                  <div className="h-20"></div>
                  <p className="border-t border-black pt-2 font-bold">GUDANG</p>
                  <p>CV Beton Agung</p>
                </div>
                <div>
                  <p>Dikirim Oleh,</p>
                  <div className="h-20"></div>
                  <p className="border-t border-black pt-2 font-bold">
                    SUPIR / EKSPEDISI
                  </p>
                </div>
                <div>
                  <p>Diterima Oleh,</p>
                  <div className="h-20"></div>
                  <p className="border-t border-black pt-2 font-bold">
                    {printDo.receiverName || printDo.customerName || "CUSTOMER"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
                <select
                  required
                  value={selectedSalesOrderId}
                  onChange={(e) => setSelectedSalesOrderId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">
                    -- Pilih Sales Order Active (Lunas/Sebagian) --
                  </option>
                  {salesOrders
                    .filter(
                      (so) => so.status === "Disetujui" && so.hasPaidInvoice,
                    )
                    .map((so) => (
                      <option key={so.id} value={so.id}>
                        {so.orderNumber} - {so.customerName}
                      </option>
                    ))}
                  {salesOrders.filter(
                    (so) => so.status === "Disetujui" && so.hasPaidInvoice,
                  ).length === 0 && (
                    <option value="" disabled>
                      Tidak ada Sales Order siap kirim (belum dibayar/approve)
                    </option>
                  )}
                </select>
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
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                  <span className="font-bold">{selectedDo.customerName}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Asal Gudang / Lokasi Stok *
                </label>
                <select
                  required
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-cyan-400"
                >
                  {storageLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Stok material akan terpotong secara otomatis dari lokasi ini
                  ketika status diubah ke "Dikirim".
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
