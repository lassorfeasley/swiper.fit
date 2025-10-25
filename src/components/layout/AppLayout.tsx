import React, { useRef, useEffect, useState } from "react";
import { useAccount } from "@/contexts/AccountContext";
import PageHeader from "@/components/layout/PageHeader";
import Footer from "@/components/layout/Footer";
import SideBarNav from "@/components/layout/SideBarNav";
import TrainerNavigation from "@/components/shared/TrainerNavigation";
import { getScrollSnapCSSVars, SCROLL_CONTEXTS } from "@/lib/scrollSnap";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  onDelete?: () => void;
  showDeleteOption?: boolean;
  onEdit?: () => void;
  showEditOption?: boolean;
  search?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  enableScrollSnap?: boolean;
  noTopPadding?: boolean;
  hideHeader?: boolean;
  hideDelegateHeader?: boolean;
  title?: string;
  // Header props that can be passed through
  variant?: 'default' | 'dark-fixed' | 'programs';
  reserveSpace?: boolean;
  showBackButton?: boolean;
  showSearch?: boolean;
  showSettings?: boolean;
  showAddButton?: boolean;
  showPlusButton?: boolean;
  showShare?: boolean;
  pageContext?: string;
  pageNameEditable?: boolean;
  showAdd?: boolean;
  className?: string;
  onAdd?: () => void;
  onSettings?: () => void;
  onShare?: () => void;
  sharingSection?: React.ReactNode;
  rightContent?: React.ReactNode;
  "data-component"?: string;
  showStartWorkout?: boolean;
  showStartWorkoutIcon?: boolean;
  showUpload?: boolean;
  showDelete?: boolean;
  onBack?: () => void;
  onSearch?: () => void;
  onStartWorkout?: () => void;
  onStartWorkoutIcon?: () => void;
  onUpload?: () => void;
  titleRightText?: string;
  startCtaText?: string;
}

export default function AppLayout({
  children,
  showSidebar = true,
  onDelete,
  showDeleteOption = false,
  onEdit,
  showEditOption,
  search = false,
  searchValue,
  onSearchChange,
  enableScrollSnap = false,
  noTopPadding = false,
  hideHeader = false,
  hideDelegateHeader = false,
  title,
  ...headerProps
}: AppLayoutProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const location = useLocation();

  // Detect delegate mode
  const { isDelegated } = useAccount();

  // Add a class to the body when the sidebar is shown
  useEffect(() => {
    if (showSidebar) {
      document.body.classList.add("sidebar-shown");
    } else {
      document.body.classList.remove("sidebar-shown");
    }
    return () => {
      document.body.classList.remove("sidebar-shown");
    };
  }, [showSidebar]);

  const sidebarWidthPx = 256; // Tailwind w-64

  useEffect(() => {
    function updateHeaderHeight() {
      const h = hideHeader ? 0 : (headerRef.current ? headerRef.current.offsetHeight : 0);
      setHeaderHeight(h);
      document.documentElement.style.setProperty("--header-height", `${h}px`);
    }
    updateHeaderHeight();
    let ro: ResizeObserver | undefined;
    if (!hideHeader && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(updateHeaderHeight);
      if (headerRef.current) ro.observe(headerRef.current);
    }
    window.addEventListener("resize", updateHeaderHeight);
    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
      if (ro) ro.disconnect();
    };
  }, [hideHeader, headerProps]);

  const allowedHeaderProps = [
    'variant', 'reserveSpace', 'showBackButton', 'showSearch', 'showSettings', 'showAdd', 'showPlusButton', 'showShare', 'showStartWorkout', 'showStartWorkoutIcon',
    'showUpload', 'showDelete', 'onBack', 'onSearch', 'onSettings', 'onAdd', 'onShare', 'onStartWorkout', 'onStartWorkoutIcon', 'onUpload', 'onDelete',
    'searchValue', 'onSearchChange', 'className', 'titleRightText', 'startCtaText', 'sharingSection', 'rightContent'
  ];

  const filteredHeaderProps = Object.fromEntries(
    Object.entries(headerProps).filter(([key]) => allowedHeaderProps.includes(key))
  );

  const { showAdd: showAddProp, ...restHeaderProps } = filteredHeaderProps;
  const showPlusButtonProp = Boolean(restHeaderProps.showPlusButton ?? showAddProp);

  const variant = restHeaderProps.variant;
  // Reserve space for the fixed header by default globally, except for the 'glass' variant
  const reserveSpace = restHeaderProps.reserveSpace ?? (variant !== 'glass');

  // Calculate header height – old delegate banner removed, so no extra offset needed
  const baseHeaderHeight = hideHeader ? 0 : headerHeight;
  const totalHeaderHeight = baseHeaderHeight;

  return (
    <div className="min-h-screen flex relative">
      {showSidebar && <SideBarNav />}
      <div 
        className={cn(
          "flex flex-col flex-1 z-[100]",
          showSidebar ? "md:ml-64" : ""
        )}
      >
        {/* Old delegate banner removed */}
        {!hideHeader && (
          <PageHeader
            ref={headerRef}
            title={title}
            showSidebar={showSidebar}
            {...restHeaderProps}
            showPlusButton={showPlusButtonProp}
            onDelete={onDelete}
            showDeleteOption={showDeleteOption}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            className={undefined}
          />
        )}
        <div className="flex-1 flex flex-col">
          <main
            data-scroll-snap-enabled={enableScrollSnap}
            data-no-top-padding={noTopPadding}
            style={{
              "--mobile-nav-height": "80px",
              ...(enableScrollSnap ? getScrollSnapCSSVars(SCROLL_CONTEXTS.WORKOUT) : {})
            } as React.CSSProperties}
            className="flex-1"
          >
            <div className="pb-24 md:pb-0">
              {children}
            </div>
            {/* Add bottom padding when sharing nav is visible to prevent content overlap */}
            {isDelegated && <div className="h-20" />}
            {/* Spacer above footer */}
            <div aria-hidden="true" style={{ height: 60 }} />
            <Footer />
          </main>
          
          {/* Trainer Navigation - Fixed at bottom */}
          <div className={cn(
            "fixed bottom-0 z-[200] w-screen",
            showSidebar ? "left-64" : "left-0"
          )}>
            <TrainerNavigation />
          </div>
        </div>
      </div>
    </div>
  );
}
