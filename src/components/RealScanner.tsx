import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface RealScannerProps {
  onScan: (text: string) => void;
}

export default function RealScanner({ onScan }: RealScannerProps) {
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
              (errorMessage) => { }
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
