import React, { useState, useEffect, useMemo } from "react";
import { SwiperCalendar } from "@/components/molecules/swiper-calendar";
import { Card, CardContent } from "@/components/atoms/card";
import ToggleInput from "@/components/molecules/toggle-input";
import { useNavigate } from "react-router-dom";
import WorkoutCard from "@/components/common/Cards/WorkoutCard";
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";

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
 * - viewingOwn: Boolean indicating whether the user is viewing their own workouts.
 */
const CalendarWorkoutLog = ({ workouts = [], date, setDate, viewingOwn = true }) => {
  // selection mode for calendar: "single" | "range"
  const [mode, setMode] = React.useState("single");
  const [range, setRange] = React.useState({ from: undefined, to: undefined });

  // Determine calendar range (inclusive start, exclusive end)
  const baseDate = useMemo(() => (date instanceof Date ? date : new Date()), [date]);
  const calendarStart = useMemo(() => {
    const month = baseDate.getMonth();
    const year = baseDate.getFullYear();
    return new Date(year, month, 1);
  }, [baseDate]);
  const calendarEnd = useMemo(
    () => new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1),
    [baseDate]
  );

  // higher-level filter: "all" | "day" | "range"
  const [filterMode, setFilterMode] = React.useState("all");

  // Keep calendar mode in sync with filter mode
  React.useEffect(() => {
    if (filterMode === "day") setMode("single");
    else if (filterMode === "range") setMode("range");
  }, [filterMode]);

  // Pre-compute a Set of calendar days (timestamps) that have at least one workout
  const workoutDateKeys = React.useMemo(() => {
    const keys = new Set();
    workouts.forEach((w) => {
      const d = new Date(w.created_at);
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      keys.add(key);
    });
    return keys;
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

  const isFutureNoWorkout = (day) => {
    const key = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    return day > today && !workoutDateKeys.has(key);
  };

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
      return !workoutDateKeys.has(key);
    },
    [workoutDateKeys]
  );

  const navigate = useNavigate();

  // Handler for calendar date click
  const handleCalendarSelect = (selected) => {
    if (filterMode === "all") {
      setFilterMode("day");
      setDate(selected);
    } else if (mode === "single") {
      setDate(selected);
    } else {
      setRange(selected);
    }
  };

  // When 'Show all' is selected, no days should be selected
  const calendarSelected = filterMode === "all" ? undefined : (mode === "single" ? date : range);

  return (
    <div className="w-full" data-component="CalendarWorkoutLog">
      {/* Calendar + toggle section */}
      <Card className="w-full pt-0 mb-0 bg-transparent border-none shadow-none rounded-none">
        <CardContent className="space-y-2 flex flex-col items-center bg-white w-full !p-5">
          <SwiperCalendar
            mode={mode}
            selected={calendarSelected}
            onSelect={handleCalendarSelect}
            className="bg-transparent p-0"
            showOutsideDays={true}
            required
            modifiers={{
              hasWorkout: (day) => {
                const time = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
                if (!workoutDateKeys.has(time)) return false;
                return day >= calendarStart && day < calendarEnd;
              },
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
        <div className="w-full bg-white flex justify-center pb-5 px-3 md:px-0">
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
      </Card>

      {/* Events list */}
      <DeckWrapper
        gap={20}
        paddingX={20}
        className="items-center border-t border-neutral-300 space-y-[20px]"
        style={{ paddingTop: 20, paddingBottom: 20, paddingLeft: 20, paddingRight: 20 }}
      >
        {events.length === 0 ? (
          <div className="text-sm text-muted-foreground">No workouts logged</div>
        ) : (
          events.map((w) => {
            const workoutDate = new Date(w.created_at);
            const todayMidnight = new Date();
            todayMidnight.setHours(0, 0, 0, 0);
            const diffDays = Math.floor(
              (todayMidnight -
                new Date(
                  workoutDate.getFullYear(),
                  workoutDate.getMonth(),
                  workoutDate.getDate()
                )) /
                86400000
            );
            const relativeLabel = diffDays === 0 ? "Today" : `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
            return (
              <div
                key={w.id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  navigate(
                    viewingOwn ? `/history/${w.id}` : `/history/public/workout/${w.id}`
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(
                      viewingOwn ? `/history/${w.id}` : `/history/public/workout/${w.id}`
                    );
                  }
                }}
                className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring w-full max-w-[500px] border border-neutral-300 rounded-lg"
              >
                <WorkoutCard
                  name={w.workout_name || "Workout"}
                  subtitle={
                    w.routines?.routine_name || w.muscle_group || "Workout"
                  }
                  relativeLabel={relativeLabel}
                />
              </div>
            );
          })
        )}
      </DeckWrapper>
    </div>
  );
};

export default CalendarWorkoutLog; 