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
import { Repeat2, Weight as WeightIcon, Timer } from "lucide-react";
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

    const { set_type, reps, timed_set_duration, weight, unit } = defaults;

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
    const [editingFields, setEditingFields] = useState({});

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
        updateDefault('set_type', val);
        if (val === 'timed') {
            updateDefault('timed_set_duration', 30);
        }
    };

    const handleRepsChange = (val)=> updateDefault('reps', val);
    const handleWeightChange=(val)=> updateDefault('weight', val);
    const handleUnitChange=(val)=> updateDefault('unit', val);
    const handleTimedDurationChange=(val)=> updateDefault('timed_set_duration', val);

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
                                <button disabled className="text-neutral-400 font-medium">Add</button>
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
                                    setType={set_type}
                                    onSetTypeChange={handleSetTypeChange}
                                    reps={reps}
                                    timed_set_duration={timed_set_duration}
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
                                        setEditingFields({
                                            set_type: merged.set_type,
                                            reps: merged.reps,
                                            timed_set_duration: merged.timed_set_duration,
                                            weight: merged.weight,
                                            unit: merged.unit,
                                            set_variant: sets[idx].set_variant || "",
                                        });
                                        setEditSheetOpen(true);
                                        setEditingName(sets[idx].set_variant || `Set ${idx+1}`);
                                    }}>
                                        <span className="text-slate-600 text-sm font-normal font-['Space_Grotesk'] leading-none">{sets[idx].set_variant || `Set ${idx + 1}`}</span>
                                        <div className="h-7 min-w-12 bg-neutral-300 rounded-sm outline outline-1 outline-neutral-300 flex items-stretch overflow-hidden">
                                            <div className="px-2 bg-stone-100 flex items-center gap-0.5">
                                                {getSetMerged(idx).set_type==='timed'? <Timer className="w-4 h-4 text-slate-600" strokeWidth={1.5}/> : <Repeat2 className="w-4 h-4 text-slate-600" strokeWidth={1.5} />}
                                                <span className="text-slate-600 text-sm font-normal leading-tight">{getSetMerged(idx).set_type==='timed'? getSetMerged(idx).timed_set_duration : getSetMerged(idx).reps}</span>
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
                                <button onClick={()=>{
                                    // save edits
                                    const idx=editingIndex;
                                    const fields=editingFields;
                                    Object.entries(fields).forEach(([k,v])=>updateSetField(idx,k,v));
                                    setEditSheetOpen(false);
                                }} className="text-green-600 font-medium">Save changes</button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
                            <TextInput
                                label="Name set"
                                value={editingName}
                                onChange={(e)=>{setEditingName(e.target.value); setEditingFields(f=>({...f,set_variant:e.target.value}))}}
                                customPlaceholder="e.g. Warm-up"
                            />
                            <SetBuilderForm
                                hideSetVariantInput={true}
                                hideDivider={true}
                                set_variant=""
                                onSetVariantChange={()=>{}}
                                setType={editingFields.set_type}
                                onSetTypeChange={(val)=>setEditingFields(f=>({...f,set_type:val}))}
                                reps={editingFields.reps}
                                timed_set_duration={editingFields.timed_set_duration}
                                onRepsChange={(val)=>setEditingFields(f=>({...f,reps:val}))}
                                onTimedDurationChange={(val)=>setEditingFields(f=>({...f,timed_set_duration:val}))}
                                weight={editingFields.weight}
                                unit={editingFields.unit}
                                onWeightChange={(val)=>setEditingFields(f=>({...f,weight:val}))}
                                onUnitChange={(val)=>setEditingFields(f=>({...f,unit:val}))}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            )}
        </div>
    );
};

export default DemoPage;