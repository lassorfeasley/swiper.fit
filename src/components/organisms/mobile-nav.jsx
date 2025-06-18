import ActiveWorkoutNav from "@/components/molecules/active-workout-nav";
import { cn } from "@/lib/utils";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useNavItems } from "@/hooks/use-nav-items";

const MobileNav = () => {
  const navItems = useNavItems();
  const { pathname } = useLocation();

  return (
    <nav className="flex flex-col items-center fixed bottom-0 left-0 w-full bg-stone-100 border-t border-neutral-300 md:hidden p-4 z-50 gap-4">
      <ActiveWorkoutNav />
      <div className="flex flex-1 max-w-[350px] justify-between items-center mx-auto w-full h-full">
        {navItems.map((item) => {
          const selected = new RegExp(`^${item.to}(\/|$)`).test(pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              className="w-14 inline-flex flex-col justify-start items-center gap-1 group"
              aria-current={selected ? "page" : undefined}
            >
              <div className="size-6 flex items-center justify-center">
                <span
                  className={cn(
                    selected
                      ? "text-neutral-500"
                      : "text-neutral-400 group-hover:text-neutral-500"
                  )}
                >
                  {item.icon}
                </span>
              </div>
              <div
                className={cn(
                  "text-center text-xs font-semibold font-['Space_Grotesk'] leading-none",
                  selected
                    ? "text-neutral-500"
                    : "text-neutral-400 group-hover:text-neutral-500"
                )}
              >
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
