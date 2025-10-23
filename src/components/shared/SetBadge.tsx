import React from "react";
import { Clock, Repeat2, Weight } from "lucide-react";

interface SetBadgeSegmentProps {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  value: string | number | null;
  isFirst: boolean;
  isLast: boolean;
}

const SetBadgeSegment = ({ icon, value, isFirst, isLast }: SetBadgeSegmentProps) => {
  const IconComponent = icon;
  const borderRadius = isFirst && isLast ? 'rounded-sm' : isFirst ? 'rounded-l-sm' : isLast ? 'rounded-r-sm' : '';
  const borderClass = !isFirst ? 'border-l border-neutral-300' : '';
  
  return (
    <div className={`self-stretch px-2 bg-neutral-100 flex justify-center items-center gap-0.5 ${borderRadius} ${borderClass}`}>
      <IconComponent className="size-4 text-neutral-500" strokeWidth={1.5} />
      {value != null && value !== '' && (
        <span className="text-center text-neutral-500 text-label">
          {value}
        </span>
      )}
    </div>
  );
};

interface SetBadgeProps {
  variant?: "sets" | "exercises";
  reps?: number;
  weight?: number;
  unit?: "kg" | "lbs" | "body";
  label?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
  editable?: boolean;
  onEdit?: (e: React.MouseEvent) => void;
  set_type?: "reps" | "timed";
  timed_set_duration?: number;
}

const SetBadge = ({
  variant = "sets",
  reps,
  weight,
  unit,
  label,
  className = "",
  onClick,
  style,
  editable = false,
  onEdit,
  set_type = "reps",
  timed_set_duration,
}: SetBadgeProps) => {
  const formatTime = (secs: number): string => {
    const total = Math.max(0, Math.floor(secs || 0));
    const hNum = Math.floor(total / 3600);
    const mNum = Math.floor((total % 3600) / 60);
    const s = (total % 60).toString().padStart(2, "0");
    if (hNum > 0) {
      const h = String(hNum).padStart(2, "0");
      const m = String(mNum).padStart(2, "0");
      return `${h}:${m}:${s}`;
    }
    if (mNum === 0) return `:${s}`;
    return `${mNum}:${s}`;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (editable && onEdit) onEdit(e);
    else if (onClick) onClick(e);
  };

  const renderSegments = () => {
    const segments: Array<{ icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; value: string | number }> = [];
    if (set_type === 'timed') {
        segments.push({ icon: Clock, value: formatTime(timed_set_duration || 0) });
    } else {
        segments.push({ icon: Repeat2, value: reps || 0 });
    }

    // Always show weight segment: BW for bodyweight, weight value (including 0) for others
    if (unit === "body") {
        segments.push({ icon: Weight, value: "BW" });
    } else {
        segments.push({ icon: Weight, value: weight || 0 });
    }

    return segments.map((seg, index) => (
        <SetBadgeSegment 
            key={index}
            icon={seg.icon}
            value={seg.value}
            isFirst={index === 0}
            isLast={index === segments.length - 1}
        />
    ));
  }

  const badgeClasses = `
    h-7 bg-neutral-300 rounded-sm 
    outline outline-1 outline-offset-[-1px] outline-neutral-300 
    inline-flex justify-start items-center overflow-hidden
    ${editable ? "cursor-pointer" : ""}
    ${className}
  `.trim();

  // Exercise Label variant
  if (variant === "exercises") {
    return (
      <div
        className="px-2 py-0.5 rounded-md flex items-center bg-gray-200"
        onClick={onClick}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? "button" : undefined}
      >
        <span className="text-center text-gray-600 text-label">
          {label}
        </span>
      </div>
    );
  }

  // Default sets variant
  return (
    <div
      className={badgeClasses}
      style={style}
      onClick={handleClick}
      role={editable || onClick ? "button" : undefined}
      tabIndex={editable || onClick ? 0 : undefined}
    >
      {renderSegments()}
    </div>
  );
};

export default SetBadge;
