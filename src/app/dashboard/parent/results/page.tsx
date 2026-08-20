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
  Inbox,
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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
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
  if (pct >= 80) return "from-emerald-400 to-teal-500";
  if (pct >= 60) return "from-sky-400 to-indigo-500";
  if (pct >= 40) return "from-amber-400 to-orange-500";
  return "from-rose-400 to-pink-500";
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
    <div className="relative min-h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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
        className="relative w-full p-4 sm:p-6 space-y-6"
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
                  className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center cursor-pointer"
                >
                  <Award className="w-6 h-6 text-white" />
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
                    View your children&apos;s exam results and class highest marks.
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/parent"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </div>
          </div>

          {/* Children selector */}
          {childrenLoading ? (
            <div className="px-4 sm:px-6 pt-6">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-10 w-40 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10" />
                ))}
              </div>
            </div>
          ) : children.length === 0 ? (
            <div className="p-6">
              <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-12 text-center">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                >
                  <Inbox className="w-6 h-6 text-indigo-400" />
                </motion.div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No children linked</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Children will appear here once linked to your account.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 sm:px-6 pt-6">
                <div className="flex flex-wrap gap-2">
                  {children.map((child) => (
                    <motion.button
                      key={child.id}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedChildId(child.id)}
                      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                        selectedChildId === child.id
                          ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white border-transparent shadow-lg shadow-indigo-500/30"
                          : "border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10"
                      }`}
                    >
                      <UsersRound className="h-4 w-4" />
                      {child.name}
                    </motion.button>
                  ))}
                </div>
              </div>

              {selectedChild && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 sm:p-6"
                >
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{selectedChild.name}</h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {selectedChild.class?.name ?? "Class"} · {selectedChild.section?.name ?? "Section"} · Roll: {selectedChild.rollNumber ?? "-"}
                    </p>
                  </div>

                  {resultsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 space-y-3">
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
                          color: "from-indigo-400 to-violet-500",
                        },
                        {
                          label: "Total Full Marks",
                          value: summary.totalFull,
                          icon: Award,
                          color: "from-violet-400 to-purple-500",
                        },
                      ].map((stat, i) => (
                        <motion.div
                          key={stat.label}
                          custom={i}
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          className="relative flex items-center gap-3 p-4 rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm"
                        >
                          <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-md shadow-indigo-500/20`}>
                            <stat.icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">{stat.label}</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">{stat.value}</p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-12 text-center">
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                      >
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                      </motion.div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No published results available yet.</p>
                    </div>
                  )}

                  {marks.length > 0 && (
                    <motion.div variants={item} className="mt-6 rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-white/30 dark:border-white/10 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Subject-wise Results</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/30 dark:border-white/10 text-left text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              <th className="px-6 py-3 font-medium">Subject</th>
                              <th className="px-6 py-3 font-medium">Score</th>
                              <th className="px-6 py-3 font-medium">Grade</th>
                              <th className="px-6 py-3 font-medium">Class Highest</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/30 dark:divide-white/5">
                            {marks.map((mark) => {
                              const highest = highestBySubject.get(mark.subject.id);
                              const isHighest = highest && highest.highestMark === mark.marksObtained;
                              return (
                                <tr key={mark.id} className="hover:bg-white/40 dark:hover:bg-white/10 transition-colors">
                                  <td className="px-6 py-3 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                    {isHighest && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                                    {mark.subject?.name ?? "Subject"}
                                  </td>
                                  <td className="px-6 py-3 text-slate-700 dark:text-slate-200">{mark.marksObtained}/{mark.subject?.fullMarks ?? "-"}</td>
                                  <td className="px-6 py-3">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getGradeBadge(mark.grade)}`}>
                                      {mark.grade ?? "-"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3">
                                    {highest ? (
                                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                        {highest.highestMark}/{highest.fullMarks}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
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

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          EduCore Parent Panel
        </motion.p>
      </motion.div>
    </div>
  );
}
