// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=114-1276&t=9pgcPuKv7UdpdreN-4

import PropTypes from "prop-types";
import React, { useState, useRef, useEffect, forwardRef } from "react";
import { ArrowLeft, Search, Settings2, Plus, Share2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TextInput } from "@/components/molecules/text-input";

const PageHeader = forwardRef(({
  reserveSpace = false,
  variant = 'default',
  showBackButton = false,
  title = "Page",
  showSearch = false,
  showSettings = false,
  showAdd = false,
  showShare = false,
  showSidebar = false,
  onBack,
  onSearch,
  onSettings,
  onAdd,
  onShare,
  searchValue = "",
  onSearchChange = () => {},
  className,
}, ref) => {
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef(null);

  // focus input when active
  useEffect(() => {
    if (searchActive && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 10);
    }
  }, [searchActive]);

  return (
    <header
      ref={ref}
      className={cn(
        variant === 'dark-fixed'
          ? "fixed top-0 z-50 self-stretch min-h-14 px-5 py-2.5 bg-neutral-700 inline-flex justify-between items-center"
          : "fixed top-0 z-50 self-stretch min-h-14 px-5 pt-5 bg-transparent inline-flex justify-between items-center",
        showSidebar
          ? "left-0 w-full md:left-64 md:w-[calc(100%-16rem)]"
          : "left-0 w-full",
        className
      )}
    >
      <div className={cn("flex justify-start items-center gap-2.5", searchActive ? "hidden sm:flex" : "")}>
        {showBackButton && (
          <button
            className={cn(
              "h-10 p-2 rounded-[40px] flex justify-center items-center",
              variant === 'dark-fixed' ? "" : "bg-neutral-700"
            )}
            onClick={onBack}
            aria-label="Back"
          >
            <div
              className={cn(
                "w-full h-full relative overflow-hidden flex items-center justify-center",
                variant === 'dark-fixed' ? "" : "bg-neutral-700"
              )}
            >
              <ArrowLeft className="w-full h-full text-white" />
            </div>
          </button>
        )}
        <div
          className={cn(
            "flex-1 min-w-0 justify-center text-2xl font-bold font-['Be_Vietnam_Pro'] leading-normal truncate",
            variant === 'dark-fixed' ? "text-white" : "text-neutral-700"
          )}
        >
          {title}
        </div>
      </div>
      
      {/* Action / Search area */}
      {searchActive ? (
        <div className="flex items-center gap-2 w-full max-w-[420px]">
          <div className="flex-1">
            <TextInput
              ref={searchInputRef}
              customPlaceholder="Search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              icon={<Search className="size-4 text-neutral-300" />}
              className="w-full"
            />
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center"
            onClick={() => {
              onSearchChange("");
              setSearchActive(false);
            }}
            aria-label="Clear search"
          >
            <X className={cn(
              "w-6 h-6",
              variant === 'dark-fixed' ? 'text-white' : 'text-neutral-700'
            )} />
          </button>
        </div>
      ) : (
        (showSearch || showSettings || showAdd || showShare) && (
          <div
            className={cn(
              "Pageactions px-3 py-2 rounded-[40px] inline-flex justify-start items-center gap-3",
              variant === 'dark-fixed' ? "" : "bg-neutral-700"
            )}
          >
            {showSearch && (
              <button
                className="Search w-8 h-8 flex items-center justify-center"
                onClick={() => setSearchActive(true)}
                aria-label="Open search"
              >
                <Search className="w-6 h-6 text-white" />
              </button>
            )}
            {showShare && (
              <button
                className="Share w-8 h-8 flex items-center justify-center"
                onClick={onShare}
                aria-label="Share"
              >
                <Share2 className="w-6 h-6 text-white" />
              </button>
            )}
            {showSettings && (
              <button
                className="Settings2 w-8 h-8 flex items-center justify-center"
                onClick={onSettings}
                aria-label="Settings"
              >
                <Settings2 className="w-6 h-6 text-white" />
              </button>
            )}
            {showAdd && (
              <button
                className="Add w-8 h-8 flex items-center justify-center"
                onClick={onAdd}
                aria-label="Add"
              >
                <Plus className="w-6 h-6 text-white" />
              </button>
            )}
          </div>
        )
      )}
    </header>
  );
});

PageHeader.propTypes = {
  reserveSpace: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'dark-fixed']),
  showBackButton: PropTypes.bool,
  title: PropTypes.string,
  showSearch: PropTypes.bool,
  showSettings: PropTypes.bool,
  showAdd: PropTypes.bool,
  showShare: PropTypes.bool,
  showSidebar: PropTypes.bool,
  onBack: PropTypes.func,
  onSearch: PropTypes.func,
  onSettings: PropTypes.func,
  onAdd: PropTypes.func,
  onShare: PropTypes.func,
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  className: PropTypes.string,
};

PageHeader.displayName = "PageHeader";

export default PageHeader;
