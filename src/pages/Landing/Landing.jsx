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
      <div className="w-[1643px] inline-flex flex-col justify-center items-center max-w-full mx-auto bg-white">
        {/* Header */}
        <div className="self-stretch h-11 pl-5 border-b border-neutral-neutral-300 inline-flex justify-between items-center">
          <div className="w-28 inline-flex flex-col justify-start items-start gap-2.5">
            <img 
              src="/images/swiper-logo.png" 
              alt="Swiper Logo" 
              className="w-28 h-11 object-contain"
            />
          </div>
          <div className="self-stretch flex justify-start items-center">
            <button 
              onClick={() => navigate('/login')}
              className="self-stretch px-5 py-2.5 border-l border-neutral-neutral-300 flex justify-center items-center gap-2.5 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <div className="justify-start text-black text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Log in</div>
            </button>
            <button 
              onClick={() => navigate('/create-account')}
              className="w-48 self-stretch max-w-96 px-4 py-2 bg-slate-slate-600 flex justify-center items-center gap-2.5 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <div className="justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Create account</div>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="self-stretch h-[767px] px-16 inline-flex justify-center items-center gap-6 md:gap-12 lg:gap-24">
          {/* Left Column - Interactive Demo */}
          <div className="w-96 h-[767px] outline outline-1 outline-neutral-neutral-300 inline-flex flex-col justify-center items-center">
            <DemoWorkoutSection />
          </div>
          
          {/* Right Column - Content */}
          <div className="flex-1 max-w-[500px] min-w-72 inline-flex flex-col justify-start items-start gap-2.5">
            <div className="w-full max-w-96 flex flex-col justify-start items-start gap-2">
              <div className="self-stretch justify-start text-neutral-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-normal">
                Log workouts effortlessly.
              </div>
              <div className="self-stretch justify-start text-neutral-neutral-500 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                Enter your routine and start a workout. Never miss an exercise and track your progress with AI.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="self-stretch h-36 px-3 pt-3 pb-24 bg-white border-t border-neutral-neutral-300 flex flex-col justify-start items-start gap-3">
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
