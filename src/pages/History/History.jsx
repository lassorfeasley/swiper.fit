// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=61-389

import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import ToggleInput from "@/components/molecules/toggle-input";
import SwiperForm from "@/components/molecules/swiper-form";
import { SwiperButton } from "@/components/molecules/swiper-button";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import StaticCard from "@/components/organisms/static-card";

const History = () => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareAll, setShareAll] = useState(false);
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState("");

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
      <SwiperForm.Section>
        <ToggleInput
          options={[{ label: "Public link", value: true }]}
          value={isPublic ? true : null}
          onChange={() => onTogglePublic(!isPublic)}
        />
        {isPublic && (
          <div className="w-full inline-flex gap-2 items-center">
            <input
              readOnly
              className="flex-1 h-10 px-3 rounded-sm border border-neutral-300 text-sm"
              value={shareUrl}
              onFocus={(e) => e.target.select()}
            />
            <SwiperButton variant="secondary" onClick={onCopy} className="shrink-0">
              Copy
            </SwiperButton>
          </div>
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
        .select(`*, programs(program_name), sets(id, exercise_id)`)
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
      appHeaderTitle={viewingOwn ? "History" : `${ownerName || "User"}'s workout history`}
      showSidebar={viewingOwn}
      showAddButton={viewingOwn}
      addButtonText="Share"
      addButtonIcon={Share2}
      onAction={handleShare}
      showBackButton={false}
      search={true}
      searchPlaceholder="Search workouts"
      searchValue={search}
      onSearchChange={setSearch}
      pageContext="history"
      data-component="AppHeader"
    >
      <CardWrapper className="mb-[150px] card-container" marginTop={0}>
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : (
          workouts
            .filter((w) => {
              const q = search.toLowerCase();
              return (
                w.workout_name?.toLowerCase().includes(q) ||
                w.programs?.program_name?.toLowerCase().includes(q) ||
                String(w.exerciseCount).includes(q)
              );
            })
            .map((w) => (
              <StaticCard
                key={w.id}
                id={w.id}
                name={w.workout_name || "Unnamed Workout"}
                labels={[w.programs?.program_name] || []}
                count={w.exerciseCount}
                duration={(() => {
                  const sec = w.duration_seconds || 0;
                  const h = Math.floor(sec / 3600);
                  const m = Math.floor((sec % 3600) / 60);
                  const s = sec % 60;
                  return [h, m, s].map((u) => String(u).padStart(2, "0")).join(":");
                })()}
                onClick={() =>
                  viewingOwn
                    ? navigate(`/history/${w.id}`)
                    : navigate(`/history/public/workout/${w.id}`)
                }
              />
            ))
        )}
      </CardWrapper>
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
