import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">🎫</div>
        <h1 className="text-4xl font-black tracking-tight text-white mb-3">
          EVENT TICKET
          <br />
          <span className="text-indigo-400">QR SYSTEM</span>
        </h1>
        <p className="text-slate-400 text-base max-w-sm mx-auto">
          Generate unique one-time QR codes for event tickets and validate them
          with atomic server-side security.
        </p>
      </div>

      {/* Action Cards */}
      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* Scanner */}
        <Link
          href="/scan"
          className="group flex items-center gap-5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all rounded-2xl p-6 shadow-xl shadow-indigo-900/40"
        >
          <span className="text-4xl">📷</span>
          <div>
            <p className="text-white font-bold text-xl leading-tight">
              Scan Tickets
            </p>
            <p className="text-indigo-200 text-sm mt-0.5">
              Open camera to validate QR codes
            </p>
          </div>
          <span className="ml-auto text-indigo-300 text-2xl">›</span>
        </Link>

        {/* Generator */}
        <Link
          href="/tickets/generate"
          className="group flex items-center gap-5 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all rounded-2xl p-6 shadow-xl shadow-slate-900/40"
        >
          <span className="text-4xl">🎟️</span>
          <div>
            <p className="text-white font-bold text-xl leading-tight">
              Generate Tickets
            </p>
            <p className="text-slate-400 text-sm mt-0.5">
              Create unique QR tickets for your event
            </p>
          </div>
          <span className="ml-auto text-slate-400 text-2xl">›</span>
        </Link>
      </div>

      {/* Security note */}
      <div className="mt-10 text-center max-w-xs">
        <p className="text-slate-600 text-xs leading-relaxed">
          🔒 Each QR code is valid exactly one time. Validation is enforced
          server-side with atomic Firestore transactions — the frontend can never
          bypass it.
        </p>
      </div>
    </main>
  );
}
