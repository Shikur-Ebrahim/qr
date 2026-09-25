/**
 * POST /api/tickets/generate
 *
 * Generates one or more unique event tickets:
 * 1. Creates a cryptographically secure random QR token
 * 2. Persists the ticket in Firestore with status = VALID
 * 3. Returns the QR code as a base-64 PNG data URL
 *
 * This route runs exclusively on the server (Firebase Admin SDK).
 */

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";
import { getAdminFirestore } from "@/lib/firebase-admin";
import {
  generateToken,
  buildQRContent,
  generateQRCodeDataUrl,
} from "@/lib/qr";
import type {
  GenerateTicketRequest,
  GenerateTicketResponse,
  GeneratedTicket,
} from "@/types/ticket";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    let body: GenerateTicketRequest = {};
    try {
      body = await request.json();
    } catch {
      // empty body is fine; defaults applied below
    }

    const count = Math.min(Math.max(Number(body.count) || 1, 1), 20);

    const db = getAdminFirestore();
    const ticketsCollection = db.collection("tickets");

    const generatedTickets: GeneratedTicket[] = [];

    for (let i = 0; i < count; i++) {
      const ticketId = uuidv4();
      const qrToken = generateToken();

      // Guarantee token uniqueness before writing
      const existing = await ticketsCollection
        .where("qrToken", "==", qrToken)
        .limit(1)
        .get();

      if (!existing.empty) {
        // Astronomically unlikely with 256-bit entropy, but handle it gracefully
        return NextResponse.json(
          {
            success: false,
            tickets: [],
            error: "Token collision detected. Please retry.",
          } satisfies GenerateTicketResponse,
          { status: 500 }
        );
      }

      const now = new Date().toISOString();

      await ticketsCollection.doc(ticketId).set({
        ticketId,
        qrToken,
        status: "VALID",
        createdAt: FieldValue.serverTimestamp(),
        usedAt: null,
      });

      const qrContent = buildQRContent(qrToken);
      const qrCodeDataUrl = await generateQRCodeDataUrl(qrContent);

      generatedTickets.push({
        ticketId,
        qrToken,
        status: "VALID",
        createdAt: now,
        qrCodeDataUrl,
      });
    }

    return NextResponse.json(
      {
        success: true,
        tickets: generatedTickets,
      } satisfies GenerateTicketResponse,
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[/api/tickets/generate] Error:", error);

    // Never leak internal details to the client
    return NextResponse.json(
      {
        success: false,
        tickets: [],
        error: "An internal server error occurred. Please try again.",
      } satisfies GenerateTicketResponse,
      { status: 500 }
    );
  }
}
