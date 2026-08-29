"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Pencil,
  Trash2,
  GraduationCap,
  Venus,
  Mars,
  User as UserIcon,
} from "lucide-react";
import { useTeachers, useDeleteTeacher } from "./useTeachers";
import TeacherForm from "./teacherForm";
import { Teacher } from "./teacher.types";
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

export default function TeacherList() {
  const { data: teachers, isLoading } = useTeachers();
  const { mutate: deleteTeacher } = useDeleteTeacher();
  const { role } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Teacher | null>(null);
  const [search, setSearch] = useState("");

  const teacherList = Array.isArray(teachers) ? teachers : [];
  const filtered = teacherList.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleEdit = (teacher: Teacher) => {
    setSelected(teacher);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this teacher?")) deleteTeacher(id);
  };

  const handleClose = () => {
    setShowForm(false);
    setSelected(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="grid gap-4 w-full max-w-5xl">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-2xl bg-gradient-to-r from-slate-200/60 via-slate-100/40 to-slate-200/60 dark:from-slate-800/60 dark:via-slate-900/40 dark:to-slate-800/60 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4 sm:p-8 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-24 -right-24 w-[28rem] h-[28rem] rounded-full bg-violet-400/20 dark:bg-violet-500/10 blur-3xl"
        />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Teachers
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                <Users className="w-3.5 h-3.5" />
                Total {teacherList.length} teachers
              </p>
            </div>
          </div>

          {role && hasPermission(role, "create_teacher") && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Teacher
            </motion.button>
          )}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative max-w-md mb-6"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl pl-11 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 shadow-sm transition-all"
          />
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="overflow-hidden rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl shadow-xl shadow-slate-900/5"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-100/80 via-blue-50/60 to-indigo-50/60 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-indigo-900/40 text-left">
                  <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">Name</th>
                  <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">
                    <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Email</span>
                  </th>
                  <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">
                    <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Phone</span>
                  </th>
                  <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">
                    <span className="inline-flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />Subject</span>
                  </th>
                  <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">Gender</th>
                  <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">
                    <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Joining date</span>
                  </th>
                  {role && hasPermission(role, "edit_teacher") && (
                    <th className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200 text-right">Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.map((teacher, idx) => {
                    const grad = pickGradient(teacher.name);
                    const genderIcon =
                      teacher.gender?.toLowerCase() === "female" ? (
                        <Venus className="w-3 h-3" />
                      ) : teacher.gender?.toLowerCase() === "male" ? (
                        <Mars className="w-3 h-3" />
                      ) : (
                        <UserIcon className="w-3 h-3" />
                      );
                    const genderColor =
                      teacher.gender?.toLowerCase() === "female"
                        ? "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300"
                        : teacher.gender?.toLowerCase() === "male"
                          ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300";

                    return (
                      <motion.tr
                        key={teacher.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: idx * 0.04, duration: 0.3 }}
                        className="border-t border-slate-100 dark:border-white/5 hover:bg-gradient-to-r hover:from-blue-50/60 hover:to-indigo-50/40 dark:hover:from-blue-500/5 dark:hover:to-indigo-500/5 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`relative w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-sm shadow-md`}
                            >
                              {teacher.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-800 dark:text-slate-100">
                              {teacher.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{teacher.email}</td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{teacher.phone}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-xs font-medium">
                            <BookOpen className="w-3 h-3" />
                            {teacher.subject ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${genderColor}`}
                          >
                            {genderIcon}
                            {teacher.gender}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs">
                          {formatDate(teacher.createdAt)}
                        </td>
                        {role && hasPermission(role, "edit_teacher") && (
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEdit(teacher)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:hover:bg-blue-500/25 text-xs font-medium transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                                Edit
                              </motion.button>
                              {hasPermission(role, "delete_teacher") && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleDelete(teacher.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25 text-xs font-medium transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </motion.button>
                              )}
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Users className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          No teachers found
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && <TeacherForm teacher={selected} onClose={handleClose} />}
      </AnimatePresence>
    </div>
  );
}
