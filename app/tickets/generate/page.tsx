"use client";

/**
 * /tickets/generate page
 *
 * Lets organisers generate unique event tickets with QR codes.
 * Each ticket is:
 *   - Saved to Firestore (status = VALID) via the server API
 *   - Displayed with its QR code image
 *   - Downloadable / printable
 */

import { useState } from "react";
import Link from "next/link";
import type { GenerateTicketResponse, GeneratedTicket } from "@/types/ticket";

export default function GeneratePage() {
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<GeneratedTicket[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setTickets([]);

    try {
      const res = await fetch("/api/tickets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });

      const data: GenerateTicketResponse = await res.json();

      if (!data.success) {
        setError(data.error ?? "Failed to generate tickets.");
        return;
      }

      setTickets(data.tickets);
    } catch {
      setError("Network error. Please check your connection.");
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
          🖨️ Print
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Generator controls */}
        <div className="bg-slate-900 rounded-2xl p-6 mb-8 border border-slate-800">
          <h2 className="text-white font-semibold text-lg mb-4">
            Create New Tickets
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-slate-400 text-sm mb-2">
                Number of tickets (1–20)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) =>
                  setCount(
                    Math.min(20, Math.max(1, parseInt(e.target.value) || 1))
                  )
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-lg font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 transition-all text-white font-bold px-8 py-3 rounded-xl text-base whitespace-nowrap"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating…
                </span>
              ) : (
                `Generate ${count} Ticket${count > 1 ? "s" : ""}`
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Info banner */}
        {tickets.length === 0 && !loading && !error && (
          <div className="text-center py-16 text-slate-600">
            <div className="text-5xl mb-4">🎫</div>
            <p className="text-slate-500 text-base">
              Generated tickets will appear here.
            </p>
            <p className="text-slate-600 text-sm mt-1">
              Each ticket gets a unique cryptographically secure QR code.
            </p>
          </div>
        )}

        {/* Tickets grid */}
        {tickets.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">
                {tickets.length} ticket{tickets.length > 1 ? "s" : ""} generated
              </h2>
              <span className="text-green-400 text-sm font-medium">
                ✅ Saved to Firestore
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 print:grid-cols-3">
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
                        <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">
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
                      <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">
                        Token (first 12 chars)
                      </p>
                      <p className="text-slate-300 font-mono text-xs print:text-gray-600">
                        {ticket.qrToken.slice(0, 12)}…
                      </p>
                    </div>

                    <div className="mb-4">
                      <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">
                        Created
                      </p>
                      <p className="text-slate-300 text-xs print:text-gray-600">
                        {new Date(ticket.createdAt).toLocaleString()}
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
