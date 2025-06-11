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
  { to: '/', label: 'Home', icon: <Home /> },
  { to: '/programs', label: 'Programs', icon: <Star /> },
  { to: '/history', label: 'History', icon: <RotateCcw /> },
  { to: '/workout', label: 'Workout', icon: <Play /> },
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
          "w-[240px] p-0 border-r bg-background flex flex-col h-full"
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
        "hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-[240px] md:flex-col md:border-r md:bg-background md:z-30"
      )}
    >
      <SidebarContent />
    </aside>
  );

  // Sidebar Content (shared)
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 h-14 border-b px-4 sticky top-0 z-10 bg-background">
        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-lg font-bold text-primary">F</span>
        </div>
        <h1 className="text-xl font-bold text-slate-800">FitAI</h1>
      </div>
      {/* Nav */}
      <nav className="flex-1 overflow-auto p-2 flex flex-col gap-1">
        {navItems.map((item) => {
          const selected = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                selected && "bg-accent text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-current={selected ? "page" : undefined}
            >
              <span className={cn(
                "size-5 shrink-0",
                selected ? "text-accent-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
              )}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {/* Footer */}
      <div className="flex h-14 items-center border-t px-4 sticky bottom-0 z-10 bg-background">
        <div className="flex flex-col gap-1">
          <div className="text-xs text-slate-500">© 2024 FitAI</div>
          <div className="text-xs text-slate-400">All rights reserved</div>
        </div>
      </div>
    </div>
  );

  // Mobile Bottom Nav
  const MobileNav = () => (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t-[0.25px] border-slate-500 flex justify-between items-start px-6 py-3 z-50 h-20 rounded-none">
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
              <div className="size-7 relative overflow-hidden flex items-center justify-center">
                <div className={cn(selected ? "text-zinc-700" : "text-slate-200")}>{item.icon}</div>
              </div>
              <div className={cn(
                "text-center text-xs font-bold font-['Space_Grotesk'] leading-3",
                selected ? "text-slate-600" : "text-slate-200"
              )}>{item.label}</div>
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