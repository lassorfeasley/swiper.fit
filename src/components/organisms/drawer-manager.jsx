import React from "react";
import { Drawer, DrawerContent } from "@/components/atoms/drawer";
import { SwiperSheet } from "@/components/molecules/swiper-sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const DrawerManager = ({ children, open, onOpenChange }) => {
  const isMobile = useIsMobile();
  console.log(isMobile);
  return (
    <div>
      {isMobile ? (
        <Drawer
          open={open}
          onOpenChange={onOpenChange}
          className="flex lg:hidden"
        >
          <DrawerContent className="h-[85vh] p-4">{children}</DrawerContent>
        </Drawer>
      ) : (
        <SwiperSheet
          open={open}
          onOpenChange={onOpenChange}
          className="hidden lg:flex"
        >
          {children}
        </SwiperSheet>
      )}
    </div>
  );
};

export default DrawerManager;
