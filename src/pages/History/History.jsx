// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=61-389

import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useCurrentUser } from "@/contexts/AccountContext";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import SwiperForm from "@/components/molecules/swiper-form";
import { SwiperButton } from "@/components/molecules/swiper-button";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";
import StaticCard from "@/components/organisms/static-card";
import SwiperFormSwitch from "@/components/molecules/swiper-form-switch";
import { TextInput } from "@/components/molecules/text-input";
import { Copy } from "lucide-react";
import CalendarWorkoutLog from "@/components/common/History/CalendarWorkoutLog";
import MainContentSection from "@/components/layout/MainContentSection";
import WorkoutCard from "@/components/common/Cards/WorkoutCard";

const History = () => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareAll, setShareAll] = useState(false);
  const [search, setSearch] = useState("");
  const user = useCurrentUser();
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Determine whose history we're viewing and whether it's the owner
  const targetUserId = paramUserId || user?.id;
  const viewingOwn = !!user && (!paramUserId || paramUserId === user.id);

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
  }, [targetUserId]);

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

  return (
    <AppLayout
      reserveSpace={true}
      title="History"
      showSidebar={!paramUserId}
      showShare={viewingOwn}
      onShare={handleShare}
      showBackButton={false}
      search={true}
      searchPlaceholder="Search workouts"
      searchValue={search}
      onSearchChange={setSearch}
      pageContext="history"
      data-component="AppHeader"
    >
      <MainContentSection className="!p-0 flex-1 min-h-0">
        {/* Calendar Log */}
        {!loading && (
          <CalendarWorkoutLog
            workouts={workouts}
            date={selectedDate}
            setDate={setSelectedDate}
            viewingOwn={viewingOwn}
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
