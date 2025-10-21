// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=61-389

import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useCurrentUser, useAccount } from "@/contexts/AccountContext";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Share2, Blend, X } from "lucide-react";
import { toast } from "sonner";
import SwiperForm from "@/components/molecules/swiper-form";
import { SwiperButton } from "@/components/molecules/swiper-button";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";
import StaticCard from "@/components/organisms/static-card";
import SwiperFormSwitch from "@/components/molecules/swiper-form-switch";
import { TextInput } from "@/components/molecules/text-input";
import { Copy } from "lucide-react";
import WorkoutHistoryList from "@/components/common/History/WorkoutHistoryList";
import MainContentSection from "@/components/layout/MainContentSection";
import SwiperCombobox from "@/components/molecules/swiper-combobox";
import CompletedWorkoutCard from "@/components/common/Cards/CompletedWorkoutCard";

const History = () => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareAll, setShareAll] = useState(false);
  const [search, setSearch] = useState("");
  const user = useCurrentUser();
  const { isDelegated, switchToUser, actingUser, returnToSelf } = useAccount();
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState("");

  const [hasSwitchedContext, setHasSwitchedContext] = useState(false);

  // Check if we're managing history for an owner (from sharing page) or client (from account page)
  const managingForOwner = location.state?.managingForOwner;
  const managingForClient = location.state?.managingForClient;
  const ownerId = location.state?.ownerId;
  const clientId = location.state?.clientId;
  const ownerNameFromState = location.state?.ownerName;
  const clientNameFromState = location.state?.clientName;

  // Determine whose history we're viewing and whether it's the owner
  const targetUserId = paramUserId || ownerId || clientId || user?.id;
  const viewingOwn = !!user && (!paramUserId || paramUserId === user.id) && !managingForOwner && !managingForClient;

  // Helper to format delegate display name
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

  // Build the sharing nav content for delegates and sharing mode
  const isInSharingMode = isDelegated || managingForOwner || managingForClient;
  const headerSharingContent = isInSharingMode ? (
    <>
      <div className="max-w-[500px] pl-2 pr-5 bg-neutral-950 rounded-[50px] shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] flex justify-start items-center">
        <div className="w-10 h-10 p-2.5 flex justify-start items-center gap-2.5">
          <Blend className="w-6 h-6 text-white" />
        </div>
        <div className="flex justify-center items-center gap-5">
          <div className="justify-center text-white text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
            {isDelegated ? formatUserDisplay(actingUser) : (ownerNameFromState || clientNameFromState || 'User')}
          </div>
        </div>
      </div>
      <button
        type="button"
        aria-label="Exit delegate mode"
        onClick={returnToSelf}
        className="w-10 h-10 p-2 bg-neutral-950 rounded-3xl shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] flex justify-center items-center gap-2"
      >
        <X className="w-6 h-6 text-white" />
      </button>
    </>
  ) : undefined;

  /* ------------------------------------------------------------------
    Handle delegation context when coming from sharing page or account page
  ------------------------------------------------------------------*/
  useEffect(() => {
    if ((managingForOwner || managingForClient) && (ownerId || clientId) && switchToUser && !hasSwitchedContext) {
      const targetId = ownerId || clientId;
      const targetName = ownerNameFromState || clientNameFromState;
      console.log('[History] Switching to context for history:', targetId);
      // Create a mock profile object for the target user
      const targetProfile = {
        id: targetId,
        first_name: targetName?.split(' ')[0] || '',
        last_name: targetName?.split(' ').slice(1).join(' ') || '',
        email: ''
      };
      switchToUser(targetProfile);
      setHasSwitchedContext(true);
    }
  }, [managingForOwner, managingForClient, ownerId, clientId, ownerNameFromState, clientNameFromState, switchToUser, hasSwitchedContext]);

  /* ------------------------------------------------------------------
    Fetch the user's global share preference when Auth state changes
  ------------------------------------------------------------------*/
  useEffect(() => {
    const fetchSharePref = async () => {
      if (!viewingOwn) {
        // Not the owner – global share toggle irrelevant
        setShareAll(false);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("share_all_workouts")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setShareAll(Boolean(data.share_all_workouts));
      } else if (error) {
        if (error.code === "PGRST116") {
          // No profile row yet – create default
          await supabase.from("profiles").insert({ id: user.id });
          setShareAll(false);
        } else {
          console.error("Error fetching share preference:", error);
        }
      }
    };

    fetchSharePref();
  }, [viewingOwn, user]);

  /* ------------------------------------------------------------------
    Handler to update the preference in Supabase and local state
  ------------------------------------------------------------------*/
  const handleToggleShareAll = async (val) => {
    setShareAll(val);
    if (!viewingOwn) return;
    const { error } = await supabase
      .from("profiles")
      .update({ share_all_workouts: val })
      .eq("id", user.id);
    if (error) {
      console.error("Failed to update share preference:", error);
    }
  };

  /* ------------------------------------------------------------------
    Ensure history is public before copying link
  ------------------------------------------------------------------*/
  const ensurePublic = async () => {
    if (!shareAll) {
      await handleToggleShareAll(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await ensurePublic();
      await navigator.clipboard.writeText(`${window.location.origin}/history/public/${targetUserId}`);
      toast.success("Link copied");
    } catch (e) {
      toast.error("Error copying: " + e.message);
    }
  };

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  // Local dialog for sharing history
  const ShareHistoryDialog = ({ open, onOpenChange, isPublic, onTogglePublic, shareUrl, onCopy }) => (
    <SwiperForm
      open={open}
      onOpenChange={onOpenChange}
      title="Share"
      leftAction={() => onOpenChange(false)}
      leftText="Close"
    >
      {/* Description */}
      <SwiperForm.Section bordered={true} className="flex flex-col gap-5">
        <p className="text-base font-medium leading-tight font-vietnam text-slate-600">
          Publish your workout history <span className="text-slate-300">to a public website that anyone you share the link with can view.</span>
        </p>
      </SwiperForm.Section>

      {/* Controls */}
      <SwiperForm.Section bordered={false} className="flex flex-col gap-5">
        <SwiperFormSwitch
          label="Public link"
          checked={isPublic}
          onCheckedChange={onTogglePublic}
        />

        {isPublic && (
          <TextInput
            label="Click to copy"
            value={shareUrl}
            readOnly
            onFocus={(e) => e.target.select()}
            onClick={onCopy}
            icon={<Copy />}
          />
        )}
      </SwiperForm.Section>
    </SwiperForm>
  );

  /* ------------------------------------------------------------------
    Fetch workouts whenever target user changes
  ------------------------------------------------------------------*/
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!targetUserId) {
        setWorkouts([]);
        setLoading(false);
        return;
      }

      // If viewing own history or already delegated (permission already checked), proceed
      if (viewingOwn || isDelegated) {
        const { data: workoutsData, error } = await supabase
          .from("workouts")
          .select("*, routines!fk_workouts__routines(routine_name), sets!fk_sets__workouts(id, exercise_id)")
          .eq("user_id", targetUserId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching workouts:", error);
          setWorkouts([]);
          setLoading(false);
          return;
        }

        const processed = (workoutsData || []).map((w) => ({
          ...w,
          exerciseCount: new Set(w.sets?.map((s) => s.exercise_id) || []).size,
        }));
        setWorkouts(processed);
        setLoading(false);
        return;
      }

      // For viewing someone else's history, check can_review_history permission
      const { data: shareData, error: shareError } = await supabase
        .from("account_shares")
        .select("can_review_history")
        .eq("owner_user_id", targetUserId)
        .eq("delegate_user_id", user?.id)
        .eq("revoked_at", null)
        .single();

      if (shareError || !shareData?.can_review_history) {
        console.error("No permission to review history for user:", targetUserId);
        toast.error("You don't have permission to view this user's workout history");
        setWorkouts([]);
        setLoading(false);
        return;
      }

      // Permission granted, fetch workouts
      const { data: workoutsData, error } = await supabase
        .from("workouts")
        .select("*, routines!fk_workouts__routines(routine_name), sets!fk_sets__workouts(id, exercise_id)")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching workouts:", error);
        setWorkouts([]);
        setLoading(false);
        return;
      }

      const processed = (workoutsData || []).map((w) => ({
        ...w,
        exerciseCount: new Set(w.sets?.map((s) => s.exercise_id) || []).size,
      }));
      setWorkouts(processed);
      setLoading(false);
    };

    fetchData();
  }, [targetUserId, viewingOwn, isDelegated, user?.id]);

  // Initialize routine filter from navigation state when arriving from a workout
  useEffect(() => {
    const desired = location.state?.filterRoutine;
    if (desired && typeof desired === 'string') {
      setSelectedRoutine(desired);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.filterRoutine]);

  /* ------------------------------------------------------------------
    Fetch owner name for public view
  ------------------------------------------------------------------*/
  useEffect(() => {
    if (viewingOwn || !targetUserId) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", targetUserId)
        .single();
      if (data) {
        const name = `${data.first_name || ""} ${data.last_name || ""}`.trim();
        setOwnerName(name || "User");
      }
    })();
  }, [viewingOwn, targetUserId]);

  // Build routine options from loaded workouts (distinct routine names)
  const routineOptions = Array.from(new Set((workouts || []).map(w => w?.routines?.routine_name).filter(Boolean)))
    .map(name => ({ value: name, label: name }));

  const [selectedRoutine, setSelectedRoutine] = useState("");

  return (
    <AppLayout
      reserveSpace={false}
      variant="glass"
      title="Analysis"
      showSidebar={!paramUserId && !isDelegated && !managingForOwner && !managingForClient}
      showShare={false}
      showBackButton={false}
      search={false}
      pageContext="history"
      hideDelegateHeader={true}
      sharingNavAbove={isInSharingMode}
      sharingNavContent={headerSharingContent}
      sharingSection={(
        <SwiperCombobox
          items={routineOptions}
          value={selectedRoutine}
          onChange={setSelectedRoutine}
          placeholder="Filter by routine"
          filterPlaceholder="Search routines"
          width={240}
          useRelativePositioning={true}
        />
      )}
      data-component="AppHeader"
    >
      <MainContentSection className="!p-0 flex-1 min-h-0">
        {/* Workout History List */}
        {!loading && (
          <WorkoutHistoryList
            workouts={selectedRoutine ? workouts.filter(w => w?.routines?.routine_name === selectedRoutine) : workouts}
            viewingOwn={viewingOwn || isDelegated}
          />
        )}
      </MainContentSection>

      {viewingOwn && (
        <ShareHistoryDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          isPublic={shareAll}
          onTogglePublic={handleToggleShareAll}
          shareUrl={`${window.location.origin}/history/public/${user?.id}`}
          onCopy={handleCopyLink}
        />
      )}
    </AppLayout>
  );
};

export default History;
