import React from "react";
import { Sheet, SheetContent } from "@/components/atoms/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const SwiperSheet = ({ open, onOpenChange, children, className, ...props }) => {
  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(isMobile ? "h-[85vh]" : "w-[350px]", className)}
        {...props}
      >
        {children}
      </SheetContent>
    </Sheet>
  );
};

export default SwiperSheet;
