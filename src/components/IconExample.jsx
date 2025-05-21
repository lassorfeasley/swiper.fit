import React from "react";

export const IconExample = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Google Material Icons Examples</h2>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <i className="material-icons">fitness_center</i>
          <span>Fitness Center</span>
        </div>

        <div className="flex items-center space-x-2">
          <i className="material-icons">directions_run</i>
          <span>Running</span>
        </div>

        <div className="flex items-center space-x-2">
          <i className="material-icons">local_dining</i>
          <span>Nutrition</span>
        </div>

        <div className="flex items-center space-x-2">
          <i className="material-icons text-blue-500 text-3xl">favorite</i>
          <span>Custom Size and Color</span>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm text-gray-600">
          You can find more icons at{" "}
          <a
            href="https://fonts.google.com/icons"
            className="text-blue-500 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Fonts Icons
          </a>
        </p>
      </div>
    </div>
  );
};
