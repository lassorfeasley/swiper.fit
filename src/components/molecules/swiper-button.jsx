import * as React from "react";
import { Button } from "@/components/atoms/button";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const swiperButtonVariants = cva("text-base font-normal h-[52px] rounded-none border border-neutral-300 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0", {
  variants: {
    variant: {
      default: "bg-slate-600 text-white hover:bg-slate-500",
      destructive: "!bg-red-300 text-neutral-700 hover:!bg-red-400",
      outline:
        "border-neutral-300 bg-neutral-50 text-slate-600 hover:bg-neutral-100",
      "primary-action": "w-full bg-neutral-neutral-700 text-white hover:bg-neutral-neutral-600 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 px-3 py-0 text-left text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-5 tracking-wide overflow-hidden h-12 min-h-[48px] justify-start items-center",
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
