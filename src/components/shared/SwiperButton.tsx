import * as React from "react";
import { Button } from "@/components/shadcn/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const swiperButtonVariants = cva("text-base font-medium font-['Be_Vietnam_Pro'] leading-tight h-12 rounded-lg border border-neutral-300 px-4 py-2 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0", {
  variants: {
    variant: {
      default: "bg-neutral-neutral-600 text-white hover:bg-neutral-neutral-500",
      destructive: "!bg-red-300 text-neutral-700 hover:!bg-red-400",
      outline:
        "border-neutral-300 bg-white text-neutral-neutral-600 hover:bg-neutral-neutral-100",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface SwiperButtonProps extends Omit<React.ComponentPropsWithoutRef<typeof Button>, 'variant'> {
  variant?: "default" | "destructive" | "outline";
}

const SwiperButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  SwiperButtonProps
>(({ className, variant, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      className={cn(swiperButtonVariants({ variant }), className)}
      {...props}
    />
  );
});

SwiperButton.displayName = "SwiperButton";

export { SwiperButton, swiperButtonVariants };
