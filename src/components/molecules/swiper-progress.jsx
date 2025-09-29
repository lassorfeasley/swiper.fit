import React from "react";

export default function SwiperProgress({ completedSets = 0, totalSets = 1 }) {
  const progress = totalSets > 0 ? Math.min(completedSets / totalSets, 1) : 0;
  return (
    <div className="fixed bottom-0 left-0 right-0 w-full z-40">
      <div className="ProgressBar w-full px-5 pb-5 bg-[linear-gradient(to_bottom,rgba(245,245,244,0)_0%,rgba(245,245,244,0)_10%,rgba(245,245,244,0.5)_40%,rgba(245,245,244,1)_80%,rgba(245,245,244,1)_100%)] inline-flex justify-start items-start gap-6">
        <div className="Frame59 flex-1 flex justify-start items-end gap-5">
          <div className="Frame56 flex-1 h-6 rounded-[20px] outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex justify-between items-center overflow-hidden">
            <div 
              className="Rectangle1 self-stretch bg-green-600 transition-all duration-300 ease-in-out" 
              style={{ width: `${progress * 100}%` }}
            />
            <div className="Rectangle2 flex-1 self-stretch bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
} 