import * as React from "react";
import { Button } from "@/components/shadcn/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const swiperButtonVariants = cva("text-base font-medium font-['Be_Vietnam_Pro'] leading-tight h-12 rounded-xl border border-neutral-300 px-4 py-2 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0", {
  variants: {
    variant: {
      default: "bg-neutral-neutral-600 text-white hover:bg-neutral-neutral-500",
      destructive: "!bg-red-300 text-neutral-700 hover:!bg-red-400",
      outline:
        "border-neutral-300 bg-white text-neutral-neutral-600 hover:bg-neutral-neutral-100",
      "primary-action": "w-full bg-neutral-neutral-700 text-white hover:bg-neutral-neutral-600 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 px-3 py-0 text-left text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-5 tracking-wide overflow-hidden h-12 min-h-[48px] justify-start items-center",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface SwiperButtonProps extends Omit<React.ComponentPropsWithoutRef<typeof Button>, 'variant'> {
  variant?: "default" | "destructive" | "outline" | "primary-action";
}

const SwiperButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  SwiperButtonProps
>(({ className, variant, ...props }, ref) => {
  // Map SwiperButton variants to Button variants
  const buttonVariant = variant === "primary-action" ? "default" : variant;
  
  return (
    <Button
      ref={ref}
      variant={buttonVariant}
      className={cn(swiperButtonVariants({ variant, className }))}
      {...props}
    />
  );
});

SwiperButton.displayName = "SwiperButton";

export { SwiperButton, swiperButtonVariants };
