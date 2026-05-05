/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { CalendarCheck, ClipboardList, Layers, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLenis } from "@/hooks/useLenis";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { StatCard } from "../components/StatCard";

export default function TeacherDashboard() {
  useLenis();
  const { role } = useAuth();
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
        const meRes = await api.get("/teachers/me");
        const teacher = unwrap<{ id?: string }>(meRes);

        if (!teacher?.id) {
          console.error("Teacher profile missing id", teacher);
          setSchedule([]);
          setAttendanceStatus([]);
          setStats({ totalStudents: 0, totalClasses: 0, totalSubjects: 0, upcomingExams: 0 });
          return;
        }

        const [statsRes, scheduleRes] = await Promise.all([
          api.get(`/teachers/${teacher.id}/dashboard`),
          api.get(`/teachers/${teacher.id}/schedule`),
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
              .get("/attendance", {
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
  }, [todayKey]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-muted-foreground mt-1">Todays classes and tasks.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <StatCard icon={Layers} label="Assigned Classes" numeric={stats.totalClasses} value={stats.totalClasses.toString()} trend={0} trendLabel="this term" />
        <StatCard icon={Users} label="Assigned Students" numeric={stats.totalStudents} value={stats.totalStudents.toString()} trend={0} trendLabel="this term" delay={0.08} />
        <StatCard icon={CalendarCheck} label="Assigned Subjects" numeric={stats.totalSubjects} value={stats.totalSubjects.toString()} trend={0} trendLabel="this term" delay={0.16} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <h3 className="text-lg font-semibold">Todays Class Schedule</h3>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            {loading && <p className="text-xs text-muted-foreground">Loading schedule...</p>}
            {!loading && schedule.length === 0 && (
              <p className="text-xs text-muted-foreground">No classes scheduled for today.</p>
            )}
            {!loading && schedule.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <span>{item.title}</span>
                <span>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <h3 className="text-lg font-semibold">Recent Attendance</h3>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            {loading && <p className="text-xs text-muted-foreground">Loading attendance...</p>}
            {!loading && attendanceStatus.length === 0 && (
              <p className="text-xs text-muted-foreground">No attendance submitted today.</p>
            )}
            {!loading && attendanceStatus.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <span>{item.label}</span>
                <span>{item.status}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <ClipboardList className="h-4 w-4" /> Take Attendance
          </button>
        </div>
      </div>
    </div>
  );
}