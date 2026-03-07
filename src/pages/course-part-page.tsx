import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Navigate, Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Loader2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Lock,
  CalendarClock,
  Home,
  BookOpen,
  Trophy,
  GraduationCap,
  Sparkles,
  Play,
  Pause,
  Maximize2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PhysioChatbot } from "@/components/chatbot/physio-chatbot";
import { useGamification } from "@/lib/use-gamification";
import { XpRewardPopup } from "@/components/gamification/xp-reward-popup";
import { CourseDocsSidebar } from "@/components/courses/course-docs-sidebar";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  price: number;
  order_index: number;
  package_id: string | null;
}

interface CourseLesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string;
  order_index: number;
  duration: number;
}

interface LessonVideo {
  id: string;
  lesson_id: string;
  title: string;
  video_provider: string;
  video_external_id: string;
  video_url: string;
  storage_path: string;
  duration_seconds: number;
  order_index: number;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export default function CoursePartPage() {
  const { courseId, partNumber } = useParams<{
    courseId: string;
    partNumber: string;
  }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { onLessonComplete, onCourseComplete, lastXpEvent, clearLastEvent } =
    useGamification();

  const partIndex = parseInt(partNumber || "1", 10) - 1;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [lessonVideos, setLessonVideos] = useState<
    Map<string, LessonVideo[]>
  >(new Map());
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(
    new Set()
  );
  const [completionDates, setCompletionDates] = useState<
    Map<string, string>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [watchedTime, setWatchedTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [signedVideoUrl, setSignedVideoUrl] = useState<string | null>(null);

  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const watchTimeRef = useRef(0);
  const lastSavedTimeRef = useRef(0);
  const saveIntervalRef = useRef<any>(null);
  const lastUpdateTimeRef = useRef(Date.now());
  const completedLessonsRef = useRef<Set<string>>(new Set());
  const iframeIdRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const storageVideoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const lastAllowedTimeRef = useRef(0);

  useEffect(() => {
    completedLessonsRef.current = completedLessons;
  }, [completedLessons]);

  useEffect(() => {
    setLessons([]);
    setCourse(null);
    setLoading(true);
    setCompletedLessons(new Set());
    setCompletionDates(new Map());
    setVideoProgress(0);
    setWatchedTime(0);
    setVideoDuration(0);
    setSignedVideoUrl(null);
    setIsPlaying(false);
    watchTimeRef.current = 0;
    lastSavedTimeRef.current = 0;
    lastAllowedTimeRef.current = 0;
  }, [courseId, partNumber]);

  useEffect(() => {
    if (user && courseId) loadCourseData();
  }, [user, courseId, partNumber]);

  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  const currentLesson = lessons[partIndex] || null;
  const currentYtId = currentLesson
    ? extractYouTubeId(currentLesson.video_url)
    : null;
  const currentLessonVideos = currentLesson
    ? lessonVideos.get(currentLesson.id) ?? []
    : [];
  const storageVideo = currentLessonVideos.find(
    (v) => v.video_provider === "storage" && (v.storage_path || v.video_url)
  );
  const isStorageVideo = !!storageVideo;

  const fetchSignedUrl = useCallback(
    async (path: string) => {
      try {
        const { data, error } = await supabase.storage
          .from("course-videos")
          .createSignedUrl(path, 3600);
        if (error) throw error;
        setSignedVideoUrl(data.signedUrl);
      } catch (err) {
        console.error("Failed to get signed URL:", err);
        setSignedVideoUrl(null);
      }
    },
    []
  );

  const togglePlayPause = useCallback(() => {
    if (isStorageVideo && storageVideoRef.current) {
      if (storageVideoRef.current.paused) {
        storageVideoRef.current.play();
      } else {
        storageVideoRef.current.pause();
      }
    } else if (playerRef.current?.getPlayerState) {
      const state = playerRef.current.getPlayerState();
      if (state === 1) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  }, [isStorageVideo]);

  const toggleFullscreen = useCallback(() => {
    if (!videoContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoContainerRef.current.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    if (storageVideo?.storage_path) {
      fetchSignedUrl(storageVideo.storage_path);
    } else {
      setSignedVideoUrl(null);
    }
  }, [storageVideo?.storage_path, fetchSignedUrl]);

  const saveWatchTime = useCallback(async () => {
    if (!user || !currentLesson || !playerRef.current) return;
    const lessonId = currentLesson.id;
    const currentWatchTime = watchTimeRef.current;
    if (currentWatchTime <= lastSavedTimeRef.current) return;

    try {
      const currentVideoPosition = Math.floor(
        playerRef.current.getCurrentTime
          ? playerRef.current.getCurrentTime()
          : 0
      );
      const isComp = completedLessonsRef.current.has(lessonId);
      const progressPct =
        videoDuration > 0
          ? Math.min(
              Math.round((currentVideoPosition / videoDuration) * 100),
              100
            )
          : 0;

      const { data: existing } = await supabase
        .from("user_course_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_course_progress")
          .update({
            completed: isComp,
            progress_percent: progressPct,
            last_watched_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("user_course_progress").insert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          completed: isComp,
          progress_percent: progressPct,
          last_watched_at: new Date().toISOString(),
        });
      }
      lastSavedTimeRef.current = currentWatchTime;
    } catch (error) {
      console.error("Error saving watch time:", error);
    }
  }, [user, currentLesson, courseId, videoDuration]);

  useEffect(() => {
    if (!currentLesson || !currentYtId) return;

    isMountedRef.current = true;
    iframeIdRef.current += 1;
    const thisIframeId = iframeIdRef.current;
    setVideoProgress(0);
    setWatchedTime(0);
    setVideoDuration(0);
    lastUpdateTimeRef.current = Date.now();
    watchTimeRef.current = 0;
    lastSavedTimeRef.current = 0;

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
    playerRef.current = null;

    const iframeElId = `yt-player-${thisIframeId}`;

    const attachApi = () => {
      if (!isMountedRef.current) return;
      const el = document.getElementById(iframeElId);
      if (!el || !(window as any).YT?.Player) return;

      try {
        playerRef.current = new (window as any).YT.Player(iframeElId, {
          events: {
            onReady: () => {
              if (!isMountedRef.current || !playerRef.current) return;
              try {
                const dur = Math.floor(playerRef.current.getDuration());
                if (isMountedRef.current && dur > 0) setVideoDuration(dur);

                progressIntervalRef.current = setInterval(() => {
                  if (
                    !isMountedRef.current ||
                    !playerRef.current?.getCurrentTime
                  ) {
                    if (progressIntervalRef.current) {
                      clearInterval(progressIntervalRef.current);
                      progressIntervalRef.current = null;
                    }
                    return;
                  }
                  try {
                    const ct = Math.floor(
                      playerRef.current.getCurrentTime()
                    );
                    const d = playerRef.current.getDuration();
                    const state = playerRef.current.getPlayerState();

                    if (isMountedRef.current) {
                      setWatchedTime(ct);
                      const now = Date.now();
                      const diff =
                        (now - lastUpdateTimeRef.current) / 1000;
                      if (state === 1 && diff >= 0.9 && diff <= 1.5) {
                        watchTimeRef.current += 1;
                      }
                      lastUpdateTimeRef.current = now;
                      if (d > 0)
                        setVideoProgress(Math.min((ct / d) * 100, 100));
                    }
                  } catch (_e) {}
                }, 1000);

                saveIntervalRef.current = setInterval(
                  () => saveWatchTime(),
                  10000
                );
              } catch (_e) {}
            },
            onStateChange: (event: any) => {
              const state = event.data;
              if (state === 1) setIsPlaying(true);
              else if (state === 2 || state === 0 || state === 5)
                setIsPlaying(false);
              if (state === (window as any).YT.PlayerState.ENDED) {
                saveWatchTime();
              }
            },
          },
        });
      } catch (_e) {}
    };

    const tryAttach = () => {
      if ((window as any).YT?.Player) {
        setTimeout(attachApi, 500);
      } else {
        const prev = (window as any).onYouTubeIframeAPIReady;
        (window as any).onYouTubeIframeAPIReady = () => {
          if (typeof prev === "function") prev();
          setTimeout(attachApi, 300);
        };
      }
    };

    tryAttach();

    return () => {
      isMountedRef.current = false;
      saveWatchTime();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
      playerRef.current = null;
    };
  }, [currentLesson?.id, currentYtId]);

  const loadCourseData = async () => {
    try {
      const { data: courseData } = await supabase
        .from("courses")
        .select(
          "id, title, description, thumbnail_url, price, order_index, package_id"
        )
        .eq("id", courseId!)
        .maybeSingle();

      if (!courseData) {
        setLoading(false);
        return;
      }
      setCourse(courseData);

      const { data: lessonsData } = await supabase
        .from("course_lessons")
        .select(
          "id, course_id, title, description, video_url, duration, order_index"
        )
        .eq("course_id", courseId!)
        .order("order_index");

      if (lessonsData) {
        setLessons(lessonsData);

        const lessonIds = lessonsData.map((l: CourseLesson) => l.id);
        if (lessonIds.length > 0) {
          const { data: videosData } = await supabase
            .from("course_videos")
            .select(
              "id, lesson_id, title, video_provider, video_external_id, video_url, storage_path, duration_seconds, order_index"
            )
            .in("lesson_id", lessonIds)
            .order("order_index");

          if (videosData) {
            const vMap = new Map<string, LessonVideo[]>();
            for (const v of videosData as LessonVideo[]) {
              const existing = vMap.get(v.lesson_id) ?? [];
              existing.push(v);
              vMap.set(v.lesson_id, existing);
            }
            setLessonVideos(vMap);
          }
        }
      }

      if (user) {
        const [{ data: enrollmentData }, { data: purchaseData }] =
          await Promise.all([
            supabase
              .from("course_enrollments")
              .select("id")
              .eq("user_id", user.id)
              .eq("course_id", courseId!)
              .maybeSingle(),
            supabase
              .from("course_purchases")
              .select("id")
              .eq("user_id", user.id)
              .eq("course_id", courseId!)
              .maybeSingle(),
          ]);
        setIsEnrolled(!!enrollmentData || !!purchaseData);

        const { data: progressData } = await supabase
          .from("user_course_progress")
          .select("lesson_id, completed, completed_at")
          .eq("user_id", user.id)
          .eq("course_id", courseId!);

        if (progressData) {
          setCompletedLessons(
            new Set(
              progressData
                .filter((p) => p.completed)
                .map((p) => p.lesson_id)
            )
          );
          const datesMap = new Map<string, string>();
          for (const p of progressData) {
            if (p.completed && p.completed_at)
              datesMap.set(p.lesson_id, p.completed_at);
          }
          setCompletionDates(datesMap);
        }
      }
    } catch (error) {
      console.error("Error loading course data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLessonLockStatus = (
    index: number
  ): "available" | "locked" | "daily_locked" => {
    if (index === 0) return "available";
    if (!lessons[index]) return "locked";
    if (completedLessons.has(lessons[index].id)) return "available";

    const prevLesson = lessons[index - 1];
    if (!completedLessons.has(prevLesson.id)) return "locked";

    const prevCompletedAt = completionDates.get(prevLesson.id);
    if (!prevCompletedAt) return "available";

    const completedDate = new Date(prevCompletedAt);
    const now = new Date();
    const completedDay = new Date(
      completedDate.getFullYear(),
      completedDate.getMonth(),
      completedDate.getDate()
    );
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (completedDay.getTime() >= today.getTime()) return "daily_locked";
    return "available";
  };

  const markModuleComplete = async () => {
    if (!user || !currentLesson || completedLessons.has(currentLesson.id))
      return;

    try {
      await saveWatchTime();
      const now = new Date().toISOString();

      const { data: existing } = await supabase
        .from("user_course_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("lesson_id", currentLesson.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_course_progress")
          .update({
            completed: true,
            completed_at: now,
            progress_percent: 100,
            last_watched_at: now,
            updated_at: now,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("user_course_progress").insert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: currentLesson.id,
          completed: true,
          completed_at: now,
          progress_percent: 100,
          last_watched_at: now,
        });
      }

      setCompletedLessons(
        (prev) => new Set([...prev, currentLesson.id])
      );
      setCompletionDates((prev) =>
        new Map(prev).set(currentLesson.id, now)
      );

      await onLessonComplete(currentLesson.id);

      const isLast = partIndex === lessons.length - 1;

      toast.success("Lekce dokoncena!", {
        description: isLast
          ? "Gratulujeme! Dokoncili jste cely kurz!"
          : "Dalsi lekce bude dostupna zitra.",
      });

      if (isLast) {
        setTimeout(async () => {
          await unlockNextCourse();
        }, 2000);
      }
    } catch (error) {
      console.error("Error marking module complete:", error);
      toast.error("Chyba pri dokoncovani lekce");
    }
  };

  const unlockNextCourse = async () => {
    if (!user || !course) return;
    try {
      await supabase
        .from("course_enrollments")
        .update({
          completed: true,
          completion_date: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("course_id", courseId!);

      await onCourseComplete(courseId!);

      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ["#10b981", "#3b82f6", "#2563eb", "#f59e0b"],
      });

      toast.success("Kurz uspesne dokoncen!", {
        description: "Gratulujeme!",
        duration: 5000,
      });

      setTimeout(() => navigate(`/kurz/${courseId}`), 2000);
    } catch (error) {
      console.error("Error completing course:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!user) return <Navigate to="/prihlaseni" replace />;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Nacitani lekce...</p>
        </div>
      </div>
    );
  }

  if (!course || !isEnrolled) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Kurz nenalezen
          </h1>
          <p className="text-muted-foreground">
            Tento kurz neexistuje nebo k nemu nemate pristup.
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link to="/kurzy">Zpet na kurzy</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!currentLesson) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Lekce nenalezena
          </h1>
          <p className="text-muted-foreground">
            Tato cast kurzu neexistuje.
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link to={`/kurz/${courseId}`}>Zpet na kurz</Link>
          </Button>
        </div>
      </div>
    );
  }

  const lockStatus = getLessonLockStatus(partIndex);
  if (lockStatus !== "available") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          {lockStatus === "daily_locked" ? (
            <>
              <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <CalendarClock className="h-8 w-8 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                Lekce bude dostupna zitra
              </h1>
              <p className="text-muted-foreground">
                Kazdy den se odemkne nova lekce.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                Lekce je zamcena
              </h1>
              <p className="text-muted-foreground">
                Nejdrive dokoncete predchozi lekce.
              </p>
            </>
          )}
          <Button asChild variant="outline" className="mt-2">
            <Link to={`/kurz/${courseId}`}>Zpet na kurz</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isCompleted = completedLessons.has(currentLesson.id);
  const courseProgressPct =
    (completedLessons.size / lessons.length) * 100;
  const totalSeconds =
    videoDuration > 0 ? videoDuration : currentLesson.duration * 60;
  const remainingSeconds = Math.max(0, totalSeconds - watchedTime);
  const isLastPart = partIndex === lessons.length - 1;
  const isFirstPart = partIndex === 0;
  const nextPartStatus = !isLastPart
    ? getLessonLockStatus(partIndex + 1)
    : null;
  const canGoNext = nextPartStatus === "available";

  const ytEmbedUrl = currentYtId
    ? `https://www.youtube-nocookie.com/embed/${currentYtId}?enablejsapi=1&rel=0&modestbranding=1&controls=0&disablekb=1&iv_load_policy=3&fs=0&origin=${encodeURIComponent(window.location.origin)}`
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl py-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">
                      <Home className="size-4" />
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/kurzy">Kurzy</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      to={`/kurz/${courseId}`}
                      className="max-w-[120px] sm:max-w-[200px] truncate inline-block"
                    >
                      {course.title}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Cast {partIndex + 1}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {completedLessons.size}/{lessons.length}
                </span>
              </div>
              <Progress value={courseProgressPct} className="h-1.5 w-20" />
              <span className="text-xs font-semibold tabular-nums">
                {Math.round(courseProgressPct)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-6 lg:gap-8">
          <div className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto space-y-6">
            <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
              <div
                ref={videoContainerRef}
                className="bg-black aspect-video relative select-none"
                onContextMenu={(e) => e.preventDefault()}
              >
                {isStorageVideo && signedVideoUrl ? (
                  <video
                    ref={storageVideoRef}
                    className="absolute inset-0 w-full h-full"
                    controlsList="nodownload noremoteplayback"
                    disablePictureInPicture
                    onContextMenu={(e) => e.preventDefault()}
                    src={signedVideoUrl}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onSeeking={(e) => {
                      const vid = e.currentTarget;
                      if (
                        Math.abs(
                          vid.currentTime - lastAllowedTimeRef.current
                        ) > 2
                      ) {
                        vid.currentTime = lastAllowedTimeRef.current;
                      }
                    }}
                    onTimeUpdate={(e) => {
                      const vid = e.currentTarget;
                      lastAllowedTimeRef.current = vid.currentTime;
                      setWatchedTime(Math.floor(vid.currentTime));
                      if (vid.duration > 0) {
                        setVideoProgress(
                          (vid.currentTime / vid.duration) * 100
                        );
                        setVideoDuration(Math.floor(vid.duration));
                      }
                    }}
                    onLoadedMetadata={(e) => {
                      setVideoDuration(
                        Math.floor(e.currentTarget.duration)
                      );
                    }}
                  />
                ) : ytEmbedUrl ? (
                  <iframe
                    key={currentLesson.id}
                    id={`yt-player-${iframeIdRef.current}`}
                    src={ytEmbedUrl}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope"
                    referrerPolicy="strict-origin-when-cross-origin"
                    title={currentLesson.title}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-white/50">
                      Video neni k dispozici
                    </p>
                  </div>
                )}

                {(ytEmbedUrl || (isStorageVideo && signedVideoUrl)) && (
                  <div
                    className="absolute inset-0 z-10 cursor-pointer group"
                    onClick={togglePlayPause}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 bg-black/20 transition-opacity duration-300",
                        isPlaying
                          ? "opacity-0 group-hover:opacity-100"
                          : "opacity-100"
                      )}
                    />
                    <div
                      className={cn(
                        "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
                        isPlaying
                          ? "opacity-0 group-hover:opacity-100"
                          : "opacity-100"
                      )}
                    >
                      <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110">
                        {isPlaying ? (
                          <Pause className="h-7 w-7 text-black" />
                        ) : (
                          <Play className="h-7 w-7 text-black ml-1" />
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={cn(
                        "absolute bottom-3 right-3 w-9 h-9 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all duration-200",
                        isPlaying
                          ? "opacity-0 group-hover:opacity-100"
                          : "opacity-100"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFullscreen();
                      }}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="px-4 sm:px-5 py-3 bg-muted/30 border-t">
                <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span className="tabular-nums">
                    {formatTime(watchedTime)}
                  </span>
                  <span className="tabular-nums">
                    -{formatTime(remainingSeconds)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="text-xs font-medium gap-1.5 px-2.5 py-1"
                >
                  <GraduationCap className="h-3 w-3" />
                  Cast {partIndex + 1} z {lessons.length}
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-xs font-medium gap-1.5 px-2.5 py-1"
                >
                  <Clock className="h-3 w-3" />
                  {currentLesson.duration} min
                </Badge>
                {isCompleted && (
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-medium gap-1.5 px-2.5 py-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Dokonceno
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                {currentLesson.title}
              </h1>

              {currentLesson.description && (
                <p className="text-base text-muted-foreground leading-relaxed">
                  {currentLesson.description}
                </p>
              )}
            </div>

            {course.description && (
              <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                      O kurzu
                    </h2>
                    <p className="text-sm leading-relaxed">
                      {course.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isCompleted && (
              <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-primary/[0.02] p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1">
                      Dokoncili jste tuto lekci?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Oznacte lekci jako dokoncene pro odemknuti dalsiho
                      obsahu.
                    </p>
                  </div>
                  <Button
                    onClick={markModuleComplete}
                    size="lg"
                    className="w-full sm:w-auto flex-shrink-0"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Dokoncit lekci
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              {!isFirstPart && (
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={() =>
                    navigate(`/kurz/${courseId}/cast/${partIndex}`)
                  }
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="truncate">Predchozi lekce</span>
                </Button>
              )}

              {!isLastPart && (
                <Button
                  variant={canGoNext ? "default" : "outline"}
                  className={cn(
                    "flex-1 sm:flex-none",
                    !canGoNext && "opacity-60"
                  )}
                  disabled={!canGoNext}
                  onClick={() =>
                    canGoNext &&
                    navigate(`/kurz/${courseId}/cast/${partIndex + 2}`)
                  }
                >
                  {nextPartStatus === "daily_locked" ? (
                    <>
                      <CalendarClock className="h-4 w-4 mr-2" />
                      <span className="truncate">Dostupne zitra</span>
                    </>
                  ) : nextPartStatus === "locked" ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      <span className="truncate">Zamceno</span>
                    </>
                  ) : (
                    <>
                      <span className="truncate">Dalsi lekce</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start rounded-2xl border bg-card overflow-hidden lg:max-h-[calc(100vh-6rem)]">
            <CourseDocsSidebar
              lessons={lessons}
              completedLessons={completedLessons}
              currentPartIndex={partIndex}
              courseId={courseId!}
              courseProgress={courseProgressPct}
              getLessonLockStatus={getLessonLockStatus}
            />
          </div>
        </div>
      </div>

      <PhysioChatbot />

      {lastXpEvent && (
        <XpRewardPopup
          amount={lastXpEvent.amount}
          source={lastXpEvent.source}
          newBadges={lastXpEvent.newBadges}
          newRank={lastXpEvent.newRank}
          visible={!!lastXpEvent}
          onClose={clearLastEvent}
        />
      )}
    </div>
  );
}
