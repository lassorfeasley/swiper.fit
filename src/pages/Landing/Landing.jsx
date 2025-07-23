import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { DemoWorkoutProvider } from "@/contexts/DemoWorkoutContext";
import DemoWorkoutSection from "@/components/DemoWorkout/DemoWorkoutSection";

export default function Landing() {
  const navigate = useNavigate();
  const { session } = useAuth();

  // Redirect authenticated users to routines page
  useEffect(() => {
    if (session) {
      navigate("/routines", { replace: true });
    }
  }, [session, navigate]);

  // Don't render if we're redirecting
  if (session) {
    return null;
  }

  return (
    <DemoWorkoutProvider>
      <div className="w-[1512px] h-[963px] relative bg-white overflow-hidden">
        {/* Header */}
        <div className="w-[1512px] left-0 top-0 absolute border-b border-neutral-neutral-300 inline-flex justify-between items-center">
          <div data-property-1="Default" className="w-48 h-11 px-2 py-3 bg-green-500 flex justify-center items-center gap-2">
            <div className="w-5 inline-flex flex-col justify-start items-start gap-2.5">
              <div className="w-6 h-4 bg-neutral-Neutral-50" />
            </div>
            <div className="w-2.5 h-3 bg-neutral-Neutral-50" />
            <div className="w-3 h-3.5 bg-neutral-Neutral-50" />
            <div className="w-4 h-4 bg-neutral-Neutral-50" />
            <div className="w-2 h-5 bg-neutral-Neutral-50" />
            <div className="w-5 h-3 bg-neutral-Neutral-50" />
            <div className="w-4 h-5 bg-neutral-Neutral-50" />
          </div>
          <div className="self-stretch flex justify-start items-center">
            <div className="self-stretch px-5 py-2.5 border-l border-neutral-neutral-300 flex justify-center items-center gap-2.5">
              <div 
                className="justify-start text-black text-base font-medium font-['Be_Vietnam_Pro'] leading-tight cursor-pointer"
                onClick={() => navigate("/login")}
              >
                Log in
              </div>
            </div>
            <div 
              className="w-48 self-stretch max-w-96 px-4 py-2 bg-slate-slate-600 flex justify-center items-center gap-2.5 cursor-pointer"
              onClick={() => navigate("/create-account")}
            >
              <div className="justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                Create account
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="h-[767px] left-[199px] top-[44px] absolute inline-flex justify-start items-center gap-48">
          {/* Left Column - Interactive Demo */}
          <div className="w-96 self-stretch outline outline-1 outline-neutral-neutral-300 inline-flex flex-col justify-center items-center">
            <DemoWorkoutSection />
          </div>
          
          {/* Right Column - Content */}
          <div className="w-[500px] h-20 max-w-[500px] inline-flex flex-col justify-start items-start gap-2">
            <div className="self-stretch h-7 justify-start text-neutral-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-normal">
              Log workouts effortlessly.
            </div>
            <div className="w-96 h-11 justify-start text-neutral-neutral-500 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
              Enter your routine and start a workout. Never miss an exercise and monitor your progress with AI.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-[1512px] h-36 px-3 pt-3 pb-24 left-0 top-[811px] absolute bg-white border-t border-neutral-neutral-300 inline-flex flex-col justify-start items-start gap-3">
          <div className="self-stretch min-w-36 justify-start text-neutral-neutral-500 text-xs font-bold font-['Be_Vietnam_Pro'] leading-none">
            Developed by Lassor
          </div>
          <div className="self-stretch flex flex-col justify-start items-start gap-1">
            <div className="self-stretch justify-start text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">
              www.Lassor.com
            </div>
            <div className="w-56 justify-start text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">
              Feasley@Lassor.com
            </div>
          </div>
        </div>
      </div>
    </DemoWorkoutProvider>
  );
}
