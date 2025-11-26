import React from "react";
import { ActionCard } from "@/components/shared/ActionCard";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StickyBottomActionProps {
  text: string;
  onClick: () => void;
  icon?: LucideIcon;
  fillColor?: string;
  textColor?: string;
  className?: string;
  'aria-label'?: string;
}

export const StickyBottomAction = ({
  text,
  onClick,
  icon,
  fillColor = "bg-blue-500",
  textColor = "text-white",
  className,
  'aria-label': ariaLabel
}: StickyBottomActionProps) => {
  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 flex justify-center items-center px-5 pb-5",
        "bg-[linear-gradient(to_bottom,rgba(245,245,244,0)_0%,rgba(245,245,244,0)_10%,rgba(245,245,244,0.5)_40%,rgba(245,245,244,1)_80%,rgba(245,245,244,1)_100%)]",
        className
      )}
      style={{ paddingBottom: '20px' }}
    >
      <ActionCard
        text={text}
        onClick={onClick}
        icon={icon}
        fillColor={fillColor}
        textColor={textColor}
        className="w-full shadow-lg"
        aria-label={ariaLabel || text}
      />
    </div>
  );
};

export default StickyBottomAction;

