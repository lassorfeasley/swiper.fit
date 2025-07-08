import { SidebarFooter } from "@/components/atoms/sidebar";
import React from "react";
import { Link } from "react-router-dom";
import { useNavItems } from "@/hooks/use-nav-items";
import { cn } from "@/lib/utils";
import SidebarNavItems from "@/components/molecules/sidebar-nav-items";

const SideBarNav = () => {
  const navItems = useNavItems();
  const accountItem = navItems.find(item => item.label === "Account");
  const selectedAccount = new RegExp(`^${accountItem.to}(\\/|$)`).test(location.pathname);
  return (
    <aside data-layer="Property 1=Variant2" className="hidden md:fixed md:inset-y-0 md:left-0 md:inline-flex md:flex-col md:w-64 h-full bg-neutral-100 border-r border-neutral-300 md:z-50 overflow-y-hidden overflow-x-hidden Property1Variant2">
      <div data-layer="Frame 18" className="Frame18 w-64 self-stretch inline-flex flex-col justify-between items-stretch h-full overflow-x-hidden">
        <div data-layer="Frame 21" className="Frame21 self-stretch px-4 py-5 border-b border-neutral-300 flex justify-start items-center">
          <div data-svg-wrapper data-layer="Vector" className="Vector">
            <svg width="24" height="19" viewBox="0 0 40 31" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 4.85713L13.8329 31L0 18.3308L4.52049 13.2704L13.6322 21.6156L35.269 0L40 4.85713Z" fill="var(--green-500, #22C55E)"/>
            </svg>
          </div>
        </div>
        <div data-layer="MaxWidthWrapper" className="Maxwidthwrapper self-stretch flex-1 flex flex-col justify-center items-stretch">
          <SidebarNavItems />
        </div>
        <div data-layer="Frame 16" className="Frame16 self-stretch border-t border-neutral-300">
          <SidebarFooter className="p-0">
            <Link
              key={accountItem.to}
              to={accountItem.to}
              data-layer={`Selected=${selectedAccount ? 'selected' : 'Default'}`}
              className={cn(
                "inline-flex justify-start items-center gap-1 w-full p-4",
                selectedAccount ? "bg-white border-t border-b border-neutral-300" : "bg-neutral-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-current={selectedAccount ? "page" : undefined}
            >
              <div data-layer="Frame 17" className="flex-1 flex items-center gap-2 rounded-sm">
                <div data-layer="lucide" className="size-6 relative overflow-hidden">
                  {React.cloneElement(accountItem.icon, { className: selectedAccount ? "size-5 text-neutral-neutral-500" : "size-5 text-neutral-neutral-400" })}
                </div>
                <div data-layer="Page name" className={cn(
                  "text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide",
                  selectedAccount ? "text-neutral-neutral-500" : "text-neutral-neutral-400"
                )}>
                  {accountItem.label}
                </div>
              </div>
            </Link>
          </SidebarFooter>
        </div>
      </div>
    </aside>
  );
};

export default SideBarNav;
