"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

type ExamListItem = {
  examId: string;
  examName: string;
  examType: string;
  admitCardAvailable: boolean;
};

export default function StudentAdmitCardPage() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (role && role !== "STUDENT") {
      window.location.href = "/dashboard";
    }
  }, [role]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [meRes, examsRes] = await Promise.all([
          api.get("/students/me"),
          api.get("/dashboard/student/dashboard/exams"),
        ]);
        const me = unwrap<{ id: string }>(meRes);
        const data = unwrap<ExamListItem[]>(examsRes);
        setStudentId(me.id);
        setExams(data.filter((e) => e.admitCardAvailable));
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admit Cards</h1>
          <p className="text-sm text-muted-foreground">Download your exam admit cards.</p>
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

      {!loading && exams.length === 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft text-center text-sm text-muted-foreground">
          No admit cards available yet.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {exams.map((exam) => (
          <div key={exam.examId} className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft space-y-3">
            <h3 className="text-lg font-semibold">{exam.examName}</h3>
            <p className="text-xs text-muted-foreground">Type: {exam.examType}</p>
            <p className="text-xs text-muted-foreground">Status: Ready</p>
            {studentId && (
              <a
                href={`/api/v1/exams/${exam.examId}/students/${studentId}/admit-card`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs px-3 py-2 rounded-lg border border-border/60 hover:bg-secondary/40"
              >
                Download Admit Card
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
