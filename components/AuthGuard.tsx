"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const savedCode = localStorage.getItem("qr_admin_code");
      if (!savedCode) {
        setIsAuth(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "settings", "adminAuth"));
        if (snap.exists() && snap.data().accessCode === savedCode) {
          setIsAuth(true);
        } else {
          setIsAuth(false);
          localStorage.removeItem("qr_admin_code");
        }
      } catch (err) {
        setIsAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    if (!inputCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const snap = await getDoc(doc(db, "settings", "adminAuth"));
      if (snap.exists() && snap.data().accessCode === inputCode.trim()) {
        localStorage.setItem("qr_admin_code", inputCode.trim());
        setIsAuth(true);
      } else {
        setError("Invalid Access Code");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  if (isAuth === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuth === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 safe-area-padding">
        <div className="flex flex-col items-center justify-center mb-8 w-full">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl flex items-center justify-center mb-6">
            <span className="text-4xl">🔒</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2 text-center">
            Restricted Access
          </h1>
          <p className="text-slate-400 text-sm text-center max-w-[260px]">
            Please enter the secure admin access code to continue.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-sm shadow-xl">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="Enter Access Code"
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-4 text-lg font-mono mb-4 focus:outline-none focus:border-indigo-500 text-center tracking-widest uppercase placeholder:text-slate-500 placeholder:tracking-normal placeholder:lowercase"
          />

          {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading || inputCode.length < 5}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg"
          >
            {loading ? "Checking..." : "Unlock"}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
