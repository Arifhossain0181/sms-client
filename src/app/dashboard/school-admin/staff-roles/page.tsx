"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import { teacherService } from "@/app/modules/teachers/teacher.service";
import api from "@/lib/axios";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Users,
  UserCog,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  UserCheck,
  UserX,
  BookOpen,
  Phone,
  Mail,
  X,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Teacher = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gender: "MALE" | "FEMALE" | string;
  dateOfBirth: string;
  subject?: string;
  subjectId: string;
  createdAt: string;
  joiningDate?: string;
  role?: string;
  classes?: string[];
  department?: string;
  designation?: string;
  isActive?: boolean;
};

type RoleOption = {
  value: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  description: string;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "ACCOUNTANT",
    label: "Accountant",
    icon: BookOpen,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    description: "Manage fee collection and finances",
  },
  {
    value: "LIBRARIAN",
    label: "Librarian",
    icon: BookOpen,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    description: "Manage library books and issues",
  },
  {
    value: "RECEPTIONIST",
    label: "Receptionist",
    icon: UserCheck,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    description: "Handle visitors and inquiries",
  },
  {
    value: "EXAM_CONTROLLER",
    label: "Exam Controller",
    icon: GraduationCap,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    description: "Manage exams, schedules, and results",
  },
  {
    value: "HR",
    label: "HR Manager",
    icon: UserCog,
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-950/30",
    description: "Manage staff recruitment and payroll",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Skel({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-block rounded bg-muted/60 animate-pulse ${className}`} />
  );
}

function getRoleConfig(role?: string): { label: string; color: string; bg: string; icon: React.ElementType } {
  const option = ROLE_OPTIONS.find((r) => r.value === role);
  if (option) {
    return { label: option.label, color: option.color, bg: option.bg, icon: option.icon };
  }
  if (role === "SUPER_ADMIN") {
    return { label: "Super Admin", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30", icon: ShieldCheck };
  }
  if (role === "SCHOOL_ADMIN") {
    return { label: "School Admin", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/30", icon: UserCog };
  }
  return { label: "Teacher", color: "text-foreground", bg: "bg-secondary/60", icon: Users };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SchoolAdminStaffRolesPage() {
  const router = useRouter();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  // ── Role guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (role && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const canManage = role ? hasPermission(role, "manage_staff_roles") : false;

  // ── State ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch teachers ─────────────────────────────────────────────────────────
  const { data: teachers = [], isLoading, refetch } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const res = await api.get("/teachers");
      const payload = res.data?.data ?? res.data;
      if (Array.isArray(payload)) return payload as Teacher[];
      if (Array.isArray(payload?.teachers)) return payload.teachers as Teacher[];
      return [];
    },
    enabled: canManage,
  });

  const teacherList = Array.isArray(teachers) ? teachers : [];

  // ── Mutations ──────────────────────────────────────────────────────────────
  const assignMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const res = await api.post("/roles/assign", { userId, newRole });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Role assigned successfully");
      setSelectedUserId(null);
      setSelectedRole("");
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
           ?.message ?? (err instanceof Error ? err.message : "Failed to assign role");
      toast.error(msg);
    },
    onSettled: () => setActionLoading(false),
  });

  const revokeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post("/roles/revoke", { userId });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Role revoked — reset to Teacher");
      setSelectedUserId(null);
      setSelectedRole("");
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
           ?.message ?? (err instanceof Error ? err.message : "Failed to revoke role");
      toast.error(msg);
    },
    onSettled: () => setActionLoading(false),
  });

  // ── useMemo: derived values ────────────────────────────────────────────────
  const filterKey = search.toLowerCase().replace(/[^a-z0-9]/g, "");

  const filtered = useMemo(() => {
    if (!filterKey) return teacherList;
    return teacherList.filter((t) => {
      const hay = `${t.name} ${t.email} ${t.phone} ${t.department ?? ""} ${t.designation ?? ""} ${t.role ?? ""}`.toLowerCase().replace(/[^a-z0-9]/g, "");
      return hay.includes(filterKey);
    });
  }, [teacherList, filterKey]);

  const totalStaff = teacherList.length;
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    teacherList.forEach((t) => {
      const r = t.role ?? "TEACHER";
      counts[r] = (counts[r] || 0) + 1;
    });
    return counts;
  }, [teacherList]);

  const specializedCount = useMemo(
    () =>
      teacherList.filter((t) =>
        ROLE_OPTIONS.some((r) => r.value === t.role)
      ).length,
    [teacherList]
  );

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleAssign = () => {
    if (!selectedUserId || !selectedRole) return;
    setActionLoading(true);
    assignMutation.mutate({ userId: selectedUserId, newRole: selectedRole });
  };

  const handleRevoke = (userId: string) => {
    if (confirm("Revoke this role and reset to Teacher?")) {
      setActionLoading(true);
      revokeMutation.mutate(userId);
    }
  };

  const openAssignModal = (userId: string, currentRole?: string) => {
    setSelectedUserId(userId);
    setSelectedRole(currentRole ?? "");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!canManage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Role Assignments</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Assign or revoke specialized roles for staff members.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </motion.div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          {
            label: "Total Staff",
            value: totalStaff,
            color: "text-foreground",
            bg: "bg-secondary/60",
            icon: Users,
          },
          {
            label: "Specialized Roles",
            value: specializedCount,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/30",
            icon: ShieldCheck,
          },
          {
            label: "Teachers",
            value: (roleCounts["TEACHER"] || 0) + (roleCounts["TEACHER"] || 0),
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
            icon: GraduationCap,
          },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>
              {isLoading ? <Skel className="w-10 h-7 inline-block" /> : value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 flex-wrap"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, phone or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors"
        >
          <ShieldCheck className="w-4 h-4" /> Refresh
        </button>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border/60 bg-card/80 shadow-soft overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-secondary/40">
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Staff Member
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">
                  Contact
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">
                  Department
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Current Role
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">
                  Status
                </th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><Skel className="w-28 h-4" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><Skel className="w-32 h-4" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><Skel className="w-20 h-4" /></td>
                    <td className="px-5 py-4"><Skel className="w-24 h-5 rounded-full" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><Skel className="w-16 h-4" /></td>
                    <td className="px-5 py-4"><Skel className="w-28 h-8 rounded" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No staff found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((teacher) => {
                  const roleConfig = getRoleConfig(teacher.role);
                  const RoleIcon = roleConfig.icon;
                  const isSpecialized = ROLE_OPTIONS.some((r) => r.value === teacher.role);

                  return (
                    <tr key={teacher.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                            {teacher.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium block">{teacher.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {teacher.designation ?? "—"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {teacher.email}
                          </span>
                          {teacher.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {teacher.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell">
                        {teacher.department ?? "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${roleConfig.bg} ${roleConfig.color}`}>
                          <RoleIcon className="w-3.5 h-3.5" />
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                            teacher.isActive !== false
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                          }`}
                        >
                          {teacher.isActive !== false ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {teacher.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openAssignModal(teacher.id, teacher.role ?? "TEACHER")}
                            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
                            title="Assign/change role"
                          >
                            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                          </button>
                          {isSpecialized && (
                            <button
                              onClick={() => handleRevoke(teacher.id)}
                              disabled={actionLoading}
                              className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors disabled:opacity-50"
                              title="Revoke role"
                            >
                              <UserX className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Assign Role Modal */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setSelectedUserId(null); setSelectedRole(""); }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg"
          >
            <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/60 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-base">Assign Role</h2>
              </div>
              <button
                onClick={() => { setSelectedUserId(null); setSelectedRole(""); }}
                className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a specialized role for this staff member:
              </p>

              <div className="grid gap-2">
                {ROLE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedRole(option.value)}
                      className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${
                        selectedRole === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-secondary/50"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${option.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${option.color}`} />
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${selectedRole === option.value ? "text-primary" : "text-foreground"}`}>
                          {option.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {option.description}
                        </p>
                      </div>
                      {selectedRole === option.value && (
                        <CheckCircle2 className="w-5 h-5 text-primary ml-auto shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setSelectedUserId(null); setSelectedRole(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!selectedRole || actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  Assign Role
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
