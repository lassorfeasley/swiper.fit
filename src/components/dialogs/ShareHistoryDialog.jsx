import React from "react";
import PropTypes from "prop-types";
import DrawerManager from "@/components/organisms/drawer-manager";
import ToggleInput from "@/components/molecules/toggle-input";
import { SwiperButton } from "@/components/molecules/swiper-button";

const ShareHistoryDialog = ({
  open,
  onOpenChange,
  isPublic,
  onTogglePublic,
  shareUrl,
  onCopy,
}) => {
  return (
    <DrawerManager
      open={open}
      onOpenChange={onOpenChange}
      title="Share history"
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
            <SwiperButton
              variant="secondary"
              onClick={onCopy}
              className="shrink-0"
            >
              Copy
            </SwiperButton>
          </div>
        )}
      </div>
    </DrawerManager>
  );
};

ShareHistoryDialog.propTypes = {
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
  isPublic: PropTypes.bool,
  onTogglePublic: PropTypes.func,
  shareUrl: PropTypes.string,
  onCopy: PropTypes.func,
};

export default ShareHistoryDialog; 