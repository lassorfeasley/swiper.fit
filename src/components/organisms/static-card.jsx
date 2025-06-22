import React from "react";
import PropTypes from "prop-types";

const StaticCard = ({ id, name, labels = [], count, duration, onClick }) => {
  return (
    <div
      key={id}
      data-component="StaticCard"
      className="bg-white rounded-lg shadow-sm p-4 w-full flex justify-between items-center cursor-pointer"
      onClick={onClick}
    >
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
        <div className="flex items-center text-sm text-gray-500 mt-1">
          {labels.map((label, index) => (
            <span key={index} className="mr-2">
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="text-right">
        <p className="text-gray-800">{count} exercises</p>
        <p className="text-gray-500 text-sm">{duration}</p>
      </div>
    </div>
  );
};

StaticCard.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  labels: PropTypes.arrayOf(PropTypes.string),
  count: PropTypes.number,
  duration: PropTypes.string,
  onClick: PropTypes.func,
};

export default StaticCard;
