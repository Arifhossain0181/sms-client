"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  LayoutDashboard,
  Megaphone,
  Settings,
  UserCheck,
  Users,
  Wallet,
  GraduationCap as Logo,
  X,
  Shield,
  UserRound,
  ClipboardCheck,
  UserCog,
  UsersRound,
  School,
  Building2,
  BookMarked,
  CreditCard,
  TrendingUp,
  ClipboardEdit,
  Star,
  Baby,
  HeartHandshake,
  Layers,
  DollarSign,
  Receipt,
  PieChart,
  Award,
  Printer,
  UserPlus,
  BriefcaseMedical,
  Handshake,
  FolderOpen,
  ListChecks,
  TimerReset,
  CheckSquare,
  FileBadge,
  CalendarRange,
  MessageSquare,
  Presentation,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/tyPes/auth.tyPes";

type NavItem = {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
};

type NavGroup = {
  groupLabel?: string;
  items: NavItem[];
};

const getDashboardHref = (role: Role): string => {
  switch (role) {
    case "SUPER_ADMIN":      return "/dashboard/super-admin";
    case "SCHOOL_ADMIN":     return "/dashboard/school-admin";
    case "ACCOUNTANT":       return "/dashboard/accountant";
    case "TEACHER":          return "/dashboard/teacher";
    case "STUDENT":          return "/dashboard/student";
    case "PARENT":           return "/dashboard/parent";
    case "EXAM_CONTROLLER":  return "/dashboard/exam-controller";
    case "HR":               return "/dashboard/hr";
    default:                 return "/dashboard";
  }
};

const getNavGroups = (role: Role | null): NavGroup[] => {
  if (!role) return [];

  const dashboardHref = getDashboardHref(role);

  const commonTop: NavItem[] = [
    { icon: Home,            label: "Home",          href: "/" },
    { icon: LayoutDashboard, label: "Dashboard",     href: dashboardHref },
    { icon: Bell,            label: "Notifications", href: "/dashboard/notification" },
  ];

  switch (role) {
    // 
    case "SUPER_ADMIN":
      return [
        {
          items: commonTop,
        },
        {
          groupLabel: "Management",
          items: [
            { icon: School,       label: "Schools",       href: "/dashboard/super-admin/schools" },
            { icon: Users,        label: "All Users",     href: "/dashboard/super-admin/users" },
            { icon: Shield,       label: "RBAC",          href: "/dashboard/super-admin/rbac" },
          ],
        },
        {
          groupLabel: "Analytics",
          items: [
            { icon: BarChart3,    label: "Platform Analytics", href: "/dashboard/super-admin/analytics" },
            { icon: TrendingUp,   label: "Revenue Report",     href: "/dashboard/super-admin/revenue" },
          ],
        },
        {
          groupLabel: "System",
          items: [
            { icon: Settings,     label: "System Settings", href: "/dashboard/super-admin/settings" },
          ],
        },
      ];

    // 
    // add these icon imports:
// UserCog, ShieldCheck, ClipboardCheck, FileSpreadsheet

    case "SCHOOL_ADMIN":
      return [
        { items: commonTop },
        {
          groupLabel: "Admissions & Students",
          items: [
            { icon: UserPlus,      label: "Admissions",     href: "/dashboard/school-admin/admissions" },
            { icon: Users,         label: "Student Records",href: "/dashboard/school-admin/students" },
            { icon: TrendingUp,    label: "Promotions",     href: "/dashboard/school-admin/promotions" },
            { icon: FileBadge,     label: "Transfer Cert.", href: "/dashboard/school-admin/tc" },
          ],
        },
        {
          groupLabel: "Academics",
          items: [
            { icon: GraduationCap, label: "Classes & Sections", href: "/dashboard/school-admin/classes" },
            { icon: BookOpen,      label: "Subjects",           href: "/dashboard/school-admin/subjects" },
          ],
        },
        {
          groupLabel: "Staff Management",
          items: [
            { icon: Presentation,  label: "Teachers",       href: "/dashboard/school-admin/teachers" },
            { icon: ShieldCheck,   label: "Role Assignments",href: "/dashboard/school-admin/staff-roles" },
            { icon: ClipboardCheck,label: "Escalations",    href: "/dashboard/school-admin/escalations" },
          ],
        },
        {
          groupLabel: "Communication",
          items: [
            { icon: Megaphone, label: "Notices", href: "/dashboard/school-admin/notices" },
          ],
        },
        {
          groupLabel: "Reports",
          items: [
            { icon: FileSpreadsheet, label: "Reports", href: "/dashboard/school-admin/reports" },
          ],
        },
      ];

    // 
    case "ACCOUNTANT":
      return [
        { items: commonTop },
        {
          groupLabel: "Fee Management",
          items: [
            { icon: CreditCard,   label: "Fee Collection",    href: "/dashboard/fees" },
            { icon: DollarSign,   label: "Fee Structure",     href: "/dashboard/accountant/fee-structure" },
            { icon: Receipt,      label: "Transactions",      href: "/dashboard/accountant/transactions" },
            { icon: TimerReset,   label: "Overdue Fees",      href: "/dashboard/accountant/overdue" },
          ],
        },
        {
          groupLabel: "Reports",
          items: [
            { icon: BarChart3,    label: "Financial Report",  href: "/dashboard/accountant/reports" },
            { icon: PieChart,     label: "Fee Analytics",     href: "/dashboard/accountant/analytics" },
            { icon: Printer,      label: "Generate Invoice",  href: "/dashboard/accountant/invoice" },
          ],
        },
        {
          groupLabel: "Communication",
          items: [
            { icon: Megaphone,    label: "Notices",           href: "/dashboard/notices" },
          ],
        },
      ];

    // 
    case "TEACHER":
      return [
        { items: commonTop },
        {
          groupLabel: "My Classes",
          items: [
            { icon: GraduationCap, label: "My Students",      href: "/dashboard/teacher/students" },
            { icon: CalendarDays,  label: "Timetable",        href: "/dashboard/timetable" },
            { icon: CalendarCheck, label: "Attendance",       href: "/dashboard/attendances" },
          ],
        },
        {
          groupLabel: "Academics",
          items: [
            { icon: ClipboardList, label: "Exams",            href: "/dashboard/exam" },
            { icon: ClipboardEdit, label: "Mark Results",     href: "/dashboard/result" },
            { icon: BookOpen,      label: "Subjects",         href: "/dashboard/subject" },
            { icon: BookMarked,    label: "Homework",         href: "/dashboard/teacher/homework" },
          ],
        },
        {
          groupLabel: "Communication",
          items: [
            { icon: Megaphone,     label: "Notices",          href: "/dashboard/notices" },
            { icon: MessageSquare, label: "My Profile",       href: "/dashboard/teacher/profile" },
          ],
        },
      ];

    // 
    case "STUDENT":
      return [
        { items: commonTop },
        {
          groupLabel: "Academics",
          items: [
            { icon: CalendarDays,  label: "Timetable",        href: "/dashboard/timetable" },
            { icon: CalendarCheck, label: "Attendance",       href: "/dashboard/student/attendance" },
            { icon: ClipboardList, label: "Exams",            href: "/dashboard/student/exams" },
            { icon: Award,         label: "Results",          href: "/dashboard/result" },
          ],
        },
        {
          groupLabel: "Finance",
          items: [
            { icon: Wallet,        label: "My Fees",          href: "/dashboard/fees" },
            { icon: Receipt,       label: "Payment History",  href: "/dashboard/student/payments" },
          ],
        },
        {
          groupLabel: "Information",
          items: [
            { icon: Megaphone,     label: "Notices",          href: "/dashboard/notices" },
            { icon: UserRound,     label: "My Profile",       href: "/dashboard/student/profile" },
          ],
        },
      ];

    // -------------
    case "PARENT":
      return [
        { items: commonTop },
        {
          groupLabel: "My Children",
          items: [
            { icon: Baby,          label: "Children",         href: "/dashboard/parent/children" },
            { icon: CalendarCheck, label: "Attendance",       href: "/dashboard/parent/attendance" },
            { icon: Award,         label: "Results",          href: "/dashboard/parent/results" },
            { icon: CalendarDays,  label: "Timetable",        href: "/dashboard/parent/timetable" },
          ],
        },
        {
          groupLabel: "Finance",
          items: [
            { icon: Wallet,        label: "Fees",             href: "/dashboard/fees" },
            { icon: Receipt,       label: "Payment History",  href: "/dashboard/parent/payments" },
          ],
        },
        {
          groupLabel: "Information",
          items: [
            { icon: Megaphone,     label: "Notices",          href: "/dashboard/notices" },
            { icon: HeartHandshake,label: "Contact School",   href: "/dashboard/parent/contact" },
          ],
        },
      ];

    // 
    case "EXAM_CONTROLLER":
      return [
        { items: commonTop },
        {
          groupLabel: "Exam Management",
          items: [
            { icon: ClipboardList, label: "Exam Types",        href: "/dashboard/exam-controller/exams" },
            { icon: CalendarRange, label: "Exam Schedules",    href: "/dashboard/exam-controller/schedules" },
          ],
        },
        {
          groupLabel: "Grading & Marks",
          items: [
            { icon: FileSpreadsheet, label: "Grading Rules",   href: "/dashboard/exam-controller/grading" },
            { icon: ClipboardEdit,   label: "Approve Marks",   href: "/dashboard/exam-controller/marks-approval" },
          ],
        },
        {
          groupLabel: "Results",
          items: [
            { icon: CheckSquare,   label: "Publish Results",   href: "/dashboard/exam-controller/publish-results" },
            { icon: UsersRound,    label: "Failed Students",   href: "/dashboard/exam-controller/failed-students" },
          ],
        },
        {
          groupLabel: "Admit Cards",
          items: [
            { icon: Printer,       label: "Admit Cards",       href: "/dashboard/exam-controller/admit-cards" },
          ],
        },
        {
          groupLabel: "Class Routine",
          items: [
            { icon: CalendarDays,  label: "Manage Routine",    href: "/dashboard/exam-controller/routine" },
            { icon: ShieldCheck,   label: "Routine Conflicts", href: "/dashboard/exam-controller/routine-conflicts" },
          ],
        },
        {
          groupLabel: "Communication",
          items: [
            { icon: Megaphone,     label: "Notices",          href: "/dashboard/notices" },
          ],
        },
      ];

    // 
    case "HR":
      return [
        { items: commonTop },
        {
          groupLabel: "Staff Management",
          items: [
            { icon: UserCog,       label: "All Staff",        href: "/dashboard/teachers" },
            { icon: UserPlus,      label: "Recruitment",      href: "/dashboard/hr/recruitment" },
            { icon: FolderOpen,    label: "Staff Profiles",   href: "/dashboard/hr/profiles" },
          ],
        },
        {
          groupLabel: "Recruitment",
          items: [
            { icon: BriefcaseMedical, label: "Jobs",         href: "/dashboard/hr/recruitment/jobs" },
            { icon: Handshake,        label: "Applicants",   href: "/dashboard/hr/recruitment/applicants" },
          ],
        },
        {
          groupLabel: "Profiles",
          items: [
            { icon: UsersRound,    label: "Directory",        href: "/dashboard/hr/profiles/directory" },
            { icon: UserPlus,      label: "New Profile",      href: "/dashboard/hr/profiles/new" },
          ],
        },
        {
          groupLabel: "Attendance & Leave",
          items: [
            { icon: CalendarCheck, label: "Staff Attendance",       href: "/dashboard/hr/attendance" },
            { icon: TimerReset,    label: "Leave Requests",   href: "/dashboard/hr/leave" },
            { icon: CalendarRange, label: "Leave Calendar",   href: "/dashboard/hr/leave-calendar" },
          ],
        },
        {
          groupLabel: "Payroll & Reports",
          items: [
            { icon: DollarSign,    label: "Payroll",          href: "/dashboard/hr/payroll" },
            { icon: BarChart3,     label: "HR Reports",       href: "/dashboard/hr/reports" },
            { icon: Award,         label: "Performance",      href: "/dashboard/hr/performance" },
            { icon: Building2,     label: "Departments",      href: "/dashboard/hr/departments" },
          ],
        },
        {
          groupLabel: "Documents & Approvals",
          items: [
            { icon: FileText,      label: "Documents",        href: "/dashboard/hr/documents" },
            { icon: ShieldCheck,   label: "Approvals",        href: "/dashboard/hr/approvals" },
          ],
        },
        {
          groupLabel: "Communication",
          items: [
            { icon: Megaphone,     label: "HR Notices",       href: "/dashboard/notices" },
          ],
        },
      ];

    default:
      return [{ items: commonTop }];
  }
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const RoleBadge = ({ role }: { role: Role }) => {
  const labels: Record<Role, string> = {
    SUPER_ADMIN:     "Super Admin",
    SCHOOL_ADMIN:    "School Admin",
    ACCOUNTANT:      "Accountant",
    TEACHER:         "Teacher",
    STUDENT:         "Student",
    PARENT:          "Parent",
    EXAM_CONTROLLER: "Exam Controller",
    HR:              "HR Manager",
  };
  return (
    <span className="text-xs text-sidebar-muted font-medium tracking-wide">
      {labels[role] ?? role}
    </span>
  );
};

const SidebarContent = ({ showClose, onClose }: { showClose: boolean; onClose: () => void }) => {
  const { role } = useAuth();
  const pathname = usePathname();
  const navGroups = getNavGroups(role);

  return (
    <div className="h-full w-full flex flex-col bg-sidebar-bg text-sidebar-fg">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 px-5 py-5 border-b border-white/10"
      >
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-elegant shrink-0">
          <Logo className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base leading-tight truncate">Greenwood</h1>
          {role && <RoleBadge role={role} />}
        </div>
        {showClose && (
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sidebar-fg hover:bg-white/20 shrink-0"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </motion.div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
        {navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "pt-2" : ""}>
            {group.groupLabel && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted/60 select-none">
                {group.groupLabel}
              </p>
            )}
            {group.items.map((item, i) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(`${item.href}/`));
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * (gi * 5 + i) }}
                  className="relative"
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg gradient-primary shadow-elegant"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Link
                    href={item.href}
                    onClick={() => showClose && onClose()}
                    className={`relative z-10 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5 group`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? "text-white" : "text-sidebar-muted"
                      }`}
                    />
                    <span className={isActive ? "text-white" : "text-sidebar-fg"}>
                      {item.label}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-muted hover:bg-white/5 hover:text-sidebar-fg transition-colors">
          <HelpCircle className="w-4 h-4" /> Support
        </button>
        <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-muted hover:bg-white/5 hover:text-sidebar-fg transition-colors">
          <Settings className="w-4 h-4" /> Settings
        </button>
      </div>
    </div>
  );
};

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex sticky top-0 h-screen w-64 shrink-0">
        <SidebarContent showClose={false} onClose={onClose} />
      </div>

      {/* Mobile overlay */}
      <div className="lg:hidden">
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
        <motion.aside
          initial={false}
          animate={{ x: isOpen ? 0 : -320 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="fixed left-0 top-0 z-50 h-screen w-64 shadow-elegant"
        >
          <SidebarContent showClose={true} onClose={onClose} />
        </motion.aside>
      </div>
    </>
  );
};
