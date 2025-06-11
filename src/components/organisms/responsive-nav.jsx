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

export default function ResponsiveNav({ navItems }) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { open, setOpen } = useSidebar();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 768) {
      setOpen(false);
    }
  }, [location.pathname, setOpen]);

  // Mobile Navigation Component
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
                <div className={cn(selected ? "text-zinc-700" : "text-slate-200")}>
                  {item.icon}
                </div>
              </div>
              <div
                className={cn(
                  "text-center text-xs font-bold font-['Space_Grotesk'] leading-3",
                  selected ? "text-slate-600" : "text-slate-200"
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

  // Desktop Navigation Component
  const DesktopNav = () => (
    <div className="hidden md:block">
      <Sheet open={open} onOpenChange={setOpen}>
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
            "w-[240px] p-0 border-r bg-background",
            "md:relative md:translate-x-0 md:border-r md:shadow-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
          )}
        >
          <Sidebar 
            defaultOpen={true}
            onOpenChange={setIsSidebarOpen}
            className="h-full"
          >
            <SidebarHeader className="sticky top-0 z-10 bg-background">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">F</span>
                </div>
                <h1 className="text-xl font-bold text-slate-800">FitAI</h1>
              </div>
            </SidebarHeader>
            <SidebarContent className="scrollbar-none">
              <SidebarNav>
                {navItems.map((item) => {
                  const selected = location.pathname === item.to;
                  return (
                    <SidebarNavItem
                      key={item.to}
                      asChild
                      active={selected}
                      icon={item.icon}
                    >
                      <Link to={item.to}>
                        {item.label}
                      </Link>
                    </SidebarNavItem>
                  );
                })}
              </SidebarNav>
            </SidebarContent>
            <SidebarFooter className="sticky bottom-0 z-10 bg-background">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-slate-500">
                  © 2024 FitAI
                </div>
                <div className="text-xs text-slate-400">
                  All rights reserved
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>
        </SheetContent>
      </Sheet>
    </div>
  );

  return (
    <>
      <MobileNav />
      <DesktopNav />
    </>
  );
}

ResponsiveNav.propTypes = {
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      to: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node.isRequired,
    })
  ).isRequired,
}; 