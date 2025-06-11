import React from "react";
import ResponsiveNav from "@/components/organisms/responsive-nav";
import PageHeader from "@/components/layout/PageHeader";
import PropTypes from "prop-types";
import { Home, Star, RotateCcw, Play } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: <Home className="w-7 h-7" /> },
  { to: "/programs", label: "Programs", icon: <Star className="w-7 h-7" /> },
  { to: "/history", label: "History", icon: <RotateCcw className="w-7 h-7" /> },
  { to: "/workout", label: "Workout", icon: <Play className="w-7 h-7" /> },
];

export default function AppLayout({ children, showSidebar = true, ...headerProps }) {
  return (
    <div className="min-h-screen flex bg-stone-200">
      {/* Sidebar */}
      {showSidebar && (
        <ResponsiveNav navItems={navItems} />
      )}
      {/* Main area: header + content */}
      <div className={showSidebar ? "flex flex-col flex-1 md:ml-64" : "flex flex-col flex-1"}>
        {showSidebar && <PageHeader {...headerProps} />}
        <main 
          style={{ '--mobile-nav-height': '80px' }}
          className="flex-1 p-4 pt-14 pb-[var(--mobile-nav-height)] md:pb-0"
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