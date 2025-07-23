import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { DemoWorkoutProvider } from "@/contexts/DemoWorkoutContext";
import DemoWorkoutSection from "@/components/DemoWorkout/DemoWorkoutSection";
import { MoveUpRight } from "lucide-react";

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
      {/* Mobile Layout - Only visible on mobile breakpoints */}
      <div className="md:hidden w-full h-[1434px] relative bg-white overflow-hidden">
        <div className="w-full h-[1065px] left-0 top-0 absolute inline-flex flex-col justify-start items-center">
          <div className="self-stretch h-11 border-b border-neutral-neutral-300 inline-flex justify-start items-center">
            <button 
              onClick={() => navigate('/login')}
              className="flex-1 h-11 px-5 py-2.5 border-r border-neutral-neutral-300 flex justify-center items-center gap-2 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <div className="justify-start text-black text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">Log in</div>
              <MoveUpRight className="w-2.5 h-2.5 text-neutral-neutral-700" />
            </button>
            <button 
              onClick={() => navigate('/create-account')}
              className="flex-1 h-11 max-w-96 px-4 py-2 flex justify-center items-center gap-2 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <div className="justify-start text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Create account</div>
              <MoveUpRight className="w-2.5 h-2.5 text-neutral-neutral-700" />
            </button>
          </div>
          <div className="self-stretch h-11 pl-5 border-b border-neutral-neutral-300 inline-flex justify-between items-center">
            <div className="w-28 inline-flex flex-col justify-start items-start gap-2.5">
              <img 
                src="/images/swiper-logo.png" 
                alt="Swiper Logo" 
                className="w-28 h-11 object-contain"
              />
            </div>
          </div>
          <div className="self-stretch px-5 pt-16 flex flex-col justify-start items-center gap-16">
            <div className="w-full h-80 max-w-[500px] min-w-72 flex flex-col justify-center items-start gap-2.5">
              <div className="w-full max-w-96 flex flex-col justify-start items-start gap-2">
                <div className="self-stretch justify-start text-neutral-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-loose">Log workouts effortlessly.</div>
                <div className="self-stretch justify-start text-neutral-neutral-500 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Enter your routine and start a workout. Never miss an exercise and track your progress with AI.</div>
              </div>
            </div>
            <div className="self-stretch flex flex-col justify-start items-center">
              <div data-form-active="false" data-form-dormant="false" data-form="true" data-property-1="Default" className="w-screen h-12 pl-3 bg-white border-t border-b border-neutral-neutral-300 inline-flex flex-col justify-center items-start -mx-5">
                <div className="self-stretch inline-flex justify-center items-center gap-2.5">
                  <div className="flex-1 justify-start text-neutral-neutral-700 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">Swipe sets to complete exercises</div>
                </div>
              </div>
              <div className="w-full h-[662px] max-w-[450px] min-w-80 outline outline-1 outline-neutral-neutral-300 flex flex-col justify-center items-center">
                <DemoWorkoutSection />
              </div>
            </div>
          </div>
          <div className="self-stretch h-36 px-3 pt-3 pb-24 bg-white border-t border-neutral-neutral-300 flex flex-col justify-start items-start gap-3">
            <div className="self-stretch min-w-36 justify-start text-neutral-neutral-500 text-xs font-bold font-['Be_Vietnam_Pro'] leading-none">Developed by Lassor</div>
            <div className="self-stretch flex flex-col justify-start items-start gap-1">
              <div className="self-stretch justify-start text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">www.Lassor.com</div>
              <div className="w-56 justify-start text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">Feasley@Lassor.com</div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Hidden on mobile, visible on md+ breakpoints */}
      <div className="hidden md:block w-full bg-white">
        {/* Header - Full width, flush with top */}
        <div className="w-full h-11 pl-5 border-b border-neutral-neutral-300 flex justify-between items-center">
          <div className="w-28 inline-flex flex-col justify-start items-start gap-2.5">
            <img 
              src="/images/swiper-logo.png" 
              alt="Swiper Logo" 
              className="w-28 h-11 object-contain"
            />
          </div>
          <div className="flex justify-start items-center">
            <button 
              onClick={() => navigate('/login')}
              className="h-11 px-5 py-2.5 border-l border-neutral-neutral-300 flex justify-center items-center gap-2.5 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <div className="justify-start text-black text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Log in</div>
            </button>
            <button 
              onClick={() => navigate('/create-account')}
              className="h-11 w-48 max-w-96 px-4 py-2 bg-slate-slate-600 flex justify-center items-center gap-2.5 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <div className="justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Create account</div>
            </button>
          </div>
        </div>

        {/* Main Content - Centered with max-width */}
        <div className="max-w-[1643px] mx-auto px-16 flex justify-center items-center gap-6 md:gap-12 lg:gap-24">
          {/* Demo Workout Section */}
          <div className="w-full h-[662px] max-w-[450px] min-w-80 outline outline-1 outline-neutral-neutral-300 flex flex-col justify-center items-center">
            <DemoWorkoutSection />
          </div>
          
          {/* Text Content Section */}
          <div className="w-full h-80 max-w-[500px] min-w-72 flex flex-col justify-center items-start gap-2.5">
            <div className="w-full max-w-96 flex flex-col justify-start items-start gap-2">
              <div className="self-stretch justify-start text-neutral-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-loose">Log workouts effortlessly.</div>
              <div className="self-stretch justify-start text-neutral-neutral-500 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Enter your routine and start a workout. Never miss an exercise and track your progress with AI.</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-36 px-3 pt-3 pb-24 bg-white border-t border-neutral-neutral-300 flex flex-col justify-start items-start gap-3">
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
