import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  Lock,
  CalendarClock,
  Clock,
  PlayCircle,
  Timer,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface ContentBlock {
  type: string;
  content: string;
}

interface CourseLesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string;
  order_index: number;
  duration: number;
  content?: { blocks?: ContentBlock[] } | null;
}

interface CourseDocsSidebarProps {
  lessons: CourseLesson[];
  completedLessons: Set<string>;
  currentPartIndex: number;
  courseId: string;
  courseProgress: number;
  actualWatchTime: number;
  getLessonLockStatus: (index: number) => "available" | "locked" | "daily_locked";
  formatTime: (seconds: number) => string;
}

export function CourseDocsSidebar({
  lessons,
  completedLessons,
  currentPartIndex,
  courseId,
  courseProgress,
  actualWatchTime,
  getLessonLockStatus,
  formatTime,
}: CourseDocsSidebarProps) {
  const navigate = useNavigate();
  const activeRef = useRef<HTMLDivElement>(null);

  const weeks: { weekNumber: number; lessons: CourseLesson[]; startIndex: number }[] = [];
  for (let i = 0; i < lessons.length; i += 7) {
    weeks.push({
      weekNumber: Math.floor(i / 7) + 1,
      lessons: lessons.slice(i, i + 7),
      startIndex: i,
    });
  }

  const currentWeekIdx = Math.floor(currentPartIndex / 7);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([currentWeekIdx]));
  const [hoveredLesson, setHoveredLesson] = useState<number | null>(null);

  useEffect(() => {
    setExpandedWeeks((prev) => new Set([...prev, currentWeekIdx]));
  }, [currentWeekIdx]);

  useEffect(() => {
    const timer = setTimeout(() => {
      activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => clearTimeout(timer);
  }, [currentPartIndex]);

  const toggleWeek = (weekIdx: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekIdx)) {
        next.delete(weekIdx);
      } else {
        next.add(weekIdx);
      }
      return next;
    });
  };

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <PlayCircle className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">Pokrok</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {completedLessons.size} z {lessons.length} lekci
            </span>
            <span className="font-semibold tabular-nums">{Math.round(courseProgress)}%</span>
          </div>
          <Progress value={courseProgress} className="h-1.5" />
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <Timer className="h-3.5 w-3.5" />
          <span>Sledovano: {formatTime(actualWatchTime)}</span>
        </div>
      </div>

      <div className="p-2 max-h-[calc(100vh-300px)] overflow-y-auto">
        {weeks.map((week, weekIdx) => {
          const isExpanded = expandedWeeks.has(weekIdx);
          const weekCompleted = week.lessons.filter((l) => completedLessons.has(l.id)).length;
          const weekTotal = week.lessons.length;
          const weekPct = (weekCompleted / weekTotal) * 100;
          const hasActive = currentPartIndex >= week.startIndex && currentPartIndex < week.startIndex + weekTotal;

          return (
            <div key={week.weekNumber} className="mb-0.5">
              <button
                type="button"
                onClick={() => toggleWeek(weekIdx)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 group",
                  hasActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200 flex-shrink-0",
                    !isExpanded && "-rotate-90"
                  )}
                />
                <span className="flex-1 text-left">Tyden {week.weekNumber}</span>
                <span className="text-[10px] tabular-nums opacity-50">
                  {weekCompleted}/{weekTotal}
                </span>
                <div className="w-10 h-1 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${weekPct}%` }}
                  />
                </div>
              </button>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="ml-[18px] relative py-1">
                  <div className="absolute left-[3px] top-0 bottom-0 w-px bg-border transition-colors duration-300" />

                  {week.lessons.map((lesson, lessonIdx) => {
                    const globalIdx = week.startIndex + lessonIdx;
                    const isCurrent = globalIdx === currentPartIndex;
                    const isDone = completedLessons.has(lesson.id);
                    const status = getLessonLockStatus(globalIdx);
                    const isHovered = hoveredLesson === globalIdx;
                    const contentBlocks = (lesson.content as { blocks?: ContentBlock[] })?.blocks || [];
                    const isFirst = lessonIdx === 0;
                    const isLast = lessonIdx === week.lessons.length - 1;

                    return (
                      <div
                        key={lesson.id}
                        ref={isCurrent ? activeRef : undefined}
                        className="relative"
                        onMouseEnter={() => setHoveredLesson(globalIdx)}
                        onMouseLeave={() => setHoveredLesson(null)}
                      >
                        {(isDone || isCurrent) && (
                          <div
                            className={cn(
                              "absolute left-[3px] w-px z-[1] transition-all duration-300",
                              isDone ? "bg-emerald-500/60" : "bg-primary/40"
                            )}
                            style={{
                              top: isFirst ? "12px" : "0",
                              bottom: isLast ? "calc(100% - 12px)" : "0",
                            }}
                          />
                        )}

                        {isHovered && !isDone && !isCurrent && status === "available" && (
                          <div
                            className="absolute left-[3px] w-px bg-muted-foreground/30 z-[1] transition-all duration-200"
                            style={{
                              top: isFirst ? "12px" : "0",
                              bottom: isLast ? "calc(100% - 12px)" : "0",
                            }}
                          />
                        )}

                        <div className="flex items-start gap-0">
                          <div className="relative flex-shrink-0 w-[7px] flex justify-center pt-[10px]">
                            <div
                              className={cn(
                                "rounded-full z-[2] transition-all duration-200",
                                isDone
                                  ? "w-2 h-2 bg-emerald-500 ring-[3px] ring-emerald-500/15"
                                  : isCurrent
                                    ? "w-2.5 h-2.5 bg-primary ring-[3px] ring-primary/15"
                                    : isHovered && status === "available"
                                      ? "w-2 h-2 bg-muted-foreground/50"
                                      : "w-1.5 h-1.5 bg-muted-foreground/30"
                              )}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              status === "available" &&
                              navigate(`/kurz/${courseId}/cast/${globalIdx + 1}`)
                            }
                            disabled={status !== "available"}
                            className={cn(
                              "flex-1 text-left px-2.5 py-1.5 rounded-lg transition-all duration-200 min-w-0",
                              isCurrent && "bg-primary/[0.06]",
                              !isCurrent && status === "available" && "hover:bg-muted/50",
                              status !== "available" && "opacity-35 cursor-not-allowed"
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 min-w-0">
                                <div
                                  className={cn(
                                    "text-[11px] leading-tight truncate transition-colors duration-200",
                                    isCurrent
                                      ? "font-semibold text-primary"
                                      : isDone
                                        ? "font-medium text-muted-foreground"
                                        : "font-medium text-foreground/80"
                                  )}
                                >
                                  {lesson.title}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Clock className="h-2.5 w-2.5 text-muted-foreground/40" />
                                  <span className="text-[9px] text-muted-foreground/50 tabular-nums">
                                    {lesson.duration} min
                                  </span>
                                </div>
                              </div>

                              {isDone && (
                                <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                              )}
                              {status === "locked" && (
                                <Lock className="h-2.5 w-2.5 text-muted-foreground/30 flex-shrink-0" />
                              )}
                              {status === "daily_locked" && (
                                <CalendarClock className="h-2.5 w-2.5 text-amber-500/50 flex-shrink-0" />
                              )}
                              {isCurrent && !isDone && (
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        </div>

                        {isCurrent && contentBlocks.length > 0 && (
                          <div className="ml-[7px] pl-[14px] relative pb-1">
                            <div className="absolute left-[3px] top-0 bottom-0 w-px bg-primary/15" />
                            {contentBlocks.map((block, bIdx) => {
                              const label =
                                block.type === "text"
                                  ? "Obsah lekce"
                                  : block.type === "tips"
                                    ? "Tipy a rady"
                                    : block.type === "video"
                                      ? "Video"
                                      : block.type;
                              return (
                                <div key={bIdx} className="relative flex items-center gap-2 py-0.5">
                                  <div className="absolute left-[-11px] w-1 h-1 rounded-full bg-primary/30" />
                                  <span className="text-[9px] text-muted-foreground/60 pl-0.5">
                                    {label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-2 border-t">
        <Button
          variant="outline"
          className="w-full text-xs h-8"
          onClick={() => navigate(`/kurz/${courseId}`)}
        >
          <BookOpen className="h-3.5 w-3.5 mr-1.5" />
          Prehled kurzu
        </Button>
      </div>
    </div>
  );
}
