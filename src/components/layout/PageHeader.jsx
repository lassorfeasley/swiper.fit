// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=114-1276&t=9pgcPuKv7UdpdreN-4

import PropTypes from "prop-types";
import React from "react";
import { ArrowLeft, Pencil, Plus, Search } from 'lucide-react';
import SearchField from "@/components/molecules/search-field";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export const PageHeader = ({
  showActionBar = true,
  showActionIcon = true,
  showBackButton = true,
  appHeaderTitle = "Example app header title",
  actionBarText = "Example action bar text",
  search = true,
  subhead = true,
  subheadText = "example subhead text",
  onBack,
  onAction,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  className,
  ...props
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const onBackHandler = () => {
    if (onBack) {
      onBack();
    } else if (location.state?.from) {
      navigate(location.state.from);
    } else {
      navigate(-1);
    }
  };

  return (
    <div 
      className={cn(
        "w-full self-stretch border-b border-slate-200 bg-white",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-2 px-5 pt-10 pb-5 bg-stone-50 border-b border-slate-200">
        {showBackButton && (
          <button
            className="w-6 h-6 flex items-center justify-center text-zinc-700 hover:text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onBackHandler}
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <div className="flex items-center justify-between gap-4">
          <h1 className="flex-1 text-xl font-medium text-slate-600 font-['Space_Grotesk'] leading-normal">
            {appHeaderTitle}
          </h1>
          {showActionIcon && (
            <button
              className="w-6 h-6 flex items-center justify-center text-zinc-700 hover:text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Edit"
            >
              <Pencil className="w-6 h-6" />
            </button>
          )}
        </div>
        {subhead && (
          <p className="text-base font-normal text-slate-600 font-['Space_Grotesk'] leading-none">
            {subheadText}
          </p>
        )}
      </div>
      {showActionBar && (
        <button
          className="w-full h-12 px-5 py-3 bg-slate-600 flex items-center justify-between gap-3 text-stone-50 hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onAction}
          aria-label="Action bar"
        >
          <span className="flex-1 text-base font-normal font-['Space_Grotesk'] leading-none text-left">
            {actionBarText}
          </span>
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}
      {search && (
        <div className="flex items-center gap-2.5 px-5 py-2.5 bg-white border-b border-slate-200">
          <SearchField
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder || "Search..."}
            className="flex-1"
          />
          <Search className="w-6 h-6 text-slate-600" />
        </div>
      )}
    </div>
  );
};

PageHeader.propTypes = {
  showActionBar: PropTypes.bool,
  showActionIcon: PropTypes.bool,
  showBackButton: PropTypes.bool,
  appHeaderTitle: PropTypes.string,
  actionBarText: PropTypes.string,
  search: PropTypes.bool,
  subhead: PropTypes.bool,
  subheadText: PropTypes.string,
  onBack: PropTypes.func,
  onAction: PropTypes.func,
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  className: PropTypes.string,
};

export default PageHeader; 