"use client";

/**
 * TicketResult – displays ACCEPTED / ALREADY_USED / INVALID outcome clearly.
 * Designed for quick, at-a-glance reading at event entrances.
 */

import type { ValidateTicketResponse } from "@/types/ticket";

interface Props {
  result: ValidateTicketResponse;
  onReset: () => void;
}

export default function TicketResult({ result, onReset }: Props) {
  const isAccepted = result.status === "ACCEPTED";
  const isAlreadyUsed = result.status === "ALREADY_USED";

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-[60vh] rounded-2xl p-8 text-center shadow-2xl transition-all
        ${isAccepted ? "bg-green-50 border-4 border-green-400" : "bg-red-50 border-4 border-red-400"}`}
    >
      {/* Icon */}
      <div className="text-8xl mb-6 select-none">
        {isAccepted ? "✅" : "❌"}
      </div>

      {/* Headline */}
      <h1
        className={`text-3xl font-black tracking-tight mb-3 ${
          isAccepted ? "text-green-700" : "text-red-700"
        }`}
      >
        {isAccepted
          ? "TICKET ACCEPTED"
          : isAlreadyUsed
            ? "TICKET ALREADY USED"
            : "INVALID TICKET"}
      </h1>

      {/* Sub-message */}
      <p
        className={`text-lg font-medium mb-8 max-w-xs ${
          isAccepted ? "text-green-600" : "text-red-600"
        }`}
      >
        {isAccepted
          ? "Ticket is valid. The ticket has now been marked as USED."
          : isAlreadyUsed
            ? "This QR code has already been scanned."
            : "This QR code is not valid."}
      </p>



      {/* Next ticket button */}
      <button
        onClick={onReset}
        className="bg-gray-900 hover:bg-gray-700 active:scale-95 text-white font-bold py-4 px-10 rounded-2xl text-lg transition-all shadow-lg"
      >
        Scan Next Ticket
      </button>
    </div>
  );
}
