import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/supabaseClient";
import { TextInput } from "@/components/molecules/text-input";
import { SwiperButton } from "@/components/molecules/swiper-button";
import SwiperForm from "@/components/molecules/swiper-form";
import ToggleInput from "@/components/molecules/toggle-input";
import { toast } from "sonner";

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

  const handleSaveEmail = async () => {
    try {
      const { data, error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      setUser(data.user);
      setDirtyEmail(false);
      toast.success("Email updated. Please check your inbox to confirm.");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleUpdatePassword = async () => {
    const newPassword = prompt("Enter a new password (min 6 chars)");
    if (!newPassword) return;
    if (newPassword.length < 6) {
      toast.error("Password too short");
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated");
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

  if (loading) {
    return (
      <AppLayout appHeaderTitle="Account">
        <div className="p-6">Loading…</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout appHeaderTitle="Account">
      <SwiperForm.Section>
        <TextInput
          label="First name"
          value={firstName}
          onChange={(e) => {
            setFirstName(e.target.value);
            setDirtyName(true);
          }}
        />
        <TextInput
          label="Last name"
          value={lastName}
          onChange={(e) => {
            setLastName(e.target.value);
            setDirtyName(true);
          }}
        />
        <SwiperButton
          variant="default"
          onClick={handleSaveName}
          disabled={!dirtyName}
          className="w-full"
        >
          Save name
        </SwiperButton>
      </SwiperForm.Section>

      <SwiperForm.Section>
        <TextInput
          label="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setDirtyEmail(true);
          }}
        />
        <SwiperButton
          variant="default"
          onClick={handleSaveEmail}
          disabled={!dirtyEmail}
          className="w-full"
        >
          Save email
        </SwiperButton>
      </SwiperForm.Section>

      <SwiperForm.Section>
        <SwiperButton
          variant="secondary"
          onClick={handleUpdatePassword}
          className="w-full"
        >
          Change password
        </SwiperButton>
      </SwiperForm.Section>

      <SwiperForm.Section bordered={false}>
        <SwiperButton
          variant="destructive"
          onClick={handleDeleteAccount}
          className="w-full"
        >
          Delete account
        </SwiperButton>
      </SwiperForm.Section>
    </AppLayout>
  );
};

export default Account; 