"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  Sparkles,
  Loader2,
  Power,
  PowerOff,
  Filter,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import { hasPermission } from "@/config/roles";
import StudentForm from "./StudentForm";
import { useDeleteStudent, useDeactivateStudent, useReactivateStudent, useStudents } from "./useStudents";
import { useClasses } from "@/app/modules/class/useClasses";
import { Student } from "./student.types";
import { Class } from "@/app/modules/class/class.types";

const rowGradients = [
  "from-sky-50 to-indigo-50 dark:from-sky-500/10 dark:to-indigo-500/10",
  "from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/10",
  "from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10",
  "from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10",
  "from-rose-50 to-pink-50 dark:from-rose-500/10 dark:to-pink-500/10",
];

const avatarGradients = [
  "from-sky-400 to-indigo-500",
  "from-violet-400 to-fuchsia-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
];

export default function StudentList() {
  const { data: students, isLoading } = useStudents();
  const { data: classes } = useClasses();
  const { mutate: deleteStudent } = useDeleteStudent();
  const { mutate: deactivateStudent } = useDeactivateStudent();
  const { mutate: reactivateStudent } = useReactivateStudent();
  const { role } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const [search, setSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const studentList = Array.isArray(students) ? students : [];
  const classList = Array.isArray(classes) ? classes : [];

  const filteredStudents = studentList.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      (student.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (student.guardianEmail ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesClass = !selectedClassId || student.classId === selectedClassId || student.class?.id === selectedClassId;

    return matchesSearch && matchesClass;
  });

  const handleEdit = (student: Student) => {
    setSelected(student);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      deleteStudent(id);
    }
  };

  const handleDeactivate = (id: string) => {
    if (confirm("Are you sure you want to deactivate this student? They will not be able to log in.")) {
      deactivateStudent(id);
    }
  };

  const handleReactivate = (id: string) => {
    if (confirm("Are you sure you want to reactivate this student?")) {
      reactivateStudent(id);
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setSelected(null);
  };

  const canEdit = role && hasPermission(role, "edit_student");
  const canDelete = role && hasPermission(role, "delete_student");
  const canCreate = role && hasPermission(role, "create_student");

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading students…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40 px-4 sm:px-6 lg:px-10 py-8">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-20 h-72 w-72 rounded-full bg-sky-300/30 dark:bg-sky-500/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-violet-300/30 dark:bg-violet-500/10 blur-3xl"
        />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                <Users className="h-6 w-6 text-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-2xl bg-indigo-500/40"
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-700 to-violet-700 dark:from-white dark:via-indigo-200 dark:to-violet-200 bg-clip-text text-transparent">
                Students
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                মোট <span className="font-semibold text-indigo-600 dark:text-indigo-400">{studentList.length}</span> জন student
              </p>
            </div>
          </div>

          {canCreate && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowForm(true)}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <Plus className="h-4 w-4" />
              Add Student
            </motion.button>
          )}
        </motion.div>

        {/* Search and Class Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl pl-11 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
            />
          </div>
          <div className="relative min-w-[200px]">
            <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full rounded-full border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl pl-11 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition appearance-none cursor-pointer"
            >
              <option value="">All Classes</option>
              {classList.map((cls: Class) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Table card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="overflow-hidden rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl shadow-indigo-500/5"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-100 via-indigo-50 to-violet-50 dark:from-slate-800/80 dark:via-indigo-950/50 dark:to-violet-950/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  <th className="px-5 py-4">নাম</th>
                  <th className="px-5 py-4">Guardian Email</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Class</th>
                  <th className="px-5 py-4">Gender</th>
                  <th className="px-5 py-4">যোগ দেওয়ার তারিখ</th>
                  {canEdit && <th className="px-5 py-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                <AnimatePresence mode="popLayout">
                  {filteredStudents.map((student, i) => {
                    const grad = rowGradients[i % rowGradients.length];
                    const avatarGrad = avatarGradients[i % avatarGradients.length];
                    const initial = student.name?.[0]?.toUpperCase() ?? "?";
                    return (
                      <motion.tr
                        key={student.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35, delay: i * 0.04 }}
                        className={`group bg-gradient-to-r ${grad} hover:brightness-105 transition`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${avatarGrad} text-white text-sm font-bold shadow-md`}>
                              {initial}
                            </div>
                            <Link
                              href={`/students/${student.id}`}
                              className="font-semibold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-300 transition"
                            >
                              {student.name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            {student.guardianEmail ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            {student.phone ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 dark:bg-white/10 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-200 border border-indigo-100 dark:border-white/10">
                            <GraduationCap className="h-3.5 w-3.5" />
                            {student.class?.name ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              student.gender === "Male"
                                ? "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
                                : student.gender === "Female"
                                  ? "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300"
                                  : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300"
                            }`}
                          >
                            {student.gender}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {formatDate(student.createdAt)}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => handleEdit(student)}
                                className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500 hover:text-white transition"
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </motion.button>
                              {student.isActive !== false ? (
                                <motion.button
                                  whileHover={{ scale: 1.08 }}
                                  whileTap={{ scale: 0.92 }}
                                  onClick={() => handleDeactivate(student.id)}
                                  className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-300 hover:bg-amber-500 hover:text-white transition"
                                  title="Deactivate"
                                >
                                  <PowerOff className="h-3 w-3" />
                                  Deactivate
                                </motion.button>
                              ) : (
                                <motion.button
                                  whileHover={{ scale: 1.08 }}
                                  whileTap={{ scale: 0.92 }}
                                  onClick={() => handleReactivate(student.id)}
                                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white transition"
                                  title="Reactivate"
                                >
                                  <Power className="h-3 w-3" />
                                  Reactivate
                                </motion.button>
                              )}
                              {canDelete && (
                                <motion.button
                                  whileHover={{ scale: 1.08 }}
                                  whileTap={{ scale: 0.92 }}
                                  onClick={() => handleDelete(student.id)}
                                  className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-500 hover:text-white transition"
                                >
                                  <Trash2 className="h-3 w-3" />
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

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={canEdit ? 8 : 7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
                          <Users className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium">কোনো student পাওয়া যায়নি</p>
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
      {showForm && <StudentForm student={selected} onClose={handleClose} />}
    </div>
  );
}