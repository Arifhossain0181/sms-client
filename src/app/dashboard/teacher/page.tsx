/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { CalendarCheck, ClipboardList, Layers, Sparkles, Users, UserCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLenis } from "@/hooks/useLenis";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import api from "@/lib/axios";
import { StatCard } from "../components/StatCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherDashboard() {
  useLenis();
  const router = useRouter();
  const { role, user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalSubjects: 0,
    upcomingExams: 0,
  });
  const [schedule, setSchedule] = useState<Array<{ id: string; title: string; time: string; sectionId: string; classId: string }>>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<Array<{ id: string; label: string; status: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "TEACHER") {
      window.location.href = "/dashboard";
    }
  }, [role]);

  const todayKey = useMemo(() => {
    const dayNames = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    return dayNames[new Date().getDay()];
  }, []);

  useEffect(() => {
    const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

    const loadTeacherDashboard = async () => {
      try {
        setLoading(true);

        if (!user?.id) {
          setSchedule([]);
          setAttendanceStatus([]);
          setStats({ totalStudents: 0, totalClasses: 0, totalSubjects: 0, upcomingExams: 0 });
          return;
        }

        const teacherId = user.id;

        const [statsRes, scheduleRes] = await Promise.all([
          api.get(`/teachers/${teacherId}/dashboard`),
          api.get(`/teachers/${teacherId}/schedule`),
        ]);

        const dashboardStats = unwrap<{ totalStudents: number; totalClasses: number; totalSubjects: number; upcomingExams: number }>(statsRes);
        setStats({
          totalStudents: dashboardStats.totalStudents ?? 0,
          totalClasses: dashboardStats.totalClasses ?? 0,
          totalSubjects: dashboardStats.totalSubjects ?? 0,
          upcomingExams: dashboardStats.upcomingExams ?? 0,
        });

        const schedulePayload = unwrap<Array<any>>(scheduleRes);
        const todaySchedule = schedulePayload
          .filter((item) => item.dayOfWeek === todayKey)
          .map((item) => ({
            id: item.id,
            title: `${item.section?.class?.name ?? "Class"} - ${item.subject?.name ?? "Subject"}`,
            time: `${item.startTime} - ${item.endTime}`,
            sectionId: item.section?.id,
            classId: item.section?.classId,
          }));

        setSchedule(todaySchedule);

        const dateKey = new Date().toISOString().split("T")[0];
        const attendanceChecks = await Promise.all(
          todaySchedule.map((item) =>
            api
              .get("/attendance/by-date", {
                params: { classId: item.classId, sectionId: item.sectionId, date: dateKey },
              })
              .then((res) => ({
                id: item.id,
                label: item.title,
                status: (unwrap<Array<any>>(res).length > 0) ? "Submitted" : "Pending",
              }))
              .catch(() => ({ id: item.id, label: item.title, status: "Pending" }))
          )
        );

        setAttendanceStatus(attendanceChecks);
      } catch (error) {
        console.error("Failed to load teacher dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    loadTeacherDashboard();
  }, [todayKey, user]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const listItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative min-h-[80vh] flex items-start sm:items-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
      {/* Animated background orbs */}
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
        className="relative w-full my-6"
      >
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          {/* Gradient Header */}
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
                  <UserCheck className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Teacher Dashboard
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Today&apos;s classes and tasks.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/dashboard/teacher/attendance")}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Take Attendance
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {/* Stats */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              <StatCard icon={Layers} label="Assigned Classes" numeric={stats.totalClasses} value={stats.totalClasses.toString()} trend={0} trendLabel="this term" colorScheme="indigo" />
              <StatCard icon={Users} label="Assigned Students" numeric={stats.totalStudents} value={stats.totalStudents.toString()} trend={0} trendLabel="this term" delay={0.08} colorScheme="indigo" />
              <StatCard icon={CalendarCheck} label="Assigned Subjects" numeric={stats.totalSubjects} value={stats.totalSubjects.toString()} trend={0} trendLabel="this term" delay={0.16} colorScheme="indigo" />
            </motion.div>

            {/* Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Today's Schedule */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm p-4 sm:p-6 shadow-sm"
              >
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">Today&apos;s Class Schedule</h3>
                <div className="mt-4 space-y-3">
                  {loading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-48 bg-slate-200/60 dark:bg-slate-700/40" />
                            <Skeleton className="h-3 w-32 bg-slate-200/60 dark:bg-slate-700/40" />
                          </div>
                          <Skeleton className="h-4 w-24 bg-slate-200/60 dark:bg-slate-700/40" />
                        </div>
                      ))}
                    </div>
                  ) : schedule.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-white/70 dark:bg-white/10 mb-3">
                        <ClipboardList className="h-5 w-5 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No classes scheduled for today.</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Enjoy your free time!</p>
                    </div>
                  ) : (
                    <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
                      {schedule.map((scheduleItem) => (
                        <motion.div
                          key={scheduleItem.id}
                          variants={listItem}
                          className="flex items-center justify-between rounded-xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">{scheduleItem.title}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Section {scheduleItem.sectionId?.slice(-4) ?? ""}</p>
                          </div>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-white/5 px-2.5 py-1 rounded-full">
                            {scheduleItem.time}
                          </span>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Recent Attendance */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm p-4 sm:p-6 shadow-sm"
              >
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">Recent Attendance</h3>
                <div className="mt-4 space-y-3">
                  {loading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-48 bg-slate-200/60 dark:bg-slate-700/40" />
                            <Skeleton className="h-3 w-32 bg-slate-200/60 dark:bg-slate-700/40" />
                          </div>
                          <Skeleton className="h-5 w-20 rounded-full bg-slate-200/60 dark:bg-slate-700/40" />
                        </div>
                      ))}
                    </div>
                  ) : attendanceStatus.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-white/70 dark:bg-white/10 mb-3">
                        <ClipboardList className="h-5 w-5 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No attendance submitted today.</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Start marking attendance for your classes.</p>
                    </div>
                  ) : (
                    <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
                      {attendanceStatus.map((attendanceItem) => (
                        <motion.div
                          key={attendanceItem.id}
                          variants={listItem}
                          className="flex items-center justify-between rounded-xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">{attendanceItem.label}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Attendance record</p>
                          </div>
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              attendanceItem.status === "Submitted"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/20"
                            }`}
                          >
                            {attendanceItem.status}
                          </span>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          Teacher Dashboard
        </motion.p>
      </motion.div>
    </div>
  );
}