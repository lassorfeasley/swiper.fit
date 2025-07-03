import ActiveWorkoutNav from "@/components/molecules/active-workout-nav";
import { SidebarFooter } from "@/components/atoms/sidebar";
import React from "react";
import { Link } from "react-router-dom";
import { useNavItems } from "@/hooks/use-nav-items";
import { cn } from "@/lib/utils";

const Content = () => {
  const navItems = useNavItems();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col justify-center">
        <nav className="flex flex-col">
          {navItems.map((item) => {
            const selected = new RegExp(`^${item.to}(\/|$)`).test(
              location.pathname
            );
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-1 px-6 py-3 text-xs font-semibold transition-colors",
                  selected
                    ? "bg-neutral-300 text-neutral-500"
                    : "text-neutral-400 hover:bg-neutral-200/50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
                aria-current={selected ? "page" : undefined}
              >
                <span
                  className={cn(
                    "size-6 flex items-center justify-center",
                    selected
                      ? "text-neutral-500"
                      : "text-neutral-400 group-hover:text-neutral-500"
                  )}
                >
                  {item.icon}
                </span>
                <span className="leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

const SideBarNav = () => {
  return (
    <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col md:border-r md:bg-stone-100 md:z-30">
      <div className="flex flex-col h-full w-full overflow-y-auto">
        <Content />
        <SidebarFooter>
          <div className="w-full px-1 pb-8">
            <ActiveWorkoutNav />
          </div>
        </SidebarFooter>
      </div>
    </aside>
  );
};

export default SideBarNav;
