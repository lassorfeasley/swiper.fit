import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { useEffect } from "react";
import { DemoWorkoutProvider } from "@/contexts/DemoWorkoutContext";
import DemoWorkoutSection from "@/components/DemoWorkout/DemoWorkoutSection";
import { MoveUpRight } from "lucide-react";
import LoggedOutNav from "@/features/auth/components/LoggedOutNav";

export default function Landing() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { isWorkoutActive, loading: workoutLoading } = useActiveWorkout();

  // Redirect authenticated users based on workout state
  useEffect(() => {
    if (session && !workoutLoading) {
      if (isWorkoutActive) {
        // If there's an active workout, redirect to it immediately
        navigate("/workout/active", { replace: true });
      } else {
        // Otherwise, redirect to train page
        navigate("/train", { replace: true });
      }
    }
  }, [session, isWorkoutActive, workoutLoading, navigate]);

  // Show loading state while workout context is loading
  if (session && workoutLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking for active workouts...</p>
        </div>
      </div>
    );
  }

  // Don't render if we're redirecting
  if (session) {
    return null;
  }

  return (
    <DemoWorkoutProvider>
      {/* Mobile Layout - Only visible on mobile breakpoints */}
      <div className="md:hidden w-full min-h-screen bg-stone-100 flex flex-col pt-20">

        {/* Main Content - Flexible sections */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Text content section - Responsive height */}
          <div className="w-full px-5 py-8 flex flex-col justify-center items-start gap-2.5 min-h-[380px]">
            <div className="w-full max-w-[400px] flex flex-col justify-start items-start gap-2">
              <div className="self-stretch justify-start text-neutral-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-loose">Log workouts effortlessly.</div>
              <div className="self-stretch justify-start text-neutral-neutral-500 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Enter your routine and start a workout. Never miss an exercise and monitor your progress with AI.</div>
            </div>
          </div>

          {/* Demo workout section - fills remaining space, prevents overflow */}
          <div className="w-full px-5 outline outline-1 outline-neutral-neutral-300 flex-1 min-h-0 overflow-hidden">
            <DemoWorkoutSection />
          </div>
        </div>

        {/* Footer - Fixed height */}
        <div className="w-full h-[152px] px-3 pt-3 pb-[100px] bg-white border-t border-neutral-neutral-300 flex flex-col justify-start items-start gap-3">
          <div className="self-stretch min-w-36 justify-start text-neutral-neutral-500 text-xs font-bold font-['Be_Vietnam_Pro'] leading-none">Developed by Lassor</div>
          <div className="self-stretch flex flex-col justify-start items-start gap-1">
            <div className="self-stretch justify-start text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">www.Lassor.com</div>
            <div className="w-50 justify-start text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">Feasley@Lassor.com</div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Hidden on mobile, visible on md+ breakpoints */}
      <div className="hidden md:block w-full bg-stone-100 pt-20">

        {/* Main Content - at least viewport height minus navbar; footer flows below */}
        <div
          className="w-full max-w-[1643px] mx-auto px-16 flex justify-center items-stretch gap-6 md:gap-12 lg:gap-24 min-h-0"
          style={{ minHeight: 'calc(100vh - 44px)' }}
        >
          {/* Demo Workout Section - spans full height */}
          <div className="w-full max-w-[450px] min-w-80 h-full flex flex-col justify-start items-stretch">
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
