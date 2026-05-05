/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { CalendarCheck, CreditCard, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
        const meRes = await api.get("/students/me");
        const me = unwrap<{ id: string; classId?: string }>(meRes);

        const [attendanceRes, resultRes, feeRes, examsRes, noticeRes] = await Promise.all([
          api.get(`/attendance/student/${me.id}`),
          api.get(`/results/student/${me.id}`),
          api.get(`/fees/student/${me.id}`),
          me.classId ? api.get(`/exams?classId=${me.classId}`) : Promise.resolve({ data: { data: [] } }),
          api.get("/notices/feed"),
        ]);

        const attendance = unwrap<{ Parcentage?: number; percentage?: number }>(attendanceRes);
        const results = unwrap<{ percentage?: number }>(resultRes);
        const fees = unwrap<{ outstanding?: number }>(feeRes);
        const exams = unwrap<Array<any>>(examsRes);
        const noticeFeed = unwrap<Array<any>>(noticeRes);

        setAttendancePercent(attendance.percentage ?? attendance.Parcentage ?? 0);
        setResultPercent(results.percentage ?? 0);
        setPendingFees(fees.outstanding ?? 0);

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
          <h3 className="text-lg font-semibold">Quick Actions</h3>
          <div className="mt-4 space-y-3 text-sm">
            <button className="w-full rounded-lg border border-border/60 px-3 py-2 text-left hover:bg-secondary/40">Pay Fees</button>
            <button className="w-full rounded-lg border border-border/60 px-3 py-2 text-left hover:bg-secondary/40">Download Report Card</button>
            <button className="w-full rounded-lg border border-border/60 px-3 py-2 text-left hover:bg-secondary/40">View Admit Card</button>
          </div>
        </div>
      </div>
    </div>
  );
}