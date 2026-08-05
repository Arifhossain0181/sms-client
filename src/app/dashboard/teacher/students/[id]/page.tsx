"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLenis } from "@/hooks/useLenis";
import api from "@/lib/axios";
import {
  ArrowLeft,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  Droplets,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  ClipboardList,
  AlertTriangle,
  Loader2,
  UserCircle2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentDetail {
  id: string;
  studentId: string;
  name: string;
  rollNumber?: number;
  gender: string;
  dob?: string;
  bloodGroup?: string;
  address?: string;
  photo?: string;
  isActive: boolean;
  email?: string;
  phone?: string;
  guardianEmail?: string;
  class?: { id: string; name: string };
  section?: { id: string; name: string };
  parent?: { name?: string; phone?: string };
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
  records: { id: string; date: string; status: "PRESENT" | "ABSENT" | "LATE" }[];
}

interface ExamResult {
  id: string;
  examId: string;
  exam?: { id: string; name: string };
  gpa?: number;
  status?: string;
  marks?: {
    subject?: { name: string };
    marksObtained: number;
    grade?: string;
  }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
      </div>
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{label}</p>
        <p className="text-sm text-slate-700 dark:text-white font-medium mt-0.5">{value || "—"}</p>
      </div>
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-2xl p-4 ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-semibold opacity-80 mt-0.5">{label}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentDetailPage() {
  useLenis();
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "results">("overview");

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      try {
        setLoading(true);
        const [stuRes, attRes, resultRes] = await Promise.allSettled([
          api.get(`/students/${studentId}`),
          api.get(`/attendance/student/${studentId}`),
          api.get(`/results/student/${studentId}`),
        ]);

        if (stuRes.status === "fulfilled") {
          const p = stuRes.value.data?.data ?? stuRes.value.data;
          setStudent(p);
        } else {
          setError("Student not found or access denied.");
        }

        if (attRes.status === "fulfilled") {
          const p = attRes.value.data?.data ?? attRes.value.data;
          setAttendance(p);
        }

        if (resultRes.status === "fulfilled") {
          const p = resultRes.value.data?.data ?? resultRes.value.data;
          setResults(Array.isArray(p) ? p : Array.isArray(p?.results) ? p.results : []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  const tabs = [
    { key: "overview" as const, label: "Overview", icon: UserCircle2 },
    { key: "attendance" as const, label: "Attendance", icon: ClipboardList },
    { key: "results" as const, label: "Results", icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading student profile…</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-slate-600 dark:text-slate-300 font-medium">{error || "Student not found."}</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    );
  }

  const attPct = attendance?.percentage ?? 0;
  const attColor = attPct >= 75 ? "text-emerald-500" : "text-red-500";

  return (
    <div className="relative min-h-screen p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
      {/* Blobs */}
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-20 -left-20 w-96 h-96 bg-violet-300/15 dark:bg-violet-500/8 rounded-full blur-3xl"
      />

      <div className="relative max-w-5xl mx-auto space-y-5">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </motion.button>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Hero gradient banner */}
          <div className="h-24 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 relative">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          </div>

          <div className="px-6 sm:px-8 pb-6">
            <div className="flex flex-wrap items-end gap-4 -mt-10 mb-5">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-slate-900 shadow-lg overflow-hidden bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {student.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  getInitials(student.name)
                )}
              </div>
              {/* Name & meta */}
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white truncate">{student.name}</h1>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2.5 py-0.5 rounded-full font-medium">
                    ID: {student.studentId}
                  </span>
                  {student.class && (
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-medium">
                      {student.class.name} {student.section && `– ${student.section.name}`}
                    </span>
                  )}
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    student.isActive
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  }`}>
                    {student.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Attendance pill */}
              {attendance && (
                <div className="text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl px-5 py-3 border border-slate-200 dark:border-slate-700">
                  <p className={`text-2xl font-bold ${attColor}`}>{attPct}%</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Attendance</p>
                  {attPct < 75 && (
                    <span className="text-[10px] text-red-500 flex items-center gap-0.5 justify-center mt-0.5">
                      <AlertTriangle className="w-3 h-3" /> Below 75%
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1 w-fit">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive ? "text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="student-tab"
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon className="w-4 h-4" /> {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {/* Personal Info */}
              <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-white/10 shadow-lg p-5">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
                  <UserCircle2 className="w-4 h-4 text-violet-500" /> Personal Information
                </h3>
                <InfoRow icon={Calendar} label="Date of Birth" value={student.dob ? fmt(student.dob) : "—"} />
                <InfoRow icon={Users} label="Gender" value={student.gender ? student.gender.charAt(0) + student.gender.slice(1).toLowerCase() : "—"} />
                <InfoRow icon={Droplets} label="Blood Group" value={student.bloodGroup?.replace("_", "") ?? "—"} />
                <InfoRow icon={MapPin} label="Address" value={student.address ?? "—"} />
              </div>

              {/* Contact Info */}
              <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-white/10 shadow-lg p-5">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-500" /> Contact Information
                </h3>
                <InfoRow icon={Mail} label="Student Email" value={student.email ?? "—"} />
                <InfoRow icon={Phone} label="Phone" value={student.phone ?? "—"} />
                <InfoRow icon={Users} label="Guardian Name" value={student.parent?.name ?? "—"} />
                <InfoRow icon={Phone} label="Guardian Phone" value={student.parent?.phone ?? "—"} />
                <InfoRow icon={Mail} label="Guardian Email" value={student.guardianEmail ?? "—"} />
              </div>

              {/* Academic Info */}
              <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-white/10 shadow-lg p-5 md:col-span-2">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-500" /> Academic Information
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Class", value: student.class?.name ?? "—" },
                    { label: "Section", value: student.section?.name ?? "—" },
                    { label: "Roll No.", value: student.rollNumber?.toString() ?? "—" },
                    { label: "Exam Results", value: `${results.length} exam(s)` },
                  ].map((item) => (
                    <div key={item.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{item.label}</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-white mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Attendance ── */}
          {activeTab === "attendance" && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-5"
            >
              {!attendance ? (
                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-white/10 shadow-lg p-16 text-center">
                  <ClipboardList className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No attendance data available.</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatBadge label="Total Days" value={attendance.total} color="bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200" />
                    <StatBadge label="Present" value={attendance.present} color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" />
                    <StatBadge label="Absent" value={attendance.absent} color="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400" />
                    <StatBadge label="Late" value={attendance.late} color="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" />
                  </div>

                  {/* Progress bar */}
                  <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-white/10 shadow-lg p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-white">Attendance Rate</h3>
                      <span className={`text-lg font-bold ${attColor}`}>{attPct}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${attPct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${attPct >= 75 ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-red-400 to-orange-500"}`}
                      />
                    </div>
                    {attPct < 75 && (
                      <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Attendance below 75% — parent has been notified.
                      </p>
                    )}
                  </div>

                  {/* Recent records */}
                  {attendance.records.length > 0 && (
                    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-white/10 shadow-lg overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-white">Recent Records</h3>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                        {attendance.records.slice(0, 20).map((rec) => (
                          <div key={rec.id} className="flex items-center justify-between px-5 py-3">
                            <span className="text-sm text-slate-600 dark:text-slate-300">{fmt(rec.date)}</span>
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                              rec.status === "PRESENT"
                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                : rec.status === "ABSENT"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                            }`}>
                              {rec.status === "PRESENT" && <CheckCircle2 className="w-3 h-3" />}
                              {rec.status === "ABSENT" && <XCircle className="w-3 h-3" />}
                              {rec.status === "LATE" && <Clock className="w-3 h-3" />}
                              {rec.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ── Results ── */}
          {activeTab === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              {results.length === 0 ? (
                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-white/10 shadow-lg p-16 text-center">
                  <BarChart3 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No published results yet.</p>
                </div>
              ) : (
                results.map((result) => (
                  <div
                    key={result.id}
                    className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-white/10 shadow-lg overflow-hidden"
                  >
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-violet-500" />
                        <h3 className="text-sm font-bold text-slate-700 dark:text-white">
                          {result.exam?.name ?? "Exam"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        {result.gpa !== undefined && result.gpa !== null && (
                          <span className="text-xs font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2.5 py-0.5 rounded-full">
                            GPA: {typeof result.gpa === "number" ? result.gpa.toFixed(2) : result.gpa}
                          </span>
                        )}
                        {result.status && (
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            result.status === "PUBLISHED"
                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          }`}>
                            {result.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {result.marks && result.marks.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                              <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Subject</th>
                              <th className="px-5 py-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">Marks</th>
                              <th className="px-5 py-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">Grade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {result.marks.map((mark, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                <td className="px-5 py-2.5 text-slate-700 dark:text-slate-200 font-medium">{mark.subject?.name ?? "—"}</td>
                                <td className="px-5 py-2.5 text-center font-bold text-slate-700 dark:text-white">{mark.marksObtained}</td>
                                <td className="px-5 py-2.5 text-center">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    mark.grade === "F"
                                      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                      : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                                  }`}>
                                    {mark.grade ?? "—"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
