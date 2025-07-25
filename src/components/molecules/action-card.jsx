import * as React from "react";
import { Plus } from "lucide-react";

const ActionCard = React.forwardRef(({ 
  className, 
  text = "create a new routine",
  onClick,
  ...props 
}, ref) => {
  return (
    <div ref={ref} className={`${className} !border-b-0 w-full`} onClick={onClick} {...props}>
      <div className="w-full pt-5 pb-20">
        <div className="w-full pl-3 bg-neutral-100 border-t border-b border-neutral-neutral-300 flex justify-between items-center">
          <div className="justify-start text-neutral-neutral-700 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">{text}</div>
          <div data-property-1="left-border" className="p-2.5 border-l border-neutral-neutral-300 flex justify-start items-center gap-2.5">
            <Plus className="w-6 h-6 text-neutral-neutral-700" />
          </div>
        </div>
      </div>
    </div>
  );
});

ActionCard.displayName = "ActionCard";

export { ActionCard }; 