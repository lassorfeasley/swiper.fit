import React, { useRef, useEffect, useState } from "react";
import { useAccount } from "@/contexts/AccountContext";
import DelegateModeHeader from "@/components/layout/DelegateModeHeader";
import PageHeader from "@/components/layout/PageHeader";
import PropTypes from "prop-types";
import Footer from "@/components/layout/Footer";

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

  const sidebarWidthPx = 256; // Tailwind w-64
  const sidebarWidth = showSidebar ? sidebarWidthPx : 0;

  useEffect(() => {
    function updateHeaderHeight() {
      if (headerRef.current) {
        const h = headerRef.current.offsetHeight;
        setHeaderHeight(h);
        // Expose as CSS var for global use (e.g., scroll-margin-top)
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

  // List of props that PageHeader actually accepts
  const allowedHeaderProps = [
    'variant',
    'reserveSpace',
    'showBackButton', 'showSearch', 'showSettings', 'showAdd', 'showShare',
    'onBack', 'onSearch', 'onSettings', 'onAdd', 'onShare', 'searchValue', 'onSearchChange', 'className',
  ];

  const filteredHeaderProps = Object.fromEntries(
    Object.entries(headerProps).filter(([key]) => allowedHeaderProps.includes(key))
  );

  // Extract legacy showAdd prop and map it to PageHeader's showPlusButton
  const { showAdd: showAddProp, ...restHeaderProps } = filteredHeaderProps;
  const showPlusButtonProp = restHeaderProps.showPlusButton ?? showAddProp;

  // Determine header variant and reserve flag
  const variant = restHeaderProps.variant;
  const reserveSpace = restHeaderProps.reserveSpace;

  // Determine total height of fixed headers: one PageHeader, plus DelegateModeHeader if impersonating
  const baseHeaderHeight = hideHeader || noTopPadding ? 0 : headerHeight;
  const totalHeaderHeight = isDelegated ? baseHeaderHeight * 2 : baseHeaderHeight;

  return (
    <div className="min-h-screen flex bg-white md:h-screen">
      <div className={showSidebar ? "flex flex-col flex-1 md:ml-64" : "flex flex-col flex-1"}>
        {/* Delegate-mode and page headers */}
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
            // offset PageHeader below DelegateModeHeader when impersonating
            className={isDelegated ? "fixed top-[var(--header-height)] left-0 right-0 transition-[top] ease-in-out" : undefined}
          />
        )}
        <main
          data-scroll-snap-enabled={enableScrollSnap}
          data-no-top-padding={noTopPadding}
          style={{
            "--mobile-nav-height": "80px",
            // Reserve space for fixed headers
            paddingTop: `${totalHeaderHeight}px`,
            transition: 'padding-top 0.3s ease-in-out',
          }}
          className="flex flex-col flex-1 overflow-y-auto"
        >
          <div className="flex-1">
            {children}
          </div>
          <Footer />
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
