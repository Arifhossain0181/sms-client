/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  User,
  School,
  Clock,
  Filter,
  Inbox,
  Loader2,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import { useTimetables, useDeleteTimetable } from "../timetable/useTimetable";
import { useClasses } from "../class/useClasses";
import TimetableForm from "./TimetableForm";
import { Timetable, DayOfWeek } from "./timetable.types";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

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

// Subject card gradients — readable in BOTH light & dark mode
const subjectGradients = [
  "from-sky-100 to-blue-50 dark:from-sky-500/20 dark:to-blue-500/10 border-sky-300/60 dark:border-sky-400/30",
  "from-indigo-100 to-blue-50 dark:from-indigo-500/20 dark:to-blue-500/10 border-indigo-300/60 dark:border-indigo-400/30",
  "from-violet-100 to-indigo-50 dark:from-violet-500/20 dark:to-indigo-500/10 border-violet-300/60 dark:border-violet-400/30",
  "from-blue-100 to-sky-50 dark:from-blue-500/20 dark:to-sky-500/10 border-blue-300/60 dark:border-blue-400/30",
  "from-purple-100 to-violet-50 dark:from-purple-500/20 dark:to-violet-500/10 border-purple-300/60 dark:border-purple-400/30",
  "from-cyan-100 to-sky-50 dark:from-cyan-500/20 dark:to-sky-500/10 border-cyan-300/60 dark:border-cyan-400/30",
];

const dayAccent: Record<DayOfWeek, string> = {
  SATURDAY: "from-sky-500 to-blue-500",
  SUNDAY: "from-blue-500 to-indigo-500",
  MONDAY: "from-indigo-500 to-violet-500",
  TUESDAY: "from-violet-500 to-purple-500",
  WEDNESDAY: "from-sky-500 to-indigo-500",
  THURSDAY: "from-indigo-500 to-blue-500",
};

export default function TimetableGrid() {
  const { data: timetables, isLoading } = useTimetables();
  const { data: classes } = useClasses();
  const { mutate: deleteTimetable } = useDeleteTimetable();
  const { role } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Timetable | null>(null);
  const [classId, setClassId] = useState("");

  const filtered = timetables?.filter((t) =>
    classId ? t.classId === classId : true
  );

  const groupedByDay = DAYS.reduce((acc, day) => {
    acc[day] = filtered?.filter((t) => t.dayOfWeek === day) ?? [];
    return acc;
  }, {} as Record<DayOfWeek, Timetable[]>);

  const subjectColorMap: Record<string, string> = {};
  let colorIndex = 0;
  filtered?.forEach((t) => {
    if (!subjectColorMap[t.subjectId]) {
      subjectColorMap[t.subjectId] =
        subjectGradients[colorIndex % subjectGradients.length];
      colorIndex++;
    }
  });

  const handleEdit = (t: Timetable) => {
    setSelected(t);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete করবেন?")) deleteTimetable(id);
  };

  const handleClose = () => {
    setShowForm(false);
    setSelected(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-sky-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-400/20 dark:bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 right-0 h-80 w-80 rounded-full bg-violet-400/20 dark:bg-violet-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-400/20 dark:bg-indigo-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Timetable
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-500/15 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300/50 dark:ring-indigo-400/30">
                    <Sparkles className="h-3 w-3" />
                    Weekly
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  Class অনুযায়ী সাপ্তাহিক রুটিন
                </p>
              </div>
            </div>

            {role && hasPermission(role, "manage_timetable") && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-violet-500/40 transition-shadow"
              >
                <Plus className="h-4 w-4" />
                Add Class
              </button>
            )}
          </div>
        </div>

        {/* Class Filter */}
        <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Filter by Class
            </span>
          </div>
          <div className="relative">
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-950/80 px-4 py-2.5 pr-10 text-sm font-medium text-slate-900 dark:text-slate-100 outline-none transition duration-200 hover:border-indigo-400 dark:hover:border-indigo-400/50 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
            >
              <option value="">সব Class</option>
              {classes?.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}{" "}
                  {cls.sections && cls.sections.length > 0
                    ? `(${cls.sections.length} sections)`
                    : ""}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <CalendarDays className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </div>
          </div>
        </div>

        {/* Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {DAYS.map((day, idx) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl shadow-sm overflow-hidden"
            >
              {/* Day Header */}
              <div
                className={`relative px-5 py-3 bg-gradient-to-r ${dayAccent[day]} text-white`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <h2 className="text-sm font-bold tracking-wide">
                      {dayLabel[day]}
                    </h2>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-semibold">
                    {groupedByDay[day].length} টি class
                  </span>
                </div>
              </div>

              {/* Classes */}
              <div className="p-4">
                {groupedByDay[day].length > 0 ? (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {groupedByDay[day]
                        .sort((a, b) =>
                          a.startTime.localeCompare(b.startTime)
                        )
                        .map((t) => (
                          <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className={`rounded-xl border bg-gradient-to-br ${
                              subjectColorMap[t.subjectId]
                            } p-3 space-y-2`}
                          >
                            {/* Subject + Time */}
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {t.subject?.name ?? "—"}
                              </h3>
                              <span className="inline-flex items-center gap-1 rounded-md bg-white/70 dark:bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-100 ring-1 ring-slate-300/60 dark:ring-white/10">
                                <Clock className="h-3 w-3" />
                                {t.startTime} - {t.endTime}
                              </span>
                            </div>

                            {/* Teacher */}
                            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                              <User className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                              {t.teacher?.name ?? "—"}
                            </div>

                            {/* Class */}
                            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                              <School className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" />
                              {t.class?.name} — {t.class?.section}
                            </div>

                            {/* Actions */}
                            {role &&
                              hasPermission(role, "manage_timetable") && (
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={() => handleEdit(t)}
                                    className="inline-flex items-center gap-1 rounded-md bg-white/60 dark:bg-white/5 px-2 py-1 text-[11px] font-medium text-sky-700 dark:text-sky-200 ring-1 ring-sky-300/60 dark:ring-white/10 hover:bg-sky-100 dark:hover:bg-sky-500/15 transition-colors"
                                  >
                                    <Pencil className="h-3 w-3" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(t.id)}
                                    className="inline-flex items-center gap-1 rounded-md bg-white/60 dark:bg-white/5 px-2 py-1 text-[11px] font-medium text-rose-700 dark:text-rose-200 ring-1 ring-rose-300/60 dark:ring-white/10 hover:bg-rose-100 dark:hover:bg-rose-500/15 transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Delete
                                  </button>
                                </div>
                              )}
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 dark:bg-white/5 mb-2">
                      <Inbox className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      এই দিনে কোনো class নেই
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <TimetableForm timetable={selected} onClose={handleClose} />
      )}
    </div>
  );
}
