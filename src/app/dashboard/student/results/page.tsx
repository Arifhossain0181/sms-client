"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  BookOpen,
  Calendar,
  Sparkles,
  Loader2,
} from "lucide-react";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

type MarkItem = {
  id: string;
  exam: { id: string; name: string };
  subject: { id: string; name: string; fullMarks: number };
  marksObtained: number;
  grade?: string;
};

type ResultPayload = {
  studentId: string;
  examId: string | null;
  totalObtained: number;
  totalFull: number;
  percentage: number;
  marks: MarkItem[];
};

type ClassHighestItem = {
  examId: string;
  examName: string;
  subjectId: string;
  subjectName: string;
  fullMarks: number;
  highestMark: number;
};

export default function StudentResultsPage() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultPayload | null>(null);
  const [classHighest, setClassHighest] = useState<ClassHighestItem[]>([]);

  useEffect(() => {
    if (role && role !== "STUDENT") {
      window.location.href = "/dashboard";
    }
  }, [role]);

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const [resultsRes, highestRes] = await Promise.allSettled([
          api.get("/results/my-results"),
          api.get("/results/my-results/class-highest"),
        ]);

        if (resultsRes.status === "rejected") {
          throw resultsRes.reason;
        }

        const payload = unwrap<ResultPayload>(resultsRes.value);
        setResult(payload);

        if (highestRes.status === "fulfilled") {
          const highest = unwrap<ClassHighestItem[]>(highestRes.value);
          setClassHighest(highest);
        }
      } catch (err) {
        setError("Result load failed");
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, []);

  const marks = result?.marks ?? [];
  const percentage = result?.percentage ?? 0;

  const highestMap = useMemo(() => {
    const map = new Map<string, ClassHighestItem>();
    for (const item of classHighest) {
      map.set(`${item.examId}:${item.subjectId}`, item);
    }
    return map;
  }, [classHighest]);

  const groupedByExam = useMemo(() => {
    const grouped: Record<string, { exam: { id: string; name: string }; marks: MarkItem[] }> = {};
    for (const mark of marks) {
      const examId = mark.exam?.id ?? "unknown";
      if (!grouped[examId]) {
        grouped[examId] = { exam: { id: examId, name: mark.exam?.name ?? "Exam" }, marks: [] };
      }
      grouped[examId].marks.push(mark);
    }
    return grouped;
  }, [marks]);

  const getPercentageColor = (pct: number) => {
    if (pct >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (pct >= 60) return "text-sky-600 dark:text-sky-400";
    if (pct >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  const getGradeBadge = (grade?: string) => {
    const style: Record<string, string> = {
      "A+": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
      "A": "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
      "A-": "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
      "B+": "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
      "B": "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
      "B-": "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
      "C+": "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
      "C": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
      "D": "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
      "F": "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    };
    return style[grade ?? ""] ?? "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300";
  };

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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-6">
              {[...Array(3)].map((_, i) => (
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
    <div className="relative min-h-screen flex items-start justify-start p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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
                  <Trophy className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Results
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Your exam results with class comparison
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

            {!loading && result && (
              <motion.div
                layout
                className="grid grid-cols-1 gap-3 sm:grid-cols-3"
              >
                {[
                  { label: "Percentage", value: `${percentage}%` },
                  { label: "Total Obtained", value: result.totalObtained },
                  { label: "Total Full", value: result.totalFull },
                ].map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-900/40 dark:to-slate-800/40 border border-white/40 dark:border-white/10 backdrop-blur-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        {item.label}
                      </p>
                    </div>
                    <p className={`mt-3 text-xl font-bold ${item.label === "Percentage" ? getPercentageColor(percentage) : "text-slate-800 dark:text-white"}`}>
                      {item.value}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {!loading && marks.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20">
                  <BookOpen className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  No results available
                </h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  No results available yet.
                </p>
              </motion.div>
            )}

            {!loading && Object.keys(groupedByExam).length > 0 && (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {Object.values(groupedByExam).map(({ exam, marks: examMarks }, examIdx) => (
                    <motion.div
                      key={exam.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: examIdx * 0.05, type: "spring", stiffness: 120, damping: 16 }}
                      className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden"
                    >
                      <div className="flex items-center gap-3 border-b border-white/40 dark:border-white/5 px-4 sm:px-6 py-4 bg-gradient-to-r from-white/60 to-slate-50/60 dark:from-white/5 dark:to-white/5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-base font-semibold text-slate-800 dark:text-white">{exam.name}</h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{examMarks.length} subjects</p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="text-xs uppercase text-slate-400 dark:text-slate-500 bg-white/40 dark:bg-white/5">
                            <tr>
                              <th className="py-2.5 px-4 text-left">Subject</th>
                              <th className="py-2.5 px-4 text-left">Your Score</th>
                              <th className="py-2.5 px-4 text-left">Class Highest</th>
                              <th className="py-2.5 px-4 text-left">Full Marks</th>
                              <th className="py-2.5 px-4 text-left">Grade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/40 dark:divide-white/5">
                            {examMarks.map((mark, i) => {
                              const highest = highestMap.get(`${exam.id}:${mark.subject.id}`);
                              const isHighest = highest && highest.highestMark === mark.marksObtained;

                              return (
                                <motion.tr
                                  key={mark.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.03 }}
                                  className={`transition-colors hover:bg-white/60 dark:hover:bg-white/5 ${isHighest ? "bg-emerald-50/40 dark:bg-emerald-500/5" : ""}`}
                                >
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 text-white flex items-center justify-center shadow-sm shadow-indigo-500/20">
                                        <BookOpen className="w-4 h-4" />
                                      </div>
                                      <span className="font-medium text-slate-700 dark:text-slate-200">{mark.subject.name}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-slate-800 dark:text-white">{mark.marksObtained}</span>
                                      <span className="text-xs text-slate-400 dark:text-slate-500">/ {mark.subject.fullMarks}</span>
                                      {isHighest && (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                                          <Trophy className="h-3 w-3" />
                                          Top
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-1">
                                      {highest ? (
                                        <>
                                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                          <span className="font-medium text-slate-700 dark:text-slate-200">{highest.highestMark}</span>
                                        </>
                                      ) : (
                                        <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{mark.subject.fullMarks}</td>
                                  <td className="py-3 px-4">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getGradeBadge(mark.grade)}`}>
                                      {mark.grade ?? "-"}
                                    </span>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  ))}
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
          EduCore Results Center
        </motion.p>
      </motion.div>
    </div>
  );
}
