import React, { useRef, useState } from "react";
import { ChevronDown, ChevronRight, Printer, User } from "../icons";
import { GoodsReceiptNote } from "../../types";
import { useReactToPrint } from "react-to-print";
import { LocationDto } from "../../features/inventory/types";

interface InwardTabProps {
  goodsReceipts: GoodsReceiptNote[];
  locations?: LocationDto[];
  search: string;
}

export const InwardTab: React.FC<InwardTabProps> = ({
  goodsReceipts,
  locations = [],
  search,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [printId, setPrintId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Goods-Receipt",
  });

  const doPrint = (id: string) => {
    setPrintId(id);
    setTimeout(() => {
      handlePrint();
    }, 300);
  };

  const query = search.toLowerCase();
  const filteredReceipts = goodsReceipts.filter((grn) => {
    const itemText = grn.items
      .map((item) => `${item.productSku || ""} ${item.productName}`)
      .join(" ")
      .toLowerCase();

    return (
      grn.grnNumber.toLowerCase().includes(query) ||
      (grn.poNumber || "").toLowerCase().includes(query) ||
      (grn.deliveryOrderNumber || "").toLowerCase().includes(query) ||
      itemText.includes(query)
    );
  });

  const formatDate = (date: string) => date.split("T")[0] || date;

  const getTotalReceivedQty = (grn: GoodsReceiptNote) =>
    grn.items.reduce((sum, item) => sum + item.receivedQty, 0);

  const getItemSummary = (grn: GoodsReceiptNote) => {
    if (grn.items.length === 0) return "-";
    if (grn.items.length === 1) return grn.items[0].productName;
    return `${grn.items[0].productName} +${grn.items.length - 1} item`;
  };

  const getReceiverName = (grn: GoodsReceiptNote) =>
    grn.receiverName || grn.receivedBy || "-";

  const getWarehouseName = (grn: GoodsReceiptNote) => {
    if (grn.warehouseName) return grn.warehouseName;

    const location = locations.find((loc) => loc.id === grn.warehouseId);
    if (location) return `${location.name} (${location.code})`;

    return grn.warehouseId || "-";
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-sans text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
              <th className="p-3.5 pl-5">No GRN</th>
              <th className="p-3.5">Tanggal Terima</th>
              <th className="p-3.5">Referensi PO / SJ</th>
              <th className="p-3.5">Gudang</th>
              <th className="p-3.5">Ringkasan Barang</th>
              <th className="p-3.5 text-center">Total Qty</th>
              <th className="p-3.5">Petugas Gudang</th>
              <th className="p-3.5 text-center pr-5">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReceipts.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-12 text-slate-400 font-medium"
                >
                  Tidak ditemukan dokumen GRN.
                </td>
              </tr>
            ) : (
              filteredReceipts.map((grn) => {
                const isExpanded = expandedId === grn.id;
                return (
                  <React.Fragment key={grn.id}>
                    <tr className="hover:bg-slate-50/40">
                      <td className="p-3.5 pl-5 font-mono text-slate-800">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : grn.id)}
                          className="flex items-center gap-1.5 focus:outline-none text-left font-bold"
                        >
                          {isExpanded ? (
                            <ChevronDown size={14} className="text-cyan-500" />
                          ) : (
                            <ChevronRight size={14} className="text-slate-400" />
                          )}
                          <span>{grn.grnNumber}</span>
                        </button>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">
                        {formatDate(grn.receiptDate)}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-cyan-600">
                        {grn.poNumber || grn.deliveryOrderNumber || "-"}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {getWarehouseName(grn)}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {getItemSummary(grn)}
                      </td>
                      <td className="p-3.5 text-center font-semibold text-emerald-600 font-mono">
                        +{getTotalReceivedQty(grn)}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-slate-400" />
                          <span>{getReceiverName(grn)}</span>
                        </div>
                      </td>
                      <td className="p-3.5 pr-5 text-center">
                        <button
                          onClick={() => doPrint(grn.id)}
                          className="p-1 px-2 border rounded bg-slate-50 hover:bg-slate-100 hover:border-slate-200 text-xs text-slate-650 inline-flex items-center gap-1"
                          title="Cetak GRN"
                        >
                          <Printer size={12} />
                          Cetak
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td
                          colSpan={8}
                          className="p-4 pl-12 border-b border-slate-100"
                        >
                          <div className="space-y-4 max-w-3xl">
                            <h5 className="font-mono text-[9px] font-bold text-slate-400 tracking-wider uppercase">
                              Rincian Dokumen GRN
                            </h5>
                            <div className="p-3 bg-white border rounded-lg text-xs grid grid-cols-2 gap-4">
                              <div>
                                <span className="block text-slate-400 text-[10px] uppercase font-bold mb-0.5">
                                  Referensi PO / Surat Jalan
                                </span>
                                <span className="font-mono text-slate-800">
                                  {grn.poNumber || grn.deliveryOrderNumber || "-"}
                                </span>
                              </div>
                              <div>
                                <span className="block text-slate-400 text-[10px] uppercase font-bold mb-0.5">
                                  Status Dokumen
                                </span>
                                <span className="font-semibold text-slate-800">
                                  {grn.status}
                                </span>
                              </div>
                              <div>
                                <span className="block text-slate-400 text-[10px] uppercase font-bold mb-0.5">
                                  Petugas Pemeriksa
                                </span>
                                <span className="text-slate-800">
                                  {getReceiverName(grn)}
                                </span>
                              </div>
                              <div>
                                <span className="block text-slate-400 text-[10px] uppercase font-bold mb-0.5">
                                  Catatan Gudang
                                </span>
                                <span className="text-slate-600 italic">
                                  {grn.notes || "-"}
                                </span>
                              </div>
                            </div>

                            <table className="w-full text-xs border border-slate-200 bg-white">
                              <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px]">
                                <tr>
                                  <th className="p-2 text-left">SKU</th>
                                  <th className="p-2 text-left">Produk</th>
                                  <th className="p-2 text-center">Diterima</th>
                                  <th className="p-2 text-center">Reject</th>
                                  <th className="p-2 text-left">Catatan</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {grn.items.map((item) => (
                                  <tr key={item.id}>
                                    <td className="p-2 font-mono">
                                      {item.productSku || "-"}
                                    </td>
                                    <td className="p-2 font-semibold">
                                      {item.productName}
                                    </td>
                                    <td className="p-2 text-center font-mono text-emerald-600">
                                      {item.receivedQty}
                                    </td>
                                    <td className="p-2 text-center font-mono text-rose-600">
                                      {item.rejectedQty}
                                    </td>
                                    <td className="p-2 text-slate-500">
                                      {item.notes || "-"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="hidden">
        <div
          ref={printRef}
          className="print:block p-8 font-sans text-sm text-black bg-white"
        >
          {printId &&
            (() => {
              const grn = goodsReceipts.find((receipt) => receipt.id === printId);
              if (!grn) return null;

              return (
                <div className="w-full">
                  <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-8">
                    <div>
                      <h1 className="text-3xl font-black tracking-tighter uppercase">
                        CV Beton Agung
                      </h1>
                      <p className="text-sm font-medium mt-1">
                        General Contractor & Supplier Material Alam
                      </p>
                      <p className="text-xs mt-1 max-w-xs text-gray-600">
                        Jl. Raya Sukomanunggal Jaya No. 12, Surabaya, Jawa Timur
                      </p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-black text-gray-400 uppercase tracking-widest border border-gray-300 inline-block px-4 py-1 rounded">
                        GOODS RECEIPT
                      </h2>
                      <p className="font-mono font-bold mt-2 text-lg">
                        {grn.grnNumber}
                      </p>
                      <p className="text-sm">
                        Tanggal: {formatDate(grn.receiptDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-8 p-4 border border-black rounded-lg inline-block min-w-[300px]">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                      Penerima Gudang
                    </p>
                    <p className="font-bold text-lg">{getReceiverName(grn)}</p>
                  </div>

                  <div className="mb-4 text-sm">
                    <p>
                      <strong>Referensi PO / Surat Jalan:</strong>{" "}
                      {grn.poNumber || grn.deliveryOrderNumber || "-"}
                    </p>
                    <p>
                      <strong>Gudang:</strong>{" "}
                      {getWarehouseName(grn)}
                    </p>
                  </div>

                  <table className="w-full mb-8 border-collapse border border-black">
                    <thead>
                      <tr className="bg-gray-100 uppercase text-xs">
                        <th className="p-3 border border-black text-left w-12">
                          No
                        </th>
                        <th className="p-3 border border-black text-left w-32">
                          SKU
                        </th>
                        <th className="p-3 border border-black text-left">
                          Nama Produk / Deskripsi Barang
                        </th>
                        <th className="p-3 border border-black text-center w-32">
                          Qty Diterima
                        </th>
                        <th className="p-3 border border-black text-center w-32">
                          Qty Reject
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {grn.items.map((item, index) => (
                        <tr key={item.id}>
                          <td className="p-3 border border-black text-center">
                            {index + 1}
                          </td>
                          <td className="p-3 border border-black font-mono">
                            {item.productSku || "-"}
                          </td>
                          <td className="p-3 border border-black font-medium">
                            {item.productName}
                          </td>
                          <td className="p-3 border border-black text-center font-bold font-mono">
                            {item.receivedQty}
                          </td>
                          <td className="p-3 border border-black text-center font-bold font-mono">
                            {item.rejectedQty}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="text-xs mb-12">
                    <p>
                      <strong>Catatan Penerimaan:</strong>{" "}
                      {grn.notes || "Tidak ada catatan khusus."}
                    </p>
                    <p className="mt-2 text-gray-500 italic">
                      Barang diterima berdasarkan dokumen GRN ini. Mutasi stok
                      harus mereferensikan nomor GRN untuk kebutuhan audit.
                    </p>
                  </div>

                  <div className="flex justify-between text-center mt-12 px-12">
                    <div>
                      <p className="mb-24">Pengirim / Ekspedisi</p>
                      <p className="font-bold border-b border-black pb-1 uppercase select-none text-white">
                        .
                      </p>
                      <p className="mt-1 text-gray-500">( Nama Jelas )</p>
                    </div>
                    <div>
                      <p className="mb-24">Bagian Gudang</p>
                      <p className="font-bold border-b border-black pb-1 uppercase">
                        {getReceiverName(grn)}
                      </p>
                      <p className="mt-1">Penerima</p>
                    </div>
                  </div>
                </div>
              );
            })()}
        </div>
      </div>
    </div>
  );
};
