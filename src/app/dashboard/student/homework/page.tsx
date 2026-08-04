"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";
import { formatDate } from "@/lib/utils";
import {
  BookOpen,
  ArrowLeft,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Loader2,
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
        <div className="relative w-full">
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 w-20 bg-slate-200/60 dark:bg-slate-700/40 rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
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

      <div className="relative w-full my-8 space-y-6">
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
                    My Homework
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Assignments and tasks for your class
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

            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <motion.button
                  key={filter.value}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border transition-all ${
                    statusFilter === filter.value
                      ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white border-transparent shadow-lg shadow-indigo-500/20"
                      : "border-white/40 dark:border-white/10 bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20"
                  }`}
                >
                  {filter.value === "ALL" && <Sparkles className="h-3.5 w-3.5" />}
                  {filter.label}
                </motion.button>
              ))}
            </div>

            {homework.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20">
                  <BookOpen className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  No homework found
                </h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  {statusFilter !== "ALL"
                    ? "Try changing the filter to see more assignments."
                    : "Your homework will appear here once assigned."}
                </p>
              </motion.div>
            )}

            {homework.length > 0 && (
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
                    whileHover={{ scale: 1.01, y: -2 }}
                    className="group relative rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                          {hw.title}
                        </h3>
                        {getStatusBadge(hw)}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {hw.description}
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 text-white flex items-center justify-center">
                            <BookOpen className="h-3 w-3" />
                          </div>
                          <span className="font-medium text-slate-700 dark:text-slate-200">{hw.subject?.name ?? "General"}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 text-white flex items-center justify-center">
                            <User className="h-3 w-3" />
                          </div>
                          <span>{hw.teacher?.user?.name ?? "Teacher"}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 text-white flex items-center justify-center">
                            <Calendar className="h-3 w-3" />
                          </div>
                          <span>Due: {formatDate(hw.dueDate)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-3 border-t border-white/40 dark:border-white/10">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            hw.viewed
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                          }`}
                        >
                          {hw.viewed ? "Viewed" : "Not Viewed"}
                        </span>
                        {hw.isReviewed && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 font-medium">
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
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          EduCore Homework Center
        </motion.p>
      </div>
    </div>
  );
}
