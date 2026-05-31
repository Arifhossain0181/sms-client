/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { CalendarCheck, CreditCard, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLenis } from "@/hooks/useLenis";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { StatCard } from "../components/StatCard";

export default function StudentDashboard() {
  useLenis();
  const { role } = useAuth();
  const [attendancePercent, setAttendancePercent] = useState(0);
  const [resultPercent, setResultPercent] = useState(0);
  const [pendingFees, setPendingFees] = useState(0);
  const [attendanceSummary, setAttendanceSummary] = useState<{ present: number; absent: number; late: number }>({
    present: 0,
    absent: 0,
    late: 0,
  });
  const [recentAttendance, setRecentAttendance] = useState<Array<{ id: string; date: string; status: string }>>([]);
  const [recentResults, setRecentResults] = useState<Array<{ id: string; subject: string; exam: string; marks: string; grade?: string }>>([]);
  const [upcomingExams, setUpcomingExams] = useState<Array<{ id: string; title: string; date: string }>>([]);
  const [notices, setNotices] = useState<Array<{ id: string; title: string; date: string }>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (role && role !== "STUDENT") {
      window.location.href = "/dashboard";
    }
  }, [role]);

  const monthKey = useMemo(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${month}`;
  }, []);

  useEffect(() => {
    const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;
    const formatShortDate = (value: string | Date) =>
      new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(
        typeof value === "string" ? new Date(value) : value
      );

    const loadStudentDashboard = async () => {
      try {
        setLoading(true);
        let me: { id: string; classId?: string };
        try {
          const meRes = await api.get("/students/me");
          me = unwrap<{ id: string; classId?: string }>(meRes);
        } catch (error: unknown) {
          const status = (error as { response?: { status?: number } }).response?.status;
          if (status === 404) {
            window.location.href = "/apply-for-admission";
            return;
          }
          throw error;
        }

        const [attendanceRes, resultRes, feeRes, examsRes, noticeRes] = await Promise.allSettled([
          api.get(`/attendance/student/${me.id}`),
          api.get(`/results/student/${me.id}`),
          api.get(`/fees/student/${me.id}`),
          me.classId ? api.get(`/exams?classId=${me.classId}`) : Promise.resolve({ data: { data: [] } }),
          api.get("/notices/feed"),
        ]);

        const attendance = attendanceRes.status === "fulfilled"
          ? unwrap<{ Parcentage?: number; percentage?: number; present?: number; absent?: number; late?: number; records?: Array<any> }>(attendanceRes.value)
          : null;
        const results = resultRes.status === "fulfilled"
          ? unwrap<{ percentage?: number; marks?: Array<any> }>(resultRes.value)
          : null;
        const fees = feeRes.status === "fulfilled"
          ? unwrap<{ outstanding?: number }>(feeRes.value)
          : null;
        const exams = examsRes.status === "fulfilled"
          ? unwrap<Array<any>>(examsRes.value)
          : [];
        const noticeFeed = noticeRes.status === "fulfilled"
          ? unwrap<Array<any>>(noticeRes.value)
          : [];

        setAttendancePercent(attendance?.percentage ?? attendance?.Parcentage ?? 0);
        setResultPercent(results?.percentage ?? 0);
        setPendingFees(fees?.outstanding ?? 0);

        setAttendanceSummary({
          present: attendance?.present ?? 0,
          absent: attendance?.absent ?? 0,
          late: attendance?.late ?? 0,
        });

        const attendanceRecords = (attendance?.records ?? []).slice(0, 5).map((record: any) => ({
          id: record.id,
          date: formatShortDate(record.date),
          status: record.status,
        }));
        setRecentAttendance(attendanceRecords);

        const resultItems = (results?.marks ?? []).slice(0, 5).map((mark: any) => ({
          id: mark.id,
          subject: mark.subject?.name ?? "Subject",
          exam: mark.exam?.name ?? "Exam",
          marks: `${mark.marksObtained ?? "-"}/${mark.subject?.fullMarks ?? "-"}`,
          grade: mark.grade ?? undefined,
        }));
        setRecentResults(resultItems);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const examItems = exams
          .flatMap((exam: any) =>
            (exam.schedules ?? []).map((schedule: any) => ({
              id: schedule.id,
              title: `${exam.name} - ${schedule.subject?.name ?? "Subject"}`,
              date: formatShortDate(schedule.examDate),
              dateValue: new Date(schedule.examDate).getTime(),
            }))
          )
          .filter((item: any) => item.dateValue >= todayStart.getTime())
          .sort((a: any, b: any) => a.dateValue - b.dateValue)
          .slice(0, 2)
          .map(({ id, title, date }) => ({ id, title, date }));

        setUpcomingExams(examItems);

        setNotices(
          noticeFeed.slice(0, 2).map((notice: any) => ({
            id: notice.id,
            title: notice.title,
            date: formatShortDate(notice.publishedAt ?? notice.createdAt),
          }))
        );
      } catch (error) {
        console.error("Failed to load student dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    loadStudentDashboard();
  }, [monthKey]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your classes, attendance, and results.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <StatCard icon={CalendarCheck} label="Attendance" numeric={attendancePercent} suffix="%" value={`${attendancePercent}%`} trend={0} trendLabel="this month" />
        <StatCard icon={Trophy} label="Recent Result" numeric={resultPercent} suffix="%" value={`${resultPercent}%`} trend={0} trendLabel="last exam" delay={0.08} />
        <StatCard icon={CreditCard} label="Pending Fees" numeric={pendingFees} prefix="৳" value={`৳${pendingFees.toLocaleString()}`} trend={0} trendLabel="due soon" delay={0.16} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <h3 className="text-lg font-semibold">Upcoming Exams</h3>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            {loading && <p className="text-xs text-muted-foreground">Loading exams...</p>}
            {!loading && upcomingExams.length === 0 && (
              <p className="text-xs text-muted-foreground">No upcoming exams.</p>
            )}
            {!loading && upcomingExams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between">
                <span>{exam.title}</span>
                <span>{exam.date}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Attendance Snapshot</h3>
            <Link
              href="/dashboard/student/attendance"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="rounded-lg border border-border/50 bg-secondary/40 p-3 text-center">
              <p className="text-sm font-semibold text-foreground">{attendanceSummary.present}</p>
              <p>Present</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-secondary/40 p-3 text-center">
              <p className="text-sm font-semibold text-foreground">{attendanceSummary.absent}</p>
              <p>Absent</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-secondary/40 p-3 text-center">
              <p className="text-sm font-semibold text-foreground">{attendanceSummary.late}</p>
              <p>Late</p>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            {loading && <p className="text-xs text-muted-foreground">Loading attendance...</p>}
            {!loading && recentAttendance.length === 0 && (
              <p className="text-xs text-muted-foreground">No attendance records.</p>
            )}
            {!loading && recentAttendance.map((record) => (
              <div key={record.id} className="flex items-center justify-between">
                <span>{record.date}</span>
                <span className="text-xs uppercase tracking-wide">{record.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <h3 className="text-lg font-semibold">Recent Notices</h3>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            {loading && <p className="text-xs text-muted-foreground">Loading notices...</p>}
            {!loading && notices.length === 0 && (
              <p className="text-xs text-muted-foreground">No notices yet.</p>
            )}
            {!loading && notices.map((notice) => (
              <div key={notice.id} className="flex items-center justify-between">
                <span>{notice.title}</span>
                <span>{notice.date}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Results</h3>
            <Link
              href="/dashboard/student/results"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            {loading && <p className="text-xs text-muted-foreground">Loading results...</p>}
            {!loading && recentResults.length === 0 && (
              <p className="text-xs text-muted-foreground">No results yet.</p>
            )}
            {!loading && recentResults.map((result) => (
              <div key={result.id} className="flex items-center justify-between">
                <span>{result.subject} • {result.exam}</span>
                <span className="text-xs">{result.marks}{result.grade ? ` (${result.grade})` : ""}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
          <div className="mt-4 space-y-3 text-sm">
            <Link
              href="/dashboard/student/attendance"
              className="block w-full rounded-lg border border-border/60 px-3 py-2 text-left hover:bg-secondary/40"
            >
              View Attendance
            </Link>
            <Link
              href="/dashboard/student/results"
              className="block w-full rounded-lg border border-border/60 px-3 py-2 text-left hover:bg-secondary/40"
            >
              View Results
            </Link>
            <button className="w-full rounded-lg border border-border/60 px-3 py-2 text-left hover:bg-secondary/40">Pay Fees</button>
          </div>
        </div>
      </div>
    </div>
  );
}