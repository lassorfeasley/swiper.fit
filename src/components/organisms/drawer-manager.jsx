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
          <DrawerContent className="h-[95vh] p-4">{children}</DrawerContent>
        </Drawer>
      ) : (
        <SwiperSheet open={open} onOpenChange={onOpenChange} className="p-4">
          {children}
        </SwiperSheet>
      )}
    </div>
  );
};

export default DrawerManager;
