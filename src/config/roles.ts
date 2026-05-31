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
  | "manage_admission";

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
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
  ],
  TEACHER: ["mark_attendance", "add_result", "manage_fees"],
  STUDENT: [],
};

export const hasPermission = (role: Role, permission: Permission) =>
  rolePermissions[role]?.includes(permission);
