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
          ? "fixed top-0 z-50 self-stretch h-11 bg-neutral-700 border-b border-neutral-600 inline-flex justify-between items-center"
          : "fixed top-0 z-50 self-stretch h-11 bg-white border-b border-neutral-300 inline-flex justify-between items-center",
        showSidebar
          ? "left-0 w-full md:left-64 md:w-[calc(100%-16rem)]"
          : "left-0 w-full",
        className
      )}
    >
      <div className={cn("flex justify-start items-center", searchActive ? "hidden sm:flex" : "")}>
        {showBackButton && (
          <button
            className={cn(
              "w-11 h-11 flex items-center justify-center",
              variant === 'dark-fixed'
                ? "border-r border-neutral-600"
                : "border-r border-neutral-300"
            )}
            onClick={onBack}
            aria-label="Back"
          >
            <ArrowLeft
              className={cn(
                "w-6 h-6",
                variant === 'dark-fixed' ? "text-white" : "text-neutral-700"
              )}
            />
          </button>
        )}
        <div
          className={cn(
            "pl-3 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide",
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
          <div className="Pageactions inline-flex justify-start items-center">
            {showSearch && (
              <button
                className={cn(
                  "w-11 h-11 flex items-center justify-center",
                  variant === 'dark-fixed'
                    ? "border-l border-neutral-600"
                    : "border-l border-neutral-300"
                )}
                onClick={() => setSearchActive(true)}
                aria-label="Open search"
              >
                <Search
                  className={cn(
                    "w-6 h-6",
                    variant === 'dark-fixed' ? "text-white" : "text-neutral-700"
                  )}
                />
              </button>
            )}
            {showShare && (
              <button
                className={cn(
                  "w-11 h-11 flex items-center justify-center",
                  variant === 'dark-fixed'
                    ? "border-l border-neutral-600"
                    : "border-l border-neutral-300"
                )}
                onClick={onShare}
                aria-label="Share"
              >
                <Share2
                  className={cn(
                    "w-6 h-6",
                    variant === 'dark-fixed' ? "text-white" : "text-neutral-700"
                  )}
                />
              </button>
            )}
            {showSettings && (
              <button
                className={cn(
                  "w-11 h-11 flex items-center justify-center",
                  variant === 'dark-fixed'
                    ? "border-l border-neutral-600"
                    : "border-l border-neutral-300"
                )}
                onClick={onSettings}
                aria-label="Settings"
              >
                <Settings2
                  className={cn(
                    "w-6 h-6",
                    variant === 'dark-fixed' ? "text-white" : "text-neutral-700"
                  )}
                />
              </button>
            )}
            {showAdd && (
              <button
                className={cn(
                  "w-11 h-11 flex items-center justify-center",
                  variant === 'dark-fixed'
                    ? "border-l border-neutral-600"
                    : "border-l border-neutral-300"
                )}
                onClick={onAdd}
                aria-label="Add"
              >
                <Plus
                  className={cn(
                    "w-6 h-6",
                    variant === 'dark-fixed' ? "text-white" : "text-neutral-700"
                  )}
                />
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
