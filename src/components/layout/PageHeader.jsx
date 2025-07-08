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
  showPlusButton = false,
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
      data-show-plus-button={showPlusButton}
      className={cn(
        variant === 'dark-fixed'
          ? "fixed top-0 z-50 self-stretch h-11 bg-neutral-700 border-b border-neutral-600 inline-flex justify-between items-center"
          : searchActive
            ? "fixed top-0 z-50 self-stretch h-11 bg-white backdrop-blur-xs border-b border-neutral-300 inline-flex justify-between items-center"
            : "fixed top-0 z-50 self-stretch h-11 bg-white border-b border-neutral-300 inline-flex justify-between items-center",
        showSidebar
          ? "left-0 w-full md:left-64 md:w-[calc(100%-16rem)]"
          : "left-0 w-full",
        className
      )}
    >
      <div className="flex justify-start items-center">
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
        <div className="Pageactions inline-flex justify-start items-center">
          <div className="w-96 h-11 max-w-96 min-w-64 inline-flex flex-col justify-center items-start gap-2">
            <div className="self-stretch pl-3 bg-white outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-center items-center gap-2.5">
              <TextInput
                ref={searchInputRef}
                customPlaceholder="Search"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                icon={<Search className="size-4 text-neutral-300" />}
                className="w-full"
              />
            </div>
          </div>
          <button
            className="w-11 h-11 flex items-center justify-center border-l border-neutral-300"
            onClick={() => {
              onSearchChange("");
              setSearchActive(false);
            }}
            aria-label="Clear search"
          >
            <X
              className={cn(
                "w-6 h-6",
                variant === 'dark-fixed' ? 'text-white' : 'text-neutral-700'
              )}
            />
          </button>
        </div>
      ) : (
        (showSearch || showSettings || showPlusButton || showShare) && (
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
            {showPlusButton && (
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
  showPlusButton: PropTypes.bool,
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
