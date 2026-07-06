/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Scan,
  CheckCircle2,
  XCircle,
  MapPin,
  QrCode,
} from "@/src/components/icons";
import { authStorage, apiClient } from "../services/api";
import { Html5QrcodeScanner } from "html5-qrcode";

interface AttendanceScannerViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function AttendanceScannerView({
  onTriggerNotification,
}: AttendanceScannerViewProps) {
  const [scanTriggered, setScanTriggered] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<{
    status: "success" | "error";
    message: string;
    name?: string;
    time?: string;
    type?: string;
  } | null>(null);

  const currentUser = authStorage.getUser();
  const selectedEmployeeId = currentUser?.employee_id;
  const selectedEmployeeName = currentUser?.name;

  const [isScanning, setIsScanning] = useState(true);

  // Initialize QR Scanner
  useEffect(() => {
    if (!isScanning) return;

    // Small delay to ensure the div is in the DOM
    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          // Success callback
          scanner.clear();
          setIsScanning(false);
          handleScan(decodedText);
        },
        (error) => {
          // Failure callback, ignore as it continuously fails when no QR code is found
        }
      );

      // Cleanup
      return () => {
        scanner.clear().catch(e => console.error(e));
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [isScanning]);

  const handleScan = async (qrData: string) => {
    if (!selectedEmployeeId) {
      setScanResult({
        status: "error",
        message: "Gagal: Anda belum tertaut dengan data Karyawan.",
      });
      return;
    }

    try {
      setScanResult(null);
      const response = await apiClient.post<{ data: any }>("/hrd/attendances/scan", {
        employee_id: selectedEmployeeId,
        location_qr: qrData,
      });

      // Based on API response format:
      // message, employee_name, time, type
      setScanResult({
        status: "success",
        message: response.data?.message || "Absensi berhasil.",
        name: response.data?.employee_name,
        time: response.data?.time,
        type: response.data?.type,
      });
      onTriggerNotification(`Berhasil: ${response.data?.message}`);
    } catch (err: any) {
      setScanResult({
        status: "error",
        message: err.response?.data?.message || err.message || "Gagal memindai QR Code.",
      });
    }
  };

  const drawMockQrCode = () => (
    <svg
      width={40}
      height={40}
      viewBox="0 0 100 100"
      className="bg-white p-1 rounded border border-slate-200"
    >
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

  // Reset scanner
  const handleResetScanner = () => {
    setScanResult(null);
    setScanTriggered(null);
    setIsScanning(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans text-xs">
      {/* Session User Info */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-indigo-500 font-mono tracking-wider">
            Mode Identitas Terverifikasi
          </span>
          <span className="text-slate-600 font-medium">Sesi Login Aktif:</span>
        </div>
        <div className="px-3 py-1.5 font-bold text-indigo-900 bg-white border border-indigo-200 rounded-lg shadow-sm">
          {selectedEmployeeName || "Tidak diketahui"}
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
              Silakan arahkan kamera HP Anda ke QR Code Absensi yang tertempel
              di dinding Kantor Pusat untuk melakukan Clock In atau Clock Out.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Camera Scanner Section */}
        <div className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col items-center p-4">
          <div className="w-full flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
              <QrCode size={16} className="text-emerald-500" />
              Kamera Pindai
            </h3>
            {!isScanning && (
              <button
                onClick={handleResetScanner}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold transition-colors"
              >
                Scan Ulang
              </button>
            )}
          </div>

          {isScanning ? (
            <div id="qr-reader" className="w-full max-w-[400px] overflow-hidden rounded-xl border-2 border-emerald-500/20"></div>
          ) : (
            <div className="w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <CheckCircle2 size={48} className="text-emerald-400 mb-4 opacity-50" />
              <p>Kamera dimatikan.</p>
              <p className="text-[10px] mt-1">Klik tombol "Scan Ulang" untuk menghidupkan kamera kembali.</p>
            </div>
          )}

          <div className="relative z-10 flex justify-center text-xs text-emerald-700 bg-emerald-50 rounded-lg px-4 py-2.5 mx-4 mt-4 text-center w-full max-w-[400px]">
            Arahkan ke QR Code Lokasi Kantor (Misal: QR-OFFICE-MAIN-1)
          </div>
        </div>

        {/* Result & Simulation Triggers */}
        <div className="space-y-6">
          {/* Result Panel */}
          <div
            className={`rounded-2xl p-6 border shadow-sm transition-all duration-300 ${scanResult ? (scanResult.status === "success" ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200") : "bg-white border-slate-200"}`}
          >
            <h3 className="font-bold text-slate-700 mb-4 border-b border-slate-200/50 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Status Terminal Absensi
            </h3>

            {scanResult ? (
              <div className="text-center space-y-3 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center">
                  {scanResult.status === "success" ? (
                    <CheckCircle2
                      size={48}
                      className="text-emerald-500 drop-shadow-sm"
                    />
                  ) : (
                    <XCircle
                      size={48}
                      className="text-rose-500 drop-shadow-sm"
                    />
                  )}
                </div>
                <div>
                  <h4
                    className={`text-lg font-black tracking-tight ${scanResult.status === "success" ? "text-emerald-700" : "text-rose-700"}`}
                  >
                    {scanResult.message}
                  </h4>
                  {scanResult.status === "success" && (
                    <div className="mt-4 bg-white/60 rounded-xl p-4 text-left space-y-2 border border-emerald-100/50">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">
                          Lokasi
                        </span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <MapPin size={12} /> Kantor Pusat
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">
                          Waktu{" "}
                          {scanResult.type === "clock_in" ? "Masuk" : "Pulang"}
                        </span>
                        <span className="font-mono font-bold text-emerald-600">
                          {scanResult.time} WIB
                        </span>
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
            <h3 className="font-bold text-slate-700 mb-3 text-[10px] uppercase tracking-wider">
              Simulasi QR Code Dinding Kantor
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => { setIsScanning(false); handleScan("QR-OFFICE-MAIN-1"); }}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-sm text-left"
              >
                <div>
                  <strong className="block text-slate-800 text-sm">
                    QR Absensi Kantor Pusat
                  </strong>
                  <span className="text-[10px] font-mono text-slate-500">
                    QR-OFFICE-MAIN-1
                  </span>
                </div>
                {drawMockQrCode()}
              </button>

              <button
                onClick={() => { setIsScanning(false); handleScan("INVALID-QR"); }}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-sm text-left"
              >
                <div>
                  <strong className="block text-slate-800 text-sm">
                    QR Code Salah / Palsu
                  </strong>
                  <span className="text-[10px] font-mono text-slate-500">
                    INVALID-QR
                  </span>
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
