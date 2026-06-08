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
import { GoodsReceiptNote, Product, StockMovement } from "../types";
import { apiClient, authStorage } from "../services/api";
import { productsApi } from "../features/products/api";
import { inventoryApi } from "../features/inventory/api";
import { purchasingApi } from "../features/purchasing/api";
import { salesApi } from "../features/sales/api";
import { employeesApi } from "../features/employees/api";
import { PurchaseOrder, SalesOrder, Employee } from "../types";
import { LocationDto, ProductStockDto } from "../features/inventory/types";
import { SkeletonTable, ErrorCard } from "./Skeleton";
import ReferencePicker from "./ReferencePicker";

// Import Refactored Components
import { StockTab } from "./inventory/StockTab";
import { InwardTab } from "./inventory/InwardTab";
import { OutwardTab } from "./inventory/OutwardTab";
import { HistoryTab } from "./inventory/HistoryTab";
import { InventoryModals } from "./inventory/InventoryModals";

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
  const [inPoItemsQty, setInPoItemsQty] = useState<Record<string, number>>({});

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

  const [products, setProducts] = useState<Product[]>([]);
  const [productStocks, setProductStocks] = useState<ProductStockDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceiptNote[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fetchedPoDetailIds = React.useRef<Set<string>>(new Set());

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [prods, stocks, movs, grns, locRes, pos, sos, emps] = await Promise.all([
        productsApi.getProducts(),
        inventoryApi.getProductStocks(),
        inventoryApi.getStockMovements(),
        purchasingApi.getGoodsReceiptNotes(),
        apiClient.get<{ data: LocationDto[] }>(
          "/master-data/storage-locations",
        ),
        purchasingApi.getPurchaseOrders(),
        salesApi.getSalesOrders(),
        employeesApi.getEmployees(),
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
      setGoodsReceipts(grns);
      setPurchaseOrders(pos);
      setSalesOrders(sos);
      setEmployees(emps);

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

  React.useEffect(() => {
    const selectedPo = purchaseOrders.find((po) => po.poNumber === inDoc);

    if (
      !selectedPo ||
      selectedPo.items?.length > 0 ||
      fetchedPoDetailIds.current.has(selectedPo.id)
    ) {
      return;
    }

    let cancelled = false;
    fetchedPoDetailIds.current.add(selectedPo.id);

    purchasingApi.getPurchaseOrder(selectedPo.id)
      .then((poWithItems) => {
        if (cancelled) return;

        setPurchaseOrders((prev) =>
          prev.map((po) => (po.id === poWithItems.id ? poWithItems : po)),
        );
      })
      .catch((err) => {
        onTriggerNotification(
          err instanceof Error
            ? err.message
            : "Gagal memuat detail item Purchase Order",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [inDoc, purchaseOrders, onTriggerNotification]);

  const getProductStocks = (product: Product | null) => {
    if (!product) return [];
    return productStocks.filter(
      (s) => s.product_id === product.id || s.product?.sku === product.sku,
    );
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
    return getProductStocks(product)[0]?.location_id || locations[0]?.id || "";
  };

  const getDefaultStockLocationId = (product: Product | null) => {
    return (
      getStockLocationOptions(product)[0]?.location_id ||
      getDefaultIncomingLocationId(product)
    );
  };

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

  const openStockDetailModal = (product: Product) => {
    setSelectedProduct(product);
    setShowStockDetailModal(true);
  };

  // Submit Incoming Goods
  const handleInwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inLocationId) {
      onTriggerNotification(
        "Gagal: Lokasi gudang belum tersedia. Tambahkan storage location terlebih dahulu.",
      );
      return;
    }

    const matchedPO = purchaseOrders.find((po) => po.poNumber === inDoc);
    const selectedReceiver = employees.find((emp) => emp.name === inHandler);
    const receiverId = selectedReceiver?.userId || authStorage.getUser()?.id || null;

    if (matchedPO) {
      // MODE PO
      const itemsToReceive = matchedPO.items?.filter((item) => {
        const remaining = Math.max(0, item.quantity - (item.receivedQty || 0));
        const inputQty = inPoItemsQty[item.id!] !== undefined ? inPoItemsQty[item.id!] : remaining;
        return inputQty > 0;
      }) || [];

      if (itemsToReceive.length === 0) {
        const hasItems = (matchedPO.items || []).length > 0;
        onTriggerNotification(
          hasItems
            ? "Gagal: Semua item PO ini sudah diterima penuh."
            : "Gagal: Detail item PO belum tersedia. Muat ulang data atau cek item PO di backend.",
        );
        return;
      }

      try {
        const payloadItems = itemsToReceive.map((item) => {
          const remaining = Math.max(0, item.quantity - (item.receivedQty || 0));
          return {
            id: item.id!,
            quantity: inPoItemsQty[item.id!] !== undefined ? inPoItemsQty[item.id!] : remaining,
          };
        });

        await purchasingApi.createGoodsReceiptNote({
          purchase_order_id: matchedPO.id,
          to_location_id: inLocationId,
          received_by: receiverId,
          receipt_date: new Date().toISOString().split("T")[0],
          status: "posted",
          notes: inNotes,
          items: payloadItems.map((payloadItem) => {
            const poItem = matchedPO.items.find((item) => item.id === payloadItem.id);
            return {
              purchase_order_item_id: payloadItem.id,
              product_id: poItem?.productId || "",
              received_quantity: payloadItem.quantity,
              rejected_quantity: 0,
              notes: inNotes || null,
            };
          }).filter((item) => item.product_id),
        });

        onTriggerNotification(
          `GRN penerimaan untuk PO [${inDoc}] berhasil dibuat dengan ${itemsToReceive.length} item.`,
        );
        await loadData();
      } catch (err) {
        onTriggerNotification(
          err instanceof Error ? err.message : "Gagal menerima barang dari PO",
        );
      }
    } else {
      // MODE MANUAL
      if (!inSku || inQty <= 0 || !inDoc) {
        onTriggerNotification(
          "Gagal: Kolom SKU, Jumlah, dan Dokumen Referensi harus diisi!",
        );
        return;
      }

      const matchedProd = products.find((p) => p.sku === inSku);
      if (!matchedProd) return;

      try {
        await purchasingApi.createGoodsReceiptNote({
          purchase_order_id: null,
          to_location_id: inLocationId,
          received_by: receiverId,
          receipt_date: new Date().toISOString().split("T")[0],
          delivery_order_number: inDoc,
          status: "posted",
          notes: inNotes,
          items: [
            {
              purchase_order_item_id: null,
              product_id: matchedProd.id,
              received_quantity: inQty,
              rejected_quantity: 0,
              notes: inNotes || null,
            },
          ],
        });
        onTriggerNotification(
          `GRN penerimaan manual untuk SKU [${inSku}] berhasil dibuat.`,
        );
        await loadData();
      } catch (err) {
        onTriggerNotification(
          err instanceof Error ? err.message : "Gagal menerima barang",
        );
      }
    }

    setInQty(0);
    setInDoc("");
    setInNotes("");
    setInPoItemsQty({});
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
    .filter(po => po.status === 'Dipesan' || po.status === 'Diterima Sebagian')
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

  const employeeOptions = employees.map(emp => ({
    value: emp.name,
    label: `${emp.name} (${emp.roleName})`
  }));

  return (
    <div className="space-y-6">
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

      {isLoading ? (
        <SkeletonTable rows={5} cols={8} />
      ) : errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={loadData} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {activeTab === "stok" && (
            <StockTab
              products={products}
              search={search}
              stockStatusFilter={stockStatusFilter}
              openStockActionId={openStockActionId}
              setOpenStockActionId={setOpenStockActionId}
              openStockDetailModal={openStockDetailModal}
              onNavigate={onNavigate}
            />
          )}

          {activeTab === "masuk" && (
            <InwardTab goodsReceipts={goodsReceipts} locations={locations} search={search} />
          )}

          {activeTab === "keluar" && (
            <OutwardTab stockMovements={stockMovements} search={search} />
          )}

          {activeTab === "riwayat" && (
            <HistoryTab stockMovements={stockMovements} search={search} />
          )}
        </div>
      )}

      <InventoryModals
        products={products}
        locations={locations}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        getProductBySku={getProductBySku}
        getLocationName={getLocationName}
        showStockDetailModal={showStockDetailModal}
        setShowStockDetailModal={setShowStockDetailModal}
        getProductStocks={getProductStocks}
        showInwardModal={showInwardModal}
        setShowInwardModal={setShowInwardModal}
        inSku={inSku}
        setInSku={setInSku}
        inQty={inQty}
        setInQty={setInQty}
        inDoc={inDoc}
        setInDoc={setInDoc}
        inHandler={inHandler}
        setInHandler={setInHandler}
        inNotes={inNotes}
        setInNotes={setInNotes}
        inLocationId={inLocationId}
        setInLocationId={setInLocationId}
        poOptions={poOptions}
        purchaseOrders={purchaseOrders}
        inPoItemsQty={inPoItemsQty}
        setInPoItemsQty={setInPoItemsQty}
        getIncomingLocationOptions={getIncomingLocationOptions}
        getDefaultIncomingLocationId={getDefaultIncomingLocationId}
        handleInwardSubmit={handleInwardSubmit}
        showCorrectionModal={showCorrectionModal}
        setShowCorrectionModal={setShowCorrectionModal}
        correctionQty={correctionQty}
        setCorrectionQty={setCorrectionQty}
        correctionLocationId={correctionLocationId}
        setCorrectionLocationId={setCorrectionLocationId}
        correctionNotes={correctionNotes}
        setCorrectionNotes={setCorrectionNotes}
        handleCorrectionSubmit={handleCorrectionSubmit}
        showOutwardModal={showOutwardModal}
        setShowOutwardModal={setShowOutwardModal}
        outSku={outSku}
        setOutSku={setOutSku}
        outQty={outQty}
        setOutQty={setOutQty}
        outDoc={outDoc}
        setOutDoc={setOutDoc}
        outHandler={outHandler}
        setOutHandler={setOutHandler}
        outNotes={outNotes}
        setOutNotes={setOutNotes}
        outLocationId={outLocationId}
        setOutLocationId={setOutLocationId}
        soOptions={soOptions}
        getStockLocationOptions={getStockLocationOptions}
        getDefaultStockLocationId={getDefaultStockLocationId}
        handleOutwardSubmit={handleOutwardSubmit}
        employeeOptions={employeeOptions}
      />
    </div>
  );
}
