"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import api from "@/lib/axios";
import {
  UsersRound,
  CalendarCheck,
  Award,
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Inbox,
  BookOpen,
  Clock,
  Sparkles,
  Loader2,
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

type AttendanceRecord = {
  id: string;
  date: string;
  status: string;
};

type AttendanceSummary = {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
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

type Tab = "overview" | "attendance" | "results" | "homework";

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: UsersRound },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "results", label: "Results", icon: Award },
  { id: "homework", label: "Homework", icon: BookOpen },
];

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

export default function ParentChildrenPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const isParent = !!role && role === "PARENT";

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

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ["parents", "children", selectedChildId, "attendance"],
    queryFn: async () => {
      const res = await api.get(`/parents/me/children/${selectedChildId}/attendance`);
      const payload = unwrap<{ records: AttendanceRecord[]; summary: AttendanceSummary }>(res);
      return payload;
    },
    enabled: Boolean(isParent && selectedChildId),
  });

  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ["parents", "children", selectedChildId, "results"],
    queryFn: async () => {
      const res = await api.get(`/parents/me/children/${selectedChildId}/results`);
      return unwrap<ResultPayload>(res);
    },
    enabled: Boolean(isParent && selectedChildId),
  });

  const { data: homeworkData, isLoading: homeworkLoading } = useQuery({
    queryKey: ["parents", "children", selectedChildId, "homework"],
    queryFn: async () => {
      const res = await api.get(`/parents/me/children/${selectedChildId}/homework`);
      const payload = unwrap<HomeworkItem[]>(res);
      return Array.isArray(payload) ? payload : [];
    },
    enabled: Boolean(isParent && selectedChildId),
  });

  const attendanceRecords = useMemo(() => attendanceData?.records ?? [], [attendanceData]);
  const attendanceSummary = useMemo(() => attendanceData?.summary ?? null, [attendanceData]);

  const attendanceColor = useMemo(() => {
    const pct = attendanceSummary?.percentage ?? selectedChild?.attendancePercentage ?? 0;
    if (pct >= 75) return "text-emerald-600 dark:text-emerald-400";
    if (pct >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  }, [attendanceSummary, selectedChild]);

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

  const renderOverview = () => (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Attendance",
            value: `${attendanceSummary?.percentage ?? selectedChild?.attendancePercentage ?? 0}%`,
            icon: CalendarCheck,
            color: "from-indigo-400 to-violet-500",
          },
          {
            label: "Last Result",
            value: `${selectedChild?.recentResultPercent ?? 0}%`,
            icon: Award,
            color: "from-emerald-400 to-teal-500",
          },
          {
            label: "Pending Fees",
            value: `${selectedChild?.pendingFees ?? 0}`,
            icon: TrendingDown,
            color: "from-rose-400 to-pink-500",
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
              <p className={`text-lg font-bold text-slate-800 dark:text-white mt-0.5 ${attendanceColor}`}>{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div variants={item} className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-6">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Student Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            { label: "Name", value: selectedChild?.name },
            { label: "Student ID", value: selectedChild?.id?.slice(0, 8) },
            { label: "Class", value: selectedChild?.class?.name },
            { label: "Section", value: selectedChild?.section?.name },
            { label: "Roll Number", value: selectedChild?.rollNumber?.toString() },
          ].map((field) => (
            <div key={field.label} className="rounded-xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-white/5 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{field.label}</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5">{field.value ?? "-"}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  const renderAttendance = () => (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {attendanceSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Days", value: attendanceSummary.total, icon: Clock, color: "from-slate-400 to-slate-500" },
            { label: "Present", value: attendanceSummary.present, icon: TrendingUp, color: "from-emerald-400 to-teal-500" },
            { label: "Absent", value: attendanceSummary.absent, icon: TrendingDown, color: "from-rose-400 to-pink-500" },
            { label: "Late", value: attendanceSummary.late, icon: Clock, color: "from-amber-400 to-orange-500" },
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
        </div>
      )}

      <motion.div variants={item} className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-white/30 dark:border-white/10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Attendance Records</h3>
        </div>
        {attendanceLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-white/20 dark:border-white/10 px-4 py-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : attendanceRecords.length === 0 ? (
          <div className="p-12 text-center">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
            >
              <Inbox className="w-6 h-6 text-indigo-400" />
            </motion.div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No attendance records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/30 dark:border-white/10 text-left text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 dark:divide-white/5">
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-white/40 dark:hover:bg-white/10 transition-colors">
                    <td className="px-6 py-3 text-slate-700 dark:text-slate-200">{formatDate(record.date)}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                          record.status === "PRESENT"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                            : record.status === "ABSENT"
                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20"
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  const renderResults = () => (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {resultsData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Percentage", value: `${resultsData.percentage}%`, color: "from-indigo-400 to-violet-500" },
            { label: "Total Obtained", value: resultsData.totalObtained, color: "from-sky-400 to-indigo-500" },
            { label: "Total Full", value: resultsData.totalFull, color: "from-violet-400 to-purple-500" },
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
                <Award className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">{stat.label}</p>
                <p className={`text-lg font-bold text-slate-800 dark:text-white mt-0.5 ${stat.label === "Percentage" ? getPercentageColor(resultsData.percentage) : ""}`}>
                  {stat.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {resultsData && (resultsData.marks?.length ?? 0) > 0 && (
        <motion.div variants={item} className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-white/30 dark:border-white/10 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Award className="w-4 h-4" />
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
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 dark:divide-white/5">
                {resultsData.marks.map((mark) => (
                  <tr key={mark.id} className="hover:bg-white/40 dark:hover:bg-white/10 transition-colors">
                    <td className="px-6 py-3 text-slate-700 dark:text-slate-200">{mark.subject?.name ?? "Subject"}</td>
                    <td className="px-6 py-3 text-slate-700 dark:text-slate-200">{mark.marksObtained}/{mark.subject?.fullMarks ?? "-"}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getGradeBadge(mark.grade)}`}>
                        {mark.grade ?? "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const renderHomework = () => (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {homeworkLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 p-6 space-y-3">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      ) : homeworkData && homeworkData.length === 0 ? (
        <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 p-12 text-center">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
          >
            <Inbox className="w-6 h-6 text-indigo-400" />
          </motion.div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No homework assigned yet.</p>
        </div>
      ) : (
        <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(homeworkData ?? []).map((hw) => (
            <motion.div
              key={hw.id}
              variants={item}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">{hw.title}</h3>
                {hw.isOverdue && (
                  <span className="text-xs px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20">Overdue</span>
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-2">{hw.description}</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span>{hw.subject?.name ?? "General"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                  <span>Due: {formatDate(hw.dueDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <UsersRound className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
                  <span>{hw.teacher?.user?.name ?? "Teacher"}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );

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
                  <UsersRound className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Children
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Monitor your children&apos;s academic progress.
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
            <div className="p-4 sm:p-6">
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
                  {children.map((child, idx) => (
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{selectedChild.name}</h2>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {selectedChild.class?.name ?? "Class"} · {selectedChild.section?.name ?? "Section"} · Roll:{" "}
                        {selectedChild.rollNumber ?? "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {tabs.map((tab) => (
                      <motion.button
                        key={tab.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setActiveTab(tab.id)}
                        className={`inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl border transition-colors ${
                          activeTab === tab.id
                            ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white border-transparent shadow-lg shadow-indigo-500/30"
                            : "border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10"
                        }`}
                      >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                      </motion.button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {activeTab === "overview" && renderOverview()}
                      {activeTab === "attendance" && renderAttendance()}
                      {activeTab === "results" && renderResults()}
                      {activeTab === "homework" && renderHomework()}
                    </motion.div>
                  </AnimatePresence>
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
