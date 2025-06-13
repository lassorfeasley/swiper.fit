import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { cn } from "@/lib/utils"

const SwiperAccordion = AccordionPrimitive.Root

const SwiperAccordionItem = React.forwardRef(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item 
    ref={ref} 
    className={cn("self-stretch inline-flex flex-col justify-center items-start", className)} 
    {...props} 
  />
))
SwiperAccordionItem.displayName = "SwiperAccordionItem"

const SwiperAccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex w-full">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "self-stretch h-12 inline-flex justify-start items-center gap-2.5 w-full",
        "text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal",
        "transition-all [&[data-state=open]>div>div]:rotate-180",
        className
      )}
      {...props}
    >
      <div className="w-80 self-stretch justify-center">
        {children}
      </div>
      <div className="size-6 relative overflow-hidden">
        <div className="Vector w-3 h-1.5 left-[6px] top-[9px] absolute outline outline-2 outline-offset-[-1px] outline-slate-600 transition-transform duration-200" />
      </div>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
SwiperAccordionTrigger.displayName = "SwiperAccordionTrigger"

const SwiperAccordionContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="w-full overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("w-full", className)}>
      {children}
    </div>
    <div className="Divider self-stretch flex flex-col justify-start items-start">
      <div className="Divider self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-300" />
    </div>
  </AccordionPrimitive.Content>
))
SwiperAccordionContent.displayName = "SwiperAccordionContent"

export { SwiperAccordion, SwiperAccordionItem, SwiperAccordionTrigger, SwiperAccordionContent } 