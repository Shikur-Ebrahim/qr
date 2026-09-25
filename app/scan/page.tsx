"use client";

/**
 * /scan page – Camera QR scanner for event ticket validation.
 *
 * Flow:
 * 1. Camera opens and continuously scans for QR codes
 * 2. On detection, token is extracted from the QR content
 * 3. Token is sent to POST /api/tickets/validate
 * 4. Result is displayed (ACCEPTED / ALREADY_USED / INVALID)
 * 5. Staff taps "Scan Next Ticket" to reset
 *
 * The QR code may contain either:
 *   - A full URL: https://yourapp.com/scan?token=<token>
 *   - A raw token string
 */

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import TicketResult from "@/components/TicketResult";
import type { ValidateTicketResponse } from "@/types/ticket";

// Load QRScanner only on the client (camera API not available in SSR)
const QRScanner = dynamic(() => import("@/components/QRScanner"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-72 bg-slate-800 rounded-2xl">
      <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

type PageState = "scanning" | "validating" | "result";

function extractToken(raw: string): string {
  try {
    const url = new URL(raw);
    const token = url.searchParams.get("token");
    if (token) return token.trim();
  } catch {
    // Not a URL – treat the raw string as the token
  }
  return raw.trim();
}

export default function ScanPage() {
  const [pageState, setPageState] = useState<PageState>("scanning");
  const [result, setResult] = useState<ValidateTicketResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const lastScannedRef = useRef<string>("");

  const handleScan = useCallback(
    async (rawText: string) => {
      // Debounce: ignore if already processing or same token scanned twice rapidly
      if (isValidating || pageState !== "scanning") return;
      if (rawText === lastScannedRef.current) return;
      lastScannedRef.current = rawText;

      const token = extractToken(rawText);
      if (!token) return;

      setIsValidating(true);
      setPageState("validating");

      try {
        const response = await fetch("/api/tickets/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrToken: token }),
        });

        const data: ValidateTicketResponse = await response.json();
        setResult(data);
        setPageState("result");
      } catch {
        setResult({
          success: false,
          status: "INVALID",
          message: "Network error. Please check your connection and try again.",
        });
        setPageState("result");
      } finally {
        setIsValidating(false);
      }
    },
    [isValidating, pageState]
  );

  const handleReset = useCallback(() => {
    lastScannedRef.current = "";
    setResult(null);
    setPageState("scanning");
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 pt-safe-top py-4 border-b border-slate-800">
        <Link
          href="/"
          className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1"
        >
          ‹ Home
        </Link>
        <h1 className="text-white font-bold text-base tracking-wide">
          🎫 EVENT TICKET QR SCANNER
        </h1>
        <div className="w-16" /> {/* spacer */}
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-6 gap-6 max-w-lg mx-auto w-full">
        {/* RESULT STATE */}
        {pageState === "result" && result && (
          <TicketResult result={result} onReset={handleReset} />
        )}

        {/* VALIDATING STATE */}
        {pageState === "validating" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 w-full">
            <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-white font-semibold text-xl">Validating…</p>
            <p className="text-slate-400 text-sm">
              Checking with server, please wait.
            </p>
          </div>
        )}

        {/* SCANNING STATE */}
        {pageState === "scanning" && (
          <>
            <div className="w-full">
              <p className="text-slate-400 text-sm text-center mb-4">
                Point the camera at a ticket QR code
              </p>
              <QRScanner onScan={handleScan} active={pageState === "scanning"} />
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-slate-500 text-xs">
                Scanner is live — hold a QR code steady in front of the camera
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                Scanning active
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
