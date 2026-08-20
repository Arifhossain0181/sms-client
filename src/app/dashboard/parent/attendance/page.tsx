"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import api from "@/lib/axios";
import {
  UsersRound,
  CalendarCheck,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Inbox,
  Sparkles,
  Clock,
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

type AttendanceRecord = {
  id: string;
  date: string;
  status: string;
};

type AttendanceSummary = {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
};

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

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: new Date(2000, index, 1).toLocaleString("en-US", { month: "long" }),
}));

const statusStyles: Record<string, { badge: string; label: string }> = {
  PRESENT: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    label: "Present",
  },
  ABSENT: {
    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
    label: "Absent",
  },
  LATE: {
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    label: "Late",
  },
};

const TrendIcon = ({ percentage }: { percentage: number }) => {
  if (percentage >= 75)
    return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (percentage >= 50)
    return <Minus className="h-4 w-4 text-amber-500" />;
  return <TrendingDown className="h-4 w-4 text-rose-500" />;
};

export default function ParentAttendancePage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const isParent = !!role && role === "PARENT";

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());

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

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ["parents", "children", selectedChildId, "attendance", month, year],
    queryFn: async () => {
      const res = await api.get(`/parents/me/children/${selectedChildId}/attendance`, {
        params: { month, year },
      });
      const payload = unwrap<{ records: AttendanceRecord[]; summary: AttendanceSummary }>(res);
      return payload;
    },
    enabled: Boolean(isParent && selectedChildId),
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ["parents", "alerts"],
    queryFn: async () => {
      const res = await api.get("/parents/me/alerts");
      return unwrap<Array<any>>(res);
    },
    enabled: isParent,
  });

  const records = useMemo(() => attendanceData?.records ?? [], [attendanceData]);
  const summary = useMemo(() => attendanceData?.summary ?? null, [attendanceData]);

  const attendanceColor = useMemo(() => {
    const pct = summary?.percentage ?? selectedChild?.attendancePercentage ?? 0;
    if (pct >= 75) return "text-emerald-600 dark:text-emerald-400";
    if (pct >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  }, [summary, selectedChild]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, idx) => currentYear - idx);
  }, []);

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

  const stats = [
    { label: "Total Days", value: summary?.total ?? 0, icon: CalendarCheck, color: "from-slate-400 to-slate-500" },
    { label: "Present", value: summary?.present ?? 0, icon: TrendingUp, color: "from-emerald-400 to-teal-500" },
    { label: "Absent", value: summary?.absent ?? 0, icon: TrendingDown, color: "from-rose-400 to-pink-500" },
    { label: "Late", value: summary?.late ?? 0, icon: Minus, color: "from-amber-400 to-orange-500" },
    { label: "Percentage", value: `${summary?.percentage ?? 0}%`, icon: CalendarCheck, color: "from-indigo-400 to-violet-500" },
  ];

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
                  <CalendarCheck className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Attendance
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Monitor your children&apos;s attendance.
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

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="px-4 sm:px-6 pb-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/5 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Low Attendance Alerts</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {alerts.map((alert: any) => (
                    <motion.div
                      key={alert.childId}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-between rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-white/60 dark:bg-white/5 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{alert.childName}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Attendance: {alert.attendancePercentage}% · {alert.absentDays} absent out of {alert.totalDays} days
                        </p>
                      </div>
                      <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">Below 75%</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Children selector */}
          {childrenLoading ? (
            <div className="px-4 sm:px-6">
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
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{selectedChild.name}</h2>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {selectedChild.class?.name ?? "Class"} · {selectedChild.section?.name ?? "Section"} · Roll:{" "}
                        {selectedChild.rollNumber ?? "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={month}
                        onChange={(event) => setMonth(Number(event.target.value))}
                        className="rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/40 backdrop-blur-sm"
                      >
                        {monthOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={year}
                        onChange={(event) => setYear(Number(event.target.value))}
                        className="rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/40 backdrop-blur-sm"
                      >
                        {yearOptions.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {attendanceLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <div key={idx} className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 space-y-3">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {stats.map((stat, i) => (
                        <motion.div
                          key={stat.label}
                          custom={i}
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          className="relative flex items-center gap-3 p-4 rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm"
                        >
                          <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-md shadow-indigo-500/20`}>
                            <stat.icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">{stat.label}</p>
                            <p className={`text-lg font-bold text-slate-800 dark:text-white mt-0.5 ${stat.label === "Percentage" ? attendanceColor : ""}`}>{stat.value}</p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  <div className="mt-6 rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/30 dark:border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                          <Clock className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Attendance Records</h3>
                      </div>
                      {!attendanceLoading && summary && summary.percentage > 0 && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <TrendIcon percentage={summary.percentage} />
                          <span>{summary.percentage}% attendance</span>
                        </div>
                      )}
                    </div>

                    {attendanceLoading ? (
                      <div className="p-6 space-y-3">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-xl border border-white/20 dark:border-white/10 px-4 py-3">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                        ))}
                      </div>
                    ) : records.length === 0 ? (
                      <div className="p-12 text-center">
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                        >
                          <Inbox className="w-6 h-6 text-indigo-400" />
                        </motion.div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No attendance records found for this month.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/30 dark:border-white/10 text-left text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              <th className="px-6 py-3 font-medium">Date</th>
                              <th className="px-6 py-3 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/30 dark:divide-white/5">
                            {records.map((record) => {
                              const style = statusStyles[record.status] ?? statusStyles.ABSENT;
                              return (
                                <tr key={record.id} className="hover:bg-white/40 dark:hover:bg-white/10 transition-colors">
                                  <td className="px-6 py-3 text-slate-700 dark:text-slate-200">{formatDate(record.date)}</td>
                                  <td className="px-6 py-3">
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${style.badge}`}>
                                      {style.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
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
