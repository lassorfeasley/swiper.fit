import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/supabaseClient";
import { TextInput } from "@/components/molecules/text-input";
import { SwiperButton } from "@/components/molecules/swiper-button";
import SectionWrapperLabel from "@/components/common/Cards/Wrappers/SectionWrapperLabel";
import ToggleInput from "@/components/molecules/toggle-input";
import { toast } from "sonner";
import EditableTextInput from "@/components/molecules/editable-text-input";
import { Eye, EyeOff } from "lucide-react";
import SwiperAlertDialog from "@/components/molecules/swiper-alert-dialog";

const Account = () => {
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

  return (
    <AppLayout title="Account" hideHeader>
      {/* Container to ensure last section fills viewport */}
      <div className="flex flex-col h-full">
        <div className="self-stretch bg-white shadow-[0px_0px_20px_0px_rgba(64,64,64,0.20)] border-b border-neutral-100 flex flex-col justify-start items-center">
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
          <div className="self-stretch px-5 pt-10 pb-14 flex flex-col items-center gap-10">
            <div className="w-full max-w-[800px] grid grid-cols-1 md:grid-cols-2 gap-5">
              <EditableTextInput
                label="First name"
                value={firstName}
                onChange={(val) => {
                  setFirstName(val);
                  setDirtyName(true);
                }}
                editing={isEditingName}
                onActivate={() => setIsEditingName(true)}
              />
              <EditableTextInput
                label="Last name"
                value={lastName}
                onChange={(val) => {
                  setLastName(val);
                  setDirtyName(true);
                }}
                editing={isEditingName}
                onActivate={() => setIsEditingName(true)}
              />
            </div>
          </div>
        </div>

        <div className="self-stretch bg-white shadow-[0px_0px_20px_0px_rgba(64,64,64,0.20)] border-b border-neutral-100 flex flex-col justify-start items-center">
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
          <div className="self-stretch px-5 pt-10 pb-14 flex flex-col items-center gap-10">
            <div className="w-full max-w-[800px] grid grid-cols-1 md:grid-cols-2 gap-5">
              <EditableTextInput
                label="Email"
                value={email}
                onChange={(val) => {
                  setEmail(val);
                  setDirtyEmail(true);
                }}
                editing={isEditingLogin}
                onActivate={() => setIsEditingLogin(true)}
                inputProps={{ type: "email", placeholder: "Enter your email" }}
              />
              <EditableTextInput
                label="Password"
                value={newPassword}
                onChange={setNewPassword}
                editing={isEditingLogin}
                onActivate={() => setIsEditingLogin(true)}
                inputProps={{
                  type: showPasswordLogin ? "text" : "password",
                  placeholder: "",
                  icon: showPasswordLogin ? (
                    <Eye
                      className="size-6 text-neutral-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPasswordLogin(false);
                      }}
                    />
                  ) : (
                    <EyeOff
                      className="size-6 text-neutral-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPasswordLogin(true);
                      }}
                    />
                  ),
                }}
              />
            </div>
          </div>
        </div>

        <div className="self-stretch bg-white shadow-[0px_0px_20px_0px_rgba(64,64,64,0.20)] border-b border-neutral-100 flex flex-col justify-start items-center flex-1">
          <SectionWrapperLabel>Account</SectionWrapperLabel>
          <div className="self-stretch px-5 pt-10 pb-14 flex flex-col items-center gap-10">
            <div className="w-full max-w-[800px] grid grid-cols-1 md:grid-cols-2 gap-5">
              <SwiperButton onClick={handleLogout} className="w-full">
                Log out
              </SwiperButton>
              <SwiperButton variant="destructive" onClick={() => setDeleteConfirmOpen(true)} className="w-full">
                Delete account
              </SwiperButton>
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