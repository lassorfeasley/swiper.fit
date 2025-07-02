import React, { useRef, useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import PropTypes from "prop-types";

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
    'showBackButton', 'showSearch', 'showSettings', 'showAdd', 'showShare',
    'onBack', 'onSearch', 'onSettings', 'onAdd', 'onShare', 'searchValue', 'onSearchChange', 'className',
  ];

  const filteredHeaderProps = Object.fromEntries(
    Object.entries(headerProps).filter(([key]) => allowedHeaderProps.includes(key))
  );

  return (
    <div className="min-h-screen flex bg-white md:h-screen">
      <div className={showSidebar ? "flex flex-col flex-1 md:ml-64" : "flex flex-col flex-1"}>
        {!hideHeader && (
          <PageHeader
            ref={headerRef}
            title={title}
            showSidebar={showSidebar}
            {...filteredHeaderProps}
            onDelete={onDelete}
            showDeleteOption={showDeleteOption}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
          />
        )}
        <main
          data-scroll-snap-enabled={enableScrollSnap}
          data-no-top-padding={noTopPadding}
          style={{
            "--mobile-nav-height": "80px",
            paddingTop: hideHeader || noTopPadding ? '0px' : headerHeight,
          }}
          className={`flex-1 ${hideHeader || noTopPadding ? '!pt-0 min-h-screen' : 'overflow-y-auto'}`}
        >
          {children}
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
