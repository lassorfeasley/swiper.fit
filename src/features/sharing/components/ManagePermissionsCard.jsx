import React from "react";
import PropTypes from "prop-types";
import { Trash2, ArrowRight } from "lucide-react";
import SwiperFormSwitch from "@/components/shared/SwiperFormSwitch";
import ActionPill from "@/components/shared/ActionPill";

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
}) => {
  const handlePermissionChange = (permission, value) => {
    onPermissionChange({
      ...permissions,
      [permission]: value
    });
  };

  const formatUserDisplay = (profile) => {
    if (!profile) return "Unknown User";
    const firstName = profile.first_name?.trim() || "";
    const lastName = profile.last_name?.trim() || "";
    const email = profile.email || "";
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return email;
  };

  const displayName = typeof name === 'string' ? name : formatUserDisplay(name);

  return (
    <div className={`w-full bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 inline-flex flex-col justify-start items-start overflow-hidden ${className}`}>
      {/* Card Header */}
      <div className="CardHeader self-stretch p-3 inline-flex justify-between items-center">
        <div className="Frame84 flex-1 flex justify-start items-center gap-3">
          <div className="justify-center text-neutral-neutral-700 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">
            {displayName}
          </div>
        </div>
        <ActionPill
          onClick={onRemove}
          Icon={Trash2}
          showText={false}
          color="neutral"
          iconColor="neutral"
          fill={false}
        />
      </div>

      {/* Permissions Section */}
      <div className="Frame79 self-stretch flex flex-col justify-start items-start gap-4">
        <div className={`TrainerPermissions self-stretch ${variant === 'client' ? 'border-t border-neutral-neutral-300' : 'outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300'} flex flex-col justify-start items-start overflow-hidden`}>
          {variant === "trainer" ? (
            <>
              {/* Trainer (Account Manager) Permissions - Switches */}
              <div className="self-stretch bg-white">
                <SwiperFormSwitch
                  label="Create and edit routines"
                  checked={permissions.can_create_routines}
                  onCheckedChange={(value) => handlePermissionChange('can_create_routines', value)}
                />
              </div>
              <div className="self-stretch bg-neutral-Neutral-50">
                <SwiperFormSwitch
                  label="Start workouts"
                  checked={permissions.can_start_workouts}
                  onCheckedChange={(value) => handlePermissionChange('can_start_workouts', value)}
                />
              </div>
              <div className="self-stretch bg-white">
                <SwiperFormSwitch
                  label="Review history"
                  checked={permissions.can_review_history}
                  onCheckedChange={(value) => handlePermissionChange('can_review_history', value)}
                />
              </div>
            </>
          ) : (
            <>
              {/* Client (Account Owner) Actions - Action Pills */}
              <div 
                className="InputWrapper self-stretch h-14 p-3 bg-white inline-flex justify-center items-center cursor-pointer"
                onClick={() => permissions.can_start_workouts && onStartWorkout()}
              >
                <div className="Frame75 flex-1 flex justify-start items-center gap-5">
                  <div className="Frame74 flex-1 inline-flex flex-col justify-center items-start">
                    <div className="self-stretch justify-center text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                      {activeWorkout ? 'Join active workout' : 'Start a workout'}
                    </div>
                  </div>
                </div>
                <div className="LucideIcon w-6 h-6 flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-neutral-neutral-700" strokeWidth={2} />
                </div>
              </div>
              <div 
                className="InputWrapper self-stretch h-14 p-3 bg-neutral-Neutral-50 inline-flex justify-center items-center cursor-pointer"
                onClick={() => permissions.can_create_routines && onCreateRoutines()}
              >
                <div className="Frame75 flex-1 flex justify-start items-center gap-5">
                  <div className="Frame74 flex-1 inline-flex flex-col justify-center items-start">
                    <div className="self-stretch justify-center text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                      Create or edit routines
                    </div>
                  </div>
                </div>
                <div className="LucideIcon w-6 h-6 flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-neutral-neutral-700" strokeWidth={2} />
                </div>
              </div>
              <div 
                className="InputWrapper self-stretch h-14 p-3 bg-white inline-flex justify-center items-center cursor-pointer"
                onClick={() => permissions.can_review_history && onReviewHistory()}
              >
                <div className="Frame75 flex-1 flex justify-start items-center gap-5">
                  <div className="Frame74 flex-1 inline-flex flex-col justify-center items-start">
                    <div className="self-stretch justify-center text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                      Review {displayName.split(' ')[0]}'s history
                    </div>
                  </div>
                </div>
                <div className="LucideIcon w-6 h-6 flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-neutral-neutral-700" strokeWidth={2} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

ManagePermissionsCard.propTypes = {
  variant: PropTypes.oneOf(["trainer", "client"]),
  name: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  permissions: PropTypes.shape({
    can_create_routines: PropTypes.bool,
    can_start_workouts: PropTypes.bool,
    can_review_history: PropTypes.bool
  }),
  onPermissionChange: PropTypes.func,
  onRemove: PropTypes.func,
  onStartWorkout: PropTypes.func,
  onCreateRoutines: PropTypes.func,
  onReviewHistory: PropTypes.func,
  activeWorkout: PropTypes.object,
  className: PropTypes.string
};

export default ManagePermissionsCard;
