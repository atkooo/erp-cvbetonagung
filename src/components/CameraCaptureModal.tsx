import React, { useEffect, useRef, useState } from "react";
import { Camera, X } from "./icons";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function CameraCaptureModal({ isOpen, onClose, onCapture }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError("Tidak dapat mengakses kamera. Pastikan browser memiliki izin untuk menggunakan kamera perangkat Anda.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      onCapture(file);
      onClose();
    }, "image/jpeg", 0.9);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-lg flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-cyan-400" />
            <h3 className="font-sans font-bold text-sm">Ambil Foto Produk</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="relative bg-slate-100 flex items-center justify-center min-h-[300px]">
          {error ? (
            <div className="p-6 text-center text-red-500 text-xs font-medium">
              {error}
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-h-[60vh] object-contain bg-black"
            />
          )}
        </div>

        <div className="p-4 flex items-center justify-center bg-white border-t border-slate-200">
          <button
            onClick={handleCapture}
            disabled={!!error || !stream}
            className="w-16 h-16 rounded-full bg-cyan-500 hover:bg-cyan-600 border-4 border-cyan-100 flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            <Camera size={24} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
