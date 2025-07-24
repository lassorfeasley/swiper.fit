// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=107-1611

import AppLayout from "@/components/layout/AppLayout";
import PageSectionWrapper from "@/components/common/Cards/Wrappers/PageSectionWrapper";
import { Alert, AlertTitle } from "@/components/atoms/alert";
import { Button } from "@/components/atoms/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/supabaseClient";
import SetCard from "@/components/common/CardsAndTiles/Cards/Library/SetCard";

const Home = () => {
  const { user } = useAuth();
  const email = user?.email || "Unknown";
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // Demo data for showcasing the app
  const demoSetConfigs = [
    { reps: 12, weight: 135, unit: 'lbs', set_type: 'reps' },
    { reps: 10, weight: 155, unit: 'lbs', set_type: 'reps' },
    { reps: 8, weight: 175, unit: 'lbs', set_type: 'reps' }
  ];

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
        <div data-layer="Build strength without losing focus." className="BuildStrengthWithoutLosingFocus w-full justify-center text-neutral-600 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-normal">Build strength without losing focus.</div>
        <div data-layer="Enter your routines, start a workout, and 'swipe' sets to log them complete." className="EnterYourRoutinesStartAWorkoutAndSwipeSetsToLogThemComplete w-full justify-center text-neutral-700 text-base font-normal font-['Be_Vietnam_Pro'] leading-tight">Enter your routines, start a workout, and 'swipe' sets to log them complete.</div>
        <div data-layer="Frame5" className="self-stretch flex flex-wrap gap-5 justify-start items-start">
          <div data-layer="Frame 4" className="Frame4 w-full max-w-[350px] p-3 rounded-lg border border-neutral-300 inline-flex flex-col justify-start items-start gap-2">
            <div data-layer="Create a routine" className="CreateARoutine self-stretch justify-center text-neutral-500 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">Create a routine</div>
            <div data-layer="Navigate to the routines page and click '+' to create a routine. Add some exercises." className="NavigateToTheRoutinesPageAndClickToCreateARoutineAddSomeExercises self-stretch justify-center text-neutral-700 text-sm font-medium font-['Be_Vietnam_Pro'] leading-[20px]">Navigate to the routines page and click '+' to create a routine. Add some exercises.</div>
          </div>
          <div data-layer="Frame 2" className="Frame2 w-full max-w-[350px] p-3 rounded-lg border border-neutral-300 inline-flex flex-col justify-start items-start gap-2">
            <div data-layer="Record a workout" className="CreateARoutine self-stretch justify-center text-neutral-500 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">Record a workout</div>
            <div data-layer="Tap 'Record a workout'. Select a routine. Workout, and 'Swipe' sets complete as you work." className="NavigateToTheRoutinesPageAndClickToCreateARoutineAddSomeExercises self-stretch justify-center text-neutral-700 text-sm font-medium font-['Be_Vietnam_Pro'] leading-[20px]">Tap 'Record a workout'. Select a routine. Workout, and 'Swipe' sets complete as you work.</div>
          </div>
          <div data-layer="Frame 3" className="Frame3 w-full max-w-[350px] p-3 rounded-lg border border-neutral-300 inline-flex flex-col justify-start items-start gap-2">
            <div data-layer="Save to history" className="CreateARoutine self-stretch justify-center text-neutral-500 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">Save to history</div>
            <div data-layer="End the workout to permanently log your sets to 'History'. Review and share your stats." className="NavigateToTheRoutinesPageAndClickToCreateARoutineAddSomeExercises self-stretch justify-center text-neutral-700 text-sm font-medium font-['Be_Vietnam_Pro'] leading-[20px]">End the workout to permanently log your sets to 'History'. Review and share your stats.</div>
          </div>
        </div>

        {/* Demo Section */}
        <div className="w-full mt-8">
          <div className="text-neutral-600 text-xl font-bold font-['Be_Vietnam_Pro'] leading-normal mb-4">Try it out:</div>
          <div className="text-neutral-700 text-base font-normal font-['Be_Vietnam_Pro'] leading-tight mb-6">Swipe the sets below to see how it works. This is a demo - no data will be saved.</div>
          
          <div className="space-y-4">
            <SetCard
              exerciseName="Bench Press"
              setConfigs={demoSetConfigs}
              exerciseId="demo-bench"
              demo={true}
              onSetComplete={(data) => {
                console.log('Demo set completed:', data);
              }}
            />
            
            <SetCard
              exerciseName="Squats"
              setConfigs={[
                { reps: 15, weight: 95, unit: 'lbs', set_type: 'reps' },
                { reps: 12, weight: 115, unit: 'lbs', set_type: 'reps' },
                { reps: 10, weight: 135, unit: 'lbs', set_type: 'reps' }
              ]}
              exerciseId="demo-squats"
              demo={true}
              onSetComplete={(data) => {
                console.log('Demo set completed:', data);
              }}
            />
          </div>
        </div>

        <div data-layer="Swiper was designed by Lassor Feasley and is in active development. Contact him at Feasley@Lassor.com." className="SwiperWasDesignedByLassorFeasleyAndIsInActiveDevelopmentContactHimAtFeasleyLassorCom w-full max-w-80 justify-center">
          <span className="text-neutral-700 text-base font-normal font-['Be_Vietnam_Pro'] leading-tight">Swiper was designed by Lassor Feasley and is in active development. Contact him at </span><span className="text-neutral-700 text-base font-normal font-['Be_Vietnam_Pro'] underline leading-tight">Feasley@Lassor.com</span><span className="text-neutral-700 text-base font-normal font-['Be_Vietnam_Pro'] leading-tight">.</span>
      </div>
      </PageSectionWrapper>
    </AppLayout>
  );
};

export default Home;
