"use client";

import type { ValidateTicketResponse } from "@/types/ticket";

interface Props {
  result: ValidateTicketResponse;
  onReset: () => void;
}

export default function TicketResult({ result, onReset }: Props) {
  const isAccepted = result.status === "ACCEPTED";
  const isCheckOnly = result.status === "VALID_CHECK_ONLY";
  const isAlreadyUsed = result.status === "ALREADY_USED";

  let bgColor = "bg-red-50 border-4 border-red-400";
  let icon = "❌";
  let titleColor = "text-red-700";
  let title = "INVALID TICKET";
  let subMsgColor = "text-red-600";
  let subMsg = "This QR code is not valid or not found.";

  if (isAccepted) {
    bgColor = "bg-green-50 border-4 border-green-400";
    icon = "✅";
    titleColor = "text-green-700";
    title = "TICKET ACCEPTED";
    subMsgColor = "text-green-600";
    subMsg = "Ticket is valid. The ticket has now been marked as USED.";
  } else if (isCheckOnly) {
    bgColor = "bg-blue-50 border-4 border-blue-400";
    icon = "🔍";
    titleColor = "text-blue-700";
    title = "VALID (CHECK ONLY)";
    subMsgColor = "text-blue-600";
    subMsg = "Ticket is valid. It has NOT been marked as used.";
  } else if (isAlreadyUsed) {
    title = "TICKET ALREADY USED";
    subMsg = "This QR code has already been scanned.";
  }

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-[60vh] rounded-2xl p-8 text-center shadow-2xl transition-all ${bgColor}`}
    >
      {/* Icon */}
      <div className="text-8xl mb-6 select-none">{icon}</div>

      {/* Headline */}
      <h1 className={`text-3xl font-black tracking-tight mb-3 ${titleColor}`}>
        {title}
      </h1>

      {/* Sub-message */}
      <p className={`text-lg font-medium mb-10 max-w-xs ${subMsgColor}`}>
        {subMsg}
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
