"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

type MarkItem = {
  id: string;
  subject?: { name: string; fullMarks?: number };
  exam?: { name: string };
  marksObtained: number;
  grade?: string;
};

type ResultPayload = {
  percentage?: number;
  marks?: MarkItem[];
  totalObtained?: number;
  totalFull?: number;
};

export default function StudentResultsPage() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({ percentage: 0, totalObtained: 0, totalFull: 0 });
  const [marks, setMarks] = useState<Array<{ id: string; exam: string; subject: string; score: string; grade: string }>>([]);

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
        const meRes = await api.get("/students/me");
        const me = unwrap<{ id: string }>(meRes);
        const resultsRes = await api.get(`/results/student/${me.id}`);
        const payload = unwrap<ResultPayload>(resultsRes);

        setSummary({
          percentage: payload.percentage ?? 0,
          totalObtained: payload.totalObtained ?? 0,
          totalFull: payload.totalFull ?? 0,
        });

        setMarks(
          (payload.marks ?? []).map((mark) => ({
            id: mark.id,
            exam: mark.exam?.name ?? "Exam",
            subject: mark.subject?.name ?? "Subject",
            score: `${mark.marksObtained}/${mark.subject?.fullMarks ?? "-"}`,
            grade: mark.grade ?? "-",
          }))
        );
      } catch (err) {
        setError("Result load failed");
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Results</h1>
          <p className="text-sm text-muted-foreground">Exam-wise results and grades.</p>
        </div>
        <Link
          href="/dashboard/student"
          className="text-sm text-primary hover:underline"
        >
          Back to dashboard
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Percentage", value: `${summary.percentage}%` },
          { label: "Total Obtained", value: summary.totalObtained },
          { label: "Total Full", value: summary.totalFull },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border/60 bg-card p-4 shadow-soft">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        <h2 className="text-lg font-semibold">Marks</h2>
        {loading && <p className="mt-4 text-sm text-muted-foreground">Loading...</p>}
        {!loading && marks.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">No results available.</p>
        )}
        {!loading && marks.length > 0 && (
          <div className="mt-4 overflow-x-auto">
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
                    <td className="py-3 text-foreground">{mark.exam}</td>
                    <td className="py-3 text-foreground">{mark.subject}</td>
                    <td className="py-3 text-foreground">{mark.score}</td>
                    <td className="py-3 text-foreground">{mark.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
