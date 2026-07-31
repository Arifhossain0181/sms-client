"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";

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

export default function StudentResultsPage() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultPayload | null>(null);

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
        const resultsRes = await api.get("/results/my-results");
        const payload = unwrap<ResultPayload>(resultsRes);
        setResult(payload);
      } catch (err) {
        setError("Result load failed");
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, []);

  const marks = result?.marks ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Results</h1>
          <p className="text-sm text-muted-foreground">Exam-wise results and grades.</p>
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

      {result && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Percentage", value: `${result.percentage}%` },
            { label: "Total Obtained", value: result.totalObtained },
            { label: "Total Full", value: result.totalFull },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border/60 bg-card p-4 shadow-soft">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      )}

      {!loading && marks.length === 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft text-center text-sm text-muted-foreground">
          No results available.
        </div>
      )}

      {!loading && marks.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 text-left">Exam</th>
                  <th className="py-2 text-left">Subject</th>
                  <th className="py-2 text-left">Score</th>
                  <th className="py-2 text-left">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {marks.map((mark) => (
                  <tr key={mark.id}>
                    <td className="py-3 text-foreground">{mark.exam?.name ?? "Exam"}</td>
                    <td className="py-3 text-foreground">{mark.subject?.name ?? "Subject"}</td>
                    <td className="py-3 text-foreground">{mark.marksObtained}/{mark.subject?.fullMarks ?? "-"}</td>
                    <td className="py-3 text-foreground">{mark.grade ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
