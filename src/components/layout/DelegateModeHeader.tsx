import React, { forwardRef } from "react";
import { Blend, X } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";

/**
 * DelegateModeHeader – dark full-bleed bar shown at top when acting as a delegate.
 * Exposes ref so AppLayout can measure its height via ResizeObserver.
 */
const DelegateModeHeader = forwardRef<HTMLElement, {}>(function DelegateModeHeader(_, ref) {
  const { actingUser, returnToSelf } = useAccount();
  const displayName = actingUser?.first_name
    ? `${actingUser.first_name}'s account`
    : `${actingUser?.email || "Account"}`;

  return (
    <header
      ref={ref}
      data-layer="PageHeader"
      className="self-stretch bg-green-700 border-b border-neutral-600 inline-flex justify-between items-center fixed top-0 left-0 right-0 z-[60] h-11"
    >
      <div
        data-layer="title-back-wrapper"
        className="flex items-center"
      >
        <button
          aria-label="Delegate icon"
          className="p-2.5 flex items-center justify-center"
        >
          <Blend className="w-6 h-6 text-white" />
        </button>
        <div className="pr-3 flex items-center">
          <span className="text-white text-xs font-bold uppercase tracking-wide font-['Be_Vietnam_Pro'] truncate">
            Managing {displayName}
          </span>
        </div>
      </div>
      <div data-layer="PageActions" className="flex items-center">
        <button
          aria-label="Exit delegate mode"
          onClick={returnToSelf}
          className="p-2.5 border-l border-white flex items-center justify-center"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>
    </header>
  );
});

export default DelegateModeHeader; 