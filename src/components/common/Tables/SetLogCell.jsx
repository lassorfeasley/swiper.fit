import React from "react";
import PropTypes from "prop-types";
import SetBadge from "@/components/molecules/SetBadge";

const SetLogCell = ({ sets, exerciseId, onEdit }) => {
  if (!sets || sets.length === 0) return null;

  return (
    <div className="ml-auto inline-flex items-center gap-3 flex-nowrap">
      {sets.map((set, idx) => (
        <SetBadge
          key={set.id}
          reps={set.reps}
          weight={set.weight}
          unit={set.unit}
          set_type={set.set_type}
          timed_set_duration={set.timed_set_duration}
          className="h-7"
          editable={true}
          onEdit={(e) => {
            e.stopPropagation();
            onEdit?.(exerciseId, idx, set);
          }}
        />
      ))}
    </div>
  );
};

SetLogCell.propTypes = {
  sets: PropTypes.arrayOf(PropTypes.object),
  exerciseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onEdit: PropTypes.func,
};

export default SetLogCell; 