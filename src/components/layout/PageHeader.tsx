// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=114-1276&t=9pgcPuKv7UdpdreN-4

import React, { useState, useRef, useEffect, forwardRef } from "react";
import { ArrowLeft, Search, Settings2, Plus, Share, Share2, X, Play, PenLine, Blend, Upload, Trash2, Cog } from "lucide-react";
import { cn } from "@/lib/utils";
import { TextInput } from "@/components/shared/inputs/TextInput";

interface PageHeaderProps {
  reserveSpace?: boolean;
  variant?: 'default' | 'dark-fixed' | 'programs' | 'glass';
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
        return cn(baseClasses, "bg-neutral-900 text-white fixed top-0 left-0 z-50");
      case 'programs':
        return cn(baseClasses, "bg-white border-b border-neutral-200");
      case 'glass':
        return cn(baseClasses, "bg-white/80 backdrop-blur-sm border-b border-neutral-200/50");
      default:
        return cn(baseClasses, "bg-white border-b border-neutral-200");
    }
  };

  // Determine if header should be fixed
  const isFixed = variant === 'dark-fixed';
  const shouldReserveSpace = reserveSpace && isFixed;

  return (
    <>
      {shouldReserveSpace && <div className="h-16" />}
      <div ref={ref} className={cn(getHeaderClasses(), className)}>
        <div className="flex items-center justify-between px-4 py-3 h-16">
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
          <div className="flex items-center gap-2">
            {showSearch && !isSearchActive && (
              <button
                onClick={handleSearchToggle}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
            
            {isSearchActive && (
              <button
                onClick={handleSearchToggle}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {showSettings && (
              <button
                onClick={onSettings}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                aria-label="Settings"
              >
                <Settings2 className="w-5 h-5" />
              </button>
            )}

            {showPlusButton && (
              <button
                onClick={onAdd}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                aria-label="Add"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}

            {showShare && (
              <button
                onClick={onShare}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                aria-label="Share"
              >
                <Share className="w-5 h-5" />
              </button>
            )}

            {showStartWorkout && (
              <button
                onClick={onStartWorkout}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                {showStartWorkoutIcon && <Play className="w-4 h-4" />}
                {startCtaText || "Start Workout"}
              </button>
            )}

            {showUpload && (
              <button
                onClick={onUpload}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                aria-label="Upload"
              >
                <Upload className="w-5 h-5" />
              </button>
            )}

            {showDelete && (
              <button
                onClick={onDelete}
                className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                aria-label="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Sharing section */}
        {sharingSection && (
          <div className={cn(
            "border-t border-neutral-200",
            sharingNavAbove ? "order-first" : ""
          )}>
            {sharingNavContent || sharingSection}
          </div>
        )}
      </div>
    </>
  );
});

PageHeader.displayName = "PageHeader";

export default PageHeader;
