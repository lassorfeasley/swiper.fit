import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { XMarkIcon } from '@heroicons/react/24/outline';
import AppHeader from '@/components/layout/AppHeader';
import MainContainer from '@/components/common/MainContainer';
import { useNavBarVisibility } from '../../NavBarVisibilityContext';
import ExerciseSetForm from '../../components/common/forms/compound-fields/ExerciseSetForm';
import NumericInput from '@/components/common/forms/NumericInput';
import { Input } from "@/components/ui/input";
import Dropdown from '../../components/common/forms/Dropdown';
import SearchField from '../../components/common/forms/SearchField';
import WeightCompoundField from '../../components/common/forms/compound-fields/WeightCompoundField';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const FormFieldDemo = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { setNavBarVisible } = useNavBarVisibility();
  const [formData, setFormData] = useState({
    // Exercise Set Form
    setData: {
      reps: 10,
      weight: 25,
      unit: 'lbs'
    },
    // Weight Compound Field
    weightData: {
      weight: 45,
      unit: 'lbs'
    },
    // Numeric Input
    numericValue: 5,
    // Standalone TextField
    standaloneText: '',
    // Form TextField
    formText: '',
    // Search Input
    searchText: '',
    // Dropdown
    dropdownOpen: false,
  });

  useEffect(() => {
    setNavBarVisible(false);
    return () => setNavBarVisible(true);
  }, [setNavBarVisible]);

  const handleSetDataChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      setData: { ...prev.setData, [field]: value }
    }));
  };

  return (
    <>
      <AppHeader
        appHeaderTitle="Form Field Demo"
        subheadText="Demo for form field development and testing"
        showBackButton={true}
        showActionBar={false}
        showActionIcon={false}
        subhead={true}
        search={false}
        onBack={() => window.history.back()}
      />
      <MainContainer className="pt-4 space-y-4">
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Open Form Demo
        </button>

        <Sheet
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
        >
          <SheetContent className="w-[350px]">
            <SheetHeader>
              <SheetTitle>Form Components Demo</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 mt-4">
              <Input
                label="Standalone Text Field"
                value={formData.standaloneText}
                onChange={(e) => setFormData(prev => ({ ...prev, standaloneText: e.target.value }))}
                placeholder="Enter some text"
              />
              <SearchField
                label="Search"
                value={formData.searchText}
                onChange={(e) => setFormData(prev => ({ ...prev, searchText: e.target.value }))}
                placeholder="Search..."
              />
              <WeightCompoundField
                weight={formData.weightData.weight}
                onWeightChange={(value) => setFormData(prev => ({
                  ...prev,
                  weightData: { ...prev.weightData, weight: value }
                }))}
                unit={formData.weightData.unit}
                onUnitChange={(value) => setFormData(prev => ({
                  ...prev,
                  weightData: { ...prev.weightData, unit: value }
                }))}
                weightLabel="Weight Input"
              />
              <ExerciseSetForm
                setNumber={1}
                initialReps={formData.setData.reps}
                initialWeight={formData.setData.weight}
                initialUnit={formData.setData.unit}
                onRepsChange={(value) => handleSetDataChange('reps', value)}
                onWeightChange={(value) => handleSetDataChange('weight', value)}
                onUnitChange={(value) => handleSetDataChange('unit', value)}
              />
              <NumericInput
                label="Numeric Input"
                value={formData.numericValue}
                onChange={(value) => setFormData(prev => ({ ...prev, numericValue: value }))}
                min={0}
                max={100}
              />
              <Input
                label="Form Text Field"
                value={formData.formText}
                onChange={(e) => setFormData(prev => ({ ...prev, formText: e.target.value }))}
                placeholder="Enter some text"
              />
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Current Values:</h3>
                <pre className="text-sm text-gray-600">
                  {JSON.stringify(formData, null, 2)}
                </pre>
              </div>
            </div>
            <SheetFooter>
              <button
                className="w-full bg-black text-white px-4 py-2 rounded-lg"
                onClick={() => setIsFormOpen(false)}
              >
                Close
              </button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </MainContainer>
    </>
  );
};

export default FormFieldDemo; 