import ActiveWorkoutNav from "@/components/molecules/active-workout-nav";
import { cn } from "@/lib/utils";
import React from "react";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { Link, useLocation } from "react-router-dom";
import { useNavItems } from "@/hooks/use-nav-items";

const MobileNav = () => {
  const navItems = useNavItems();
  const { pathname } = useLocation();
  const { isWorkoutActive } = useActiveWorkout();

  return (
    <nav
      className="mobile-nav self-stretch inline-flex flex-col justify-end items-center fixed bottom-0 left-0 right-0 w-full md:hidden z-[100] overflow-visible pb-[env(safe-area-inset-bottom)] bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(255,255,255,0)_10%,rgba(255,255,255,0.5)_40%,rgba(255,255,255,1)_80%,rgba(255,255,255,1)_100%)]"
    >
      {isWorkoutActive ? (
        <ActiveWorkoutNav />
      ) : (
        <div className="self-stretch px-5 pb-4 flex flex-col justify-start items-start gap-2.5">
          <div className="self-stretch min-h-16 bg-white/80 rounded-[100px] shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] inline-flex justify-between items-center">
            {navItems.map((item) => {
              const selected = new RegExp(`^${item.to}(\/|$)`).test(pathname);

              if (item.disabled) {
                return (
                  <div key={item.to} className="flex-1 h-14 p-2 inline-flex flex-col justify-center items-center gap-2 opacity-50 cursor-not-allowed">
                  <div className="self-stretch flex-1 py-1 rounded-[100px] flex flex-col justify-center items-center gap-2">
                    <div className="size-6 relative">
                        <span className="text-neutral-400">{item.icon}</span>
                      </div>
                      <div className="text-center justify-start text-neutral-400 text-xs font-bold uppercase leading-3 tracking-wide">{item.label}</div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex-1 h-14 p-2 inline-flex flex-col justify-center items-center gap-2"
                  aria-current={selected ? "page" : undefined}
                >
                  <div className={cn(
                    "self-stretch flex-1 py-1 rounded-[100px] flex flex-col justify-center items-center gap-2",
                    selected && "bg-neutral-100/60"
                  )}>
                    <div className="size-6 relative">
                      <span className={cn(selected ? "text-neutral-700" : "text-neutral-400")}>{item.icon}</span>
                    </div>
                    <div className={cn(
                      "text-center justify-start text-xs font-bold uppercase leading-3 tracking-wide",
                      selected ? "text-neutral-700" : "text-neutral-400"
                    )}>
                      {item.label}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default MobileNav;
