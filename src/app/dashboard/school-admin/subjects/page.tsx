"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import { subjectService } from "@/app/modules/subject/subject.service";
import { classService } from "@/app/modules/class/class.service";
import { motion } from "framer-motion";
import {
  BookOpen,
  Search,
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  UserCircle2,
  Hash,
  Target,
  CheckCircle2,
  CircleOff,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Subject = {
  id: string;
  name: string;
  code: string;
  classId: string;
  fullMarks: number;
  passMarks: number;
  isCompulsory: boolean;
  class?: { id: string; name: string };
  teacher?: { id: string; name: string };
  createdAt: string;
};

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

// ─── Modal ────────────────────────────────────────────────────────────────────

function SubjectModal({
  open,
  onClose,
  subject,
  classes,
}: {
  open: boolean;
  onClose: () => void;
  subject: Subject | null;
  classes: { id: string; name: string }[];
}) {
  const [name, setName] = useState(subject?.name ?? "");
  const [code, setCode] = useState(subject?.code ?? "");
  const [classId, setClassId] = useState(subject?.classId ?? "");
  const [fullMarks, setFullMarks] = useState(subject?.fullMarks ?? 100);
  const [passMarks, setPassMarks] = useState(subject?.passMarks ?? 33);
  const [isCompulsory, setIsCompulsory] = useState(subject?.isCompulsory ?? true);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setName(subject?.name ?? "");
      setCode(subject?.code ?? "");
      setClassId(subject?.classId ?? "");
      setFullMarks(subject?.fullMarks ?? 100);
      setPassMarks(subject?.passMarks ?? 33);
      setIsCompulsory(subject?.isCompulsory ?? true);
      setSubmitting(false);
    }
  }, [open, subject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !classId) return;
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        classId,
        fullMarks,
        passMarks,
        isCompulsory,
      };
      if (subject) {
        await subjectService.update(subject.id, payload);
        toast.success("Subject updated successfully");
      } else {
        await subjectService.create(payload);
        toast.success("Subject created successfully");
      }
      await queryClient.invalidateQueries({ queryKey: ["subjects"] });
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
           ?.message ?? (err instanceof Error ? err.message : "Something went wrong");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/60 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-semibold text-base">{subject ? "Edit Subject" : "Add New Subject"}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Subject Name</label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mathematics"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Subject Code</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. MATH"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Class</label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Full Marks</label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  min={1}
                  value={fullMarks}
                  onChange={(e) => setFullMarks(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Pass Marks</label>
              <div className="relative">
                <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  min={0}
                  value={passMarks}
                  onChange={(e) => setPassMarks(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/40 border border-border/60 cursor-pointer hover:bg-secondary/60 transition-colors">
            <input
              type="checkbox"
              checked={isCompulsory}
              onChange={(e) => setIsCompulsory(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/40"
            />
            <span className="text-sm text-foreground">
              Compulsory subject <span className="text-muted-foreground font-normal">(uncheck to mark optional)</span>
            </span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim() || !code.trim() || !classId}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {subject ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SchoolAdminSubjectsPage() {
  const router = useRouter();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (role && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const canManage = role ? hasPermission(role, "manage_classes") : false;

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // ── Fetch classes ──────────────────────────────────────────────────────────
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: classService.getAll,
  });

  // ── Fetch subjects ─────────────────────────────────────────────────────────
  const { data: subjects = [], isLoading, refetch } = useQuery({
    queryKey: ["subjects", classFilter],
    queryFn: async () => {
      return await subjectService.getAll(classFilter ? { classId: classFilter } : undefined);
    },
    enabled: canManage,
  });

  const subjectList = Array.isArray(subjects) ? subjects : [];

  // ── Mutations ──────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => subjectService.delete(id),
    onSuccess: async () => {
      toast.success("Subject deleted successfully");
      await queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
           ?.message ?? (err instanceof Error ? err.message : "Failed to delete subject");
      toast.error(msg);
    },
  });

  // ── useMemo: derived values ────────────────────────────────────────────────
  const filterKey = search.toLowerCase().replace(/[^a-z0-9]/g, "");

  const filtered = useMemo(() => {
    if (!filterKey) return subjectList;
    return subjectList.filter((s) => {
      const hay = `${s.name} ${s.code} ${s.class?.name ?? ""}`.toLowerCase().replace(/[^a-z0-9]/g, "");
      return hay.includes(filterKey);
    });
  }, [subjectList, filterKey]);

  const totalSubjects = subjectList.length;
  const totalCompulsory = useMemo(
    () => subjectList.filter((s) => s.isCompulsory).length,
    [subjectList]
  );
  const totalOptional = useMemo(
    () => subjectList.filter((s) => !s.isCompulsory).length,
    [subjectList]
  );

  const handleEdit = (subj: Subject) => {
    setSelectedSubject(subj);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedSubject(null);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this subject?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSubject(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!canManage) {
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
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create and manage subjects per class, assign teachers, and set marks.
          </p>
        </div>
        {canManage && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        )}
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
            label: "Total Subjects",
            value: totalSubjects,
            color: "text-foreground",
            bg: "bg-secondary/60",
            icon: BookOpen,
          },
          {
            label: "Compulsory",
            value: totalCompulsory,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
            icon: CheckCircle2,
          },
          {
            label: "Optional",
            value: totalOptional,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-950/30",
            icon: CircleOff,
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
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, code or class…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors"
        >
          <BookOpen className="w-4 h-4" /> Refresh
        </button>
      </motion.div>

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
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Subject
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Code
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">
                  Class
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">
                  Teacher
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Full / Pass
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Type
                </th>
                {canManage && <th className="px-5 py-3.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><Skel className="w-24 h-4" /></td>
                    <td className="px-5 py-4"><Skel className="w-12 h-4" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><Skel className="w-20 h-4" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><Skel className="w-28 h-4" /></td>
                    <td className="px-5 py-4"><Skel className="w-16 h-4" /></td>
                    <td className="px-5 py-4"><Skel className="w-16 h-5 rounded-full" /></td>
                    {canManage && <td className="px-5 py-4"><Skel className="w-20 h-8 rounded" /></td>}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-5 py-16 text-center">
                    <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No subjects found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((subj) => (
                  <tr key={subj.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {subj.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{subj.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-muted-foreground text-xs font-mono font-semibold">
                        {subj.code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                      {subj.class?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell">
                      {subj.teacher?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {subj.fullMarks} / {subj.passMarks}
                    </td>
                    <td className="px-5 py-3.5">
                      {subj.isCompulsory ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Compulsory
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          <CircleOff className="w-3 h-3" /> Optional
                        </span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(subj)}
                            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
                            title="Edit subject"
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDelete(subj.id)}
                            disabled={deleteMutation.isPending}
                            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors disabled:opacity-50"
                            title="Delete subject"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal */}
      {canManage && (
        <SubjectModal
          open={showModal}
          onClose={handleCloseModal}
          subject={selectedSubject}
          classes={classes}
        />
      )}
    </div>
  );
}
