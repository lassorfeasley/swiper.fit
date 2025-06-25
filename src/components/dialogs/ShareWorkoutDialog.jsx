import React from "react";
import PropTypes from "prop-types";
import DrawerManager from "@/components/organisms/drawer-manager";
import { FormHeader } from "@/components/atoms/sheet";
import { SwiperButton } from "@/components/molecules/swiper-button";
import ToggleInput from "@/components/molecules/toggle-input";

const ShareWorkoutDialog = ({ open, onOpenChange, isPublic, onTogglePublic, shareUrl, onCopy }) => {
  return (
    <DrawerManager
      open={open}
      onOpenChange={onOpenChange}
      title="Share workout"
      leftAction={() => onOpenChange(false)}
      leftText="Close"
      padding={4}
    >
      <div className="flex flex-col gap-4 py-4">
        <ToggleInput
          options={[{ label: "Public link", value: true }]}
          value={isPublic ? true : null}
          onChange={() => onTogglePublic(!isPublic)}
        />
        {isPublic && (
          <div className="w-full inline-flex gap-2 items-center">
            <input
              readOnly
              className="flex-1 h-10 px-3 rounded-sm border border-neutral-300 text-sm"
              value={shareUrl}
              onFocus={(e) => e.target.select()}
            />
            <SwiperButton variant="secondary" onClick={onCopy} className="shrink-0">
              Copy
            </SwiperButton>
          </div>
        )}
      </div>
    </DrawerManager>
  );
};

ShareWorkoutDialog.propTypes = {
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
  isPublic: PropTypes.bool,
  onTogglePublic: PropTypes.func,
  shareUrl: PropTypes.string,
  onCopy: PropTypes.func,
};

export default ShareWorkoutDialog; 