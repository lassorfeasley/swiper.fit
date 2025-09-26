import { SidebarFooter } from "@/components/atoms/sidebar";
import React from "react";
import { Link } from "react-router-dom";
import { useNavItems } from "@/hooks/use-nav-items";
import { cn } from "@/lib/utils";
import { useAccount } from "@/contexts/AccountContext";
import SidebarNavItems from "@/components/molecules/sidebar-nav-items";

const SideBarNav = () => {
  const navItems = useNavItems();
  const { isDelegated } = useAccount();
  const accountItem = navItems.find(item => item.label === "Account");
  const selectedAccount = new RegExp(`^${accountItem.to}(\/|$)`).test(location.pathname);
  return (
    <aside
      data-layer="Property 1=sidebar-desktop"
      className="hidden md:fixed md:inset-y-0 md:left-0 md:inline-flex md:flex-col md:w-64 z-[200] overflow-visible"
      style={isDelegated ? { top: "var(--header-height)", height: "calc(100% - var(--header-height))" } : undefined}
    >
      <div data-layer="sidebar-wrapper" className="ml-5 my-5 w-[calc(16rem-20px)] h-[calc(100%-40px)] bg-white rounded-[20px] shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] inline-flex flex-col justify-start items-stretch overflow-hidden">
        <div data-layer="logo-wrapper" className="self-stretch px-4 pt-5 flex flex-col justify-center items-start gap-2.5">
          <div data-layer="logo" className="w-36 h-8 relative">
            <img
              src="/images/swiper-logo.png"
              alt="Swiper"
              className="h-8 w-auto"
            />
          </div>
        </div>
        <div data-layer="selection-wrapper" className="flex-1 px-3 flex flex-col justify-center items-stretch">
          <SidebarNavItems />
        </div>
        <div data-layer="settings-section-wrapper" className="self-stretch px-3 pb-3">
          <SidebarFooter className="p-0">
            {accountItem && (
              <Link
                key={accountItem.to}
                to={isDelegated ? "#" : accountItem.to}
                data-layer={`Selected=${selectedAccount ? 'selected' : 'Default'}`}
                className={cn(
                  "inline-flex justify-start items-center gap-1 w-full p-4 rounded-xl",
                  selectedAccount ? "bg-neutral-neutral-100" : "bg-transparent",
                  "focus-visible:outline-none",
                  isDelegated && "opacity-50 cursor-not-allowed"
                )}
                aria-current={selectedAccount ? "page" : undefined}
                onClick={e => { if (isDelegated) e.preventDefault(); }}
              >
                <div data-layer="icon-text-wrapper" className="flex-1 flex items-center gap-2 rounded-sm">
                  <div data-layer="lucide-icon" className="size-6 relative overflow-hidden">
                    {React.cloneElement(accountItem.icon, { className: selectedAccount ? "size-5 text-neutral-neutral-600" : "size-5 text-neutral-neutral-600" })}
                  </div>
                  <div data-layer="Page name" className={cn(
                    "text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide",
                    "text-neutral-neutral-600"
                  )}>
                    {accountItem.label}
                  </div>
                </div>
              </Link>
            )}
          </SidebarFooter>
        </div>
      </div>
    </aside>
  );
};

export default SideBarNav;
