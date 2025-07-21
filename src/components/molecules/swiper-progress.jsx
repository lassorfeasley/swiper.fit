import React from "react";

export default function SwiperProgress({ completedSets = 0, totalSets = 1 }) {
  const progress = totalSets > 0 ? Math.min(completedSets / totalSets, 1) : 0;
  return (
    <div className="fixed bottom-0 left-0 right-0 w-full z-40">
      <div className="h-2 w-full flex overflow-hidden">
        <div
          className="bg-green-600 transition-all duration-300 ease-in-out"
          style={{ width: `${progress * 100}%` }}
        />
        <div className="flex-1 bg-neutral-300" />
      </div>
    </div>
  );
} 