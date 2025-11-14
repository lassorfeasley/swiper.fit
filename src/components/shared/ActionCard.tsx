import * as React from "react";
import { Plus } from "lucide-react";

export interface ActionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  onClick?: () => void;
  fillColor?: string;
  textColor?: string;
  isFirstCard?: boolean;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const ActionCard = React.forwardRef<HTMLDivElement, ActionCardProps>(({ 
  className, 
  text = "Add exercise",
  onClick,
  fillColor, // Keep for backward compatibility but ignore it
  textColor, // Keep for backward compatibility but ignore it
  isFirstCard, // Extract isFirstCard to prevent DOM warning
  icon: Icon = Plus, // Default to Plus if no icon provided
  ...props 
}, ref) => {
  return (
    <div 
      ref={ref} 
      className={`ActionCard w-full h-14 rounded-sm inline-flex justify-between items-center overflow-hidden cursor-pointer ${className}`} 
      onClick={onClick} 
      {...props}
    >
      <div className="ClickableArea flex-1 self-stretch px-3 bg-sky-600 hover:bg-sky-500 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex justify-between items-center cursor-pointer transition-colors">
        <div className="justify-start text-white text-lg font-medium font-['Be_Vietnam_Pro'] leading-5">{text}</div>
        <div data-layer="lucide-icon" data-icon="plus" className="LucideIcon size-10 relative overflow-hidden">
          <Icon className="size-9 absolute left-[2px] top-[2px] text-white" strokeWidth={1} />
        </div>
      </div>
    </div>
  );
});

ActionCard.displayName = "ActionCard";

export { ActionCard };
