import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { DemoWorkoutProvider } from "@/contexts/DemoWorkoutContext";
import DemoWorkoutSection from "@/components/DemoWorkout/DemoWorkoutSection";
import { MoveUpRight } from "lucide-react";
import LoggedOutNav from "@/components/layout/LoggedOutNav";

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
      <div className="md:hidden w-full min-h-screen bg-white flex flex-col">
        {/* Navigation */}
        <LoggedOutNav showAuthButtons={true} />

        {/* Main Content - Fixed height sections */}
        <div className="flex-1 flex flex-col">
          {/* Text content section - Fixed height */}
          <div className="w-full h-[371px] px-5 flex flex-col justify-center items-start gap-2.5">
            <div className="w-full max-w-[400px] flex flex-col justify-start items-start gap-2">
              <div className="self-stretch justify-start text-neutral-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-loose">Log workouts effortlessly.</div>
              <div className="self-stretch justify-start text-neutral-neutral-500 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Enter your routine and start a workout. Never miss an exercise and monitor your progress with AI.</div>
            </div>
          </div>

          {/* Demo workout section - Container that hugs content */}
          <div className="w-full px-5 outline outline-1 outline-neutral-neutral-300 flex flex-col justify-center items-center">
            <div className="w-full flex flex-col justify-center items-center">
              <DemoWorkoutSection />
            </div>
          </div>
        </div>

        {/* Footer - Fixed height */}
        <div className="w-full h-[152px] px-3 pt-3 pb-[100px] bg-white border-t border-neutral-neutral-300 flex flex-col justify-start items-start gap-3">
          <div className="self-stretch min-w-36 justify-start text-neutral-neutral-500 text-xs font-bold font-['Be_Vietnam_Pro'] leading-none">Developed by Lassor</div>
          <div className="self-stretch flex flex-col justify-start items-start gap-1">
            <div className="self-stretch justify-start text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">www.Lassor.com</div>
            <div className="w-56 justify-start text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">Feasley@Lassor.com</div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Hidden on mobile, visible on md+ breakpoints */}
      <div className="hidden md:block w-full bg-white">
        {/* Navigation */}
        <LoggedOutNav showAuthButtons={true} />

        {/* Main Content - Full viewport height with demo workout spanning full height */}
        <div className="w-full h-screen max-w-[1643px] mx-auto px-16 flex justify-center items-center gap-6 md:gap-12 lg:gap-24">
          {/* Demo Workout Section - spans full height */}
          <div className="w-full max-w-[450px] min-w-80 h-full flex flex-col justify-center items-center">
            <DemoWorkoutSection />
          </div>
          
          {/* Text Content Section */}
          <div className="w-full max-w-[500px] min-w-72 flex flex-col justify-center items-start gap-2.5">
            <div className="w-full max-w-96 flex flex-col justify-start items-start gap-2">
              <div className="self-stretch justify-start text-neutral-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-loose">Log workouts effortlessly.</div>
              <div className="self-stretch justify-start text-neutral-neutral-500 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Enter your routine and start a workout. Never miss an exercise and track your progress with AI.</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full h-36 px-3 pt-3 pb-24 bg-white border-t border-neutral-neutral-300 flex flex-col justify-start items-start gap-3">
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
