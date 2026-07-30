"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import { classService } from "@/app/modules/class/class.service";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Search,
  Plus,
  Pencil,
  Trash2,
  Layers,
  Users,
  X,
  Loader2,
  BookOpen,
  Hash,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = {
  id: string;
  name: string;
  maxCapacity: number;
  classTeacher?: { id: string; name?: string };
};

type Class = {
  id: string;
  name: string;
  numericLevel: number;
  sections?: Section[];
  studentCount?: number;
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

function ClassModal({
  open,
  onClose,
  cls,
}: {
  open: boolean;
  onClose: () => void;
  cls: Class | null;
}) {
  const [name, setName] = useState(cls?.name ?? "");
  const [numericLevel, setNumericLevel] = useState(cls?.numericLevel ?? 1);
  const [sectionName, setSectionName] = useState("");
  const [maxCapacity, setMaxCapacity] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setName(cls?.name ?? "");
      setNumericLevel(cls?.numericLevel ?? 1);
      setSectionName("");
      setMaxCapacity("");
      setSubmitting(false);
    }
  }, [open, cls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !numericLevel) return;
    setSubmitting(true);
    try {
      if (cls) {
        await classService.update(cls.id, {
          name: name.trim(),
          numericLevel,
        });
        toast.success("Class updated successfully");
      } else {
        const created = await classService.create({
          name: name.trim(),
          numericLevel,
        });
        if (sectionName.trim() && maxCapacity) {
          await classService.createSection({
            classId: created.id,
            name: sectionName.trim(),
            maxCapacity: Number(maxCapacity),
          });
        }
        toast.success("Class created successfully");
      }
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
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
          <h2 className="font-semibold text-base">{cls ? "Edit Class" : "Add New Class"}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Class Name</label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Class 1"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Numeric Level (1-10)</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                min={1}
                max={10}
                value={numericLevel}
                onChange={(e) => setNumericLevel(Number(e.target.value))}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {!cls && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Section Name (Optional)</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    placeholder="e.g. A"
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Capacity</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    min={1}
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value ? Number(e.target.value) : "")}
                    placeholder="e.g. 40"
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          )}

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
              disabled={submitting || !name.trim() || !numericLevel}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {cls ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SchoolAdminClassesPage() {
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
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // ── Fetch classes ──────────────────────────────────────────────────────────
  const { data: classes = [], isLoading, refetch } = useQuery({
    queryKey: ["classes"],
    queryFn: classService.getAll,
    enabled: canManage,
  });

  const classList = Array.isArray(classes) ? classes : [];

  // ── Mutations ──────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => classService.delete(id),
    onSuccess: async () => {
      toast.success("Class deleted successfully");
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      await queryClient.refetchQueries({ queryKey: ["classes"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
           ?.message ?? (err instanceof Error ? err.message : "Failed to delete class");
      toast.error(msg);
    },
  });

  // ── useMemo: derived values ────────────────────────────────────────────────
  const filterKey = search.toLowerCase().replace(/[^a-z0-9]/g, "");

  const filtered = useMemo(() => {
    if (!filterKey) return classList;
    return classList.filter((c) => {
      const hay = `${c.name} ${c.numericLevel}`.toLowerCase().replace(/[^a-z0-9]/g, "");
      return hay.includes(filterKey);
    });
  }, [classList, filterKey]);

  const totalStudents = useMemo(
    () =>
      classList.reduce(
        (sum, c) => sum + (c.studentCount ?? 0),
        0
      ),
    [classList]
  );

  const totalSections = useMemo(
    () => classList.reduce((sum, c) => sum + (c.sections?.length ?? 0), 0),
    [classList]
  );

  const handleEdit = (cls: Class) => {
    setSelectedClass(cls);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedClass(null);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this class?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedClass(null);
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
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Classes &amp; Sections</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage classes 1–10 and their sections with capacity limits.
          </p>
        </div>
        {canManage && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Class
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
            label: "Total Classes",
            value: classList.length,
            color: "text-foreground",
            bg: "bg-secondary/60",
            icon: GraduationCap,
          },
          {
            label: "Total Sections",
            value: totalSections,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/30",
            icon: Layers,
          },
          {
            label: "Total Students",
            value: totalStudents,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
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

      {/* Search */}
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
            placeholder="Search classes by name or level…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors"
        >
          <GraduationCap className="w-4 h-4" /> Refresh
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
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Class</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Level</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Sections</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Capacity</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Students</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Created</th>
                {canManage && (
                  <th className="px-5 py-3.5" />
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><Skel className="w-24 h-4" /></td>
                    <td className="px-5 py-4"><Skel className="w-10 h-4" /></td>
                    <td className="px-5 py-4"><Skel className="w-32 h-4" /></td>
                    <td className="px-5 py-4"><Skel className="w-16 h-4" /></td>
                    <td className="px-5 py-4"><Skel className="w-16 h-4" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><Skel className="w-24 h-4" /></td>
                    {canManage && <td className="px-5 py-4"><Skel className="w-20 h-8 rounded" /></td>}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-5 py-16 text-center">
                    <GraduationCap className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No classes found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((cls) => {
                  const totalCapacity = (cls.sections ?? []).reduce((sum, s) => sum + (s.maxCapacity ?? 0), 0);
                  return (
                    <tr key={cls.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                            {cls.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{cls.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{cls.numericLevel}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {(cls.sections ?? []).length > 0 ? (
                            (cls.sections ?? []).map((s) => (
                              <span
                                key={s.id}
                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-medium"
                              >
                                {s.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{totalCapacity || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                          <Users className="h-3 w-3" />
                          {cls.studentCount ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                        {fmt(cls.createdAt)}
                      </td>
                      {canManage && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(cls)}
                              className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
                              title="Edit class"
                            >
                              <Pencil className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDelete(cls.id)}
                              disabled={deleteMutation.isPending}
                              className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors disabled:opacity-50"
                              title="Delete class"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal */}
      {canManage && (
        <ClassModal
          open={showModal}
          onClose={handleCloseModal}
          cls={selectedClass}
        />
      )}
    </div>
  );
}
