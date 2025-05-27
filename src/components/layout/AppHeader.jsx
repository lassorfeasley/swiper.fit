import PropTypes from "prop-types";
import React from "react";
import { BackIcon } from "../common/BackIcon";
import { Icon } from "../common/Icon";
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
        {showBackButton && <BackIcon className="!relative !w-6 !h-6" />}
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
          className="flex items-center w-screen px-5"
          style={{
            height: "48px",
            gap: "12px",
            alignSelf: "stretch",
            background: "var(--Black, #2F3640)",
          }}
        >
          <div className="flex-1 text-metric font-metric leading-metric font-space text-white">
            {actionBarText}
          </div>
          <Icon className="!relative !w-6 !h-6" style={{ color: "var(--White, #FFF)" }} />
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
};

export default AppHeader; 