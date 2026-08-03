"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import { motion } from "framer-motion";
import { Search, UserPlus, Shield, X } from "lucide-react";
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
    transition: { delay: i * 0.03, duration: 0.3 },
  }),
};

export default function SuperAdminUsersPage() {
  useLenis();
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

  const schoolIdFromQuery = searchParams.get("schoolId") ?? "";

  useEffect(() => {
    if (role && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
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
      loadUsers();
      setMessage("School Admin created successfully.");
    } catch {
      setMessage("Failed to create School Admin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">All Users</h1>
          <p className="text-muted-foreground mt-1">Manage accounts across all schools.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium shadow-elegant hover:shadow-lg transition-all"
        >
          <UserPlus className="w-4 h-4" /> Create School Admin
        </button>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm ${message.includes("success") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(Object.keys(roleLabels) as Role[]).map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(roleFilter === r ? "" : r)}
            className={`rounded-xl border p-4 text-left transition-all ${
              roleFilter === r
                ? "border-primary bg-primary/5 shadow-elegant"
                : "border-border/60 bg-card/80 hover:border-border"
            }`}
          >
            <p className="text-xs text-muted-foreground">{roleLabels[r]}</p>
            <p className="text-xl font-semibold mt-1">{stats[r] ?? 0}</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 shadow-soft">
        <div className="p-6 border-b border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">User Directory</h3>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-48 pl-10 pr-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                className="px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">All Schools</option>
                {uniqueSchools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">School</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-xs text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-xs text-muted-foreground">No users found.</td></tr>
              ) : (
                filtered.map((user) => (
                  <motion.tr
                    key={user.id}
                    custom={0}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">{user.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {user.school?.name ?? <span className="text-xs italic">Platform</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          user.isActive ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create School Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl border border-border/60 shadow-elegant w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-border/60 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create School Admin</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Assign to School *</label>
                <select
                  required
                  value={form.schoolId}
                  onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Select School</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Password *</label>
                <input
                  type="text"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium shadow-elegant hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
