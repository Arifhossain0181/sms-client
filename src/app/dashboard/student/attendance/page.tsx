"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  CalendarDays,
  UserRound,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Loader2,
} from "lucide-react";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: new Date(2000, index, 1).toLocaleString("en-US", { month: "long" }),
}));

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

export default function StudentAttendancePage() {
  const { role } = useAuth();
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AttendanceSummary>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    percentage: 0,
  });
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, idx) => currentYear - idx);
  }, []);

  useEffect(() => {
    if (role && role !== "STUDENT") {
      window.location.href = "/dashboard";
    }
  }, [role]);

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        setLoading(true);
        setError(null);

        const attendanceRes = await api.get("/attendance/my-attendance", {
          params: { month, year },
        });
        const attendance = unwrap<AttendanceSummary & { records?: AttendanceRecord[] }>(attendanceRes);

        setSummary({
          total: attendance.total ?? 0,
          present: attendance.present ?? 0,
          absent: attendance.absent ?? 0,
          late: attendance.late ?? 0,
          percentage: attendance.percentage ?? 0,
        });

        setRecords((attendance.records ?? []).map((record) => ({
          id: record.id,
          date: formatDate(record.date),
          status: record.status,
        })));
      } catch (err) {
        setError("Attendance load failed");
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, [month, year]);

  const stats = [
    { label: "Total Days", value: summary.total, icon: CalendarDays },
    { label: "Present", value: summary.present, icon: UserRound },
    { label: "Absent", value: summary.absent, icon: UserRound },
    { label: "Late", value: summary.late, icon: UserRound },
    { label: "Percentage", value: `${summary.percentage}%`, icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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
        <div className="relative w-full max-w-4xl">
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-8 space-y-4">
            <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="mt-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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
        className="relative w-full max-w-4xl my-8"
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
                  className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center"
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
                    Attendance
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Monthly attendance overview
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/student"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-white/80 dark:bg-white/10 border border-white/40 dark:border-white/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to dashboard
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 sm:px-8 py-4 flex flex-wrap gap-3 bg-white/40 dark:bg-white/5 border-b border-white/40 dark:border-white/5">
            {[
              { label: "Month", value: month, onChange: setMonth, options: monthOptions },
              { label: "Year", value: year, onChange: setYear, options: yearOptions.map(y => ({ value: y, label: String(y) })) },
            ].map((filter) => (
              <div key={filter.label} className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {filter.label}
                </label>
                <select
                  value={filter.value}
                  onChange={(event) => filter.onChange(Number(event.target.value))}
                  className="rounded-xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  {filter.options.map((option: { value: number; label: string }) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-rose-200/60 dark:border-rose-500/20 bg-rose-50/80 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 backdrop-blur-sm"
              >
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="popLayout">
              <motion.div
                layout
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
              >
                {stats.map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-900/40 dark:to-slate-800/40 border border-white/40 dark:border-white/10 backdrop-blur-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        {item.label}
                      </p>
                    </div>
                    <p className="mt-3 text-xl font-bold text-slate-800 dark:text-white">
                      {item.value}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            <div className="rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 backdrop-blur-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/40 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  Attendance Records
                  {!loading && summary.percentage > 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                      — {summary.percentage}% attendance
                    </span>
                  )}
                </h2>
                {!loading && summary.percentage > 0 && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <TrendIcon percentage={summary.percentage} />
                    <span className="font-medium">{summary.percentage}% attendance</span>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200/40 dark:border-slate-700/40">
                      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-3 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20">
                    <CalendarDays className="w-7 h-7 text-indigo-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    No attendance records for this month.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/40 dark:divide-white/5">
                  {records.map((record, i) => {
                    const style = statusStyles[record.status] ?? statusStyles.ABSENT;
                    return (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-white/60 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                            <CalendarDays className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {record.date}
                          </span>
                        </div>
                        <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${style.badge}`}>
                          {style.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          EduCore Attendance Center
        </motion.p>
      </motion.div>
    </div>
  );
}
