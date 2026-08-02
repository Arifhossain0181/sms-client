"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  BookOpen,
  Calendar,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Results</h1>
          <p className="text-sm text-muted-foreground">Your exam results with class comparison.</p>
        </div>
        <Link
          href="/dashboard/student"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-border/60 bg-card p-4 shadow-soft space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      )}

      {!loading && result && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Percentage", value: `${percentage}%` },
            { label: "Total Obtained", value: result.totalObtained },
            { label: "Total Full", value: result.totalFull },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-soft">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className={`mt-2 text-lg font-semibold ${item.label === "Percentage" ? getPercentageColor(percentage) : "text-foreground"}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {!loading && marks.length === 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft text-center text-sm text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          No results available yet. Results will appear here once published.
        </div>
      )}

      {!loading && Object.keys(groupedByExam).length > 0 && (
        <div className="space-y-6">
          {Object.values(groupedByExam).map(({ exam, marks: examMarks }) => (
            <div key={exam.id} className="rounded-2xl border border-border/60 bg-card/80 shadow-soft overflow-hidden">
              <div className="flex items-center gap-3 border-b border-border/60 px-6 py-4 bg-secondary/30">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{exam.name}</h2>
                  <p className="text-xs text-muted-foreground">{examMarks.length} subjects</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground bg-secondary/20">
                    <tr>
                      <th className="py-3 px-4 text-left">Subject</th>
                      <th className="py-3 px-4 text-left">Your Score</th>
                      <th className="py-3 px-4 text-left">Class Highest</th>
                      <th className="py-3 px-4 text-left">Full Marks</th>
                      <th className="py-3 px-4 text-left">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {examMarks.map((mark) => {
                      const highest = highestMap.get(`${exam.id}:${mark.subject.id}`);
                      const isHighest = highest && highest.highestMark === mark.marksObtained;
                      const studentPct = mark.subject.fullMarks > 0 ? Math.round((mark.marksObtained / mark.subject.fullMarks) * 100) : 0;

                      return (
                        <tr key={mark.id} className={`transition-colors hover:bg-secondary/20 ${isHighest ? "bg-emerald-50/40 dark:bg-emerald-500/5" : ""}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                              <span className="font-medium text-foreground">{mark.subject.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{mark.marksObtained}</span>
                              <span className="text-xs text-muted-foreground">/ {mark.subject.fullMarks}</span>
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
                                  <span className="font-medium text-foreground">{highest.highestMark}</span>
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{mark.subject.fullMarks}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getGradeBadge(mark.grade)}`}>
                              {mark.grade ?? "-"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
