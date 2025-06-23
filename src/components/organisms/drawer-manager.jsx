import React from "react";
import { Drawer, DrawerContent } from "@/components/atoms/drawer";
import { SwiperSheet } from "@/components/molecules/swiper-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { FormHeader } from "../atoms/sheet";
import PropTypes from "prop-types";

const DrawerManager = ({
  children,
  open,
  onOpenChange,
  title,
  leftAction,
  rightAction,
  rightEnabled,
  leftText,
  rightText,
  padding = 4,
}) => {
  const isMobile = useIsMobile();

  return (
    <div>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="p-4 max-h-[90dvh] z-[100]">
            {leftAction && (
              <FormHeader
                leftText={leftText}
                leftAction={leftAction}
                title={title}
                rightText={rightText}
                rightAction={rightAction}
                rightEnabled={rightEnabled}
              />
            )}
            {children}
          </DrawerContent>
        </Drawer>
      ) : (
        <SwiperSheet
          open={open}
          onOpenChange={onOpenChange}
          className={`z-[100] ${padding === 0 ? 'p-0' : 'p-4'}`}
        >
          {leftAction && (
            <FormHeader
              leftText={leftText}
              leftAction={leftAction}
              title={title}
              rightText={rightText}
              rightAction={rightAction}
              rightEnabled={rightEnabled}
            />
          )}
          {children}
        </SwiperSheet>
      )}
    </div>
  );
};

DrawerManager.propTypes = {
  padding: PropTypes.oneOf([0, 4]),
};

export default DrawerManager;
