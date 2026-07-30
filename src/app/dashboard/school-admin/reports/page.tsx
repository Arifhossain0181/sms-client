"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { classService } from "@/app/modules/class/class.service";
import { examService } from "@/app/modules/exam/exam.service";
import api from "@/lib/axios";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  Download,
  RefreshCw,
  GraduationCap,
  Users,
  CalendarDays,
  DollarSign,
  GraduationCap as ExamIcon,
  FileText,
  Loader2,
  ChevronRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClassType = {
  id: string;
  name: string;
  numericLevel: number;
  sections?: { id: string; name: string; maxCapacity: number }[];
};

type Exam = {
  id: string;
  name: string;
  type: string;
  classId: string;
  examDate?: string;
};

type ReportType = "students" | "attendance" | "fees" | "results";

type ReportConfig = {
  key: ReportType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  formats: string[];
};

const REPORT_TYPES: ReportConfig[] = [
  {
    key: "students",
    label: "Student List",
    description: "All students with class, section, roll & contact",
    icon: Users,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    formats: ["PDF", "CSV"],
  },
  {
    key: "attendance",
    label: "Attendance Report",
    description: "Daily attendance summary by class/section",
    icon: CalendarDays,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    formats: ["PDF", "CSV"],
  },
  {
    key: "fees",
    label: "Fee Collection Report",
    description: "Fee status, amounts, and due dates",
    icon: DollarSign,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    formats: ["PDF", "CSV"],
  },
  {
    key: "results",
    label: "Results Report",
    description: "Exam-wise marks and grades for all students",
    icon: ExamIcon,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    formats: ["PDF", "CSV"],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Skel({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-block rounded bg-muted/60 animate-pulse ${className}`} />
  );
}

function buildDownloadUrl(path: string, params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) usp.set(k, v); });
  const qs = usp.toString();
  // path already includes the /api/v1 prefix via handleExport
  return `${path}${qs ? `?${qs}` : ""}`;
}

async function triggerDownload(url: string, filename: string) {
  try {
    const res = await api.get(url, { responseType: "blob" });
    const blob = res.data as Blob;
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
    toast.success("Download started");
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      (err instanceof Error ? err.message : "Download failed");
    toast.error(msg);
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SchoolAdminReportsPage() {
  const router = useRouter();
  const { role } = useAuth();

  // ── Role guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (role && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const [reportType, setReportType] = useState<ReportType>("students");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [examFilter, setExamFilter] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch classes ──────────────────────────────────────────────────────────
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: classService.getAll,
  });

  const classList: ClassType[] = Array.isArray(classes) ? classes : [];

  // ── Derived: sections for selected class ───────────────────────────────────
  const selectedClass = useMemo(
    () => classList.find((c) => c.id === classFilter),
    [classList, classFilter]
  );

  const sections = useMemo(() => selectedClass?.sections ?? [], [selectedClass]);

  // ── Fetch exams ────────────────────────────────────────────────────────────
  const { data: exams = [] } = useQuery({
    queryKey: ["exams"],
    queryFn: examService.getAll,
    enabled: reportType === "results",
  });

  const examList: Exam[] = Array.isArray(exams) ? exams : [];

  // ── useMemo: report config & filters validity ──────────────────────────────
  const currentConfig = REPORT_TYPES.find((r) => r.key === reportType)!;

  const canExport = useMemo(() => {
    switch (reportType) {
      case "students":
        return true;
      case "attendance":
        return !!(classFilter && sectionFilter && attendanceDate);
      case "fees":
        return true;
      case "results":
        return !!examFilter;
      default:
        return false;
    }
  }, [reportType, classFilter, sectionFilter, attendanceDate, examFilter]);

  const handleExport = async (fmt: "pdf" | "csv") => {
    if (!canExport && reportType !== "fees" && reportType !== "students") return;
    setActionLoading(true);
    try {
      let url = "";
      let filename = "";
      switch (reportType) {
        case "students":
          url = buildDownloadUrl(`/reports/students/${fmt}`, { classId: classFilter });
          filename = classFilter ? `students-${classFilter}.${fmt}` : `students.${fmt}`;
          break;
        case "attendance":
          url = buildDownloadUrl(`/reports/attendance/${fmt}`, {
            classId: classFilter,
            sectionId: sectionFilter,
            date: attendanceDate,
          });
          filename = `attendance-${attendanceDate}.${fmt}`;
          break;
        case "fees":
          url = buildDownloadUrl(`/reports/fees/${fmt}`, {});
          filename = `fees.${fmt}`;
          break;
        case "results":
          url = buildDownloadUrl(`/reports/results/${fmt}`, { examId: examFilter });
          filename = `results-${examFilter}.${fmt}`;
          break;
      }
      await triggerDownload(url, filename);
    } catch {
      // handled in triggerDownload
    } finally {
      setActionLoading(false);
    }
  };

  const handleTypeChange = (key: ReportType) => {
    setReportType(key);
    setClassFilter("");
    setSectionFilter("");
    setExamFilter("");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Export student, attendance, fee, and result reports in PDF or CSV.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </motion.div>

      {/* Report type selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {REPORT_TYPES.map((report) => {
          const Icon = report.icon;
          const isActive = reportType === report.key;
          return (
            <button
              key={report.key}
              onClick={() => handleTypeChange(report.key)}
              className={`relative rounded-2xl p-4 text-left transition-all border ${
                isActive
                  ? "border-primary/60 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/60 bg-card/80 hover:bg-secondary/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${report.bg}`}>
                  <Icon className={`w-5 h-5 ${report.color}`} />
                </div>
                <div className="min-w-0">
                  <p className={`font-semibold text-sm ${isActive ? "text-primary" : "text-foreground"}`}>
                    {report.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {report.description}
                  </p>
                </div>
              </div>
              {isActive && (
                <motion.div
                  layoutId="active-report-indicator"
                  className="absolute top-2 right-2"
                >
                  <ChevronRight className="w-4 h-4 text-primary" />
                </motion.div>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Filters & Export */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border/60 bg-card/80 shadow-soft p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            {currentConfig.label} — Filters &amp; Export
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 flex-wrap">
          {/* Class filter (needed for students, attendance, results) */}
          {(reportType === "students" || reportType === "attendance" || reportType === "results") && (
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Class</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={classFilter}
                  onChange={(e) => { setClassFilter(e.target.value); setSectionFilter(""); }}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Classes</option>
                  {classList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Section filter (attendance only) */}
          {reportType === "attendance" && (
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Section</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  disabled={!classFilter || sections.length === 0}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  <option value="">Select Section</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Date filter (attendance only) */}
          {reportType === "attendance" && (
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Date</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {/* Exam filter (results only) */}
          {reportType === "results" && (
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Exam</label>
              <div className="relative">
                <ExamIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={examFilter}
                  onChange={(e) => setExamFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select Exam</option>
                  {examList.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Export buttons */}
          <div className="flex items-end gap-2 lg:ml-auto">
            <button
              onClick={() => handleExport("pdf")}
              disabled={!canExport || actionLoading}
              className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export PDF
            </button>
            <button
              onClick={() => handleExport("csv")}
              disabled={!canExport || actionLoading}
              className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border border-border hover:bg-secondary text-foreground font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {!canExport && reportType !== "fees" && reportType !== "students" && (
          <p className="text-xs text-muted-foreground mt-3">
            Please fill all required filters to enable export.
          </p>
        )}
      </motion.div>

      {/* Summary info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border/60 bg-card/80 shadow-soft p-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              {currentConfig.label} Export
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              {reportType === "students" && "Export the complete student list including ID, name, class, section, roll number, email, and active status. Use class filter to narrow down."}
              {reportType === "attendance" && "Export a daily attendance report for a specific class, section, and date. Shows roll number, student ID, name, status, and who marked it."}
              {reportType === "fees" && "Export the complete fee collection report including student name, class, fee type, amount, paid amount, status, and due date."}
              {reportType === "results" && "Export exam results showing exam name, student, class, subject, marks obtained, and grade. Select an exam to filter."}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
