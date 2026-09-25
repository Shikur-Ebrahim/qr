// ─────────────────────────────────────────────────────────────────────────────
// Core ticket types shared between client and server
// ─────────────────────────────────────────────────────────────────────────────

export type TicketStatus = "VALID" | "USED";

/** Firestore document stored under tickets/{ticketId} */
export interface Ticket {
  ticketId: string;
  qrToken: string;
  status: TicketStatus;
  createdAt: string; // ISO-8601 string (serialised from Firestore Timestamp)
  usedAt: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// API request / response shapes
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateTicketRequest {
  count?: number; // 1–20, defaults to 1
}

export interface GenerateTicketResponse {
  success: boolean;
  tickets: GeneratedTicket[];
  error?: string;
}

export interface GeneratedTicket {
  ticketId: string;
  qrToken: string;
  status: TicketStatus;
  createdAt: string;
  /** Base-64 PNG of the QR code */
  qrCodeDataUrl: string;
}

export type ValidationOutcome = "ACCEPTED" | "ALREADY_USED" | "INVALID" | "VALID_CHECK_ONLY";

export interface ValidateTicketRequest {
  qrToken: string;
}

export interface ValidateTicketResponse {
  success: boolean;
  status: ValidationOutcome;
  message: string;
  ticketId?: string;
}
