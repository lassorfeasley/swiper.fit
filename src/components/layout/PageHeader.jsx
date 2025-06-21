// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=114-1276&t=9pgcPuKv7UdpdreN-4

import PropTypes from "prop-types";
import React, { useState, useRef, forwardRef, useEffect } from "react";
import { ArrowLeft, Plus, Search, X, Settings2, Trash2 } from "lucide-react";
import SearchField from "@/components/molecules/search-field";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { TextInput } from "@/components/molecules/text-input";
import { SwiperButton } from "@/components/molecules/swiper-button";
import DrawerManager from "../organisms/drawer-manager";

// Add this before the component definition
const headerResponsiveStyle = `
  @media (max-width: 767px) {
    .page-header-fixed {
      left: 0 !important;
    }
  }
`;

export const PageHeader = forwardRef(
  (
    {
      showAddButton = false,
      addButtonText = "Add",
      pageNameEditable = false,
      showBackButton = false,
      appHeaderTitle = "Welcome to Swiper.fit!",
      actionBarText = "",
      search = false,
      onBack,
      onAction,
      onTitleChange,
      onDelete,
      showDeleteOption = false,
      searchValue,
      onSearchChange,
      searchPlaceholder,
      className,
      sidebarWidth = 256,
      pageContext = "default",
      ...props
    },
    ref
  ) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchActive, setSearchActive] = useState(false);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [editingTitle, setEditingTitle] = useState(appHeaderTitle || "");
    const searchInputRef = useRef(null);

    // Update editing title when appHeaderTitle changes
    useEffect(() => {
      setEditingTitle(appHeaderTitle || "");
    }, [appHeaderTitle]);

    const onBackHandler = () => {
      if (onBack) {
        onBack();
      } else if (location.state?.from) {
        navigate(location.state.from);
      } else {
        navigate(-1);
      }
    };

    const handleTitleSave = () => {
      if (
        onTitleChange &&
        (editingTitle || "").trim() !== (appHeaderTitle || "")
      ) {
        onTitleChange(editingTitle.trim());
      }
      setIsEditSheetOpen(false);
    };

    const handleDelete = () => {
      if (onDelete) {
        onDelete();
      }
      setIsEditSheetOpen(false);
    };

    // When searchActive becomes true, focus the input
    React.useEffect(() => {
      if (searchActive && searchInputRef.current) {
        // Small delay to ensure the input is fully rendered
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 10);
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

    const title = `Edit ${
      pageContext === "programs"
        ? "Program"
        : pageContext === "workout"
        ? "Workout"
        : "Page"
    }`;

    return (
      <>
        <style>{headerResponsiveStyle}</style>
        <div
          ref={ref}
          className={cn(
            "fixed top-0 right-0 z-50 bg-stone-200 border-b border-neutral-100 page-header-fixed",
            className
          )}
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
                <ArrowLeft className="size-6" />
              </button>
            )}
            <div className="flex-1 h-10 flex justify-between items-center">
              <div className="flex-1 flex justify-start items-center gap-2">
                <div className="flex-1 flex flex-col justify-start items-start gap-1">
                  <div className="flex justify-start items-center gap-2">
                    {/* Hide title on mobile if search is active */}
                    <h1
                      className={cn(
                        "text-stone-600 text-heading-md",
                        searchActive ? "hidden sm:block" : ""
                      )}
                    >
                      {appHeaderTitle}
                    </h1>
                    {pageNameEditable && !searchActive && (
                      <button
                        className="size-7 flex items-center justify-center text-stone-600 opacity-70 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Edit"
                        onClick={() => setIsEditSheetOpen(true)}
                      >
                        <Settings2 className="size-6" />
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
                            className="w-full h-14 px-4 py-2 bg-white rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-300 text-slate-500 text-base font-normal leading-normal focus:outline-none focus:ring-2 focus:ring-neutral-300"
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
                {showAddButton && !searchActive && (
                  <button
                    className="pl-2 pr-3 py-1 rounded-[40px] outline outline-1 outline-offset-[-1px] outline-stone-600 inline-flex justify-start items-center gap-1 text-stone-600 hover:text-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={onAction}
                    aria-label="Add"
                  >
                    <div className="size-7 relative overflow-hidden">
                      <Plus className="size-6 left-[2px] top-[2px] absolute" />
                    </div>
                    <div className="justify-start text-stone-600 text-xs font-medium leading-none">
                      {addButtonText}
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Title Sheet */}
        <DrawerManager open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <TextInput
                id="pageTitle"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                customPlaceholder="Enter page name"
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-3">
              <SwiperButton
                onClick={handleTitleSave}
                className="w-full"
                disabled={
                  !(editingTitle || "").trim() ||
                  (editingTitle || "").trim() === (appHeaderTitle || "")
                }
              >
                Save Changes
              </SwiperButton>
              {showDeleteOption && onDelete && (
                <SwiperButton
                  variant="destructive"
                  onClick={handleDelete}
                  className="w-full"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete{" "}
                  {pageContext === "programs"
                    ? "Program"
                    : pageContext === "workout"
                    ? "Workout"
                    : ""}
                </SwiperButton>
              )}
            </div>
          </div>
        </DrawerManager>
      </>
    );
  }
);

PageHeader.propTypes = {
  showAddButton: PropTypes.bool,
  addButtonText: PropTypes.string,
  pageNameEditable: PropTypes.bool,
  showBackButton: PropTypes.bool,
  appHeaderTitle: PropTypes.string,
  actionBarText: PropTypes.string,
  search: PropTypes.bool,
  onBack: PropTypes.func,
  onAction: PropTypes.func,
  onTitleChange: PropTypes.func,
  onDelete: PropTypes.func,
  showDeleteOption: PropTypes.bool,
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  className: PropTypes.string,
  sidebarWidth: PropTypes.number,
  pageContext: PropTypes.oneOf([
    "default",
    "programs",
    "history",
    "workout",
    "workoutDetail",
    "programBuilder",
  ]),
};

export default PageHeader;
