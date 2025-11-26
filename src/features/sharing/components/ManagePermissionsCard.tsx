import React, { useState } from "react";
import { Trash2, ArrowRight, ChevronDown } from "lucide-react";
import SwiperFormSwitch from "@/components/shared/SwiperFormSwitch";
import ActionPill from "@/components/shared/ActionPill";
import { useFormatUserDisplay } from "@/hooks/useFormatUserDisplay";

interface ManagePermissionsCardProps {
  variant?: "trainer" | "client";
  name?: string | object;
  permissions?: {
    can_create_routines: boolean;
    can_start_workouts: boolean;
    can_review_history: boolean;
  };
  onPermissionChange?: (permission: string, value: boolean) => void;
  onRemove?: () => void;
  onStartWorkout?: () => void;
  onCreateRoutines?: () => void;
  onReviewHistory?: () => void;
  activeWorkout?: any;
  className?: string;
}

const ManagePermissionsCard = ({
  variant = "trainer", // "trainer" (account manager) or "client" (account owner)
  name = "John Smith",
  permissions = {
    can_create_routines: true,
    can_start_workouts: true,
    can_review_history: true
  },
  onPermissionChange = () => {},
  onRemove = () => {},
  onStartWorkout = () => {},
  onCreateRoutines = () => {},
  onReviewHistory = () => {},
  activeWorkout = null, // Add activeWorkout prop
  className = ""
}: ManagePermissionsCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const formatUserDisplay = useFormatUserDisplay();

  const handlePermissionChange = (permission: string, value: boolean) => {
    onPermissionChange(permission, value);
  };

  const displayName = typeof name === 'string' ? name : formatUserDisplay(name);

  return (
    <div className={`w-full bg-white rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 inline-flex flex-col justify-start items-start overflow-hidden ${className}`}>
      {/* Card Header */}
      <div 
        className="CardHeader self-stretch h-12 p-3 rounded-sm inline-flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="JohnSmith justify-center text-neutral-neutral-700 text-sm font-semibold font-['Be_Vietnam_Pro'] leading-5">
          {displayName}
        </div>
        <div data-svg-wrapper data-layer="lucide-icon" data-icon="chevron-down" className="LucideIcon relative">
          <ChevronDown 
            className={`w-6 h-6 text-neutral-neutral-700 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            strokeWidth={2}
          />
        </div>
      </div>

      {/* Permissions Section */}
      {variant === "trainer" ? (
        isExpanded && (
          <div data-layer="permission rows" data-property-1="Default" className="PermissionRows self-stretch bg-white outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex flex-col justify-start items-start overflow-hidden">
            <div data-layer="selections" data-property-1="Switch" className="Selections self-stretch h-14 p-3 inline-flex justify-end items-center gap-2.5">
              <SwiperFormSwitch
                label="Create and edit routines"
                checked={permissions.can_create_routines}
                onCheckedChange={(value) => handlePermissionChange('can_create_routines', value)}
                labelClassName="text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3"
                className="w-full h-auto p-0"
              />
            </div>
            <div data-layer="selections" data-property-1="Switch" className="Selections self-stretch h-14 p-3 bg-neutral-Neutral-50 inline-flex justify-end items-center gap-2.5">
              <SwiperFormSwitch
                label="Start workouts"
                checked={permissions.can_start_workouts}
                onCheckedChange={(value) => handlePermissionChange('can_start_workouts', value)}
                labelClassName="text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3"
                className="w-full h-auto p-0"
              />
            </div>
            <div data-layer="selections" data-property-1="Switch" className="Selections self-stretch h-14 p-3 inline-flex justify-end items-center gap-2.5">
              <SwiperFormSwitch
                label="Review history"
                checked={permissions.can_review_history}
                onCheckedChange={(value) => handlePermissionChange('can_review_history', value)}
                labelClassName="text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3"
                className="w-full h-auto p-0"
              />
            </div>
            <div 
              data-layer="selections" 
              data-property-1="labeled-icon" 
              className="Selections self-stretch h-14 p-3 bg-neutral-Neutral-50 inline-flex justify-end items-center gap-2.5 cursor-pointer"
              onClick={onRemove}
            >
              <div data-layer="text" className="Text flex-1 justify-center text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3">Remove trainer</div>
              <div data-svg-wrapper data-layer="lucide-icon" data-icon="trash-2" className="LucideIcon relative">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 11V17M14 11V17M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M3 6H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="var(--neutral-neutral-500, #737373)" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        )
      ) : (
        isExpanded && (
          <div data-layer="permission rows" data-property-1="manager" className="PermissionRows self-stretch bg-white border-t border-neutral-neutral-300 flex flex-col justify-start items-start overflow-hidden">
            <div 
              data-layer="selections" 
              data-property-1="labeled-icon" 
              className="Selections self-stretch h-14 p-3 inline-flex justify-end items-center gap-2.5 cursor-pointer"
              onClick={() => permissions.can_start_workouts && onStartWorkout()}
            >
              <div data-layer="text" className="Text flex-1 justify-center text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3">
                {activeWorkout ? 'Join active workout' : 'Start a workout'}
              </div>
              <div data-svg-wrapper data-layer="lucide-icon" data-icon="arrow-right" className="LucideIcon relative">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="var(--neutral-neutral-500, #737373)" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div 
              data-layer="selections" 
              data-property-1="labeled-icon" 
              className="Selections self-stretch h-14 p-3 bg-neutral-Neutral-50 inline-flex justify-end items-center gap-2.5 cursor-pointer"
              onClick={() => permissions.can_create_routines && onCreateRoutines()}
            >
              <div data-layer="text" className="Text flex-1 justify-center text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3">Create or edit routines</div>
              <div data-svg-wrapper data-layer="lucide-icon" data-icon="arrow-right" className="LucideIcon relative">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="var(--neutral-neutral-500, #737373)" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div 
              data-layer="selections" 
              data-property-1="labeled-icon" 
              className="Selections self-stretch h-14 p-3 inline-flex justify-end items-center gap-2.5 cursor-pointer"
              onClick={() => permissions.can_review_history && onReviewHistory()}
            >
              <div data-layer="text" className="Text flex-1 justify-center text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3">Review history</div>
              <div data-svg-wrapper data-layer="lucide-icon" data-icon="arrow-right" className="LucideIcon relative">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="var(--neutral-neutral-500, #737373)" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div 
              data-layer="selections" 
              data-property-1="labeled-icon" 
              className="Selections self-stretch h-14 p-3 bg-neutral-Neutral-50 inline-flex justify-end items-center gap-2.5 cursor-pointer"
              onClick={onRemove}
            >
              <div data-layer="text" className="Text flex-1 justify-center text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3">Remove client</div>
              <div data-svg-wrapper data-layer="lucide-icon" data-icon="trash-2" className="LucideIcon relative">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 11V17M14 11V17M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M3 6H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="var(--neutral-neutral-500, #737373)" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default ManagePermissionsCard;
