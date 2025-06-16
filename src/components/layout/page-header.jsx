// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=114-1276&t=9pgcPuKv7UdpdreN-4

import PropTypes from "prop-types";
import React, { useState, useRef, forwardRef } from "react";
import { ArrowLeft, Pencil, Plus, Search, X } from 'lucide-react';
import SearchField from "@/components/molecules/search-field";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

// Add this before the component definition
const headerResponsiveStyle = `
  @media (max-width: 767px) {
    .page-header-fixed {
      left: 0 !important;
    }
  }
`;

export const PageHeader = forwardRef(({
  showActionBar = false,
  pageNameEditable = false,
  showBackButton = false,
  appHeaderTitle = "Welcome to Swiper.fit!",
  actionBarText = "",
  search = false,
  onBack,
  onAction,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  className,
  sidebarWidth = 256,
  pageContext = "default",
  ...props
}, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef(null);

  const onBackHandler = () => {
    if (onBack) {
      onBack();
    } else if (location.state?.from) {
      navigate(location.state.from);
    } else {
      navigate(-1);
    }
  };

  // When searchActive becomes true, focus the input
  React.useEffect(() => {
    if (searchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchActive]);

  // Hide search if blurred and empty
  const handleSearchBlur = (e) => {
    // Timeout to allow click on clear button
    setTimeout(() => {
      if (!searchValue) setSearchActive(false);
    }, 100);
  };

  // Generate dynamic search placeholder based on page context
  const getSearchPlaceholder = () => {
    if (searchPlaceholder) return searchPlaceholder;
    
    switch (pageContext) {
      case "programs":
        return "Search programs";
      case "history":
        return "Search workouts";
      case "workout":
        return "Search programs";
      case "workoutDetail":
        return "Search exercises";
      case "programBuilder":
        return "Search exercises";
      default:
        return `Search ${appHeaderTitle.toLowerCase()}`;
    }
  };

  const handleClearSearch = () => {
    onSearchChange("");
    setSearchActive(false);
  };

  return (
    <>
      <style>{headerResponsiveStyle}</style>
      <div
        ref={ref}
        className={cn("fixed top-0 right-0 z-50 bg-stone-200 border-b border-neutral-100 page-header-fixed", className)}
        style={{ left: sidebarWidth }}
        {...props}
      >
        <div className="px-5 py-3 flex justify-start items-center gap-2">
          {showBackButton && (
            <button
              className="size-7 flex items-center justify-center text-stone-600 hover:text-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={onBackHandler}
              aria-label="Back"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <div className="flex-1 h-10 flex justify-between items-center">
            <div className="flex-1 flex justify-start items-center gap-2">
              <div className="flex-1 flex flex-col justify-start items-start gap-1">
                <div className="flex justify-start items-center gap-2">
                  {/* Hide title on mobile if search is active */}
                  <h1 className={cn(
                    "text-stone-600 text-xl font-bold font-['Space_Grotesk'] leading-loose",
                    searchActive ? "hidden sm:block" : ""
                  )}>
                    {appHeaderTitle}
                  </h1>
                  {pageNameEditable && !searchActive && (
                    <button
                      className="size-4 flex items-center justify-center text-stone-600 opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Edit"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end items-center gap-3">
              {search && (
                <>
                  {/* Only show magnifying glass if search is not active */}
                  {!searchActive && (
                    <button
                      className="size-8 flex items-center justify-center text-stone-600 hover:text-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Open search"
                      onClick={() => setSearchActive(true)}
                    >
                      <Search className="size-6" />
                    </button>
                  )}
                  {/* Show search input and clear when active */}
                  {searchActive && (
                    <div className="flex items-center gap-2">
                      <div className="relative w-96">
                        <SearchField
                          ref={searchInputRef}
                          value={searchValue}
                          onChange={(e) => onSearchChange(e.target.value)}
                          onBlur={handleSearchBlur}
                          placeholder={getSearchPlaceholder()}
                          className="w-full h-14 px-4 py-2 bg-white rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-300 text-slate-500 text-base font-normal font-['Space_Grotesk'] leading-normal focus:outline-none focus:ring-2 focus:ring-neutral-300"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300">
                          <Search className="size-4" />
                        </span>
                      </div>
                      <button
                        className="size-8 flex items-center justify-center text-stone-600 hover:text-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={handleClearSearch}
                        aria-label="Clear search and exit"
                      >
                        <X className="size-7" />
                      </button>
                    </div>
                  )}
                </>
              )}
              {/* Only show action bar button if not searching */}
              {showActionBar && (!searchActive) && (
                <button
                  className="size-8 flex items-center justify-center text-stone-600 hover:text-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={onAction}
                  aria-label="Add"
                >
                  <Plus className="size-7" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

PageHeader.propTypes = {
  showActionBar: PropTypes.bool,
  pageNameEditable: PropTypes.bool,
  showBackButton: PropTypes.bool,
  appHeaderTitle: PropTypes.string,
  actionBarText: PropTypes.string,
  search: PropTypes.bool,
  onBack: PropTypes.func,
  onAction: PropTypes.func,
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  className: PropTypes.string,
  sidebarWidth: PropTypes.number,
  pageContext: PropTypes.oneOf(["default", "programs", "history", "workout", "workoutDetail", "programBuilder"]),
};

export default PageHeader; 