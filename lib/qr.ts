/**
 * QR code utilities (browser-safe).
 */

import QRCode from "qrcode";

/**
 * Generates a cryptographically secure, URL-safe random token.
 * Uses the browser Crypto API instead of Node.js crypto.
 */
export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Builds the URL that will be embedded in the QR code.
 */
export function buildQRContent(token: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000");
  return `${baseUrl}/scan?token=${token}`;
}

/**
 * Generates a QR code as a base-64 PNG data URL.
 */
export async function generateQRCodeDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 400,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}
