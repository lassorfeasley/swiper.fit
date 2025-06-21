import * as React from "react";
import { Button } from "@/components/atoms/button";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const swiperButtonVariants = cva("text-base font-normal h-[52px]", {
  variants: {
    variant: {
      default: "bg-slate-600 text-white hover:bg-slate-500",
      destructive: "!bg-red-400 text-white hover:!bg-red-500",
      outline:
        "border-neutral-300 bg-white text-slate-600 hover:bg-neutral-100",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const SwiperButton = React.forwardRef(
  ({ className, variant, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(swiperButtonVariants({ variant, className }))}
        {...props}
      />
    );
  }
);

SwiperButton.displayName = "SwiperButton";

export { SwiperButton, swiperButtonVariants };
