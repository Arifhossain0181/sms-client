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
    { label: "Total Days", value: summary?.total ?? 0, icon: CalendarCheck },
    { label: "Present", value: summary?.present ?? 0, icon: TrendingUp },
    { label: "Absent", value: summary?.absent ?? 0, icon: TrendingDown },
    { label: "Late", value: summary?.late ?? 0, icon: Minus },
    { label: "Percentage", value: `${summary?.percentage ?? 0}%`, icon: CalendarCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground">Monitor your children&apos;s attendance.</p>
        </div>
        <Link href="/dashboard/parent" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>

      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-300/60 dark:border-amber-400/30 bg-amber-50/60 dark:bg-amber-500/5 p-6 shadow-soft"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-semibold text-foreground">Low Attendance Alerts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert: any) => (
              <motion.div
                key={alert.childId}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-between rounded-lg border border-amber-200/60 dark:border-amber-500/20 bg-white/60 dark:bg-white/[0.03] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{alert.childName}</p>
                  <p className="text-xs text-muted-foreground">
                    Attendance: {alert.attendancePercentage}% · {alert.absentDays} absent out of {alert.totalDays} days
                  </p>
                </div>
                <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">Below 75%</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{selectedChild.name}</h2>
              <p className="text-xs text-muted-foreground">
                {selectedChild.class?.name ?? "Class"} · {selectedChild.section?.name ?? "Section"} · Roll: {selectedChild.rollNumber ?? "-"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
                className="rounded-lg border border-border/60 bg-card px-3 py-2 text-sm text-foreground"
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
                className="rounded-lg border border-border/60 bg-card px-3 py-2 text-sm text-foreground"
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="rounded-xl border border-border/60 bg-card p-4 shadow-soft space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={item}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-soft"
                >
                  <div className="flex items-center gap-2">
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                  </div>
                  <p className={`mt-2 text-lg font-semibold ${stat.label === "Percentage" ? attendanceColor : "text-foreground"}`}>
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}

          <div className="mt-6 rounded-2xl border border-border/60 bg-card/80 shadow-soft overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-secondary/20">
              <h3 className="text-base font-semibold text-foreground">Attendance Records</h3>
              {!attendanceLoading && summary && summary.percentage > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendIcon percentage={summary.percentage} />
                  <span>{summary.percentage}% attendance</span>
                </div>
              )}
            </div>

            {attendanceLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : records.length === 0 ? (
              <div className="p-12 text-center">
                <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No attendance records found for this month.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-3 px-4 text-left">Date</th>
                      <th className="py-3 px-4 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {records.map((record) => {
                      const style = statusStyles[record.status] ?? statusStyles.ABSENT;
                      return (
                        <tr key={record.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="py-3 px-4 text-foreground">{formatDate(record.date)}</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${style.badge}`}>
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
    </div>
  );
}
