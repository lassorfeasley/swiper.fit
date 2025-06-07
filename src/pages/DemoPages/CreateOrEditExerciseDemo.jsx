import React, { useEffect } from "react";
import AppHeader from "../../components/layout/AppHeader";
import ExerciseSetConfiguration from "../../components/common/forms/compound-fields/ExerciseSetConfiguration";
import { useNavBarVisibility } from "../../NavBarVisibilityContext";
import CardWrapper from "../../components/common/CardsAndTiles/Cards/CardWrapper";

const CreateOrEditExerciseDemo = () => {
  const { setNavBarVisible } = useNavBarVisibility();

  useEffect(() => {
    setNavBarVisible(false);
    return () => setNavBarVisible(true);
  }, [setNavBarVisible]);

  return (
    <>
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
      <div style={{ height: 140 }} />
      <CardWrapper>
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Placeholder for main content */}
        </div>
        <ExerciseSetConfiguration
          formPrompt="Create a new exercise"
          actionIconName="arrow_forward"
          onActionIconClick={() => alert("Action icon clicked!")}
        />
      </CardWrapper>
    </>
  );
};

export default CreateOrEditExerciseDemo;
