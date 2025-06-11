import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import { Home, Star, RotateCcw, Play, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarNav,
  SidebarNavItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { to: '/', label: 'Home', icon: <Home className="size-5" /> },
  { to: '/programs', label: 'Programs', icon: <Star className="size-5" /> },
  { to: '/history', label: 'History', icon: <RotateCcw className="size-5" /> },
  { to: '/workout', label: 'Workout', icon: <Play className="size-5" /> },
];

export default function ResponsiveNav() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Mobile Sidebar (Sheet)
  const MobileSidebar = () => (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="md:hidden fixed top-4 left-4 z-40"
          size="icon"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className={cn(
          "w-64 p-0 border-r bg-stone-100 flex flex-col h-full"
        )}
      >
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <aside
      className={cn(
        "hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col md:border-r md:bg-stone-100 md:z-30"
      )}
    >
      <SidebarContent />
    </aside>
  );

  // Sidebar Content (shared)
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Nav - vertically centered */}
      <div className="flex-1 flex flex-col justify-center">
        <nav className="flex flex-col">
          {navItems.map((item) => {
            const selected = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-1 px-6 py-3 text-xs font-semibold font-['Space_Grotesk'] transition-colors",
                  selected 
                    ? "bg-neutral-300 text-neutral-500" 
                    : "text-neutral-400 hover:bg-neutral-200/50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
                aria-current={selected ? "page" : undefined}
              >
                <span className={cn(
                  "size-6 flex items-center justify-center",
                  selected ? "text-neutral-500" : "text-neutral-400 group-hover:text-neutral-500"
                )}>
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

  // Mobile Bottom Nav
  const MobileNav = () => (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-stone-100 border-t border-neutral-300 flex justify-between items-start px-6 py-3 z-50 h-20">
      <div className="flex flex-1 max-w-[350px] justify-between items-center mx-auto w-full h-full">
        {navItems.map((item) => {
          const selected = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="w-14 inline-flex flex-col justify-start items-center gap-1 group"
              aria-current={selected ? "page" : undefined}
            >
              <div className="size-6 flex items-center justify-center">
                <span className={cn(
                  selected ? "text-neutral-500" : "text-neutral-400 group-hover:text-neutral-500"
                )}>
                  {item.icon}
                </span>
              </div>
              <div className={cn(
                "text-center text-xs font-semibold font-['Space_Grotesk'] leading-none",
                selected ? "text-neutral-500" : "text-neutral-400 group-hover:text-neutral-500"
              )}>
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return (
    <>
      <MobileSidebar />
      <DesktopSidebar />
      <MobileNav />
    </>
  );
} 