/**
 * POST /api/tickets/validate
 *
 * Atomically validates a QR token using a Firestore transaction:
 *
 * 1. Look up the ticket by qrToken field
 * 2. If not found → INVALID
 * 3. If status === "USED" → ALREADY_USED
 * 4. If status === "VALID" → mark as USED (atomic) → ACCEPTED
 *
 * Two simultaneous scans of the same token are safe because Firestore
 * transactions use optimistic concurrency: only ONE will commit;
 * the other will be retried and then fail with ALREADY_USED.
 */

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";
import type {
  ValidateTicketRequest,
  ValidateTicketResponse,
} from "@/types/ticket";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    let body: Partial<ValidateTicketRequest>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          status: "INVALID",
          message: "Malformed request body.",
        } satisfies ValidateTicketResponse,
        { status: 400 }
      );
    }

    const qrToken = body.qrToken?.trim();

    if (!qrToken || typeof qrToken !== "string" || qrToken.length === 0) {
      return NextResponse.json(
        {
          success: false,
          status: "INVALID",
          message: "Invalid ticket",
        } satisfies ValidateTicketResponse,
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const ticketsCollection = db.collection("tickets");

    // ── Find the ticket document by qrToken ──────────────────────────────────
    const snapshot = await ticketsCollection
      .where("qrToken", "==", qrToken)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          status: "INVALID",
          message: "Invalid ticket",
        } satisfies ValidateTicketResponse,
        { status: 404 }
      );
    }

    const ticketDoc = snapshot.docs[0]!;
    const ticketRef = ticketDoc.ref;

    // ── Atomic transaction: check-and-update ─────────────────────────────────
    let outcome: "ACCEPTED" | "ALREADY_USED";

    await db.runTransaction(async (transaction) => {
      const freshSnap = await transaction.get(ticketRef);

      if (!freshSnap.exists) {
        outcome = "ALREADY_USED"; // defensive; shouldn't happen
        return;
      }

      const status = freshSnap.data()?.status as string;

      if (status === "USED") {
        outcome = "ALREADY_USED";
        return;
      }

      // status === "VALID" – mark as used inside the transaction
      transaction.update(ticketRef, {
        status: "USED",
        usedAt: FieldValue.serverTimestamp(),
      });
      outcome = "ACCEPTED";
    });

    if (outcome! === "ACCEPTED") {
      return NextResponse.json(
        {
          success: true,
          status: "ACCEPTED",
          message: "Ticket accepted",
          ticketId: ticketDoc.id,
        } satisfies ValidateTicketResponse,
        { status: 200 }
      );
    }

    // ALREADY_USED
    return NextResponse.json(
      {
        success: false,
        status: "ALREADY_USED",
        message: "This ticket has already been used",
        ticketId: ticketDoc.id,
      } satisfies ValidateTicketResponse,
      { status: 409 }
    );
  } catch (error: unknown) {
    console.error("[/api/tickets/validate] Error:", error);

    return NextResponse.json(
      {
        success: false,
        status: "INVALID",
        message: "An internal server error occurred. Please try again.",
      } satisfies ValidateTicketResponse,
      { status: 500 }
    );
  }
}
