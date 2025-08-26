// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=114-1276&t=9pgcPuKv7UdpdreN-4

import PropTypes from "prop-types";
import React, { useState, useRef, useEffect, forwardRef } from "react";
import { ArrowLeft, Search, Settings2, Plus, Share2, X, Play, PenLine, Blend } from "lucide-react";
import { cn } from "@/lib/utils";
import { TextInput } from "@/components/molecules/text-input";

const PageHeader = forwardRef(({ 
  reserveSpace = false,
  variant = 'default',
  showBackButton = false,
  title = "Page",
  titleRightText,
  showSearch = false,
  showSettings = false,
  showPlusButton = false,
  showShare = false,
  showStartWorkout = false,
  startCtaText,
  showSidebar = false,
  onBack,
  onSearch,
  onSettings,
  onAdd,
  onShare,
  onStartWorkout,
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

  // Programs variant (routine builder) – two-row header
  if (variant === 'programs') {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed top-0 z-50 self-stretch bg-white inline-flex flex-col justify-start items-start",
          showSidebar ? "left-0 w-full md:left-64 md:w-[calc(100%-16rem)]" : "left-0 w-full",
          className
        )}
      >
        {/* Row 1 */}
        <div className="self-stretch inline-flex justify-between items-stretch">
          <div className="flex-1 flex justify-start items-center">
            {showBackButton ? (
              <button
                onClick={onBack}
                aria-label="Back"
                className="p-2.5 border-r border-neutral-300 flex justify-start items-center"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-700" />
              </button>
            ) : null}
            {showSettings ? (
              <button
                onClick={onSettings}
                aria-label="Edit routine"
                className="self-stretch h-11 px-3 flex items-center gap-2 cursor-pointer flex-1 justify-between"
              >
                <div className="flex-1 text-neutral-700 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide text-left">{title}</div>
                <PenLine className="w-5 h-5 text-neutral-700" />
              </button>
            ) : (
              <div className="self-stretch h-11 px-3 flex items-center gap-2 flex-1">
                <div className="flex-1 text-neutral-700 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide text-left">{title}</div>
                {titleRightText && (
                  <div className="text-neutral-700 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">{titleRightText}</div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-start items-center">
            {showShare && (
              <button
                onClick={onShare}
                aria-label="Share"
                className="self-stretch p-2.5 bg-neutral-950 flex justify-start items-center gap-2"
              >
                <Blend className="w-5 h-5 text-white" />
                <span className="justify-center text-white text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">Share routine</span>
              </button>
            )}
          </div>
        </div>
        {/* Row 2 */}
        {showStartWorkout && (
          <div
            className="self-stretch h-9 pr-3 bg-green-600 inline-flex justify-start items-center cursor-pointer"
            onClick={onStartWorkout}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStartWorkout?.(); } }}
            aria-label="Tap to start workout"
          >
            <div className="self-stretch p-2.5 flex justify-start items-center">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="justify-center text-white text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight">{startCtaText || 'Tap to start workout'}</div>
          </div>
        )}
      </div>
    );
  }

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
        (showSearch || showSettings || showPlusButton || showShare || showStartWorkout) && (
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
            {showStartWorkout && (
              <div 
                className="pr-3 bg-green-600 flex items-center cursor-pointer"
                onClick={onStartWorkout}
                aria-label="Start Workout"
              >
                <div
                  className={cn(
                    "w-11 h-11 flex items-center justify-center",
                    variant === 'dark-fixed'
                      ? "border-l border-neutral-600"
                      : "border-l border-neutral-300"
                  )}
                >
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
                <div className="text-white text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
                  start workout
                </div>
              </div>
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
  showStartWorkout: PropTypes.bool,
  showSidebar: PropTypes.bool,
  onBack: PropTypes.func,
  onSearch: PropTypes.func,
  onSettings: PropTypes.func,
  onAdd: PropTypes.func,
  onShare: PropTypes.func,
  onStartWorkout: PropTypes.func,
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  className: PropTypes.string,
};

PageHeader.displayName = "PageHeader";

export default PageHeader;
