"use client";

import { useMemo, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  GraduationCap,
  LayoutGrid,
  MapPinned,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTimetableByTeacher } from "@/app/modules/timetable/useTimetable";
import type { DayOfWeek, Timetable } from "@/app/modules/timetable/timetable.types";

const DAYS: DayOfWeek[] = [
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
];

const dayLabel: Record<DayOfWeek, string> = {
  SATURDAY: "শনিবার",
  SUNDAY: "রবিবার",
  MONDAY: "সোমবার",
  TUESDAY: "মঙ্গলবার",
  WEDNESDAY: "বুধবার",
  THURSDAY: "বৃহস্পতিবার",
};

const dayAccent: Record<DayOfWeek, string> = {
  SATURDAY: "from-sky-500 to-blue-500",
  SUNDAY: "from-blue-500 to-indigo-500",
  MONDAY: "from-indigo-500 to-violet-500",
  TUESDAY: "from-violet-500 to-purple-500",
  WEDNESDAY: "from-sky-500 to-indigo-500",
  THURSDAY: "from-indigo-500 to-blue-500",
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
  const { role, user } = useAuth();
  const teacherId = user?.id ?? "";
  const canLoad = role === "TEACHER" && !!teacherId;

  const { data: timetable = [], isLoading, isError } = useTimetableByTeacher(
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

  if (!canLoad) {
    return (
      <div className="w-full max-w-none rounded-3xl border border-rose-200/60 bg-rose-50/70 p-6 text-rose-800 shadow-sm">
        <p className="font-semibold">Teacher timetable is available for teacher accounts only.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative w-full max-w-none space-y-6 overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-violet-500/10 blur-3xl" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8 rounded-3xl border border-white/30 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
            <div className="h-8 w-1/3 rounded-xl bg-slate-200 animate-pulse" />
            <div className="mt-3 h-4 w-1/2 rounded-xl bg-slate-200 animate-pulse" />
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-200/70 animate-pulse" />
              ))}
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-64 rounded-3xl bg-slate-200/70 animate-pulse" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-4 rounded-3xl border border-white/30 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
            <div className="h-6 w-2/5 rounded-xl bg-slate-200 animate-pulse" />
            <div className="mt-5 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-slate-200/70 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-none rounded-3xl border border-rose-200/60 bg-rose-50/70 p-6 text-rose-800 shadow-sm">
        <p className="font-semibold">We could not load your timetable right now.</p>
        <p className="mt-1 text-sm">Please try again after a moment.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-none space-y-6 overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-violet-500/10 blur-3xl" />
      <div className="absolute -right-24 top-24 -z-10 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
      <div className="absolute -left-20 top-40 -z-10 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />

      <motion.section
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-[2rem] border border-white/40 bg-white/75 p-6 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur-2xl"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-700">
              <Sparkles className="h-3.5 w-3.5" />
              Live backend schedule
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl">
                Class Timetable
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 lg:text-base">
                Your weekly routine is loaded directly from the backend, with every slot grouped by day for fast review.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto">
            <StatCard icon={<LayoutGrid className="h-4 w-4" />} label="Total slots" value={String(totalSlots)} />
            <StatCard icon={<GraduationCap className="h-4 w-4" />} label="Classes" value={String(totalClasses)} />
            <StatCard icon={<CalendarDays className="h-4 w-4" />} label="Subjects" value={String(totalSubjects)} />
            <StatCard icon={<Clock className="h-4 w-4" />} label="Today" value={String(todaySlots)} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <Badge icon={<MapPinned className="h-3.5 w-3.5" />} text="Teacher schedule endpoint connected" />
          <Badge icon={<Clock className="h-3.5 w-3.5" />} text={nextClass ? `Next: ${formatTime(nextClass.startTime)}` : "No upcoming slot found"} />
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8 space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {DAYS.map((day, index) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-3xl border border-white/40 bg-white/80 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.4)] backdrop-blur-xl overflow-hidden"
              >
                <div className={`flex items-center justify-between bg-gradient-to-r ${dayAccent[day]} px-5 py-4 text-white`}>
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
                          <div
                            key={slot.id}
                            className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-semibold text-slate-900">
                                  {slot.subject?.name ?? "Assigned subject"}
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                  {slot.class?.name ?? "Class"} {slot.section?.name ? `• ${slot.section.name}` : ""}
                                </p>
                              </div>
                              <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                                <Clock className="h-3.5 w-3.5" />
                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                              </div>
                            </div>

                            <div className="mt-3 grid gap-2 text-xs text-slate-600">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-sky-500" />
                                <span>{getTeacherName(slot)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center">
                      <CalendarDays className="h-10 w-10 text-slate-300" />
                      <p className="mt-3 text-sm font-medium text-slate-700">No class on this day</p>
                      <p className="mt-1 text-xs text-slate-500">Your timetable is empty for {dayLabel[day].toLowerCase()}.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.aside
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="xl:col-span-4 rounded-[2rem] border border-white/40 bg-white/80 p-5 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.4)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Timetable Notes</h2>
              <p className="text-xs text-slate-500">Clean, live, and role-aware.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <NoteCard
              title="Backend connected"
              text="This page pulls schedule data through the teacher schedule API and groups it by weekday."
            />
            <NoteCard
              title="Responsive layout"
              text="The page uses the full dashboard width, so the timetable cards breathe on larger screens."
            />
            <NoteCard
              title="Color system"
              text="The accent palette follows the notification panel's sky/indigo/violet language for a consistent experience."
            />
          </div>
        </motion.aside>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
          {icon}
        </div>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <div className="mt-4 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function Badge({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700">
      {icon}
      {text}
    </div>
  );
}

function NoteCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">{text}</p>
    </div>
  );
}
