"use client";

import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); // Prevent Chrome's default mini-infobar
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowManualInstructions(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the native Chrome/Android install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
    } else {
      // Fallback: If native prompt isn't available (e.g. iOS or already dismissed), show manual instructions
      setShowManualInstructions(true);
    }
  };

  if (isInstalled) return null;

  return (
    <div className="mt-8 w-full max-w-sm">
      <button
        onClick={handleInstallClick}
        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 active:scale-95 transition-all text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/30"
      >
        <span className="text-2xl">⬇️</span>
        <span className="text-lg">Install App to Phone</span>
      </button>

      {/* Manual Installation Modal */}
      {showManualInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <button 
              onClick={() => setShowManualInstructions(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2"
            >
              ✕
            </button>
            <h3 className="text-white font-bold text-xl mb-4">How to Install</h3>
            
            {isIOS ? (
              <ol className="text-slate-300 space-y-4 mb-6">
                <li className="flex items-center gap-3">
                  <span className="text-2xl">1.</span>
                  <span>Tap the <strong>Share</strong> button at the bottom of Safari.</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-2xl">2.</span>
                  <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                </li>
              </ol>
            ) : (
              <ol className="text-slate-300 space-y-4 mb-6">
                <li className="flex items-center gap-3">
                  <span className="text-2xl">1.</span>
                  <span>Tap the <strong>3-dot menu</strong> (⋮) in the top right of Chrome.</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-2xl">2.</span>
                  <span>Tap <strong>Add to Home screen</strong> or <strong>Install app</strong>.</span>
                </li>
              </ol>
            )}
            
            <button
              onClick={() => setShowManualInstructions(false)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
