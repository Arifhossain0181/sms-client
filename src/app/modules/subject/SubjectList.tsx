"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  UserCircle2,
  Target,
  CheckCircle2,
  CircleOff,
  Inbox,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { useSubjects, useDeleteSubject } from "./useSubjects";
import SubjectForm from "./SubjectForm";
import { Subject } from "./subject.types";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubjectList() {
  const { data: subjects, isLoading } = useSubjects();
  const { mutate: deleteSubject } = useDeleteSubject();
  const { role } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Subject | null>(null);
  const [search, setSearch] = useState("");

  const safeSubjects: Subject[] = Array.isArray(subjects) ? subjects : [];
  const filtered = safeSubjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  const canManage = role && hasPermission(role, "manage_classes");

  const handleEdit = (subject: Subject) => {
    setSelected(subject);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this subject?")) deleteSubject(id);
  };

  const handleClose = () => {
    setShowForm(false);
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Subjects</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Total <span className="font-semibold text-foreground">{safeSubjects.length}</span> subjects
            </p>
          </div>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all"
          >
            <Plus className="h-4 w-4" /> Add Subject
          </button>
        )}
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all shadow-sm"
        />
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border/60 bg-card/80 shadow-soft overflow-hidden"
      >
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48 rounded-md" />
                    <Skeleton className="h-3 w-32 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-20 rounded-md hidden sm:block" />
                  <Skeleton className="h-4 w-24 rounded-md hidden lg:block" />
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary/60 mb-4">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No subjects found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? "Try a different search term." : "Get started by adding a new subject."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/40 border-b border-border/60">
                  <th className="text-left px-6 py-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5" />
                      Subject
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden sm:table-cell">
                    Code
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Class
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <UserCircle2 className="w-3.5 h-3.5" />
                      Teacher
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden xl:table-cell">
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5" />
                      Full / Pass
                    </div>
                  </th>
                  <th className="text-center px-6 py-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Type
                  </th>
                  {canManage && (
                    <th className="text-right px-6 py-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((subject, idx) => (
                  <motion.tr
                    key={subject.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                    className="hover:bg-secondary/20 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-xs shrink-0">
                          {subject.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{subject.name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{subject.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-secondary text-secondary-foreground border border-border/60">
                        {subject.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">{subject.class?.name ?? "—"}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">{subject.teacher?.name ?? "—"}</span>
                    </td>
                    <td className="px-6 py-4 hidden xl:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {subject.fullMarks} / {subject.passMarks}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {subject.isCompulsory ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Compulsory
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <CircleOff className="w-3 h-3" />
                          Optional
                        </span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(subject)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(subject.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {showForm && <SubjectForm subject={selected} onClose={handleClose} />}
    </div>
  );
}
