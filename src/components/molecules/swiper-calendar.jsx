import * as React from "react";
import { Calendar } from "@/components/ui/calendar";

/**
 * SwiperCalendar
 * --------------
 * Thin wrapper around the shadcn Calendar component so we can keep a
 * consistent naming convention (swiper-*) throughout the codebase.
 * All props are passed directly to the underlying Calendar.
 */
const SwiperCalendar = React.forwardRef((props, ref) => {
  return <Calendar ref={ref} {...props} />;
});

SwiperCalendar.displayName = "SwiperCalendar";

export { SwiperCalendar }; 