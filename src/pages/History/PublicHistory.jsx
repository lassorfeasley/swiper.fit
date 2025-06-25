import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import AppLayout from "@/components/layout/AppLayout";
import StaticCard from "@/components/organisms/static-card";

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((unit) => String(unit).padStart(2, "0")).join(":");
}

const PublicHistory = () => {
  const { userId } = useParams();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!userId) {
        setWorkouts([]);
        setLoading(false);
        return;
      }
      const { data: workoutsData, error } = await supabase
        .from("workouts")
        .select(
          `*, programs(program_name), sets(id, exercise_id)`
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching workouts:", error);
        setWorkouts([]);
        setLoading(false);
        return;
      }

      const processedWorkouts = (workoutsData || []).map((workout) => ({
        ...workout,
        exerciseCount: new Set(workout.sets?.map((s) => s.exercise_id) || []).size,
      }));
      setWorkouts(processedWorkouts);
      setLoading(false);
    };
    fetchData();
  }, [userId]);

  const pageTitle = "Workout History";

  return (
    <AppLayout
      appHeaderTitle={pageTitle}
      showAddButton={false}
      showSidebar={false}
      showBackButton={false}
      search={true}
      searchPlaceholder="Search workouts"
      searchValue={search}
      onSearchChange={setSearch}
      pageContext="history"
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

export default PublicHistory; 