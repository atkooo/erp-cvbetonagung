/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Scan, Camera, Compass, CheckCircle2, XCircle, MapPin } from '@/src/components/icons';
import { authStorage } from '../services/api';

interface AttendanceScannerViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function AttendanceScannerView({ onTriggerNotification }: AttendanceScannerViewProps) {
  const [scanTriggered, setScanTriggered] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<{ status: 'success'|'error', message: string, name?: string, time?: string, type?: string } | null>(null);
  
  const currentUser = authStorage.getUser();
  const selectedEmployeeId = currentUser?.employee_id;
  const selectedEmployeeName = currentUser?.name;

  // Draw mock QR code for Location
  const drawMockQrCode = () => (
    <svg width={40} height={40} viewBox="0 0 100 100" className="bg-white p-1 rounded border border-slate-200">
      <rect x="5" y="5" width="25" height="25" rx="2" fill="#0f172a" />
      <rect x="10" y="10" width="15" height="15" rx="1" fill="#ffffff" />
      <rect x="13" y="13" width="9" height="9" fill="#059669" />
      <rect x="70" y="5" width="25" height="25" rx="2" fill="#0f172a" />
      <rect x="75" y="10" width="15" height="15" rx="1" fill="#ffffff" />
      <rect x="78" y="13" width="9" height="9" fill="#059669" />
      <rect x="5" y="70" width="25" height="25" rx="2" fill="#0f172a" />
      <rect x="10" y="75" width="15" height="15" rx="1" fill="#ffffff" />
      <rect x="13" y="78" width="9" height="9" fill="#059669" />
      <rect x="40" y="5" width="15" height="8" fill="#1e293b" />
      <rect x="55" y="15" width="8" height="15" fill="#475569" />
      <rect x="42" y="24" width="25" height="6" fill="#0f172a" />
      <rect x="35" y="40" width="10" height="15" rx="1" fill="#0f172a" />
      <rect x="12" y="42" width="15" height="8" fill="#1e293b" />
      <rect x="20" y="55" width="12" height="10" fill="#475569" />
      <rect x="65" y="40" width="14" height="20" fill="#1e293b" />
      <rect x="85" y="40" width="10" height="15" fill="#0f172a" />
      <rect x="70" y="65" width="15" height="10" fill="#475569" />
      <rect x="38" y="65" width="15" height="12" fill="#1e293b" />
      <rect x="55" y="80" width="20" height="10" fill="#059669" />
      <rect x="40" y="88" width="25" height="6" fill="#0f172a" />
    </svg>
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (scanTriggered) {
      setScanProgress(0);
      setScanResult(null);
      interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
              if (!selectedEmployeeId) {
                setScanResult({
                  status: 'error',
                  message: 'Gagal: Anda belum tertaut dengan data Karyawan.'
                });
                setScanTriggered(null);
                return;
              }

              // Make real API call
              import('../services/api').then(({ apiClient }) => {
                apiClient.post('/hrd/attendances/scan', {
                  employee_id: selectedEmployeeId,
                  location_qr: scanTriggered
                }).then(() => {
                  const isClockOut = Math.random() > 0.5; // API response currently doesn't return clock_in/out type, we simulate it for UI
                  setScanResult({
                    status: 'success',
                    message: isClockOut ? 'Clock Out berhasil.' : 'Clock In berhasil.',
                    name: selectedEmployeeName,
                    time: new Date().toLocaleTimeString('id-ID', { hour12: false }),
                    type: isClockOut ? 'clock_out' : 'clock_in'
                  });
                  onTriggerNotification(`Berhasil memindai lokasi kantor`);
                }).catch((err) => {
                  setScanResult({
                    status: 'error',
                    message: err.message || 'Gagal memindai QR Code.'
                  });
                }).finally(() => {
                  setScanTriggered(null);
                });
              });

            return 100;
          }
          return prev + 20;
        });
      }, 150);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scanTriggered, selectedEmployeeId, selectedEmployeeName, onTriggerNotification]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans text-xs">
      {/* Session User Info */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-indigo-500 font-mono tracking-wider">Mode Identitas Terverifikasi</span>
          <span className="text-slate-600 font-medium">Sesi Login Aktif:</span>
        </div>
        <div className="px-3 py-1.5 font-bold text-indigo-900 bg-white border border-indigo-200 rounded-lg shadow-sm">
          {selectedEmployeeName || 'Tidak diketahui'}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start w-full">
            <span className="text-[10px] font-mono tracking-wider text-emerald-600 font-bold uppercase bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-flex items-center gap-1.5 mb-2">
              <Scan size={12} /> ATTENDANCE SCANNER
            </span>
            <h1 className="font-sans font-black tracking-tight text-xl text-slate-800">
              Kamera HP Karyawan
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">
              Silakan arahkan kamera HP Anda ke QR Code Absensi yang tertempel di dinding Kantor Pusat untuk melakukan Clock In atau Clock Out.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Camera Simulator Section */}
        <div className="relative bg-slate-950 aspect-[4/5] rounded-2xl border-4 border-slate-800 overflow-hidden shadow-2xl flex flex-col p-4">
          {/* Scanner borders */}
          <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg" />
          <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg" />
          <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg" />
          <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-lg" />

          {scanTriggered && (
            <div className="absolute left-0 w-full h-1 bg-emerald-500/80 shadow-[0_0_15px_#10b981] z-10 animate-pulse top-1/2 -translate-y-1/2" />
          )}

          <div className="flex-1 flex items-center justify-center relative z-0">
            <div className={`w-48 h-48 border-2 border-dashed rounded-2xl flex items-center justify-center transition-all ${scanTriggered ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/20'}`}>
              {scanTriggered ? (
                <div className="text-center font-mono font-bold text-emerald-400 space-y-3">
                  <Compass size={32} className="mx-auto animate-spin" />
                  <p className="tracking-widest">MEMBACA {scanProgress}%</p>
                </div>
              ) : (
                <Camera size={40} className="text-white/10" />
              )}
            </div>
          </div>

          <div className="relative z-10 flex justify-center text-[10px] text-slate-400 bg-slate-900/60 backdrop-blur rounded-lg px-4 py-2.5 mx-4 mb-2">
            Arahkan ke QR Code Lokasi Kantor
          </div>
        </div>

        {/* Result & Simulation Triggers */}
        <div className="space-y-6">
          {/* Result Panel */}
          <div className={`rounded-2xl p-6 border shadow-sm transition-all duration-300 ${scanResult ? (scanResult.status === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200') : 'bg-white border-slate-200'}`}>
            <h3 className="font-bold text-slate-700 mb-4 border-b border-slate-200/50 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Status Terminal Absensi
            </h3>
            
            {scanResult ? (
              <div className="text-center space-y-3 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center">
                  {scanResult.status === 'success' ? (
                    <CheckCircle2 size={48} className="text-emerald-500 drop-shadow-sm" />
                  ) : (
                    <XCircle size={48} className="text-rose-500 drop-shadow-sm" />
                  )}
                </div>
                <div>
                  <h4 className={`text-lg font-black tracking-tight ${scanResult.status === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {scanResult.message}
                  </h4>
                  {scanResult.status === 'success' && (
                    <div className="mt-4 bg-white/60 rounded-xl p-4 text-left space-y-2 border border-emerald-100/50">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Lokasi</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1"><MapPin size={12}/> Kantor Pusat</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Waktu {scanResult.type === 'clock_in' ? 'Masuk' : 'Pulang'}</span>
                        <span className="font-mono font-bold text-emerald-600">{scanResult.time} WIB</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <Scan size={32} className="mx-auto opacity-50" />
                <p>Menunggu hasil pindaian QR Code lokasi...</p>
              </div>
            )}
          </div>

          {/* Test Simulators */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-3 text-[10px] uppercase tracking-wider">Simulasi QR Code Dinding Kantor</h3>
            <div className="space-y-2">
              <button
                disabled={!!scanTriggered}
                onClick={() => setScanTriggered('QR-OFFICE-MAIN-1')}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl disabled:opacity-50 transition-colors shadow-sm text-left"
              >
                <div>
                  <strong className="block text-slate-800 text-sm">QR Absensi Kantor Pusat</strong>
                  <span className="text-[10px] font-mono text-slate-500">QR-OFFICE-MAIN-1</span>
                </div>
                {drawMockQrCode()}
              </button>

              <button
                disabled={!!scanTriggered}
                onClick={() => setScanTriggered('INVALID-QR')}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl disabled:opacity-50 transition-colors shadow-sm text-left"
              >
                <div>
                  <strong className="block text-slate-800 text-sm">QR Code Salah / Palsu</strong>
                  <span className="text-[10px] font-mono text-slate-500">INVALID-QR</span>
                </div>
                {drawMockQrCode()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
