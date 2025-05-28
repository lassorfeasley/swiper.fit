import React, { useEffect } from 'react';
import AppHeader from '../components/layout/AppHeader';
import ExerciseSetConfiguration from '../components/common/forms/compound-fields/exercise_set_configuration';
import { useNavBarVisibility } from '../NavBarVisibilityContext';

const CreateOrEditExerciseDemo = () => {
  const { setNavBarVisible } = useNavBarVisibility();

  useEffect(() => {
    setNavBarVisible(false);
    return () => setNavBarVisible(true);
  }, [setNavBarVisible]);

  return (
    <div className="min-h-screen bg-[#f5f5fa] flex flex-col w-full relative">
      <AppHeader
        appHeaderTitle="Create or Edit Exercise Demo"
        subheadText="Demo for exercise creation form development"
        showBackButton={true}
        showActionBar={false}
        showActionIcon={false}
        subhead={true}
        search={false}
        onBack={() => window.history.back()}
      />
      <div className="flex-1 flex flex-col items-center justify-center">
         {/* Placeholder for main content */}
      </div>
      <ExerciseSetConfiguration
         formPrompt="Create a new exercise"
         actionIconName="arrow_forward"
         onActionIconClick={() => alert("Action icon clicked!")}
      />
    </div>
  );
};

export default CreateOrEditExerciseDemo; 