import React from "react";
import {
  Sheet,
  SheetContent,
  FormHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/atoms/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const SwiperSheet = ({
  open,
  onOpenChange,
  children,
  className,
  title,
  description,
  ...props
}) => {
  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          isMobile ? "h-[85vh] w-full px-5" : "w-[350px] sm:max-w-none",
          "bg-stone-50 p-0 gap-0 flex flex-col",
          className
        )}
        {...props}
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        {description && <SheetDescription className="sr-only">{description}</SheetDescription>}
        {children}
      </SheetContent>
    </Sheet>
  );
};

export { SwiperSheet };
