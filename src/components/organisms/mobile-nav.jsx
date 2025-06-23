import ActiveWorkoutNav from "@/components/molecules/active-workout-nav";
import { cn } from "@/lib/utils";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useNavItems } from "@/hooks/use-nav-items";

const MobileNav = () => {
  const navItems = useNavItems();
  const { pathname } = useLocation();

  return (
    <nav
      className="mobile-nav flex flex-col items-center fixed bottom-0 left-0 right-0 w-full md:hidden px-4 pb-3 z-[100] gap-3"
    >
      <div className="absolute inset-0 -z-10 bg-stone-200/70 backdrop-blur-md [mask-image:linear-gradient(to_bottom,transparent_0,black_40%)]" />
      <ActiveWorkoutNav />
      <div className="flex flex-1 max-w-[350px] justify-evenly items-center mx-auto w-full h-full gap-5">
        {navItems.map((item) => {
          const selected = new RegExp(`^${item.to}(\/|$)`).test(pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              className="w-14 inline-flex flex-col justify-start items-center group"
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
                  "text-center text-xs font-medium leading-none",
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
