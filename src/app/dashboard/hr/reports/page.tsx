"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { FileSpreadsheet, Download, FileText, Search, Users, UserCheck, UserX, Printer } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type AttendanceSummary = {
  month: number;
  year: number;
  summaries: Array<{
    staffId: string;
    employeeId: string;
    name: string;
    designation: string;
    totalWorkingDays: number;
    present: number;
    absent: number;
    late: number;
    leaveDays: number;
    attendancePercent: number;
  }>;
};

type StaffSearchResult = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: { name: string };
  staffType: string;
  qualification?: string;
  experience?: number;
  address?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  joiningDate?: string;
  idProofUrl?: string;
  contractUrl?: string;
  certificates?: string[];
};

type AttendanceRecord = {
  id: string;
  date: string;
  status: string;
  note?: string;
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function ReportsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [searchQuery, setSearchQuery] = useState("");
  const [staffResults, setStaffResults] = useState<StaffSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"documents" | "attendance">("attendance");
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [attendanceResults, setAttendanceResults] = useState<StaffSearchResult[]>([]);
  const [attendanceSearchLoading, setAttendanceSearchLoading] = useState(false);
  const [selectedAttendanceStaff, setSelectedAttendanceStaff] = useState<StaffSearchResult | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [printingAttendance, setPrintingAttendance] = useState(false);

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/hr/attendance/monthly-summary?year=${year}&month=${month}`);
        const payload = res.data?.data ?? res.data;
        setSummary(payload);
      } catch {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year, month]);

  useEffect(() => {
    if (!attendanceSearch.trim()) {
      setAttendanceResults([]);
      return;
    }
    let cancelled = false;
    setAttendanceSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/hr/staff?search=${encodeURIComponent(attendanceSearch.trim())}&limit=10`);
        const payload = res.data?.data ?? res.data;
        if (!cancelled) {
          setAttendanceResults(payload.staff ?? []);
        }
      } catch {
        if (!cancelled) setAttendanceResults([]);
      } finally {
        if (!cancelled) setAttendanceSearchLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [attendanceSearch]);

  useEffect(() => {
    if (!selectedAttendanceStaff) return;
    const loadAttendance = async () => {
      setLoadingAttendance(true);
      try {
        const res = await api.get(`/hr/attendance/staff/${selectedAttendanceStaff.id}`);
        const payload = res.data?.data ?? res.data;
        const records = Array.isArray(payload) ? payload : [];
        const mapped = records.map((r: any) => ({
          id: r.id,
          date: r.date ? new Date(r.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—",
          status: r.status ?? "—",
          note: r.note ?? "",
        }));
        setAttendanceRecords(mapped);
      } catch {
        setAttendanceRecords([]);
      } finally {
        setLoadingAttendance(false);
      }
    };
    loadAttendance();
  }, [selectedAttendanceStaff]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setStaffResults([]);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/hr/staff?search=${encodeURIComponent(searchQuery.trim())}&limit=10`);
        const payload = res.data?.data ?? res.data;
        if (!cancelled) {
          setStaffResults(payload.staff ?? []);
        }
      } catch {
        if (!cancelled) setStaffResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const exportCSV = () => {
    if (!summary) return;
    const headers = ["Name", "Employee ID", "Designation", "Present", "Absent", "Late", "Leave Days", "Attendance %"];
    const rows = summary.summaries.map((s) => [s.name, s.employeeId, s.designation, s.present, s.absent, s.late, s.leaveDays, `${s.attendancePercent}%`]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${summary.year}-${summary.month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!summary) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("HR Attendance Report", 14, 16);
    doc.setFontSize(10);
    doc.text(`${monthNames[Number(month) - 1]} ${year}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [["Staff", "Employee ID", "Designation", "Present", "Absent", "Late", "Leave", "Attendance %"]],
      body: summary.summaries.map((s) => [s.name, s.employeeId, s.designation, s.present, s.absent, s.late, s.leaveDays, `${s.attendancePercent}%`]),
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 },
    });
    doc.save(`attendance-report-${summary.year}-${summary.month}.pdf`);
  };

  const generateStaffDocumentPDF = (staff: StaffSearchResult) => {
    setPrintingId(staff.id);
    try {
      const doc = new jsPDF();
      let y = 16;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Staff Document", 14, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const details = [
        ["Name", staff.name],
        ["Employee ID", staff.employeeId],
        ["Email", staff.email],
        ["Phone", staff.phone ?? "—"],
        ["Designation", staff.designation ?? "—"],
        ["Department", staff.department?.name ?? "—"],
        ["Staff Type", staff.staffType === "TEACHING" ? "Teaching" : "Non-Teaching"],
        ["Qualification", staff.qualification ?? "—"],
        ["Experience", staff.experience != null ? `${staff.experience} years` : "—"],
        ["Gender", staff.gender ?? "—"],
        ["Date of Birth", staff.dateOfBirth ?? "—"],
        ["Joining Date", staff.joiningDate ?? "—"],
        ["Blood Group", staff.bloodGroup ?? "—"],
        ["Address", staff.address ?? "—"],
      ];

      autoTable(doc, {
        startY: y,
        head: [["Field", "Details"]],
        body: details,
        theme: "grid",
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 10 },
        columnStyles: { 0: { cellWidth: 42 } },
      });

      y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
      y += 12;
      doc.setFontSize(9);
      doc.text(`ID proof: ${staff.idProofUrl ? "Available" : "Not available"}`, 14, y);
      doc.text(`Contract: ${staff.contractUrl ? "Available" : "Not available"}`, 14, y + 6);
      doc.text(`Certificates: ${staff.certificates?.length ?? 0}`, 14, y + 12);

      doc.save(`staff-document-${staff.employeeId}-${staff.name.replace(/\s+/g, "-")}.pdf`);
    } finally {
      setPrintingId(null);
    }
  };

  const exportStaffAttendancePDF = async (staff: StaffSearchResult) => {
    setPrintingId(staff.id);
    try {
      const [staffRes, attRes] = await Promise.allSettled([
        api.get(`/hr/staff/${staff.id}`),
        api.get(`/hr/attendance/staff/${staff.id}`),
      ]);

      const staffData = staffRes.status === "fulfilled" ? (staffRes.value.data?.data ?? staffRes.value.data) : staff;
      const attRecords: AttendanceRecord[] = attRes.status === "fulfilled"
        ? (Array.isArray(attRes.value.data?.data ?? attRes.value.data) ? (attRes.value.data?.data ?? attRes.value.data) : [])
        : [];

      const doc = new jsPDF();
      let y = 14;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Attendance Information", 14, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${staffData.name}`, 14, y);
      doc.text(`Employee ID: ${staffData.employeeId}`, 100, y);
      y += 6;
      doc.text(`Designation: ${staffData.designation ?? "—"}`, 14, y);
      doc.text(`Department: ${staffData.department?.name ?? "—"}`, 100, y);
      y += 6;
      doc.text(`Staff Type: ${staffData.staffType === "TEACHING" ? "Teaching" : "Non-Teaching"}`, 14, y);
      y += 12;

      if (attRecords.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Date", "Status", "Note"]],
          body: attRecords.map((r) => [
            r.date ? new Date(r.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—",
            r.status ?? "—",
            r.note ?? "—",
          ]),
          theme: "grid",
          headStyles: { fillColor: [79, 70, 229] },
          styles: { fontSize: 9 },
        });
      } else {
        doc.setFontSize(10);
        doc.text("No attendance records found for this staff member.", 14, y + 10);
      }

      doc.save(`attendance-${staffData.employeeId}-${staffData.name.replace(/\s+/g, "-")}.pdf`);
    } catch {
      // ignore
    } finally {
      setPrintingId(null);
    }
  };

  return (
    <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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

      <div className="relative w-full max-w-6xl my-8 space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  HR Reports
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-indigo-400"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                  </motion.span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Attendance, leave, and staff reports
                </p>
              </div>
              <div className="flex items-center gap-3">
                {activeTab === "attendance" && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={exportPDF}
                      disabled={!summary || summary.summaries.length === 0}
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-4 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <FileText className="h-4 w-4" /> Export PDF
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={exportCSV}
                      disabled={!summary || summary.summaries.length === 0}
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-4 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Download className="h-4 w-4" /> Export CSV
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab("documents")}
                className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === "documents"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Staff Documents
              </button>
              <button
                onClick={() => setActiveTab("attendance")}
                className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === "attendance"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Attendance Information
              </button>
            </div>

            {activeTab === "documents" && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-5 shadow-xl space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-400" /> Staff Document Search
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search staff by name, employee ID, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                  />
                </div>

                {searchQuery.trim() && (
                  <div className="space-y-2">
                    {searchLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3 py-2">
                            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-40 rounded-md" />
                              <Skeleton className="h-3 w-24 rounded-md" />
                            </div>
                            <Skeleton className="h-8 w-32 rounded-lg" />
                          </div>
                        ))}
                      </div>
                    ) : staffResults.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No staff found.</p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {staffResults.map((staff, idx) => (
                          <motion.div
                            key={staff.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 shrink-0">
                                <Users className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 dark:text-white truncate">{staff.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {staff.employeeId} · {staff.designation ?? "—"} · {staff.department?.name ?? "—"}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{staff.staffType.toLowerCase()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => generateStaffDocumentPDF(staff)}
                                disabled={printingId === staff.id}
                                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-3 py-1.5 text-xs font-semibold shadow-md shadow-indigo-500/30 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              >
                                <FileText className="h-3 w-3" />
                                {printingId === staff.id ? "Generating..." : "Document"}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => exportStaffAttendancePDF(staff)}
                                disabled={printingId === staff.id}
                                className="flex items-center gap-2 rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              >
                                <UserCheck className="h-3 w-3" />
                                {printingId === staff.id ? "Generating..." : "Attendance"}
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "attendance" && (
              <div className="space-y-6">
                {!selectedAttendanceStaff ? (
                  <>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-5 shadow-xl space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Search className="w-4 h-4 text-indigo-400" /> Search Staff for Attendance
                      </h3>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search staff by name, employee ID, or email..."
                          value={attendanceSearch}
                          onChange={(e) => setAttendanceSearch(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                        />
                      </div>

                      {attendanceSearch.trim() && (
                        <div className="space-y-2">
                          {attendanceSearchLoading ? (
                            <div className="space-y-2">
                              {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 py-2">
                                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                                  <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-40 rounded-md" />
                                    <Skeleton className="h-3 w-24 rounded-md" />
                                  </div>
                                  <Skeleton className="h-8 w-32 rounded-lg" />
                                </div>
                              ))}
                            </div>
                          ) : attendanceResults.length === 0 ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No staff found.</p>
                          ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                              {attendanceResults.map((staff, idx) => (
                                <motion.div
                                  key={staff.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-4 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 shrink-0">
                                      <Users className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-medium text-slate-900 dark:text-white truncate">{staff.name}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                        {staff.employeeId} · {staff.designation ?? "—"} · {staff.department?.name ?? "—"}
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{staff.staffType.toLowerCase()}</p>
                                    </div>
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedAttendanceStaff(staff)}
                                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-3 py-1.5 text-xs font-semibold shadow-md shadow-indigo-500/30 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                  >
                                    <UserCheck className="h-3 w-3" /> View Attendance
                                  </motion.button>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {selectedAttendanceStaff.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {selectedAttendanceStaff.employeeId} · {selectedAttendanceStaff.designation ?? "—"} · {selectedAttendanceStaff.department?.name ?? "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => exportStaffAttendancePDF(selectedAttendanceStaff)}
                          disabled={printingAttendance}
                          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-4 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <Printer className="h-4 w-4" />
                          {printingAttendance ? "Generating..." : "Download Attendance PDF"}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedAttendanceStaff(null);
                            setAttendanceRecords([]);
                          }}
                          className="rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10"
                        >
                          Back
                        </motion.button>
                      </div>
                    </div>

                    {loadingAttendance ? (
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-4 py-3">
                            <Skeleton className="h-4 w-32 rounded-md" />
                            <Skeleton className="h-4 w-20 rounded-md" />
                            <Skeleton className="h-4 w-24 rounded-md" />
                            <Skeleton className="h-4 w-16 rounded-md" />
                            <Skeleton className="h-4 w-16 rounded-md" />
                            <Skeleton className="h-4 w-24 rounded-md" />
                          </div>
                        ))}
                      </div>
                    ) : attendanceRecords.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-3 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                        >
                          <UserX className="w-8 h-8 text-indigo-400" />
                        </motion.div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">No attendance records found for this staff member.</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-5 shadow-xl overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                              <th className="pb-2 font-medium">Date</th>
                              <th className="pb-2 font-medium">Status</th>
                              <th className="pb-2 font-medium">Note</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {attendanceRecords.map((record, idx) => (
                              <motion.tr
                                key={record.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                              >
                                <td className="py-3 font-medium text-slate-900 dark:text-white">{record.date}</td>
                                <td className="py-3">
                                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                                    record.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" :
                                    record.status === "ABSENT" ? "bg-red-100 text-red-700" :
                                    record.status === "LATE" ? "bg-amber-100 text-amber-700" :
                                    "bg-gray-100 text-gray-700"
                                  }`}>
                                    {record.status}
                                  </span>
                                </td>
                                <td className="py-3 text-slate-500 dark:text-slate-400">{record.note || "—"}</td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
