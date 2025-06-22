import React from "react";
import { Drawer, DrawerContent } from "@/components/atoms/drawer";
import { SwiperSheet } from "@/components/molecules/swiper-sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const DrawerManager = ({ children, open, onOpenChange }) => {
  const isMobile = useIsMobile();

  return (
    <div>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="p-4 max-h-[90dvh] z-[100]">
            {children}
          </DrawerContent>
        </Drawer>
      ) : (
        <SwiperSheet
          open={open}
          onOpenChange={onOpenChange}
          className="p-4 z-[100]"
        >
          {children}
        </SwiperSheet>
      )}
    </div>
  );
};

export default DrawerManager;
