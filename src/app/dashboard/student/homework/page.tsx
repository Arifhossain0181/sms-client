"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  ArrowLeft,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function StudentHomeworkPage() {
  useLenis();
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

  const getStatusBadge = (hw: HomeworkItem) => {
    if (hw.isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30">
          <AlertTriangle className="h-3 w-3" />
          Overdue
        </span>
      );
    }
    if (hw.isReviewed) {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
          <CheckCircle2 className="h-3 w-3" />
          Reviewed
        </span>
      );
    }
    if (!hw.viewed) {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
          <Clock className="h-3 w-3" />
          Not Viewed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30">
        <BookOpen className="h-3 w-3" />
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Homework</h1>
          <p className="text-sm text-muted-foreground">Assignments and tasks for your class.</p>
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

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg border transition-all ${
              statusFilter === filter.value
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-transparent shadow-lg shadow-indigo-500/20"
                : "border-border/60 hover:bg-secondary/40 text-foreground"
            }`}
          >
            {filter.value === "ALL" && <Sparkles className="h-3.5 w-3.5" />}
            {filter.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft space-y-4"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-2/5" />
              <Skeleton className="h-3 w-2/5" />
              <Skeleton className="h-10 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && homework.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/60 bg-card/80 p-12 shadow-soft text-center"
        >
          <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary/60 mx-auto mb-4">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No homework found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {statusFilter !== "ALL"
              ? "Try changing the filter to see more assignments."
              : "Your homework will appear here once assigned."}
          </p>
        </motion.div>
      )}

      {!loading && homework.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          {homework.map((hw) => (
            <motion.div
              key={hw.id}
              variants={item}
              className="group rounded-2xl border border-border/60 bg-card/80 shadow-soft overflow-hidden hover:shadow-lg hover:border-indigo-300/50 dark:hover:border-indigo-500/30 transition-all duration-300"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {hw.title}
                  </h3>
                  {getStatusBadge(hw)}
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {hw.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="grid h-6 w-6 place-items-center rounded-md bg-indigo-50 dark:bg-indigo-500/10">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="font-medium text-foreground">{hw.subject?.name ?? "General"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="grid h-6 w-6 place-items-center rounded-md bg-violet-50 dark:bg-violet-500/10">
                      <User className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <span>{hw.teacher?.user?.name ?? "Teacher"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="grid h-6 w-6 place-items-center rounded-md bg-sky-50 dark:bg-sky-500/10">
                      <Calendar className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <span>Due: {formatDate(hw.dueDate)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full ${
                      hw.viewed
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                    }`}
                  >
                    {hw.viewed ? "Viewed" : "Not Viewed"}
                  </span>
                  {hw.isReviewed && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      Reviewed
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
