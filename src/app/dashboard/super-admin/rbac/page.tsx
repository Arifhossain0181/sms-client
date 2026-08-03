"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import { motion } from "framer-motion";
import { Shield, Save } from "lucide-react";
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

export default function RBACPage() {
  useLenis();
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Role-Based Access Control</h1>
        <p className="text-muted-foreground mt-1">Configure permissions for each role.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Select Role</p>
          {(Object.keys(roleLabels) as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                selectedRole === r
                  ? "gradient-primary text-white shadow-elegant"
                  : "bg-card/80 border border-border/60 hover:border-border"
              }`}
            >
              {roleLabels[r]}
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/80 shadow-soft">
          <div className="p-6 border-b border-border/60 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{roleLabels[selectedRole]} Permissions</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedPerms.size} of {permKeys.length} permissions selected
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium shadow-elegant hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
            </button>
          </div>
          <div className="p-6">
            {message && (
              <div className={`mb-4 px-4 py-2 rounded-xl text-sm ${message.includes("success") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {message}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {permValues.map((perm) => (
                <label
                  key={perm.key}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedPerms.has(perm.key)
                      ? "border-primary bg-primary/5"
                      : "border-border/60 bg-secondary/30 hover:border-border"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPerms.has(perm.key)}
                    onChange={() => togglePerm(perm.key)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-sm">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
