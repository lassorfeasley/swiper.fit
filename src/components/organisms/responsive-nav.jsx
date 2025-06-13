import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import { Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarNav,
  SidebarNavItem,
  useSidebar,
} from "@/components/ui/sidebar";
import ActiveWorkoutNav from "@/components/molecules/ActiveWorkoutNav";
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';

function ResponsiveNav({ navItems, onEnd }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isWorkoutActive, endWorkout, activeWorkout } = useActiveWorkout();

  // Remove the 'Workout' item from navItems
  const filteredNavItems = navItems.filter(item => item.label !== 'Workout');

  // Determine nav state
  let workoutNavState = 'c2a';
  if (isWorkoutActive) {
    if (location.pathname === '/workout/active') {
      workoutNavState = 'active-workout';
    } else {
      workoutNavState = 'return-to-workout';
    }
  } else if (location.pathname === '/workout') {
    workoutNavState = 'programPrompt';
  }

  // Handler for C2A click
  const handleC2AClick = () => {
    navigate('/workout');
  };

  // Sidebar Content (shared)
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Nav - vertically centered */}
      <div className="flex-1 flex flex-col justify-center">
        <nav className="flex flex-col">
          {filteredNavItems.map((item) => {
            const selected = new RegExp(`^${item.to}(\/|$)`).test(location.pathname);
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
        <SheetTitle asChild>
          <VisuallyHidden>Sidebar</VisuallyHidden>
        </SheetTitle>
        <SheetDescription asChild>
          <VisuallyHidden>Sidebar navigation and links</VisuallyHidden>
        </SheetDescription>
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
      <div className="flex flex-col h-full w-full">
        <SidebarContent />
        <SidebarFooter>
          <div className="w-full px-5 pb-8">
            <ActiveWorkoutNav variant="sidebar" state={workoutNavState} onClick={handleC2AClick} onEnd={onEnd} />
          </div>
        </SidebarFooter>
      </div>
    </aside>
  );

  // Mobile Nav
  const MobileNav = () => (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-stone-100 border-t border-neutral-300 flex flex-col items-center px-6 py-3 z-50 h-32">
      <div className="flex flex-1 max-w-[350px] justify-between items-center mx-auto w-full h-full">
        {filteredNavItems.map((item) => {
          const selected = new RegExp(`^${item.to}(\/|$)`).test(location.pathname);
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
      <div className="w-full flex justify-center mt-2">
        <ActiveWorkoutNav variant="mobile" state={workoutNavState} onClick={handleC2AClick} onEnd={onEnd} />
      </div>
    </nav>
  );

  return (
    <>
      {/* Only show mobile sidebar/hamburger if not mobile nav */}
      {!isMobile && <MobileSidebar />}
      <DesktopSidebar />
      {/* Only show mobile nav on mobile */}
      {isMobile && <MobileNav />}
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
  onEnd: PropTypes.func,
};

ResponsiveNav.defaultProps = {
  onEnd: () => {},
};

export default ResponsiveNav; 