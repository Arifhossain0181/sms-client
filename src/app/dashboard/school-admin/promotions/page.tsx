"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import api from "@/lib/axios";
import { classService } from "@/app/modules/class/class.service";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  RefreshCw,
  Users,
  ArrowUpRight,
} from "lucide-react";

// ─── Types 

type Student = {
  id: string;
  name: string;
  email?: string;
  phone?: string | null;
  gender?: "Male" | "Female" | "Other";
  dateOfBirth: string;
  rollNumber?: string;
  sectionId?: string;
  section?: { id: string; name: string };
  classId: string;
  class?: { id: string; name: string };
  createdAt: string;
  isActive?: boolean;
};

type ClassType = {
  id: string;
  name: string;
  numericLevel: number;
  sections?: { id: string; name: string; maxCapacity: number }[];
};

type Toast = { msg: string; ok: boolean } | null;

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

// ─── Main Page 

const LIMIT = 12;

export default function SchoolAdminPromotionsPage() {
  const router = useRouter();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  // ── Role guard 
  useEffect(() => {
    if (role && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const canPromote = role ? hasPermission(role, "promote_students") : false;

  // ── State 
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetClassId, setTargetClassId] = useState("");
  const [targetSectionId, setTargetSectionId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch classes 
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: classService.getAll,
  });

  // ── Fetch students 
  const { data: students = [], isLoading, refetch } = useQuery({
    queryKey: ["students", "promotions", page, search, classFilter],
    queryFn: async () => {
      const payload: Record<string, string | number> = {
        page,
        limit: LIMIT,
      };
      if (search) payload.search = search;
      if (classFilter) payload.classId = classFilter;
      const res = await api.get("/students", { params: payload });
      const d = res.data?.data ?? res.data ?? {};
      return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
    },
    enabled: canPromote,
  });

  // Compute meta if available from response (we'll derive it from students list)
  const totalPages = useMemo(() => Math.max(1, Math.ceil((students as Student[]).length / LIMIT)), [students]);

  // ── useMemo: derived values 
  const classMap = useMemo(() => {
    const m = new Map<string, ClassType>();
    classes.forEach((c) => m.set(c.id, c));
    return m;
  }, [classes]);

  const targetSections = useMemo(() => {
    if (!targetClassId) return [];
    const cls = classMap.get(targetClassId);
    return cls?.sections ?? [];
  }, [targetClassId, classMap]);

  const selectedCount = selectedIds.size;
  const selectedStudents = useMemo(
    () => (students as Student[]).filter((s) => selectedIds.has(s.id)),
    [students, selectedIds]
  );

  // ── Toggle select 
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const pageIds = new Set((students as Student[]).map((s) => s.id));
    setSelectedIds((prev) => {
      if (pageIds.size > 0 && [...pageIds].every((id) => prev.has(id))) {
        return new Set();
      }
      return new Set([...prev, ...pageIds]);
    });
  };

  // ── Promote mutation 
  const promoteMutation = useMutation({
    mutationFn: async (payload: { studentIds: string[]; targetClassId: string; targetSectionId: string }) => {
      const res = await api.post("/students/promote", payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      showToast(`Successfully promoted ${selectedCount} students`);
      setSelectedIds(new Set());
      setTargetClassId("");
      setTargetSectionId("");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: () => {
      showToast("Promotion failed. Please try again.", false);
    },
    onSettled: () => setActionLoading(false),
  });

  const handlePromote = () => {
    if (!targetClassId || !targetSectionId || selectedCount === 0) return;
    setActionLoading(true);
    promoteMutation.mutate({
      studentIds: Array.from(selectedIds),
      targetClassId,
      targetSectionId,
    });
  };

  // ── Render 
  if (!canPromote) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Promotions</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Select students and promote them to the next class &amp; section.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </motion.div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          {
            label: "Total Students",
            value: (students as Student[]).length,
            color: "text-foreground",
            bg: "bg-secondary/60",
            icon: GraduationCap,
          },
          {
            label: "Selected",
            value: selectedCount,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/30",
            icon: ArrowUpRight,
          },
          {
            label: "Available Classes",
            value: classes.length,
            color: "text-violet-600 dark:text-violet-400",
            bg: "bg-violet-50 dark:bg-violet-950/30",
            icon: Users,
          },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>
              {isLoading ? <Skel className="w-10 h-7 inline-block" /> : value}
            </p>
          </div>
        ))}
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
            placeholder="Search by name, email, roll no…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Class filter */}
        <select
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Students selection area */}
      <div className="space-y-4">
        {/* Selection actions bar */}
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/30 p-4 flex flex-wrap items-center gap-3"
          >
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              <span className="font-bold">{selectedCount}</span> student{selectedCount !== 1 ? "s" : ""} selected
            </p>
            <div className="flex items-center gap-2 ml-auto">
              {/* Target class */}
              <select
                value={targetClassId}
                onChange={(e) => {
                  setTargetClassId(e.target.value);
                  setTargetSectionId("");
                }}
                className="text-sm border border-blue-300 dark:border-blue-700 rounded-xl px-3 py-2 bg-white dark:bg-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Target Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Target section */}
              <select
                value={targetSectionId}
                onChange={(e) => setTargetSectionId(e.target.value)}
                disabled={!targetClassId || targetSections.length === 0}
                className="text-sm border border-blue-300 dark:border-blue-700 rounded-xl px-3 py-2 bg-white dark:bg-blue-900/40 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Target Section</option>
                {targetSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handlePromote}
                disabled={!targetClassId || !targetSectionId || actionLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                Promote
              </button>

              <button
                onClick={() => setSelectedIds(new Set())}
                className="w-8 h-8 rounded-lg border border-blue-300 dark:border-blue-700 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                title="Clear selection"
              >
                <X className="w-4 h-4 text-blue-700 dark:text-blue-300" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-border/60 bg-card/80 shadow-soft overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/40">
                  <th className="text-left px-5 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={
                        (students as Student[]).length > 0 &&
                        (students as Student[]).every((s) => selectedIds.has(s.id))
                      }
                      onChange={selectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Class
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Section
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">
                    Roll No
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-4"><Skel className="w-4 h-4 rounded" /></td>
                      <td className="px-5 py-4"><Skel className="w-24 h-4" /></td>
                      <td className="px-5 py-4"><Skel className="w-16 h-4" /></td>
                      <td className="px-5 py-4 hidden md:table-cell"><Skel className="w-16 h-4" /></td>
                      <td className="px-5 py-4 hidden lg:table-cell"><Skel className="w-12 h-4" /></td>
                      <td className="px-5 py-4"><Skel className="w-16 h-5 rounded-full" /></td>
                    </tr>
                  ))
                ) : (students as Student[]).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <GraduationCap className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No students found.</p>
                    </td>
                  </tr>
                ) : (
                  (students as Student[]).map((student) => (
                    <tr
                      key={student.id}
                      className={`hover:bg-secondary/20 transition-colors ${
                        selectedIds.has(student.id) ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(student.id)}
                          onChange={() => toggleSelect(student.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {student.name
                              .split(" ")
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium">
                        {student.class?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {student.section?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell">
                        {student.rollNumber ?? "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            student.isActive !== false
                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          }`}
                        >
                          {student.isActive !== false ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          {student.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && (students as Student[]).length > 0 && (
            <div className="px-5 py-4 border-t border-border/60 flex items-center justify-between text-sm">
              <span className="text-muted-foreground text-xs">
                Page {page} of {Math.max(1, Math.ceil(students.length / LIMIT))}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(students.length / LIMIT)), p + 1))}
                  disabled={page >= Math.max(1, Math.ceil(students.length / LIMIT))}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
