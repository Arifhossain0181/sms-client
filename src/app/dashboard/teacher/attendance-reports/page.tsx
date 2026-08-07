"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  FileDown,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { useAuth } from "@/hooks/useAuth";
import { useClasses } from "@/app/modules/class/useClasses";
import { useMyProfile } from "@/app/modules/teachers/useTeachers";
import {
  AttendanceReportRow,
} from "@/app/modules/attendence/attendance.types";
import {
  useMonthlyReport,
  useYearlyReport,
} from "@/app/modules/attendence/useAttendance";

type TabType = "monthly" | "yearly";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);
const ATTENDANCE_THRESHOLD = 75;

function getPercentageColor(pct: number) {
  if (pct >= ATTENDANCE_THRESHOLD) return "text-emerald-600 dark:text-emerald-300";
  return "text-rose-600 dark:text-rose-300";
}

function getProgressColor(pct: number) {
  if (pct >= ATTENDANCE_THRESHOLD) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

function exportCSV(rows: AttendanceReportRow[], filename: string) {
  if (!rows.length) {
    toast.error("No data to export");
    return;
  }

  const headers = ["Roll", "Student Name", "Present", "Absent", "Late", "Total", "Percentage", "Status"];
  const csvRows = [
    headers.join(","),
    ...rows.map((row) => {
      const status = row.percentage >= ATTENDANCE_THRESHOLD ? "Good" : "Below Threshold";
      return [
        row.student.rollNumber,
        `"${row.student.name.replace(/"/g, '""')}"`,
        row.present,
        row.absent,
        row.late,
        row.total,
        `${row.percentage}%`,
        status,
      ].join(",");
    }),
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exported successfully");
}

function exportPDF(opts: {
  rows: AttendanceReportRow[];
  className: string;
  sectionName: string;
  tab: TabType;
  month: number;
  year: number;
  avg: number;
  good: number;
  below: number;
  total: number;
}) {
  if (!opts.rows.length) {
    toast.error("No data to export");
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Attendance Report", pageWidth / 2, 16, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${opts.className} | Section: ${opts.sectionName}`, pageWidth / 2, 24, { align: "center" });
  doc.text(
    opts.tab === "monthly" ? `${MONTHS[opts.month]} ${opts.year}` : `Year ${opts.year}`,
    pageWidth / 2,
    30,
    { align: "center" }
  );
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 36, { align: "center" });

  autoTable(doc, {
    startY: 44,
    head: [["Roll", "Student Name", "Present", "Absent", "Late", "Total", "Percentage", "Status"]],
    body: opts.rows.map((row) => [
      String(row.student.rollNumber),
      row.student.name,
      String(row.present),
      String(row.absent),
      String(row.late),
      String(row.total),
      `${row.percentage}%`,
      row.percentage >= ATTENDANCE_THRESHOLD ? "Good" : "Below Threshold",
    ]),
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontSize: 9,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 6: { cellWidth: 22 } },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 44;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, finalY + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Average Attendance: ${opts.avg}%`, 14, finalY + 17);
  doc.text(`Good Standing: ${opts.good}`, 14, finalY + 23);
  doc.text(`Below Threshold: ${opts.below}`, 14, finalY + 29);
  doc.text(`Total Students: ${opts.total}`, 14, finalY + 35);

  const filename =
    opts.tab === "monthly"
      ? `attendance-${MONTHS[opts.month].toLowerCase()}-${opts.year}.pdf`
      : `attendance-yearly-${opts.year}.pdf`;
  doc.save(filename);
  toast.success("PDF exported successfully");
}

export default function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: profile, isLoading: profileLoading } = useMyProfile(role === "TEACHER");

  const [activeTab, setActiveTab] = useState<TabType>("monthly");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [month, setMonth] = useState<number>(new Date().getMonth());
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (role && role !== "TEACHER" && role !== "SUPER_ADMIN" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const teacherClassIds = useMemo(() => {
    const ids = new Set<string>();
    for (const entry of profile?.sectionTeacher ?? []) {
      if (entry.class?.id) ids.add(entry.class.id);
    }
    return ids;
  }, [profile]);

  const availableClasses = useMemo(() => {
    const list = Array.isArray(classes) ? classes : [];
    if (role === "TEACHER") {
      if (teacherClassIds.size === 0) return [];
      return list.filter((cls) => teacherClassIds.has(cls.id));
    }
    return list;
  }, [classes, role, teacherClassIds]);

  const effectiveClassId = classId || availableClasses[0]?.id || "";
  const selectedClass = useMemo(
    () => availableClasses.find((cls) => cls.id === effectiveClassId),
    [availableClasses, effectiveClassId]
  );

  const teacherSectionIds = useMemo(() => {
    const ids = new Set<string>();
    for (const entry of profile?.sectionTeacher ?? []) {
      if (entry.id) ids.add(entry.id);
    }
    return ids;
  }, [profile]);

  const availableSections = useMemo(() => {
    const sections = selectedClass?.sections ?? [];
    if (role === "TEACHER" && teacherSectionIds.size > 0) {
      const assigned = sections.filter((section) => teacherSectionIds.has(section.id));
      if (assigned.length > 0) return assigned;
    }
    return role === "TEACHER" ? [] : sections;
  }, [role, selectedClass, teacherSectionIds]);

  const effectiveSectionId = sectionId || availableSections[0]?.id || "";
  const sectionName =
    availableSections.find((section) => section.id === effectiveSectionId)?.name ?? "Section";

  const canFetch = Boolean(effectiveClassId && effectiveSectionId);

  const monthlyQuery = useMonthlyReport(effectiveClassId, effectiveSectionId, month + 1, year);
  const yearlyQuery = useYearlyReport(effectiveClassId, effectiveSectionId, year);
  const reportData = activeTab === "monthly" ? monthlyQuery.data : yearlyQuery.data;
  const isLoading =
    profileLoading ||
    classesLoading ||
    (activeTab === "monthly" ? monthlyQuery.isLoading : yearlyQuery.isLoading);

  const filteredRows = useMemo(() => {
    const rows = reportData ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      return (
        row.student.name.toLowerCase().includes(q) ||
        String(row.student.rollNumber).toLowerCase().includes(q)
      );
    });
  }, [reportData, search]);

  const summaryStats = useMemo(() => {
    const total = filteredRows.length;
    if (!total) {
      return { avg: 0, good: 0, below: 0, total: 0 };
    }

    const avg = Math.round(filteredRows.reduce((sum, row) => sum + row.percentage, 0) / total);
    const good = filteredRows.filter((row) => row.percentage >= ATTENDANCE_THRESHOLD).length;
    const below = total - good;
    return { avg, good, below, total };
  }, [filteredRows]);

  const handleRefresh = () => {
    if (!canFetch) return;
    if (activeTab === "monthly") {
      queryClient.invalidateQueries({
        queryKey: ["attendance-monthly-report", effectiveClassId, effectiveSectionId, month + 1, year],
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: ["attendance-yearly-report", effectiveClassId, effectiveSectionId, year],
      });
    }
    toast.success("Data refreshed");
  };

  const handleExportCSV = () => {
    const filename =
      activeTab === "monthly"
        ? `attendance-monthly-${MONTHS[month].toLowerCase()}-${year}.csv`
        : `attendance-yearly-${year}.csv`;
    exportCSV(filteredRows, filename);
  };

  const handleExportPDF = () => {
    exportPDF({
      rows: filteredRows,
      className: selectedClass?.name ?? "Class",
      sectionName,
      tab: activeTab,
      month,
      year,
      avg: summaryStats.avg,
      good: summaryStats.good,
      below: summaryStats.below,
      total: summaryStats.total,
    });
  };

  if (role === "TEACHER" && profileLoading) {
    return (
      <div className="relative min-h-[80vh] flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
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
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-200/50 dark:bg-slate-700/30 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === "TEACHER" && !profileLoading && availableClasses.length === 0) {
    return (
      <div className="relative min-h-[80vh] flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-8 text-center">
          <Users className="mx-auto h-10 w-10 text-indigo-500" />
          <p className="mt-4 font-semibold text-slate-700 dark:text-slate-300">
            No assigned classes found for your teacher profile.
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Ask the admin to assign classes and sections first.
          </p>
        </div>
      </div>
    );
  }

  if (role === "TEACHER" && !profileLoading && availableClasses.length > 0 && availableSections.length === 0) {
    return (
      <div className="relative min-h-[80vh] flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-8 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-indigo-500" />
          <p className="mt-4 font-semibold text-slate-700 dark:text-slate-300">
            No assigned sections found for this class.
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your report access is limited to your assigned sections only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh] flex items-start sm:items-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
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
                  <FileSpreadsheet className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Attendance Reports
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Monthly and yearly attendance summaries from the database.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                Backend connected
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm p-4 sm:p-6 shadow-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Class
                  </label>
                  <div className="relative">
                    <select
                      value={classId || effectiveClassId}
                      onChange={(e) => {
                        setClassId(e.target.value);
                        setSectionId("");
                      }}
                      className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    >
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
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Section
                  </label>
                  <div className="relative">
                    <select
                      value={sectionId || effectiveSectionId}
                      onChange={(e) => setSectionId(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    >
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
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    {activeTab === "monthly" ? "Month" : "Year"}
                  </label>
                  {activeTab === "monthly" ? (
                    <div className="relative">
                      <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                      >
                        {MONTHS.map((m, idx) => (
                          <option key={m} value={idx}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                      >
                        {YEARS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name or roll"
                      className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 pl-10 pr-4 py-3 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="inline-flex rounded-2xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 p-1">
                  {[
                    { key: "monthly" as TabType, label: "Monthly Report", icon: CalendarDays },
                    { key: "yearly" as TabType, label: "Yearly Report", icon: BarChart3 },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                          isActive
                            ? "text-white"
                            : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5"
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="reportTab"
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className="relative flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={!canFetch}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                  <button
                    onClick={handleExportCSV}
                    disabled={!filteredRows.length}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={!filteredRows.length}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Export PDF
                  </button>
                </div>
              </div>
            </motion.div>

            {canFetch && filteredRows.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {[
                  { label: "Average Attendance", value: `${summaryStats.avg}%`, icon: TrendingUp, tint: "from-sky-400 to-indigo-500" },
                  { label: "Good Standing", value: `${summaryStats.good}`, sub: `of ${summaryStats.total} students`, icon: Trophy, tint: "from-emerald-400 to-green-500" },
                  { label: "Below Threshold", value: `${summaryStats.below}`, sub: `< ${ATTENDANCE_THRESHOLD}%`, icon: TrendingDown, tint: "from-rose-400 to-red-500" },
                  { label: "Total Students", value: `${summaryStats.total}`, icon: Users, tint: "from-violet-400 to-fuchsia-500" },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      whileHover={{ y: -2, scale: 1.01 }}
                      className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-4 shadow-sm"
                    >
                      <div className={`w-11 h-11 rounded-2xl mb-3 flex items-center justify-center bg-gradient-to-br ${stat.tint} text-white shadow-lg`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-white">
                        {stat.value}
                      </p>
                      {stat.sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.sub}</p>}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm shadow-sm overflow-hidden"
            >
              <div className="p-4 sm:p-5 border-b border-white/40 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                    {activeTab === "monthly" ? "Monthly Attendance Report" : "Yearly Attendance Report"}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {activeTab === "monthly"
                      ? `${MONTHS[month]} ${year} - attendance breakdown per student`
                      : `${year} - yearly attendance breakdown per student`}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
                  {selectedClass?.name ?? "Class"} • {sectionName}
                </div>
              </div>

              {!canFetch ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/20 dark:via-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                  >
                    <FileSpreadsheet className="w-10 h-10 text-indigo-600 dark:text-indigo-300" />
                  </motion.div>
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                    Select a class and section
                  </h3>
                  <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                    Choose filters above to load the attendance report.
                  </p>
                </div>
              ) : isLoading && !reportData ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Loading attendance report...
                  </div>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/20 dark:via-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                  >
                    <Users className="w-10 h-10 text-indigo-600 dark:text-indigo-300" />
                  </motion.div>
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                    No records found
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
                          Present
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                          Absent
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                          Late
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                          Total
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Attendance %
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40 dark:divide-white/10">
                      {filteredRows.map((row, index) => {
                        const pct = row.percentage;
                        const pctColor = getPercentageColor(pct);
                        const progressColor = getProgressColor(pct);
                        const belowThreshold = pct < ATTENDANCE_THRESHOLD;
                        return (
                          <motion.tr
                            key={row.student.id}
                            layout
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02, type: "spring", stiffness: 120, damping: 18 }}
                            className={`group transition-colors duration-200 ${
                              belowThreshold
                                ? "bg-rose-50/30 dark:bg-rose-500/5"
                                : pct >= ATTENDANCE_THRESHOLD
                                  ? "bg-emerald-50/30 dark:bg-emerald-500/5"
                                  : "hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                            }`}
                          >
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                                    belowThreshold
                                      ? "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300"
                                      : "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                                  }`}
                                >
                                  {row.student.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                                </div>
                                <span className="font-medium text-slate-800 dark:text-white truncate max-w-[200px]">
                                  {row.student.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-center">
                              <span className="inline-flex items-center rounded-full border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 px-2 py-0.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                                {row.student.rollNumber}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-center">
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/70 dark:border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                                {row.present}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-center">
                              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200/70 dark:border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-300">
                                {row.absent}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-center">
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/70 dark:border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-300">
                                {row.late}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-center">
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {row.total}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex flex-col gap-1.5">
                                <span className={`text-sm font-bold ${pctColor}`}>{pct}%</span>
                                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(pct, 100)}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className={`h-full rounded-full ${progressColor}`}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-center">
                              {belowThreshold ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-rose-200/70 dark:border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-300">
                                  <XCircle className="w-3 h-3" />
                                  Below Threshold
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/70 dark:border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                                  <Sparkles className="w-3 h-3" />
                                  Good
                                </span>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredRows.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-white/40 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredRows.length}</span>{" "}
                    of <span className="font-semibold text-slate-700 dark:text-slate-300">{reportData?.length ?? 0}</span>{" "}
                    students
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Present
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Absent
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Late
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      Total
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
          Attendance Reports
        </motion.p>
      </motion.div>
    </div>
  );
}
