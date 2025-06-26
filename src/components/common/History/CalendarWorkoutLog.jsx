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

  const events = React.useMemo(() => {
    if (!date) return [];
    return workouts.filter((w) => {
      const workoutDate = new Date(w.created_at);
      return workoutDate.toDateString() === date.toDateString();
    });
  }, [workouts, date]);

  return (
    <Card className="w-fit py-4 mx-auto mb-6" data-component="CalendarWorkoutLog">
      {/* Calendar */}
      <CardContent className="px-4">
        <SwiperCalendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="bg-transparent p-0"
          required
          modifiers={{ hasWorkout: workoutDates }}
          modifiersClassNames={{
            hasWorkout:
              "after:content-[''] after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary",
          }}
        />
      </CardContent>

      {/* Events list */}
      <CardFooter className="flex flex-col items-start gap-3 border-t px-4 !pt-4">
        {/* Date header */}
        <div className="flex w-full items-center justify-between px-1">
          <div className="text-sm font-medium">
            {date?.toLocaleDateString("en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
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

        {/* List of workouts for the selected date */}
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