/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Product, ViewType } from '../types';

interface QrViewProps {
  products: Product[];
  currentSubView: 'list' | 'scanner' | 'detail';
  scannedSku: string | null;
  onNavigateSubView: (subView: 'list' | 'scanner' | 'detail', sku?: string | null) => void;
  onTriggerNotification: (message: string) => void;
  onUpdateProductStock: (sku: string, diff: number) => void;
}

export default function QrView({
  products,
  currentSubView,
  scannedSku,
  onNavigateSubView,
  onTriggerNotification,
  onUpdateProductStock,
}: QrViewProps) {
  const [search, setSearch] = useState('');
  const [showQrModal, setShowQrModal] = useState<Product | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [scanProgress, setScanProgress] = useState(0); // 0 to 100 for simulated camera scan delay
  const [scanTriggered, setScanTriggered] = useState<string | null>(null);

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

  // Generate a mock custom SVG QR Code to ensure visual perfection without external scripts failing
  const drawMockQrCode = (text: string, isBig: boolean = false) => {
    const size = isBig ? 150 : 44;
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className="bg-white p-1 rounded-lg border border-slate-200 shadow-inner">
        {/* Anchor squares */}
        <rect x="5" y="5" width="25" height="25" rx="2" fill="#0f172a" />
        <rect x="10" y="10" width="15" height="15" rx="1" fill="#ffffff" />
        <rect x="13" y="13" width="9" height="9" fill="#06b6d4" />

        <rect x="70" y="5" width="25" height="25" rx="2" fill="#0f172a" />
        <rect x="75" y="10" width="15" height="15" rx="1" fill="#ffffff" />
        <rect x="78" y="13" width="9" height="9" fill="#06b6d4" />

        <rect x="5" y="70" width="25" height="25" rx="2" fill="#0f172a" />
        <rect x="10" y="75" width="15" height="15" rx="1" fill="#ffffff" />
        <rect x="13" y="78" width="9" height="9" fill="#06b6d4" />

        {/* Dynamic looking random QR dots representing the text */}
        <rect x="40" y="5" width="8" height="8" fill="#1e293b" />
        <rect x="55" y="12" width="6" height="12" fill="#475569" />
        <rect x="42" y="24" width="14" height="6" fill="#0f172a" />
        
        <rect x="45" y="40" width="10" height="10" rx="1" fill="#0f172a" />
        <rect x="12" y="42" width="16" height="8" fill="#1e293b" />
        <rect x="20" y="55" width="8" height="10" fill="#475569" />

        <rect x="68" y="45" width="14" height="6" fill="#1e293b" />
        <rect x="85" y="40" width="10" height="15" fill="#0f172a" />
        <rect x="72" y="65" width="12" height="10" fill="#475569" />

        <rect x="38" y="72" width="10" height="10" fill="#1e293b" />
        <rect x="52" y="80" width="15" height="8" fill="#0891b2" />
        <rect x="40" y="88" width="22" height="6" fill="#0f172a" />
      </svg>
    );
  };

  // Find the scanned product details
  const scannedProduct = products.find(p => p.sku === scannedSku);

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
            QR CODE MATCH : OK
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
                    onUpdateProductStock(scannedProduct.sku, 10);
                    onTriggerNotification(`Sukses menambah 10 ${scannedProduct.unit} ke ${scannedProduct.name}`);
                  }}
                  className="flex-1 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded font-bold transition-all text-center"
                >
                  +10 Reorder
                </button>
                <button
                  onClick={() => {
                    if (scannedProduct.stock >= 5) {
                      onUpdateProductStock(scannedProduct.sku, -5);
                      onTriggerNotification(`Sukses mengurangi 5 ${scannedProduct.unit} dari ${scannedProduct.name}`);
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
  // 2. SCANNER SIMULATION DESIGN
  // -------------------------------------------------------------
  if (currentSubView === 'scanner') {
    return (
      <div className="space-y-6 max-w-xl mx-auto font-sans text-xs">
        {/* Top Visual panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <Scan size={36} className="text-cyan-500" />
          <div className="space-y-1">
            <h3 className="font-sans font-bold text-slate-800 text-sm">Pemindaian QR Code Produk (Simulasi Kamera)</h3>
            <p className="text-[10px] text-slate-450 text-slate-500 max-w-sm">
              Gunakan perangkat kamera internal untuk memindai lembaran QR Code di rak gudang atau di kemasan beton CV Beton Agung untuk memantau sisa stok otomatis.
            </p>
          </div>
        </div>

        {/* Live camera area simulation container */}
        <div className="relative bg-slate-950 aspect-square md:aspect-video rounded-2xl border-2 border-slate-850 overflow-hidden shadow-2xl shrink-0 flex flex-col justify-between p-4">
          {/* Neon Scanner corners */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br" />

          {/* Animated red laser sweeping line */}
          {scanTriggered && (
            <div className="absolute left-0 w-full h-1 bg-rose-500/85 shadow-[0_0_15px_#f43f5e] z-10 animate-pulse top-1/2" style={{ transform: 'translateY(-50%)' }} />
          )}

          {/* Centering Camera aperture target wire */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-40 h-40 border-2 border-dashed rounded-xl transition-colors ${
              scanTriggered ? 'border-rose-400 animate-pulse bg-slate-900/10' : 'border-white/20'
            } flex items-center justify-center`}>
              {scanTriggered ? (
                <div className="text-center font-mono text-[10px] text-rose-450 text-pink-400 font-bold space-y-2">
                  <Compass size={24} className="mx-auto animate-spin" />
                  <p>Membaca QR {scanProgress}%</p>
                </div>
              ) : (
                <Camera size={28} className="text-white/10" />
              )}
            </div>
          </div>

          {/* Top text status overlay */}
          <div className="relative z-10 flex justify-between items-center bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-300">
            <span className="flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>KAMERA SIMULATOR AKTIF</span>
            </span>
            <span>PROTOTYPE ONLY</span>
          </div>

          {/* Bottom quick hints instruction */}
          <div className="relative z-10 text-center text-[10px] text-slate-400 bg-slate-900/80 backdrop-blur rounded px-4 py-2 mt-auto">
            Klik salah satu tombol <strong>"Simulasikan Pindai SKU"</strong> di bawah untuk menguji proses autofill parser.
          </div>
        </div>

        {/* Dynamic testing list of triggers */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider mb-3">Simulasi Preset Lembar Label QR</p>
          <div className="grid grid-cols-2 gap-2.5">
            {products.slice(0, 4).map((p, pIdx) => (
              <button
                key={pIdx}
                disabled={!!scanTriggered}
                onClick={() => setScanTriggered(p.sku)}
                className="p-3 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 hover:border-slate-350 rounded-xl transition-all shadow-sm text-left flex items-center justify-between gap-1"
              >
                <div>
                  <span className="font-mono text-[9px] text-cyan-600 font-black">{p.sku}</span>
                  <strong className="text-slate-850 block mt-0.5 truncate max-w-[120px]">{p.name}</strong>
                </div>
                {drawMockQrCode(p.sku)}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. DAFTAR QR PRODUK LIST DESIGN
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
            placeholder="Search SKU atau Nama Produk untuk mencetak stiker QR..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <button
          onClick={() => onNavigateSubView('scanner')}
          className="px-4 py-2 bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-bold hover:opacity-90 rounded-lg text-xs flex items-center gap-2 shadow"
        >
          <Scan size={16} className="text-slate-920" />
          <span>Buka Scanner Kamera</span>
        </button>
      </div>

      {/* Main product listings table displaying QRs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                <th className="p-3.5 pl-5">SKU No.</th>
                <th className="p-3.5">Nama Item Produk</th>
                <th className="p-3.5">Sisa Kuantitas</th>
                <th className="p-3.5">Visual QR Code Label</th>
                <th className="p-3.5">Kondisi Stok</th>
                <th className="p-3.5 pr-5 text-right">Aksi Tempelan QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products
                .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
                .map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/40">
                    <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">{p.sku}</td>
                    <td className="p-3.5 font-bold text-slate-700">{p.name}</td>
                    <td className="p-3.5 font-mono text-slate-500">{p.stock} {p.unit}</td>
                    <td className="p-3.5">
                      <div className="py-1 flex items-center gap-2">
                        {drawMockQrCode(p.sku)}
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
                    <td className="p-3.5 pr-5 text-right space-x-1">
                      <button
                        onClick={() => {
                          setShowQrModal(p);
                          onTriggerNotification(`Membuka popup sticker QR ${p.sku}`);
                        }}
                        className="p-1 px-2 border hover:border-slate-350 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 rounded transition-colors"
                      >
                        Lihat QR
                      </button>
                      <button
                        onClick={() => {
                          onTriggerNotification(`Mengirim cetak stiker QR [${p.sku}] ke printer zebra harian`);
                        }}
                        className="p-1 px-2 border border-cyan-200 text-cyan-700 hover:bg-cyan-50 text-[10px] rounded transition-colors font-semibold"
                      >
                        Cetak QR
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View QR Sticker layout */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans text-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Header modal */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="font-bold">Kartu Sticker QR Code</h4>
              <button onClick={() => setShowQrModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Sticker panel display */}
            <div className="p-8 text-center space-y-5 flex flex-col items-center">
              <p className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-widest leading-none">CV BETON AGUNG LOGISTIC</p>
              
              {/* Massive QR drawing */}
              <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border shadow-inner">
                {drawMockQrCode(showQrModal.sku, true)}
              </div>

              <div className="space-y-1.5 text-center">
                <strong className="text-base font-sans font-black text-slate-800 tracking-tight leading-tight">{showQrModal.sku}</strong>
                <p className="text-xs font-bold text-slate-650 text-slate-500 max-w-[200px] leading-snug">{showQrModal.name}</p>
                <div className="pt-2 text-[9px] font-mono text-slate-400">
                  Storage Rak: <strong className="text-slate-600">{showQrModal.location}</strong>
                </div>
              </div>
            </div>

            {/* Buttons action */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-1.5 text-xs font-bold">
              <button
                onClick={() => {
                  onTriggerNotification(`Mendownload sticker asset ${showQrModal.sku}.png ke folder local.`);
                }}
                className="px-3 py-1.5 border hover:bg-slate-150 rounded-lg flex items-center gap-1 text-slate-650"
              >
                <Download size={13} />
                <span>Download PNG</span>
              </button>
              <button
                onClick={() => {
                  onTriggerNotification(`Mengirim stiker QR [${showQrModal.sku}] ke Printer Zebra Label.`);
                }}
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
