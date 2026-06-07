/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  History,
  Warehouse,
  ClipboardCheck,
  X,
} from "@/src/components/icons";
import { Product, StockMovement } from "../types";
import { apiClient } from "../services/api";
import { productsApi } from "../features/products/api";
import { inventoryApi } from "../features/inventory/api";
import { purchasingApi } from "../features/purchasing/api";
import { salesApi } from "../features/sales/api";
import { PurchaseOrder, SalesOrder } from "../types";
import { LocationDto, ProductStockDto } from "../features/inventory/types";
import { SkeletonTable, ErrorCard } from "./Skeleton";
import ReferencePicker from "./ReferencePicker";

interface InventoryViewProps {
  onTriggerNotification: (message: string) => void;
  onNavigate?: (
    view:
      | "incoming-goods"
      | "outgoing-goods"
      | "stock-movement-history"
      | "stock-opname"
      | "multi-warehouse",
  ) => void;
  initialTab?: "stok" | "masuk" | "keluar" | "riwayat";
}

export default function InventoryView({
  onTriggerNotification,
  onNavigate,
  initialTab = "stok",
}: InventoryViewProps) {
  const activeTab = initialTab;

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockStatusFilter, setStockStatusFilter] = useState("All");

  // Modal forms
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [showOutwardModal, setShowOutwardModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showStockDetailModal, setShowStockDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [openStockActionId, setOpenStockActionId] = useState<string | null>(
    null,
  );

  // Form states - Barang Masuk
  const [inSku, setInSku] = useState("");
  const [inQty, setInQty] = useState(0);
  const [inDoc, setInDoc] = useState("");
  const [inLocationId, setInLocationId] = useState("");
  const [inHandler, setInHandler] = useState("Gudang - Wahyu");
  const [inNotes, setInNotes] = useState("");

  // Form states - Barang Keluar
  const [outSku, setOutSku] = useState("");
  const [outQty, setOutQty] = useState(0);
  const [outDoc, setOutDoc] = useState("");
  const [outLocationId, setOutLocationId] = useState("");
  const [outHandler, setOutHandler] = useState("Admin Gudang");
  const [outNotes, setOutNotes] = useState("");
  const [correctionLocationId, setCorrectionLocationId] = useState("");
  const [correctionQty, setCorrectionQty] = useState(0);
  const [correctionNotes, setCorrectionNotes] = useState("");

  const categories = [
    "Kubah Masjid",
    "Lisplang",
    "Roster",
    "Ornamen Beton",
    "Tanaman",
    "Produk Custom",
  ];

  const [products, setProducts] = useState<Product[]>([]);
  const [productStocks, setProductStocks] = useState<ProductStockDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [prods, stocks, movs, locRes, pos, sos] = await Promise.all([
        productsApi.getProducts(),
        inventoryApi.getProductStocks(),
        inventoryApi.getStockMovements(),
        apiClient.get<{ data: LocationDto[] }>(
          "/master-data/storage-locations",
        ),
        purchasingApi.getPurchaseOrders(),
        salesApi.getSalesOrders(),
      ]);

      const combinedProds = prods.map((p) => {
        const stockRows = stocks.filter(
          (s) => s.product_id === p.id || s.product?.sku === p.sku,
        );
        const totalStock = stockRows.reduce(
          (sum, s) => sum + Number(s.quantity || 0),
          0,
        );
        const stockStatus: Product["status"] =
          totalStock <= 0
            ? "Habis"
            : totalStock <= p.minStock
              ? "Menipis"
              : "Aman";
        const locationNames = stockRows
          .filter((s) => Number(s.quantity || 0) > 0)
          .map((s) => s.location?.name)
          .filter(Boolean);
        const uniqueLocationNames = Array.from(new Set(locationNames));

        return {
          ...p,
          stock: totalStock,
          location:
            uniqueLocationNames.length === 0
              ? "Belum ada stok"
              : uniqueLocationNames.length === 1
                ? uniqueLocationNames[0]
                : `${uniqueLocationNames.length} lokasi`,
          status: stockStatus,
        };
      });

      setProducts(combinedProds);
      setProductStocks(stocks);
      setLocations(locRes.data);
      setStockMovements(movs);
      setPurchaseOrders(pos);
      setSalesOrders(sos);

      if (combinedProds.length > 0) {
        setInSku((prev) => prev || combinedProds[0].sku);
        setOutSku((prev) => prev || combinedProds[0].sku);
      }
      if (locRes.data.length > 0) {
        setInLocationId((prev) => prev || locRes.data[0].id);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal memuat data inventory",
      );
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const getProductStocks = (product: Product | null) => {
    if (!product) return [];
    return productStocks.filter(
      (s) => s.product_id === product.id || s.product?.sku === product.sku,
    );
  };

  const getProductStock = (product: Product | null) => {
    if (!product) return undefined;
    return getProductStocks(product)[0];
  };

  const getProductBySku = (sku: string) =>
    products.find((p) => p.sku === sku) || null;

  const getLocationName = (locationId: string) => {
    return (
      locations.find((loc) => loc.id === locationId)?.name ||
      "Lokasi tidak dikenal"
    );
  };

  const getIncomingLocationOptions = () => locations;

  const getStockLocationOptions = (product: Product | null) => {
    return getProductStocks(product).filter(
      (stock) => Number(stock.quantity || 0) > 0,
    );
  };

  const getDefaultIncomingLocationId = (product: Product | null) => {
    return getProductStock(product)?.location_id || locations[0]?.id || "";
  };

  const getDefaultStockLocationId = (product: Product | null) => {
    return (
      getStockLocationOptions(product)[0]?.location_id ||
      getDefaultIncomingLocationId(product)
    );
  };

  // Auto-populate Inward Modal when PO is selected
  useEffect(() => {
    if (inDoc && inDoc.startsWith('PO-')) {
      const selectedPo = purchaseOrders.find(po => po.poNumber === inDoc);
      if (selectedPo && selectedPo.items && selectedPo.items.length > 0) {
        // Find product SKU matching the first item's productName
        const firstItem = selectedPo.items[0];
        // The productName might have extra spaces or be slightly different, but try exact match first
        const matchedProduct = products.find(p => p.name.toLowerCase() === firstItem.productName.toLowerCase());
        
        if (matchedProduct) {
          setInSku(matchedProduct.sku);
          setSelectedProduct(matchedProduct);
          setInLocationId(getDefaultIncomingLocationId(matchedProduct));
          // Pre-fill quantity
          setInQty(firstItem.quantity);
        }
      }
    }
  }, [inDoc]);

  const openInwardModal = (product?: Product) => {
    const target = product || selectedProduct || products[0] || null;
    setSelectedProduct(target);
    if (target) setInSku(target.sku);
    setInLocationId(getDefaultIncomingLocationId(target));
    setShowInwardModal(true);
  };

  const openOutwardModal = (product?: Product) => {
    const target = product || selectedProduct || products[0] || null;
    setSelectedProduct(target);
    if (target) setOutSku(target.sku);
    setOutLocationId(getDefaultStockLocationId(target));
    setShowOutwardModal(true);
  };

  const openCorrectionModal = (product: Product) => {
    setSelectedProduct(product);
    const locationId = getDefaultStockLocationId(product);
    const stock = getProductStocks(product).find(
      (s) => s.location_id === locationId,
    );
    setCorrectionLocationId(locationId);
    setCorrectionQty(stock ? Number(stock.quantity || 0) : 0);
    setCorrectionNotes("");
    setShowCorrectionModal(true);
  };

  const openStockDetailModal = (product: Product) => {
    setSelectedProduct(product);
    setShowStockDetailModal(true);
  };

  // Submit Incoming Goods
  const handleInwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inSku || inQty <= 0 || !inDoc) {
      onTriggerNotification(
        "Gagal: Kolom SKU, Jumlah, dan Dokumen Referensi harus diisi!",
      );
      return;
    }

    const matchedProd = products.find((p) => p.sku === inSku);
    if (!matchedProd) return;
    if (!inLocationId) {
      onTriggerNotification(
        "Gagal: Lokasi gudang belum tersedia. Tambahkan storage location terlebih dahulu.",
      );
      return;
    }

    try {
      await inventoryApi.receiveGoods({
        product_id: matchedProd.id,
        quantity: inQty,
        location_id: inLocationId,
        reference_type: "PO",
        reference_number: inDoc,
        notes: inNotes,
      });
      onTriggerNotification(
        `Sukses menerima ${inQty} ${matchedProd.unit} untuk SKU [${inSku}] via API`,
      );
      await loadData();
    } catch (err) {
      onTriggerNotification(
        err instanceof Error ? err.message : "Gagal menerima barang",
      );
    }

    // Reset Form
    setInQty(0);
    setInDoc("");
    setInNotes("");
    setShowInwardModal(false);
  };

  // Submit Outgoing Goods
  const handleOutwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outSku || outQty <= 0 || !outDoc) {
      onTriggerNotification(
        "Gagal: Kolom SKU, Jumlah, dan Dokumen Referensi harus diisi!",
      );
      return;
    }

    const matchedProd = products.find((p) => p.sku === outSku);
    if (!matchedProd) return;
    if (!outLocationId) {
      onTriggerNotification(
        "Gagal: Lokasi gudang belum tersedia. Tambahkan storage location terlebih dahulu.",
      );
      return;
    }

    const selectedStock = getProductStocks(matchedProd).find(
      (s) => s.location_id === outLocationId,
    );
    const selectedStockQty = selectedStock
      ? Number(selectedStock.quantity || 0)
      : 0;
    if (selectedStockQty < outQty) {
      onTriggerNotification(
        `Gagal: Stok di ${getLocationName(outLocationId)} tidak mencukupi! Stok lokasi: ${selectedStockQty} ${matchedProd.unit}`,
      );
      return;
    }

    try {
      await inventoryApi.issueGoods({
        product_id: matchedProd.id,
        quantity: outQty,
        location_id: outLocationId,
        reference_type: "SO",
        reference_number: outDoc,
        notes: outNotes,
      });
      onTriggerNotification(
        `Sukses mengeluarkan ${outQty} ${matchedProd.unit} untuk SKU [${outSku}] via API`,
      );
      await loadData();
    } catch (err) {
      onTriggerNotification(
        err instanceof Error ? err.message : "Gagal mengeluarkan barang",
      );
    }

    // Reset Form
    setOutQty(0);
    setOutDoc("");
    setOutNotes("");
    setShowOutwardModal(false);
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (correctionQty < 0) {
      onTriggerNotification("Gagal: Jumlah koreksi tidak boleh minus.");
      return;
    }

    if (!correctionLocationId) {
      onTriggerNotification(
        "Gagal: Lokasi gudang belum tersedia. Tambahkan storage location terlebih dahulu.",
      );
      return;
    }

    try {
      await inventoryApi.updateProductStock(
        selectedProduct.id,
        correctionLocationId,
        correctionQty,
      );
      onTriggerNotification(
        `Stok ${selectedProduct.sku} di ${getLocationName(correctionLocationId)} dikoreksi menjadi ${correctionQty} ${selectedProduct.unit}.`,
      );
      setShowCorrectionModal(false);
      setCorrectionLocationId("");
      setCorrectionQty(0);
      setCorrectionNotes("");
      await loadData();
    } catch (err) {
      onTriggerNotification(
        err instanceof Error ? err.message : "Gagal mengoreksi stok",
      );
    }
  };

  const poOptions = purchaseOrders
    .filter(po => po.status !== 'Dibatalkan')
    .map(po => ({
      id: po.id,
      number: po.poNumber,
      label: po.supplierName,
      subLabel: po.status
    }));

  const soOptions = salesOrders.map(so => ({
    id: so.id,
    number: so.orderNumber,
    label: so.customerName,
    subLabel: so.status
  }));

  return (
    <div className="space-y-6">
      {/* SEARCH AND ACTION SUB BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan SKU, Nama Produk, atau dokumen..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-sans text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>

          {activeTab === "stok" && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 shrink-0">
              <Filter size={13} className="text-slate-400" />
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                className="text-[11px] text-slate-600 bg-transparent py-1 focus:outline-none cursor-pointer font-sans"
              >
                <option value="All">Semua Kondisi</option>
                <option value="Aman">Kondisi: Aman</option>
                <option value="Menipis">Kondisi: Menipis</option>
                <option value="Habis">Kondisi: Kosong</option>
              </select>
            </div>
          )}
        </div>

        {/* Dynamic primary action based on active tab */}
        {activeTab === "masuk" && (
          <button
            onClick={() => openInwardModal()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-2 shrink-0"
          >
            <Plus size={16} />
            <span>Penerimaan Bahan Baru</span>
          </button>
        )}
        {activeTab === "keluar" && (
          <button
            onClick={() => openOutwardModal()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-2 shrink-0"
          >
            <Plus size={16} />
            <span>Pengeluaran Logistik baru</span>
          </button>
        )}
        {activeTab === "stok" && (
          <div className="text-[10px] font-mono text-slate-400 bg-slate-100 p-2 rounded-lg border border-slate-200 text-center truncate max-w-[250px]">
            Total Katalog:{" "}
            <strong className="text-slate-700">{products.length} SKU</strong>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      {/* CONTENT SWITCHER CARD */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={8} />
      ) : errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={loadData} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* TAB 1: STOK PRODUK */}
          {activeTab === "stok" && (
            <div className="overflow-x-auto pb-32">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                    <th className="p-3.5 pl-5">SKU No.</th>
                    <th className="p-3.5">Nama Item Produk</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5">Sebaran Lokasi</th>
                    <th className="p-3.5 text-center">Total Stok</th>
                    <th className="p-3.5 text-center">Minimum Stok</th>
                    <th className="p-3.5">Status Alaram</th>
                    <th className="p-3.5 pr-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products
                    .filter((p) => {
                      const matchSrc =
                        p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.sku.toLowerCase().includes(search.toLowerCase());
                      const matchStt =
                        stockStatusFilter === "All" ||
                        p.status === stockStatusFilter;
                      return matchSrc && matchStt;
                    })
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/40">
                        <td className="p-3.5 pl-5 font-mono font-bold text-slate-700">
                          {p.sku}
                        </td>
                        <td className="p-3.5 font-bold text-slate-800">
                          {p.name}
                        </td>
                        <td className="p-3.5 text-slate-500 font-semibold">
                          {p.category}
                        </td>
                        <td className="p-3.5 text-slate-500 font-medium">
                          {p.location}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-900 bg-slate-50/10">
                          {p.stock}{" "}
                          <span className="font-normal text-slate-400 text-[10px]">
                            {p.unit}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-400">
                          {p.minStock} {p.unit}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.status === "Aman"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : p.status === "Menipis"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200 font-semibold"
                                  : "bg-red-50 text-red-700 border border-red-200 font-bold"
                            }`}
                          >
                            {p.status === "Aman" && <CheckCircle size={10} />}
                            {p.status === "Menipis" && (
                              <AlertCircle size={10} />
                            )}
                            {p.status === "Habis" && <AlertCircle size={10} />}
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setOpenStockActionId(null);
                                openStockDetailModal(p);
                              }}
                              className="px-2.5 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 bg-white rounded text-[10px] font-bold"
                            >
                              Detail
                            </button>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenStockActionId(
                                    openStockActionId === p.id ? null : p.id,
                                  )
                                }
                                className="h-7 w-7 inline-flex items-center justify-center border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 bg-white rounded transition-colors"
                                title="Aksi lainnya"
                                aria-label={`Aksi lainnya untuk ${p.name}`}
                                aria-expanded={openStockActionId === p.id}
                              >
                                <ChevronDown size={12} />
                              </button>

                              {openStockActionId === p.id && (
                                <div className="absolute right-0 mt-1 z-20 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenStockActionId(null);
                                      onNavigate?.("stock-movement-history");
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                  >
                                    <History size={12} />
                                    <span>Log</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenStockActionId(null);
                                      onNavigate?.("multi-warehouse");
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                  >
                                    <Warehouse size={12} />
                                    <span>Transfer</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenStockActionId(null);
                                      onNavigate?.("stock-opname");
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-[10px] font-bold text-amber-700 hover:bg-amber-50"
                                  >
                                    <ClipboardCheck size={12} />
                                    <span>Opname</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: BARANG MASUK */}
          {activeTab === "masuk" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                    <th className="p-3.5 pl-5">No Transaksi</th>
                    <th className="p-3.5">Tanggal Masuk</th>
                    <th className="p-3.5">No Referensi / PO</th>
                    <th className="p-3.5">SKU No.</th>
                    <th className="p-3.5">Deskripsi Barang</th>
                    <th className="p-3.5 text-center">Jumlah Masuk</th>
                    <th className="p-3.5">Petugas Gudang</th>
                    <th className="p-3.5 pr-5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockMovements
                    .filter(
                      (m) =>
                        m.type === "Masuk" &&
                        (m.productName
                          .toLowerCase()
                          .includes(search.toLowerCase()) ||
                          m.sku.toLowerCase().includes(search.toLowerCase()) ||
                          m.referenceDoc
                            .toLowerCase()
                            .includes(search.toLowerCase())),
                    )
                    .map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/40">
                        <td className="p-3.5 pl-5 font-mono text-slate-400">
                          {m.id}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">
                          {m.date}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-cyan-600">
                          {m.referenceDoc}
                        </td>
                        <td className="p-3.5 font-mono font-semibold text-slate-700">
                          {m.sku}
                        </td>
                        <td className="p-3.5 font-bold text-slate-800">
                          {m.productName}
                        </td>
                        <td className="p-3.5 text-center font-semibold text-emerald-600 font-mono">
                          +{m.quantity}
                        </td>
                        <td className="p-3.5 text-slate-600 flex items-center gap-1.5 pt-4">
                          <User size={12} className="text-slate-400" />
                          <span>{m.handler}</span>
                        </td>
                        <td
                          className="p-3.5 pr-5 text-slate-500 italic max-w-[150px] truncate"
                          title={m.notes}
                        >
                          {m.notes}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: BARANG KELUAR */}
          {activeTab === "keluar" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                    <th className="p-3.5 pl-5">No Transaksi</th>
                    <th className="p-3.5">Tanggal Keluar</th>
                    <th className="p-3.5">Referensi SO No</th>
                    <th className="p-3.5">SKU No.</th>
                    <th className="p-3.5">Deskripsi Barang</th>
                    <th className="p-3.5 text-center">Jumlah Keluar</th>
                    <th className="p-3.5">Kurir / Handler</th>
                    <th className="p-3.5 pr-5">Tujuan Distribusi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockMovements
                    .filter(
                      (m) =>
                        m.type === "Keluar" &&
                        (m.productName
                          .toLowerCase()
                          .includes(search.toLowerCase()) ||
                          m.sku.toLowerCase().includes(search.toLowerCase()) ||
                          m.referenceDoc
                            .toLowerCase()
                            .includes(search.toLowerCase())),
                    )
                    .map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/40">
                        <td className="p-3.5 pl-5 font-mono text-slate-400">
                          {m.id}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">
                          {m.date}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-indigo-600">
                          {m.referenceDoc}
                        </td>
                        <td className="p-3.5 font-mono font-semibold text-slate-700">
                          {m.sku}
                        </td>
                        <td className="p-3.5 font-bold text-slate-800">
                          {m.productName}
                        </td>
                        <td className="p-3.5 text-center font-semibold text-rose-600 font-mono">
                          -{m.quantity}
                        </td>
                        <td className="p-3.5 text-slate-600 flex items-center gap-1.5 pt-4">
                          <User size={12} className="text-slate-400" />
                          <span>{m.handler}</span>
                        </td>
                        <td
                          className="p-3.5 pr-5 text-slate-500 max-w-[150px] truncate"
                          title={m.notes}
                        >
                          {m.notes}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: RIWAYAT PERGERAKAN STOK */}
          {activeTab === "riwayat" && (
            <div className="p-6">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Clock size={16} className="text-cyan-500" />
                <span>Timeline Log Mutasi Fisik Sejarah Gudang</span>
              </h4>

              <div className="relative border-l border-slate-200 pl-6 ml-3 space-y-6">
                {stockMovements
                  .filter(
                    (m) =>
                      m.productName
                        .toLowerCase()
                        .includes(search.toLowerCase()) ||
                      m.sku.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((m, idx) => (
                    <div key={idx} className="relative text-xs">
                      {/* Circle indicators */}
                      <span
                        className={`absolute -left-[30px] top-0 p-1 rounded-full text-white ${
                          m.type === "Masuk" ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      >
                        {m.type === "Masuk" ? (
                          <ArrowDownCircle size={12} />
                        ) : (
                          <ArrowUpCircle size={12} />
                        )}
                      </span>

                      {/* Timeline box layout */}
                      <div className="bg-slate-50 hover:bg-slate-100 p-3.5 rounded-xl border border-slate-200 max-w-2xl transition-colors">
                        <div className="flex md:items-center justify-between flex-col md:flex-row gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] bg-slate-200/60 font-black text-slate-700 px-1.5 py-0.5 rounded">
                              {m.sku}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                                m.type === "Masuk"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              MUTASI {m.type.toUpperCase()}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">
                            {m.date}
                          </span>
                        </div>

                        <h5 className="font-bold text-slate-800 mt-2">
                          {m.productName}
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Kuantitas:{" "}
                          <strong className="text-slate-700">
                            {m.quantity} Pcs / Unit
                          </strong>{" "}
                          | Dokumen:{" "}
                          <strong className="text-cyan-600 font-mono">
                            {m.referenceDoc}
                          </strong>
                        </p>

                        {m.notes && (
                          <div className="mt-2.5 pt-1.5 border-t border-slate-200/50 text-[10px] text-slate-400 italic">
                            Catatan: {m.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DETAIL SEBARAN STOK */}
      {showStockDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-sm">
                  Detail Sebaran Stok
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {selectedProduct.sku} | {selectedProduct.name}
                </p>
              </div>
              <button
                onClick={() => setShowStockDetailModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                    Total Stok
                  </span>
                  <p className="text-lg font-mono font-black text-slate-900 mt-1">
                    {selectedProduct.stock}{" "}
                    <span className="text-[10px] font-normal text-slate-500">
                      {selectedProduct.unit}
                    </span>
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                    Minimum
                  </span>
                  <p className="text-lg font-mono font-black text-slate-900 mt-1">
                    {selectedProduct.minStock}{" "}
                    <span className="text-[10px] font-normal text-slate-500">
                      {selectedProduct.unit}
                    </span>
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                    Status
                  </span>
                  <p className="text-sm font-bold text-slate-800 mt-2">
                    {selectedProduct.status}
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest font-mono text-[10px]">
                    <tr>
                      <th className="p-3">Lokasi</th>
                      <th className="p-3">Kode</th>
                      <th className="p-3 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getProductStocks(selectedProduct).length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="p-5 text-center text-slate-400"
                        >
                          Belum ada stok tercatat di lokasi mana pun.
                        </td>
                      </tr>
                    ) : (
                      getProductStocks(selectedProduct).map((stock) => (
                        <tr key={stock.id || stock.location_id}>
                          <td className="p-3 font-bold text-slate-800">
                            {stock.location?.name ||
                              getLocationName(stock.location_id)}
                          </td>
                          <td className="p-3 font-mono text-slate-500">
                            {stock.location?.code || "-"}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-slate-900">
                            {Number(stock.quantity || 0).toLocaleString(
                              "id-ID",
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStockDetailModal(false)}
                  className="px-3 py-2 border rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowStockDetailModal(false);
                    onNavigate?.("multi-warehouse");
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg"
                >
                  Kelola Sebaran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BARANG MASUK */}
      {showInwardModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownCircle size={18} className="text-emerald-400" />
                <h3 className="font-sans font-bold text-sm">
                  Form Terima Barang Masuk (Inward)
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
                  Lokasi Tujuan Gudang / Rak
                </label>
                <select
                  value={inLocationId}
                  onChange={(e) => setInLocationId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg"
                  required
                >
                  <option value="">-- Pilih Lokasi --</option>
                  {getIncomingLocationOptions().map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    Kuantitas Masuk
                  </label>
                  <input
                    type="number"
                    required
                    value={inQty || ""}
                    onChange={(e) => setInQty(Number(e.target.value))}
                    placeholder="Contoh: 150"
                    className="w-full px-3 py-2 border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    Referensi PO / Surat Jalan
                  </label>
                  <ReferencePicker
                    title="Pilih Purchase Order (PO)"
                    placeholder="Contoh: PO-2026-05-120"
                    value={inDoc}
                    onChange={setInDoc}
                    options={poOptions}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">
                  Petugas yang Memverifikasi
                </label>
                <input
                  type="text"
                  required
                  value={inHandler}
                  onChange={(e) => setInHandler(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200"
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

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">
                  Lokasi Koreksi
                </label>
                <select
                  value={correctionLocationId}
                  onChange={(e) => {
                    const locationId = e.target.value;
                    const stock = getProductStocks(selectedProduct).find(
                      (s) => s.location_id === locationId,
                    );
                    setCorrectionLocationId(locationId);
                    setCorrectionQty(stock ? Number(stock.quantity || 0) : 0);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg"
                  required
                >
                  <option value="">-- Pilih Lokasi --</option>
                  {getProductStocks(selectedProduct).length > 0
                    ? getProductStocks(selectedProduct).map((stock) => (
                        <option
                          key={stock.location_id}
                          value={stock.location_id}
                        >
                          {stock.location?.name ||
                            getLocationName(stock.location_id)}{" "}
                          - Stok: {Number(stock.quantity || 0)}
                        </option>
                      ))
                    : locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.code}) - Stok: 0
                        </option>
                      ))}
                </select>
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
                <select
                  value={outLocationId}
                  onChange={(e) => setOutLocationId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg"
                  required
                >
                  <option value="">-- Pilih Lokasi Stok --</option>
                  {getStockLocationOptions(getProductBySku(outSku)).map(
                    (stock) => (
                      <option key={stock.location_id} value={stock.location_id}>
                        {stock.location?.name ||
                          getLocationName(stock.location_id)}{" "}
                        - Stok: {Number(stock.quantity || 0)}
                      </option>
                    ),
                  )}
                </select>
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
                <input
                  type="text"
                  required
                  value={outHandler}
                  onChange={(e) => setOutHandler(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200"
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
    </div>
  );
}
