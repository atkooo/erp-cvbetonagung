/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Compass
} from '@/src/components/icons';
import { Product, ViewType, StockMovement } from '../types';
import { productsApi } from '../features/products/api';
import { inventoryApi } from '../features/inventory/api';
import Barcode from 'react-barcode';
import { Html5Qrcode } from 'html5-qrcode';
import * as htmlToImage from 'html-to-image';
import { useReactToPrint } from 'react-to-print';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import RealScanner from './RealScanner';


interface QrViewProps {
  currentSubView: 'list' | 'scanner' | 'detail';
  scannedSku: string | null;
  onNavigateSubView: (subView: 'list' | 'scanner' | 'detail', sku?: string | null) => void;
  onTriggerNotification: (message: string) => void;
}

export default function QrView({
  currentSubView,
  scannedSku,
  onNavigateSubView,
  onTriggerNotification,
}: QrViewProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showQrModal, setShowQrModal] = useState<Product | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [scanProgress, setScanProgress] = useState(0); // 0 to 100 for simulated camera scan delay
  const [scanTriggered, setScanTriggered] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Reset to page 1 if search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const [printProduct, setPrintProduct] = useState<Product | null>(null);
  const hiddenStickerRef = useRef<HTMLDivElement>(null);
  const stickerRef = useRef<HTMLDivElement>(null);

  const handleDownloadPng = async () => {
    if (!stickerRef.current || !showQrModal) return;
    try {
      const dataUrl = await htmlToImage.toPng(stickerRef.current, { backgroundColor: '#ffffff', pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `Barcode-${showQrModal.sku}.png`;
      link.href = dataUrl;
      link.click();
      onTriggerNotification(`Berhasil mendownload sticker asset Barcode-${showQrModal.sku}.png`);
    } catch (e) {
      console.error(e);
      onTriggerNotification(`Gagal mendownload sticker asset.`);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: stickerRef,
    documentTitle: showQrModal ? `Barcode-${showQrModal.sku}` : 'Barcode',
    onAfterPrint: () => onTriggerNotification(`Berhasil mengirim stiker Barcode [${showQrModal?.sku}] ke printer.`),
  });

  const handleHiddenPrint = useReactToPrint({
    contentRef: hiddenStickerRef,
    documentTitle: printProduct ? `Barcode-${printProduct.sku}` : 'Barcode',
    onAfterPrint: () => {
      onTriggerNotification(`Berhasil mengirim stiker Barcode [${printProduct?.sku}] ke printer harian.`);
      setPrintProduct(null);
    },
  });

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
    import('../utils/companyProfile').then(({ getCompanyProfile }) => {
      setCompanyProfile(getCompanyProfile());
      const handleProfileUpdate = () => setCompanyProfile(getCompanyProfile());
      window.addEventListener('erp_company_profile_updated', handleProfileUpdate);
      return () => window.removeEventListener('erp_company_profile_updated', handleProfileUpdate);
    });
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const [prods, stocks] = await Promise.all([
        productsApi.getProducts(),
        inventoryApi.getProductStocks(),
      ]);

      const combinedProds = prods.map(p => {
        const stockData = stocks.find(s => s.product?.sku === p.sku);
        return {
          ...p,
          stock: stockData ? Number(stockData.quantity) : 0,
          location: stockData?.location?.name || 'Gudang Utama',
        };
      });

      setProducts(combinedProds);
    } catch (err) {
      console.error('Failed to load products in QrView', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProductStock = async (sku: string, diff: number) => {
    const prod = products.find(p => p.sku === sku);
    if (!prod) return;

    try {
      // Find the location ID for this product from stocks
      const stocks = await inventoryApi.getProductStocks();
      const matchedStock = stocks.find(s => s.product_id === prod.id || s.product?.sku === sku);
      const locationId = matchedStock?.location_id || '9f2a95e6-xxxx-xxxx-xxxx-xxxxxxxxxxxx'; // generic location fallback

      if (diff > 0) {
        await inventoryApi.receiveGoods({
          product_id: prod.id,
          quantity: diff,
          location_id: locationId,
          reference_type: 'QR-ADJUST',
          reference_number: 'QR-IN',
          notes: 'Penyesuaian stok masuk via scan QR',
        });
      } else if (diff < 0) {
        await inventoryApi.issueGoods({
          product_id: prod.id,
          quantity: Math.abs(diff),
          location_id: locationId,
          reference_type: 'QR-ADJUST',
          reference_number: 'QR-OUT',
          notes: 'Penyesuaian stok keluar via scan QR',
        });
      }
      onTriggerNotification(`Sukses memperbarui stok ${prod.name}`);
      await loadProducts();
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal memperbarui stok via API');
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Formatting currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
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
            onNavigateSubView('detail', scanTriggered);
            onTriggerNotification(`QR Code SKU [${scanTriggered}] Berhasil Terpindai!`);
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
      <div className={`bg-white p-2 border border-black rounded ${large ? 'shadow-sm' : ''} inline-block`}>
        <Barcode renderer="img" value={value || 'EMPTY'} width={large ? 2 : 1.2} height={large ? 60 : 35} fontSize={large ? 14 : 10} margin={0} background="#ffffff" lineColor="#000000" />
      </div>
    );
  };

  // Find the scanned product details
  const scannedProduct = products.find(p => p.qrValue === scannedSku || p.sku === scannedSku);

  // -------------------------------------------------------------
  // 1. DETAIL SCAN VIEW DESIGN
  // -------------------------------------------------------------
  let viewContent = null;

  if (currentSubView === 'detail' && scannedProduct) {
    viewContent = (
      <div className="space-y-6 max-w-4xl mx-auto font-sans text-xs">
        {/* Title action bar */}
        <div className="flex items-center justify-between pb-3 border-b">
          <button
            onClick={() => onNavigateSubView('scanner')}
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
                <span className="text-[10px] font-medium">No Image Available</span>
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
                  style={{ width: `${Math.min((scannedProduct.stock / (scannedProduct.minStock * 4)) * 100, 100)}%` }}
                  className={`h-full rounded-full ${scannedProduct.stock <= scannedProduct.minStock ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}
                />
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-2 border rounded-lg border-dashed border-slate-200 mt-2 text-[10px]">
                <span className="text-slate-400">Min Stock Safety:</span>
                <span className="font-mono font-bold text-slate-700">{scannedProduct.minStock} {scannedProduct.unit}</span>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
                <button
                  onClick={() => navigate(`/sales/pos?add_sku=${scannedProduct.qrValue || scannedProduct.sku}`)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-sm shadow-emerald-600/20"
                >
                  <ShoppingCart size={18} />
                  <span>Tambahkan ke POS</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate(`/inventory/stock-in?sku=${scannedProduct.sku}`)}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition-colors border border-blue-200"
                  >
                    <Plus size={16} />
                    <span className="text-[11px]">Stok Masuk</span>
                  </button>
                  <button
                    onClick={() => navigate(`/inventory/stock-out?sku=${scannedProduct.sku}`)}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold transition-colors border border-amber-200"
                  >
                    <Minus size={16} />
                    <span className="text-[11px]">Stok Keluar</span>
                  </button>
                  <button
                    onClick={() => navigate(`/inventory/opname?sku=${scannedProduct.sku}`)}
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
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Harga Jual Standard</span>
                <strong className="text-sm font-sans font-semibold text-slate-900 mt-1.5 block">
                  {formatIDR(scannedProduct.sellingPrice)}
                </strong>
                <span className="text-[9px] text-slate-400">Exclude PPN 11% / Borongan</span>
              </div>
              <div className="p-3 bg-slate-50 border rounded-xl">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Storage Coordinates</span>
                <strong className="text-sm font-sans font-semibold text-slate-900 mt-1.5 block flex items-center gap-1">
                  <MapPin size={14} className="text-cyan-500" />
                  <span>{scannedProduct.location}</span>
                </strong>
                <span className="text-[9px] text-slate-400">Posisi Gudang / Rak</span>
              </div>
            </div>

            {/* General details information */}
            <div className="space-y-1.5 text-slate-500 text-[11px] leading-relaxed">
              <strong className="text-slate-700 uppercase font-bold text-[10px] block">Deskripsi Teknis Material:</strong>
              <p>
                {scannedProduct.description || 'Tidak ada deskripsi material yang tersedia.'}
              </p>
            </div>

            {/* Short Stock Movement history loop */}
            <div className="pt-2">
              <strong className="text-slate-750 uppercase font-bold text-[10px] tracking-widest font-mono text-slate-400 block mb-2">Riwayat Alur Logistik Singkat</strong>
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
  if (currentSubView === 'list') {
    const filteredProducts = products.filter(p => p.sku.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase()));
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

    viewContent = (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
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
                      <span className="font-mono font-bold text-slate-800">{prod.sku}</span>
                      <p className="font-bold text-slate-600 mt-0.5 truncate max-w-[200px]">{prod.name}</p>
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
                        onClick={() => setShowQrModal(prod)}
                        className="px-2.5 py-1 text-[10px] bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold rounded border border-cyan-200"
                      >
                        Cetak Barcode
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      Tidak ada produk ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-slate-200">
              <div className="text-[10px] text-slate-400 font-mono">
                Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredProducts.length)} dari {filteredProducts.length} data
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold shadow-sm"
                >
                  Prev
                </button>
                <span className="text-slate-500 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
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
  if (currentSubView === 'scanner') {
    viewContent = (
      <div className="space-y-6 max-w-xl mx-auto font-sans text-xs">
        {/* Top Visual panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <Scan size={36} className="text-cyan-500" />
          <div className="space-y-1">
            <h3 className="font-sans font-bold text-slate-800 text-sm">Pemindaian Barcode Produk</h3>
            <p className="text-[10px] text-slate-450 text-slate-500 max-w-sm">
              Gunakan perangkat kamera untuk memindai label Barcode di rak gudang atau di kemasan beton {companyProfile?.name || 'Perusahaan'}.
            </p>
          </div>
        </div>

        {/* Live camera area */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
          <RealScanner
            onScan={(text) => {
              onTriggerNotification(`Berhasil memindai kode: ${text}`);
              onNavigateSubView('detail', text);
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
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Cetak Barcode Label</h3>
              <button onClick={() => setShowQrModal(null)} className="text-slate-400 hover:text-rose-500">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center space-y-4 bg-slate-50">
              <div ref={stickerRef} className="bg-white p-5 rounded-xl border-2 border-black inline-flex flex-col items-center justify-center" style={{ width: '240px' }}>
                
                <h4 className="font-black text-black text-[12px] uppercase tracking-widest mb-3 mt-1">
                  {companyProfile?.name || 'Perusahaan'}
                </h4>
                
                <div className="bg-white p-1.5 rounded-lg border-2 border-black mb-3">
                  {drawBarcode(showQrModal.qrValue || showQrModal.sku, true)}
                </div>
                
                <div className="w-full border-t-2 border-dashed border-black pt-2.5 text-center">
                  <p className="font-bold text-[11px] text-black leading-snug line-clamp-2">
                    {showQrModal.name}
                  </p>
                  <p className="text-[10px] font-mono font-bold text-black mt-1 uppercase tracking-widest">
                    {showQrModal.category}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex gap-2 justify-end bg-slate-50">
              <button
                onClick={handleDownloadPng}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg font-bold transition-colors"
              >
                <Download size={16} />
                <span>Download</span>
              </button>
              <button
                onClick={handlePrint}
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
        <div ref={hiddenStickerRef} className="bg-white p-5 rounded-xl border-2 border-black inline-flex flex-col items-center justify-center" style={{ width: '240px' }}>
          
          <h4 className="font-black text-black text-[12px] uppercase tracking-widest mb-3 mt-1">
            {companyProfile?.name || 'Perusahaan'}
          </h4>
          
          <div className="bg-white p-1.5 rounded-lg border-2 border-black mb-3">
            {printProduct && drawBarcode(printProduct.qrValue || printProduct.sku, true)}
          </div>
          
          {printProduct && (
            <div className="w-full border-t-2 border-dashed border-black pt-2.5 text-center">
              <p className="font-bold text-[11px] text-black leading-snug line-clamp-2">
                {printProduct.name}
              </p>
              <p className="text-[10px] font-mono font-bold text-black mt-1 uppercase tracking-widest">
                {printProduct.category}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

