"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { classService } from "@/app/modules/class/class.service";
import { examService } from "@/app/modules/exam/exam.service";
import type { Exam } from "@/app/modules/exam/exam.types";
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
  Search,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClassType = {
  id: string;
  name: string;
  numericLevel: number;
  sections?: { id: string; name: string; maxCapacity: number }[];
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

// ─── Main Page 

export default function SchoolAdminReportsPage() {
  const router = useRouter();
  const { role } = useAuth();

  // ── Role guard 
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
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch classes 
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: classService.getAll,
  });

  const classList: ClassType[] = Array.isArray(classes) ? classes : [];

  // ── Derived: sections for selected class 
  const selectedClass = useMemo(
    () => classList.find((c) => c.id === classFilter),
    [classList, classFilter]
  );

  const sections = useMemo(() => selectedClass?.sections ?? [], [selectedClass]);

  // ── Fetch exams 
  const { data: exams = [] } = useQuery({
    queryKey: ["exams"],
    queryFn: examService.getAll,
    enabled: reportType === "results",
  });

  const examList: Exam[] = Array.isArray(exams) ? exams : [];

  // ── Fetch students for single-student export 
  const { data: students = [] } = useQuery({
    queryKey: ["students", "report-search", studentSearch],
    queryFn: async () => {
      const res = await api.get("/students", { params: { search: studentSearch, limit: 50 } });
      const d = res.data?.data ?? res.data;
      if (Array.isArray(d)) return d;
      if (Array.isArray(d?.data)) return d.data;
      return [];
    },
    enabled: !!studentSearch,
  });

  const studentList = Array.isArray(students) ? students : [];
  const selectedStudent = studentList.find((s) => s.id === selectedStudentId);

  // ── useMemo: report config & filters validity 
  const currentConfig = REPORT_TYPES.find((r) => r.key === reportType)!;

  const canExport = useMemo(() => {
    switch (reportType) {
      case "students":
        return !!selectedStudentId || !!classFilter;
      case "attendance":
        return !!(selectedStudentId && classFilter && sectionFilter && attendanceDate) || (!selectedStudentId && classFilter && sectionFilter && attendanceDate);
      case "fees":
        return !!selectedStudentId;
      case "results":
        return !!(examFilter || selectedStudentId);
      default:
        return false;
    }
  }, [reportType, classFilter, sectionFilter, attendanceDate, examFilter, selectedStudentId]);

  const handleExport = async (format: "pdf" | "csv") => {
    if (!canExport) return;
    setActionLoading(true);
    try {
      let url = "";
      let filename = "";
      switch (reportType) {
        case "students":
          url = buildDownloadUrl(`/reports/students/${format}`, {
            classId: classFilter || undefined,
            studentId: selectedStudentId || undefined,
          });
          filename = selectedStudentId
            ? `students-${selectedStudent?.name || 'student'}.${format}`
            : classFilter
              ? `students-${classFilter}.${format}`
              : `students.${format}`;
          break;
        case "attendance":
          url = buildDownloadUrl(`/reports/attendance/${format}`, {
            classId: classFilter,
            sectionId: sectionFilter,
            date: attendanceDate,
            studentId: selectedStudentId || undefined,
          });
          filename = selectedStudentId
            ? `attendance-${selectedStudent?.name || 'student'}-${attendanceDate}.${format}`
            : `attendance-${attendanceDate}.${format}`;
          break;
        case "fees":
          url = buildDownloadUrl(`/reports/fees/${format}`, {
            studentId: selectedStudentId || undefined,
          });
          filename = selectedStudentId
            ? `fees-${selectedStudent?.name || 'student'}.${format}`
            : `fees.${format}`;
          break;
        case "results":
          url = buildDownloadUrl(`/reports/results/${format}`, {
            examId: examFilter,
            studentId: selectedStudentId,
          });
          filename = selectedStudentId
            ? `results-${selectedStudent?.name || 'student'}.${format}`
            : `results-${examFilter}.${format}`;
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
    setStudentSearch("");
    setSelectedStudentId("");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
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
      <div className="relative z-10 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden"
      >
        <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
          <motion.div
            animate={{ x: [0, 100, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
          />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Reports</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                Export student, attendance, fee, and result reports in PDF or CSV.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-white/40 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-secondary transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Report type selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none p-5"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {REPORT_TYPES.map((report) => {
          const Icon = report.icon;
          const isActive = reportType === report.key;
          return (
            <button
              key={report.key}
              onClick={() => handleTypeChange(report.key)}
              className={`relative rounded-2xl p-4 text-left transition-all border backdrop-blur-sm ${
                isActive
                  ? "bg-gradient-to-r from-sky-50/80 via-indigo-50/60 to-violet-50/80 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-indigo-200/60 dark:border-indigo-400/20 hover:shadow-lg hover:shadow-indigo-500/10"
                  : "bg-white/60 dark:bg-white/5 border-white/30 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${report.bg}`}>
                  <Icon className={`w-5 h-5 ${report.color}`} />
                </div>
                <div className="min-w-0">
                  <p className={`font-semibold text-sm ${isActive ? "text-primary" : "text-slate-800 dark:text-white"}`}>
                    {report.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
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
      </div>
      </motion.div>

      {/* Filters & Export */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-white">
            {currentConfig.label} — Filters &amp; Export
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 flex-wrap">
          {/* Class filter (needed for students, attendance, results) */}
          {(reportType === "students" || reportType === "attendance" || reportType === "results") && (
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">Class</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
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
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">Section</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
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
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">Date</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
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
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">Exam</label>
              <div className="relative">
                <ExamIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
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

          {/* Student filter (single student export) */}
          {reportType && (
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">
                Student {reportType !== "results" && "(optional)"}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search student by name…"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setSelectedStudentId("");
                  }}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {studentSearch && (
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full mt-2 px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Students</option>
                  {studentList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.studentId ? `(${s.studentId})` : ""}
                    </option>
                  ))}
                </select>
              )}
              {selectedStudentId && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Exporting for: <span className="font-medium text-slate-800 dark:text-white">{selectedStudent?.name ?? "selected student"}</span>
                </p>
              )}
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

        {!canExport && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            Please select a student or fill the required filters to enable export.
          </p>
        )}
      </motion.div>

      {/* Summary info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none p-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-800 dark:text-white">
              {currentConfig.label} Export
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {reportType === "students" && "Export the complete student list including ID, name, class, section, roll number, email, and active status. Use class filter or search a single student to narrow down."}
              {reportType === "attendance" && "Export a daily attendance report for a specific class, section, and date. Shows roll number, student ID, name, status, and who marked it. You can also export for a single student."}
              {reportType === "fees" && "Export the complete fee collection report including student name, class, fee type, amount, paid amount, status, and due date. Search a student to export only their fees."}
              {reportType === "results" && "Export exam results showing exam name, student, class, subject, marks obtained, and grade. Select an exam to filter, or search a single student."}
            </p>
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
