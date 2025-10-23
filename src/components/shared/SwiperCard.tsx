import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/shadcn/card"
import { cn } from "@/lib/utils"

const SwiperCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn("rounded-xl border bg-card text-card-foreground", className)}
    {...props} />
))
SwiperCard.displayName = "SwiperCard"

const SwiperCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <CardHeader
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props} />
))
SwiperCardHeader.displayName = "SwiperCardHeader"

const SwiperCardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <CardTitle
    ref={ref}
    className={cn("text-heading-md", className)}
    {...props} />
))
SwiperCardTitle.displayName = "SwiperCardTitle"

const SwiperCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <CardDescription
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
SwiperCardDescription.displayName = "SwiperCardDescription"

const SwiperCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <CardContent ref={ref} className={cn("p-6", className)} {...props} />
))
SwiperCardContent.displayName = "SwiperCardContent"

const SwiperCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <CardFooter
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