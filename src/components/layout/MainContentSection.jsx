import { cn } from "@/lib/utils";

export default function MainContentSection({ children, className = "", as: Component = "section", ...props }) {
  return (
    <Component className={cn("p-5", className)} {...props}>
      {children}
    </Component>
  );
} 