import React, { useRef, useEffect, useState } from "react";
import { useAccount } from "@/contexts/AccountContext";
import DelegateModeHeader from "@/components/layout/DelegateModeHeader";
import PageHeader from "@/components/layout/PageHeader";
import PropTypes from "prop-types";
import Footer from "@/components/layout/Footer";
import SideBarNav from "@/components/organisms/side-bar-nav";
import { getScrollSnapCSSVars, SCROLL_CONTEXTS } from "@/lib/scrollSnap";

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
  title,
  ...headerProps
}) {
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

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
      if (headerRef.current) {
        const h = headerRef.current.offsetHeight;
        setHeaderHeight(h);
        document.documentElement.style.setProperty("--header-height", `${h}px`);
      }
    }
    updateHeaderHeight();
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(updateHeaderHeight);
      if (headerRef.current) ro.observe(headerRef.current);
    }
    window.addEventListener("resize", updateHeaderHeight);
    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
      if (ro) ro.disconnect();
    };
  }, [headerProps]);

  const allowedHeaderProps = [
    'variant', 'reserveSpace', 'showBackButton', 'showSearch', 'showSettings', 'showAdd', 'showShare', 'showStartWorkout',
    'showUpload', 'showDelete', 'onBack', 'onSearch', 'onSettings', 'onAdd', 'onShare', 'onStartWorkout', 'onUpload', 'onDelete',
    'searchValue', 'onSearchChange', 'className', 'titleRightText', 'startCtaText'
  ];

  const filteredHeaderProps = Object.fromEntries(
    Object.entries(headerProps).filter(([key]) => allowedHeaderProps.includes(key))
  );

  const { showAdd: showAddProp, ...restHeaderProps } = filteredHeaderProps;
  const showPlusButtonProp = restHeaderProps.showPlusButton ?? showAddProp;

  const variant = restHeaderProps.variant;
  const reserveSpace = restHeaderProps.reserveSpace;

  // Calculate header height - when delegated, we need space for the delegate header even if hideHeader is true
  const baseHeaderHeight = hideHeader && !isDelegated ? 0 : headerHeight;
  const totalHeaderHeight = isDelegated ? (hideHeader ? 44 : baseHeaderHeight + 44) : baseHeaderHeight;

  return (
    <div className="min-h-screen flex bg-white relative">
      {showSidebar && <SideBarNav />}
      <div className={showSidebar ? "flex flex-col flex-1 md:ml-64 overflow-y-auto min-h-0 relative z-[100]" : "flex flex-col flex-1 overflow-y-auto min-h-0"}>
        {isDelegated && <DelegateModeHeader />}
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
            className={isDelegated ? "fixed top-[var(--header-height)] left-0 right-0 transition-[top] ease-in-out" : undefined}
          />
        )}
        <main
          data-scroll-snap-enabled={enableScrollSnap}
          data-no-top-padding={noTopPadding}
          style={{
            "--mobile-nav-height": "80px",
            paddingTop: reserveSpace ? `${totalHeaderHeight}px` : 0,
            transition: 'padding-top 0.3s ease-in-out',
            height: '100%',
            ...(enableScrollSnap ? getScrollSnapCSSVars(SCROLL_CONTEXTS.WORKOUT) : {})
          }}
          className="flex flex-col flex-1 min-h-0 overflow-y-auto"
        >
          <div className="flex-1 min-h-0 flex flex-col" style={{ height: '100%' }}>
            <div className="flex-1 min-h-0">
              {children}
            </div>
            <div className="mt-auto" style={{ marginTop: 'auto' }}>
              <Footer />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

AppLayout.propTypes = {
  children: PropTypes.node,
  showSidebar: PropTypes.bool,
  onDelete: PropTypes.func,
  showDeleteOption: PropTypes.bool,
  onEdit: PropTypes.func,
  showEditOption: PropTypes.bool,
  search: PropTypes.bool,
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  enableScrollSnap: PropTypes.bool,
  noTopPadding: PropTypes.bool,
  hideHeader: PropTypes.bool,
  title: PropTypes.string,
};
