// @ahttps://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=114-1276&t=9pgcPuKv7UdpdreN-4


import PropTypes from "prop-types";
import React from "react";
import { MdArrowBack } from "react-icons/md";
import Icon from "../common/Icon";
import SearchField from "../common/forms/SearchField";

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

  return (
    <div className="flex flex-col w-full items-start" style={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: 10 }} data-component="AppHeader">
      <div
        className="flex flex-col w-full items-start bg-white"
        style={{ borderBottom: "0.5px solid var(--Black, #2F3640)" }}
      >
        <div className="flex flex-col items-start gap-2 w-full px-5 pt-10 pb-5">
          {showBackButton && (
            <div
              className="!relative !w-6 !h-6 cursor-pointer flex items-center justify-center"
              onClick={onBack}
              role="button"
              tabIndex={0}
              aria-label="Back"
              style={{ background: "none", border: "none", padding: 0 }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onBack && onBack(); }}
            >
              <MdArrowBack className="!w-6 !h-6" />
            </div>
          )}
          <div className="flex items-center relative w-full">
            <h1
              className="flex-1 m-0 text-h1 font-h1 leading-h1 font-space text-light-balck"
            >
              {appHeaderTitle}
            </h1>
            {showActionIcon && <Icon name="add" className="!relative !w-6 !h-6" style={{ color: "var(--White, #FFF)" }} />}
          </div>
          {subhead && (
            <h2
              className="self-stretch m-0 text-h2 font-h2 leading-h2 font-space text-black"
            >
              {subheadText}
            </h2>
          )}
        </div>
        {showActionBar && (
          <div
            className="flex items-center w-full px-5 cursor-pointer"
            style={{
              height: "48px",
              gap: "12px",
              alignSelf: "stretch",
              background: "var(--Black, #2F3640)",
            }}
            onClick={onAction}
            role="button"
            tabIndex={0}
            aria-label="Action bar"
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onAction && onAction(); }}
          >
            <div className="flex-1 text-metric font-metric leading-metric font-space text-white">
              {actionBarText}
            </div>
            <span
              className="material-symbols-outlined text-white text-3xl ml-2"
              aria-label="Add"
              tabIndex={-1}
            >
              add
            </span>
          </div>
        )}
        {search && (
          <div className="w-full">
            <SearchField
              value={value}
              onChange={handleChange}
            />
          </div>
        )}
      </div>
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