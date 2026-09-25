import type { Metadata, Viewport } from "next";
import "./globals.css";

import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "QR Tickets",
  description: "One-time QR event ticket validation system",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QR Tickets",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-slate-950 min-h-screen text-white antialiased">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
