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
  Loader2,
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

const subjectGradients = [
  "from-sky-100 to-blue-50 dark:from-sky-500/20 dark:to-blue-500/10 border-sky-300/60 dark:border-sky-400/30",
  "from-indigo-100 to-blue-50 dark:from-indigo-500/20 dark:to-blue-500/10 border-indigo-300/60 dark:border-indigo-400/30",
  "from-violet-100 to-indigo-50 dark:from-violet-500/20 dark:to-indigo-500/10 border-violet-300/60 dark:border-violet-400/30",
  "from-blue-100 to-sky-50 dark:from-blue-500/20 dark:to-sky-500/10 border-blue-300/60 dark:border-blue-400/30",
  "from-purple-100 to-violet-50 dark:from-purple-500/20 dark:to-violet-500/10 border-purple-300/60 dark:border-purple-400/30",
  "from-cyan-100 to-sky-50 dark:from-cyan-500/20 dark:to-sky-500/10 border-cyan-300/60 dark:border-cyan-400/30",
];

const dayAccent: Record<string, string> = {
  SATURDAY: "from-sky-500 to-blue-500",
  SUNDAY: "from-blue-500 to-indigo-500",
  MONDAY: "from-indigo-500 to-violet-500",
  TUESDAY: "from-violet-500 to-purple-500",
  WEDNESDAY: "from-sky-500 to-indigo-500",
  THURSDAY: "from-indigo-500 to-blue-500",
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Timetable</h1>
          <p className="text-sm text-muted-foreground">View your children&apos;s weekly class routine.</p>
        </div>
        <Link href="/dashboard/parent" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>

      {childrenLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-border/60 bg-card p-4 shadow-soft space-y-3">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      ) : children.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-12 shadow-soft text-center">
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">No children linked</p>
          <p className="text-xs text-muted-foreground mt-1">Children will appear here once linked to your account.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {children.map((child) => (
              <motion.button
                key={child.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedChildId(child.id)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedChildId === child.id
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-transparent shadow-lg shadow-indigo-500/20"
                    : "border-border/60 hover:bg-secondary/40 text-foreground"
                }`}
              >
                <UsersRound className="h-4 w-4" />
                {child.name}
              </motion.button>
            ))}
          </div>

          {selectedChild && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft"
            >
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground">{selectedChild.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {selectedChild.class?.name ?? "Class"} · {selectedChild.section?.name ?? "Section"} · Roll: {selectedChild.rollNumber ?? "-"}
                </p>
              </div>

              {timetableLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft space-y-3">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-4/5" />
                    </div>
                  ))}
                </div>
              ) : timetable.length === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-card/80 p-12 shadow-soft text-center">
                  <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No timetable available yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {DAYS.map((day, idx) => (
                    <motion.div
                      key={day}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-2xl border border-border/60 bg-card/80 shadow-soft overflow-hidden"
                    >
                      <div
                        className={`relative px-5 py-3 bg-gradient-to-r ${dayAccent[day]} text-white`}
                      >
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
                                    className={`rounded-xl border bg-gradient-to-br ${
                                      subjectColorMap[t.subjectId]
                                    } p-3 space-y-2 cursor-default`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <h3 className="text-sm font-bold text-foreground">
                                        {t.subject?.name ?? "—"}
                                      </h3>
                                      <span className="inline-flex items-center gap-1 rounded-md bg-white/70 dark:bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-foreground ring-1 ring-border/60">
                                        <Clock className="h-3 w-3" />
                                        {t.startTime} - {t.endTime}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <User className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                                      {t.teacher?.user?.name ?? "—"}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <School className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                                      {t.class?.name} — {t.section?.name}
                                    </div>

                                    {t.roomNumber && (
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1 rounded-md bg-white/70 dark:bg-white/10 px-2 py-0.5 text-[11px] font-medium text-foreground ring-1 ring-border/60">
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
                            <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary/40 mb-2">
                              <Inbox className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground">No classes this day</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
