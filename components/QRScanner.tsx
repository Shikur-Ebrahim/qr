"use client";

/**
 * QRScanner – camera-based QR code reader.
 *
 * Uses html5-qrcode (loaded dynamically to avoid SSR issues).
 * Calls onScan(decodedText) when a QR is detected.
 */

import { useEffect, useRef, useState } from "react";

interface Props {
  onScan: (decodedText: string) => void;
  active: boolean;
}

export default function QRScanner({ onScan, active }: Props) {
  const scannerRef = useRef<unknown>(null);
  const containerId = "html5-qr-scanner";
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!active) return;

    let html5QrCode: unknown;

    const startScanner = async () => {
      try {
        setLoading(true);
        setPermissionDenied(false);
        setError(null);

        // Dynamic import to prevent SSR errors
        const { Html5Qrcode } = await import("html5-qrcode");

        html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        const qrCodeSuccessCallback = (decodedText: string) => {
          onScanRef.current(decodedText);
        };

        await (html5QrCode as { start: (constraints: unknown, config: unknown, cb: unknown) => Promise<void> }).start(
          { facingMode: "environment" }, // rear camera on mobile
          {
            fps: 10,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          qrCodeSuccessCallback
        );

        setLoading(false);
      } catch (err: unknown) {
        setLoading(false);
        const message = err instanceof Error ? err.message : String(err);
        if (
          message.toLowerCase().includes("permission") ||
          message.toLowerCase().includes("notallowed") ||
          message.toLowerCase().includes("denied")
        ) {
          setPermissionDenied(true);
        } else if (message.toLowerCase().includes("notfound")) {
          setError("No camera found on this device.");
        } else {
          setError("Could not start camera. " + message);
        }
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && typeof (html5QrCode as { isScanning?: boolean }).isScanning === "boolean" && (html5QrCode as { isScanning: boolean }).isScanning) {
        (html5QrCode as { stop: () => Promise<void>; clear: () => void }).stop()
          .then(() => {
            (html5QrCode as { clear: () => void }).clear();
          })
          .catch(() => {});
      }
    };
  }, [active]);

  if (permissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-72 bg-gray-900 rounded-2xl text-center p-6 gap-4">
        <span className="text-5xl">📵</span>
        <p className="text-white font-semibold text-lg">Camera permission denied</p>
        <p className="text-gray-400 text-sm">
          Please allow camera access in your browser settings, then reload the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 bg-white text-gray-900 font-bold px-6 py-2 rounded-xl text-sm"
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-72 bg-gray-900 rounded-2xl text-center p-6 gap-4">
        <span className="text-5xl">⚠️</span>
        <p className="text-white font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 rounded-2xl z-10 gap-3">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-sm font-medium">Starting camera…</p>
        </div>
      )}
      {/* html5-qrcode mounts into this div */}
      <div
        id={containerId}
        className="w-full rounded-2xl overflow-hidden"
        style={{ minHeight: "320px" }}
      />
      {!loading && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Corner guides */}
          <div className="relative w-[280px] h-[280px]">
            {[
              "top-0 left-0 border-t-4 border-l-4",
              "top-0 right-0 border-t-4 border-r-4",
              "bottom-0 left-0 border-b-4 border-l-4",
              "bottom-0 right-0 border-b-4 border-r-4",
            ].map((cls, i) => (
              <div
                key={i}
                className={`absolute w-10 h-10 border-white rounded-sm ${cls}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
