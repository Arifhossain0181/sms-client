"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  CalendarDays,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Loader2,
  FileText,
  ClipboardCheck,
  BarChart3,
} from "lucide-react";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

type ExamItem = {
  examId: string;
  examName: string;
  examType: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED";
  admitCardAvailable: boolean;
  resultPublished: boolean;
  nextExamDate: string | null;
  subjectsCount: number;
};

const statusStyles: Record<string, { badge: string; label: string }> = {
  UPCOMING: {
    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
    label: "Upcoming",
  },
  ONGOING: {
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    label: "Ongoing",
  },
  COMPLETED: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    label: "Completed",
  },
};

const OrderIcon = ({ status }: { status: string }) => {
  if (status === "UPCOMING")
    return <CalendarDays className="h-4 w-4 text-sky-500" />;
  if (status === "ONGOING")
    return <ClipboardCheck className="h-4 w-4 text-amber-500" />;
  return <BarChart3 className="h-4 w-4 text-emerald-500" />;
};

export default function StudentExamsPage() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exams, setExams] = useState<ExamItem[]>([]);

  useEffect(() => {
    if (role && role !== "STUDENT") {
      window.location.href = "/dashboard";
    }
  }, [role]);

  useEffect(() => {
    const loadExams = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/dashboard/student/dashboard/exams");
        const data = unwrap<ExamItem[]>(res);
        setExams(data);
      } catch (err) {
        setError("Failed to load exams");
      } finally {
        setLoading(false);
      }
    };
    loadExams();
  }, []);

  const sortedExams = useMemo(() => {
    const order: Record<string, number> = { UPCOMING: 0, ONGOING: 1, COMPLETED: 2 };
    return [...exams].sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));
  }, [exams]);

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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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
        className="relative w-full my-8"
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
                  <BookOpen className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Exams
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Your exam schedules and results
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

            {!loading && sortedExams.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20">
                  <BookOpen className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  কোনো exam নেই
                </h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  No exams scheduled yet.
                </p>
              </motion.div>
            )}

            {!loading && sortedExams.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                <AnimatePresence mode="popLayout">
                  {sortedExams.map((exam, i) => {
                    const status = statusStyles[exam.status] ?? statusStyles.COMPLETED;
                    return (
                      <motion.div
                        key={exam.examId}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.05, type: "spring", stiffness: 120, damping: 16 }}
                        whileHover={{ scale: 1.01, y: -2 }}
                        className="group relative flex flex-col rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm p-5 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                                {exam.examName}
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {exam.examType}
                              </p>
                            </div>
                          </div>
                          <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${status.badge}`}>
                            {status.label}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <OrderIcon status={exam.status} />
                              Subjects
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{exam.subjectsCount}</span>
                          </div>
                          {exam.nextExamDate && (
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1.5">
                                <CalendarDays className="h-4 w-4 text-indigo-400" />
                                Next Date
                              </span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{formatDate(exam.nextExamDate)}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            href={`/dashboard/student/admit-card?examId=${exam.examId}`}
                            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-white/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors shadow-sm ${!exam.admitCardAvailable ? "opacity-50 pointer-events-none" : ""}`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Admit Card
                          </Link>
                          <Link
                            href={`/dashboard/student/report-card?examId=${exam.examId}`}
                            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-white/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors shadow-sm ${!exam.resultPublished ? "opacity-50 pointer-events-none" : ""}`}
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            Report Card
                          </Link>
                          <Link
                            href={`/dashboard/student/results?examId=${exam.examId}`}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-white/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors shadow-sm"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            Results
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          EduCore Exam Center
        </motion.p>
      </motion.div>
    </div>
  );
}
