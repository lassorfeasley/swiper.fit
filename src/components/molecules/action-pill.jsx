import React from "react";

export default function ActionPill({ label = "Pause", onClick, Icon, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ActionPill h-10 px-5 bg-orange-600 rounded-[20px] shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] inline-flex justify-center items-center gap-1 whitespace-nowrap ${className}`}
      aria-label={label}
    >
      <span data-layer="lucide-icon" className="LucideIcon size-6 relative overflow-hidden">
        {Icon ? (
          <Icon className="w-6 h-6 text-white" />
        ) : (
          <span data-layer="Vector" className="Vector w-3 h-4 left-[6px] top-[4px] absolute outline outline-2 outline-offset-[-1px] outline-white" />
        )}
      </span>
      <span data-layer="text" className="Text justify-center text-white text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">{label}</span>
    </button>
  );
}


