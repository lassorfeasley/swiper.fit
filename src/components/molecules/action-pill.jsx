import React from "react";

export default function ActionPill({ label = "Pause", onClick, Icon, className = "", showText = true, color = "orange", iconColor = "white", fill = true }) {
  const colorClasses = {
    orange: "bg-orange-600",
    neutral: "bg-neutral-200",
    red: "bg-red-500",
    green: "bg-green-500",
    blue: "bg-blue-500"
  };

  const iconColorClasses = {
    white: "text-white",
    black: "text-black",
    neutral: "text-neutral-700",
    red: "text-red-500",
    green: "text-green-500",
    blue: "text-blue-500"
  };

  // Determine text color based on background color for proper contrast
  const getTextColor = (color) => {
    const lightColors = ['neutral'];
    return lightColors.includes(color) ? 'text-neutral-700' : 'text-white';
  };

  const backgroundColor = fill ? (colorClasses[color] || colorClasses.orange) : "";
  const iconColorClass = iconColorClasses[iconColor] || iconColorClasses.white;
  const textColorClass = getTextColor(color);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`ActionPill h-10 min-w-10 ${showText ? 'pl-3 pr-4 py-3' : 'py-3'} ${backgroundColor} rounded-[20px] inline-flex justify-center items-center gap-0.5 whitespace-nowrap ${className}`}
      aria-label={label}
    >
      <div data-layer="lucide-icon" className="LucideIcon w-6 h-6 relative overflow-hidden">
        {Icon ? (
          <Icon className={`w-5 h-5 left-[2px] top-[2px] absolute ${iconColorClass}`} />
        ) : (
          <div data-layer="Vector" className={`Vector w-5 h-5 left-[2px] top-[2px] absolute outline outline-2 outline-offset-[-1px] ${iconColor === 'white' ? 'outline-white' : 'outline-neutral-700'}`} />
        )}
      </div>
      {showText && (
        <div data-layer="text" className={`Text justify-center ${textColorClass} text-base font-medium font-['Be_Vietnam_Pro'] leading-none`}>{label}</div>
      )}
    </button>
  );
}


