"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { collection, query, where, getDocs, runTransaction, serverTimestamp, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import TicketResult from "@/components/TicketResult";
import type { ValidateTicketResponse } from "@/types/ticket";

const QRScanner = dynamic(() => import("@/components/QRScanner"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-72 bg-slate-800 rounded-2xl">
      <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

type PageState = "scanning" | "validating" | "result";
type ScanMode = "redeem" | "check";

function extractToken(raw: string): string {
  try {
    const url = new URL(raw);
    const token = url.searchParams.get("token");
    if (token) return token.trim();
  } catch {
    //
  }
  return raw.trim();
}

export default function ScanPage() {
  const [pageState, setPageState] = useState<PageState>("scanning");
  const [scanMode, setScanMode] = useState<ScanMode>("redeem");
  const [result, setResult] = useState<ValidateTicketResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const lastScannedRef = useRef<string>("");

  const handleScan = useCallback(
    async (rawText: string) => {
      if (isValidating || pageState !== "scanning") return;
      if (rawText === lastScannedRef.current) return;
      lastScannedRef.current = rawText;

      const token = extractToken(rawText);
      if (!token) return;

      setIsValidating(true);
      setPageState("validating");

      try {
        const ticketsCollection = collection(db, "tickets");
        const q = query(ticketsCollection, where("qrToken", "==", token));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setResult({ success: false, status: "INVALID", message: "Invalid ticket" });
          setPageState("result");
          setIsValidating(false);
          return;
        }

        const ticketDoc = snapshot.docs[0]!;
        const ticketRef = doc(db, "tickets", ticketDoc.id);

        if (scanMode === "check") {
          // Check-only mode: Do NOT mutate the ticket status.
          const status = ticketDoc.data().status as string;
          if (status === "VALID") {
            setResult({ success: true, status: "VALID_CHECK_ONLY", message: "Ticket is valid (Not redeemed)" });
          } else {
            setResult({ success: false, status: "ALREADY_USED", message: "Ticket has already been used" });
          }
        } else {
          // Redeem mode: Run transaction to mark as used
          const outcome = await runTransaction(db, async (transaction) => {
            const freshSnap = await transaction.get(ticketRef);
            if (!freshSnap.exists()) {
              return "ALREADY_USED";
            }
            const status = freshSnap.data().status as string;
            if (status === "USED") {
              return "ALREADY_USED";
            }
            transaction.update(ticketRef, {
              status: "USED",
              usedAt: serverTimestamp(),
            });
            return "ACCEPTED";
          });

          if (outcome === "ACCEPTED") {
            setResult({ success: true, status: "ACCEPTED", message: "Ticket accepted", ticketId: ticketDoc.id });
          } else {
            setResult({ success: false, status: "ALREADY_USED", message: "This ticket has already been used", ticketId: ticketDoc.id });
          }
        }
      } catch (err: any) {
        console.error(err);
        setResult({
          success: false,
          status: "INVALID",
          message: "Network error. Please check your connection and try again.",
        });
      } finally {
        setPageState("result");
        setIsValidating(false);
      }
    },
    [isValidating, pageState, scanMode]
  );

  const handleReset = useCallback(() => {
    lastScannedRef.current = "";
    setResult(null);
    setPageState("scanning");
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="flex items-center justify-between px-4 pt-safe-top py-4 border-b border-slate-800">
        <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1">
          ‹ Home
        </Link>
        <h1 className="text-white font-bold text-base tracking-wide">
          🎫 EVENT SCANNER
        </h1>
        <div className="w-16" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-4 py-6 gap-6 max-w-lg mx-auto w-full">
        {pageState === "result" && result && <TicketResult result={result} onReset={handleReset} />}

        {pageState === "validating" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 w-full">
            <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-white font-semibold text-xl">Checking Ticket…</p>
          </div>
        )}

        {pageState === "scanning" && (
          <>
            {/* Mode Toggle Switch */}
            <div className="flex bg-slate-900 rounded-xl p-1 mb-2 w-full border border-slate-800 shadow-lg">
              <button
                onClick={() => setScanMode("redeem")}
                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  scanMode === "redeem" 
                    ? "bg-red-600 text-white shadow-md shadow-red-900/50 scale-100" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 scale-95"
                }`}
              >
                <span>🔴</span> Redeem
              </button>
              <button
                onClick={() => setScanMode("check")}
                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  scanMode === "check" 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/50 scale-100" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 scale-95"
                }`}
              >
                <span>🔍</span> Check Only
              </button>
            </div>

            <div className="w-full">
              <p className="text-slate-400 text-sm text-center mb-4">
                {scanMode === "redeem" 
                  ? "Scanned tickets will be MARKED AS USED." 
                  : "Check mode: Tickets will NOT be marked as used."}
              </p>
              <div className={`rounded-3xl overflow-hidden border-4 transition-colors duration-300 ${scanMode === "redeem" ? "border-red-900/30" : "border-blue-900/30"}`}>
                <QRScanner onScan={handleScan} active={pageState === "scanning"} />
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-2 text-center mt-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <span className={`w-2 h-2 rounded-full animate-pulse inline-block ${scanMode === "redeem" ? "bg-red-500" : "bg-blue-500"}`} />
                {scanMode === "redeem" ? "Ready to Redeem" : "Ready to Check"}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
