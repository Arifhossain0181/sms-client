"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  UserRound,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground">Monthly attendance overview.</p>
        </div>
        <Link
          href="/dashboard/student"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
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

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border/60 bg-card p-4 shadow-soft space-y-3"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-soft"
            >
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
              </div>
              <p className="mt-2 text-lg font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Attendance Records</h2>
          {!loading && summary.percentage > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendIcon percentage={summary.percentage} />
              <span>{summary.percentage}% attendance</span>
            </div>
          )}
        </div>

        {loading && (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {!loading && records.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">No attendance records found for this month.</p>
        )}

        {!loading && records.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 text-left">Date</th>
                  <th className="py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {records.map((record) => {
                  const style = statusStyles[record.status] ?? statusStyles.ABSENT;
                  return (
                    <tr key={record.id}>
                      <td className="py-3 text-foreground">{record.date}</td>
                      <td className="py-3">
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
    </div>
  );
}
