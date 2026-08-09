"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  Inbox,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  UserRound,
  School,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useMyProfile } from "@/app/modules/teachers/useTeachers";
import { useClasses } from "@/app/modules/class/useClasses";

type Student = {
  id: string;
  studentId?: string;
  name: string;
  email?: string;
  guardianEmail?: string;
  phone?: string | null;
  address?: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | string;
  dateOfBirth?: string;
  bloodGroup?: string;
  religion?: string;
  rollNumber?: string | number;
  section?: {
    id: string;
    name: string;
  };
  class?: {
    id: string;
    name: string;
  };
  createdAt?: string;
  isActive?: boolean;
  parent?: {
    name?: string;
    phone?: string;
    relation?: string;
    email?: string;
  };
};

type Meta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const LIMIT = 12;

function fmtDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function genderLabel(gender?: string) {
  if (!gender) return "Unknown";
  return gender.charAt(0) + gender.slice(1).toLowerCase();
}

function genderTone(gender?: string) {
  switch (gender) {
    case "MALE":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "FEMALE":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function getStudentTitle(student: Student) {
  const roll = student.rollNumber ? `Roll #${student.rollNumber}` : "No roll";
  const className = student.class?.name ?? "Class";
  const sectionName = student.section?.name ? ` • ${student.section.name}` : "";
  return `${className}${sectionName} • ${roll}`;
}

export default function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { data: profile, isLoading: profileLoading } = useMyProfile(role === "TEACHER");
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const teacherId = profile?.id ?? "";
  const canLoad = role === "TEACHER" && !!teacherId;

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Student | null>(null);

  const selectedClass = useMemo(
    () => classes.find((cls: any) => cls.id === classId),
    [classes, classId]
  );

  const availableSections = useMemo(() => {
    if (!selectedClass) return [];
    return selectedClass.sections ?? [];
  }, [selectedClass]);

  const effectiveClassId = classId || (classes[0]?.id ?? "");
  const effectiveSectionId = sectionId || availableSections[0]?.id || "";

  const { data: response = { list: [], meta: { total: 0, page: 1, limit: LIMIT, totalPages: 1 } }, isLoading, error, refetch } = useQuery({
    queryKey: ["teacher-students", teacherId, effectiveClassId, effectiveSectionId, search, genderFilter, page],
    queryFn: async () => {
      if (!teacherId) return { list: [], meta: { total: 0, page: 1, limit: LIMIT, totalPages: 1 } };
      const params: Record<string, string> = {
        page: String(page),
        limit: String(LIMIT),
        ...(search.trim() && { search: search.trim() }),
        ...(genderFilter && { gender: genderFilter }),
        ...(effectiveClassId && { classId: effectiveClassId }),
        ...(effectiveSectionId && { sectionId: effectiveSectionId }),
      };
      const res = await api.get(`/teachers/${teacherId}/students`, { params });
      const payload = res.data?.data ?? res.data ?? {};
      const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      const metaData: Meta = payload?.meta ?? {
        total: list.length,
        page,
        limit: LIMIT,
        totalPages: Math.max(1, Math.ceil((list.length || 1) / LIMIT)),
      };
      return { list, meta: metaData };
    },
    enabled: canLoad,
    retry: false,
  });

  const students = response.list;
  const meta = response.meta;

  const studentList = useMemo(() => {
    const list = Array.isArray(students) ? students : [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s: any) =>
        (s.name?.toLowerCase().includes(q) ?? false) ||
        (s.rollNumber && String(s.rollNumber).includes(q))
    );
  }, [students, search]);

  const activeCount = useMemo(
    () => studentList.filter((student) => student.isActive !== false).length,
    [studentList]
  );
  const inactiveCount = studentList.length - activeCount;
  const classCount = useMemo(
    () => new Set(studentList.map((student) => student.class?.id).filter(Boolean)).size,
    [studentList]
  );

  const selectedSince = useMemo(() => fmtDate(selected?.createdAt), [selected]);

  const handleRefresh = () => {
    refetch();
    toast.success("Students refreshed");
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleGenderChange = (value: string) => {
    setGenderFilter(value);
    setPage(1);
  };

  const handleClassChange = (value: string) => {
    setClassId(value);
    setSectionId("");
    setPage(1);
  };

  const handleSectionChange = (value: string) => {
    setSectionId(value);
    setPage(1);
  };

  useEffect(() => {
    if (role && role !== "TEACHER" && role !== "SUPER_ADMIN" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  if (role === "TEACHER" && profileLoading) {
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
            <div className="h-8 w-1/3 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-4 w-1/2 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!canLoad) {
    return (
      <div className="w-full max-w-none rounded-3xl border border-rose-200/60 bg-rose-50/70 p-6 text-rose-800 shadow-sm">
        <p className="font-semibold">Teacher student list is available for teacher accounts only.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh] flex items-start sm:items-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
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
                  <GraduationCap className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    My Students
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    View students from your assigned classes, filterable by class and section.
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

          <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Total", value: (meta?.total ?? studentList.length).toString(), icon: Users, tint: "from-sky-400 to-indigo-500" },
                { label: "Classes", value: String(classCount), icon: School, tint: "from-violet-400 to-indigo-500" },
                { label: "Active", value: String(activeCount), icon: UserRound, tint: "from-emerald-400 to-green-500" },
                { label: "Inactive", value: String(inactiveCount), icon: Clock3, tint: "from-rose-400 to-red-500" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    whileHover={{ y: -2, scale: 1.01 }}
                    className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-4 shadow-sm"
                  >
                    <div className={`w-11 h-11 rounded-2xl mb-3 flex items-center justify-center bg-gradient-to-br ${item.tint} text-white shadow-lg`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">{item.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-white">{item.value}</p>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-4">
              <div className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm p-4 sm:p-5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Class</label>
                    <div className="relative">
                      <select
                        value={classId || effectiveClassId}
                        onChange={(e) => handleClassChange(e.target.value)}
                        disabled={classesLoading}
                        className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30 disabled:opacity-60"
                      >
                        <option value="">Select class</option>
                        {(Array.isArray(classes) ? classes : []).map((cls: any) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Section</label>
                    <div className="relative">
                      <select
                        value={sectionId || effectiveSectionId}
                        onChange={(e) => handleSectionChange(e.target.value)}
                        disabled={availableSections.length === 0}
                        className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30 disabled:opacity-60"
                      >
                        <option value="">Select section</option>
                        {availableSections.map((section: any) => (
                          <option key={section.id} value={section.id}>
                            {section.name} {section.maxCapacity ? `(max ${section.maxCapacity})` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Search</label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search by name or roll number"
                        className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 pl-10 pr-4 py-3 text-sm text-slate-700 dark:text-slate-200 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <select
                      value={genderFilter}
                      onChange={(e) => handleGenderChange(e.target.value)}
                      className="appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-2.5 pr-10 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    >
                      <option value="">All genders</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  </div>

                  <button
                    onClick={() => {
                      setSearch("");
                      setGenderFilter("");
                      setClassId("");
                      setSectionId("");
                      setPage(1);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-white/40 dark:border-white/10 bg-gradient-to-br from-sky-50/90 via-indigo-50/70 to-violet-50/90 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 backdrop-blur-sm p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Class snapshot</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {effectiveClassId ? (selectedClass?.name ?? "Class") : "All classes"}
                      {effectiveSectionId ? ` • ${availableSections.find((s: any) => s.id === effectiveSectionId)?.name ?? "Section"}` : ""}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-white/40 dark:border-white/10 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Total</p>
                    <p className="mt-1 text-lg font-bold text-slate-800 dark:text-white">{meta?.total ?? studentList.length}</p>
                  </div>
                  <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-white/40 dark:border-white/10 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Page</p>
                    <p className="mt-1 text-lg font-bold text-slate-800 dark:text-white">{meta?.page ?? page}</p>
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="divide-y divide-white/40 dark:divide-white/10 max-h-[45vh] overflow-y-auto">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 sm:p-5 flex items-center gap-4">
                    <div className="h-11 w-11 rounded-2xl bg-slate-200/70 animate-pulse" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-1/3 rounded bg-slate-200/70" />
                      <div className="h-3 w-1/2 rounded bg-slate-200/70" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-3xl border border-rose-200/60 bg-rose-50/80 p-6 text-rose-800 shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5" />
                  <div>
                    <p className="font-semibold">Could not load students</p>
                    <p className="mt-1 text-sm">{String(error)}</p>
                  </div>
                </div>
              </div>
            ) : studentList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                >
                  <Users className="w-10 h-10 text-indigo-400" />
                </motion.div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No students found</h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  Select a class and section, or clear the search filter.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/40 dark:divide-white/10 max-h-[45vh] overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {studentList.map((student: any, index: number) => (
                    <motion.button
                      key={student.id}
                      type="button"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -30, scale: 0.98 }}
                      transition={{ delay: index * 0.03, type: "spring", stiffness: 120, damping: 18 }}
                      onClick={() => setSelected(student)}
                      className="group w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
                          <UserRound className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white truncate">
                              {student.name}
                            </h3>
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Roll {student.rollNumber ?? "—"}
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${genderTone(student.gender)}`}>
                              {genderLabel(student.gender)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {student.class?.name ?? "Class"} • {student.section?.name ?? "Section"} • {student.studentId ? `ID ${student.studentId}` : `Student ${student.id.slice(0, 8)}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          student.isActive === false
                            ? "bg-rose-50 text-rose-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {student.isActive === false ? "Inactive" : "Active"}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {!isLoading && !error && meta?.totalPages && meta.totalPages > 1 && (
              <div className="flex flex-col gap-3 rounded-3xl border border-white/40 bg-white/80 p-4 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Showing page {meta.page} of {meta.totalPages}. Total {meta.total} students.
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, index) => {
                    const start =
                      meta.totalPages <= 5
                        ? 1
                        : Math.max(1, Math.min(page - 2, meta.totalPages - 4));
                    const current = start + index;

                    return (
                      <button
                        key={current}
                        onClick={() => setPage(current)}
                        className={`h-9 min-w-9 rounded-full px-3 text-xs font-semibold transition ${
                          current === page
                            ? "bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700"
                        }`}
                      >
                        {current}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
                    disabled={page === meta.totalPages}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          Teacher Students
        </motion.p>
      </motion.div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.button
              aria-label="Close student details"
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 120, damping: 16 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/40 bg-white/85 shadow-[0_24px_90px_-40px_rgba(15,23,42,0.5)] backdrop-blur-2xl"
            >
              <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-white font-bold shadow-lg shadow-indigo-500/30">
                      {initials(selected.name)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{selected.name}</h3>
                      <p className="text-sm text-slate-500">{getStudentTitle(selected)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="grid gap-5 p-6 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4">
                  <h4 className="text-sm font-semibold text-slate-900">Academic</h4>
                  <div className="mt-3 space-y-2 text-xs text-slate-700">
                    <DetailLine label="Class" value={selected.class?.name ?? "—"} />
                    <DetailLine label="Section" value={selected.section?.name ?? "—"} />
                    <DetailLine label="Roll" value={selected.rollNumber ?? "—"} />
                    <DetailLine label="Gender" value={genderLabel(selected.gender)} />
                    <DetailLine label="Blood Group" value={selected.bloodGroup ? selected.bloodGroup.replace(/_/g, " ") : "—"} />
                    <DetailLine label="Religion" value={selected.religion ?? "—"} />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4">
                  <h4 className="text-sm font-semibold text-slate-900">Contact</h4>
                  <div className="mt-3 space-y-2 text-xs text-slate-700">
                    <DetailLine label="Email" value={selected.email ?? "—"} />
                    <DetailLine label="Phone" value={selected.phone ?? "—"} />
                    <DetailLine label="Address" value={selected.address ?? "—"} />
                    <DetailLine label="DOB" value={fmtDate(selected.dateOfBirth)} />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4">
                  <h4 className="text-sm font-semibold text-slate-900">Guardian</h4>
                  <div className="mt-3 space-y-2 text-xs text-slate-700">
                    <DetailLine label="Name" value={selected.parent?.name ?? "—"} />
                    <DetailLine label="Phone" value={selected.parent?.phone ?? "—"} />
                    <DetailLine label="Relation" value={selected.parent?.relation ?? "—"} />
                    <DetailLine label="Guardian Email" value={selected.guardianEmail ?? "—"} />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4">
                  <h4 className="text-sm font-semibold text-slate-900">Status</h4>
                  <div className="mt-3 space-y-2 text-xs text-slate-700">
                    <DetailLine label="Status" value={selected.isActive === false ? "Inactive" : "Active"} />
                    <DetailLine label="Joined" value={fmtDate(selected.createdAt)} />
                    <DetailLine label="Student ID" value={selected.studentId ?? selected.id} />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[65%] text-right font-medium text-slate-900 break-words">{String(value)}</span>
    </div>
  );
}
