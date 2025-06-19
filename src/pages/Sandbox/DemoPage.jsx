import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Sheet, SheetContent } from "@/components/atoms/sheet";
import { Button } from "@/components/atoms/button";
import { Separator } from "@/components/atoms/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import SetBuilderForm from "@/components/common/forms/SetBuilderForm";
import { TextInput } from "@/components/molecules/text-input";
import NumericInput from "@/components/molecules/numeric-input";
import { Repeat2, Weight as WeightIcon } from "lucide-react";
import { SheetHeader, SheetTitle, SheetClose } from "@/components/atoms/sheet";
import { Separator as Divider } from "@/components/atoms/separator";
import useSetConfig from "@/hooks/use-set-config";

const DemoPage = () => {
    const [showSheet, setShowSheet] = useState(false);
    const isMobile = useIsMobile();

    // State for SetBuilderForm demo
    const {
        defaults,
        sets,
        updateDefault,
        updateSetField,
        getSetMerged,
        addSet,
        removeLastSet,
    } = useSetConfig(3);

    const { setType, reps, timedDuration, weight, unit } = defaults;

    // Exercise name and sets inputs
    const [exerciseName, setExerciseName] = useState("");
    const setsCount = sets.length;
    const handleSetsChange = (val)=>{
        if(val>sets.length){
            Array.from({length: val-sets.length}).forEach(()=>addSet());
        } else if(val<sets.length){
            Array.from({length: sets.length-val}).forEach(()=>removeLastSet());
        }
    };
    // after hook declaration
    const { addSet: addSetItem, removeLastSet: removeSetItem } = useSetConfig(0);

    // Edit set sheet
    const [editSheetOpen, setEditSheetOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingName, setEditingName] = useState("");

    // ref to focus exercise name when sheet opens
    const exerciseNameRef = useRef(null);

    // focus on open
    useEffect(() => {
        if (showSheet) {
            setTimeout(() => {
                exerciseNameRef.current?.select?.();
            }, 100);
        }
    }, [showSheet]);

    const handleSetTypeChange = (val) => {
        updateDefault('setType', val);
        if (val === 'timed') {
            updateDefault('timedDuration', 30);
        }
    };

    const handleRepsChange = (val)=> updateDefault('reps', val);
    const handleWeightChange=(val)=> updateDefault('weight', val);
    const handleUnitChange=(val)=> updateDefault('unit', val);
    const handleTimedDurationChange=(val)=> updateDefault('timedDuration', val);

    return (
        <div className="p-8 md:ml-64">
            <Button onClick={() => setShowSheet(true)} className="bg-emerald-500 hover:bg-emerald-600">
                Open Exercise Sheet
            </Button>

            {/* Demo of new scrolling sheet with sticky header */}
            {showSheet && (
                <Sheet open={showSheet} onOpenChange={setShowSheet}>
                    <SheetContent
                        side={isMobile ? "bottom" : "right"}
                        className={
                            isMobile
                                ? "h-[85vh] w-full bg-stone-50 px-0"
                                : "w-[500px] bg-stone-50 px-0 gap-0"
                        }
                    >
                        {/* Sticky header */}
                        <div className="sticky top-0 z-10 bg-stone-50 border-b">
                            <div className="flex items-center justify-between px-6 py-3">
                                <button onClick={() => setShowSheet(false)} className="text-red-600 font-medium">Cancel</button>
                                <h2 className="font-semibold">Create</h2>
                                <button disabled className="text-neutral-400 font-medium">Review</button>
                            </div>
                        </div>

                        {/* Scrollable body */}
                        <div className="flex-1 overflow-y-auto space-y-8 pb-8">
                            {/* Exercise name and Sets section */}
                            <div className="px-6 pt-6 flex flex-col gap-6">
                                <TextInput
                                    label="Exercise name"
                                    value={exerciseName}
                                    onChange={(e)=>setExerciseName(e.target.value)}
                                    ref={exerciseNameRef}
                                    autoFocus
                                />

                                <div className="flex flex-col gap-2 w-full">
                                    <span className="text-slate-600 text-sm font-normal leading-none font-['Space_Grotesk']">Sets</span>
                                    <NumericInput
                                        value={setsCount}
                                        onChange={handleSetsChange}
                                        min={0}
                                        max={99}
                                        unitLabel="Sets"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <Separator />
                            {/* Set Builder Form Demo */}
                            <div className="px-6">
                                <div className="mb-4 text-base font-medium font-['Space_Grotesk'] leading-tight">
                                    <span className="text-slate-600">Set defaults </span>
                                    <span className="text-neutral-300">Initialize sets then configure and name individual sets below.</span>
                                </div>
                                <SetBuilderForm
                                    hideSetVariantInput={true}
                                    hideDivider={true}
                                    set_variant=""
                                    onSetVariantChange={()=>{}}
                                    setType={setType}
                                    onSetTypeChange={handleSetTypeChange}
                                    reps={reps}
                                    timed_set_duration={timedDuration}
                                    onRepsChange={handleRepsChange}
                                    onTimedDurationChange={handleTimedDurationChange}
                                    weight={weight}
                                    unit={unit}
                                    onWeightChange={handleWeightChange}
                                    onUnitChange={handleUnitChange}
                                />
                            </div>
                            <Separator />
                            {/* Customize sets section */}
                            <div className="px-6 pt-5 pb-0 !mt-0 flex flex-col gap-3">
                                <div className="text-base font-medium font-['Space_Grotesk'] leading-tight">
                                    <span className="text-slate-600">Customize sets </span>
                                    <span className="text-neutral-300">Tap a set to name and configure weight, reps, and more.</span>
                                </div>

                                {Array.from({ length: setsCount }).map((_, idx) => (
                                    <div key={idx} className="w-full p-3 rounded-sm outline outline-1 outline-neutral-300 flex justify-between items-center bg-white cursor-pointer" onClick={()=>{
                                        setEditingIndex(idx);
                                        const merged=getSetMerged(idx);
                                        setEditSheetOpen(true);
                                        setEditingName(sets[idx].name || `Set ${idx+1}`);
                                    }}>
                                        <span className="text-slate-600 text-sm font-normal font-['Space_Grotesk'] leading-none">{`Set ${idx + 1}`}</span>
                                        <div className="h-7 min-w-12 bg-neutral-300 rounded-sm outline outline-1 outline-neutral-300 flex items-stretch overflow-hidden">
                                            <div className="px-2 bg-stone-100 flex items-center gap-0.5">
                                                <Repeat2 className="w-4 h-4 text-slate-600" strokeWidth={1.5} />
                                                <span className="text-slate-600 text-sm font-normal leading-tight">{getSetMerged(idx).reps}</span>
                                            </div>
                                            <div className="px-2 bg-stone-100 flex items-center gap-0.5 border-l border-neutral-300">
                                                <WeightIcon className="w-4 h-4 text-slate-600" strokeWidth={1.5} />
                                                <span className="text-slate-600 text-sm font-normal leading-tight">{getSetMerged(idx).unit === 'body' ? 'body' : getSetMerged(idx).weight}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            )}

            {/* Edit Set Sheet */}
            {editSheetOpen && (
                <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
                    <SheetContent
                        side={isMobile ? "bottom" : "right"}
                        className={isMobile ? "h-[85vh] w-full bg-stone-50 px-0" : "w-[500px] bg-stone-50 px-0 gap-0"}
                    >
                        {/* Sticky header for edit */}
                        <div className="sticky top-0 z-10 bg-stone-50 border-b">
                            <div className="flex items-center justify-between px-6 py-3">
                                <button onClick={()=>setEditSheetOpen(false)} className="text-red-500 font-medium">Cancel</button>
                                <h2 className="font-bold text-lg">Edit</h2>
                                <button disabled className="text-neutral-400 font-medium">Confirm</button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
                            <TextInput
                                label="Name set"
                                value={editingName}
                                onChange={(e)=>setEditingName(e.target.value)}
                                customPlaceholder="e.g. Warm-up"
                            />
                            <SetBuilderForm
                                hideSetVariantInput={true}
                                hideDivider={true}
                                set_variant=""
                                onSetVariantChange={()=>{}}
                                setType={getSetMerged(editingIndex).setType}
                                onSetTypeChange={(val)=>updateSetField(editingIndex,'setType',val)}
                                reps={getSetMerged(editingIndex).reps}
                                timed_set_duration={getSetMerged(editingIndex).timedDuration}
                                onRepsChange={(val)=>updateSetField(editingIndex,'reps',val)}
                                onTimedDurationChange={(val)=>updateSetField(editingIndex,'timedDuration',val)}
                                weight={getSetMerged(editingIndex).weight}
                                unit={getSetMerged(editingIndex).unit}
                                onWeightChange={(val)=>updateSetField(editingIndex,'weight',val)}
                                onUnitChange={(val)=>updateSetField(editingIndex,'unit',val)}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            )}
        </div>
    );
};

export default DemoPage;