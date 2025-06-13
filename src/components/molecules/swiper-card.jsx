import * as React from "react"
import { cn } from "@/lib/utils"

const SwiperCard = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-xl border bg-card text-card-foreground", className)}
    {...props} />
))
SwiperCard.displayName = "SwiperCard"

const SwiperCardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props} />
))
SwiperCardHeader.displayName = "SwiperCardHeader"

const SwiperCardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props} />
))
SwiperCardTitle.displayName = "SwiperCardTitle"

const SwiperCardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
SwiperCardDescription.displayName = "SwiperCardDescription"

const SwiperCardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6", className)} {...props} />
))
SwiperCardContent.displayName = "SwiperCardContent"

const SwiperCardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props} />
))
SwiperCardFooter.displayName = "SwiperCardFooter"

export { 
  SwiperCard, 
  SwiperCardHeader, 
  SwiperCardFooter, 
  SwiperCardTitle, 
  SwiperCardDescription, 
  SwiperCardContent 
} 