import React from "react";
import { Drawer, DrawerContent } from "@/components/atoms/drawer";
import { SwiperSheet } from "@/components/molecules/swiper-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { FormHeader } from "../atoms/sheet";

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
          className="p-4 z-[100]"
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

export default DrawerManager;
