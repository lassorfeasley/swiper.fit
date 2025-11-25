import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import SwiperFormSwitch from "@/components/shared/SwiperFormSwitch";
import { cn } from "@/lib/utils";
import "./CollaborateSection.css";

const FLIP_INTERVAL_MS = 5000;
const PERMISSION_STAGGER_MS = 1000;
type TimeoutHandle = ReturnType<typeof setTimeout>;

const invitePermissions = [
  "Create and edit routines",
  "Start workouts",
  "Review history",
] as const;

const requestPermissions = [
  "Start a workout",
  "Create or edit routines",
  "Review history",
] as const;

export default function CollaborateSection({
  className,
}: {
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const slideContainerRef = useRef<HTMLDivElement | null>(null);
  const cardColumnRef = useRef<HTMLDivElement | null>(null);
  const [email, setEmail] = useState("john.smith@example.com");
  const [isInviteVisible, setIsInviteVisible] = useState(true);
  const [permissionStates, setPermissionStates] = useState<boolean[]>(
    invitePermissions.map(() => false)
  );
  const [cardHeight, setCardHeight] = useState(0);
  const [panelWidth, setPanelWidth] = useState(0);
  const [cardColumnWidth, setCardColumnWidth] = useState(0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [exitDistance, setExitDistance] = useState(0);

  const cycleActiveRef = useRef(false);
  const flipTimeoutsRef = useRef<TimeoutHandle[]>([]);
  const permissionTimeoutsRef = useRef<TimeoutHandle[]>([]);

  const clearTimeouts = () => {
    flipTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    permissionTimeoutsRef.current.forEach((timeoutId) =>
      clearTimeout(timeoutId)
    );
    flipTimeoutsRef.current = [];
    permissionTimeoutsRef.current = [];
  };

  const startPermissionAnimation = useCallback(() => {
    permissionTimeoutsRef.current.forEach((timeoutId) =>
      clearTimeout(timeoutId)
    );
    permissionTimeoutsRef.current = [];
    setPermissionStates(invitePermissions.map(() => false));

    invitePermissions.forEach((_, idx) => {
      const timeoutId = setTimeout(() => {
        setPermissionStates((prev) =>
          prev.map((value, valueIdx) =>
            valueIdx === idx ? true : value
          )
        );
      }, idx * PERMISSION_STAGGER_MS);
      permissionTimeoutsRef.current.push(timeoutId);
    });
  }, []);

  const scheduleInvitePhase = useCallback(() => {
    if (!cycleActiveRef.current) return;
    setIsInviteVisible(true);
    startPermissionAnimation();

    const timeoutId = setTimeout(() => {
      setIsInviteVisible(false);
      setPermissionStates(invitePermissions.map(() => false));

      const nextTimeoutId = setTimeout(() => {
        scheduleInvitePhase();
      }, FLIP_INTERVAL_MS);
      flipTimeoutsRef.current.push(nextTimeoutId);
    }, FLIP_INTERVAL_MS);

    flipTimeoutsRef.current.push(timeoutId);
  }, [startPermissionAnimation]);

  const stopCycle = useCallback(() => {
    cycleActiveRef.current = false;
    clearTimeouts();
    setPermissionStates(invitePermissions.map(() => false));
  }, []);

  const startCycle = useCallback(() => {
    if (cycleActiveRef.current) return;
    cycleActiveRef.current = true;
    clearTimeouts();
    setIsInviteVisible(true);
    setPermissionStates(invitePermissions.map(() => false));
    startPermissionAnimation();

    const timeoutId = setTimeout(() => {
      setIsInviteVisible(false);
      setPermissionStates(invitePermissions.map(() => false));

      const nextTimeoutId = setTimeout(() => {
        scheduleInvitePhase();
      }, FLIP_INTERVAL_MS);
      flipTimeoutsRef.current.push(nextTimeoutId);
    }, FLIP_INTERVAL_MS);

    flipTimeoutsRef.current.push(timeoutId);
  }, [scheduleInvitePhase, startPermissionAnimation]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startCycle();
        } else {
          stopCycle();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      stopCycle();
    };
  }, [startCycle, stopCycle]);

  useLayoutEffect(() => {
    const updateWidths = () => {
      if (panelRef.current && cardRef.current) {
        const panelRect = panelRef.current.getBoundingClientRect();
        const cardRect = cardRef.current.getBoundingClientRect();
        // Calculate distance from card's right edge to panel's right edge
        const distance = panelRect.right - cardRect.right;
        setExitDistance(Math.max(distance, 600));
      }
      if (panelRef.current) {
        setPanelWidth(panelRef.current.offsetWidth);
      }
      if (cardColumnRef.current) {
        setCardColumnWidth(cardColumnRef.current.offsetWidth);
      }
    };
    updateWidths();
    window.addEventListener("resize", updateWidths);
    return () => window.removeEventListener("resize", updateWidths);
  }, [isInviteVisible]); // Recalculate when card changes

  const measureCardHeight = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const nextHeight = node.offsetHeight;
      setCardHeight((prev) => (prev > 0 ? Math.max(prev, nextHeight) : nextHeight));
    }
  }, []);

  const handlePermissionToggle = (index: number) => (checked: boolean) => {
    setPermissionStates((prev) =>
      prev.map((value, valueIdx) =>
        valueIdx === index ? checked : value
      )
    );
  };

  const fallbackWidth = Math.max(panelWidth || cardColumnWidth, 600);
  const enterX = cardColumnWidth || fallbackWidth; // Start from right, slide left
  const exitX = exitDistance || fallbackWidth; // Exit to the right edge of panel

  return (
    <section
      className={cn(
        "w-full bg-stone-100 py-16 md:py-24 overflow-x-hidden",
        className
      )}
    >
      <div className="w-full max-w-[1643px] mx-auto px-4 sm:px-8 lg:px-16 overflow-x-hidden">
        <div className="flex min-h-[480px] items-center justify-center px-4 sm:px-6 overflow-x-hidden">
          <div
            ref={panelRef}
            className="w-full max-w-[1200px] flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-24 px-6 py-12 md:px-10 md:py-20 bg-stone-100 rounded-lg shadow-[inset_0px_0px_10px_rgba(82,82,82,0.40)] outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 relative overflow-hidden"
          >
            <div
              ref={containerRef}
              className="w-full grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,520px)] lg:gap-24 overflow-visible"
            >
              <div className="flex-1 max-w-96 inline-flex flex-col justify-start items-start gap-2 self-center text-neutral-neutral-700">
                <p className="self-stretch justify-start text-2xl font-bold leading-8 font-['Be_Vietnam_Pro']">
                  Workout seamlessly with trainers and clients.
                </p>
                <p className="self-stretch justify-start text-base font-medium leading-5 font-['Be_Vietnam_Pro'] text-neutral-neutral-500">
                  Create routines with your client or trainer, then share workout history and progress.
                </p>
              </div>

              <div
                ref={cardColumnRef}
                className="w-full max-w-[500px] inline-flex flex-col justify-start items-start gap-2 justify-self-end self-center overflow-visible"
              >
                <div
                  className="slide-card-container"
                  ref={slideContainerRef}
                  style={{ minHeight: cardHeight || undefined }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isInviteVisible ? (
                      <motion.div
                        key="invite-card"
                        className="slide-card"
                        initial={{ x: enterX, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: exitX, opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                      >
                        <p className="text-neutral-neutral-600 text-sm font-extrabold font-['Be_Vietnam_Pro'] leading-4 mb-2">
                          Invite a client
                        </p>
                        <div
                          ref={(node) => {
                            measureCardHeight(node);
                            cardRef.current = node;
                          }}
                          className="w-full max-w-[500px] p-3 bg-white rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex flex-col justify-start items-start overflow-hidden text-neutral-neutral-700"
                        >
                          <div className="self-stretch flex flex-col justify-start items-start gap-4">
                            <div className="self-stretch min-w-64 rounded-sm flex flex-col justify-center items-start gap-2">
                              <div className="self-stretch inline-flex justify-start items-start gap-2">
                                <div className="flex-1 flex justify-between items-start">
                                  <div className="flex-1 justify-start text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3">
                                    Client’s email
                                  </div>
                                </div>
                              </div>
                              <div className="self-stretch h-11 pl-3 bg-white rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 inline-flex justify-center items-center gap-2.5">
                                <input
                                  type="email"
                                  value={email}
                                  onChange={(event) =>
                                    setEmail(event.target.value)
                                  }
                                  className="flex-1 justify-center text-neutral-neutral-500 text-base font-medium font-['Be_Vietnam_Pro'] leading-5 bg-transparent border-none outline-none"
                                  placeholder="john.smith@example.com"
                                />
                              </div>
                            </div>

                            <div className="self-stretch rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex flex-col justify-start items-start overflow-hidden">
                              {invitePermissions.map((permission, index) => (
                                <SwiperFormSwitch
                                  key={permission}
                                  label={permission}
                                  labelClassName="flex-1 justify-center text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-5"
                                  checked={permissionStates[index]}
                                  onCheckedChange={handlePermissionToggle(index)}
                                  className={cn(
                                    "self-stretch h-14 p-3 inline-flex justify-end items-center gap-2.5",
                                    index === 1 && "bg-neutral-Neutral-50"
                                  )}
                                />
                              ))}
                            </div>

                            <div className="self-stretch inline-flex justify-start items-start gap-2 flex-wrap content-start">
                              <Button
                                variant="affirmative"
                                className="flex-1 h-12 min-w-44 px-4 py-2 rounded-sm"
                              >
                                Invite client
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 h-12 min-w-44 px-4 py-2 rounded-sm"
                              >
                                Cancel
                              </Button>
                            </div>

                            <div className="self-stretch justify-center text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3">
                              This invitation will expire in 14 days.
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="request-card"
                        className="slide-card"
                        initial={{ x: enterX, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: exitX, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      >
                        <p className="text-neutral-neutral-600 text-sm font-extrabold font-['Be_Vietnam_Pro'] leading-4 mb-2">
                          Review invitations
                        </p>
                        <div
                          ref={(node) => {
                            measureCardHeight(node);
                            cardRef.current = node;
                          }}
                          className="w-full bg-white rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex flex-col justify-start items-start overflow-hidden text-neutral-neutral-700"
                        >
                          <div className="self-stretch p-3 outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 inline-flex justify-between items-center">
                            <div className="flex-1 flex justify-start items-center gap-3">
                              <div className="flex-1 justify-center text-neutral-neutral-700 text-xl font-medium font-['Be_Vietnam_Pro'] leading-7">
                                Jane Doe wants to be your client
                              </div>
                            </div>
                          </div>

                          <div className="self-stretch p-3 flex flex-col justify-start items-start gap-4">
                            <div className="self-stretch justify-center text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-5">
                              Jane will have the following permissions:
                            </div>

                            <div className="self-stretch rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex flex-col justify-start items-start overflow-hidden">
                              <div className="self-stretch border-t border-neutral-neutral-300 flex flex-col justify-start items-start gap-4 overflow-hidden">
                                <div className="self-stretch bg-white outline outline-1 outline-offset-[-1px] outline-white flex flex-col justify-start items-start overflow-hidden">
                                  {requestPermissions.map((permission, index) => (
                                    <div
                                      key={permission}
                                      className={cn(
                                        "self-stretch h-14 p-3 inline-flex justify-end items-center gap-2.5",
                                        index % 2 === 1 && "bg-neutral-Neutral-50"
                                      )}
                                    >
                                      <div className="flex-1 justify-center text-neutral-neutral-500 text-base font-medium font-['Be_Vietnam_Pro'] leading-5">
                                        {permission}
                                      </div>
                                      <ArrowRight className="size-6 text-neutral-neutral-500" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="self-stretch inline-flex justify-start items-start gap-2.5 flex-wrap content-start">
                              <Button
                                variant="affirmative"
                                className="flex-1 h-12 min-w-44 px-4 py-2 rounded-sm"
                              >
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 h-12 min-w-44 px-4 py-2 rounded-sm"
                              >
                                Decline
                              </Button>
                            </div>

                            <div className="self-stretch justify-center text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3">
                              This invitation will expire in 14 days.
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
