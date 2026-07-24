"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLenis } from "@/hooks/useLenis";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { classService } from "@/app/modules/class/class.service";
import { gradingService } from "@/app/modules/grading/grading.service";
import type { GradingRule } from "@/app/modules/grading/grading.types";
import {
  ClipboardList,
  Plus,
  Trash2,
  Pencil,
  Check,
  GraduationCap,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type RuleForm = {
  classId: string;
  academicYear: string;
  minMark: number;
  maxMark: number;
  grade: string;
  gpaPoint: number;
  isPassing: boolean;
};

const emptyRule: RuleForm = {
  classId: "",
  academicYear: "",
  minMark: 0,
  maxMark: 100,
  grade: "",
  gpaPoint: 0,
  isPassing: true,
};

export default function GradingRulesPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const [selectedClassId, setSelectedClassId] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleForm>(emptyRule);
  const [bulkText, setBulkText] = useState("");

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: classService.getAll,
  });

  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ["grading-rules", selectedClassId],
    queryFn: () => gradingService.list(selectedClassId, form.academicYear || undefined),
    enabled: !!selectedClassId,
  });

  const sorted = useMemo(() => {
    return [...rules].sort((a, b) => a.minMark - b.minMark);
  }, [rules]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (r) =>
        r.grade.toLowerCase().includes(q) ||
        String(r.minMark).includes(q) ||
        String(r.maxMark).includes(q) ||
        String(r.gpaPoint).includes(q)
    );
  }, [sorted, search]);

  const grouped = useMemo(() => {
    const groups = new Map<string, GradingRule[]>();
    for (const r of filtered) {
      const key = r.academicYear ?? "__none__";
      const list = groups.get(key) ?? [];
      list.push(r);
      groups.set(key, list);
    }
    return groups;
  }, [filtered]);

  const createMutation = useMutation({
    mutationFn: (data: RuleForm) =>
      gradingService.create({
        classId: data.classId,
        academicYear: data.academicYear || undefined,
        minMark: data.minMark,
        maxMark: data.maxMark,
        grade: data.grade,
        gpaPoint: data.gpaPoint,
        isPassing: data.isPassing,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["grading-rules", selectedClassId] });
      toast.success("Grading rule added!");
      setShowForm(false);
      setForm(emptyRule);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to create rule");
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { minMark: number; maxMark: number; grade: string; gpaPoint: number; isPassing: boolean } }) =>
      gradingService.update(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["grading-rules", selectedClassId] });
      toast.success("Grading rule updated!");
      setEditingId(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to update rule");
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => gradingService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["grading-rules", selectedClassId] });
      toast.success("Grading rule deleted!");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to delete rule");
      toast.error(msg);
    },
  });

  const bulkMutation = useMutation({
    mutationFn: (data: { classId: string; academicYear?: string; rows: { minMark: number; maxMark: number; grade: string; gpaPoint: number; isPassing?: boolean }[] }) =>
      gradingService.bulkUpsert(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["grading-rules", selectedClassId] });
      toast.success("Bulk grading rules saved!");
      setBulkText("");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to save bulk rules");
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.classId) return toast.error("Please select a class");
    if (form.maxMark < form.minMark) return toast.error("maxMark must be >= minMark");
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: {
          minMark: form.minMark,
          maxMark: form.maxMark,
          grade: form.grade,
          gpaPoint: form.gpaPoint,
          isPassing: form.isPassing,
        },
      });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleBulkSave = () => {
    if (!selectedClassId) return toast.error("Please select a class first");
    const lines = bulkText.split("\n").filter((l) => l.trim());
    if (lines.length === 0) return toast.error("Please enter at least one row");

    const rows = lines.map((line, idx) => {
      const parts = line.split(/[|,\t]/).map((s) => s.trim());
      if (parts.length < 4) throw new Error(`Row ${idx + 1}: expected 4 fields (minMark,maxMark,grade,gpaPoint)`);
      const [minMarkStr, maxMarkStr, grade, gpaPointStr] = parts;
      const minMark = Number(minMarkStr);
      const maxMark = Number(maxMarkStr);
      const gpaPoint = Number(gpaPointStr);
      if (Number.isNaN(minMark) || Number.isNaN(maxMark) || Number.isNaN(gpaPoint)) {
        throw new Error(`Row ${idx + 1}: numeric fields required`);
      }
      return { minMark, maxMark, grade, gpaPoint, isPassing: true };
    });

    bulkMutation.mutate({
      classId: selectedClassId,
      academicYear: form.academicYear || undefined,
      rows,
    });
  };

  const startEdit = (rule: GradingRule) => {
    setEditingId(rule.id);
    setForm({
      classId: rule.classId,
      academicYear: rule.academicYear ?? "",
      minMark: rule.minMark,
      maxMark: rule.maxMark,
      grade: rule.grade,
      gpaPoint: rule.gpaPoint,
      isPassing: rule.isPassing,
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setForm(emptyRule);
  };

  if (classesLoading || rulesLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

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
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-300/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative w-full max-w-5xl my-8 space-y-6">
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
                  Grading Rules
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-indigo-400"
                  >
                    <GraduationCap className="w-5 h-5" />
                  </motion.span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Manage grading scales and rules per class
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {selectedClassId && (
                <>
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search grade, marks, gpa..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setEditingId(null);
                      setForm({
                        classId: selectedClassId,
                        academicYear: form.academicYear,
                        minMark: 0,
                        maxMark: 100,
                        grade: "",
                        gpaPoint: 0,
                        isPassing: true,
                      });
                      setShowForm(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4" /> Add Rule
                  </motion.button>
                </>
              )}
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Total: <b className="text-slate-700 dark:text-slate-300">{filtered.length}</b>
              </div>
            </div>

            {!selectedClassId ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <GraduationCap className="w-10 h-10 text-indigo-400 mb-4" />
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  Select a class
                </h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  Choose a class to view or manage grading rules.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <GraduationCap className="w-10 h-10 text-indigo-400 mb-4" />
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  No grading rules found
                </h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  Add a rule or use bulk import below.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {Array.from(grouped.entries()).map(([academicYear, items], gIdx) => (
                  <motion.div
                    key={academicYear}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gIdx * 0.05 }}
                    className="space-y-3"
                  >
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                      {academicYear === "__none__" ? "No Academic Year" : academicYear}{" "}
                      <span className="text-xs text-slate-500 normal-case">
                        ({items.length} rule{items.length !== 1 ? "s" : ""})
                      </span>
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-800/40">
                            <th className="pb-3 pt-3 font-medium pl-4">Min Mark</th>
                            <th className="pb-3 pt-3 font-medium">Max Mark</th>
                            <th className="pb-3 pt-3 font-medium">Grade</th>
                            <th className="pb-3 pt-3 font-medium">GPA Point</th>
                            <th className="pb-3 pt-3 font-medium">Passing</th>
                            <th className="pb-3 pt-3 font-medium text-right pr-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {items.map((rule, idx) => (
                            <motion.tr
                              key={rule.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: gIdx * 0.05 + idx * 0.02 }}
                              className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                            >
                              <td className="py-3.5 pl-4 text-slate-600 dark:text-slate-300">
                                {rule.minMark}
                              </td>
                              <td className="py-3.5 text-slate-600 dark:text-slate-300">
                                {rule.maxMark}
                              </td>
                              <td className="py-3.5 font-medium text-slate-900 dark:text-white">
                                {rule.grade}
                              </td>
                              <td className="py-3.5 text-slate-600 dark:text-slate-300">
                                {rule.gpaPoint.toFixed(2)}
                              </td>
                              <td className="py-3.5">
                                {rule.isPassing ? (
                                  <span className="inline-flex rounded-md px-2.5 py-1.5 text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                                    YES
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-md px-2.5 py-1.5 text-xs font-medium border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20">
                                    NO
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 pr-4">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => startEdit(rule)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm("Delete this grading rule?")) {
                                        deleteMutation.mutate(rule.id);
                                      }
                                    }}
                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {selectedClassId && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                  Bulk Import
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  One rule per line. Format: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">minMark|maxMark|grade|gpaPoint</code>
                </p>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={"80|100|A+|5.00\n70|79|A|4.00\n60|69|A-|3.50\n50|59|B|3.00\n40|49|C|2.00\n0|39|F|0.00"}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 font-mono"
                  rows={6}
                />
                <div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBulkSave}
                    disabled={bulkMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> Save Bulk Rules
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-xl w-full max-w-2xl border border-slate-100 dark:border-slate-800"
            >
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                {editingId ? "Edit Grading Rule" : "New Grading Rule"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class</label>
                    <select
                      disabled={!!editingId}
                      value={form.classId}
                      onChange={(e) => setForm({ ...form, classId: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                    >
                      <option value="">Select Class</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Academic Year</label>
                    <input
                      type="text"
                      value={form.academicYear}
                      onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                      placeholder="e.g. 2025-2026"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Min Mark</label>
                    <input
                      type="number"
                      required
                      value={form.minMark}
                      onChange={(e) => setForm({ ...form, minMark: Number(e.target.value) })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Mark</label>
                    <input
                      type="number"
                      required
                      value={form.maxMark}
                      onChange={(e) => setForm({ ...form, maxMark: Number(e.target.value) })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grade</label>
                    <input
                      type="text"
                      required
                      value={form.grade}
                      onChange={(e) => setForm({ ...form, grade: e.target.value })}
                      placeholder="e.g. A+, A, B"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">GPA Point</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={form.gpaPoint}
                      onChange={(e) => setForm({ ...form, gpaPoint: Number(e.target.value) })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="isPassing"
                      type="checkbox"
                      checked={form.isPassing}
                      onChange={(e) => setForm({ ...form, isPassing: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="isPassing" className="text-sm text-slate-700 dark:text-slate-300">
                      Is Passing
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {editingId ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
