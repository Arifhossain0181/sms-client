"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  RefreshCw,
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

type AssignedClass = {
  id: string;
  name: string;
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
    <span className={`inline-block rounded bg-muted/60 animate-pulse ${className}`} />
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
    size === "sm"
      ? "w-8 h-8 text-xs"
      : size === "lg"
      ? "w-16 h-16 text-xl"
      : "w-10 h-10 text-sm";
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
}: {
  student: Student;
  onClose: () => void;
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
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/60 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Avatar photo={student.photo} name={student.name} size="md" />
            <div>
              <h2 className="font-semibold">{student.name}</h2>
              <p className="text-xs text-muted-foreground">
                ID: {student.studentId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
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
                icon: Users,
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
                icon: Users,
                label: "Gender",
                value:
                  student.gender.charAt(0) +
                  student.gender.slice(1).toLowerCase(),
              },
              {
                icon: Users,
                label: "Blood Group",
                value: student.bloodGroup?.replace("_", "") ?? "—",
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-secondary/40 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <p className="text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contact
            </p>
            {[
              { icon: Mail, value: student.email ?? "—" },
              { icon: Phone, value: student.phone ?? "—" },
              { icon: MapPin, value: student.address ?? "—" },
            ].map(({ icon: Icon, value }) => (
              <div key={value} className="flex items-start gap-2.5 text-sm">
                <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>

          {/* Guardian */}
          {(student.parent?.name ||
            student.guardianEmail ||
            student.parent?.phone) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Guardian
              </p>
              <div className="bg-secondary/40 rounded-xl p-3 space-y-1.5 text-sm">
                {student.parent?.name && (
                  <p>
                    <span className="text-muted-foreground text-xs">
                      Name:{" "}
                    </span>
                    <span className="font-medium">{student.parent.name}</span>
                    {student.parent.relation && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({student.parent.relation})
                      </span>
                    )}
                  </p>
                )}
                {student.parent?.phone && (
                  <p>
                    <span className="text-muted-foreground text-xs">
                      Phone:{" "}
                    </span>
                    <span className="font-medium">{student.parent.phone}</span>
                  </p>
                )}
                {student.guardianEmail && student.guardianEmail !== "—" && (
                  <p>
                    <span className="text-muted-foreground text-xs">
                      Email:{" "}
                    </span>
                    <span className="font-medium">{student.guardianEmail}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Enrolled: {fmt(student.createdAt)}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page

const LIMIT = 12;

export default function TeacherStudentsPage() {
  useLenis();
  const router = useRouter();
  const { role, user } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    page: 1,
    limit: LIMIT,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Student | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [page, setPage] = useState(1);
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: String(page),
        limit: String(LIMIT),
      };
      if (search) params.search = search;
      if (classFilter) params.classId = classFilter;

      const res = await api.get(`/teachers/${user.id}/students`, { params });
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
  }, [page, search, classFilter, user?.id]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    if (role && role !== "TEACHER") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  // Fetch teacher's assigned classes
  useEffect(() => {
    if (!user?.id) return;
    const loadClasses = async () => {
      try {
        const res = await api.get("/teachers/me");
        const payload = res.data?.data ?? res.data;
        const classes =
          (payload?.sectionTeacher as Array<{ class: AssignedClass }> | undefined)
            ?.map((st) => st.class)
            .filter(Boolean) ?? [];
        setAssignedClasses(classes);
      } catch {
        /* ignore */
      }
    };
    loadClasses();
  }, [user?.id]);

  // Filters

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setClassFilter(e.target.value);
    setPage(1);
  };

  // ── Render

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            My Students
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Students in your assigned classes.
          </p>
        </div>
        <button
          onClick={fetchStudents}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 flex-wrap"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or roll number…"
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Class filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={classFilter}
            onChange={handleClassChange}
            className="text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Classes</option>
            {assignedClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
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
                className="rounded-2xl border border-border/60 bg-card/80 p-5 animate-pulse"
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
        ) : students.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-border/60 bg-card/80">
            <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No students found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {students.map((student, i) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                className={`rounded-2xl border bg-card/80 p-5 shadow-soft hover:shadow-elegant transition-shadow cursor-pointer group ${
                  student.isActive
                    ? "border-border/60"
                    : "border-red-200 dark:border-red-800/30 opacity-70"
                }`}
                onClick={() => setSelected(student)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar photo={student.photo} name={student.name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {student.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
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
                <div className="space-y-1.5 text-xs text-muted-foreground">
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
                <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      student.gender === "MALE"
                        ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                        : student.gender === "FEMALE"
                        ? "bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400"
                        : "bg-secondary text-muted-foreground"
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
        <div className="flex items-center justify-between text-sm pt-2">
          <span className="text-muted-foreground text-xs">
            Showing page {meta.page} of {meta.totalPages} &nbsp;·&nbsp;{" "}
            {meta.total} students total
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
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
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-secondary"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}
