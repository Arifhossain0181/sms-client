"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: new Date(2000, index, 1).toLocaleString("en-US", { month: "long" }),
}));

export default function StudentAttendancePage() {
  const { role } = useAuth();
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0, percentage: 0 });
  const [records, setRecords] = useState<Array<{ id: string; date: string; status: string }>>([]);

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
        const meRes = await api.get("/students/me");
        const me = unwrap<{ id: string }>(meRes);
        const attendanceRes = await api.get(`/attendance/student/${me.id}`, {
          params: { month, year },
        });
        const attendance = unwrap<{
          total: number;
          present: number;
          absent: number;
          late: number;
          Parcentage?: number;
          percentage?: number;
          records?: Array<{ id: string; date: string; status: string }>;
        }>(attendanceRes);

        setSummary({
          total: attendance.total ?? 0,
          present: attendance.present ?? 0,
          absent: attendance.absent ?? 0,
          late: attendance.late ?? 0,
          percentage: attendance.percentage ?? attendance.Parcentage ?? 0,
        });

        setRecords(
          (attendance.records ?? []).map((record) => ({
            id: record.id,
            date: formatDate(record.date),
            status: record.status,
          }))
        );
      } catch (err) {
        setError("Attendance load failed");
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, [month, year]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground">Monthly attendance overview.</p>
        </div>
        <Link
          href="/dashboard/student"
          className="text-sm text-primary hover:underline"
        >
          Back to dashboard
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={month}
          onChange={(event) => setMonth(Number(event.target.value))}
          className="rounded-lg border border-border/60 bg-card px-3 py-2 text-sm"
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
          className="rounded-lg border border-border/60 bg-card px-3 py-2 text-sm"
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total", value: summary.total },
          { label: "Present", value: summary.present },
          { label: "Absent", value: summary.absent },
          { label: "Late", value: summary.late },
          { label: "Percentage", value: `${summary.percentage}%` },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border/60 bg-card p-4 shadow-soft">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        <h2 className="text-lg font-semibold">Attendance Records</h2>
        {loading && <p className="mt-4 text-sm text-muted-foreground">Loading...</p>}
        {!loading && records.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">No attendance records found.</p>
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
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="py-3 text-foreground">{record.date}</td>
                    <td className="py-3 text-foreground">{record.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
