import React, { useRef, useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import PropTypes from "prop-types";

export default function AppLayout({
  children,
  showSidebar = true,
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
  }, []);

  return (
    <div className="min-h-screen flex bg-stone-200">
      <div
        className={
          showSidebar ? "flex flex-col flex-1 md:ml-64" : "flex flex-col flex-1"
        }
      >
        {showSidebar && <PageHeader ref={headerRef} {...headerProps} />}
        <main
          style={{
            "--mobile-nav-height": "80px",
            marginTop: headerHeight + 24,
          }}
          className="flex-1 p-4 pb-[var(--mobile-nav-height)] md:pb-0"
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
};
