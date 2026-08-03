"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { Search, Users, Building2, Calendar, Mail, Phone, Briefcase } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type StaffSummary = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  staffType: string;
  department?: { name: string };
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

const staffTypeColors: Record<string, { bg: string; text: string }> = {
  TEACHING: { bg: "bg-emerald-100 text-emerald-700", text: "Teaching" },
  NON_TEACHING: { bg: "bg-sky-100 text-sky-700", text: "Non-Teaching" },
};

export default function StaffDirectoryPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [staff, setStaff] = useState<StaffSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const url = `/hr/staff/directory${search ? `?search=${encodeURIComponent(search)}` : ""}`;
        const res = await api.get(url);
        const payload = res.data?.data ?? res.data;
        setStaff(Array.isArray(payload) ? payload : []);
      } catch {
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search]);

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
                  Staff Directory
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-indigo-400"
                  >
                    <Users className="w-5 h-5" />
                  </motion.span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Search staff by name, department, or designation
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, department, or designation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
              />
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-5 shadow-xl">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48 rounded-lg" />
                        <Skeleton className="h-3 w-72 rounded-lg" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
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
                  <Users className="w-10 h-10 text-indigo-400" />
                </motion.div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No staff found</h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Try adjusting your search</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {staff.map((s, idx) => {
                  const typeColor = staffTypeColors[s.staffType] ?? { bg: "bg-gray-100 text-gray-700", text: s.staffType.toLowerCase() };
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-5 shadow-xl hover:shadow-2xl transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 shrink-0 text-sm font-semibold">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-semibold text-slate-900 dark:text-white truncate">{s.name}</h3>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColor.bg}`}>
                                {typeColor.text}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" /> {s.designation ?? "—"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" /> {s.department?.name ?? "—"}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {s.email}
                              </span>
                              {s.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {s.phone}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Joined {new Date(s.joiningDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            {s.employeeId}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
