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

  const attendanceRecords = useMemo(
    () => attendanceData?.records ?? [],
    [attendanceData]
  );

  const attendanceSummary = useMemo(
    () => attendanceData?.summary ?? null,
    [attendanceData]
  );

  const attendanceColor = useMemo(() => {
    const pct = attendanceSummary?.percentage ?? selectedChild?.attendancePercentage ?? 0;
    if (pct >= 75) return "text-emerald-600 dark:text-emerald-400";
    if (pct >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  }, [attendanceSummary, selectedChild]);

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

  const renderOverview = () => (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Attendance",
            value: `${attendanceSummary?.percentage ?? selectedChild?.attendancePercentage ?? 0}%`,
            icon: CalendarCheck,
            color: "text-indigo-500 dark:text-indigo-400",
          },
          {
            label: "Last Result",
            value: `${selectedChild?.recentResultPercent ?? 0}%`,
            icon: Award,
            color: "text-emerald-500 dark:text-emerald-400",
          },
          {
            label: "Pending Fees",
            value: `${selectedChild?.pendingFees ?? 0}`,
            icon: TrendingDown,
            color: "text-rose-500 dark:text-rose-400",
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={item}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-soft"
          >
            <div className="flex items-center gap-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            </div>
            <p className={`mt-2 text-lg font-semibold ${attendanceColor}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div variants={item} className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        <h3 className="text-base font-semibold text-foreground mb-4">Student Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            { label: "Name", value: selectedChild?.name },
            { label: "Student ID", value: selectedChild?.id?.slice(0, 8) },
            { label: "Class", value: selectedChild?.class?.name },
            { label: "Section", value: selectedChild?.section?.name },
            { label: "Roll Number", value: selectedChild?.rollNumber?.toString() },
          ].map((field) => (
            <div key={field.label} className="rounded-lg border border-border/50 bg-secondary/40 p-3">
              <p className="text-xs text-muted-foreground">{field.label}</p>
              <p className="text-sm font-medium text-foreground">{field.value ?? "-"}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  const renderAttendance = () => (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {attendanceSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Days", value: attendanceSummary.total, icon: Clock, color: "text-slate-600 dark:text-slate-300" },
            { label: "Present", value: attendanceSummary.present, icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Absent", value: attendanceSummary.absent, icon: TrendingDown, color: "text-rose-600 dark:text-rose-400" },
            { label: "Late", value: attendanceSummary.late, icon: Clock, color: "text-amber-600 dark:text-amber-400" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={item}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-soft"
            >
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
              </div>
              <p className="mt-2 text-lg font-semibold text-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      <motion.div variants={item} className="rounded-2xl border border-border/60 bg-card/80 shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60 bg-secondary/20">
          <h3 className="text-base font-semibold text-foreground">Attendance Records</h3>
        </div>
        {attendanceLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : attendanceRecords.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No attendance records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 text-foreground">{formatDate(record.date)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          record.status === "PRESENT"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : record.status === "ABSENT"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
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
            { label: "Percentage", value: `${resultsData.percentage}%` },
            { label: "Total Obtained", value: resultsData.totalObtained },
            { label: "Total Full", value: resultsData.totalFull },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={item}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-soft"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
              <p
                className={`mt-2 text-lg font-semibold ${
                  stat.label === "Percentage" ? getPercentageColor(resultsData.percentage) : "text-foreground"
                }`}
              >
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {resultsData && resultsData.marks.length > 0 && (
        <motion.div variants={item} className="rounded-2xl border border-border/60 bg-card/80 shadow-soft overflow-hidden">
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
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {resultsData.marks.map((mark) => (
                  <tr key={mark.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 text-foreground">{mark.subject?.name ?? "Subject"}</td>
                    <td className="py-3 px-4 text-foreground">{mark.marksObtained}/{mark.subject?.fullMarks ?? "-"}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getGradeBadge(mark.grade)}`}>
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
            <div key={idx} className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft space-y-3">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      ) : homeworkData && homeworkData.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-12 shadow-soft text-center">
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No homework assigned yet.</p>
        </div>
      ) : (
        <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(homeworkData ?? []).map((hw) => (
            <motion.div
              key={hw.id}
              variants={item}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-foreground">{hw.title}</h3>
                {hw.isOverdue && (
                  <span className="text-xs px-2 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">Overdue</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{hw.description}</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span>{hw.subject?.name ?? "General"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                  <span>Due: {formatDate(hw.dueDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
          <h1 className="text-2xl font-bold text-foreground">Children</h1>
          <p className="text-sm text-muted-foreground">Monitor your children&apos;s academic progress.</p>
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
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
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
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{selectedChild.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedChild.class?.name ?? "Class"} · {selectedChild.section?.name ?? "Section"} · Roll:{" "}
                    {selectedChild.rollNumber ?? "-"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg border transition-colors ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-transparent shadow-lg shadow-indigo-500/20"
                        : "border-border/60 hover:bg-secondary/40 text-foreground"
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
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
  );
}
