// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=114-1276&t=9pgcPuKv7UdpdreN-4

import PropTypes from "prop-types";
import React from "react";
import { MdArrowBack } from "react-icons/md";
import Icon from "../common/Icon";
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
    <div className="w-full bg-stone-50 border-b border-slate-600 flex flex-col justify-start items-start relative z-10" data-layer="AppHeader">
      <div className="self-stretch px-5 pt-10 pb-5 bg-stone-50 flex flex-col justify-start items-start gap-2" data-layer="PageLabelWrapper">
        {showBackButton && (
          <div
            className="size-6 relative cursor-pointer flex items-center justify-center"
            onClick={onBackHandler}
            role="button"
            tabIndex={0}
            aria-label="Back"
            data-layer="Back_Icon"
            data-property-1="arrow_back"
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onBackHandler(); }}
          >
            <MdArrowBack className="w-6 h-6 text-slate-600" />
          </div>
        )}
        <div className="self-stretch inline-flex justify-start items-center" data-layer="HeadingSymbolWrapper">
          <div className="flex-1 justify-start text-slate-600 text-xl font-medium font-[Space_Grotesk] leading-normal" data-layer="Heading">
            {appHeaderTitle}
          </div>
          {showActionIcon && (
            <div className="size-6 relative flex items-center justify-center" data-layer="Symbol" data-property-1="border_color">
              <Icon name="border_color" className="w-5 h-5 text-slate-600" />
            </div>
          )}
        </div>
        {subhead && (
          <div className="self-stretch justify-start text-slate-600 text-base font-normal font-[Space_Grotesk] leading-none" data-layer="SubHeading">
            {subheadText}
          </div>
        )}
      </div>
      {showActionBar && (
        <div
          className="self-stretch h-12 px-5 py-3 bg-slate-600 inline-flex justify-start items-center gap-3 cursor-pointer"
          onClick={onAction}
          role="button"
          tabIndex={0}
          aria-label="Action bar"
          data-layer="ActionBar"
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onAction && onAction(); }}
        >
          <div className="flex-1 justify-start text-stone-50 text-base font-normal font-[Space_Grotesk] leading-none" data-layer="ActionText">
            {actionBarText}
          </div>
          <div className="size-6 relative flex items-center justify-center" data-layer="Symbol" data-property-1="add">
            <Icon name="add" className="w-6 h-6 text-stone-50" />
          </div>
        </div>
      )}
      {search && (
        <SearchField
          value={value}
          onChange={handleChange}
          className="self-stretch h-14 px-5 py-2.5 bg-stone-50"
          inputClassName="bg-transparent focus:bg-transparent"
          data-layer="SearchFeild"
          data-on-off="true"
          showBorder={false}
        />
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