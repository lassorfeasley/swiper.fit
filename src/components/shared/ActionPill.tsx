import React from "react";

export interface ActionPillProps {
  label?: string;
  onClick?: (e: React.MouseEvent) => void;
  Icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  showText?: boolean;
  color?: 'orange' | 'neutral' | 'neutral-dark' | 'red' | 'green' | 'blue' | 'blue-700';
  iconColor?: 'white' | 'black' | 'neutral' | 'red' | 'green' | 'blue';
  fill?: boolean;
  showShadow?: boolean;
}

export default function ActionPill({ 
  label = "Pause", 
  onClick, 
  Icon, 
  className = "", 
  showText = true, 
  color = "orange", 
  iconColor = "white", 
  fill = true,
  showShadow = true
}: ActionPillProps) {
  const colorClasses = {
    orange: "bg-orange-600",
    neutral: "bg-neutral-200",
    "neutral-dark": "bg-neutral-900",
    red: "bg-red-500",
    green: "bg-green-500",
    blue: "bg-blue-500",
    "blue-700": "bg-blue-700"
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
  const getTextColor = (color: string): string => {
    const lightColors = ['neutral'];
    const darkColors = ['neutral-dark', 'blue-700'];
    if (darkColors.includes(color)) return 'text-white';
    return lightColors.includes(color) ? 'text-neutral-700' : 'text-white';
  };

  const backgroundColor = fill ? (colorClasses[color] || colorClasses.orange) : "bg-white/0";
  const iconColorClass = iconColorClasses[iconColor] || iconColorClasses.white;
  const textColorClass = getTextColor(color);
  
  const shadowClasses = showShadow ? 'shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px]' : '';
  const gapClass = showText ? 'gap-0.5' : 'gap-1';

  return (
    <button
      type="button"
      onClick={(e) => onClick?.(e)}
      className={`ActionPill h-10 ${showText ? 'min-w-24 px-4 py-3' : 'min-w-10 px-0 py-3'} ${backgroundColor} ${showText ? 'rounded-full' : 'rounded-[20px]'} ${shadowClasses} inline-flex justify-center items-center ${gapClass} whitespace-nowrap ${className}`}
      aria-label={label}
    >
      {Icon && (
        <div data-layer="lucide-icon" className="LucideIcon w-6 h-6 relative overflow-hidden">
          <Icon className={`w-5 h-5 left-[2px] top-[2px] absolute ${iconColorClass}`} />
        </div>
      )}
      {showText && (
        <div data-layer="text" className={`Text justify-center ${textColorClass} text-sm font-semibold font-['Be_Vietnam_Pro'] leading-5`}>{label}</div>
      )}
    </button>
  );
}
