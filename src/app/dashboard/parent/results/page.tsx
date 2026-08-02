"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios";
import {
  UsersRound,
  Award,
  ArrowLeft,
  Trophy,
  Target,
  BookOpen,
  Sparkles,
  Crown,
} from "lucide-react";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

type ChildDetail = {
  id: string;
  name: string;
  rollNumber?: number;
  class?: { id: string; name: string };
  section?: { id: string; name: string };
  attendancePercentage?: number;
  pendingFees?: number;
  recentResultPercent?: number;
};

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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

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

export default function ParentResultsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const isParent = !!role && role === "PARENT";

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const { data: children = [], isLoading: childrenLoading } = useQuery({
    queryKey: ["parents", "children"],
    queryFn: async () => {
      const res = await api.get("/parents/me/children-detailed");
      const payload = unwrap<ChildDetail[]>(res);
      return Array.isArray(payload) ? payload : [];
    },
    enabled: isParent,
  });

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedChildId),
    [children, selectedChildId]
  );

  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ["parents", "children", selectedChildId, "results"],
    queryFn: async () => {
      const res = await api.get(`/parents/me/children/${selectedChildId}/results`);
      return unwrap<ResultPayload>(res);
    },
    enabled: Boolean(isParent && selectedChildId),
  });

  const { data: classHighest = [], isLoading: highestLoading } = useQuery({
    queryKey: ["parents", "children", selectedChildId, "class-highest"],
    queryFn: async () => {
      const res = await api.get(`/parents/me/children/${selectedChildId}/class-highest`);
      const payload = unwrap<ClassHighestItem[]>(res);
      return Array.isArray(payload) ? payload : [];
    },
    enabled: Boolean(isParent && selectedChildId),
  });

  const marks = useMemo(() => resultsData?.marks ?? [], [resultsData]);
  const summary = useMemo(() => {
    if (!resultsData) return null;
    return {
      percentage: resultsData.percentage,
      totalObtained: resultsData.totalObtained,
      totalFull: resultsData.totalFull,
    };
  }, [resultsData]);

  const highestBySubject = useMemo(() => {
    const map = new Map<string, ClassHighestItem>();
    for (const item of classHighest) {
      map.set(item.subjectId, item);
    }
    return map;
  }, [classHighest]);

  useEffect(() => {
    if (isParent && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [isParent, children, selectedChildId]);

  useEffect(() => {
    if (role && role !== "PARENT") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  if (!isParent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Results</h1>
          <p className="text-sm text-muted-foreground">View your children&apos;s exam results and class highest marks.</p>
        </div>
        <Link href="/dashboard/parent" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>

      {childrenLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-border/60 bg-card p-4 shadow-soft space-y-3">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      ) : children.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-12 shadow-soft text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">No children linked</p>
          <p className="text-xs text-muted-foreground mt-1">Children will appear here once linked to your account.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {children.map((child) => (
              <motion.button
                key={child.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedChildId(child.id)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedChildId === child.id
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-transparent shadow-lg shadow-indigo-500/20"
                    : "border-border/60 hover:bg-secondary/40 text-foreground"
                }`}
              >
                <UsersRound className="h-4 w-4" />
                {child.name}
              </motion.button>
            ))}
          </div>

          {selectedChild && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft"
            >
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground">{selectedChild.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {selectedChild.class?.name ?? "Class"} · {selectedChild.section?.name ?? "Section"} · Roll: {selectedChild.rollNumber ?? "-"}
                </p>
              </div>

              {resultsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="rounded-xl border border-border/60 bg-card p-4 shadow-soft space-y-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              ) : summary ? (
                <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      label: "Percentage",
                      value: `${summary.percentage}%`,
                      icon: Target,
                      color: getPercentageColor(summary.percentage),
                    },
                    {
                      label: "Total Obtained",
                      value: summary.totalObtained,
                      icon: Trophy,
                      color: "text-foreground",
                    },
                    {
                      label: "Total Full Marks",
                      value: summary.totalFull,
                      icon: Award,
                      color: "text-foreground",
                    },
                  ].map((stat) => (
                    <motion.div
                      key={stat.label}
                      variants={item}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.98 }}
                      className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-soft"
                    >
                      <div className="flex items-center gap-2">
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                      </div>
                      <p className={`mt-2 text-lg font-semibold ${stat.color}`}>{stat.value}</p>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="rounded-2xl border border-border/60 bg-card/80 p-12 shadow-soft text-center">
                  <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No published results available yet.</p>
                </div>
              )}

              {marks.length > 0 && (
                <motion.div variants={container} initial="hidden" animate="show" className="mt-6 rounded-2xl border border-border/60 bg-card/80 shadow-soft overflow-hidden">
                  <div className="px-6 py-4 border-b border-border/60 bg-secondary/20">
                    <h3 className="text-base font-semibold text-foreground">Subject-wise Results</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="py-3 px-4 text-left">Subject</th>
                          <th className="py-3 px-4 text-left">Score</th>
                          <th className="py-3 px-4 text-left">Grade</th>
                          <th className="py-3 px-4 text-left">Class Highest</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {marks.map((mark) => {
                          const highest = highestBySubject.get(mark.subject.id);
                          const isHighest = highest && highest.highestMark === mark.marksObtained;
                          return (
                            <tr key={mark.id} className="hover:bg-secondary/20 transition-colors">
                              <td className="py-3 px-4 text-foreground flex items-center gap-2">
                                {isHighest && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                                {mark.subject?.name ?? "Subject"}
                              </td>
                              <td className="py-3 px-4 text-foreground">{mark.marksObtained}/{mark.subject?.fullMarks ?? "-"}</td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getGradeBadge(mark.grade)}`}>
                                  {mark.grade ?? "-"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {highest ? (
                                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                    {highest.highestMark}/{highest.fullMarks}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
