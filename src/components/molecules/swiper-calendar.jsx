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

  // Helper to decide responsive count synchronously on initial render.
  const computeResponsiveMonths = () => {
    if (explicit) return numberOfMonths;
    if (typeof window !== "undefined") {
      const w = window.innerWidth;
      if (w >= 1024) return 3; // large screens
      if (w >= 768) return 2; // medium screens
      return 1; // mobile
    }
    return 1;
  };

  const [months, setMonths] = React.useState(computeResponsiveMonths);

  React.useEffect(() => {
    if (explicit) return; // controlled by prop

    if (typeof window === "undefined") return;

    const handleResize = () => {
      setMonths(computeResponsiveMonths());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [explicit]);

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

  let calendarClassNames = props.classNames || {};
  const baseMonthsClasses = "relative flex flex-col md:flex-row justify-center";
  calendarClassNames = {
    ...calendarClassNames,
    months: `${baseMonthsClasses} gap-10`.trim(),
    nav: "hidden",
    caption_label: "text-sm font-extrabold text-slate-500",
    week: "mt-1 flex w-full gap-2 p-1",
    weekdays: "flex gap-2",
    weekday: "text-neutral-400 text-xs font-medium uppercase tracking-wide flex-1 select-none rounded-md",
    day: "text-slate-600 text-sm font-extrabold disabled:opacity-100 aria-selected:!bg-transparent aria-selected:!text-slate-600",
    day_today: "outline outline-1 outline-stone-400 text-slate-600 rounded-sm",
    day_disabled: "",
    day_outside: "invisible",
  };

  const calendarProps = {
    numberOfMonths: months,
    ...props,
    classNames: calendarClassNames,
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