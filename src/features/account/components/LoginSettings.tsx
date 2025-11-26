import React, { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { Button } from "@/components/shadcn/button";
import EditableTextInput from "@/components/shared/inputs/EditableTextInput";
import { toast } from "@/lib/toastReplacement";

interface LoginSettingsProps {
  user: any;
}

const LoginSettings: React.FC<LoginSettingsProps> = ({ user }) => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isEditingLogin, setIsEditingLogin] = useState(false);
  const [dirtyEmail, setDirtyEmail] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSaveLoginSection = async () => {
    try {
      if (dirtyEmail) {
        const { data, error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
        // Note: Email update usually requires confirmation, data.user.email might not update immediately
        setEmail(email); 
        setDirtyEmail(false);
        toast.success("Email updated. Please check your inbox to confirm.");
      }
      if (newPassword) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        toast.success("Password updated");
        setNewPassword("");
      }
      setIsEditingLogin(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to update login info");
    }
  };

  return (
    <div className="w-full flex justify-center pb-5">
      <div className="w-full max-w-[500px] pt-5 pb-10 flex flex-col justify-start items-start gap-3">
        <div className="Frame56 w-full p-5 bg-white rounded-lg border border-neutral-300 flex flex-col justify-start items-start gap-5">
          {/* Email Field */}
          <EditableTextInput
            label="Email"
            value={email}
            onChange={(value) => {
              setEmail(value);
              setDirtyEmail(true);
            }}
            editing={isEditingLogin}
            onActivate={() => setIsEditingLogin(true)}
            className="w-full"
          />

          {/* Password Field */}
          <EditableTextInput
            label="Password"
            value="●●●●●●●●●"
            onChange={(value) => {
              setNewPassword(value);
            }}
            editing={isEditingLogin}
            onActivate={() => setIsEditingLogin(true)}
            className="w-full"
            inputProps={{
              type: "password",
              placeholder: "Enter new password"
            }}
          />

          {/* Action Buttons for Login Section */}
          {isEditingLogin && (
            <div className="flex flex-col gap-3 w-full">
              <Button
                className="w-full"
                onClick={handleSaveLoginSection}
              >
                Save changes
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  setEmail(user?.email || "");
                  setDirtyEmail(false);
                  setNewPassword("");
                  setIsEditingLogin(false);
                }}
              >
                Discard changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginSettings;
