import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const swiperAlertVariants = cva(
  "w-full px-4 pt-3 bg-stone-100 flex justify-start items-center gap-2.5",
  {
    variants: {
      variant: {
        default: "",
        alert: "",
        info: "",
        warning: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const swiperAlertPillVariants = cva(
  "w-full px-3 py-2 bg-white rounded-full shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 backdrop-blur-[1px] flex justify-center items-center gap-2.5 cursor-pointer transition-colors hover:bg-neutral-50",
  {
    variants: {
      variant: {
        default: "",
        alert: "",
        info: "",
        warning: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface SwiperAlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof swiperAlertVariants> {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>> | React.ReactElement;
  onClick?: () => void;
  iconVariant?: 'alert' | 'info' | 'warning';
}

const SwiperAlert = React.forwardRef<HTMLDivElement, SwiperAlertProps>(
  ({ className, variant, title, subtitle, icon, onClick, iconVariant = 'alert', ...props }, ref) => {
    // Icon outline color based on variant
    const iconOutlineClass = {
      alert: "outline-red-red-600",
      info: "outline-blue-600",
      warning: "outline-amber-600",
    }[iconVariant] || "outline-red-red-600";

    const renderIcon = () => {
      if (!icon) return null;

      // Map icon variant to icon color
      const iconColorClass = {
        alert: "text-red-600",
        info: "text-blue-600",
        warning: "text-amber-600",
      }[iconVariant] || "text-red-600";

      // Handle React elements (already rendered icons)
      if (React.isValidElement(icon)) {
        return (
          <div data-layer="lucide-icon" className="LucideIcon size-8 flex items-center justify-center flex-shrink-0">
            {React.cloneElement(icon as React.ReactElement, { 
              className: cn("size-7", iconColorClass),
              strokeWidth: 1
            })}
          </div>
        );
      }

      // Handle component functions (like Lucide icons)
      // This includes both regular functions and forwardRef components
      const IconComponent = icon as React.ComponentType<React.SVGProps<SVGSVGElement>>;
      
      return (
        <div data-layer="lucide-icon" className="LucideIcon size-8 flex items-center justify-center flex-shrink-0">
          <IconComponent 
            className={cn("size-7", iconColorClass)}
            strokeWidth={1}
          />
        </div>
      );
    };

    return (
      <div
        ref={ref}
        data-layer="page-header"
        className={cn(swiperAlertVariants({ variant }), className)}
        {...props}
      >
        <div
          data-layer="Frame 5011"
          className={cn(swiperAlertPillVariants({ variant }))}
          onClick={onClick}
          role={onClick ? "button" : undefined}
          tabIndex={onClick ? 0 : undefined}
          onKeyDown={onClick ? (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          } : undefined}
        >
            {renderIcon()}
            <div data-layer="Frame 5013" className="Frame5013 flex-1 inline-flex flex-col justify-center items-start gap-1">
              <div className="self-stretch justify-start text-neutral-neutral-700 text-sm font-extrabold font-['Be_Vietnam_Pro'] leading-4">
                {title}
              </div>
              {subtitle && (
                <div className="self-stretch justify-start text-neutral-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-3">
                  {subtitle}
                </div>
              )}
            </div>
        </div>
      </div>
    );
  }
);

SwiperAlert.displayName = "SwiperAlert";

export { SwiperAlert };

