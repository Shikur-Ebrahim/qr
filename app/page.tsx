"use client";

import Link from "next/link";
import InstallPrompt from "@/components/InstallPrompt";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function HomePage() {
  
  const handleResetCode = async () => {
    const confirmReset = window.confirm(
      "Are you sure you want to generate a new access code? You will be logged out of all other devices, and you must use the new code immediately."
    );
    if (!confirmReset) return;
    
    // Generate a random 16-character alphanumeric string
    const newCode = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('').toUpperCase();
      
    try {
      await setDoc(doc(db, "settings", "adminAuth"), { accessCode: newCode });
      localStorage.setItem("qr_admin_code", newCode);
      alert(`✅ Access Code Updated Successfully!\n\nYour NEW Access Code is:\n\n${newCode}\n\nPlease copy and save this somewhere safe!`);
    } catch (err) {
      alert("⚠️ Failed to update access code. Please check your connection.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("qr_admin_code");
    window.location.reload();
  };

  return (
    <main className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center px-6 safe-area-padding py-10">
      
      {/* App Icon / Logo Area */}
      <div className="flex flex-col items-center justify-center mb-8 w-full mt-auto">
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl shadow-indigo-500/40 flex items-center justify-center mb-6 transform transition-transform hover:scale-105 active:scale-95">
          <span className="text-5xl">🎫</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white mb-2 text-center">
          QR Tickets
        </h1>
        <p className="text-slate-400 text-sm text-center max-w-[260px]">
          Generate and scan secure one-time event tickets
        </p>
      </div>

      {/* Main Menu Cards (Mobile Optimized) */}
      <div className="w-full max-w-sm flex flex-col gap-4">
        
        {/* Generator Card (TOP) */}
        <Link
          href="/tickets/generate"
          className="group relative overflow-hidden flex flex-col items-start bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-all rounded-3xl p-6 shadow-[0_8px_30px_rgb(79,70,229,0.4)]"
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-4xl bg-white/20 p-3 rounded-2xl">🎟️</span>
            <span className="text-white/50 text-2xl group-hover:translate-x-1 transition-transform">→</span>
          </div>
          <div>
            <h2 className="text-white font-bold text-xl mb-1">Generate</h2>
            <p className="text-indigo-200 text-sm font-medium">
              Create and print new QR tickets
            </p>
          </div>
          
          {/* Decorative background shape */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
        </Link>

        {/* Scanner Card (BOTTOM) */}
        <Link
          href="/scan"
          className="group relative overflow-hidden flex flex-col items-start bg-slate-800 hover:bg-slate-700 active:bg-slate-900 transition-all rounded-3xl p-6 shadow-xl border border-slate-700"
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-4xl bg-slate-700/50 p-3 rounded-2xl">📷</span>
            <span className="text-slate-500 text-2xl group-hover:translate-x-1 transition-transform">→</span>
          </div>
          <div>
            <h2 className="text-white font-bold text-xl mb-1">Scan Tickets</h2>
            <p className="text-slate-400 text-sm font-medium">
              Open camera to validate QR codes
            </p>
          </div>
        </Link>

      </div>

      {/* Security & Admin Actions */}
      <div className="w-full max-w-sm flex flex-col gap-3 mt-6">
        <button
          onClick={handleResetCode}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold py-4 px-6 rounded-2xl transition-all"
        >
          <span className="text-xl">🔄</span>
          <span>Reset Access Code</span>
        </button>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-transparent text-slate-500 hover:text-red-400 font-semibold py-3 px-6 rounded-2xl transition-all"
        >
          <span>Log out</span>
        </button>
      </div>

      {/* Native Install Prompt Button (Only appears in Chrome/Android when not installed) */}
      <InstallPrompt />

      <div className="mt-auto pt-6 text-center w-full">
        <p className="text-slate-700 text-xs">Secured System</p>
      </div>

    </main>
  );
}
