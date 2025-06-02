// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=114-1276&t=9pgcPuKv7UdpdreN-4

import PropTypes from "prop-types";
import React from "react";
import { ArrowLeftIcon, PencilSquareIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import SearchField from "../common/forms/SearchField";
import { useNavigate, useLocation } from "react-router-dom";

export const AppHeader = ({
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
  searchValue: controlledSearchValue,
  onSearchChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // For demo: search state
  const [searchValue, setSearchValue] = React.useState("");
  const isControlled = controlledSearchValue !== undefined && onSearchChange;
  const value = isControlled ? controlledSearchValue : searchValue;
  const handleChange = e => {
    if (isControlled) {
      onSearchChange(e.target.value);
    } else {
      setSearchValue(e.target.value);
    }
  };

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
    <div className="Appheader self-stretch border-b border-slate-600 inline-flex flex-col justify-start items-start">
      <div className="Pagelabelwrapper self-stretch px-5 pt-10 pb-5 bg-stone-50 border-b-[0.5px] border-slate-600 flex flex-col justify-start items-start gap-2">
        {showBackButton && (
          <div
            className="ArrowNarrowLeft w-5 h-5 relative overflow-hidden cursor-pointer flex items-center justify-center"
            onClick={onBackHandler}
            role="button"
            tabIndex={0}
            aria-label="Back"
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onBackHandler(); }}
          >
            <ArrowLeftIcon className="w-4 h-[10px] text-zinc-700 absolute left-[2px] top-[5.01px]" />
          </div>
        )}
        <div className="Headingsymbolwrapper self-stretch inline-flex justify-start items-center">
          <div className="Heading flex-1 justify-start text-slate-600 text-xl font-medium font-['Space_Grotesk'] leading-normal">
            {appHeaderTitle}
          </div>
          {showActionIcon && (
            <div className="Pencil w-5 h-5 relative overflow-hidden flex items-center justify-center">
              <PencilSquareIcon className="w-[14px] h-[14px] text-zinc-700 absolute left-[3px] top-[2.98px]" />
            </div>
          )}
        </div>
        {subhead && (
          <div className="Subheading self-stretch justify-start text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-none">
            {subheadText}
          </div>
        )}
      </div>
      {showActionBar && (
        <div
          className="Actionbar self-stretch h-12 px-5 py-3 bg-slate-600 inline-flex justify-start items-center gap-3"
          onClick={onAction}
          role="button"
          tabIndex={0}
          aria-label="Action bar"
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onAction && onAction(); }}
        >
          <div className="Actiontext flex-1 justify-start text-stone-50 text-base font-normal font-['Space_Grotesk'] leading-none">
            {actionBarText}
          </div>
          <div className="Plus w-5 h-5 relative overflow-hidden flex items-center justify-center">
            <PlusIcon className="w-2.5 h-2.5 text-white absolute left-[5px] top-[5px]" />
          </div>
        </div>
      )}
      {search && (
        <div className="Searchfeild self-stretch h-14 px-5 py-2.5 bg-white border-b-[0.4px] border-slate-600 inline-flex justify-end items-center gap-2.5">
          <div className="Search flex-1 justify-center text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-none">Search</div>
          <div className="Symbol w-6 h-6 relative flex items-center justify-center">
            <MagnifyingGlassIcon className="w-5 h-5 text-slate-600 absolute left-[1px] top-[1px]" />
          </div>
        </div>
      )}
    </div>
  );
};

AppHeader.propTypes = {
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
};

export default AppHeader; 