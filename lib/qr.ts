/**
 * QR code utilities (server-side only).
 *
 * - generateToken(): cryptographically secure random token
 * - generateQRCodeDataUrl(): returns a base-64 PNG data URL
 */

import { randomBytes } from "crypto";
import QRCode from "qrcode";

/**
 * Generates a cryptographically secure, URL-safe random token.
 * 32 bytes → 64 hex characters – impossible to brute-force.
 */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Builds the URL that will be embedded in the QR code.
 * The scanner page reads the `token` query parameter from this URL.
 */
export function buildQRContent(token: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/scan?token=${token}`;
}

/**
 * Generates a QR code as a base-64 PNG data URL.
 * Safe to embed directly in <img src="..."> tags.
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
