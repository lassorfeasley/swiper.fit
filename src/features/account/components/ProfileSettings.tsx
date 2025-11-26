import React, { useState, useEffect } from "react";
import { Button } from "@/components/shadcn/button";
import EditableTextInput from "@/components/shared/inputs/EditableTextInput";
import { supabase } from "@/supabaseClient";
import { toast } from "@/lib/toastReplacement";

interface ProfileSettingsProps {
  user: any;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user }) => {
  const [profile, setProfile] = useState({ first_name: "", last_name: "" });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      if (profileErr && profileErr.code === "PGRST116") {
        await supabase.from("profiles").insert({ id: user.id });
      }

      if (profileData) {
        setProfile(profileData);
        setFirstName(profileData.first_name || "");
        setLastName(profileData.last_name || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user?.id]);

  const handleSaveName = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ first_name: firstName, last_name: lastName })
        .eq("id", user.id);
      if (error) throw error;
      setProfile({ first_name: firstName, last_name: lastName });
      setIsEditingName(false);
      toast.success("Name updated");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading profile...</div>;
  }

  return (
    <div className="w-full flex justify-center pb-5">
      <div className="w-full max-w-[500px] pt-5 pb-10 flex flex-col justify-start items-start gap-3">
        <div className="CardWrapper w-full p-5 bg-white rounded-lg border border-neutral-300 flex flex-col justify-center items-center gap-5">
          {/* First Name Field */}
          <EditableTextInput
            label="First name"
            value={firstName}
            onChange={(value) => setFirstName(value)}
            editing={isEditingName}
            onActivate={() => setIsEditingName(true)}
            className="w-full"
          />

          {/* Last Name Field */}
          <EditableTextInput
            label="Last name"
            value={lastName}
            onChange={(value) => setLastName(value)}
            editing={isEditingName}
            onActivate={() => setIsEditingName(true)}
            className="w-full"
          />

          {/* Action Buttons */}
          {isEditingName && (
            <div className="flex flex-col gap-3 w-full">
              <Button
                className="w-full"
                onClick={handleSaveName}
              >
                Save changes
              </Button>
              <Button
                className="w-full"
                onClick={() => {
                  setFirstName(profile.first_name || "");
                  setLastName(profile.last_name || "");
                  setIsEditingName(false);
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

export default ProfileSettings;

