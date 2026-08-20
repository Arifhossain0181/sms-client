"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios";
import {
  UsersRound,
  Calendar,
  Clock,
  User,
  School,
  ArrowLeft,
  Inbox,
  Sparkles,
} from "lucide-react";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

type ChildDetail = {
  id: string;
  name: string;
  rollNumber?: number;
  class?: { id: string; name: string };
  section?: { id: string; name: string };
  attendancePercentage?: number;
  pendingFees?: number;
  recentResultPercent?: number;
};

type TimetableItem = {
  id: string;
  classId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNumber?: string;
  class?: { id: string; name: string };
  section?: { id: string; name: string };
  subjectId: string;
  subject?: { id: string; name: string };
  teacherId: string;
  teacher?: { user: { name: string } };
};

const DAYS = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"] as const;

const dayLabel: Record<string, string> = {
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
};

const dayAccent: Record<string, string> = {
  SATURDAY: "from-sky-500 to-blue-500",
  SUNDAY: "from-blue-500 to-indigo-500",
  MONDAY: "from-indigo-500 to-violet-500",
  TUESDAY: "from-violet-500 to-purple-500",
  WEDNESDAY: "from-sky-500 to-indigo-500",
  THURSDAY: "from-indigo-500 to-blue-500",
};

const subjectGradients = [
  "from-sky-400 to-indigo-500",
  "from-indigo-400 to-violet-500",
  "from-violet-400 to-purple-500",
  "from-blue-400 to-sky-500",
  "from-purple-400 to-violet-500",
  "from-cyan-400 to-sky-500",
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ParentTimetablePage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const isParent = !!role && role === "PARENT";

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const { data: children = [], isLoading: childrenLoading } = useQuery({
    queryKey: ["parents", "children"],
    queryFn: async () => {
      const res = await api.get("/parents/me/children-detailed");
      const payload = unwrap<ChildDetail[]>(res);
      return Array.isArray(payload) ? payload : [];
    },
    enabled: isParent,
  });

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedChildId),
    [children, selectedChildId]
  );

  const { data: timetable = [], isLoading: timetableLoading } = useQuery({
    queryKey: ["parents", "children", selectedChildId, "timetable"],
    queryFn: async () => {
      const res = await api.get(`/parents/me/children/${selectedChildId}/timetable`);
      const payload = unwrap<TimetableItem[]>(res);
      return Array.isArray(payload) ? payload : [];
    },
    enabled: Boolean(isParent && selectedChildId),
  });

  const subjectColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    let colorIndex = 0;
    for (const t of timetable) {
      if (!map[t.subjectId]) {
        map[t.subjectId] = subjectGradients[colorIndex % subjectGradients.length];
        colorIndex++;
      }
    }
    return map;
  }, [timetable]);

  const groupedByDay = useMemo(() => {
    return DAYS.reduce((acc, day) => {
      acc[day] = timetable.filter((t) => t.dayOfWeek === day);
      return acc;
    }, {} as Record<string, TimetableItem[]>);
  }, [timetable]);

  useEffect(() => {
    if (isParent && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [isParent, children, selectedChildId]);

  useEffect(() => {
    if (role && role !== "PARENT") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  if (!isParent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="relative w-full p-4 sm:p-6 space-y-6"
      >
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          {/* Header */}
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
                  <Calendar className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Timetable
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    View your children&apos;s weekly class routine.
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/parent"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </div>
          </div>

          {/* Children selector */}
          {childrenLoading ? (
            <div className="px-4 sm:px-6 pt-6">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-10 w-40 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10" />
                ))}
              </div>
            </div>
          ) : children.length === 0 ? (
            <div className="p-6">
              <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-12 text-center">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                >
                  <Inbox className="w-6 h-6 text-indigo-400" />
                </motion.div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No children linked</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Children will appear here once linked to your account.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 sm:px-6 pt-6">
                <div className="flex flex-wrap gap-2">
                  {children.map((child) => (
                    <motion.button
                      key={child.id}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedChildId(child.id)}
                      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                        selectedChildId === child.id
                          ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white border-transparent shadow-lg shadow-indigo-500/30"
                          : "border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10"
                      }`}
                    >
                      <UsersRound className="h-4 w-4" />
                      {child.name}
                    </motion.button>
                  ))}
                </div>
              </div>

              {selectedChild && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 sm:p-6"
                >
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{selectedChild.name}</h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {selectedChild.class?.name ?? "Class"} · {selectedChild.section?.name ?? "Section"} · Roll: {selectedChild.rollNumber ?? "-"}
                    </p>
                  </div>

                  {timetableLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 space-y-3">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-4/5" />
                        </div>
                      ))}
                    </div>
                  ) : timetable.length === 0 ? (
                    <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-12 text-center">
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                      >
                        <Inbox className="w-6 h-6 text-indigo-400" />
                      </motion.div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No timetable available yet.</p>
                    </div>
                  ) : (
                    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {DAYS.map((day, idx) => (
                        <motion.div
                          key={day}
                          custom={idx}
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm overflow-hidden"
                        >
                          <div className={`px-5 py-3 bg-gradient-to-r ${dayAccent[day]} text-white`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <h2 className="text-sm font-bold tracking-wide">{dayLabel[day]}</h2>
                              </div>
                              <span className="inline-flex items-center rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-semibold">
                                {groupedByDay[day].length} classes
                              </span>
                            </div>
                          </div>

                          <div className="p-4">
                            {groupedByDay[day].length > 0 ? (
                              <div className="space-y-3">
                                <AnimatePresence>
                                  {groupedByDay[day]
                                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                    .map((t, index) => (
                                      <motion.div
                                        key={t.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ y: -2, transition: { duration: 0.2 } }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`rounded-xl border bg-gradient-to-br ${subjectColorMap[t.subjectId]} p-3 space-y-2`}
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                            {t.subject?.name ?? "—"}
                                          </h3>
                                          <span className="inline-flex items-center gap-1 rounded-md bg-white/70 dark:bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 ring-1 ring-white/40 dark:ring-white/10">
                                            <Clock className="h-3 w-3" />
                                            {t.startTime} - {t.endTime}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                          <User className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                                          {t.teacher?.user?.name ?? "—"}
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                          <School className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                                          {t.class?.name} — {t.section?.name}
                                        </div>

                                        {t.roomNumber && (
                                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                            <span className="inline-flex items-center gap-1 rounded-md bg-white/70 dark:bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-200 ring-1 ring-white/40 dark:ring-white/10">
                                              Room: {t.roomNumber}
                                            </span>
                                          </div>
                                        )}
                                      </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                              <div className="grid h-12 w-12 place-items-center rounded-full bg-white/60 dark:bg-white/5 mb-2">
                                <Inbox className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">No classes this day</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                  )}
                </motion.div>
              )}
            </>
          )}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          EduCore Parent Panel
        </motion.p>
      </motion.div>
    </div>
  );
}
