/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { CalendarCheck, CreditCard, Trophy, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLenis } from "@/hooks/useLenis";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { StatCard } from "../components/StatCard";

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

export default function StudentDashboard() {
  useLenis();
  const router = useRouter();
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
  const [todayClasses, setTodayClasses] = useState<Array<{ id: string; subject: string; startTime: string; endTime: string; teacher?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (role && role !== "STUDENT") {
      router.replace("/dashboard");
    }
  }, [role, router]);

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
        setError(null);
        let me: { id: string; classId?: string };
        try {
          const meRes = await api.get("/students/me");
          me = unwrap<{ id: string; classId?: string }>(meRes);
        } catch (error: unknown) {
          const status = (error as { response?: { status?: number } }).response?.status;
          if (status === 404) {
            // Student profile not found - redirect to admission form
            // Using router.replace for SPA navigation instead of window.location.href
            router.replace("/apply-for-admission?reason=profile_not_found");
            return;
          }
          throw error;
        }

        // Priority 1: Load attendance first (shows immediately)
        try {
          const attendanceRes = await api.get(`/attendance/my-attendance`);
          const attendance = unwrap<{ Parcentage?: number; percentage?: number; present?: number; absent?: number; late?: number; records?: Array<any> }>(attendanceRes);
          
          setAttendancePercent(attendance?.percentage ?? attendance?.Parcentage ?? 0);
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
        } catch (err) {
          console.error("Attendance load failed", err);
        }

        // Load today's classes
        try {
          const todayRes = await api.get(`/timetable/my-routine/today`);
          const todayData = unwrap<Array<any>>(todayRes);
          setTodayClasses(
            todayData.map((slot: any) => ({
              id: slot.id,
              subject: slot.subject?.name ?? "Subject",
              startTime: slot.startTime,
              endTime: slot.endTime,
              teacher: slot.teacher?.user?.name ?? slot.teacher?.name,
            }))
          );
        } catch (err) {
          console.error("Today's classes load failed", err);
        }

        // ✅ Priority 2: Load remaining data in parallel (non-blocking)
        Promise.allSettled([
          api.get(`/results/my-results`),
          api.get(`/fees/my-fees`),
          me.classId ? api.get(`/dashboard/student/dashboard/exams`) : Promise.resolve({ data: { data: [] } }),
          api.get("/notices/feed"),
        ]).then(([resultRes, feeRes, examsRes, noticeRes]) => {
          const resultsPayload = resultRes.status === "fulfilled"
            ? unwrap<Array<any>>(resultRes.value)
            : [];
          const fees = feeRes.status === "fulfilled"
            ? unwrap<{ totalDue?: number; totalPaid?: number; totalOverdue?: number }>(feeRes.value)
            : null;
          const exams = examsRes.status === "fulfilled"
            ? unwrap<Array<any>>(examsRes.value)
            : [];
          const noticeFeed = noticeRes.status === "fulfilled"
            ? unwrap<Array<any>>(noticeRes.value)
            : [];

          const latestResult = resultsPayload?.[0];
          const latestSubjects = latestResult?.subjects ?? [];
          const totalObtained = latestSubjects.reduce((sum: number, m: any) => sum + (m.marksObtained ?? 0), 0);
          const totalFull = latestSubjects.reduce((sum: number, m: any) => sum + (m.subject?.fullMarks ?? 0), 0);
          const percentage = totalFull > 0 ? Math.round((totalObtained / totalFull) * 100) : 0;

          setResultPercent(percentage);
          setPendingFees(fees?.totalDue ?? 0);

          const resultItems = latestSubjects.slice(0, 5).map((mark: any) => ({
            id: mark.id,
            subject: mark.subject?.name ?? "Subject",
            exam: latestResult?.exam?.name ?? "Exam",
            marks: `${mark.marksObtained ?? "-"}/${mark.subject?.fullMarks ?? "-"}`,
            grade: mark.grade ?? undefined,
          }));
          setRecentResults(resultItems);

          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const examItems = (exams ?? [])
            .filter((exam: any) => exam.status === "UPCOMING" && exam.nextExamDate)
            .sort((a: any, b: any) => new Date(a.nextExamDate).getTime() - new Date(b.nextExamDate).getTime())
            .slice(0, 2)
            .map((exam: any) => ({
              id: exam.examId,
              title: `${exam.examName} (${exam.examType})`,
              date: formatShortDate(exam.nextExamDate),
            }));

          setUpcomingExams(examItems);

          setNotices(
            noticeFeed.slice(0, 2).map((notice: any) => ({
              id: notice.id,
              title: notice.title,
              date: formatShortDate(notice.publishedAt ?? notice.createdAt),
            }))
          );
        }).finally(() => {
          setLoading(false);
        });
      } catch (error) {
        console.error("Failed to load student dashboard", error);
        setError((error as Error).message || "Failed to load dashboard data");
        setLoading(false);
      }
    };

    loadStudentDashboard();
  }, [monthKey, router]);

  // Show loading screen while fetching data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if any
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive font-semibold mb-2">Error loading dashboard</p>
          <p className="text-muted-foreground">{error}</p>
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
        className="relative w-full max-w-6xl my-8 space-y-6"
      >
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Student Dashboard</h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your classes, attendance, and results.</p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-white/80 dark:bg-white/10 border border-white/40 dark:border-white/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors shadow-sm"
              >
                Back to dashboard
              </Link>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              <StatCard icon={CalendarCheck} label="Attendance" numeric={attendancePercent} suffix="%" value={`${attendancePercent}%`} trend={0} trendLabel="this month" colorScheme="indigo" />
              <StatCard icon={Trophy} label="Recent Result" numeric={resultPercent} suffix="%" value={`${resultPercent}%`} trend={0} trendLabel="last exam" delay={0.08} colorScheme="indigo" />
              <StatCard icon={CreditCard} label="Pending Fees" numeric={pendingFees} prefix="৳" value={`৳${pendingFees.toLocaleString()}`} trend={0} trendLabel="due soon" delay={0.16} colorScheme="indigo" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="rounded-2xl bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-900/40 dark:to-slate-800/40 border border-white/40 dark:border-white/10 backdrop-blur-sm p-6 shadow-soft hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Upcoming Exams</h3>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {loading && <p className="text-xs text-muted-foreground">Loading exams...</p>}
                  {!loading && upcomingExams.length === 0 && (
                    <p className="text-xs text-muted-foreground">No upcoming exams.</p>
                  )}
                  {!loading && upcomingExams.map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-200">{exam.title}</span>
                      <span className="text-xs">{exam.date}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-900/40 dark:to-slate-800/40 border border-white/40 dark:border-white/10 backdrop-blur-sm p-6 shadow-soft hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Attendance Snapshot</h3>
                  <Link
                    href="/dashboard/student/attendance"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                  <div className="rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3 text-center">
                    <p className="text-sm font-semibold text-foreground">{attendanceSummary.present}</p>
                    <p>Present</p>
                  </div>
                  <div className="rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3 text-center">
                    <p className="text-sm font-semibold text-foreground">{attendanceSummary.absent}</p>
                    <p>Absent</p>
                  </div>
                  <div className="rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3 text-center">
                    <p className="text-sm font-semibold text-foreground">{attendanceSummary.late}</p>
                    <p>Late</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {loading && <p className="text-xs text-muted-foreground">Loading attendance...</p>}
                  {!loading && recentAttendance.length === 0 && (
                    <p className="text-xs text-muted-foreground">No attendance records.</p>
                  )}
                  {!loading && recentAttendance.map((record) => {
                    const style = statusStyles[record.status] ?? statusStyles.ABSENT;
                    return (
                      <div key={record.id} className="flex items-center justify-between">
                        <span className="text-slate-700 dark:text-slate-200">{record.date}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${style.badge}`}>
                          {style.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-900/40 dark:to-slate-800/40 border border-white/40 dark:border-white/10 backdrop-blur-sm p-6 shadow-soft hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Recent Notices</h3>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {loading && <p className="text-xs text-muted-foreground">Loading notices...</p>}
                  {!loading && notices.length === 0 && (
                    <p className="text-xs text-muted-foreground">No notices yet.</p>
                  )}
                  {!loading && notices.map((notice) => (
                    <div key={notice.id} className="flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-200">{notice.title}</span>
                      <span className="text-xs">{notice.date}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-900/40 dark:to-slate-800/40 border border-white/40 dark:border-white/10 backdrop-blur-sm p-6 shadow-soft hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Recent Results</h3>
                  <Link
                    href="/dashboard/student/results"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
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
                      <span className="text-slate-700 dark:text-slate-200">{result.subject} • {result.exam}</span>
                      <span className="text-xs">{result.marks}{result.grade ? ` (${result.grade})` : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-900/40 dark:to-slate-800/40 border border-white/40 dark:border-white/10 backdrop-blur-sm p-6 shadow-soft hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Today&apos;s Classes</h3>
                  <Link
                    href="/dashboard/timetable"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View timetable
                  </Link>
                </div>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {todayClasses.length === 0 && !loading && (
                    <p className="text-xs text-muted-foreground">No classes scheduled for today.</p>
                  )}
                  {todayClasses.map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-200">{cls.subject}</span>
                      <span className="text-xs">
                        {cls.startTime} - {cls.endTime}
                        {cls.teacher ? ` • ${cls.teacher}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-900/40 dark:to-slate-800/40 border border-white/40 dark:border-white/10 backdrop-blur-sm p-6 shadow-soft hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Quick Actions</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <Link
                    href="/dashboard/student/attendance"
                    className="block w-full rounded-lg border border-white/40 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 py-2 text-left text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors"
                  >
                    View Attendance
                  </Link>
                  <Link
                    href="/dashboard/student/results"
                    className="block w-full rounded-lg border border-white/40 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 py-2 text-left text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors"
                  >
                    View Results
                  </Link>
                  <button className="w-full rounded-lg border border-white/40 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 py-2 text-left text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors">Pay Fees</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          EduCore Student Center
        </motion.p>
      </motion.div>
    </div>
  );
}