import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  Lock,
  CalendarClock,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CourseLesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string;
  order_index: number;
  duration: number;
}

interface CourseDocsSidebarProps {
  lessons: CourseLesson[];
  completedLessons: Set<string>;
  currentPartIndex: number;
  courseId: string;
  courseProgress: number;
  getLessonLockStatus: (
    index: number
  ) => "available" | "locked" | "daily_locked";
}

export function CourseDocsSidebar({
  lessons,
  completedLessons,
  currentPartIndex,
  courseId,
  courseProgress,
  getLessonLockStatus,
}: CourseDocsSidebarProps) {
  const navigate = useNavigate();
  const activeRef = useRef<HTMLDivElement>(null);

  const weeks: {
    weekNumber: number;
    lessons: CourseLesson[];
    startIndex: number;
  }[] = [];
  for (let i = 0; i < lessons.length; i += 7) {
    weeks.push({
      weekNumber: Math.floor(i / 7) + 1,
      lessons: lessons.slice(i, i + 7),
      startIndex: i,
    });
  }

  const currentWeekIdx = Math.floor(currentPartIndex / 7);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(
    new Set([currentWeekIdx])
  );

  useEffect(() => {
    setExpandedWeeks((prev) => new Set([...prev, currentWeekIdx]));
  }, [currentWeekIdx]);

  useEffect(() => {
    const timer = setTimeout(() => {
      activeRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [currentPartIndex]);

  const toggleWeek = (weekIdx: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekIdx)) next.delete(weekIdx);
      else next.add(weekIdx);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Pokrok
          </span>
          <span className="text-xs font-semibold tabular-nums">
            {completedLessons.size}/{lessons.length}
          </span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${courseProgress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {weeks.map((week, weekIdx) => {
          const isExpanded = expandedWeeks.has(weekIdx);
          const weekCompleted = week.lessons.filter((l) =>
            completedLessons.has(l.id)
          ).length;
          const weekTotal = week.lessons.length;
          const hasActive =
            currentPartIndex >= week.startIndex &&
            currentPartIndex < week.startIndex + weekTotal;

          return (
            <div key={week.weekNumber}>
              <button
                type="button"
                onClick={() => toggleWeek(weekIdx)}
                className={cn(
                  "w-full flex items-center gap-2 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors duration-150",
                  hasActive
                    ? "text-foreground"
                    : "text-muted-foreground/70 hover:text-muted-foreground"
                )}
              >
                <ChevronRight
                  className={cn(
                    "h-3 w-3 flex-shrink-0 transition-transform duration-300 ease-out",
                    isExpanded && "rotate-90"
                  )}
                />
                <span className="flex-1 text-left">
                  Tyden {week.weekNumber}
                </span>
                <span className="text-[10px] font-normal tabular-nums opacity-50">
                  {weekCompleted}/{weekTotal}
                </span>
              </button>

              <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{
                  gridTemplateRows: isExpanded ? "1fr" : "0fr",
                }}
              >
                <div className="overflow-hidden">
                  <div className="relative ml-[22px] border-l border-border/60">
                    {week.lessons.map((lesson) => {
                      const globalIdx =
                        week.startIndex +
                        week.lessons.indexOf(lesson);
                      const isCurrent =
                        globalIdx === currentPartIndex;
                      const isDone = completedLessons.has(lesson.id);
                      const status = getLessonLockStatus(globalIdx);

                      return (
                        <div
                          key={lesson.id}
                          ref={isCurrent ? activeRef : undefined}
                          className="relative"
                        >
                          {(isDone || isCurrent) && (
                            <div
                              className={cn(
                                "absolute left-[-1px] top-0 w-[2px] h-full",
                                isDone
                                  ? "bg-emerald-500"
                                  : "bg-primary"
                              )}
                            />
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              status === "available" &&
                              navigate(
                                `/kurz/${courseId}/cast/${globalIdx + 1}`
                              )
                            }
                            disabled={status !== "available"}
                            className={cn(
                              "w-full text-left pl-4 pr-3 py-1.5 flex items-center gap-2 transition-colors duration-150 group",
                              isCurrent && "bg-primary/[0.06]",
                              !isCurrent &&
                                status === "available" &&
                                "hover:bg-muted/40",
                              status !== "available" &&
                                "opacity-35 cursor-not-allowed"
                            )}
                          >
                            <span
                              className={cn(
                                "flex-1 text-[12px] leading-snug truncate",
                                isCurrent
                                  ? "font-semibold text-primary"
                                  : isDone
                                    ? "text-muted-foreground"
                                    : "text-foreground/80"
                              )}
                            >
                              {lesson.title}
                            </span>

                            <span className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                                {lesson.duration}m
                              </span>
                              {isDone && (
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              )}
                              {status === "locked" && (
                                <Lock className="h-2.5 w-2.5 text-muted-foreground/30" />
                              )}
                              {status === "daily_locked" && (
                                <CalendarClock className="h-2.5 w-2.5 text-amber-500/50" />
                              )}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-3 py-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => navigate(`/kurz/${courseId}`)}
        >
          <BookOpen className="h-3.5 w-3.5 mr-1.5" />
          Prehled kurzu
        </Button>
      </div>
    </div>
  );
}
