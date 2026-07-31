"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

type HomeworkItem = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  isReviewed: boolean;
  viewed: boolean;
  isOverdue: boolean;
  subject?: { id: string; name: string };
  teacher?: { user: { name: string } };
};

type HomeworkResponse = {
  data: HomeworkItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const statusFilters = [
  { value: "ALL", label: "All" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "OVERDUE", label: "Overdue" },
] as const;

export default function StudentHomeworkPage() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    if (role && role !== "STUDENT") {
      window.location.href = "/dashboard";
    }
  }, [role]);

  useEffect(() => {
    const loadHomework = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/homework/my-homework", {
          params: { status: statusFilter === "ALL" ? undefined : statusFilter },
        });
        const data = unwrap<HomeworkResponse>(res);
        setHomework(data.data ?? []);
      } catch (err) {
        setError("Failed to load homework");
      } finally {
        setLoading(false);
      }
    };
    loadHomework();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Homework</h1>
          <p className="text-sm text-muted-foreground">Assignments and tasks for your class.</p>
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

      <div className="flex gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
              statusFilter === filter.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border/60 hover:bg-secondary/40"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      )}

      {!loading && homework.length === 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft text-center text-sm text-muted-foreground">
          No homework found.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {homework.map((hw) => (
          <div key={hw.id} className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{hw.title}</h3>
              {hw.isOverdue && (
                <span className="text-xs px-2 py-1 rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200">Overdue</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Subject: {hw.subject?.name ?? "-"}</p>
            <p className="text-xs text-muted-foreground">Teacher: {hw.teacher?.user?.name ?? "-"}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{hw.description}</p>
            <p className="text-xs text-muted-foreground">Due: {formatDate(hw.dueDate)}</p>
            <div className="flex gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${hw.viewed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {hw.viewed ? "Viewed" : "Not Viewed"}
              </span>
              {hw.isReviewed && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">Reviewed</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
