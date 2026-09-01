"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Eye,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Droplets,
  Users,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  BadgeInfo,
  UserCog,
  TrendingUp,
} from "lucide-react";

// ─── Types 

type Student = {
  id: string;
  studentId: string;
  name: string;
  rollNumber: number;
  gender: string;
  dob: string;
  bloodGroup?: string;
  address?: string;
  photo?: string;
  isActive: boolean;
  createdAt: string;
  email?: string;
  phone?: string;
  guardianEmail?: string;
  class?: { id: string; name: string };
  section?: { id: string; name: string };
  parent?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
};

type Meta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// ─── Helpers 

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Skel({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block rounded bg-muted/60 animate-pulse ${className}`}
    />
  );
}

function Avatar({
  photo,
  name,
  size = "md",
}: {
  photo?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-16 h-16 text-xl" : "w-10 h-10 text-sm";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (photo)
    return (
      <img
        src={photo}
        alt={name}
        className={`${dim} rounded-full object-cover border border-border shrink-0`}
      />
    );
  return (
    <div
      className={`${dim} rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary shrink-0`}
    >
      {initials}
    </div>
  );
}

// ─── Detail Modal 
function DetailModal({
  student,
  onClose,
  onDeactivate,
  onReactivate,
  actionLoading,
}: {
  student: Student;
  onClose: () => void;
  onDeactivate: (id: string) => Promise<void>;
  onReactivate: (id: string) => Promise<void>;
  actionLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border-b border-white/40 dark:border-white/5 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Avatar photo={student.photo} name={student.name} size="md" />
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-white">{student.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ID: {student.studentId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                student.isActive
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              }`}
            >
              {student.isActive ? "Active" : "Inactive"}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Academic info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: GraduationCap,
                label: "Class",
                value: student.class?.name ?? "—",
              },
              {
                icon: BadgeInfo,
                label: "Roll No.",
                value: student.rollNumber,
              },
              {
                icon: Users,
                label: "Section",
                value: student.section?.name ?? "—",
              },
              {
                icon: Calendar,
                label: "Date of Birth",
                value: student.dob ? fmt(student.dob) : "—",
              },
              {
                icon: UserCog,
                label: "Gender",
                value:
                  student.gender.charAt(0) +
                  student.gender.slice(1).toLowerCase(),
              },
              {
                icon: Droplets,
                label: "Blood Group",
                value: student.bloodGroup?.replace("_", "") ?? "—",
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Contact
            </p>
            {[
              { icon: Mail, value: student.email ?? "—" },
              { icon: Phone, value: student.phone ?? "—" },
              { icon: MapPin, value: student.address ?? "—" },
            ].map(({ icon: Icon, value }) => (
              <div key={value} className="flex items-start gap-2.5 text-sm">
                <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">{value}</span>
              </div>
            ))}
          </div>

          {/* Guardian */}
          {(student.parent?.name ||
            student.guardianEmail ||
            student.parent?.phone) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Guardian
              </p>
              <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none p-3 space-y-1.5 text-sm">
                {student.parent?.name && (
                  <p>
                    <span className="text-slate-500 dark:text-slate-400 text-xs">
                      Name:{" "}
                    </span>
                    <span className="font-medium text-slate-800 dark:text-white">{student.parent.name}</span>
                    {student.parent.relation && (
                      <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                        ({student.parent.relation})
                      </span>
                    )}
                  </p>
                )}
                {student.parent?.phone && (
                  <p>
                    <span className="text-slate-500 dark:text-slate-400 text-xs">
                      Phone:{" "}
                    </span>
                    <span className="font-medium text-slate-800 dark:text-white">{student.parent.phone}</span>
                  </p>
                )}
                {student.guardianEmail && student.guardianEmail !== "—" && (
                  <p>
                    <span className="text-slate-500 dark:text-slate-400 text-xs">
                      Email:{" "}
                    </span>
                    <span className="font-medium text-slate-800 dark:text-white">{student.guardianEmail}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enrolled: {fmt(student.createdAt)}
          </p>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border-t border-white/40 dark:border-white/5 px-6 py-4">
          {student.isActive ? (
            <button
              onClick={() => onDeactivate(student.id)}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserX className="w-4 h-4" />
              )}
              Deactivate Student
            </button>
          ) : (
            <button
              onClick={() => onReactivate(student.id)}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              Reactivate Student
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const LIMIT = 12;

export default function SchoolAdminStudentsPage() {
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    if (role && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    page: 1,
    limit: LIMIT,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch class list once for filter dropdown
  useEffect(() => {
    api
      .get("/classes")
      .then((r) => {
        const list = r.data?.data ?? r.data ?? [];
        setClasses(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, []);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: String(page),
        limit: String(LIMIT),
      };
      if (search) params.search = search;
      if (classFilter) params.classId = classFilter;
      if (genderFilter) params.gender = genderFilter;

      const res = await api.get("/students", { params });
      const payload = res.data?.data ?? res.data ?? {};
      const list = payload.data ?? payload;
      const metaData = payload.meta ?? {
        total: list.length,
        page,
        limit: LIMIT,
        totalPages: Math.ceil((list.length || 1) / LIMIT),
      };
      setStudents(Array.isArray(list) ? list : []);
      setMeta(metaData);
    } catch {
      /* keep empty */
    } finally {
      setLoading(false);
    }
  }, [page, search, classFilter, genderFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    setPage(1);
  }, [search, classFilter, genderFilter, activeFilter]);

  // ── Filter by active client-side (backend doesn't expose isActive filter)
  const displayed =
    activeFilter === ""
      ? students
      : students.filter((s) => String(s.isActive) === activeFilter);

  const active = students.filter((s) => s.isActive).length;
  const inactive = students.filter((s) => !s.isActive).length;

  // ── Actions 

  const handleDeactivate = async (id: string) => {
    try {
      setActionLoading(true);
      await api.patch(`/students/${id}/deactivate`);
      showToast("Student deactivated");
      setSelected(null);
      fetchStudents();
    } catch {
      showToast("Failed to deactivate", false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      setActionLoading(true);
      await api.patch(`/students/${id}/reactivate`);
      showToast("Student reactivated ✓");
      setSelected(null);
      fetchStudents();
    } catch {
      showToast("Failed to reactivate", false);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render 

  return (
    <div className="relative min-h-screen flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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

      <div className="relative w-full max-w-6xl my-8 space-y-6">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-5 right-5 z-[60] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${
                toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
              }`}
            >
              {toast.ok ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden"
        >
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
                  Students
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  View, search, and manage all enrolled students.
                </p>
              </div>
              <button
                onClick={fetchStudents}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stat strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            {
              label: "Total Students",
              value: meta.total,
              color: "text-slate-800 dark:text-white",
              bg: "bg-secondary/60",
              icon: GraduationCap,
            },
            {
              label: "Active",
              value: active,
              color: "text-emerald-600 dark:text-emerald-400",
              bg: "bg-emerald-50 dark:bg-emerald-950/30",
              icon: UserCheck,
            },
            {
              label: "Inactive",
              value: inactive,
              color: "text-red-600 dark:text-red-400",
              bg: "bg-red-50 dark:bg-red-950/30",
              icon: UserX,
            },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
              </div>
              <p className={`text-2xl font-bold ${color}`}>
                {loading ? <Skel className="w-10 h-7 inline-block" /> : value}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or roll number…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-white/40 dark:border-white/10 rounded-xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Class filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="text-sm border border-white/40 dark:border-white/10 rounded-xl px-3 py-2.5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 dark:text-white"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender filter */}
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="text-sm border border-white/40 dark:border-white/10 rounded-xl px-3 py-2.5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 dark:text-white"
            >
              <option value="">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>

            {/* Active filter */}
            <div className="flex gap-2">
              {(
                [
                  { label: "All", val: "" },
                  { label: "Active", val: "true" },
                  { label: "Inactive", val: "false" },
                ] as const
              ).map(({ label, val }) => (
                <button
                  key={label}
                  onClick={() => setActiveFilter(val)}
                  className={`text-xs px-3 py-2.5 rounded-xl font-medium transition-colors ${
                    activeFilter === val
                      ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30"
                      : "bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/30 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Student cards grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none p-5 animate-pulse"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Skel className="w-10 h-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skel className="w-24 h-4 block" />
                      <Skel className="w-16 h-3 block" />
                    </div>
                  </div>
                  <Skel className="w-full h-3 block mb-2" />
                  <Skel className="w-3/4 h-3 block" />
                </div>
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-20 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none">
              <GraduationCap className="w-12 h-12 text-slate-400/50 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No students found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayed.map((student, i) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                  className={`bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none p-5 transition-shadow cursor-pointer group ${
                    student.isActive
                      ? ""
                      : "border-red-200/60 dark:border-red-800/30 opacity-70"
                  }`}
                  onClick={() => setSelected(student)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar photo={student.photo} name={student.name} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate text-slate-800 dark:text-white group-hover:text-primary transition-colors">
                        {student.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Roll #{student.rollNumber}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 w-2 h-2 rounded-full ${
                        student.isActive ? "bg-emerald-500" : "bg-red-400"
                      }`}
                      title={student.isActive ? "Active" : "Inactive"}
                    />
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {student.class?.name ?? "—"}
                        {student.section?.name ? ` · ${student.section.name}` : ""}
                      </span>
                    </div>
                    {student.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </div>
                    )}
                    {student.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{student.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/40 dark:border-white/10 flex items-center justify-between">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        student.gender === "MALE"
                          ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                          : student.gender === "FEMALE"
                          ? "bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400"
                          : "bg-white/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {student.gender.charAt(0) + student.gender.slice(1).toLowerCase()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(student);
                      }}
                      className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {!loading && meta.totalPages > 1 && (
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none p-4 flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400 text-xs">
              Showing page {meta.page} of {meta.totalPages} &nbsp;·&nbsp; {meta.total} students total
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-white/30 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              {/* Page number pills */}
              {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                const p =
                  meta.totalPages <= 5
                    ? i + 1
                    : Math.max(1, Math.min(page - 2, meta.totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      p === page
                        ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30"
                        : "border border-white/30 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="w-8 h-8 rounded-lg border border-white/30 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </div>
        )}

        {/* Detail modal */}
        <AnimatePresence>
          {selected && (
            <DetailModal
              student={selected}
              onClose={() => setSelected(null)}
              onDeactivate={handleDeactivate}
              onReactivate={handleReactivate}
              actionLoading={actionLoading}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
