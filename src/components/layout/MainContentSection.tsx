import { cn } from "@/lib/utils";
import React from "react";

interface MainContentSectionProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  [key: string]: any;
}

export default function MainContentSection({ 
  children, 
  className = "", 
  as: Component = "section", 
  ...props 
}: MainContentSectionProps) {
  return (
    <Component className={cn("p-5", className)} {...props}>
      {children}
    </Component>
  );
} 