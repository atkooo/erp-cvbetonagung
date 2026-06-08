import React from "react";
import { X, ArrowDownCircle, ArrowUpCircle } from "../icons";
import { Product, StockMovement } from "../../types";
import { LocationDto as Location, ProductStockDto as ProductStock } from "../../features/inventory/types";
import ReferencePicker from "../ReferencePicker";
import SearchableSelect from "../SearchableSelect";

interface InventoryModalsProps {
  // Common
  products: Product[];
  locations: Location[];
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  getProductBySku: (sku: string) => Product | null;
  getLocationName: (locationId: string) => string;

  // Detail Modal
  showStockDetailModal: boolean;
  setShowStockDetailModal: (show: boolean) => void;
  getProductStocks: (p: Product | null) => ProductStock[];

  // Inward Modal
  showInwardModal: boolean;
  setShowInwardModal: (show: boolean) => void;
  inSku: string;
  setInSku: (val: string) => void;
  inQty: number;
  setInQty: (val: number) => void;
  inDoc: string;
  setInDoc: (val: string) => void;
  inHandler: string;
  setInHandler: (val: string) => void;
  inNotes: string;
  setInNotes: (val: string) => void;
  inLocationId: string;
  setInLocationId: (val: string) => void;
  poOptions: any[];
  purchaseOrders?: any[]; // added
  inPoItemsQty?: Record<string, number>; // added
  setInPoItemsQty?: (val: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void; // added
  getIncomingLocationOptions: () => Location[];
  getDefaultIncomingLocationId: (p: Product | null) => string;
  handleInwardSubmit: (e: React.FormEvent) => void;

  // Correction Modal
  showCorrectionModal: boolean;
  setShowCorrectionModal: (show: boolean) => void;
  correctionQty: number;
  setCorrectionQty: (val: number) => void;
  correctionLocationId: string;
  setCorrectionLocationId: (val: string) => void;
  correctionNotes: string;
  setCorrectionNotes: (val: string) => void;
  handleCorrectionSubmit: (e: React.FormEvent) => void;

  // Outward Modal
  showOutwardModal: boolean;
  setShowOutwardModal: (show: boolean) => void;
  outSku: string;
  setOutSku: (val: string) => void;
  outQty: number;
  setOutQty: (val: number) => void;
  outDoc: string;
  setOutDoc: (val: string) => void;
  outHandler: string;
  setOutHandler: (val: string) => void;
  outNotes: string;
  setOutNotes: (val: string) => void;
  outLocationId: string;
  setOutLocationId: (val: string) => void;
  soOptions: any[];
  getStockLocationOptions: (p: Product | null) => ProductStock[];
  getDefaultStockLocationId: (p: Product | null) => string;
  handleOutwardSubmit: (e: React.FormEvent) => void;

  // Additional options
  employeeOptions?: { value: string, label: string }[];
}

export const InventoryModals: React.FC<InventoryModalsProps> = ({
  products, locations, selectedProduct, setSelectedProduct, getProductBySku, getLocationName,
  showStockDetailModal, setShowStockDetailModal, getProductStocks,
  showInwardModal, setShowInwardModal, inSku, setInSku, inQty, setInQty, inDoc, setInDoc, inHandler, setInHandler, inNotes, setInNotes, inLocationId, setInLocationId, poOptions, purchaseOrders, inPoItemsQty, setInPoItemsQty, getIncomingLocationOptions, getDefaultIncomingLocationId, handleInwardSubmit,
  showCorrectionModal, setShowCorrectionModal, correctionQty, setCorrectionQty, correctionLocationId, setCorrectionLocationId, correctionNotes, setCorrectionNotes, handleCorrectionSubmit,
  showOutwardModal, setShowOutwardModal, outSku, setOutSku, outQty, setOutQty, outDoc, setOutDoc, outHandler, setOutHandler, outNotes, setOutNotes, outLocationId, setOutLocationId, soOptions, getStockLocationOptions, getDefaultStockLocationId, handleOutwardSubmit,
  employeeOptions,
}) => {
  const selectedPO = React.useMemo(() => {
    return purchaseOrders?.find(po => po.poNumber === inDoc) || null;
  }, [inDoc, purchaseOrders]);

  return (
    <>
      {/* MODAL DETAIL SEBARAN STOK */}
      {showStockDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-50 border-b flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-slate-800 text-sm">
                  Detail Sebaran Stok Fisik
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {selectedProduct.sku} | {selectedProduct.name}
                </p>
              </div>
              <button
                onClick={() => setShowStockDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-3 mb-4 p-3 bg-cyan-50/50 rounded-lg border border-cyan-100">
                <div className="p-2 bg-white rounded-md shadow-sm">
                  <span className="font-mono text-cyan-600 font-bold text-sm">
                    {selectedProduct.stock} {selectedProduct.unit}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Total kuantitas tercatat di seluruh lokasi gudang saat ini.
                </div>
              </div>

              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Rincian Per Lokasi Rak
              </h4>
              <div className="space-y-2">
                {getProductStocks(selectedProduct).length === 0 ? (
                  <div className="text-center p-4 text-xs text-slate-400 border border-dashed rounded-lg">
                    Belum ada stok yang dialokasikan ke lokasi manapun.
                  </div>
                ) : (
                  getProductStocks(selectedProduct).map((stock) => (
                    <div
                      key={stock.location_id}
                      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-cyan-300 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                        <div>
                          <p className="text-xs font-bold text-slate-700">
                            {stock.location?.name ||
                              getLocationName(stock.location_id)}
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono">
                            ID: {stock.location_id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-slate-800">
                          {Number(stock.quantity || 0)}{" "}
                          <span className="text-[10px] font-normal text-slate-500">
                            {selectedProduct.unit}
                          </span>
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          Tersedia
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="p-4 border-t bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowStockDetailModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BARANG MASUK */}
      {showInwardModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownCircle size={18} className="text-emerald-400" />
                <h3 className="font-sans font-bold text-sm">
                  Form Penerimaan Barang Baru (Inward)
                </h3>
              </div>
              <button
                onClick={() => setShowInwardModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleInwardSubmit}
              className="p-5 space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    Referensi PO / Surat Jalan
                  </label>
                  <ReferencePicker
                    title="Pilih Purchase Order (PO)"
                    placeholder="Contoh: PO-2026-05-120"
                    value={inDoc}
                    onChange={(val) => {
                      setInDoc(val);
                      // Reset quantities when PO changes
                      if (setInPoItemsQty) setInPoItemsQty({});
                    }}
                    options={poOptions}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    Lokasi Tujuan Gudang / Rak
                  </label>
                  <SearchableSelect
                    value={inLocationId}
                    onChange={(val) => setInLocationId(val)}
                    options={getIncomingLocationOptions().map((loc) => ({
                      value: loc.id,
                      label: `${loc.name} (${loc.code})`
                    }))}
                    placeholder="-- Pilih Lokasi --"
                  />
                </div>
              </div>

              {selectedPO ? (
                <div className="space-y-1 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <label className="text-[11px] font-bold text-slate-600 mb-2 block">
                    Daftar Item Purchase Order
                  </label>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider">
                          <th className="pb-2 font-semibold">SKU / Nama</th>
                          <th className="pb-2 font-semibold text-right">Dipesan</th>
                          <th className="pb-2 font-semibold text-right">Sisa</th>
                          <th className="pb-2 font-semibold text-right">Diterima Saat Ini</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPO.items?.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-[11px] text-slate-400">
                              Detail item PO belum tersedia dari backend.
                            </td>
                          </tr>
                        ) : selectedPO.items?.map((item: any) => {
                          const remaining = Math.max(0, item.quantity - (item.receivedQty || 0));
                          const currentValue = inPoItemsQty?.[item.id] !== undefined
                            ? inPoItemsQty[item.id]
                            : remaining;

                          return (
                            <tr key={item.id} className="border-b border-slate-100 last:border-0">
                              <td className="py-2">
                                <div className="font-bold text-slate-800">{item.productSku || "-"}</div>
                                <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{item.productName}</div>
                                {remaining <= 0 && (
                                  <div className="text-[9px] font-bold text-emerald-600 mt-0.5">
                                    Sudah diterima penuh
                                  </div>
                                )}
                              </td>
                              <td className="py-2 text-right font-mono">{item.quantity}</td>
                              <td className={`py-2 text-right font-mono font-bold ${remaining > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                {remaining}
                              </td>
                              <td className="py-2 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  max={remaining}
                                  value={currentValue}
                                  disabled={remaining <= 0}
                                  onChange={(e) => {
                                    if (setInPoItemsQty) {
                                      setInPoItemsQty(prev => ({
                                        ...prev,
                                        [item.id]: Number(e.target.value)
                                      }));
                                    }
                                  }}
                                  className="w-20 px-2 py-1 text-right border border-slate-200 rounded text-xs disabled:bg-slate-100 disabled:text-slate-400"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">
                      Pilih Item SKU
                    </label>
                    <select
                      value={inSku}
                      onChange={(e) => {
                        const nextSku = e.target.value;
                        const nextProduct = getProductBySku(nextSku);
                        setInSku(nextSku);
                        setSelectedProduct(nextProduct);
                        setInLocationId(getDefaultIncomingLocationId(nextProduct));
                      }}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg"
                      required={!selectedPO}
                    >
                      {products.map((p, idx) => (
                        <option key={idx} value={p.sku}>
                          {p.sku} | {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">
                      Kuantitas Masuk
                    </label>
                    <input
                      type="number"
                      required={!selectedPO}
                      value={inQty || ""}
                      onChange={(e) => setInQty(Number(e.target.value))}
                      placeholder="Contoh: 150"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">
                  Petugas yang Memverifikasi
                </label>
                <SearchableSelect
                  value={inHandler}
                  onChange={(val) => setInHandler(val)}
                  options={employeeOptions || []}
                  placeholder="-- Pilih Petugas --"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">
                  Catatan Penerimaan Gudang
                </label>
                <textarea
                  rows={2}
                  value={inNotes}
                  onChange={(e) => setInNotes(e.target.value)}
                  placeholder="Kondisi barang prima, lolos QC mold, diletakkan di rak barat."
                  className="w-full px-3 py-2 border border-slate-200 resize-none"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="px-3 py-2 border rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg"
                >
                  Konfirmasi Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KOREKSI STOK */}
      {showCorrectionModal && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-sm">
                  Koreksi Stok Manual
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {selectedProduct.sku} | {selectedProduct.name}
                </p>
              </div>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleCorrectionSubmit}
              className="p-5 space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                    Stok Sistem
                  </span>
                  <p className="text-lg font-mono font-black text-slate-900 mt-1">
                    {selectedProduct.stock}{" "}
                    <span className="text-[10px] font-normal text-slate-500">
                      {selectedProduct.unit}
                    </span>
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    Stok Fisik Baru
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={correctionQty}
                    onChange={(e) => setCorrectionQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1 mt-2">
                <label className="text-[11px] font-bold text-slate-600">
                  Lokasi / Rak Terdampak
                </label>
                <SearchableSelect
                  value={correctionLocationId}
                  onChange={(locId) => {
                    setCorrectionLocationId(locId);
                    const st = getProductStocks(selectedProduct).find(
                      (s) => s.location_id === locId,
                    );
                    if (st) setCorrectionQty(Number(st.quantity || 0));
                    else setCorrectionQty(0);
                  }}
                  options={
                    getProductStocks(selectedProduct).length > 0
                      ? getProductStocks(selectedProduct).map((stock) => ({
                          value: stock.location_id,
                          label: `${stock.location?.name || getLocationName(stock.location_id)} - Stok: ${Number(stock.quantity || 0)}`
                        }))
                      : locations.map((loc) => ({
                          value: loc.id,
                          label: `${loc.name} (${loc.code}) - Stok: 0`
                        }))
                  }
                  placeholder="-- Pilih Lokasi --"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">
                  Catatan Koreksi
                </label>
                <textarea
                  rows={2}
                  value={correctionNotes}
                  onChange={(e) => setCorrectionNotes(e.target.value)}
                  placeholder="Contoh: Penyesuaian setelah hitung fisik rak gudang."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-3 py-2 border rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg"
                >
                  Simpan Koreksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BARANG KELUAR */}
      {showOutwardModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpCircle size={18} className="text-rose-400" />
                <h3 className="font-sans font-bold text-sm">
                  Form Pengeluaran Logistik Gudang (Outward)
                </h3>
              </div>
              <button
                onClick={() => setShowOutwardModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleOutwardSubmit}
              className="p-5 space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">
                  Pilih Item SKU
                </label>
                <select
                  value={outSku}
                  onChange={(e) => {
                    const nextSku = e.target.value;
                    const nextProduct = getProductBySku(nextSku);
                    setOutSku(nextSku);
                    setSelectedProduct(nextProduct);
                    setOutLocationId(getDefaultStockLocationId(nextProduct));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg"
                >
                  {products.map((p, idx) => (
                    <option key={idx} value={p.sku}>
                      {p.sku} | {p.name} (Sisa: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">
                  Lokasi Sumber Gudang / Rak
                </label>
                <SearchableSelect
                  value={outLocationId}
                  onChange={(val) => setOutLocationId(val)}
                  options={getStockLocationOptions(getProductBySku(outSku)).map(
                    (stock) => ({
                      value: stock.location_id,
                      label: `${stock.location?.name || getLocationName(stock.location_id)} - Stok: ${Number(stock.quantity || 0)}`
                    })
                  )}
                  placeholder="-- Pilih Lokasi Stok --"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    Kuantitas Keluar
                  </label>
                  <input
                    type="number"
                    required
                    value={outQty || ""}
                    onChange={(e) => setOutQty(Number(e.target.value))}
                    placeholder="Contoh: 50"
                    className="w-full px-3 py-2 border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    Referensi SO / Surat Jalan Keluar
                  </label>
                  <ReferencePicker
                    title="Pilih Sales Order (SO)"
                    placeholder="Contoh: SO-2026-05-090"
                    value={outDoc}
                    onChange={setOutDoc}
                    options={soOptions}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">
                  Driver / Kurir Pengantar
                </label>
                <SearchableSelect
                  value={outHandler}
                  onChange={(val) => setOutHandler(val)}
                  options={employeeOptions || []}
                  placeholder="-- Pilih Driver/Kurir/Petugas --"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">
                  Tujuan Pengiriman / Alamat Proyek
                </label>
                <textarea
                  rows={2}
                  value={outNotes}
                  onChange={(e) => setOutNotes(e.target.value)}
                  placeholder="Kirim ke lokasi Masjid Al-Ikhlas Sidoarjo menggunakan Truk Colt Diesel"
                  className="w-full px-3 py-2 border border-slate-200 resize-none"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOutwardModal(false)}
                  className="px-3 py-2 border rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg"
                >
                  Konfirmasi Keluar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
