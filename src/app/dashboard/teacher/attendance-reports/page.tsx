"use client";

import { useEffect, useMemo, useState } from "react";
import { useLenis } from "@/hooks/useLenis";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { motion } from "framer-motion";
import {
  CalendarRange,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useMonthlyReport, useYearlyReport } from "@/app/modules/attendence/useAttendance";
import { useClasses } from "@/app/modules/class/useClasses";

type ReportType = "monthly" | "yearly";

type AssignedClass = {
  id: string;
  name: string;
  sections?: Array<{ id: string; name: string }>;
};

type ReportRow = {
  student: { id: string; name: string; rollNumber: number };
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
  belowThreshold: boolean;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function TeacherAttendanceReportsPage() {
  useLenis();
  const { user } = useAuth();
  const { data: classes } = useClasses();

  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const loadClasses = async () => {
      try {
        const res = await api.get("/teachers/me");
        const payload = res.data?.data ?? res.data;
        const sections = payload?.sectionTeacher as Array<{ class: AssignedClass }> | undefined;
        const classMap = new Map<string, AssignedClass>();
        sections?.forEach((st) => {
          if (st.class?.id) {
            const existing = classMap.get(st.class.id);
            if (!existing) {
              classMap.set(st.class.id, { id: st.class.id, name: st.class.name, sections: [] });
            }
          }
        });
        setAssignedClasses(Array.from(classMap.values()));
      } catch {
        /* ignore */
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClasses();
  }, [user?.id]);

  const availableSections = useMemo(() => {
    const cls = (Array.isArray(classes) ? classes : []).find((c) => c.id === classId);
    return cls?.sections ?? [];
  }, [classes, classId]);

  const { data: monthlyData, isLoading: monthlyLoading, refetch: refetchMonthly } = useMonthlyReport(
    classId, sectionId, month, year
  );
  const { data: yearlyData, isLoading: yearlyLoading, refetch: refetchYearly } = useYearlyReport(
    classId, sectionId, year
  );

  const reportData = useMemo<ReportRow[]>(() => {
    if (reportType === "monthly") return (monthlyData as ReportRow[] | undefined) ?? [];
    return (yearlyData as ReportRow[] | undefined) ?? [];
  }, [reportType, monthlyData, yearlyData]);

  const isLoading = reportType === "monthly" ? monthlyLoading : yearlyLoading;
  const refetch = reportType === "monthly" ? refetchMonthly : refetchYearly;

  const selectedClassName = useMemo(() => {
    const fromAssigned = assignedClasses.find((c) => c.id === classId)?.name;
    const fromAll = (Array.isArray(classes) ? classes : []).find((c) => c.id === classId)?.name;
    return fromAssigned || fromAll || "";
  }, [assignedClasses, classes, classId]);

  const selectedSectionName = useMemo(() => {
    return availableSections.find((s) => s.id === sectionId)?.name ?? "";
  }, [availableSections, sectionId]);

  const exportCSV = () => {
    if (!reportData.length) return;
    const header = "Roll No,Student Name,Total Days,Present,Absent,Late,Attendance %,Status\n";
    const rows = reportData
      .map(
        (r) =>
          `${r.student.rollNumber},"${r.student.name}",${r.total},${r.present},${r.absent},${r.late},${r.percentage}%,${r.belowThreshold ? "Below 75%" : "OK"}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;chars=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${reportType}-${selectedClassName || "class"}-${selectedSectionName || "section"}-${year}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    if (classId && sectionId) refetch();
  };

  const tabs: { key: ReportType; label: string; icon: typeof CalendarRange }[] = [
    { key: "monthly", label: "Monthly Report", icon: CalendarRange },
    { key: "yearly", label: "Yearly Report", icon: FileSpreadsheet },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Attendance Reports</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monthly and yearly attendance summaries for your assigned classes.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={!classId || !sectionId}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors disabled:opacity-40"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="flex gap-1 bg-secondary/60 p-1 rounded-xl w-fit"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = reportType === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setReportType(tab.key)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="report-tab-bg"
                  className="absolute inset-0 rounded-lg bg-background shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 flex-wrap"
      >
        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={classId}
            onChange={(e) => { setClassId(e.target.value); setSectionId(""); }}
            className="text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring flex-1"
          >
            <option value="">Select Class</option>
            {(Array.isArray(assignedClasses) ? assignedClasses : []).map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
            {!loadingClasses && assignedClasses.length === 0 && (
              <option value="" disabled>No assigned classes</option>
            )}
          </select>
        </div>

        <select
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
          disabled={!classId}
          className="text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 min-w-[180px]"
        >
          <option value="">Select Section</option>
          {availableSections.map((sec) => (
            <option key={sec.id} value={sec.id}>{sec.name}</option>
          ))}
        </select>

        {reportType === "monthly" && (
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring min-w-[160px]"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        )}

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
        >
          {[year - 1, year, year + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <button
          onClick={exportCSV}
          disabled={!reportData.length}
          className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-40"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </motion.div>

      {/* Report content */}
      {!classId || !sectionId ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 rounded-2xl border border-border/60 bg-card/80"
        >
          <CalendarRange className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Select a class and section to view attendance reports.</p>
        </motion.div>
      ) : isLoading ? (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-muted/60 animate-pulse" />
            ))}
          </div>
        </div>
      ) : reportData.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 rounded-2xl border border-border/60 bg-card/80"
        >
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No attendance records found for this selection.</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/60 bg-card/80 shadow-soft overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/40 border-b border-border/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Roll No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student Name</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Days</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Present</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Absent</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Late</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attendance %</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {reportData.map((row, i) => (
                  <motion.tr
                    key={row.student.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.2 }}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{row.student.rollNumber}</td>
                    <td className="px-4 py-3 text-foreground">{row.student.name}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{row.total}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {row.present}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                        {row.absent > 0 && <span className="w-2 h-2 rounded-full bg-red-500" />}
                        {row.absent}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                        {row.late > 0 && <Clock className="w-3.5 h-3.5" />}
                        {row.late}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          row.belowThreshold
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        }`}
                      >
                        {row.belowThreshold && <AlertTriangle className="w-3.5 h-3.5" />}
                        {row.percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.belowThreshold ? (
                        <span className="text-xs font-medium text-red-600 dark:text-red-400">Below 75%</span>
                      ) : (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">OK</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
