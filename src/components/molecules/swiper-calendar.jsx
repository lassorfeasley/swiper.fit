import * as React from "react";
import { Calendar } from "@/components/ui/calendar";

/**
 * SwiperCalendar
 * --------------
 * Wrapper around the shadcn Calendar component that automatically
 * shows up to 3 months side-by-side on desktop (≥768 px width).
 *
 * If a `numberOfMonths` prop is provided it will be respected and the
 * responsive behaviour disabled.
 */
const SwiperCalendar = React.forwardRef(({ numberOfMonths, ...props }, ref) => {
  const explicit = typeof numberOfMonths !== "undefined";

  // Helper to decide responsive count.
  const computeResponsiveMonths = () => {
    if (typeof window === "undefined") return 1; // SSR-safe default
      const w = window.innerWidth;
      if (w >= 1024) return 3; // large screens
      if (w >= 768) return 2; // medium screens
      return 1; // mobile
  };

  const [months, setMonths] = React.useState(1); // Default to 1 for SSR and initial render

  React.useEffect(() => {
    if (explicit) {
      setMonths(numberOfMonths);
      return;
    }

    const handleResize = () => {
      setMonths(computeResponsiveMonths());
    };

    // Set the correct number of months on initial client-side mount
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [explicit, numberOfMonths]);

  // Build props for Calendar. If the caller hasn't specified `month` or
  // `defaultMonth`, we set `defaultMonth` so that the last calendar shown
  // corresponds to the current month, with preceding months before it.

  const baseDate = React.useMemo(() => {
    // If caller provided a selected date, use its month as reference.
    if (props.selected instanceof Date) return props.selected;
    return new Date();
  }, [props.selected]);

  const startMonth = React.useMemo(() => {
    return new Date(baseDate.getFullYear(), baseDate.getMonth() - (months - 1), 1);
  }, [baseDate, months]);

  const baseMonthsClasses = "relative flex flex-col md:flex-row justify-center";

  // Default calendar styling; can be overridden by parent via props.classNames
  const defaultClassNames = {
    months: `${baseMonthsClasses} gap-10`.trim(),
    nav: "hidden",
    caption_label: "text-muted-foreground font-medium",
    month_caption: "justify-start text-left",
    week: "mt-1 flex w-full gap-2 p-1",
    weekdays: "flex gap-2",
    weekday:
      "text-neutral-400 text-xs font-medium uppercase tracking-wide flex-1 select-none rounded-md",

    // Core day styles
    day: "text-foreground",
    day_selected: "text-white",
    day_range_start: "text-white",
    day_range_middle: "text-white",
    day_range_end: "text-white",
    day_today: "border border-primary rounded-sm",
    day_outside: "text-muted opacity-40",
    day_disabled: "opacity-50",
  };

  const calendarClassNames = {
    ...defaultClassNames,
    ...(props.classNames || {}), // allow parent overrides
  };

  const calendarProps = {
    numberOfMonths: months,
    showOutsideDays: true,
    ...props,
    classNames: calendarClassNames,
    formatters: {
      ...(props.formatters || {}),
      formatCaption: (date) =>
        date.toLocaleString("en-US", { month: "long" }),
      formatWeekdayName: (date) =>
        date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    },
  };

  if (!("month" in props) && !("defaultMonth" in props)) {
    // Use controlled `month` to ensure correct initial positioning even if
    // months count changes after first render.
    calendarProps.month = startMonth;
  }

  return <Calendar ref={ref} {...calendarProps} />;
});

SwiperCalendar.displayName = "SwiperCalendar";

export { SwiperCalendar }; 