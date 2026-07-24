"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";
import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  GraduationCap,
  FileText,
  AlertCircle,
  Clock,
  ChevronRight,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type Role = "EXAM_CONTROLLER" | "SCHOOL_ADMIN" | "SUPER_ADMIN";

type ExamSummary = {
  id: string;
  name: string;
  type?: string;
  status?: string;
  class?: string;
  schedules?: Array<{ class?: { name?: string }; subject?: { name?: string }; examDate?: string }>;
  totalMarks?: number;
};

const EXAM_STAFF: Role[] = ["EXAM_CONTROLLER", "SCHOOL_ADMIN", "SUPER_ADMIN"];

const statusStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
  PUBLISHED: {
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-500/20",
    label: "Published",
  },
  DRAFT: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-500/20",
    label: "Draft",
  },
  SCHEDULED: {
    bg: "bg-sky-50 dark:bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-500/20",
    label: "Scheduled",
  },
};

function getStatusStyle(status?: string) {
  return statusStyles[status?.toUpperCase?.() ?? "DRAFT"] ?? statusStyles.DRAFT;
}

function getTypeStyle(type?: string) {
  const normalized = type?.toUpperCase?.();
  if (normalized === "FINAL_EXAM" || normalized === "FINAL") {
    return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20";
  }
  if (normalized === "MID_TERM") {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20";
  }
  return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20";
}

export default function ExamControllerDashboard() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const res = await api.get("/exams");
      const payload = res.data?.data ?? res.data;
      return Array.isArray(payload) ? payload : [];
    },
  });

  useEffect(() => {
    if (role && !EXAM_STAFF.includes(role as Role)) {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const stats = useMemo(() => {
    const total = exams.length;
    const published = exams.filter((e) => (e.status ?? "").toUpperCase() === "PUBLISHED").length;
    const drafts = exams.filter((e) => (e.status ?? "").toUpperCase() === "DRAFT").length;
    const scheduled = total - published - drafts;
    return { total, published, drafts, scheduled };
  }, [exams]);

  const isAuthLoading = !role;

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-10 w-56 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl mt-6" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50/60 dark:bg-slate-950 font-inter">
      <motion.div
        animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 -left-32 w-[500px] h-[500px] bg-sky-300/20 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 -right-32 w-[600px] h-[600px] bg-violet-300/20 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-300/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Exam Controller
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Scheduling, grading rules, mark approval, and result publication.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-white/5 border border-white/30 dark:border-white/10 backdrop-blur-xl rounded-full px-4 py-2 shadow-sm">
            <Clock className="h-3.5 w-3.5 text-indigo-500" />
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
        >
          {[
            {
              label: "Total Exams",
              value: stats.total,
              icon: ClipboardList,
              gradient: "from-sky-500 to-indigo-500",
              bg: "bg-sky-50 dark:bg-sky-500/10",
              iconColor: "text-sky-600 dark:text-sky-400",
            },
            {
              label: "Published",
              value: stats.published,
              icon: FileText,
              gradient: "from-emerald-500 to-teal-500",
              bg: "bg-emerald-50 dark:bg-emerald-500/10",
              iconColor: "text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "Drafts",
              value: stats.drafts,
              icon: GraduationCap,
              gradient: "from-amber-500 to-orange-500",
              bg: "bg-amber-50 dark:bg-amber-500/10",
              iconColor: "text-amber-600 dark:text-amber-400",
            },
            {
              label: "Scheduled",
              value: stats.scheduled,
              icon: BarChart3,
              gradient: "from-violet-500 to-fuchsia-500",
              bg: "bg-violet-50 dark:bg-violet-500/10",
              iconColor: "text-violet-600 dark:text-violet-400",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 2), duration: 0.4 }}
              className="group relative overflow-hidden rounded-3xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-2xl p-6 shadow-xl shadow-slate-200/40 dark:shadow-none"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
              <div className="relative flex items-center justify-between">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {isLoading ? <Skeleton className="h-8 w-16" /> : stat.value}
                  </p>
                </div>
                <div className={`rounded-2xl p-3 border ${stat.bg} backdrop-blur-xl`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3 * index, duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full bg-gradient-to-r ${stat.gradient}`}
                  style={{ transformOrigin: "left" }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-[2rem] border border-white/40 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-2xl shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden"
        >
          <div className="relative border-b border-white/40 dark:border-white/5 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 px-6 sm:px-8 py-6 overflow-hidden">
            <motion.div
              animate={{ x: [0, 120, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                  Exams Overview
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Quick snapshot of every configured exam and its current status.
                </p>
              </div>
              <BookOpen className="h-6 w-6 text-indigo-400" />
            </div>
          </div>

          <div className="px-6 sm:px-8 py-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : exams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="h-16 w-16 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                >
                  <ClipboardList className="h-7 w-7 text-indigo-500" />
                </motion.div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  No exams configured
                </h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  Create exams from the Exams page to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/50">
                        <th className="py-3.5 pl-4 font-medium">Exam</th>
                        <th className="py-3.5 font-medium">Type</th>
                        <th className="py-3.5 font-medium">Class</th>
                        <th className="py-3.5 font-medium">Status</th>
                        <th className="py-3.5 pr-4 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {exams.map((exam, idx) => {
                        const style = getStatusStyle(exam.status);
                        const schedule = exam.schedules?.[0];
                        return (
                          <motion.tr
                            key={exam.id}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-4 pl-4">
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{exam.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {schedule?.subject?.name ?? "Multiple subjects"}
                                </p>
                              </div>
                            </td>
                            <td className="py-4">
                              {exam.type ? (
                                <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium border ${getTypeStyle(exam.type)}`}>
                                  {exam.type.replace("_", " ")}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-4 text-slate-600 dark:text-slate-300">
                              {schedule?.class?.name ?? "—"}
                            </td>
                            <td className="py-4">
                              <span className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
                                {style.label}
                              </span>
                            </td>
                            <td className="py-4 pr-4">
                              <div className="flex items-center justify-end gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => router.push(`/dashboard/exam-controller/exams`)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                                >
                                  Manage
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border border-white/40 dark:border-white/10 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white/80 dark:bg-white/10 p-2.5 border border-white/40 dark:border-white/10">
                      <ClipboardList className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {stats.total === 0 ? "No exams yet" : `${stats.total} exam${stats.total !== 1 ? "s" : ""} configured`}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                    {stats.published > 0
                      ? `${stats.published} published, ${exams.reduce((sum, e) => sum + (e.totalMarks ?? 0), 0)} total marks configured`
                      : "Start by creating an exam to schedule and grade."}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/dashboard/exam-controller/exams")}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors"
                  >
                    Browse Exams
                    <ChevronRight className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
