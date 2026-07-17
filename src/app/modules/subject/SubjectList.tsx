"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  UserCircle2,
  Calendar,
  Hash,
  Sparkles,
  Loader2,
  Inbox,
  Target,
  CheckCircle2,
  CircleOff,
} from "lucide-react";
import { useSubjects, useDeleteSubject } from "./useSubjects";
import SubjectForm from "./SubjectForm";
import { Subject } from "./subject.types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

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
    if (confirm("Delete করবেন?")) deleteSubject(id);
  };

  const handleClose = () => {
    setShowForm(false);
    setSelected(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 overflow-hidden">
      {/* Glow orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-fuchsia-400/20 blur-3xl" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Subjects
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                মোট{" "}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {safeSubjects.length}
                </span>{" "}
                টি subject
              </p>
            </div>
          </div>

          {canManage && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Subject
            </motion.button>
          )}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative max-w-md mb-6"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/60 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all shadow-sm"
          />
        </motion.div>

        {/* Table card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/70 dark:border-slate-700/50 shadow-xl shadow-slate-200/40 dark:shadow-black/30 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50/80 to-indigo-50/40 dark:from-slate-800/60 dark:to-indigo-950/40 border-b border-slate-200/70 dark:border-slate-700/50">
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Subject নাম
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4" /> Code
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" /> Class
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <UserCircle2 className="w-4 h-4" /> Teacher
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> তৈরির তারিখ
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" /> Full Marks
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Pass Marks
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <CircleOff className="w-4 h-4" /> Type
                    </div>
                  </th>
                  {canManage && (
                    <th className="text-right px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">
                      Action
                    </th>
                  )}
                </tr>
              </thead>

              <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                <AnimatePresence>
                  {filtered.map((subject) => (
                    <motion.tr
                      key={subject.id}
                      variants={rowVariants}
                      exit={{ opacity: 0, x: -20 }}
                      className="border-b border-slate-100/70 dark:border-slate-800/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-xs">
                            {subject.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {subject.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60">
                          {subject.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {subject.class?.name ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {subject.teacher?.name ?? "—"}
                      </td>
                       <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                         {formatDate(subject.createdAt)}
                       </td>
                       <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                         {subject.fullMarks}
                       </td>
                       <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                         {subject.passMarks}
                       </td>
                       <td className="px-6 py-4">
                         {subject.isCompulsory ? (
                           <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                             <CheckCircle2 className="w-3 h-3" />
                             Compulsory
                           </span>
                         ) : (
                           <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                             <CircleOff className="w-3 h-3" />
                             Optional
                           </span>
                         )}
                       </td>
                       {canManage && (
                         <td className="px-6 py-4">
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
                </AnimatePresence>

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={canManage ? 8 : 7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Inbox className="w-7 h-7" />
                        </div>
                        <p className="text-sm">কোনো subject পাওয়া যায়নি</p>
                      </div>
                    </td>
                  </tr>
                )}
              </motion.tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {showForm && <SubjectForm subject={selected} onClose={handleClose} />}
    </div>
  );
}
