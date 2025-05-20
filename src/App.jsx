import { useState } from "react";
import SwipeSwitch from "./components/UI/SwipeSwitch";
import IconExample from "./components/IconExample";
import ExerciseSetCard from "./components/UI/ExerciseSetCard";
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-lg bg-[#F6F6F6] p-4 rounded-lg mb-8">
        <h1 className="text-lg font-bold mb-4">Swipe Switches</h1>
        
        <div className="p-4">
          {switches.map((switchState, index) => (
            <div key={index} className="mb-4">
              <div className="mb-2">
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

      <div className="w-full max-w-lg p-4 rounded-lg mb-8">
        <h2 className="text-lg font-bold mb-4">Exercise Set Card</h2>
        <ExerciseSetCard />
      </div>

      <div className="w-full max-w-lg bg-[#F6F6F6] p-4 rounded-lg">
        <IconExample />
      </div>
    </div>
  );
}

export default App;
