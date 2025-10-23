import * as React from "react"
import { cn } from "@/lib/utils"

interface SidebarContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextType>({
  open: false,
  setOpen: () => {},
})

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ 
    className, 
    children,
    defaultOpen = false,
    onOpenChange,
    ...props 
  }, ref) => {
    const [open, setOpen] = React.useState(defaultOpen)

    React.useEffect(() => {
      onOpenChange?.(open)
    }, [open, onOpenChange])

    return (
      <SidebarContext.Provider value={{ open, setOpen }}>
        <div
          ref={ref}
          className={cn("relative", className)}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    )
  }
)
Sidebar.displayName = "Sidebar"

export interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ 
    className, 
    children,
    ...props 
  }, ref) => (
    <div
      ref={ref}
      className={cn("flex h-14 items-center border-b px-4", className)}
      {...props}
    >
      {children}
    </div>
  )
)
SidebarHeader.displayName = "SidebarHeader"

export interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarContent = React.forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ 
    className, 
    children,
    ...props 
  }, ref) => (
    <div
      ref={ref}
      className={cn("flex-1 overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  )
)
SidebarContent.displayName = "SidebarContent"

export interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarFooter = React.forwardRef<HTMLDivElement, SidebarFooterProps>(
  ({ 
    className, 
    children,
    ...props 
  }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    >
      {children}
    </div>
  )
)
SidebarFooter.displayName = "SidebarFooter"

export interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {}

const SidebarNav = React.forwardRef<HTMLElement, SidebarNavProps>(
  ({ 
    className, 
    children,
    ...props 
  }, ref) => (
    <nav
      ref={ref}
      className={cn("flex flex-col gap-1 p-2", className)}
      {...props}
    >
      {children}
    </nav>
  )
)
SidebarNav.displayName = "SidebarNav"

export interface SidebarNavItemProps extends React.HTMLAttributes<HTMLElement> {
  active?: boolean;
  icon?: React.ReactNode;
  asChild?: boolean;
}

const SidebarNavItem = React.forwardRef<HTMLAnchorElement, SidebarNavItemProps>(
  ({ 
    className, 
    active,
    icon,
    children,
    asChild = false,
    ...props 
  }, ref) => {
    const Comp = asChild ? React.Fragment : "a"
    return (
      <Comp
        ref={asChild ? undefined : ref}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          active && "bg-accent text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        {...props}
      >
        {icon && (
          <div className={cn(
            "size-5 shrink-0",
            active ? "text-accent-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
          )}>
            {icon}
          </div>
        )}
        <span className="truncate">{children}</span>
      </Comp>
    )
  }
)
SidebarNavItem.displayName = "SidebarNavItem"

export const useSidebar = (): SidebarContextType => {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarNav,
  SidebarNavItem,
}
