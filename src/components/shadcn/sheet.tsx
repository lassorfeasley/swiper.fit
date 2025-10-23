import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

export interface SheetOverlayProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay> {}

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  SheetOverlayProps
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-[1500] bg-white/60 backdrop-blur-sm pointer-events-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-[1501] gap-4 bg-background shadow-lg flex flex-col transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

export interface FormHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  leftAction?: () => void;
  rightAction?: () => void;
  leftText?: string;
  rightText?: string;
  title?: string;
  showBackIcon?: boolean;
  rightEnabled?: boolean;
}

const FormHeader = ({
  className,
  leftAction,
  rightAction,
  leftText = "Cancel",
  rightText = "Save",
  title,
  showBackIcon = false,
  rightEnabled = true,
  ...props
}: FormHeaderProps) => (
  <div
    className={cn(
      "mt-4 mb-4 lg:mt-0 self-stretch p-3 border-b border-neutral-300 inline-flex justify-center items-center gap-5 w-full",
      className
    )}
    {...props}
  >
    <div className="flex-1 flex justify-start items-center">
      {leftAction && (
        <>
          {showBackIcon && (
            <div className="w-6 h-6 relative overflow-hidden">
              <div className="w-1.5 h-3 left-[9px] top-[6px] absolute outline outline-2 outline-offset-[-1px] outline-slate-600" />
            </div>
          )}
          <button
            onClick={leftAction}
            className="text-red-500 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight text-left focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0"
          >
            {leftText}
          </button>
        </>
      )}
    </div>
    <div className="flex-1 flex justify-center items-center gap-2.5">
      {title && (
        <div className="justify-center text-neutral-950 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight whitespace-nowrap">
          {title}
        </div>
      )}
    </div>
    <div className="flex-1 text-right justify-center">
      {rightAction && (
        <button
          onClick={rightAction}
          className={cn(
            "text-base font-medium font-['Be_Vietnam_Pro'] leading-tight",
            rightEnabled ? "text-green-600" : "text-neutral-400",
            "focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0"
          )}
          disabled={!rightEnabled}
        >
          {rightText}
        </button>
      )}
    </div>
  </div>
);
FormHeader.displayName = "FormHeader";

export interface SheetFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const SheetFooter = ({ className, ...props }: SheetFooterProps) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

export interface SheetTitleProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title> {}

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  SheetTitleProps
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-heading-md text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

export interface SheetDescriptionProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description> {}

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  SheetDescriptionProps
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  FormHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
