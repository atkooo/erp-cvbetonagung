/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  QrCode,
  Scan,
  Search,
  Printer,
  Download,
  X,
  Camera,
  Play,
  RotateCcw,
  CheckCircle,
  Package,
  MapPin,
  FileCode,
  DollarSign,
  Eye,
  Tag,
  Boxes,
  Compass,
} from "@/src/components/icons";
import { Product, ViewType, StockMovement } from "../types";
import { productsApi } from "../features/products/api";
import { inventoryApi } from "../features/inventory/api";
import Barcode from "react-barcode";
import { Html5Qrcode } from "html5-qrcode";
import * as htmlToImage from "html-to-image";
import { useReactToPrint } from "react-to-print";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import RealScanner from "./RealScanner";

type BarcodePaperSize = "a4" | "letter" | "58mm" | "80mm";
type BarcodePrintLayout =
  | "single"
  | "2x2"
  | "3x3"
  | "2x3"
  | "3x2"
  | "4x4"
  | "custom"
  | "list";

interface BarcodePrintSettings {
  paperSize: BarcodePaperSize;
  layout: BarcodePrintLayout;
  customRows: number;
  customColumns: number;
  showCompanyName: boolean;
  showBarcode: boolean;
  showName: boolean;
  showCategory: boolean;
  showPrice: boolean;
  showSku: boolean;
  showStock: boolean;
  showLocation: boolean;
}

const defaultBarcodePrintSettings: BarcodePrintSettings = {
  paperSize: "80mm",
  layout: "single",
  customRows: 2,
  customColumns: 2,
  showCompanyName: true,
  showBarcode: true,
  showName: true,
  showCategory: true,
  showPrice: true,
  showSku: true,
  showStock: false,
  showLocation: false,
};

interface QrViewProps {
  currentSubView: "list" | "scanner" | "detail";
  scannedSku: string | null;
  onNavigateSubView: (
    subView: "list" | "scanner" | "detail",
    sku?: string | null,
  ) => void;
  onTriggerNotification: (message: string) => void;
}

export default function QrView({
  currentSubView,
  scannedSku,
  onNavigateSubView,
  onTriggerNotification,
}: QrViewProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showQrModal, setShowQrModal] = useState<Product | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [scanProgress, setScanProgress] = useState(0); // 0 to 100 for simulated camera scan delay
  const [scanTriggered, setScanTriggered] = useState<string | null>(null);

  const [listPage, setListPage] = useState(1);
  const [bulkPage, setBulkPage] = useState(1);
  const itemsPerPage = 15;

  // Reset list page to 1 if search or category changes
  useEffect(() => {
    setListPage(1);
  }, [search, selectedCategory]);

  const [printProduct, setPrintProduct] = useState<Product | null>(null);
  const [bulkPrintProducts, setBulkPrintProducts] = useState<Product[]>([]);
  const [isBulkPrint, setIsBulkPrint] = useState(false);
  const [printSettings, setPrintSettings] = useState<BarcodePrintSettings>(
    defaultBarcodePrintSettings,
  );
  const hiddenStickerRef = useRef<HTMLDivElement>(null);
  const hiddenBulkRef = useRef<HTMLDivElement>(null);
  const stickerRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    const targetRef = isBulkPrint
      ? hiddenBulkRef.current
      : stickerRef.current || hiddenStickerRef.current;
    if (!targetRef) return;

    try {
      const dataUrl = await htmlToImage.toPng(targetRef, {
        backgroundColor: "#ffffff",
        pixelRatio: 3,
      });
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "px", format: "a4" });
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight);

      let heightLeft = imgHeight - pdfHeight;
      let position = -pdfHeight;
      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
        position -= pdfHeight;
        heightLeft -= pdfHeight;
      }

      const fileName = isBulkPrint
        ? "Barcode-Bulk.pdf"
        : `Barcode-${showQrModal?.sku || "produk"}.pdf`;
      pdf.save(fileName);
      onTriggerNotification(`Berhasil mendownload PDF ${fileName}`);
    } catch (e) {
      console.error(e);
      onTriggerNotification(`Gagal mendownload PDF.`);
    }
  };

  const handleBulkPrint = useReactToPrint({
    contentRef: hiddenBulkRef,
    documentTitle: "Barcode-Bulk",
    onAfterPrint: () =>
      onTriggerNotification(
        `Berhasil mengirim stiker Barcode Bulk ke printer.`,
      ),
  });

  const handleHiddenPrint = useReactToPrint({
    contentRef: hiddenStickerRef,
    documentTitle: printProduct ? `Barcode-${printProduct.sku}` : "Barcode",
    onAfterPrint: () => {
      onTriggerNotification(
        `Berhasil mengirim stiker Barcode [${printProduct?.sku}] ke printer.`,
      );
      setPrintProduct(null);
    },
  });

  const triggerSinglePrint = () => {
    if (showQrModal) {
      setPrintProduct(showQrModal);
    }
  };

  useEffect(() => {
    if (printProduct) {
      // Need a small timeout to ensure the DOM is updated before printing
      const timer = setTimeout(() => {
        handleHiddenPrint();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [printProduct, handleHiddenPrint]);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<any>(null);

  useEffect(() => {
    // Import dynamically to avoid circular dependencies if any, or just use normal import
    import("../utils/companyProfile").then(({ getCompanyProfile }) => {
      setCompanyProfile(getCompanyProfile());
      const handleProfileUpdate = () => setCompanyProfile(getCompanyProfile());
      window.addEventListener(
        "erp_company_profile_updated",
        handleProfileUpdate,
      );
      return () =>
        window.removeEventListener(
          "erp_company_profile_updated",
          handleProfileUpdate,
        );
    });
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const [prods, stocks] = await Promise.all([
        productsApi.getProducts(),
        inventoryApi.getProductStocks(),
      ]);

      const combinedProds = prods.map((p) => {
        const stockData = stocks.find((s) => s.product?.sku === p.sku);
        return {
          ...p,
          stock: stockData ? Number(stockData.quantity) : 0,
          location: stockData?.location?.name || "Gudang Utama",
        };
      });

      setProducts(combinedProds);
    } catch (err) {
      console.error("Failed to load products in QrView", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProductStock = async (sku: string, diff: number) => {
    const prod = products.find((p) => p.sku === sku);
    if (!prod) return;

    try {
      // Find the location ID for this product from stocks
      const stocks = await inventoryApi.getProductStocks();
      const matchedStock = stocks.find(
        (s) => s.product_id === prod.id || s.product?.sku === sku,
      );
      const locationId =
        matchedStock?.location_id || "9f2a95e6-xxxx-xxxx-xxxx-xxxxxxxxxxxx"; // generic location fallback

      if (diff > 0) {
        await inventoryApi.receiveGoods({
          product_id: prod.id,
          quantity: diff,
          location_id: locationId,
          reference_type: "QR-ADJUST",
          reference_number: "QR-IN",
          notes: "Penyesuaian stok masuk via scan QR",
        });
      } else if (diff < 0) {
        await inventoryApi.issueGoods({
          product_id: prod.id,
          quantity: Math.abs(diff),
          location_id: locationId,
          reference_type: "QR-ADJUST",
          reference_number: "QR-OUT",
          notes: "Penyesuaian stok keluar via scan QR",
        });
      }
      onTriggerNotification(`Sukses memperbarui stok ${prod.name}`);
      await loadProducts();
    } catch (err) {
      onTriggerNotification(
        err instanceof Error ? err.message : "Gagal memperbarui stok via API",
      );
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Formatting currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Simulated scan tick effect
  useEffect(() => {
    let interval: any;
    if (scanTriggered) {
      setScanProgress(0);
      interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            onNavigateSubView("detail", scanTriggered);
            onTriggerNotification(
              `QR Code SKU [${scanTriggered}] Berhasil Terpindai!`,
            );
            setScanTriggered(null);
            return 100;
          }
          return prev + 25;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [scanTriggered]);

  const drawBarcode = (value: string, large = false) => {
    return (
      <div
        className={`bg-white p-2 border border-black rounded ${large ? "shadow-sm" : ""} inline-block`}
      >
        <Barcode
          renderer="img"
          value={value || "EMPTY"}
          width={large ? 2 : 1.2}
          height={large ? 60 : 35}
          fontSize={large ? 14 : 10}
          margin={0}
          background="#ffffff"
          lineColor="#000000"
        />
      </div>
    );
  };

  const updatePrintSetting = <K extends keyof BarcodePrintSettings>(
    key: K,
    value: BarcodePrintSettings[K],
  ) => {
    setPrintSettings((prev) => ({ ...prev, [key]: value }));
  };

  const openBulkPrintModal = (products: Product[]) => {
    setBulkPrintProducts(products);
    setBulkPage(1);
    setIsBulkPrint(true);
    setShowQrModal(null);
  };

  const getPageRange = (current: number, total: number) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = [1];
    const left = Math.max(2, current - 1);
    const right = Math.min(total - 1, current + 1);

    if (left > 2) pages.push(-1);
    for (let page = left; page <= right; page += 1) {
      pages.push(page);
    }
    if (right < total - 1) pages.push(-1);
    pages.push(total);

    return pages;
  };

  const closePrintModal = () => {
    setShowQrModal(null);
    setBulkPrintProducts([]);
    setIsBulkPrint(false);
  };

  const getStickerContainerStyle = () => {
    switch (printSettings.paperSize) {
      case "58mm":
        return { width: "180px", maxWidth: "100%" };
      case "80mm":
        return { width: "240px", maxWidth: "100%" };
      case "a4":
        return { width: "100%", maxWidth: "880px" };
      case "letter":
        return { width: "100%", maxWidth: "760px" };
      default:
        return { width: "280px", maxWidth: "100%" };
    }
  };

  const getLayoutGridClass = (layout: BarcodePrintLayout, columns?: number) => {
    if (layout === "list") return "grid-cols-1";
    if (layout === "single") return "grid-cols-1";
    if (layout === "2x2") return "grid-cols-2";
    if (layout === "3x3") return "grid-cols-3";
    if (layout === "2x3") return "grid-cols-2";
    if (layout === "3x2") return "grid-cols-3";
    if (layout === "4x4") return "grid-cols-4";
    if (layout === "custom") return "grid-cols-1";
    return "grid-cols-1";
  };

  const getLayoutCardCount = (layout: BarcodePrintLayout) => {
    if (layout === "single") return 1;
    if (layout === "2x2") return 4;
    if (layout === "3x3") return 9;
    if (layout === "2x3") return 6;
    if (layout === "3x2") return 6;
    if (layout === "4x4") return 16;
    if (layout === "custom")
      return printSettings.customRows * printSettings.customColumns;
    return 1;
  };

  const getBulkPageSize = () => {
    if (printSettings.layout === "list") return itemsPerPage;
    return getLayoutCardCount(printSettings.layout);
  };

  const renderBarcodeLabel = (product: Product, copies = 1) => {
    const isCustom = printSettings.layout === "custom";
    const columns =
      copies > 1
        ? isCustom
          ? Math.min(Math.max(printSettings.customColumns, 1), 6)
          : printSettings.layout === "2x2"
            ? 2
            : printSettings.layout === "3x3"
              ? 3
              : printSettings.layout === "2x3"
                ? 2
                : printSettings.layout === "3x2"
                  ? 3
                  : printSettings.layout === "4x4"
                    ? 4
                    : 1
        : 1;

    return (
      <div
        className={
          copies === 1 || printSettings.layout === "list"
            ? "w-full"
            : "grid w-full gap-2"
        }
        style={
          copies === 1 || printSettings.layout === "list"
            ? undefined
            : { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
        }
      >
        {Array.from({ length: copies }).map((_, index) => (
          <div
            key={`${product.id}-${index}`}
            className="bg-white border-2 border-black rounded-xl p-3 text-center"
            style={{ width: "100%" }}
          >
            {printSettings.showCompanyName && (
              <h4 className="font-black text-black text-[11px] uppercase tracking-widest mb-2">
                {companyProfile?.name || "Perusahaan"}
              </h4>
            )}

            {printSettings.showBarcode && (
              <div className="bg-white p-1.5 rounded-lg border border-black mb-2 inline-flex justify-center">
                {drawBarcode(product.qrValue || product.sku, true)}
              </div>
            )}

            <div className="w-full space-y-1">
              {printSettings.showName && (
                <p className="font-bold text-[11px] text-black leading-snug line-clamp-2">
                  {product.name}
                </p>
              )}
              {printSettings.showSku && (
                <p className="text-[10px] font-mono font-bold text-black uppercase tracking-widest">
                  {product.sku}
                </p>
              )}
              {printSettings.showCategory && (
                <p className="text-[10px] font-mono font-bold text-black uppercase tracking-widest">
                  {product.category}
                </p>
              )}
              {printSettings.showPrice && (
                <p className="text-[10px] font-mono font-bold text-black">
                  {formatIDR(product.sellingPrice)}
                </p>
              )}
              {printSettings.showStock && (
                <p className="text-[10px] font-mono font-bold text-slate-700">
                  Stok: {product.stock} {product.unit}
                </p>
              )}
              {printSettings.showLocation && (
                <p className="text-[10px] font-mono font-bold text-slate-700">
                  Lokasi: {product.location}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBulkPrintPreview = (products: Product[]) => {
    const isCustom = printSettings.layout === "custom";
    const columns = isCustom
      ? Math.min(Math.max(printSettings.customColumns, 1), 6)
      : printSettings.layout === "2x2"
        ? 2
        : printSettings.layout === "3x3"
          ? 3
          : printSettings.layout === "2x3"
            ? 2
            : printSettings.layout === "3x2"
              ? 3
              : printSettings.layout === "4x4"
                ? 4
                : 1;

    return (
      <div
        className={
          printSettings.layout === "list"
            ? "w-full space-y-2"
            : "grid w-full gap-4"
        }
        style={
          printSettings.layout === "list"
            ? undefined
            : { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
        }
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white border-2 border-black rounded-xl p-3 text-center"
            style={{
              width: "100%",
              pageBreakInside: "avoid",
              breakInside: "avoid",
            }}
          >
            {printSettings.showCompanyName && (
              <h4 className="font-black text-black text-[11px] uppercase tracking-widest mb-2">
                {companyProfile?.name || "Perusahaan"}
              </h4>
            )}

            {printSettings.showBarcode && (
              <div className="bg-white p-1.5 rounded-lg border border-black mb-2 inline-flex justify-center">
                {drawBarcode(product.qrValue || product.sku, true)}
              </div>
            )}

            <div className="w-full space-y-1">
              {printSettings.showName && (
                <p className="font-bold text-[11px] text-black leading-snug line-clamp-2">
                  {product.name}
                </p>
              )}
              {printSettings.showSku && (
                <p className="text-[10px] font-mono font-bold text-black uppercase tracking-widest">
                  {product.sku}
                </p>
              )}
              {printSettings.showCategory && (
                <p className="text-[10px] font-mono font-bold text-black uppercase tracking-widest">
                  {product.category}
                </p>
              )}
              {printSettings.showPrice && (
                <p className="text-[10px] font-mono font-bold text-black">
                  {formatIDR(product.sellingPrice)}
                </p>
              )}
              {printSettings.showStock && (
                <p className="text-[10px] font-mono font-bold text-slate-700">
                  Stok: {product.stock} {product.unit}
                </p>
              )}
              {printSettings.showLocation && (
                <p className="text-[10px] font-mono font-bold text-slate-700">
                  Lokasi: {product.location}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Find the scanned product details
  const scannedProduct = products.find(
    (p) => p.qrValue === scannedSku || p.sku === scannedSku,
  );

  // -------------------------------------------------------------
  // 1. DETAIL SCAN VIEW DESIGN
  // -------------------------------------------------------------
  let viewContent = null;

  if (currentSubView === "detail" && scannedProduct) {
    viewContent = (
      <div className="space-y-6 max-w-4xl mx-auto font-sans text-xs">
        {/* Title action bar */}
        <div className="flex items-center justify-between pb-3 border-b">
          <button
            onClick={() => onNavigateSubView("scanner")}
            className="flex items-center gap-1.5 px-3 py-1.5 border hover:bg-slate-50 text-slate-600 rounded bg-white font-bold"
          >
            <RotateCcw size={14} />
            <span>Kembali Scan Lagi</span>
          </button>

          <span className="text-[10px] uppercase font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            BARCODE MATCH : OK
          </span>
        </div>

        {/* Two columns layout representing scanned product */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Col 1 Left: Visual Photo & Stock Meter */}
          <div className="md:col-span-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="aspect-video w-full overflow-hidden bg-slate-50 border rounded-xl relative">
              <div className="flex flex-col items-center justify-center w-full h-full text-slate-300">
                <Package size={48} className="mb-2" />
                <span className="text-[10px] font-medium">
                  No Image Available
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between font-bold text-slate-700">
                <span>Stok Saat Ini:</span>
                <span className="font-mono text-cyan-600 text-sm font-black">
                  {scannedProduct.stock} {scannedProduct.unit}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min((scannedProduct.stock / (scannedProduct.minStock * 4)) * 100, 100)}%`,
                  }}
                  className={`h-full rounded-full ${
                    scannedProduct.stock <= scannedProduct.minStock
                      ? "bg-amber-500"
                      : "bg-cyan-500"
                  }`}
                />
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-2 border rounded-lg border-dashed border-slate-200 mt-2 text-[10px]">
                <span className="text-slate-400">Min Stock Safety:</span>
                <span className="font-mono font-bold text-slate-700">
                  {scannedProduct.minStock} {scannedProduct.unit}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
                <button
                  onClick={() =>
                    navigate(
                      `/sales/pos?add_sku=${scannedProduct.qrValue || scannedProduct.sku}`,
                    )
                  }
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-sm shadow-emerald-600/20"
                >
                  <ShoppingCart size={18} />
                  <span>Tambahkan ke POS</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      navigate(`/inventory/stock-in?sku=${scannedProduct.sku}`)
                    }
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition-colors border border-blue-200"
                  >
                    <Plus size={16} />
                    <span className="text-[11px]">Stok Masuk</span>
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/inventory/stock-out?sku=${scannedProduct.sku}`)
                    }
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold transition-colors border border-amber-200"
                  >
                    <Minus size={16} />
                    <span className="text-[11px]">Stok Keluar</span>
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/inventory/opname?sku=${scannedProduct.sku}`)
                    }
                    className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold transition-colors border border-indigo-200"
                  >
                    <CheckCircle size={16} />
                    <span className="text-[11px]">Stock Opname</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Col 2 Right: Rich text facts specifications */}
          <div className="md:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b pb-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border">
                  {scannedProduct.sku}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold border-indigo-100">
                  <Tag size={10} className="text-indigo-400" />
                  <span>{scannedProduct.category}</span>
                </span>
              </div>
              <h3 className="font-sans font-black text-slate-800 text-sm md:text-base leading-snug">
                {scannedProduct.name}
              </h3>
            </div>

            {/* Spec tables */}
            <div className="grid grid-cols-2 gap-4 text-slate-700 pb-3 border-b border-light">
              <div className="p-3 bg-slate-50 border rounded-xl">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                  Harga Jual Standard
                </span>
                <strong className="text-sm font-sans font-semibold text-slate-900 mt-1.5 block">
                  {formatIDR(scannedProduct.sellingPrice)}
                </strong>
                <span className="text-[9px] text-slate-400">
                  Exclude PPN 11% / Borongan
                </span>
              </div>
              <div className="p-3 bg-slate-50 border rounded-xl">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                  Storage Coordinates
                </span>
                <strong className="text-sm font-sans font-semibold text-slate-900 mt-1.5 block flex items-center gap-1">
                  <MapPin size={14} className="text-cyan-500" />
                  <span>{scannedProduct.location}</span>
                </strong>
                <span className="text-[9px] text-slate-400">
                  Posisi Gudang / Rak
                </span>
              </div>
            </div>

            {/* General details information */}
            <div className="space-y-1.5 text-slate-500 text-[11px] leading-relaxed">
              <strong className="text-slate-700 uppercase font-bold text-[10px] block">
                Deskripsi Teknis Material:
              </strong>
              <p>
                {scannedProduct.description ||
                  "Tidak ada deskripsi material yang tersedia."}
              </p>
            </div>

            {/* Short Stock Movement history loop */}
            <div className="pt-2">
              <strong className="text-slate-750 uppercase font-bold text-[10px] tracking-widest font-mono text-slate-400 block mb-2">
                Riwayat Alur Logistik Singkat
              </strong>
              <div className="text-slate-400 text-center py-4 border border-dashed rounded-lg bg-slate-50 text-[10px]">
                Belum ada data riwayat logistik yang terhubung untuk produk ini.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. LIST VIEW DESIGN
  // -------------------------------------------------------------
  if (currentSubView === "list") {
    const filteredProducts = products.filter((p) => {
      const matchesSearch =
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    const totalPages = Math.max(
      1,
      Math.ceil(filteredProducts.length / itemsPerPage),
    );
    const activeListPage = Math.min(listPage, totalPages);
    const startIndex = (activeListPage - 1) * itemsPerPage;
    const paginatedProducts = filteredProducts.slice(
      startIndex,
      startIndex + itemsPerPage,
    );

    const categories = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean)),
    );

    viewContent = (
      <div className="space-y-5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk berdasarkan SKU atau Nama..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-sans text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>

            <label className="flex items-center gap-2 text-[10px] text-slate-600">
              <span className="font-semibold">Filter Kategori</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-sans text-slate-700"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-600 border border-slate-200">
              {filteredProducts.length} item
            </div>
            <button
              onClick={() => openBulkPrintModal(filteredProducts)}
              className="px-3 py-2 text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded border border-amber-200"
            >
              Bulk Cetak
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                  <th className="p-3.5 pl-5">SKU / Nama Produk</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Stok Fisik</th>
                  <th className="p-3.5">Lokasi</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/40">
                    <td className="p-3.5 pl-5">
                      <span className="font-mono font-bold text-slate-800">
                        {prod.sku}
                      </span>
                      <p className="font-bold text-slate-600 mt-0.5 truncate max-w-[200px]">
                        {prod.name}
                      </p>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 rounded border text-[10px] font-semibold text-slate-600">
                        {prod.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-black text-slate-700">
                      {prod.stock} {prod.unit}
                    </td>
                    <td className="p-3.5 font-bold text-slate-600 flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400" />
                      <span>{prod.location}</span>
                    </td>
                    <td className="p-3.5 pr-5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setShowQrModal(prod);
                          setIsBulkPrint(false);
                        }}
                        className="px-2.5 py-1 text-[10px] bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold rounded border border-cyan-200"
                      >
                        Cetak Barcode
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-12 text-slate-400"
                    >
                      Tidak ada produk ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 px-5 py-3 bg-white border-t border-slate-200 md:flex-row md:items-center md:justify-between">
              <div className="text-[10px] text-slate-400 font-mono">
                Menampilkan {startIndex + 1} -{" "}
                {Math.min(startIndex + itemsPerPage, filteredProducts.length)}{" "}
                dari {filteredProducts.length} data
              </div>
              <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
                <button
                  onClick={() => setListPage((page) => Math.max(1, page - 1))}
                  disabled={activeListPage === 1}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold shadow-sm"
                >
                  Prev
                </button>
                {getPageRange(activeListPage, totalPages).map((page, index) =>
                  page === -1 ? (
                    <span
                      key={`ellipsis-list-${index}`}
                      className="px-2.5 py-1.5 text-slate-500"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setListPage(page)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold ${
                        activeListPage === page
                          ? "bg-cyan-600 text-white border-cyan-600"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() =>
                    setListPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={activeListPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. SCANNER DESIGN
  // -------------------------------------------------------------
  if (currentSubView === "scanner") {
    viewContent = (
      <div className="space-y-6 max-w-xl mx-auto font-sans text-xs">
        {/* Top Visual panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <Scan size={36} className="text-cyan-500" />
          <div className="space-y-1">
            <h3 className="font-sans font-bold text-slate-800 text-sm">
              Pemindaian Barcode Produk
            </h3>
            <p className="text-[10px] text-slate-450 text-slate-500 max-w-sm">
              Gunakan perangkat kamera untuk memindai label Barcode di rak
              gudang atau di kemasan beton{" "}
              {companyProfile?.name || "Perusahaan"}.
            </p>
          </div>
        </div>

        {/* Live camera area */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
          <RealScanner
            onScan={(text) => {
              onTriggerNotification(`Berhasil memindai kode: ${text}`);
              onNavigateSubView("detail", text);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {viewContent}

      {/* Modal Cetak Barcode */}
      {(showQrModal || bulkPrintProducts.length > 0) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[calc(100vh-3rem)] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                {isBulkPrint
                  ? "Bulk Cetak Barcode Label"
                  : "Cetak Barcode Label"}
              </h3>
              <button
                onClick={closePrintModal}
                className="text-slate-400 hover:text-rose-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4 bg-slate-50">
              <div className="w-full space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] text-slate-600">
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold">Ukuran Kertas</span>
                    <select
                      value={printSettings.paperSize}
                      onChange={(e) =>
                        updatePrintSetting(
                          "paperSize",
                          e.target.value as BarcodePaperSize,
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-2"
                    >
                      <option value="58mm">58 mm</option>
                      <option value="80mm">80 mm</option>
                      <option value="a4">A4</option>
                      <option value="letter">Letter</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="font-semibold">Layout</span>
                    <select
                      value={printSettings.layout}
                      onChange={(e) =>
                        updatePrintSetting(
                          "layout",
                          e.target.value as BarcodePrintLayout,
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-2"
                    >
                      <option value="single">Single</option>
                      <option value="2x2">2x2</option>
                      <option value="3x3">3x3</option>
                      <option value="2x3">2x3</option>
                      <option value="3x2">3x2</option>
                      <option value="4x4">4x4</option>
                      <option value="custom">Custom</option>
                      <option value="list">List</option>
                    </select>
                  </label>
                </div>
                {printSettings.layout === "custom" && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1 text-[10px] text-slate-600">
                      <span className="font-semibold">Baris</span>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={printSettings.customRows}
                        onChange={(e) =>
                          updatePrintSetting(
                            "customRows",
                            Math.max(1, Math.min(6, Number(e.target.value))),
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-[10px] text-slate-600">
                      <span className="font-semibold">Kolom</span>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={printSettings.customColumns}
                        onChange={(e) =>
                          updatePrintSetting(
                            "customColumns",
                            Math.max(1, Math.min(6, Number(e.target.value))),
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs"
                      />
                    </label>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-3 text-[10px] text-slate-600">
                  {[
                    { key: "showCompanyName", label: "Nama Perusahaan" },
                    { key: "showBarcode", label: "Barcode" },
                    { key: "showName", label: "Nama Produk" },
                    { key: "showCategory", label: "Kategori" },
                    { key: "showPrice", label: "Harga" },
                    { key: "showSku", label: "SKU" },
                    { key: "showStock", label: "Stok" },
                    { key: "showLocation", label: "Lokasi" },
                  ].map((field) => (
                    <label key={field.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(
                          printSettings[
                            field.key as keyof BarcodePrintSettings
                          ],
                        )}
                        onChange={(e) =>
                          updatePrintSetting(
                            field.key as keyof BarcodePrintSettings,
                            e.target.checked,
                          )
                        }
                        className="h-3.5 w-3.5 rounded border-slate-300"
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>

                <div
                  ref={stickerRef}
                  className="bg-white p-4 rounded-xl w-full overflow-hidden mx-auto"
                  style={getStickerContainerStyle()}
                >
                  {isBulkPrint && bulkPrintProducts.length > 0
                    ? renderBulkPrintPreview(
                        bulkPrintProducts.slice(
                          (bulkPage - 1) * getBulkPageSize(),
                          bulkPage * getBulkPageSize(),
                        ),
                      )
                    : showQrModal
                      ? renderBarcodeLabel(showQrModal, 1)
                      : null}
                </div>

                {isBulkPrint &&
                  bulkPrintProducts.length > getBulkPageSize() && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-[10px] text-slate-600">
                      <div>
                        Halaman {bulkPage} dari{" "}
                        {Math.ceil(
                          bulkPrintProducts.length / getBulkPageSize(),
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() =>
                            setBulkPage((page) => Math.max(1, page - 1))
                          }
                          disabled={bulkPage === 1}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold shadow-sm"
                        >
                          Prev
                        </button>
                        {getPageRange(
                          bulkPage,
                          Math.ceil(
                            bulkPrintProducts.length / getBulkPageSize(),
                          ),
                        ).map((page, index) =>
                          page === -1 ? (
                            <span
                              key={`ellipsis-${index}`}
                              className="px-2.5 py-1.5 text-slate-500"
                            >
                              …
                            </span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => setBulkPage(page)}
                              className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold ${
                                bulkPage === page
                                  ? "bg-cyan-600 text-white border-cyan-600"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {page}
                            </button>
                          ),
                        )}
                        <button
                          onClick={() =>
                            setBulkPage((page) =>
                              Math.min(
                                Math.ceil(
                                  bulkPrintProducts.length / getBulkPageSize(),
                                ),
                                page + 1,
                              ),
                            )
                          }
                          disabled={
                            bulkPage ===
                            Math.ceil(
                              bulkPrintProducts.length / getBulkPageSize(),
                            )
                          }
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold shadow-sm"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex gap-2 justify-end bg-slate-50">
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg font-bold transition-colors"
              >
                <Download size={16} />
                <span>Download PDF</span>
              </button>
              <button
                onClick={isBulkPrint ? handleBulkPrint : triggerSinglePrint}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold transition-colors shadow-sm shadow-cyan-600/20"
              >
                <Printer size={16} />
                <span>Print Stiker</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden container for print Product quick action */}
      <div className="hidden">
        <div
          ref={hiddenStickerRef}
          className="bg-white p-4 rounded-xl border-2 border-black w-full overflow-hidden"
          style={getStickerContainerStyle()}
        >
          {printProduct && renderBarcodeLabel(printProduct)}
        </div>
      </div>

      {/* Hidden full bulk container for download/print all bulk preview pages */}
      <div
        style={{
          position: "absolute",
          left: -9999,
          top: 0,
          width: "1000px",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <div
          ref={hiddenBulkRef}
          className="bg-white p-4 rounded-xl border-2 border-black w-full overflow-hidden"
          style={getStickerContainerStyle()}
        >
          {bulkPrintProducts.length > 0 &&
            renderBulkPrintPreview(bulkPrintProducts)}
        </div>
      </div>
    </>
  );
}
