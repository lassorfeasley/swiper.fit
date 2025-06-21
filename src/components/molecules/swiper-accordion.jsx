import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const SwiperAccordion = React.forwardRef(({ className, ...props }, ref) => (
  <AccordionPrimitive.Root
    ref={ref}
    className={cn("flex flex-col w-full gap-0", className)}
    {...props}
  />
));
SwiperAccordion.displayName = "SwiperAccordion";

const SwiperAccordionItem = React.forwardRef(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b border-neutral-300 last:border-b-0", className)}
    {...props}
  />
));
SwiperAccordionItem.displayName = "SwiperAccordionItem";

const SwiperAccordionTrigger = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Header className="flex w-full">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "self-stretch h-12 inline-flex justify-between items-center gap-2.5 w-full px-2",
          "text-slate-600 text-base font-normal leading-normal",
          "transition-all [&[data-state=open]>svg]:rotate-180",
          "hover:bg-slate-50",
          className
        )}
        {...props}
      >
        <div className="text-left">{children}</div>
        <ChevronDown className="h-6 w-6 shrink-0 text-slate-600 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
);
SwiperAccordionTrigger.displayName = "SwiperAccordionTrigger";

const SwiperAccordionContent = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content
      ref={ref}
      className="w-full overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("w-full py-4 px-2", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
);
SwiperAccordionContent.displayName = "SwiperAccordionContent";

export {
  SwiperAccordion,
  SwiperAccordionItem,
  SwiperAccordionTrigger,
  SwiperAccordionContent,
};
