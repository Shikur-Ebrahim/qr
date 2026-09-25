import { NextRequest, NextResponse } from "next/server";
import { collection, doc, setDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase";
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
      // empty body is fine
    }

    const count = Math.min(Math.max(Number(body.count) || 1, 1), 20);
    const ticketsCollection = collection(db, "tickets");
    const generatedTickets: GeneratedTicket[] = [];

    for (let i = 0; i < count; i++) {
      const ticketId = uuidv4();
      const qrToken = generateToken();

      // Check token uniqueness
      const q = query(ticketsCollection, where("qrToken", "==", qrToken));
      const existing = await getDocs(q);

      if (!existing.empty) {
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
      await setDoc(doc(ticketsCollection, ticketId), {
        ticketId,
        qrToken,
        status: "VALID",
        createdAt: serverTimestamp(),
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
