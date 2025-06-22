// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=61-389

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import StaticCard from "@/components/organisms/static-card";

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((unit) => String(unit).padStart(2, "0")).join(":");
}

const History = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (!user) {
      setWorkouts([]);
      setLoading(false);
      return;
    }
    // Fetch workouts with program information and sets in a single query
    const { data: workoutsData, error } = await supabase
      .from("workouts")
      .select(
        `
        *,
        programs(program_name),
        sets(id, exercise_id)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching workouts:", error);
      setWorkouts([]);
      setLoading(false);
      return;
    }

    // Process the data
    const processedWorkouts = (workoutsData || [])
      .map((workout) => ({
        ...workout,
        exerciseCount: new Set(
          workout.sets?.map((set) => set.exercise_id) || []
        ).size,
      }));

    setWorkouts(processedWorkouts);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData, location.key]);

  return (
    <AppLayout
      appHeaderTitle="History"
      showAddButton={false}
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
                duration={formatDuration(w.duration_seconds || 0)}
                onClick={() => navigate(`/history/${w.id}`)}
              />
            ))
        )}
      </CardWrapper>
    </AppLayout>
  );
};

export default History;
