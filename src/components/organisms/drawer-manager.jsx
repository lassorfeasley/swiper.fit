import React from "react";
import { Drawer, DrawerContent } from "@/components/atoms/drawer";
import { SwiperSheet } from "@/components/molecules/swiper-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { FormHeader } from "../atoms/sheet";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

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
  className,
}) => {
  const isMobile = useIsMobile();

  return (
    <div>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent
            className={cn(
              `${padding === 0 ? "p-0" : "p-4"} max-h-[90dvh] z-[100]`,
              className
            )}
          >
            {leftAction && (
              <FormHeader
                className={padding === 0 ? "m-0" : undefined}
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
          className={cn(`z-[100] ${padding === 0 ? "p-0" : "p-4"}`, className)}
        >
          {leftAction && (
            <FormHeader
              className={padding === 0 ? "m-0" : undefined}
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
  className: PropTypes.string,
};

export default DrawerManager;
