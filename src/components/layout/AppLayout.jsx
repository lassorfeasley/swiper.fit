import React from "react";
import ResponsiveNav from "@/components/organisms/responsive-nav";
import PageHeader from "@/components/layout/PageHeader";
import PropTypes from "prop-types";

export default function AppLayout({ children, showSidebar = true, ...headerProps }) {
  return (
    <div className="min-h-screen flex bg-muted">
      {/* Sidebar */}
      {showSidebar && (
        <ResponsiveNav />
      )}
      {/* Main area: header + content */}
      <div className={showSidebar ? "flex flex-col flex-1 md:ml-[240px]" : "flex flex-col flex-1"}>
        {showSidebar && <PageHeader {...headerProps} />}
        <main className="flex-1 p-4">
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