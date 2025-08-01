import React, { useEffect, useState } from "react";
import { useAccount } from "@/contexts/AccountContext";
import { Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/supabaseClient";
import { TextInput } from "@/components/molecules/text-input";
import { SwiperButton } from "@/components/molecules/swiper-button";
import SectionWrapperLabel from "@/components/common/Cards/Wrappers/SectionWrapperLabel";
import ToggleInput from "@/components/molecules/toggle-input";
import { toast } from "sonner";
import EditableTextInput from "@/components/molecules/editable-text-input";
import { Eye, EyeOff, Pencil } from "lucide-react";
import SwiperAlertDialog from "@/components/molecules/swiper-alert-dialog";

const Account = () => {
  const { isDelegated } = useAccount();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ first_name: "", last_name: "" });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [dirtyName, setDirtyName] = useState(false);
  const [dirtyEmail, setDirtyEmail] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  // Section edit state for Personal information
  const [isEditingName, setIsEditingName] = useState(false);
  // Section edit state for Login and password
  const [isEditingLogin, setIsEditingLogin] = useState(false);
  // Temporary new password before save
  const [newPassword, setNewPassword] = useState("");
  // Toggle password visibility in edit mode
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);

  // redirect rendered later to keep hook order

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }
      setUser(authUser);
      setEmail(authUser.email || "");

      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", authUser.id)
        .single();

      if (profileErr && profileErr.code === "PGRST116") {
        // No profile row yet – create one
        await supabase.from("profiles").insert({ id: authUser.id });
      }

      if (profileData) {
        setProfile(profileData);
        setFirstName(profileData.first_name || "");
        setLastName(profileData.last_name || "");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Handlers
  const handleSaveName = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ first_name: firstName, last_name: lastName })
        .eq("id", user.id);
      if (error) throw error;
      setProfile({ first_name: firstName, last_name: lastName });
      setDirtyName(false);
      toast.success("Name updated");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleSaveLoginSection = async () => {
    try {
      // Update email if dirty
      if (dirtyEmail) {
        const { data, error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
        setUser(data.user);
        setDirtyEmail(false);
        toast.success("Email updated. Please check your inbox to confirm.");
      }
      // Update password if provided
      if (newPassword) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        toast.success("Password updated");
        setNewPassword("");
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Delete profile row first
      await supabase.from("profiles").delete().eq("id", user.id);
      // Delete auth user via RPC or Admin API — placeholder
      toast.success("Account deletion requested (admin action required)");
    } catch (e) {
      toast.error(e.message);
    }
  };

  // FIRST_EDIT: add logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleConfirmDelete = async () => {
    if (!deletePassword) {
      toast.error("Please enter your password");
      return;
    }
    // TODO: verify password before deletion
    handleDeleteAccount();
    setDeleteConfirmOpen(false);
    setDeletePassword("");
  };

  if (loading) {
    return (
      <AppLayout title="Account" hideHeader>
        <div className="p-6">Loading…</div>
      </AppLayout>
    );
  }

  if (isDelegated) {
    return <Navigate to="/routines" replace />;
  }

  return (
    <AppLayout title="Account" hideHeader>
      <div className="w-full inline-flex flex-col justify-start items-start overflow-hidden">
        {/* Personal Information Section */}
        <div className="self-stretch bg-white flex flex-col justify-center items-center">
          <SectionWrapperLabel
            isEditing={isEditingName}
            onEdit={() => setIsEditingName(true)}
            onCancel={() => {
              setFirstName(profile.first_name);
              setLastName(profile.last_name);
              setDirtyName(false);
              setIsEditingName(false);
            }}
            onSave={() => {
              handleSaveName();
              setIsEditingName(false);
            }}
            isSaveDisabled={!dirtyName}
          >
            Personal information
          </SectionWrapperLabel>
          <div className="self-stretch px-5 flex flex-col justify-start items-center gap-10">
            <div className="w-full max-w-[500px] min-w-80 pt-10 pb-20 border-l border-r border-neutral-300 flex flex-col justify-start items-start">
              <div className="w-full max-w-[800px] p-5 border-t border-b border-neutral-300 flex flex-col justify-center items-center gap-4">
                {/* First Name Field */}
                <EditableTextInput
                  label="First name"
                  value={firstName}
                  onChange={(value) => {
                    setFirstName(value);
                    setDirtyName(true);
                  }}
                  editing={isEditingName}
                  onActivate={() => setIsEditingName(true)}
                  className="w-full"
                />

                {/* Last Name Field */}
                <EditableTextInput
                  label="Last name"
                  value={lastName}
                  onChange={(value) => {
                    setLastName(value);
                    setDirtyName(true);
                  }}
                  editing={isEditingName}
                  onActivate={() => setIsEditingName(true)}
                  className="w-full"
                />

                {/* Action Buttons */}
                {isEditingName && (
                  <>
                    <div 
                      className="self-stretch h-12 px-4 py-2 bg-green-200 outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-green-300"
                      onClick={() => {
                        handleSaveName();
                        setIsEditingName(false);
                      }}
                    >
                      <div className="justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                        Save changes
                      </div>
                    </div>
                    <div 
                      className="self-stretch h-12 px-4 py-2 bg-red-300 inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-red-400"
                      onClick={() => {
                        setFirstName(profile.first_name);
                        setLastName(profile.last_name);
                        setDirtyName(false);
                        setIsEditingName(false);
                      }}
                    >
                      <div className="justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                        Discard changes
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Login and Password Section */}
        <div className="self-stretch bg-white flex flex-col justify-center items-center">
          <SectionWrapperLabel
            isEditing={isEditingLogin}
            onEdit={() => setIsEditingLogin(true)}
            onCancel={() => {
              setEmail(user.email || "");
              setDirtyEmail(false);
              setNewPassword("");
              setIsEditingLogin(false);
            }}
            onSave={() => {
              handleSaveLoginSection();
              setIsEditingLogin(false);
            }}
            isSaveDisabled={!dirtyEmail && !newPassword}
          >
            Login and password
          </SectionWrapperLabel>
          <div className="self-stretch px-5 flex flex-col justify-start items-center gap-10">
            <div className="w-full max-w-[500px] min-w-80 pt-10 pb-20 border-l border-r border-neutral-300 flex flex-col justify-center items-center gap-2.5">
              <div className="w-full max-w-[800px] p-5 border-t border-b border-neutral-300 flex flex-col justify-start items-start gap-5">
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
                  <>
                    <div 
                      className="self-stretch h-12 px-4 py-2 bg-green-200 outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-green-300"
                      onClick={() => {
                        handleSaveLoginSection();
                        setIsEditingLogin(false);
                      }}
                    >
                      <div className="justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                        Save changes
                      </div>
                    </div>
                    <div 
                      className="self-stretch h-12 px-4 py-2 bg-red-300 inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-red-400"
                      onClick={() => {
                        setEmail(user.email || "");
                        setDirtyEmail(false);
                        setNewPassword("");
                        setIsEditingLogin(false);
                      }}
                    >
                      <div className="justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                        Discard changes
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div className="self-stretch bg-white flex flex-col justify-center items-center">
          <SectionWrapperLabel>
            Account
          </SectionWrapperLabel>
          <div className="self-stretch flex flex-col justify-start items-center gap-10">
            <div className="self-stretch flex flex-col justify-start items-center gap-2.5">
              <div className="w-full max-w-[500px] min-w-80 pt-10 pb-20 border-l border-r border-neutral-300 flex flex-col justify-start items-start gap-5">
                <div className="self-stretch p-5 bg-white border-t border-b border-neutral-300 flex flex-col justify-start items-start gap-5">
                  <div 
                    className="self-stretch h-12 px-4 py-2 bg-neutral-600 inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-neutral-700"
                    onClick={handleLogout}
                  >
                    <div className="justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                      Log out
                    </div>
                  </div>
                  <div 
                    className="self-stretch h-12 px-4 py-2 bg-red-400 inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-red-500"
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    <div className="justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                      Delete account
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

      <SwiperAlertDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Confirm account deletion"
        description={
          <>
            <p>Please enter your password to permanently delete your account.</p>
            <TextInput
              label="Password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              customPlaceholder="Enter your password"
            />
          </>
        }
        confirmText="Delete account"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </AppLayout>
  );
};

export default Account; 