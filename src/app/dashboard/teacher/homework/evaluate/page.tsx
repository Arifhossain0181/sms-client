"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookMarked,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useClasses } from "@/app/modules/class/useClasses";
import { useMarkHomeworkReviewed } from "@/app/modules/homework/useHomework";
import { Homework } from "@/app/modules/homework/homework.types";
import { formatDate } from "@/lib/utils";

type TeacherProfile = {
  id: string;
  name?: string;
  sectionTeacher?: Array<{
    id: string;
    class?: { id: string; name: string };
  }>;
};

type StudentViewStatus = {
  id: string;
  name: string;
  rollNumber: number;
  hasViewed: boolean;
  viewedAt: string | null;
};

type EvaluationDetails = {
  homework: Homework;
  students: StudentViewStatus[];
  stats: {
    totalStudents: number;
    viewedCount: number;
    notViewedCount: number;
    viewPercentage: number;
  };
};

const PAGE_SIZE = 20;

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { data: classes, isLoading: classesLoading } = useClasses();

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [search, setSearch] = useState("");
  const [viewFilter, setViewFilter] = useState<"ALL" | "VIEWED" | "NOT_VIEWED">("ALL");

  const markReviewedMutation = useMarkHomeworkReviewed();

  useEffect(() => {
    if (role && role !== "TEACHER" && role !== "SUPER_ADMIN" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const res = await api.get("/teachers/me");
        const payload = res.data?.data ?? res.data;
        setProfile(payload ?? null);
      } catch {
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    if (role === "TEACHER" || role === "SCHOOL_ADMIN" || role === "SUPER_ADMIN") {
      loadProfile();
    } else {
      setProfileLoading(false);
    }
  }, [role]);

  const assignedClassIds = useMemo(() => {
    return new Set(profile?.sectionTeacher?.map((entry) => entry.class?.id).filter(Boolean) as string[]);
  }, [profile]);

  const availableClasses = useMemo(() => {
    const list = Array.isArray(classes) ? classes : [];
    if (role === "TEACHER") {
      if (assignedClassIds.size > 0) {
        return list.filter((cls) => assignedClassIds.has(cls.id));
      }
      return [];
    }
    return list;
  }, [classes, assignedClassIds, role]);

  const selectedClass = useMemo(
    () => availableClasses.find((cls) => cls.id === classId),
    [availableClasses, classId]
  );

  const availableSections = useMemo(() => {
    const sections = selectedClass?.sections ?? [];
    if (role === "TEACHER") {
      const assignedSectionIds = new Set(
        profile?.sectionTeacher?.map((entry) => entry.id).filter(Boolean) as string[]
      );
      if (assignedSectionIds.size > 0) {
        return sections.filter((section) => assignedSectionIds.has(section.id));
      }
      return [];
    }
    return sections;
  }, [profile, role, selectedClass]);

  const selectedSection = useMemo(
    () => availableSections.find((s) => s.id === sectionId),
    [availableSections, sectionId]
  );

  const { data: evaluationData, isLoading: evaluationLoading, refetch } = useQuery<EvaluationDetails>({
    queryKey: ["homework-evaluation", sectionId],
    queryFn: async () => {
      const res = await api.get(`/homework/evaluate?sectionId=${sectionId}`);
      return res.data?.data ?? res.data;
    },
    enabled: !!sectionId,
  });

  const isLoading = profileLoading || classesLoading || evaluationLoading;

  const filteredStudents = useMemo(() => {
    if (!evaluationData?.students) return [];
    const q = search.trim().toLowerCase();
    let students = evaluationData.students;

    if (viewFilter === "VIEWED") {
      students = students.filter((s) => s.hasViewed);
    } else if (viewFilter === "NOT_VIEWED") {
      students = students.filter((s) => !s.hasViewed);
    }

    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        String(s.rollNumber).includes(q)
    );
  }, [evaluationData, search, viewFilter]);

  const stats = evaluationData?.stats ?? { totalStudents: 0, viewedCount: 0, notViewedCount: 0, viewPercentage: 0 };

  const handleRefresh = () => {
    refetch();
    toast.success("Data refreshed");
  };

  const handleMarkReviewed = async () => {
    if (!evaluationData?.homework.id) return;
    try {
      await markReviewedMutation.mutateAsync(evaluationData.homework.id);
      toast.success("Homework marked as reviewed!");
      refetch();
    } catch {
      // error handled by mutation
    }
  };

  if (isLoading && !evaluationData) {
    return (
      <div className="relative min-h-[80vh] flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
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
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-8 space-y-4">
            <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="space-y-3 mt-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200/50 dark:bg-slate-700/30 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh] flex items-start sm:items-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
      {/* Animated background orbs */}
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
        className="relative w-full my-6"
      >
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          {/* Gradient Header */}
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
                  <BookMarked className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Evaluate Submissions
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Review student views and mark homework as reviewed.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
                {evaluationData?.homework && !evaluationData.homework.isReviewed && (
                  <button
                    onClick={handleMarkReviewed}
                    disabled={markReviewedMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {markReviewedMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Mark Reviewed
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {/* Filters Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm p-4 sm:p-6 shadow-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Class
                  </label>
                  <div className="relative">
                    <select
                      value={classId}
                      onChange={(e) => {
                        setClassId(e.target.value);
                        const next = availableClasses.find((cls) => cls.id === e.target.value);
                        setSectionId(next?.sections?.[0]?.id ?? "");
                      }}
                      className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    >
                      <option value="">Select class</option>
                      {availableClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Section
                  </label>
                  <div className="relative">
                    <select
                      value={sectionId}
                      onChange={(e) => setSectionId(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    >
                      <option value="">Select section</option>
                      {availableSections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.name} {section.maxCapacity ? `(max ${section.maxCapacity})` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    View Status
                  </label>
                  <div className="relative">
                    <select
                      value={viewFilter}
                      onChange={(e) => setViewFilter(e.target.value as typeof viewFilter)}
                      className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    >
                      <option value="ALL">All Students</option>
                      <option value="VIEWED">Viewed</option>
                      <option value="NOT_VIEWED">Not Viewed</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name or roll..."
                      className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 pl-10 pr-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Overview */}
            {sectionId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {[
                  {
                    label: "Total Students",
                    value: stats.totalStudents,
                    icon: Users,
                    tint: "from-sky-400 to-indigo-500",
                  },
                  {
                    label: "Viewed",
                    value: stats.viewedCount,
                    icon: Eye,
                    tint: "from-emerald-400 to-green-500",
                  },
                  {
                    label: "Not Viewed",
                    value: stats.notViewedCount,
                    icon: EyeOff,
                    tint: "from-rose-400 to-red-500",
                  },
                  {
                    label: "View %",
                    value: `${stats.viewPercentage}%`,
                    icon: Clock3,
                    tint: "from-amber-400 to-orange-500",
                  },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      whileHover={{ y: -2, scale: 1.01 }}
                      className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-4 shadow-sm"
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl mb-3 flex items-center justify-center bg-gradient-to-br ${stat.tint} text-white shadow-lg`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-white">
                        {isLoading ? "..." : stat.value}
                      </p>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Students Table */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm shadow-sm overflow-hidden"
            >
              {/* Homework Info Bar */}
              {evaluationData?.homework && (
                <div className="p-4 sm:p-5 border-b border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                        {evaluationData.homework.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        {evaluationData.homework.subject.name} ({evaluationData.homework.subject.code}) • {selectedSection?.name} • Due: {formatDate(evaluationData.homework.dueDate)}
                        {evaluationData.homework.isReviewed && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-emerald-200/70 dark:border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            Reviewed
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.viewPercentage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              stats.viewPercentage >= 75
                                ? "bg-emerald-500"
                                : stats.viewPercentage >= 50
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                            }`}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {stats.viewPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!sectionId ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/20 dark:via-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                  >
                    <BookMarked className="w-10 h-10 text-indigo-600 dark:text-indigo-300" />
                  </motion.div>
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                    Select a section
                  </h3>
                  <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                    Choose a class and section above to evaluate homework.
                  </p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/20 dark:via-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                  >
                    <Users className="w-10 h-10 text-indigo-600 dark:text-indigo-300" />
                  </motion.div>
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                    No students found
                  </h3>
                  <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                    Try adjusting your filters or search query.
                  </p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5">
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Student
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                          Roll
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                          Status
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Viewed At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40 dark:divide-white/10">
                      <AnimatePresence mode="popLayout">
                        {filteredStudents.map((student, index) => (
                          <motion.tr
                            key={student.id}
                            layout
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -30, scale: 0.98 }}
                            transition={{
                              delay: index * 0.02,
                              type: "spring",
                              stiffness: 120,
                              damping: 18,
                            }}
                            className={`group transition-colors duration-200 ${
                              student.hasViewed
                                ? "bg-emerald-50/30 dark:bg-emerald-500/5"
                                : "bg-rose-50/30 dark:bg-rose-500/5"
                            }`}
                          >
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                                    student.hasViewed
                                      ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                                      : "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300"
                                  }`}
                                >
                                  {student.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                                </div>
                                <span className="font-medium text-slate-800 dark:text-white truncate max-w-[200px]">
                                  {student.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-center">
                              <span className="inline-flex items-center rounded-full border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 px-2 py-0.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                                {student.rollNumber}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-center">
                              {student.hasViewed ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/70 dark:border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                                  <Eye className="w-3 h-3" />
                                  Viewed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full border border-rose-200/70 dark:border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-300">
                                  <EyeOff className="w-3 h-3" />
                                  Not Viewed
                                </span>
                              )}
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <span className="text-sm text-slate-600 dark:text-slate-300">
                                {student.viewedAt ? new Date(student.viewedAt).toLocaleString() : "—"}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer info */}
              {filteredStudents.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-white/40 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Showing{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {filteredStudents.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {stats.totalStudents}
                    </span>{" "}
                    students
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Viewed
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Not Viewed
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          Evaluate Submissions
        </motion.p>
      </motion.div>
    </div>
  );
}