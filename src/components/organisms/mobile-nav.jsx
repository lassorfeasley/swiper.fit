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
      className="mobile-nav self-stretch bg-white border-t border-neutral-300 inline-flex flex-col justify-end items-center fixed bottom-0 left-0 right-0 w-full md:hidden z-[100]"
    >
      {isWorkoutActive ? (
        <ActiveWorkoutNav />
      ) : (
        <div className="self-stretch flex w-full">
          {navItems.map((item, index) => {
            const selected = new RegExp(`^${item.to}(\/|$)`).test(pathname);
            const isLastItem = index === navItems.length - 1;

            const itemClasses = cn(
              "flex-1 p-2 inline-flex flex-col justify-center items-center gap-2",
              !isLastItem && "border-r border-neutral-300"
            );

            if (item.disabled) {
              return (
                <div
                  key={item.to}
                  className={cn(itemClasses, "opacity-50 cursor-not-allowed")}
                >
                  <div className="relative">
                    <span className="text-neutral-400">{item.icon}</span>
                  </div>
                  <div className="text-center justify-start text-xs font-bold font-vietnam uppercase leading-3 tracking-wide text-neutral-400">
                    {item.label}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.to}
                to={item.to}
                className={itemClasses}
                aria-current={selected ? "page" : undefined}
              >
                <div className="relative">
                  <span
                    className={cn(
                      selected ? "text-neutral-700" : "text-neutral-400"
                    )}
                  >
                    {item.icon}
                  </span>
                </div>
                <div
                  className={cn(
                    "text-center justify-start text-xs font-bold font-vietnam uppercase leading-3 tracking-wide",
                    selected ? "text-neutral-700" : "text-neutral-400"
                  )}
                >
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default MobileNav;
