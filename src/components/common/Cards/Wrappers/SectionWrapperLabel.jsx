import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "@/contexts/AccountContext";

/**
 * SectionWrapperLabel – customizable label/header area for PageSectionWrapper.
 * Supports optional edit, save, and cancel actions displayed to the right of the title.
 */
const SectionWrapperLabel = ({
  children,
  isEditing = false,
  onEdit,
  onSave,
  isSaveDisabled = false,
  onCancel,
  showPlusButton = false,
  onPlus,
  className = "",
  isSticky = true,
  stickyTopClass: initialStickyTopClass = "top-11",
  isFirst = false,
  ...props
}) => {
  const { isDelegated } = useAccount();
  const [isDesktopWithSidebar, setIsDesktopWithSidebar] = useState(false);

  // Check if we're on desktop with sidebar (which affects scrolling container)
  useEffect(() => {
    const checkDesktopSidebar = () => {
      const isDesktop = window.innerWidth >= 1024; // lg breakpoint
      const hasSidebarClass = document.body.classList.contains('sidebar-shown');
      setIsDesktopWithSidebar(isDesktop && hasSidebarClass);
    };
    
    checkDesktopSidebar();
    window.addEventListener('resize', checkDesktopSidebar);
    
    // Also watch for changes to the sidebar-shown class
    const observer = new MutationObserver(checkDesktopSidebar);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    return () => {
      window.removeEventListener('resize', checkDesktopSidebar);
      observer.disconnect();
    };
  }, []);

  // Calculate sticky top position
  const getStickyTop = () => {
    if (isDesktopWithSidebar) {
      // When main element is the scrolling container, sticky position is relative to main's content area
      // No offset needed because the content already has padding-top from AppLayout
      return 0;
    } else {
      // Default behavior for mobile/non-sidebar: position relative to viewport
      const baseTopOffset = 44; // h-11 for header
      const delegateHeaderHeight = 44; // h-11 for delegate header
      return isDelegated ? baseTopOffset + delegateHeaderHeight : baseTopOffset;
    }
  };

  const stickyTop = getStickyTop();

  return (
    <div
      className={cn(
        "h-[44px] self-stretch pl-3 bg-white border-b border-neutral-300 inline-flex items-center z-30",
        isSticky && "sticky",
        className
      )}
      style={{ top: isSticky ? `${stickyTop}px` : undefined }}
      {...props}
    >
      <div className="flex-1 flex items-center gap-2.5">
        <div data-layer="title" className="Title flex-1 self-stretch px-3 inline-flex justify-start items-center gap-2.5">
          <div data-layer="Programs" className="Programs justify-start text-neutral-neutral-700 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
            {children}
          </div>
        </div>
        <div className="flex items-center gap-5">
          {showPlusButton && (
            <button onClick={onPlus} aria-label="Add" className="p-2.5 border-l border-neutral-300 flex items-center justify-center">
              <Plus className="w-6 h-6 text-neutral-700" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

SectionWrapperLabel.propTypes = {
  children: PropTypes.node.isRequired,
  isEditing: PropTypes.bool,
  onEdit: PropTypes.func,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  showPlusButton: PropTypes.bool,
  onPlus: PropTypes.func,
  className: PropTypes.string,
  isSaveDisabled: PropTypes.bool,
  isSticky: PropTypes.bool,
  stickyTopClass: PropTypes.string,
};

export default SectionWrapperLabel; 