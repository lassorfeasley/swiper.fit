import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useNavItems } from "@/hooks/use-nav-items";
import { cn } from "@/lib/utils";

const MobileNav: React.FC = () => {
  const navItems = useNavItems();
  const { pathname } = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 px-5 pb-4">
      <div className="w-96 h-16 bg-white/80 rounded-[100px] shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] flex justify-between items-center px-2">
        {navItems.map((item) => {
          const selected = new RegExp(`^${item.to}(\/|$)`).test(pathname);
          
          return (
            <div key={item.to} className="flex-1">
              <Link
                to={item.to}
                className={cn(
                  "flex flex-col justify-center items-center gap-2 w-full",
                  item.disabled && "opacity-50 pointer-events-none"
                )}
                aria-current={selected ? "page" : undefined}
              >
                <div className={cn(
                  "self-stretch flex-1 py-1 flex flex-col justify-center items-center gap-2",
                  selected ? "bg-neutral-100/60 rounded-[100px]" : ""
                )}>
                  <div className="w-6 h-6 flex items-center justify-center">
                    <span className={cn(
                      "size-5",
                      selected ? "text-neutral-neutral-700" : "text-neutral-neutral-400"
                    )}>
                      {item.icon}
                    </span>
                  </div>
                  <div className={cn(
                    "text-center text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide",
                    selected ? "text-neutral-neutral-700" : "text-neutral-neutral-400"
                  )}>
                    {item.label}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
