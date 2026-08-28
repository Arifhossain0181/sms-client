import { Role } from "@/tyPes/auth.tyPes";

type Permission =
  | "manage_classes"
  | "create_student"
  | "edit_student"
  | "delete_student"
  | "create_teacher"
  | "edit_teacher"
  | "delete_teacher"
  | "mark_attendance"
  | "add_result"
  | "manage_fees"
  | "post_notice"
  | "manage_timetable"
  | "manage_admission"
  | "manage_staff_roles"
  | "generate_tc"
  | "promote_students"
  | "manage_homework"
  | "view_own_profile"
  | "pay_fees"
  | "view_report_card"
  | "view_admit_card"
  | "view_payment_history"
  | "view_library_books"
  | "manage_books"
  | "issue_return_books"
  | "search_books"
  | "manage_visitors"
  | "manage_inquiries"
  | "configure_grading"
  | "calculate_gpa"
  | "approve_marks"
  | "publish_results"
  | "view_failed_students"
  | "generate_exam_admit_cards"
  | "manage_staff"
  | "manage_onboarding_docs"
  | "manage_designations"
  | "track_staff_attendance"
  | "manage_leave"
  | "approve_leave"
  | "manage_payroll"
  | "generate_payslips"
  | "schedule_appraisals"
  | "post_hr_notices"
  | "view_child_data"
  | "view_platform_analytics"
  | "manage_rbac"
  | "trigger_backup"
  | "suspend_school"
  | "process_refund"
  | "view_financial_reports"
  | "view_overdue_fees"
  | "view_audit_logs";

const rolePermissions: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "view_platform_analytics",
    "manage_rbac",
    "trigger_backup",
    "suspend_school",
    "view_audit_logs",
    "manage_classes",
    "create_student",
    "edit_student",
    "delete_student",
    "create_teacher",
    "edit_teacher",
    "delete_teacher",
    "mark_attendance",
    "add_result",
    "manage_fees",
    "post_notice",
    "manage_timetable",
    "manage_admission",
    "manage_staff_roles",
    "generate_tc",
    "promote_students",
    "manage_homework",
    "process_refund",
    "view_financial_reports",
    "view_overdue_fees",
  ],
  SCHOOL_ADMIN: [
    "manage_classes",
    "create_student",
    "edit_student",
    "delete_student",
    "create_teacher",
    "edit_teacher",
    "delete_teacher",
    "mark_attendance",
    "add_result",
    "manage_fees",
    "post_notice",
    "manage_timetable",
    "manage_admission",
    "manage_staff_roles",
    "generate_tc",
    "promote_students",
    "manage_homework",
    "process_refund",
    "view_financial_reports",
    "view_overdue_fees",
  ],
  ACCOUNTANT: [
    "manage_fees",
    "view_financial_reports",
    "process_refund",
    "view_overdue_fees",
    "view_payment_history",
  ],
  TEACHER: [
    "mark_attendance",
    "add_result",
    "view_own_profile",
    "manage_homework",
    "view_library_books",
  ],
  STUDENT: [
    "view_own_profile",
    "view_report_card",
    "view_admit_card",
    "pay_fees",
    "view_payment_history",
    "view_library_books",
  ],
  PARENT: [
    "view_child_data",
    "pay_fees",
    "view_payment_history",
    "view_report_card",
    "view_admit_card",
  ],
  EXAM_CONTROLLER: [
    "configure_grading",
    "calculate_gpa",
    "approve_marks",
    "publish_results",
    "view_failed_students",
    "generate_exam_admit_cards",
    "add_result",
  ],
  HR: [
    "manage_staff",
    "manage_onboarding_docs",
    "manage_designations",
    "track_staff_attendance",
    "manage_leave",
    "approve_leave",
    "manage_payroll",
    "generate_payslips",
    "schedule_appraisals",
    "post_hr_notices",
    "create_teacher",
  ],
};

export const hasPermission = (role: Role, permission: Permission): boolean => {
  return rolePermissions[role]?.includes(permission) ?? false;
};
