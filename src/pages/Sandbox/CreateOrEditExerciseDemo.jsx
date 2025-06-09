import React, { useEffect, useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import { useNavBarVisibility } from '@/contexts/NavBarVisibilityContext';
import CardWrapper from '@/components/common/Cards/Wrappers/CardWrapper';
import MainContainer from "@/components/layout/MainContainer";
import AddNewExerciseForm from "@/components/common/forms/AddNewExerciseForm";

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
        <AddNewExerciseForm
          formPrompt="Create a new exercise"
          onActionIconClick={() => alert("Action icon clicked!")}
        />
      </CardWrapper>
    </>
  );
};

export default CreateOrEditExerciseDemo;
