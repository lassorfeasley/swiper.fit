import React from "react";
import { useAccount } from "@/contexts/AccountContext";

interface TrainerNavigationProps {
  className?: string;
}

export default function TrainerNavigation({ className }: TrainerNavigationProps) {
  const { isDelegated, actingUser, returnToSelf } = useAccount();

  const clientName = actingUser ? `${actingUser.first_name} ${actingUser.last_name}`.trim() || actingUser.email : '';

  // Only show when delegated (managing a client account)
  if (!isDelegated || !actingUser) {
    return null;
  }

  return (
    <div 
      data-layer="sharing-navigation" 
      className={`SharingNavigation w-full px-5 pb-5 flex justify-center items-start gap-6 overflow-hidden ${className || ''}`}
    >
      <div 
        data-layer="managed-account" 
        className="ManagedAccount w-full h-14 max-w-[500px] px-2 bg-black rounded-[50px] shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] inline-flex justify-between items-center"
      >
        <div 
          data-layer="clock-wrapper" 
          className="ClockWrapper h-10 px-3 rounded-3xl flex justify-center items-center gap-2.5"
        >
          <div 
            data-layer="timer" 
            className="Timer justify-center text-white text-lg font-medium font-['Be_Vietnam_Pro'] leading-5"
          >
            Managing {clientName || 'client'}'s account
          </div>
        </div>
        <div 
          data-layer="action-pill" 
          data-property-1="no-text" 
          data-show-left-icon="true" 
          data-show-right-icon="false" 
          data-show-text="true" 
          className="ActionPill h-10 min-w-10 py-3 bg-neutral-neutral-700 rounded-[20px] flex justify-center items-center gap-1 cursor-pointer hover:bg-neutral-neutral-600 transition-colors"
          onClick={returnToSelf}
        >
          <div data-svg-wrapper data-layer="lucide-icon" data-icon="x" className="LucideIcon relative">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="var(--white, white)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
