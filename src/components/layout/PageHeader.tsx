// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=114-1276&t=9pgcPuKv7UdpdreN-4

import React, { useState, useRef, useEffect, forwardRef } from "react";
import { ArrowLeft, Search, Settings2, Plus, Share, Share2, X, Play, PenLine, Blend, Upload, Trash2, Cog } from "lucide-react";
import { cn } from "@/lib/utils";
import { TextInput } from "@/components/shared/inputs/TextInput";

interface PageHeaderProps {
  reserveSpace?: boolean;
  variant?: 'default' | 'dark-fixed' | 'programs';
  showBackButton?: boolean;
  title?: string;
  titleRightText?: string;
  showSearch?: boolean;
  showSettings?: boolean;
  showPlusButton?: boolean;
  showShare?: boolean;
  showStartWorkout?: boolean;
  showStartWorkoutIcon?: boolean;
  startCtaText?: string;
  showSidebar?: boolean;
  showUpload?: boolean;
  showDelete?: boolean;
  sharingSection?: React.ReactNode;
  sharingNavAbove?: boolean;
  sharingNavContent?: React.ReactNode;
  onBack?: () => void;
  onSearch?: () => void;
  onSettings?: () => void;
  onAdd?: () => void;
  onShare?: () => void;
  onStartWorkout?: () => void;
  onStartWorkoutIcon?: () => void;
  onUpload?: () => void;
  onDelete?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
  showDeleteOption?: boolean;
}

const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(({ 
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
  showStartWorkoutIcon = false,
  startCtaText,
  showSidebar = false,
  showUpload = false,
  showDelete = false,
  sharingSection,
  sharingNavAbove = false,
  sharingNavContent,
  onBack,
  onSearch,
  onSettings,
  onAdd,
  onShare,
  onStartWorkout,
  onStartWorkoutIcon,
  onUpload,
  onDelete,
  searchValue,
  onSearchChange,
  className,
  showDeleteOption = false,
}, ref) => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState(searchValue || "");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync external searchValue with internal state
  useEffect(() => {
    if (searchValue !== undefined) {
      setSearchInputValue(searchValue);
    }
  }, [searchValue]);

  // Focus search input when search becomes active
  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);

  const handleSearchToggle = () => {
    setIsSearchActive(!isSearchActive);
    if (!isSearchActive) {
      onSearch?.();
    } else {
      setSearchInputValue("");
      onSearchChange?.("");
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchInputValue(value);
    onSearchChange?.(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsSearchActive(false);
      setSearchInputValue("");
      onSearchChange?.("");
    }
  };

  // Determine header classes based on variant
  const getHeaderClasses = () => {
    const baseClasses = "w-full";
    
    switch (variant) {
      case 'dark-fixed':
        return cn(baseClasses, "bg-neutral-900 text-white fixed top-0 z-50", showSidebar ? "left-0 right-0 md:left-64 md:right-0" : "left-0 right-0");
      case 'programs':
        return cn(baseClasses, "bg-white border-b border-neutral-200");
      default:
        return cn(
          baseClasses,
          // Default variant - glass styling
          "fixed top-0 z-[200] h-11 pt-5 bg-gradient-to-t from-transparent to-stone-100 inline-flex justify-between items-center",
          showSidebar ? "left-0 w-full md:left-64 md:w-[calc(100%-16rem)]" : "left-0 w-full"
        );
    }
  };

  // Determine if header should be fixed
  const isFixed = variant === 'dark-fixed' || variant === 'default';
  const shouldReserveSpace = reserveSpace && isFixed;

  return (
    <>
      {shouldReserveSpace && <div className="h-16" />}
      <div ref={ref} className={cn(getHeaderClasses(), className)} style={{ overflow: 'visible' }}>
        <div className="flex items-center justify-between px-4 h-11 w-full overflow-visible">
          {/* Left side */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {showBackButton && (
              <button
                onClick={onBack}
                className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            
            {isSearchActive ? (
              <div className="flex-1 max-w-md">
                <TextInput
                  ref={searchInputRef}
                  value={searchInputValue}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Search..."
                  className="w-full"
                />
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold truncate">{title}</h1>
                {titleRightText && (
                  <span className="text-sm text-neutral-500 ml-2">{titleRightText}</span>
                )}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {sharingSection || sharingNavContent}
            
            {!(sharingSection || sharingNavContent) && (showSearch || showSettings || showPlusButton || showShare || showUpload || showDelete || showStartWorkoutIcon) && (
              <div className="p-2 bg-white/80 rounded-3xl shadow-[0px_0px_8px_0px_rgba(212,212,212,1.00)] backdrop-blur-[1px] flex justify-center items-center gap-2">
                {showSearch && !isSearchActive && (
                  <button
                    onClick={handleSearchToggle}
                    className="h-10 min-w-10 py-3 bg-blue-500 rounded-[20px] flex justify-center items-center gap-1"
                    aria-label="Search"
                  >
                    <Search className="w-6 h-6 text-white" />
                  </button>
                )}
                
                {isSearchActive && (
                  <button
                    onClick={handleSearchToggle}
                    className="h-10 min-w-10 py-3 bg-neutral-700 rounded-[20px] flex justify-center items-center gap-1"
                    aria-label="Close search"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                )}

                {showSettings && (
                  <button
                    onClick={onSettings}
                    className="h-10 min-w-10 py-3 bg-neutral-700 rounded-[20px] flex justify-center items-center gap-1"
                    aria-label="Settings"
                  >
                    <Cog className="w-6 h-6 text-white" />
                  </button>
                )}

                {showPlusButton && (
                  <button
                    onClick={onAdd}
                    className="h-10 min-w-10 py-3 bg-green-600 rounded-[20px] flex justify-center items-center gap-1"
                    aria-label="Add"
                  >
                    <Plus className="w-6 h-6 text-white" />
                  </button>
                )}

                {showShare && (
                  <button
                    onClick={onShare}
                    className="h-10 min-w-10 py-3 bg-blue-500 rounded-[20px] flex justify-center items-center gap-1"
                    aria-label="Share"
                  >
                    <Share className="w-6 h-6 text-white" />
                  </button>
                )}

                {showStartWorkoutIcon && (
                  <button
                    onClick={onStartWorkoutIcon}
                    className="h-10 min-w-10 py-3 bg-green-600 rounded-[20px] flex justify-center items-center gap-1"
                    aria-label="Start Workout"
                  >
                    <Play className="w-6 h-6 text-white" />
                  </button>
                )}

                {showUpload && (
                  <button
                    onClick={onUpload}
                    className="h-10 min-w-10 py-3 bg-neutral-700 rounded-[20px] flex justify-center items-center gap-1"
                    aria-label="Upload"
                  >
                    <Upload className="w-6 h-6 text-white" />
                  </button>
                )}

                {showDelete && (
                  <button
                    onClick={onDelete}
                    className="h-10 min-w-10 py-3 bg-red-500 rounded-[20px] flex justify-center items-center gap-1"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-6 h-6 text-white" />
                  </button>
                )}
              </div>
            )}

            {!(sharingSection || sharingNavContent) && showStartWorkout && (
              <button
                onClick={onStartWorkout}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                {showStartWorkoutIcon && <Play className="w-4 h-4" />}
                {startCtaText || "Start Workout"}
              </button>
            )}
          </div>
        </div>

      </div>
    </>
  );
});

PageHeader.displayName = "PageHeader";

export default PageHeader;