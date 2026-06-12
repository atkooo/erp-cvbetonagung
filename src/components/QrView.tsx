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
import html2canvas from 'html2canvas';
import { useReactToPrint } from 'react-to-print';


function RealScanner({ onScan }: { onScan: (text: string) => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const initScanner = async () => {
      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode('reader');
        }
        
        // Wait a small tick to ensure the DOM element exists
        setTimeout(async () => {
          if (!isMounted || !scannerRef.current) return;
          try {
            await scannerRef.current.start(
              { facingMode: 'environment' },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText) => {
                onScan(decodedText);
                if (scannerRef.current?.isScanning) {
                  scannerRef.current.stop().catch(console.error);
                }
              },
              (errorMessage) => {}
            );
          } catch (err) {
            console.error("Failed to start camera", err);
          }
        }, 100);
      } catch (err) {
        console.error("Error initializing scanner", err);
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
           scannerRef.current?.clear();
        }).catch(console.error);
      }
    };
  }, []);

  return <div id="reader" className="w-full max-w-sm mx-auto bg-slate-900 rounded-xl overflow-hidden aspect-square border-4 border-slate-800" />;
}

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
  const [search, setSearch] = useState('');
  const [showQrModal, setShowQrModal] = useState<Product | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [scanProgress, setScanProgress] = useState(0); // 0 to 100 for simulated camera scan delay
  const [scanTriggered, setScanTriggered] = useState<string | null>(null);

  const stickerRef = useRef<HTMLDivElement>(null);

  const handleDownloadPng = async () => {
    if (!stickerRef.current || !showQrModal) return;
    try {
      const canvas = await html2canvas(stickerRef.current, { scale: 3, backgroundColor: '#ffffff' });
      const dataUrl = canvas.toDataURL('image/png');
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

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      <div className={`bg-white p-2 border border-slate-200 rounded ${large ? 'shadow-sm' : ''} inline-block`}>
        <Barcode value={value || 'EMPTY'} width={large ? 2 : 1.2} height={large ? 60 : 35} fontSize={large ? 14 : 10} margin={0} background="#ffffff" lineColor="#0f172a" />
      </div>
    );
  };

  // Find the scanned product details
  const scannedProduct = products.find(p => p.qrValue === scannedSku || p.sku === scannedSku);

  // -------------------------------------------------------------
  // 1. DETAIL SCAN VIEW DESIGN
  // -------------------------------------------------------------
  if (currentSubView === 'detail' && scannedProduct) {
    const productImages: Record<string, string> = {
      'KBH-GRC-D6': 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=400',
      'KBH-ENM-D4': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400',
      'LSP-BTN-C30': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400',
      'RST-BTN-MIN': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400',
    };

    return (
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
              <img
                src={productImages[scannedProduct.sku] || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400'}
                alt={scannedProduct.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 text-white rounded font-mono text-[9px] font-bold">
                Photo Asset
              </span>
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
                  className={`h-full rounded-full ${
                    scannedProduct.stock <= scannedProduct.minStock ? 'bg-amber-500' : 'bg-cyan-500'
                  }`}
                />
              </div>
              
              <div className="flex justify-between items-center bg-slate-50 p-2 border.rounded-lg border-dashed border-slate-200 mt-2 text-[10px]">
                <span className="text-slate-400">Min Stock Safety:</span>
                <span className="font-mono font-bold text-slate-705">{scannedProduct.minStock} {scannedProduct.unit}</span>
              </div>

              {/* Adjust stock quick simulation on scan result screen */}
              <div className="pt-2 flex gap-1 bg-slate-55 p-1 rounded-md border text-[10px]">
                <button
                  onClick={() => {
                    handleUpdateProductStock(scannedProduct.sku, 10);
                  }}
                  className="flex-1 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded font-bold transition-all text-center"
                >
                  +10 Reorder
                </button>
                <button
                  onClick={() => {
                    if (scannedProduct.stock >= 5) {
                      handleUpdateProductStock(scannedProduct.sku, -5);
                    } else {
                      onTriggerNotification('Gagal: Stok tidak mencukupi!');
                    }
                  }}
                  className="flex-1 py-1.5 bg-rose-50 text-rose-800 hover:bg-rose-150 rounded font-bold transition-all text-center"
                >
                  -5 Distribusi
                </button>
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
                <span className="text-[9px] text-slate-400">Workshop & Gudang Cabang Sda</span>
              </div>
            </div>

            {/* General details information */}
            <div className="space-y-1.5 text-slate-500 text-[11px] leading-relaxed">
              <strong className="text-slate-700 uppercase font-bold text-[10px] block">Deskripsi Teknis Material:</strong>
              <p>
                Produk pracetak beton CV Beton Agung diproduksi menggunakan formula pasir Lumajang super dipadukan semen Portland kualitas tinggi SNI. Diperkuat dengan besi wiremesh M8 antikarat di dalam cetakannya. Mampu menahan beban cuaca eksternal dan memiliki estetika relief yang sangat presisi, dipastikan lulus uji QA laboratorium sipil CV Beton Agung.
              </p>
            </div>

            {/* Short Stock Movement history loop */}
            <div className="pt-2">
              <strong className="text-slate-750 uppercase font-bold text-[10px] tracking-widest font-mono text-slate-400 block mb-2">Riwayat Alur Logistik Singkat</strong>
              <div className="space-y-1.5 border-l border-slate-200 pl-4 ml-1">
                <div className="relative text-[10px]">
                  <span className="absolute -left-[21px] top-0.5 w-2 h-2 bg-emerald-500 rounded-full" />
                  <p className="text-slate-700 font-bold">Produk Masuk Gudang (Inward)</p>
                  <span className="text-slate-400 text-[9px] font-mono block">28 Mei - Referensi PO-012 | Kuantitas: +150</span>
                </div>
                <div className="relative text-[10px]">
                  <span className="absolute -left-[21px] top-0.5 w-2 h-2 bg-rose-500 rounded-full" />
                  <p className="text-slate-700 font-bold">Pengiriman Material ke Sidoarjo (Outward)</p>
                  <span className="text-slate-400 text-[9px] font-mono block">29 Mei - Referensi SO-088 | Kuantitas: -350</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. SCANNER DESIGN
  // -------------------------------------------------------------
  if (currentSubView === 'scanner') {
    return (
      <div className="space-y-6 max-w-xl mx-auto font-sans text-xs">
        {/* Top Visual panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <Scan size={36} className="text-cyan-500" />
          <div className="space-y-1">
            <h3 className="font-sans font-bold text-slate-800 text-sm">Pemindaian Barcode Produk</h3>
            <p className="text-[10px] text-slate-450 text-slate-500 max-w-sm">
              Gunakan perangkat kamera untuk memindai label Barcode di rak gudang atau di kemasan beton CV Beton Agung.
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

        {/* Dynamic testing list of triggers */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider mb-3">Pindai Cepat (Untuk Testing)</p>
          <div className="grid grid-cols-2 gap-2.5">
            {products.slice(0, 4).map((p, pIdx) => (
              <button
                key={pIdx}
                disabled={!!scanTriggered}
                onClick={() => {
                  onTriggerNotification(`Berhasil memindai kode: ${p.qrValue || p.sku}`);
                  onNavigateSubView('detail', p.qrValue || p.sku);
                }}
                className="p-3 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 hover:border-slate-350 rounded-xl transition-all shadow-sm text-left flex items-center justify-between gap-1"
              >
                <div>
                  <span className="font-mono text-[9px] text-cyan-600 font-black">{p.qrValue || p.sku}</span>
                  <strong className="text-slate-850 block mt-0.5 truncate max-w-[120px]">{p.name}</strong>
                </div>
                {drawBarcode(p.qrValue || p.sku)}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. DAFTAR BARCODE PRODUK LIST DESIGN
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Search Header and navigation action triggers */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU atau Nama Produk untuk mencetak stiker Barcode..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <button
          onClick={() => onNavigateSubView('scanner')}
          className="px-4 py-2 bg-slate-900 border border-slate-800 text-white font-bold hover:bg-slate-800 rounded-lg text-xs flex items-center gap-2 shadow cursor-pointer"
        >
          <Scan size={16} className="text-white" />
          <span>Buka Scanner Kamera</span>
        </button>
      </div>

      {/* Main product listings table displaying Barcodes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                <th className="p-3.5 pl-5">SKU No. / Barcode</th>
                <th className="p-3.5">Nama Item Produk</th>
                <th className="p-3.5">Sisa Kuantitas</th>
                <th className="p-3.5">Visual Barcode Label</th>
                <th className="p-3.5">Kondisi Stok</th>
                <th className="p-3.5 pr-5 text-right">Aksi Tempelan Barcode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products
                .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
                .map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/40">
                    <td className="p-3.5 pl-5">
                      <span className="font-mono font-bold text-slate-800 block">{p.sku}</span>
                      <span className="text-[10px] text-indigo-600 font-mono font-semibold block mt-0.5">Barcode: {p.qrValue || p.sku}</span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">{p.name}</td>
                    <td className="p-3.5 font-mono text-slate-500">{p.stock} {p.unit}</td>
                    <td className="p-3.5">
                      <div className="py-1 flex items-center gap-2">
                        {drawBarcode(p.qrValue || p.sku)}
                        <span className="text-[10px] font-mono text-slate-400">Label format: G1-A</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        p.status === 'Aman' ? 'bg-emerald-100 text-emerald-800' :
                        p.status === 'Menipis' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setShowQrModal(p);
                            onTriggerNotification(`Membuka popup sticker Barcode ${p.sku}`);
                          }}
                          className="px-2 py-1.5 border border-slate-200 hover:border-slate-300 text-[10px] font-semibold bg-slate-50 hover:bg-slate-100 text-slate-600 rounded flex items-center gap-1.5 transition-colors"
                        >
                          <Eye size={12} />
                          <span>Lihat</span>
                        </button>
                        <button
                          onClick={() => {
                            onTriggerNotification(`Mengirim cetak stiker Barcode [${p.sku}] ke printer zebra harian`);
                          }}
                          className="px-2 py-1.5 border border-cyan-200 text-[10px] font-semibold text-cyan-700 bg-cyan-50/50 hover:bg-cyan-100 rounded flex items-center gap-1.5 transition-colors"
                        >
                          <Printer size={12} />
                          <span>Cetak</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View Barcode Sticker layout */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans text-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Header modal */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="font-bold">Kartu Sticker Barcode</h4>
              <button onClick={() => setShowQrModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Sticker panel display */}
            <div ref={stickerRef} className="p-8 text-center space-y-5 flex flex-col items-center bg-white">
              <p className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-widest leading-none">CV BETON AGUNG LOGISTIC</p>
              
              <div className="mt-6 flex justify-center bg-white p-4 rounded-xl border-2 border-dashed border-slate-200">
                <div className="relative group">
                  {drawBarcode(showQrModal.qrValue || showQrModal.sku, true)}
                </div>
              </div>

              <div className="space-y-1.5 text-center">
                <strong className="text-base font-sans font-black text-slate-800 tracking-tight leading-tight">{showQrModal.sku}</strong>
                <p className="text-xs font-bold text-slate-650 text-slate-500 max-w-[200px] leading-snug">{showQrModal.name}</p>
                <div className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono inline-block border border-slate-200 mt-1">
                  Barcode: <strong className="text-slate-800">{showQrModal.qrValue || showQrModal.sku}</strong>
                </div>
                <div className="pt-2 text-[9px] font-mono text-slate-400">
                  Storage Rak: <strong className="text-slate-600">{showQrModal.location}</strong>
                </div>
              </div>
            </div>

            {/* Buttons action */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-1.5 text-xs font-bold">
              <button
                onClick={handleDownloadPng}
                className="px-3 py-1.5 border hover:bg-slate-150 rounded-lg flex items-center gap-1 text-slate-650"
              >
                <Download size={13} />
                <span>Download PNG</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1"
              >
                <Printer size={13} />
                <span>Cetak Stiker</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
