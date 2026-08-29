"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  UserPlus,
  Shield,
  X,
  Inbox,
  Loader2,
  Sparkles,
  Users,
  GraduationCap,
  School,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Role } from "@/tyPes/auth.tyPes";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  schoolId?: string;
  school?: { id: string; name: string; code: string } | null;
  adminProfile?: { phone: string } | null;
  teacherProfile?: { employeeId: string; designation: string } | null;
  studentProfile?: { studentId: string } | null;
};

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  SCHOOL_ADMIN: "School Admin",
  ACCOUNTANT: "Accountant",
  TEACHER: "Teacher",
  STUDENT: "Student",
  PARENT: "Parent",
  EXAM_CONTROLLER: "Exam Controller",
  HR: "HR",
};

const roleColors: Record<Role, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  SCHOOL_ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  ACCOUNTANT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  TEACHER: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  STUDENT: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  PARENT: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  EXAM_CONTROLLER: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  HR: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

const PAGE_SIZE = 10;

export default function SuperAdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", schoolId: "", phone: "" });
  const [page, setPage] = useState(1);

  const schoolIdFromQuery = searchParams.get("schoolId") ?? "";

  useEffect(() => {
    if (role && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    setPage(1);
    loadUsers();
    loadSchools();
  }, [roleFilter, schoolIdFromQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter) params.set("role", roleFilter);
      if (schoolIdFromQuery) params.set("schoolId", schoolIdFromQuery);
      const res = await api.get(`/super-admin/users?${params.toString()}`);
      const payload = res.data?.data ?? res.data;
      setUsers(Array.isArray(payload) ? payload : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSchools = async () => {
    try {
      const res = await api.get("/super-admin/schools");
      const payload = res.data?.data ?? res.data;
      const list = Array.isArray(payload) ? payload : [];
      setSchools(list.map((s: any) => ({ id: s.id, name: s.name })));
    } catch {
      setSchools([]);
    }
  };

  const filtered = useMemo(() => {
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), [filtered.length]);
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const uniqueSchools = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const u of users) {
      if (u.school?.id && !map.has(u.school.id)) map.set(u.school.id, { id: u.school.id, name: u.school.name });
    }
    return Array.from(map.values());
  }, [users]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const u of users) counts[u.role] = (counts[u.role] || 0) + 1;
    return counts;
  }, [users]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.post(`/super-admin/schools/${form.schoolId}/admins`, {
        name: form.name,
        email: form.email,
        password: form.password,
        schoolId: form.schoolId,
        phone: form.phone,
      });
      setShowCreateModal(false);
      setForm({ name: "", email: "", password: "", schoolId: "", phone: "" });
      setPage(1);
      loadUsers();
      setMessage("School Admin created successfully.");
    } catch {
      setMessage("Failed to create School Admin.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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
        <div className="relative w-full p-4 sm:p-6">
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-8 space-y-4">
            <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="space-y-3 mt-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="relative w-full p-4 sm:p-6"
      >
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          {/* Header */}
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 4 }}
                  className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center cursor-pointer"
                >
                  <Shield className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    All Users
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {filtered.length} users enlisted
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create School Admin
              </motion.button>
            </div>
          </div>

          {/* Role Stats */}
          <div className="p-4 sm:p-6 border-b border-white/30 dark:border-white/5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.keys(roleLabels) as Role[]).map((r, i) => (
                <motion.button
                  key={r}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  onClick={() => setRoleFilter(roleFilter === r ? "" : r)}
                  className={`relative flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                    roleFilter === r
                      ? "bg-white/80 dark:bg-white/10 border-indigo-200/60 dark:border-indigo-400/20 shadow-md shadow-indigo-500/10"
                      : "bg-white/60 dark:bg-white/5 border-white/30 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10"
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white shadow-sm">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">{roleLabels[r]}</p>
                    <p className="text-base font-bold text-slate-800 dark:text-white mt-0.5">{stats[r] ?? 0}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Search + Table */}
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/40 backdrop-blur-sm"
                />
              </div>
              {uniqueSchools.length > 0 && (
                <select
                  value={schoolIdFromQuery}
                  onChange={(e) => {
                    if (e.target.value) {
                      router.push(`/dashboard/super-admin/users?schoolId=${e.target.value}`);
                    } else {
                      router.push("/dashboard/super-admin/users");
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 backdrop-blur-sm"
                >
                  <option value="">All Schools</option>
                  {uniqueSchools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/30 dark:border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/40 dark:border-white/10 text-left text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">School</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/30 dark:divide-white/10">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-xs text-slate-400 dark:text-slate-500">Loading...</td></tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-xs text-slate-400 dark:text-slate-500">No users found.</td></tr>
                  ) : (
                    paginatedUsers.map((user, i) => (
                      <motion.tr
                        key={user.id}
                        custom={i}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        className="hover:bg-white/60 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">{user.name}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColors[user.role]}`}>
                            {roleLabels[user.role]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {user.school?.name ?? <span className="text-xs italic text-slate-400">Platform</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                            user.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between px-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing page {page} of {totalPages} &nbsp;·&nbsp; {filtered.length} total users
                </p>
                <div className="flex items-center gap-1.5">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                  </motion.button>

                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }
                    return (
                      <motion.button
                        key={pageNum}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                          page === pageNum
                            ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/30"
                            : "bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10"
                        }`}
                      >
                        {pageNum}
                      </motion.button>
                    );
                  })}

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 transition-all"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>
            )}

            {filtered.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                >
                  <Inbox className="w-10 h-10 text-indigo-400" />
                </motion.div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  No users available
                </h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  No users found matching your search.
                </p>
              </motion.div>
            )}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          EduCore Users Panel
        </motion.p>
      </motion.div>

      {/* Create School Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-white/40 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Create School Admin
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Assign to School *</label>
                <select
                  required
                  value={form.schoolId}
                  onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="">Select School</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Password *</label>
                <input
                  type="text"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/60 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </span>
                  ) : "Create Admin"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

