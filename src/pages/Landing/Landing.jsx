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
      <div className="min-h-screen w-full relative bg-white overflow-x-hidden">
        {/* Header */}
        <div className="w-full border-b border-neutral-neutral-300 flex justify-between items-center">
          <div data-property-1="Default" className="px-2 py-3 bg-green-500 flex justify-center items-center gap-2 min-w-[10rem] sm:min-w-[12rem]">
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
          <div className="flex justify-start items-center h-11">
            <div className="px-2 sm:px-3 lg:px-5 border-l border-neutral-neutral-300 flex justify-center items-center gap-2.5 h-11">
              <div 
                className="justify-start text-black text-sm sm:text-base font-medium font-['Be_Vietnam_Pro'] leading-tight cursor-pointer"
                onClick={() => navigate("/login")}
              >
                Log in
              </div>
            </div>
            <div 
              className="w-28 sm:w-32 lg:w-48 px-2 sm:px-3 lg:px-4 bg-slate-slate-600 flex justify-center items-center gap-2.5 cursor-pointer h-11"
              onClick={() => navigate("/create-account")}
            >
              <div className="justify-start text-white text-xs sm:text-sm lg:text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                Create account
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12 xl:gap-48 px-4 sm:px-6 lg:px-8 flex-1 min-h-[90vh] items-center">
          {/* Left Column - Interactive Demo */}
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-96 outline outline-1 outline-neutral-neutral-300 flex flex-col order-2 lg:order-1">
            <DemoWorkoutSection />
          </div>
          
          {/* Right Column - Content */}
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-[500px] flex flex-col justify-start items-start gap-3 sm:gap-2 text-center lg:text-left order-1 lg:order-2">
            <div className="self-stretch justify-start text-neutral-neutral-700 text-xl sm:text-2xl font-bold font-['Be_Vietnam_Pro'] leading-normal">
              Log workouts effortlessly.
            </div>
            <div className="w-full justify-start text-neutral-neutral-500 text-sm sm:text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
              Enter your routine and start a workout. Never miss an exercise and monitor your progress with AI.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 bg-white border-t border-neutral-neutral-300 flex flex-col justify-start items-start gap-3">
          <div className="self-stretch min-w-36 justify-start text-neutral-neutral-500 text-xs font-bold font-['Be_Vietnam_Pro'] leading-none">
            Developed by Lassor
          </div>
          <div className="self-stretch flex flex-col justify-start items-start gap-1">
            <div className="self-stretch justify-start text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">
              www.Lassor.com
            </div>
            <div className="w-full sm:w-56 justify-start text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none break-all sm:break-normal">
              Feasley@Lassor.com
            </div>
          </div>
        </div>
      </div>
    </DemoWorkoutProvider>
  );
}
