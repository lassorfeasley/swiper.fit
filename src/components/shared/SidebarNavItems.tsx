import React from "react";
import { Link } from "react-router-dom";
import { useNavItems } from "@/hooks/use-nav-items";
import { cn } from "@/lib/utils";

const SidebarNavItems: React.FC = () => {
  const navItems = useNavItems();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col justify-center">
        <nav className="flex flex-col">
          {navItems.filter(item => item.label !== 'Account').map((item) => {
            if (item.disabled) {
              return (
                <div
                  key={item.to}
                  data-layer="Selected=disabled"
                  className="inline-flex justify-start items-center gap-1 w-full p-4"
                >
                  <div data-layer="Icon-text-wrapper" className="IconTextWrapper flex-1 self-stretch h-6 py-2 rounded-sm inline-flex justify-start items-center gap-2">
                    <div data-svg-wrapper data-layer="lucide" className="Lucide relative size-6">
                      {React.cloneElement(item.icon, { className: "size-5 text-neutral-400" })}
                    </div>
                    <div data-layer="Text-wrapper" className="TextWrapper inline-flex flex-col justify-center items-start gap-1">
                      <div data-layer="Page name" className="PageName text-neutral-400 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
                        {item.label}
                      </div>
                      {item.showSubtext && item.subtext && (
                        <div data-layer="Subtext" className="text-neutral-300 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">
                          {item.subtext}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
            const selected = new RegExp(`^${item.to}(\\/|$)`).test(location.pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                data-layer={`Selected=${selected ? 'selected' : 'Default'}`}
                className={cn(
                  "self-stretch inline-flex justify-start items-center gap-1 w-full p-4",
                  selected ? "rounded-xl bg-neutral-neutral-100" : "rounded-[20px]",
                  "focus-visible:outline-none"
                )}
                aria-current={selected ? "page" : undefined}
              >
                <div data-layer="icon-text-wrapper" className="flex-1 self-stretch flex items-center gap-2 rounded-sm h-6 py-2">
                  <div data-layer="lucide" className="size-6 relative overflow-hidden">
                    {React.cloneElement(item.icon, {
                      className: selected ? "size-5 text-neutral-neutral-600" : "size-5 text-neutral-neutral-600"
                    })}
                  </div>
                  <div data-layer="Page name" className={cn(
                    "text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide",
                    selected ? "text-neutral-neutral-600" : "text-neutral-neutral-600"
                  )}>
                    {item.label}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default SidebarNavItems;
