import React from 'react';
import { X } from 'lucide-react';
import RealScanner from './RealScanner';

interface BarcodeScannerModalProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function BarcodeScannerModal({ onScan, onClose }: BarcodeScannerModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Scan Barcode Produk</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 bg-slate-50 flex flex-col items-center">
          <p className="text-xs text-slate-500 mb-4 text-center">
            Arahkan kamera ke barcode produk untuk menambahkan ke keranjang secara otomatis.
          </p>
          <RealScanner onScan={onScan} />
        </div>
        <div className="p-4 bg-white border-t border-slate-100 text-center">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
