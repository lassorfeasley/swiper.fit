import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref} />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background shadow-lg flex flex-col transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
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
)

const SheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const FormHeader = ({
  className,
  children,
  leftAction,
  leftText = "Cancel",
  rightAction,
  rightText = "Add",
  title,
  showLeftAction = true,
  showRightAction = true,
  showBackIcon = false,
  rightEnabled = true,
  ...props
}) => (
  <div
    className={cn(
      "self-stretch p-3 border-b border-neutral-300 inline-flex justify-center items-center gap-5",
      className
    )}
    {...props}
  >
    <div className="flex-1 flex justify-start items-center">
      {showLeftAction && (
        <>
          {showBackIcon && (
            <div className="w-6 h-6 relative overflow-hidden">
              <div className="w-1.5 h-3 left-[9px] top-[6px] absolute outline outline-2 outline-offset-[-1px] outline-slate-600" />
            </div>
          )}
          <button
            onClick={leftAction}
            className="text-red-500 text-base font-medium font-vietnam leading-tight text-left"
          >
            {leftText}
          </button>
        </>
      )}
    </div>
    <div className="flex-1 flex justify-center items-center gap-2.5">
      {title ? (
        <div className="justify-center text-slate-600 text-xl font-medium font-vietnam leading-normal">
          {title}
        </div>
      ) : (
        children
      )}
    </div>
    <div className="flex-1 text-right justify-center">
      {showRightAction && (
        <button
          onClick={rightAction}
          className={cn(
            "text-base font-medium font-vietnam leading-tight",
            rightEnabled ? "text-green-600" : "text-neutral-400"
          )}
          disabled={!rightEnabled}
        >
          {rightText}
        </button>
      )}
    </div>
  </div>
)
FormHeader.displayName = "FormHeader"

const SheetFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props} />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-heading-md text-foreground", className)}
    {...props} />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

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
}
