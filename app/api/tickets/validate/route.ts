import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs, runTransaction, serverTimestamp, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
        { success: false, status: "INVALID", message: "Malformed request body." } satisfies ValidateTicketResponse,
        { status: 400 }
      );
    }

    const qrToken = body.qrToken?.trim();

    if (!qrToken || typeof qrToken !== "string" || qrToken.length === 0) {
      return NextResponse.json(
        { success: false, status: "INVALID", message: "Invalid ticket" } satisfies ValidateTicketResponse,
        { status: 400 }
      );
    }

    const ticketsCollection = collection(db, "tickets");
    const q = query(ticketsCollection, where("qrToken", "==", qrToken));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, status: "INVALID", message: "Invalid ticket" } satisfies ValidateTicketResponse,
        { status: 404 }
      );
    }

    const ticketDoc = snapshot.docs[0]!;
    const ticketRef = doc(db, "tickets", ticketDoc.id);
    let outcome: "ACCEPTED" | "ALREADY_USED";

    await runTransaction(db, async (transaction) => {
      const freshSnap = await transaction.get(ticketRef);

      if (!freshSnap.exists()) {
        outcome = "ALREADY_USED"; 
        return;
      }

      const status = freshSnap.data().status as string;

      if (status === "USED") {
        outcome = "ALREADY_USED";
        return;
      }

      transaction.update(ticketRef, {
        status: "USED",
        usedAt: serverTimestamp(),
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
      { success: false, status: "INVALID", message: "An internal server error occurred." } satisfies ValidateTicketResponse,
      { status: 500 }
    );
  }
}
