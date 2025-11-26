import React, { useState, useEffect } from "react";
import SwiperDialog from "@/components/shared/SwiperDialog";
import SwiperFormSwitch from "@/components/shared/SwiperFormSwitch";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "trainer" | "client";
  onSubmit: (email: string, permissions: any) => void;
  onCancel: () => void;
}

const InviteDialog: React.FC<InviteDialogProps> = ({
  open,
  onOpenChange,
  type,
  onSubmit,
  onCancel,
}) => {
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState({
    can_create_routines: true,
    can_start_workouts: true,
    can_review_history: true,
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setEmail("");
      setPermissions({
        can_create_routines: true,
        can_start_workouts: true,
        can_review_history: true,
      });
    }
  }, [open]);

  const handlePermissionToggle = (permission: keyof typeof permissions, value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [permission]: value,
    }));
  };

  const handleSubmit = () => {
    if (!email.trim()) return;
    onSubmit(email, permissions);
  };

  const copy = {
    trainer: {
      title: "Invite a trainer",
      description: null,
      emailLabel: "Trainer's email",
      buttonLabel: "Invite someone to manage you",
    },
    client: {
      title: "Invite a client",
      description: null,
      emailLabel: "Client's email",
      buttonLabel: "Invite someone you manage",
    },
  };

  const currentCopy = copy[type];

  return (
    <SwiperDialog
      open={open}
      onOpenChange={onOpenChange}
      title={currentCopy.title}
      confirmText={type === "trainer" ? "Invite trainer" : "Invite client"}
      cancelText="Cancel"
      confirmVariant="default"
      cancelVariant="outline"
      onConfirm={handleSubmit}
      onCancel={onCancel}
      containerClassName="bg-stone-100"
    >
      <div className="self-stretch flex flex-col justify-start items-start gap-0">
        <div className="self-stretch min-w-64 rounded flex flex-col justify-center items-start gap-2">
          <div className="self-stretch inline-flex justify-start items-start gap-2">
            <div className="flex-1 flex justify-between items-start">
              <div className="flex-1 justify-start text-neutral-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-3">
                {currentCopy.emailLabel}
              </div>
            </div>
          </div>
          <div className="self-stretch h-11 pl-3 bg-white rounded-lg border border-neutral-300 inline-flex justify-center items-center gap-2.5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="flex-1 justify-center text-neutral-neutral-700 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight bg-transparent border-none outline-none"
            />
          </div>
        </div>
      </div>
      <div className="self-stretch flex flex-col justify-start items-start gap-0">
        {currentCopy.description && (
          <div className="text-sm text-neutral-500 mb-3">
            {currentCopy.description}
          </div>
        )}
        <div className="self-stretch rounded-lg border border-neutral-300 flex flex-col justify-start items-start overflow-hidden">
          {/* Permissions are the same for both types in the current UI, but wrapped differently? No, seems identical structure */}
          <div className="self-stretch rounded-lg border border-neutral-300 flex flex-col justify-start items-start overflow-hidden">
            <SwiperFormSwitch
              label="Create or edit routines"
              checked={permissions.can_create_routines}
              onCheckedChange={(checked) => handlePermissionToggle("can_create_routines", checked)}
              className="bg-white"
            />
            <SwiperFormSwitch
              label="Start a workout"
              checked={permissions.can_start_workouts}
              onCheckedChange={(checked) => handlePermissionToggle("can_start_workouts", checked)}
              className="bg-neutral-Neutral-50"
            />
            <SwiperFormSwitch
              label="Review history"
              checked={permissions.can_review_history}
              onCheckedChange={(checked) => handlePermissionToggle("can_review_history", checked)}
              className="bg-white"
            />
          </div>
        </div>
      </div>
      <div className="self-stretch justify-center text-neutral-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-3 mt-3">
        This invitation will expire in 14 days.
      </div>
    </SwiperDialog>
  );
};

export default InviteDialog;

