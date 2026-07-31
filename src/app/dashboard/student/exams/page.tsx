"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";

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
    badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30",
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exams</h1>
          <p className="text-sm text-muted-foreground">Your exam schedules and results.</p>
        </div>
        <Link href="/dashboard/student" className="text-sm text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      )}

      {!loading && sortedExams.length === 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft text-center text-sm text-muted-foreground">
          No exams scheduled yet.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {sortedExams.map((exam) => (
          <div key={exam.examId} className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{exam.examName}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[exam.status]?.badge}`}>
                {statusStyles[exam.status]?.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Type: {exam.examType}</p>
            <p className="text-xs text-muted-foreground">Subjects: {exam.subjectsCount}</p>
            {exam.nextExamDate && (
              <p className="text-xs text-muted-foreground">Next: {formatDate(exam.nextExamDate)}</p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href={`/dashboard/student/admit-card?examId=${exam.examId}`}
                className={`text-xs px-3 py-2 rounded-lg border border-border/60 hover:bg-secondary/40 ${!exam.admitCardAvailable ? "opacity-50 pointer-events-none" : ""}`}
              >
                Admit Card
              </Link>
              <Link
                href={`/dashboard/student/report-card?examId=${exam.examId}`}
                className={`text-xs px-3 py-2 rounded-lg border border-border/60 hover:bg-secondary/40 ${!exam.resultPublished ? "opacity-50 pointer-events-none" : ""}`}
              >
                Report Card
              </Link>
              <Link
                href={`/dashboard/student/results?examId=${exam.examId}`}
                className="text-xs px-3 py-2 rounded-lg border border-border/60 hover:bg-secondary/40"
              >
                View Results
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
