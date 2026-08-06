"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Briefcase,
  CalendarDays,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useMyProfile } from "@/app/modules/teachers/useTeachers";
import { Teacher } from "@/app/modules/teachers/teacher.types";
import { formatDate } from "@/lib/utils";

export default function Page() {
  const router = useRouter();
  const { role } = useAuth();
  const profileQuery = useMyProfile();

  useEffect(() => {
    if (role && role !== "TEACHER" && role !== "SUPER_ADMIN" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const teacher = profileQuery.data as Teacher | undefined;

  const profileSections = useMemo(() => {
    if (!teacher) return [];
    return [
      {
        title: "Personal Information",
        icon: User,
        items: [
          { label: "Full Name", value: teacher.name, icon: User },
          { label: "Email", value: teacher.email, icon: Mail },
          { label: "Phone", value: teacher.phone || "—", icon: Phone },
          { label: "Gender", value: teacher.gender || "—", icon: User },
          { label: "Date of Birth", value: teacher.dateOfBirth ? formatDate(teacher.dateOfBirth) : "—", icon: CalendarDays },
        ],
      },
      {
        title: "Professional Details",
        icon: Briefcase,
        items: [
          { label: "Employee ID", value: teacher.employeeId || "—" },
          { label: "Designation", value: teacher.designation || "—" },
          { label: "Department", value: teacher.department || "—" },
          { label: "Qualification", value: teacher.qualification || "—" },
          { label: "Experience", value: teacher.experience ? `${teacher.experience} years` : "—" },
          { label: "Joining Date", value: teacher.joiningDate ? formatDate(teacher.joiningDate) : "—", icon: CalendarDays },
        ],
      },
      {
        title: "Academic Assignments",
        icon: BookOpen,
        items: [
          { label: "Subject", value: teacher.subject || "—", icon: BookOpen },
          { label: "Assigned Classes", value: teacher.classes?.length ? teacher.classes.join(", ") : "—", icon: Users },
        ],
        extra: teacher.subjectAssignments?.length
          ? {
              title: "Subject Assignments",
              items: teacher.subjectAssignments.map((sa) => sa.subject?.name || "—"),
            }
          : null,
      },
    ];
  }, [teacher]);

  const handleRefresh = () => {
    profileQuery.refetch();
    toast.success("Profile refreshed");
  };

  if (profileQuery.isLoading) {
    return (
      <div className="relative min-h-[80vh] flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
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
        <div className="relative w-full">
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-8 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="relative min-h-[80vh] flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
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
        <div className="relative text-center">
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-8">
            <p className="text-slate-600 dark:text-slate-300">Unable to load profile.</p>
            <button
              onClick={handleRefresh}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-4 py-2 text-xs font-semibold text-white shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh] flex items-start sm:items-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
      {/* Animated background orbs */}
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
        className="relative w-full my-6"
      >
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          {/* Gradient Header */}
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
                  <User className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    My Profile
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    View and manage your personal profile.
                  </p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {/* Profile Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm p-4 sm:p-6 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white text-2xl font-bold">
                  {teacher.name?.charAt(0)?.toUpperCase() || "T"}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">{teacher.name}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{teacher.designation || "Teacher"}</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Mail className="w-3 h-3" />
                      {teacher.email}
                    </span>
                    {teacher.phone && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <Phone className="w-3 h-3" />
                        {teacher.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Profile Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {profileSections.map((section, idx) => {
                const Icon = section.icon;
                return (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm p-4 sm:p-6 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{section.title}</h3>
                    </div>
                    <div className="space-y-3">
                      {section.items.map((item) => (
                        <div key={item.label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                            {item.label}
                          </span>
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium text-right">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    {section.extra && (
                      <div className="mt-4 pt-4 border-t border-white/40 dark:border-white/10">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-2">
                          {section.extra.title}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {section.extra.items.map((name, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-full border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          My Profile
        </motion.p>
      </motion.div>
    </div>
  );
}
