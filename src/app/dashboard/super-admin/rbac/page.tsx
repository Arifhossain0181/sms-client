"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Save,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { Role } from "@/tyPes/auth.tyPes";

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

const allPermissions: Record<string, { key: string; label: string }> = {
  manage_classes: { key: "manage_classes", label: "Manage Classes" },
  create_student: { key: "create_student", label: "Create Student" },
  edit_student: { key: "edit_student", label: "Edit Student" },
  delete_student: { key: "delete_student", label: "Delete Student" },
  create_teacher: { key: "create_teacher", label: "Create Teacher" },
  edit_teacher: { key: "edit_teacher", label: "Edit Teacher" },
  delete_teacher: { key: "delete_teacher", label: "Delete Teacher" },
  mark_attendance: { key: "mark_attendance", label: "Mark Attendance" },
  add_result: { key: "add_result", label: "Add Result" },
  manage_fees: { key: "manage_fees", label: "Manage Fees" },
  post_notice: { key: "post_notice", label: "Post Notice" },
  manage_timetable: { key: "manage_timetable", label: "Manage Timetable" },
  manage_admission: { key: "manage_admission", label: "Manage Admission" },
  manage_staff_roles: { key: "manage_staff_roles", label: "Manage Staff Roles" },
  generate_tc: { key: "generate_tc", label: "Generate TC" },
  promote_students: { key: "promote_students", label: "Promote Students" },
  manage_homework: { key: "manage_homework", label: "Manage Homework" },
  process_refund: { key: "process_refund", label: "Process Refund" },
  view_financial_reports: { key: "view_financial_reports", label: "View Financial Reports" },
  view_overdue_fees: { key: "view_overdue_fees", label: "View Overdue Fees" },
  manage_staff: { key: "manage_staff", label: "Manage Staff" },
  manage_onboarding_docs: { key: "manage_onboarding_docs", label: "Manage Onboarding Docs" },
  manage_designations: { key: "manage_designations", label: "Manage Designations" },
  track_staff_attendance: { key: "track_staff_attendance", label: "Track Staff Attendance" },
  manage_leave: { key: "manage_leave", label: "Manage Leave" },
  approve_leave: { key: "approve_leave", label: "Approve Leave" },
  manage_payroll: { key: "manage_payroll", label: "Manage Payroll" },
  generate_payslips: { key: "generate_payslips", label: "Generate Payslips" },
  schedule_appraisals: { key: "schedule_appraisals", label: "Schedule Appraisals" },
  post_hr_notices: { key: "post_hr_notices", label: "Post HR Notices" },
  view_platform_analytics: { key: "view_platform_analytics", label: "View Platform Analytics" },
  manage_rbac: { key: "manage_rbac", label: "Manage RBAC" },
  trigger_backup: { key: "trigger_backup", label: "Trigger Backup" },
  suspend_school: { key: "suspend_school", label: "Suspend School" },
  view_audit_logs: { key: "view_audit_logs", label: "View Audit Logs" },
  configure_grading: { key: "configure_grading", label: "Configure Grading" },
  calculate_gpa: { key: "calculate_gpa", label: "Calculate GPA" },
  approve_marks: { key: "approve_marks", label: "Approve Marks" },
  publish_results: { key: "publish_results", label: "Publish Results" },
  view_failed_students: { key: "view_failed_students", label: "View Failed Students" },
  generate_exam_admit_cards: { key: "generate_exam_admit_cards", label: "Generate Admit Cards" },
  manage_books: { key: "manage_books", label: "Manage Books" },
  issue_return_books: { key: "issue_return_books", label: "Issue/Return Books" },
  search_books: { key: "search_books", label: "Search Books" },
  manage_visitors: { key: "manage_visitors", label: "Manage Visitors" },
  manage_inquiries: { key: "manage_inquiries", label: "Manage Inquiries" },
  view_own_profile: { key: "view_own_profile", label: "View Own Profile" },
  pay_fees: { key: "pay_fees", label: "Pay Fees" },
  view_report_card: { key: "view_report_card", label: "View Report Card" },
  view_admit_card: { key: "view_admit_card", label: "View Admit Card" },
  view_payment_history: { key: "view_payment_history", label: "View Payment History" },
  view_library_books: { key: "view_library_books", label: "View Library Books" },
  view_child_data: { key: "view_child_data", label: "View Child Data" },
};

const permKeys = Object.keys(allPermissions);
const permValues = Object.values(allPermissions);

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export default function RBACPage() {
  const router = useRouter();
  const { role } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>("SCHOOL_ADMIN");
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (role && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    setSelectedPerms(new Set());
    setMessage(null);
  }, [selectedRole]);

  const togglePerm = (key: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put(`/super-admin/rbac/${selectedRole}`, { permissions: Array.from(selectedPerms) });
      setMessage("Permissions updated successfully.");
    } catch {
      setMessage("Failed to update permissions.");
    } finally {
      setSaving(false);
    }
  };

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
                    Role-Based Access Control
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure permissions for each role.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Role Selector */}
              <div className="lg:col-span-1 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Select Role</p>
                {(Object.keys(roleLabels) as Role[]).map((r, i) => (
                  <motion.button
                    key={r}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    onClick={() => setSelectedRole(r)}
                    className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-medium border transition-all duration-300 ${
                      selectedRole === r
                        ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 border-transparent"
                        : "bg-white/60 dark:bg-white/5 border-white/30 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10"
                    }`}
                  >
                    {roleLabels[r]}
                  </motion.button>
                ))}
              </div>

              {/* Permissions Panel */}
              <motion.div
                layout
                className="lg:col-span-2 rounded-3xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm"
              >
                <div className="p-6 border-b border-white/40 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                      {roleLabels[selectedRole]} Permissions
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedPerms.size} of {permKeys.length} permissions selected
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 transition-all"
                  >
                    {saving ? (
                      <span className="inline-flex items-center gap-2">
                        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>⏳</motion.span>
                        Saving...
                      </span>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Save
                      </>
                    )}
                  </motion.button>
                </div>

                <div className="p-6">
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mb-4 px-4 py-2 rounded-xl text-sm flex items-center gap-2 ${
                        message.includes("success")
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                      }`}
                    >
                      {message.includes("success") ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {message}
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {permValues.map((perm, i) => {
                      const isSelected = selectedPerms.has(perm.key);
                      return (
                        <motion.label
                          key={perm.key}
                          custom={i}
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all duration-300 ${
                            isSelected
                              ? "bg-white/80 dark:bg-white/10 border-indigo-200/60 dark:border-indigo-400/20 shadow-md shadow-indigo-500/10"
                              : "bg-white/60 dark:bg-white/5 border-white/30 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10"
                          }`}
                        >
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePerm(perm.key)}
                              className="w-4 h-4 rounded accent-indigo-500"
                            />
                          </div>
                          <span className={`text-sm ${isSelected ? "text-slate-800 dark:text-white font-medium" : "text-slate-600 dark:text-slate-300"}`}>
                            {perm.label}
                          </span>
                          {isSelected && (
                            <motion.div
                              layoutId="perm-check"
                              className="ml-auto"
                            >
                              <CheckCircle2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                            </motion.div>
                          )}
                        </motion.label>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          EduCore RBAC Panel
        </motion.p>
      </motion.div>
    </div>
  );
}
