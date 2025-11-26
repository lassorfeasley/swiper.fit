import React from "react";
import { ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryHeaderCardProps {
  imageUrl?: string;
  title: string;
  subtitle?: string;
  onLinkClick?: () => void;
  onShare?: () => void;
  fallbackImageUrl?: string;
  className?: string;
}

export const SummaryHeaderCard = ({
  imageUrl,
  title,
  onLinkClick,
  onShare,
  fallbackImageUrl = "/images/default-open-graph.png",
  className
}: SummaryHeaderCardProps) => {
  return (
    <div className={cn("w-full max-w-[500px] rounded-sm border border-neutral-neutral-300 flex flex-col overflow-hidden", className)}>
      <div 
        className={cn("overflow-hidden rounded-t-sm", onShare && "cursor-pointer")}
        onClick={onShare}
        role={onShare ? "button" : undefined}
        tabIndex={onShare ? 0 : undefined}
        onKeyDown={onShare ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onShare();
          }
        } : undefined}
        aria-label={onShare ? "Share" : undefined}
      >
        <img
          data-layer="open-graph-image"
          className="OpenGraphImage w-full h-auto"
          src={imageUrl || fallbackImageUrl}
          alt={`${title} preview`}
          draggable={false}
          style={{ maxHeight: '256px', objectFit: 'cover', display: 'block' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== fallbackImageUrl && !target.src.endsWith(fallbackImageUrl)) {
               target.src = fallbackImageUrl;
            }
          }}
        />
      </div>
      {onLinkClick && (
        <div
          data-layer="routine-link"
          className="RoutineLink w-full h-11 px-3 bg-neutral-Neutral-50 border-t border-neutral-neutral-300 inline-flex justify-between items-center cursor-pointer"
          onClick={onLinkClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onLinkClick();
            }
          }}
        >
          <div className="justify-center text-neutral-neutral-600 text-sm font-semibold font-vietnam leading-5">
            {title}
          </div>
          <div className="size-6 relative overflow-hidden">
            <ListChecks className="w-6 h-6 text-neutral-neutral-600" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryHeaderCard;
