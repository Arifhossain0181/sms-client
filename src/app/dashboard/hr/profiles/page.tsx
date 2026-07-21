"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { Plus, Search, UserCog, Eye, Trash2, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type StaffRecord = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  staffType: string;
  department?: { name: string };
  isActive: boolean;
  joiningDate: string;
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

export default function StaffProfilesPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/hr/staff?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`);
      const payload = res.data?.data ?? res.data;
      setStaff(payload.staff ?? []);
      setMeta(payload.meta ?? { page: 1, totalPages: 1 });
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this staff profile?")) return;
    try {
      await api.patch(`/hr/staff/${id}`);
      load(meta.page);
    } catch {
      alert("Failed to deactivate staff profile");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.patch(`/hr/staff/${id}/restore`);
      load(meta.page);
    } catch {
      alert("Failed to restore staff profile");
    }
  };

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

      <div className="relative w-full max-w-6xl my-8 space-y-6">
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
                  Staff Profiles
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-indigo-400"
                  >
                    <UserCog className="w-5 h-5" />
                  </motion.span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Manage teaching and non-teaching staff records
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/dashboard/hr/profiles/new")}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-4 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
              >
                <Plus className="h-4 w-4" /> New Staff
              </motion.button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
              />
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32 rounded-md" />
                        <Skeleton className="h-3 w-48 rounded-md" />
                      </div>
                      <Skeleton className="h-4 w-24 rounded-md" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : staff.length === 0 ? (
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
                  <UserCog className="w-10 h-10 text-indigo-400" />
                </motion.div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  No staff records found
                </h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  Staff records will appear here once added.
                </p>
              </motion.div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                      <th className="pb-2 font-medium">Employee ID</th>
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Email</th>
                      <th className="pb-2 font-medium">Designation</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Department</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {staff.map((s) => (
                      <tr key={s.id}>
                        <td className="py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{s.employeeId}</td>
                        <td className="py-3 font-medium text-slate-900 dark:text-white">{s.name}</td>
                        <td className="py-3 text-slate-500 dark:text-slate-400">{s.email}</td>
                        <td className="py-3 text-slate-700 dark:text-slate-200">{s.designation ?? "—"}</td>
                        <td className="py-3">
                          <span className="rounded-full bg-sky-100 dark:bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-400">
                            {s.staffType?.toLowerCase().replace("_", " ") ?? "non-teaching"}
                          </span>
                        </td>
                        <td className="py-3 text-slate-700 dark:text-slate-200">{s.department?.name ?? "—"}</td>
                        <td className="py-3">
                          {s.isActive ? (
                            <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-100 dark:bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-end gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => router.push(`/dashboard/hr/profiles/${s.id}`)}
                              className="rounded-lg p-1.5 hover:bg-white/10"
                              title="View"
                            >
                              <Eye className="h-4 w-4 text-slate-400" />
                            </motion.button>
                            {s.isActive ? (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleArchive(s.id)}
                                className="rounded-lg p-1.5 hover:bg-red-500/10"
                                title="Deactivate"
                              >
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </motion.button>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleRestore(s.id)}
                                className="rounded-lg p-1.5 hover:bg-emerald-500/10"
                                title="Restore"
                              >
                                <RotateCcw className="h-4 w-4 text-emerald-400" />
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
