"use client";

import { useState } from "react";
import Link from "next/link";
import { collection, doc, setDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase";
import { generateToken, buildQRContent, generateQRCodeDataUrl } from "@/lib/qr";
import type { GeneratedTicket } from "@/types/ticket";

export default function GeneratePage() {
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<GeneratedTicket[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const ticketsCollection = collection(db, "tickets");
      
      const ticketId = uuidv4();
      const qrToken = generateToken();

      // Check token uniqueness
      const q = query(ticketsCollection, where("qrToken", "==", qrToken));
      const existing = await getDocs(q);

      if (!existing.empty) {
        throw new Error("Token collision detected. Please retry.");
      }

      const now = new Date().toISOString();
      
      // Save to Firestore directly from the client
      await setDoc(doc(ticketsCollection, ticketId), {
        ticketId,
        qrToken,
        status: "VALID",
        createdAt: serverTimestamp(),
        usedAt: null,
      });

      const qrContent = buildQRContent(qrToken);
      const qrCodeDataUrl = await generateQRCodeDataUrl(qrContent);

      const newTicket: GeneratedTicket = {
        ticketId,
        qrToken,
        status: "VALID",
        createdAt: now,
        qrCodeDataUrl,
      };

      // Add the new ticket to the TOP of the list
      setTickets((prevTickets) => [newTicket, ...prevTickets]);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while generating tickets.");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = (ticket: GeneratedTicket) => {
    const link = document.createElement("a");
    link.href = ticket.qrCodeDataUrl;
    link.download = `ticket-${ticket.ticketId}.png`;
    link.click();
  };

  const printTickets = () => window.print();

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-800 max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1"
        >
          ‹ Home
        </Link>
        <h1 className="text-white font-bold text-base tracking-wide">
          🎟️ GENERATE TICKETS
        </h1>
        <button
          onClick={printTickets}
          disabled={tickets.length === 0}
          className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-colors"
        >
          🖨️ Print All
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Generator controls */}
        <div className="bg-slate-900 rounded-2xl p-6 mb-8 border border-slate-800 text-center">
          <h2 className="text-white font-semibold text-xl mb-6">
            Create a New Ticket
          </h2>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full sm:w-auto mx-auto bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 transition-all text-white font-bold px-10 py-4 rounded-xl text-lg flex items-center justify-center min-w-[250px] shadow-lg shadow-indigo-900/40"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              "➕ Generate Ticket"
            )}
          </button>

          {error && (
            <div className="mt-6 bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-sm max-w-md mx-auto">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Info banner - Only show if empty */}
        {tickets.length === 0 && !loading && !error && (
          <div className="text-center py-16 text-slate-600">
            <div className="text-5xl mb-4">🎫</div>
            <p className="text-slate-500 text-base">
              Tap the button above to generate a ticket.
            </p>
          </div>
        )}

        {/* Tickets grid */}
        {tickets.length > 0 && (
          <div className="mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.ticketId}
                  className="bg-white rounded-2xl overflow-hidden shadow-xl print:shadow-none print:border print:border-gray-200"
                >
                  {/* QR Code */}
                  <div className="bg-white p-4 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ticket.qrCodeDataUrl}
                      alt={`QR Code for ticket ${ticket.ticketId}`}
                      className="w-48 h-48 object-contain"
                    />
                  </div>

                  {/* Ticket info */}
                  <div className="bg-slate-900 p-4 print:bg-gray-100">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-widest mb-1 print:text-gray-500">
                          Ticket ID
                        </p>
                        <p className="text-white font-mono text-sm font-bold print:text-black">
                          {ticket.ticketId.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <span className="bg-green-900/60 text-green-400 text-xs font-bold px-2 py-1 rounded-full border border-green-700 print:bg-green-100 print:text-green-700 print:border-green-300">
                        {ticket.status}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-slate-400 text-xs uppercase tracking-widest mb-1 print:text-gray-500">
                        Token (first 12 chars)
                      </p>
                      <p className="text-slate-300 font-mono text-xs print:text-gray-700">
                        {ticket.qrToken.slice(0, 12)}…
                      </p>
                    </div>

                    <button
                      onClick={() => downloadQR(ticket)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white text-sm font-semibold py-2 rounded-xl print:hidden"
                    >
                      ⬇ Download QR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
