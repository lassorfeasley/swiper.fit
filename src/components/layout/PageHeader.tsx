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
  hasBannerAbove?: boolean;
  bannerContent?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>;
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
  hasBannerAbove = false,
  bannerContent,
  breadcrumbs,
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
    const hasBanner = hasBannerAbove && bannerContent;
    
    switch (variant) {
      case 'dark-fixed':
        return cn(
          baseClasses, 
          "bg-neutral-900 text-white fixed z-50",
          hasBanner ? "flex-col" : "",
          "top-0",
          showSidebar ? "left-0 right-0 md:left-64 md:right-0" : "left-0 right-0"
        );
      case 'programs':
        return cn(baseClasses, "bg-white border-b border-neutral-200", hasBanner ? "flex-col" : "");
      default:
        return cn(
          baseClasses,
          // Default variant - glass styling
          "fixed z-[200]",
          hasBanner ? "flex-col" : "h-11 pt-5 inline-flex justify-between items-center bg-gradient-to-t from-transparent to-stone-100",
          !hasBanner && "bg-gradient-to-t from-transparent to-stone-100",
          "top-0",
          showSidebar ? "left-0 w-full md:left-64 md:w-[calc(100%-16rem)]" : "left-0 w-full"
        );
    }
  };

  // Determine if header should be fixed
  const isFixed = variant === 'dark-fixed' || variant === 'default';
  const shouldReserveSpace = reserveSpace && isFixed;
  const hasBanner = hasBannerAbove && bannerContent;
  const bannerHeight = hasBanner ? 60 : 0; // Approximate banner height

  return (
    <>
      {shouldReserveSpace && (
        <>
          {hasBanner && <div style={{ height: `${bannerHeight}px` }} />}
          <div className={hasBanner ? "h-16" : "h-16"} />
        </>
      )}
      <div ref={ref} data-layer="page-header" className={cn(getHeaderClasses(), "inline-flex", className)} style={{ overflow: 'visible' }}>
        {/* Banner content - first child when present */}
        {hasBanner && (
          <div data-layer="Frame 5011" className="Frame5011 self-stretch">
            {bannerContent}
          </div>
        )}
        
        {/* Main nav content */}
        <div data-layer="main-nav" className={cn(
          "self-stretch flex items-center justify-between w-full overflow-visible",
          hasBanner ? "px-4 pt-4 pb-3 bg-gradient-to-b from-stone-100 to-transparent" : "px-4 h-11"
        )}>
          {/* Left side */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {showBackButton && (
              <button
                onClick={onBack}
                className="p-2 -ml-2 rounded-lg hover:bg-stone-100 transition-colors"
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
            ) : breadcrumbs && breadcrumbs.length > 0 ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <span className="text-neutral-neutral-500 text-lg font-semibold">→</span>
                    )}
                    {crumb.onClick ? (
                      <button
                        onClick={crumb.onClick}
                        className="text-neutral-neutral-700 hover:text-neutral-neutral-900 hover:underline text-lg font-semibold truncate transition-colors"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="text-neutral-neutral-700 text-lg font-semibold truncate">
                        {crumb.label}
                      </span>
                    )}
                  </React.Fragment>
                ))}
                {titleRightText && (
                  <span className="text-sm text-neutral-500 ml-2">{titleRightText}</span>
                )}
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
            {sharingSection}
            
            {!sharingSection && (showSearch || showSettings || showPlusButton || showShare || showUpload || showDelete || showStartWorkoutIcon) && (
              <div data-layer="action-icons" className="ActionIcons max-w-fit p-2 bg-white/80 rounded-full shadow-[0px_0px_8px_0px_rgba(212,212,212,1.00)] backdrop-blur-[1px] inline-flex justify-center items-center">
                {showSearch && !isSearchActive && (
                  <button
                    onClick={handleSearchToggle}
                    className="ActionPill h-10 min-w-10 py-3 bg-white/0 rounded-[20px] flex justify-center items-center gap-1"
                    aria-label="Search"
                  >
                    <div data-layer="lucide-icon" data-icon="search" className="LucideIcon size-6 relative overflow-hidden">
                      <Search className="w-5 h-5 text-neutral-950" />
                    </div>
                  </button>
                )}
                
                {isSearchActive && (
                  <button
                    onClick={handleSearchToggle}
                    className="ActionPill h-10 min-w-10 py-3 bg-white/0 rounded-[20px] flex justify-center items-center gap-1"
                    aria-label="Close search"
                  >
                    <div data-layer="lucide-icon" data-icon="x" className="LucideIcon size-6 relative overflow-hidden">
                      <X className="w-5 h-5 text-neutral-950" />
                    </div>
                  </button>
                )}

                {showSettings && (
                  <button
                    onClick={onSettings}
                    className="ActionPill h-10 min-w-10 py-3 bg-white/0 rounded-[20px] flex justify-center items-center gap-1"
                    aria-label="Settings"
                  >
                    <div data-layer="lucide-icon" data-icon="cog" className="LucideIcon size-6 relative overflow-hidden">
                      <Cog className="w-5 h-5 text-neutral-700" />
                    </div>
                  </button>
                )}

                {showPlusButton && (
                  <button
                    onClick={onAdd}
                    className="ActionPill h-10 min-w-10 py-3 bg-white/0 rounded-[20px] flex justify-center items-center gap-1"
                    aria-label="Add"
                  >
                    <div data-layer="lucide-icon" className="LucideIcon size-6 relative overflow-hidden">
                      <Plus className="w-5 h-5 text-neutral-950" />
                    </div>
                  </button>
                )}

                {showShare && (
                  <button
                    onClick={onShare}
                    className="ActionPill h-10 min-w-10 py-3 bg-white/0 rounded-[20px] flex justify-center items-center gap-1"
                    aria-label="Share"
                  >
                    <div data-layer="lucide-icon" data-icon="share" className="LucideIcon size-6 relative overflow-hidden">
                      <Share className="w-5 h-5 text-neutral-950" />
                    </div>
                  </button>
                )}

                {showStartWorkoutIcon && (
                  <button
                    onClick={onStartWorkoutIcon}
                    className="ActionPill h-10 min-w-10 py-3 bg-white/0 rounded-[20px] flex justify-center items-center gap-1"
                    aria-label="Start Workout"
                  >
                    <div data-layer="lucide-icon" data-icon="Play" className="LucideIcon size-6 relative overflow-hidden">
                      <Play className="w-5 h-5 text-neutral-950" />
                    </div>
                  </button>
                )}

                {showUpload && (
                  <button
                    onClick={onUpload}
                    className="ActionPill h-10 min-w-10 py-3 bg-white/0 rounded-[20px] flex justify-center items-center gap-1"
                    aria-label="Upload"
                  >
                    <div data-layer="lucide-icon" className="LucideIcon size-6 relative overflow-hidden">
                      <Upload className="w-5 h-5 text-neutral-950" />
                    </div>
                  </button>
                )}

                {showDelete && (
                  <button
                    onClick={onDelete}
                    className="ActionPill h-10 min-w-10 py-3 bg-white/0 rounded-[20px] flex justify-center items-center gap-1"
                    aria-label="Delete"
                  >
                    <div data-layer="lucide-icon" data-icon="trash-2" className="LucideIcon size-6 relative overflow-hidden">
                      <Trash2 className="w-5 h-5 text-neutral-950" />
                    </div>
                  </button>
                )}
              </div>
            )}

            {!sharingSection && showStartWorkout && (
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