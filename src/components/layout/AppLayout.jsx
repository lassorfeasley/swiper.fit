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
  ...headerProps
}) {
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    function updateHeaderHeight() {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    }
    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, [headerProps]); // Re-run if props that affect height change

  return (
    <div className="min-h-screen flex bg-stone-200 md:h-screen">
      <div
        className={
          showSidebar ? "flex flex-col flex-1 md:ml-64" : "flex flex-col flex-1"
        }
      >
        {showSidebar && <PageHeader ref={headerRef} {...headerProps} />}
        <main
          style={{
            "--mobile-nav-height": "80px",
            marginTop: headerHeight,
          }}
          className="flex-1 px-0 pb-[80px] md:pb-4 mb-[100px] md:mb-0 overflow-y-auto"
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
};
