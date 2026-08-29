"use client";
import { Variants } from "framer-motion";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Layers,
  GraduationCap,
  Calendar,
  Hash,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { useClasses, useDeleteClass } from "./useClasses";
import ClassForm from "./ClassForm";
import { Class } from "./class.types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

const gradients = [
  "from-sky-500 via-blue-500 to-indigo-600",
  "from-violet-500 via-purple-500 to-fuchsia-600",
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-amber-500 via-orange-500 to-rose-600",
  "from-pink-500 via-rose-500 to-red-600",
];
const pickGradient = (s: string) =>
  gradients[s.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % gradients.length];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, type: "tween", ease: "easeOut" },
  }),
};

function SkeletonRow() {
  return (
    <div className="h-14 rounded-xl bg-gradient-to-r from-slate-200/60 via-slate-100/40 to-slate-200/60 dark:from-slate-800/60 dark:via-slate-800/30 dark:to-slate-800/60 animate-pulse" />
  );
}

export default function ClassList() {
  const { data: classes, isLoading } = useClasses();
  const { mutate: deleteClass } = useDeleteClass();
  const { role } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Class | null>(null);
  const [search, setSearch] = useState("");

  const classList = Array.isArray(classes) ? classes : [];
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const searchKey = normalize(search);
  const filtered = useMemo(
    () => classList.filter((c) => normalize(c.name).includes(searchKey)),
    [classList, searchKey]
  );

  const totalStudents = useMemo(
    () =>
      classList.reduce(
        (sum, c) => sum + (c.studentCount ?? c.students?.length ?? 0),
        0
      ),
    [classList]
  );
  const totalSections = useMemo(
    () => classList.reduce((sum, c) => sum + (c.sections?.length ?? 0), 0),
    [classList]
  );

  const handleEdit = (cls: Class) => {
    setSelected(cls);
    setShowForm(true);
  };
  const handleDelete = (id: string) => {
    if (confirm("Delete this class?")) deleteClass(id);
  };
  const handleClose = () => {
    setShowForm(false);
    setSelected(null);
  };
  const canManage = role && hasPermission(role, "manage_classes");

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/30 p-4 sm:p-6 lg:p-8">
      {/* Background orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-fuchsia-400/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 rounded-3xl border border-white/40 bg-white/70 dark:bg-slate-900/60 dark:border-white/5 backdrop-blur-2xl p-6 shadow-[0_20px_60px_-20px_rgba(79,70,229,0.25)]"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 blur-lg opacity-60" />
                <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg">
                  <GraduationCap className="h-7 w-7" />
                </div>
              </div>
              <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Classes
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total <span className="font-semibold text-indigo-600 dark:text-indigo-400">{classList.length}</span> classes ·{" "}
                  <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">{totalSections}</span> sections ·{" "}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{totalStudents}</span> students
                </p>
              </div>
            </div>

            {canManage && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowForm(true)}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow"
              >
                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                Add Class
              </motion.button>
            )}
          </div>

          {/* Search */}
          <div className="relative mt-5 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Class search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition"
            />
          </div>
        </motion.div>

        {/* Table card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-3xl border border-white/40 dark:border-white/5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl shadow-[0_20px_60px_-20px_rgba(79,70,229,0.2)] overflow-hidden"
        >
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-indigo-50/50 dark:from-slate-900/80 dark:to-indigo-950/40 text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="px-6 py-4 font-semibold">Class</th>
                    <th className="px-4 py-4 font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5" />
                        Level
                      </span>
                    </th>
                    <th className="px-4 py-4 font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5" />
                        Sections
                      </span>
                    </th>
                    <th className="px-4 py-4 font-semibold">Capacity</th>
                    <th className="px-4 py-4 font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Students
                      </span>
                    </th>
                    <th className="px-4 py-4 font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Created
                      </span>
                    </th>
                    {canManage && (
                      <th className="px-6 py-4 font-semibold text-right">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filtered.map((cls, idx) => {
                      const gradient = pickGradient(cls.name);
                      const studentCount = cls.studentCount ?? cls.students?.length ?? 0;
                      return (
                        <motion.tr
                          key={cls.id}
                          layout
                          variants={fadeUp}
                          initial="hidden"
                          animate="show"
                          exit={{ opacity: 0, y: -8 }}
                          custom={idx}
                          className="group border-t border-slate-100/80 dark:border-white/5 hover:bg-gradient-to-r hover:from-indigo-50/40 hover:to-fuchsia-50/40 dark:hover:from-indigo-950/30 dark:hover:to-fuchsia-950/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${gradient} text-white font-bold shadow-md`}
                              >
                                {cls.name.charAt(0).toUpperCase()}
                                <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-white dark:bg-slate-900 shadow ring-2 ring-white dark:ring-slate-900">
                                  <BookOpen className="h-2.5 w-2.5 text-indigo-600" />
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white">
                                  {cls.name}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  ID: {String(cls.id).slice(0, 8)}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 text-xs font-semibold">
                              {cls.numericLevel}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              {(cls.sections ?? []).length > 0 ? (
                                (cls.sections ?? []).map((s) => (
                                  <span
                                    key={s.name}
                                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 text-xs font-medium"
                                  >
                                    {s.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                            {(cls.sections ?? []).map((s) => s.maxCapacity).join(", ") || "—"}
                          </td>

                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-xs font-semibold">
                              <Users className="h-3 w-3" />
                              {studentCount} students
                            </span>
                          </td>

                          <td className="px-4 py-4 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                            {formatDate(cls.createdAt)}
                          </td>

                          {canManage && (
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.08 }}
                                  whileTap={{ scale: 0.92 }}
                                  onClick={() => handleEdit(cls)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.08 }}
                                  whileTap={{ scale: 0.92 }}
                                  onClick={() => handleDelete(cls.id)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </motion.button>
                              </div>
                            </td>
                          )}
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>

                  {filtered.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={canManage ? 7 : 6} className="px-6 py-16 text-center">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center gap-3"
                        >
                          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                            <GraduationCap className="h-8 w-8 text-slate-400" />
                          </div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                              No classes found
                          </p>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Form Modal */}
      {showForm && <ClassForm cls={selected ?? undefined} onClose={handleClose} />}
    </div>
  );
}
