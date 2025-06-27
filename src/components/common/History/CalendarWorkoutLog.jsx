import React from "react";
import { SwiperCalendar } from "@/components/molecules/swiper-calendar";
import { Card, CardContent, CardFooter } from "@/components/atoms/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
  // selection mode: "single" | "range"
  const [mode, setMode] = React.useState("single");
  const [range, setRange] = React.useState({ from: undefined, to: undefined });

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
    } else {
      if (!range.from || !range.to) {
        setRange({ from: latest, to: latest });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workouts]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isFutureNoWorkout = (day) => day > today && !workoutDates.some(d => new Date(d).toDateString() === day.toDateString());

  const events = React.useMemo(() => {
    if (mode === "single") {
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
  }, [workouts, date, range, mode]);

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
    <Card className="w-full max-w-[1200px] py-4 mx-auto mb-6 bg-transparent border-none shadow-none rounded-none" data-component="CalendarWorkoutLog">
      {/* Calendar */}
      <CardContent className="px-4 space-y-2 flex flex-col items-center">
        {/* Mode toggle */}
        <div className="flex gap-2 self-end mr-4">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`text-xs px-2 py-1 rounded-md border ${mode === "single" ? "bg-primary text-primary-foreground" : "bg-transparent text-slate-600"}`}
          >
            Single
          </button>
          <button
            type="button"
            onClick={() => setMode("range")}
            className={`text-xs px-2 py-1 rounded-md border ${mode === "range" ? "bg-primary text-primary-foreground" : "bg-transparent text-slate-600"}`}
          >
            Range
          </button>
        </div>
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
            future: "text-slate-400 opacity-60",
          }}
        />
      </CardContent>

      {/* Events list */}
      <CardFooter className="flex flex-col items-start gap-3 border-t px-4 !pt-4">
        {/* Date header */}
        <div className="flex w-full items-center justify-between px-1">
          <div className="text-sm font-medium">
            {mode === "single"
              ? date?.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : range?.from && range?.to
              ? `${range.from.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${range.to.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : "Pick dates"}
          </div>
          {/* Future "add event" button placeholder */}
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            title="Add Workout"
            disabled
          >
            <Plus className="size-4" />
            <span className="sr-only">Add Workout</span>
          </Button>
        </div>

        {/* List of workouts for the selection */}
        <div className="flex w-full flex-col gap-2">
          {events.length === 0 ? (
            <div className="text-sm text-muted-foreground px-1">No workouts logged</div>
          ) : (
            events.map((w) => {
              const timeString = new Date(w.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <div
                  key={w.id}
                  className="bg-muted after:bg-primary/70 relative rounded-md p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full"
                >
                  <div className="font-medium">
                    {w.workout_name || "Workout"}
                  </div>
                  <div className="text-muted-foreground text-xs">{timeString}</div>
                </div>
              );
            })
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default CalendarWorkoutLog; 