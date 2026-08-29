"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  Clock,
  GraduationCap,
  LayoutGrid,
  MapPinned,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useTimetableByTeacher } from "@/app/modules/timetable/useTimetable";
import type { DayOfWeek, Timetable } from "@/app/modules/timetable/timetable.types";
import { useMyProfile } from "@/app/modules/teachers/useTeachers";

const DAYS: DayOfWeek[] = [
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
];

const dayLabel: Record<DayOfWeek, string> = {
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
};

function formatTime(value: string) {
  const [rawHours, rawMinutes] = value.split(":");
  const hours = Number(rawHours);
  if (!Number.isFinite(hours) || !rawMinutes) return value;

  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = ((hours + 11) % 12) + 1;
  return `${displayHours}:${rawMinutes} ${suffix}`;
}

function getDayOrder(day: DayOfWeek) {
  return DAYS.indexOf(day);
}

function getTeacherName(slot: Timetable) {
  const teacher = slot.teacher as
    | {
        name?: string;
        user?: {
          name?: string;
        };
      }
    | undefined;

  return teacher?.user?.name ?? teacher?.name ?? "Teacher";
}

export default function Page() {
  const router = useRouter();
  const { role } = useAuth();
  const { data: profile, isLoading: profileLoading } = useMyProfile(role === "TEACHER");
  const teacherId = profile?.id ?? "";
  const canLoad = role === "TEACHER" && !!teacherId;

  const { data: timetable = [], isLoading, isError, refetch } = useTimetableByTeacher(
    teacherId,
    canLoad
  );

  const groupedByDay = useMemo(() => {
    return DAYS.reduce((acc, day) => {
      acc[day] = timetable.filter((slot) => slot.dayOfWeek === day);
      return acc;
    }, {} as Record<DayOfWeek, Timetable[]>);
  }, [timetable]);

  const totalSlots = timetable.length;
  const totalSubjects = new Set(timetable.map((slot) => slot.subjectId)).size;
  const totalClasses = new Set(
    timetable.map((slot) => `${slot.classId}-${slot.section?.id ?? ""}`)
  ).size;
  const todayKey = useMemo<DayOfWeek | null>(() => {
    const dayIndex = new Date().getDay();
    const map: Partial<Record<number, DayOfWeek>> = {
      0: "SUNDAY",
      1: "MONDAY",
      2: "TUESDAY",
      3: "WEDNESDAY",
      4: "THURSDAY",
      6: "SATURDAY",
    };
    return map[dayIndex] ?? null;
  }, []);
  const todaySlots = todayKey ? groupedByDay[todayKey].length : 0;

  const nextClass = useMemo(() => {
    const sorted = [...timetable].sort((a, b) => {
      const dayDiff = getDayOrder(a.dayOfWeek) - getDayOrder(b.dayOfWeek);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });
    return sorted[0] ?? null;
  }, [timetable]);

  useEffect(() => {
    if (role && role !== "TEACHER" && role !== "SUPER_ADMIN" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const handleRefresh = () => {
    refetch();
    toast.success("Timetable refreshed");
  };

  if (role === "TEACHER" && profileLoading) {
    return (
      <div className="relative min-h-[80vh] flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
        <div className="relative w-full">
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-8 space-y-4">
            <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mt-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-200/50 dark:bg-slate-700/30 rounded-3xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!canLoad) {
    return (
      <div className="relative w-full max-w-none flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-8 text-center">
          <p className="font-semibold text-slate-700 dark:text-slate-300">Teacher timetable is available for teacher accounts only.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative min-h-[80vh] flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 -left-32 w-[500px] h-[500px] bg-sky-300/20 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 -right-32 w-[600px] h-[600px] bg-violet-300/20 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none"
        />
        <div className="relative w-full">
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-8 space-y-4">
            <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mt-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-200/50 dark:bg-slate-700/30 rounded-3xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="relative w-full max-w-none flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 -left-32 w-[500px] h-[500px] bg-sky-300/20 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 -right-32 w-[600px] h-[600px] bg-violet-300/20 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none"
        />
        <div className="relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-8 text-center">
          <p className="font-semibold text-slate-700 dark:text-slate-300">We could not load your timetable right now.</p>
          <button
            onClick={handleRefresh}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-none space-y-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
      {/* Animated background orbs */}
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 -left-32 w-[500px] h-[500px] bg-sky-300/20 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 -right-32 w-[600px] h-[600px] bg-violet-300/20 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-300/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"
      />

      <motion.section
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full rounded-3xl border border-white/30 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden"
      >
        {/* Gradient Header */}
        <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
          <motion.div
            animate={{ x: [0, 100, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
          />

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.08, rotate: 4 }}
                className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center cursor-pointer"
              >
                <CalendarDays className="w-6 h-6 text-white" />
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                  animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                />
              </motion.div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  Class Timetable
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Your weekly routine is loaded directly from the backend.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatPill icon={<LayoutGrid className="h-4 w-4" />} label="Slots" value={String(totalSlots)} />
                <StatPill icon={<GraduationCap className="h-4 w-4" />} label="Classes" value={String(totalClasses)} />
                <StatPill icon={<BookOpen className="h-4 w-4" />} label="Subjects" value={String(totalSubjects)} />
                <StatPill icon={<Clock className="h-4 w-4" />} label="Today" value={String(todaySlots)} />
              </div>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex flex-wrap items-center gap-3 text-sm text-slate-600"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <MapPinned className="h-3.5 w-3.5 text-indigo-500" />
              Backend connected
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              {nextClass ? `Next: ${formatTime(nextClass.startTime)}` : "No upcoming slot found"}
            </span>
          </motion.div>

          {/* Day Cards Grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {DAYS.map((day, index) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-5 py-4 text-white">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <h2 className="text-sm font-bold tracking-wide">{dayLabel[day]}</h2>
                  </div>
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold">
                    {groupedByDay[day].length} slots
                  </span>
                </div>

                <div className="p-4">
                  {groupedByDay[day].length > 0 ? (
                    <div className="space-y-3">
                      {groupedByDay[day]
                        .slice()
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((slot) => (
                          <motion.div
                            key={slot.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 p-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                                  {slot.subject?.name ?? "Assigned subject"}
                                </h3>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {slot.class?.name ?? "Class"} {slot.section?.name ? `• ${slot.section.name}` : ""}
                                </p>
                              </div>
                              <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                                <Clock className="h-3.5 w-3.5" />
                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                              <div className="h-2 w-2 rounded-full bg-sky-500" />
                              <span>{getTeacherName(slot)}</span>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5 px-4 py-12 text-center">
                      <CalendarDays className="h-10 w-10 text-slate-300" />
                      <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">No class on this day</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your timetable is empty for {dayLabel[day].toLowerCase()}.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1 }}
        className="mt-6 text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
      >
        Class Timetable
      </motion.p>
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
          {icon}
        </div>
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <div className="mt-3 text-xl font-bold text-slate-800 dark:text-white">{value}</div>
    </div>
  );
}
