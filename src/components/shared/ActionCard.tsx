import * as React from "react";
import { Plus } from "lucide-react";

export interface ActionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  onClick?: () => void;
  variant?: "default" | "primary";
  fillColor?: string;
  textColor?: string;
  isFirstCard?: boolean;
}

const ActionCard = React.forwardRef<HTMLDivElement, ActionCardProps>(({ 
  className, 
  text = "Add exercise",
  onClick,
  variant = "default", // "default" or "primary"
  fillColor,
  textColor,
  isFirstCard, // Extract isFirstCard to prevent DOM warning
  ...props 
}, ref) => {
  // Determine colors based on props or variant
  const backgroundColor = fillColor || (variant === "primary" ? "bg-sky-600" : "bg-white");
  const textColorClass = textColor || (variant === "primary" ? "text-white" : "text-neutral-neutral-700");
  const iconColorClass = textColor || (variant === "primary" ? "text-white" : "text-neutral-neutral-700");

  return (
    <div 
      ref={ref} 
      className={`ActionCard w-[500px] h-14 max-w-[500px] rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 inline-flex justify-between items-center overflow-hidden cursor-pointer ${className}`} 
      onClick={onClick} 
      {...props}
    >
      <div className={`ClickableArea flex-1 self-stretch pl-3 pr-1 ${backgroundColor} rounded-lg flex justify-between items-center cursor-pointer`}>
        <div className={`justify-start ${textColorClass} text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide`}>{text}</div>
        <div data-property-1="left-border" data-show-text="false" className="Iconbutton p-2.5 flex justify-start items-center gap-2.5">
          <div data-layer="lucide-icon" data-icon="plus" className="LucideIcon w-6 h-6 relative overflow-hidden">
            <Plus className={`w-6 h-6 ${iconColorClass}`} strokeWidth={2} />
          </div>
        </div>
      </div>
    </div>
  );
});

ActionCard.displayName = "ActionCard";

export { ActionCard };
