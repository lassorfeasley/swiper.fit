import * as React from "react";
import { LucideIcon, Blend } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** Main heading text */
  title: string;
  /** Description text below the title */
  description: string;
  /** Icon to display - defaults to Blend */
  icon?: LucideIcon;
  /** Optional custom className */
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Blend,
  className,
}) => {
  return (
    <div
      data-layer="empty-state-placeholder"
      className={cn(
        "EmptyStatePlaceholder self-stretch h-[70vh] p-6 bg-white rounded-sm border border-neutral-300 inline-flex flex-col justify-center items-start gap-4",
        className
      )}
    >
      <div
        data-svg-wrapper
        data-layer="lucide-icon"
        data-icon="blend"
        className="LucideIcon relative"
      >
        <Icon
          width={48}
          height={48}
          stroke="var(--neutral-neutral-700, #404040)"
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </div>

      <div
        data-layer="Frame 87"
        className="Frame87 self-stretch flex flex-col justify-start items-start gap-2"
      >
        <div
          data-layer="title"
          className="self-stretch justify-start text-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-8"
        >
          {title}
        </div>

        <div
          data-layer="description"
          className="self-stretch justify-start text-neutral-600 text-base font-medium font-['Be_Vietnam_Pro'] leading-5"
        >
          {description}
        </div>
      </div>

    </div>
  );
};

