import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useNavItems } from "@/hooks/use-nav-items";
import { cn } from "@/lib/utils";
import { useAccount } from "@/contexts/AccountContext";

const MobileNav: React.FC = () => {
  const navItems = useNavItems();
  const location = useLocation();
  const { isDelegated } = useAccount();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-neutral-300 mobile-nav">
      <div className="flex items-center justify-around h-20 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to !== "/" && location.pathname.startsWith(item.to));
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center min-h-12 px-3 py-2 rounded-xl transition-colors",
                "hover:bg-neutral-neutral-100 active:bg-neutral-neutral-200",
                isActive 
                  ? "text-neutral-neutral-600 bg-neutral-neutral-100" 
                  : "text-neutral-neutral-600",
                item.disabled && "opacity-50 pointer-events-none"
              )}
            >
              <div className="flex items-center justify-center w-6 h-6 mb-1">
                {React.cloneElement(item.icon, {
                  className: "size-5 text-neutral-neutral-600"
                })}
              </div>
              <span className="text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
