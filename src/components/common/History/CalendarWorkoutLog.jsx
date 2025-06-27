import React from "react";
import { SwiperCalendar } from "@/components/molecules/swiper-calendar";
import { Card, CardContent, CardFooter } from "@/components/atoms/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ToggleInput from "@/components/molecules/toggle-input";

/**
 * CalendarWorkoutLog
 * -------------------
 * Displays a calendar allowing the user to pick a date and view
 * a list of workouts completed on that day.
 *
 * Props:
 * - workouts: Array of workout objects containing at least `created_at` and `workout_name`.
 * - date:      Currently selected Date instance.
 * - setDate:   Setter for the selected date (Date | undefined) → void.
 */
const CalendarWorkoutLog = ({ workouts = [], date, setDate }) => {
  // selection mode for calendar: "single" | "range"
  const [mode, setMode] = React.useState("single");
  const [range, setRange] = React.useState({ from: undefined, to: undefined });

  // higher-level filter: "all" | "day" | "range"
  const [filterMode, setFilterMode] = React.useState("all");

  // Keep calendar mode in sync with filter mode
  React.useEffect(() => {
    if (filterMode === "day") setMode("single");
    else if (filterMode === "range") setMode("range");
  }, [filterMode]);

  // Pre-compute set of calendar days that have at least one workout
  const workoutDates = React.useMemo(() => {
    const map = new Map();
    workouts.forEach((w) => {
      const d = new Date(w.created_at);
      // Normalize to midnight for uniqueness by day
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      map.set(key, d);
    });
    return Array.from(map.values());
  }, [workouts]);

  // Ensure a recent workout date is selected by default
  React.useEffect(() => {
    if (!workouts.length) return;
    // Most recent workout date
    const latest = workouts.reduce((latest, w) => {
      const d = new Date(w.created_at);
      return d > latest ? d : latest;
    }, new Date(0));

    if (mode === "single") {
      if (!date || date.toDateString() !== latest.toDateString()) {
        setDate(latest);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workouts]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isFutureNoWorkout = (day) => day > today && !workoutDates.some(d => new Date(d).toDateString() === day.toDateString());

  const events = React.useMemo(() => {
    if (filterMode === "all") return workouts;

    if (filterMode === "day") {
      if (!date) return [];
      return workouts.filter((w) => {
        const workoutDate = new Date(w.created_at);
        return workoutDate.toDateString() === date.toDateString();
      });
    }

    // range mode
    if (!range?.from || !range?.to) return [];
    const from = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate());
    const to = new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate());
    return workouts.filter((w) => {
      const d = new Date(w.created_at);
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return day >= from && day <= to;
    });
  }, [workouts, date, range, filterMode]);

  // Disable days with no workouts
  const disabledMatcher = React.useCallback(
    (d) => {
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      return !workoutDates.some((wd) => {
        return (
          wd.getFullYear() === d.getFullYear() &&
          wd.getMonth() === d.getMonth() &&
          wd.getDate() === d.getDate()
        );
      });
    },
    [workoutDates]
  );

  return (
    <Card className="w-full max-w-[1200px] pt-0 mx-auto mb-6 bg-transparent border-none shadow-none rounded-none" data-component="CalendarWorkoutLog">
      {/* Calendar */}
      <CardContent className="px-4 space-y-2 flex flex-col items-center bg-white">
        <SwiperCalendar
          mode={mode}
          selected={mode === "single" ? date : range}
          onSelect={mode === "single" ? setDate : setRange}
          className="bg-transparent p-0"
          required
          modifiers={{
            hasWorkout: workoutDates,
            future: isFutureNoWorkout,
          }}
          disabled={disabledMatcher}
          modifiersClassNames={{
            hasWorkout:
              "!bg-green-500 !text-white rounded-sm hover:shadow-sm focus:!bg-green-500 data-[selected]:!bg-green-500 data-[selected]:!text-white",
            future: "text-slate-400 font-extrabold",
          }}
        />
      </CardContent>

      {/* Toggle Group */}
      <div className="w-full bg-white flex justify-center pb-3">
        <ToggleInput
          value={filterMode}
          onChange={(val) => val && setFilterMode(val)}
          options={[
            { label: "Show all", value: "all" },
            { label: "Day", value: "day" },
            { label: "Range", value: "range" },
          ]}
          className="w-full max-w-[500px]"
        />
      </div>

      {/* Events list */}
      <div className="flex w-full flex-col items-center gap-4 px-3 py-5">
        {events.length === 0 ? (
          <div className="text-sm text-muted-foreground">No workouts logged</div>
        ) : (
          events.map((w) => {
            const workoutDate = new Date(w.created_at);
            const timeString = workoutDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            // Relative descriptor (Today / X days ago)
            const todayMidnight = new Date();
            todayMidnight.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((todayMidnight - new Date(workoutDate.getFullYear(), workoutDate.getMonth(), workoutDate.getDate())) / 86400000);
            const relativeLabel = diffDays === 0 ? "Today" : `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

            return (
              <div
                key={w.id}
                className="w-full max-w-[500px] p-4 bg-white rounded-lg inline-flex justify-center items-end gap-2"
              >
                <div className="flex-1 inline-flex flex-col justify-start items-start gap-1">
                  <div className="flex flex-col gap-2 w-full">
                    <div className="text-lg font-medium leading-tight text-slate-950">
                      {w.workout_name || "Workout"}
                    </div>
                    <div className="text-sm font-medium leading-none text-slate-950">
                      {w.programs?.program_name || w.muscle_group || "Workout"}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium leading-none text-neutral-500">
                  {relativeLabel}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default CalendarWorkoutLog; 