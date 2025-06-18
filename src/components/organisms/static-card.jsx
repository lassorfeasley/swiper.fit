import React from "react";

const StaticCard = ({ key, name, labels, onClick, count, duration }) => {
  return (
    <div
      key={key}
      className="bg-white rounded-lg p-4 flex flex-col gap-3 w-full cursor-pointer hover:bg-gray-50 transition-all duration-300 hover:shadow-md"
      onClick={onClick}
    >
      <h2 className="text-slate-950 text-xl font-medium font-['Space_Grotesk'] leading-normal">
        {name}
      </h2>
      {labels && labels.length > 0 && (
        <div className="flex gap-2">
          {labels.map((label) => (
            <div
              key={label}
              className="px-2 py-0.5 rounded-md flex items-center bg-gray-200 text-xs w-fit font-semibold"
            >
              {label}
            </div>
          ))}
        </div>
      )}
      {count && duration && (
        <div className="flex gap-2 items-center text-sm text-gray-500">
          <div>{count} exercises</div> <span>|</span>
          <div>{duration}</div>
        </div>
      )}
    </div>
  );
};

export default StaticCard;
