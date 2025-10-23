import React from "react";
import { useAccount } from "@/contexts/AccountContext";
import { X } from "lucide-react";

export default function DelegationBanner() {
  const { isDelegated, actingUser, returnToSelf } = useAccount();

  if (!isDelegated || !actingUser) return null;

  const displayEmail = actingUser.email || "Selected account";

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-200 text-amber-900 text-center text-sm py-1 px-2 flex justify-center items-center gap-2 shadow-md">
      <span>Working in {displayEmail}</span>
      <button
        onClick={returnToSelf}
        className="ml-2 flex items-center gap-0.5 text-xs underline hover:no-underline"
      >
        Return to my account <X className="w-4 h-4" />
      </button>
    </div>
  );
} 