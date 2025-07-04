// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=107-1611

import AppLayout from "@/components/layout/AppLayout";
import PageSectionWrapper from "@/components/common/Cards/Wrappers/PageSectionWrapper";
import { Alert, AlertTitle } from "@/components/atoms/alert";
import { Button } from "@/components/atoms/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/supabaseClient";

const Home = () => {
  const { user } = useAuth();
  const email = user?.email || "Unknown";
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };
  return (
    <AppLayout
      hideHeader={true}
      reserveSpace={false}
      showAddButton={false}
      showBackButton={false}
      search={false}
      pageContext="default"
    >
      <PageSectionWrapper section="About" deckGap={20} className="min-h-screen">
        <div data-layer="Build strength without losing focus." className="BuildStrengthWithoutLosingFocus w-full max-w-80 justify-center text-neutral-neutral-600 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-normal">Build strength without losing focus.</div>
        <div data-layer="Enter your routines, start a workout, and 'swipe' sets to log them complete." className="EnterYourRoutinesStartAWorkoutAndSwipeSetsToLogThemComplete w-full max-w-80 justify-center text-neutral-neutral-700 text-base font-normal font-['Be_Vietnam_Pro'] leading-tight">Enter your routines, start a workout, and 'swipe' sets to log them complete.</div>
        <div data-layer="Frame5" className="self-stretch flex flex-wrap gap-5 justify-start items-start">
          <div data-layer="Frame 4" className="Frame4 flex-1 h-20 max-w-[500px] min-w-48 p-3 rounded-lg border border-neutral-300 inline-flex flex-col justify-start items-start gap-2">
            <div data-layer="Create a routine" className="CreateARoutine self-stretch justify-center text-neutral-neutral-700 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">Create a routine</div>
            <div data-layer="Navigate to the routines page and click '+' to create a routine. Add some exercises." className="NavigateToTheRoutinesPageAndClickToCreateARoutineAddSomeExercises self-stretch justify-center text-neutral-neutral-700 text-sm font-medium font-['Be_Vietnam_Pro'] leading-none">Navigate to the routines page and click '+' to create a routine. Add some exercises.</div>
          </div>
          <div data-layer="Frame 2" className="Frame2 flex-1 h-24 max-w-[500px] min-w-48 p-3 rounded-lg border border-neutral-300 inline-flex flex-col justify-start items-start gap-2">
            <div data-layer="Record a workout" className="CreateARoutine self-stretch justify-center text-neutral-neutral-700 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">Record a workout</div>
            <div data-layer="Tap 'Record a workout'. Select a routine. Workout, and 'Swipe' sets complete as you work." className="NavigateToTheRoutinesPageAndClickToCreateARoutineAddSomeExercises self-stretch justify-center text-neutral-neutral-700 text-sm font-medium font-['Be_Vietnam_Pro'] leading-none">Tap 'Record a workout'. Select a routine. Workout, and 'Swipe' sets complete as you work.</div>
          </div>
          <div data-layer="Frame 3" className="Frame3 flex-1 h-24 max-w-[500px] min-w-48 p-3 rounded-lg border border-neutral-300 inline-flex flex-col justify-start items-start gap-2">
            <div data-layer="Save to history" className="CreateARoutine self-stretch justify-center text-neutral-neutral-700 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">Save to history</div>
            <div data-layer="End the workout to permanently log your sets to 'History'. Review and share your stats." className="NavigateToTheRoutinesPageAndClickToCreateARoutineAddSomeExercises self-stretch justify-center text-neutral-neutral-700 text-sm font-medium font-['Be_Vietnam_Pro'] leading-none">End the workout to permanently log your sets to 'History'. Review and share your stats.</div>
          </div>
        </div>
        <div data-layer="Swiper was designed by Lassor Feasley and is in active development. Contact him at Feasley@Lassor.com." className="SwiperWasDesignedByLassorFeasleyAndIsInActiveDevelopmentContactHimAtFeasleyLassorCom w-full max-w-80 justify-center">
          <span className="text-neutral-neutral-700 text-base font-normal font-['Be_Vietnam_Pro'] leading-tight">Swiper was designed by Lassor Feasley and is in active development. Contact him at </span><span className="text-neutral-neutral-700 text-base font-normal font-['Be_Vietnam_Pro'] underline leading-tight">Feasley@Lassor.com</span><span className="text-neutral-neutral-700 text-base font-normal font-['Be_Vietnam_Pro'] leading-tight">.</span>
        </div>
      </PageSectionWrapper>
    </AppLayout>
  );
};

export default Home;
