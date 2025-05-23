import PropTypes from "prop-types";
import React from "react";
import { ActionIcon } from "./ActionIcon";
import { BackIcon } from "./BackIcon";
import { Icon } from "./Icon";
import { IconComponentNode } from "./IconComponentNode";

export const AppHeader = ({ property1, className, title = "Page title", onBack, onAdd, actionIcon }) => {
  return (
    <div
      className={`bg-white w-full flex flex-col items-start gap-2 pt-10 pb-5 px-5 border-b border-gray-300 relative ${className}`}
    >
      {property1 === "default" && <BackIcon className="!relative !w-6 !h-6" onClick={onBack} />}

      {property1 === "no-action" && (
        <IconComponentNode className="!relative !w-6 !h-6" />
      )}

      <div className="w-full flex self-stretch items-center flex-[0_0_auto] relative">
        {property1 === "default" && (
          <>
            <div className="relative flex-1 mt-[-1.00px] text-black text-[25px] font-bold">
              {title}
            </div>
            <button onClick={onAdd} className="ml-2">
              <ActionIcon className="!relative !w-6 !h-6" icon={actionIcon} />
            </button>
          </>
        )}

        {["no-action-no-back", "no-action", "no-back"].includes(property1) && (
          <div className="flex flex-col items-start grow gap-2 flex-1 justify-center relative">
            <div className="w-fit mt-[-1.00px] text-black text-[25px] font-bold">
              {title}
            </div>
          </div>
        )}

        {property1 === "no-back" && <Icon className="!relative !w-6 !h-6" />}
      </div>
    </div>
  );
};

AppHeader.propTypes = {
  property1: PropTypes.oneOf([
    "no-back",
    "no-action",
    "no-action-no-back",
    "default",
  ]),
  className: PropTypes.string,
  title: PropTypes.string,
  onBack: PropTypes.func,
  onAdd: PropTypes.func,
  actionIcon: PropTypes.elementType,
};

export default AppHeader; 