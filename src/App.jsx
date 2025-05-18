import { useState } from "react";
import SwipeSwitch from "./components/UI/SwipeSwitch";
import NumericInputWithUnit from "./components/UI/NumericInputWithUnit";
import CombinedControl from "./components/UI/CombinedControl";
import "./App.css";

function App() {
  const [switches, setSwitches] = useState([
    { status: "active" },
    { status: "locked" },
    { status: "locked" },
  ]);

  const handleComplete = (index) => {
    setSwitches(currentSwitches => {
      const newSwitches = [...currentSwitches];
      newSwitches[index] = { status: "complete" };
      
      const nextLockedIndex = newSwitches.findIndex((s, i) => i > index && s.status === "locked");
      if (nextLockedIndex !== -1) {
        newSwitches[nextLockedIndex] = { status: "active" };
      }
      
      return newSwitches;
    });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center font-sans">
      <div className="w-[375px] bg-[#F6F6F6] p-4 rounded-lg shadow-lg">
        <h1 className="text-heading text-heading-black font-bold mb-8 text-left">Swipe Switches</h1>
        
        <div className="relative p-8 text-left">
          <h2 className="text-[#8B5CF6] font-bold text-heading mb-6 flex items-center gap-2">
            <span className="text-lg">◆</span>
            Swipe states
          </h2>
          
          <div className="border-2 border-dashed border-[#8B5CF6] rounded-3xl p-6">
            <div className="flex flex-col gap-6">
              {switches.map((switchState, index) => (
                <div key={index} className="text-left mb-6">
                  <div className="text-metric font-metric leading-metric text-heading-black mb-3">
                    {index + 1}. {switchState.status.charAt(0).toUpperCase() + switchState.status.slice(1)}
                  </div>
                  <SwipeSwitch
                    status={switchState.status}
                    onComplete={() => handleComplete(index)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <CombinedControl />
        </div>
      </div>
    </div>
  );
}

export default App;
