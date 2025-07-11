import React from "react";
import PropTypes from "prop-types";
import { Clock, Repeat2, Weight } from "lucide-react";

const SetBadgeSegment = ({ icon, value, isFirst, isLast }) => {
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

SetBadgeSegment.propTypes = {
    icon: PropTypes.elementType.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isFirst: PropTypes.bool,
    isLast: PropTypes.bool,
};

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
}) => {
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleClick = (e) => {
    if (editable && onEdit) onEdit(e);
    else if (onClick) onClick(e);
  };

  const renderSegments = () => {
    const segments = [];
    if (set_type === 'timed') {
        segments.push({ icon: Clock, value: formatTime(timed_set_duration || 0) });
    } else {
        segments.push({ icon: Repeat2, value: reps });
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

SetBadge.propTypes = {
  variant: PropTypes.oneOf(["sets", "exercises"]),
  reps: PropTypes.number,
  weight: PropTypes.number,
  unit: PropTypes.oneOf(["kg", "lbs", "body"]),
  label: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
  style: PropTypes.object,
  editable: PropTypes.bool,
  onEdit: PropTypes.func,
  set_type: PropTypes.string,
  timed_set_duration: PropTypes.number,
};

export default SetBadge;
