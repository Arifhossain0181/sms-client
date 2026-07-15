import { ROLES } from "../../../tyPes/auth.tyPes";
import { NoticeTarget } from "./notice.types";

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  SCHOOL_ADMIN: "School Admin",
  ACCOUNTANT: "Accountant",
  TEACHER: "Teacher",
  STUDENT: "Student",
  PARENT: "Parent",
  EXAM_CONTROLLER: "Exam Controller",
  HR: "HR",
};

export const NOTICE_TARGETS: { value: NoticeTarget; label: string }[] = [
  { value: "ALL", label: "Everyone" },
  ...ROLES.map((r) => ({ value: r as NoticeTarget, label: roleLabels[r] ?? r })),
];


export const targetStyles: Record<NoticeTarget, string> = {
  ALL: "from-sky-500/20 to-sky-500/5 text-sky-300 ring-sky-400/30",
  SUPER_ADMIN: "from-fuchsia-500/20 to-fuchsia-500/5 text-fuchsia-300 ring-fuchsia-400/30",
  SCHOOL_ADMIN: "from-rose-500/20 to-rose-500/5 text-rose-300 ring-rose-400/30",
  ACCOUNTANT: "from-amber-500/20 to-amber-500/5 text-amber-300 ring-amber-400/30",
 
  TEACHER: "from-violet-500/20 to-violet-500/5 text-violet-300 ring-violet-400/30",
  STUDENT: "from-indigo-500/20 to-indigo-500/5 text-indigo-300 ring-indigo-400/30",
  PARENT: "from-teal-500/20 to-teal-500/5 text-teal-300 ring-teal-400/30",
  HR:"from-amber-500/20 to-amber-500/5 text-amber-300 ring-amber-400/30",
  EXAM_CONTROLLER: "from-orange-500/20 to-orange-500/5 text-orange-300 ring-orange-400/30",
};

const labelMap: Record<NoticeTarget, string> = Object.fromEntries(
  NOTICE_TARGETS.map((t) => [t.value, t.label])
) as Record<NoticeTarget, string>;

export function targetLabel(target: NoticeTarget): string {
  return labelMap[target] ?? target;
}