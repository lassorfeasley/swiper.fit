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
}) => {
  // For demo: search state
  const [searchValue, setSearchValue] = React.useState("");

  return (
    <div className="flex flex-col w-screen items-start relative">
      <div
        className="flex flex-col items-start gap-2 w-screen px-5 pt-10 pb-5"
        style={{
          borderBottom: "0.5px solid var(--Black, #2F3640)",
          background: "var(--White, #FFF)",
        }}
      >
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
          {showActionIcon && <Icon className="!relative !w-6 !h-6" style={{ color: "var(--White, #FFF)" }} />}
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
          className="flex items-center w-screen px-5 cursor-pointer"
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
          <button
            className="flex items-center justify-center rounded-full bg-white text-black shadow w-10 h-10 ml-2 focus:outline-none"
            style={{ minWidth: 40, minHeight: 40 }}
            aria-label="Add"
            type="button"
            tabIndex={-1}
          >
            <Icon name="add" variant="outlined" size={28} />
          </button>
        </div>
      )}
      {search && (
        <div className="w-full">
          <SearchField
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
          />
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
};

export default AppHeader; 