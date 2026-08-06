"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookMarked,
  CalendarDays,
  ChevronDown,
  Clock3,
  FileDown,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useClasses } from "@/app/modules/class/useClasses";
import { useSubjects } from "@/app/modules/subject/useSubjects";
import { useTeachers } from "@/app/modules/teachers/useTeachers";
import {
  useMyHomework,
  useOverdueHomework,
  useCreateHomework,
  useUpdateHomework,
  useMarkHomeworkReviewed,
  useDeleteHomework,
} from "@/app/modules/homework/useHomework";
import {
  Homework,
  HomeworkStatusFilter,
  CreateHomeworkPayload,
} from "@/app/modules/homework/homework.types";
import { formatDate } from "@/lib/utils";

type TeacherProfile = {
  id: string;
  name?: string;
  sectionTeacher?: Array<{
    id: string;
    class?: { id: string; name: string };
  }>;
};

type TabType = "list" | "overdue";

const HOMEWORK_STATUSES: { key: HomeworkStatusFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "REVIEWED", label: "Reviewed" },
  { key: "OVERDUE", label: "Overdue" },
];

const PAGE_SIZE = 10;

function getStatusMeta(status: string, isOverdue: boolean) {
  if (status === "REVIEWED")
    return {
      label: "Reviewed",
      badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-500/20",
      dot: "bg-emerald-500",
    };
  if (isOverdue)
    return {
      label: "Overdue",
      badge: "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-200/70 dark:border-rose-500/20",
      dot: "bg-rose-500",
    };
  return {
    label: "Pending",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-200/70 dark:border-amber-500/20",
    dot: "bg-amber-500",
  };
}

export default function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: subjects } = useSubjects();
  const { data: teachers } = useTeachers();

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("list");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [status, setStatus] = useState<HomeworkStatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [formSectionId, setFormSectionId] = useState("");
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useCreateHomework();
  const updateMutation = useUpdateHomework();
  const markReviewedMutation = useMarkHomeworkReviewed();
  const deleteMutation = useDeleteHomework();

  useEffect(() => {
    if (role && role !== "TEACHER" && role !== "SUPER_ADMIN" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const res = await api.get("/teachers/me");
        const payload = res.data?.data ?? res.data;
        setProfile(payload ?? null);
      } catch {
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    if (role === "TEACHER" || role === "SCHOOL_ADMIN" || role === "SUPER_ADMIN") {
      loadProfile();
    } else {
      setProfileLoading(false);
    }
  }, [role]);

  const assignedClassIds = useMemo(() => {
    return new Set(profile?.sectionTeacher?.map((entry) => entry.class?.id).filter(Boolean) as string[]);
  }, [profile]);

  const availableClasses = useMemo(() => {
    const list = Array.isArray(classes) ? classes : [];
    if (role === "TEACHER") {
      if (assignedClassIds.size > 0) {
        return list.filter((cls) => assignedClassIds.has(cls.id));
      }
      return [];
    }
    return list;
  }, [classes, assignedClassIds, role]);

  const selectedClass = useMemo(
    () => availableClasses.find((cls) => cls.id === classId),
    [availableClasses, classId]
  );

  const availableSections = useMemo(() => {
    const sections = selectedClass?.sections ?? [];
    if (role === "TEACHER") {
      const assignedSectionIds = new Set(
        profile?.sectionTeacher?.map((entry) => entry.id).filter(Boolean) as string[]
      );
      if (assignedSectionIds.size > 0) {
        return sections.filter((section) => assignedSectionIds.has(section.id));
      }
      return [];
    }
    return sections;
  }, [profile, role, selectedClass]);

  const availableSubjects = useMemo(() => {
    const allSubjects = Array.isArray(subjects) ? subjects : [];
    if (!selectedClass) return allSubjects;
    return allSubjects.filter((sub) => sub.classId === selectedClass.id);
  }, [subjects, selectedClass]);

  useEffect(() => {
    if (!availableClasses.length) return;
    if (!classId || !availableClasses.some((cls) => cls.id === classId)) {
      setClassId(availableClasses[0].id);
    }
  }, [availableClasses, classId]);

  useEffect(() => {
    if (!availableSections.length) {
      setSectionId("");
      return;
    }
    if (!sectionId || !availableSections.some((section) => section.id === sectionId)) {
      setSectionId(availableSections[0].id);
    }
  }, [availableSections, sectionId]);

  const homeworkQuery = useMyHomework({
    sectionId,
    subjectId,
    status: activeTab === "overdue" ? "OVERDUE" : status,
    page,
    pageSize: PAGE_SIZE,
  });

  const overdueQuery = useOverdueHomework();

  const homeworkData = activeTab === "overdue" ? (overdueQuery.data ?? []) : homeworkQuery.data?.data ?? [];
  const total = activeTab === "overdue" ? (overdueQuery.data?.length ?? 0) : homeworkQuery.data?.total ?? 0;
  const totalPages = activeTab === "overdue" ? 1 : Math.ceil(total / PAGE_SIZE);
  const isLoading =
    profileLoading ||
    classesLoading ||
    (activeTab === "list" ? homeworkQuery.isLoading : overdueQuery.isLoading);

  const filteredHomework = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return homeworkData;
    return homeworkData.filter(
      (hw) =>
        hw.title.toLowerCase().includes(q) ||
        hw.description.toLowerCase().includes(q) ||
        hw.section.name.toLowerCase().includes(q) ||
        hw.subject.name.toLowerCase().includes(q)
    );
  }, [homeworkData, search]);

  const summaryStats = useMemo(() => {
    const all = activeTab === "overdue" ? overdueQuery.data ?? [] : homeworkQuery.data?.data ?? [];
    const totalCount = all.length;
    const pending = all.filter((hw) => !hw.isReviewed && !hw.isOverdue).length;
    const reviewed = all.filter((hw) => hw.isReviewed).length;
    const overdue = all.filter((hw) => hw.isOverdue && !hw.isReviewed).length;
    return { total: totalCount, pending, reviewed, overdue };
  }, [activeTab, homeworkQuery.data, overdueQuery.data]);

  const handleRefresh = () => {
    if (activeTab === "list") {
      queryClient.invalidateQueries({ queryKey: ["homework", "mine"] });
    } else {
      queryClient.invalidateQueries({ queryKey: ["homework", "overdue"] });
    }
    toast.success("Data refreshed");
  };

  const openCreateModal = () => {
    setEditingHomework(null);
    setFormSectionId(sectionId || availableSections[0]?.id || "");
    setFormSubjectId("");
    setFormTitle("");
    setFormDescription("");
    setFormDueDate(new Date().toISOString().split("T")[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (hw: Homework) => {
    setEditingHomework(hw);
    setFormSectionId(hw.section.id);
    setFormSubjectId(hw.subject.id);
    setFormTitle(hw.title);
    setFormDescription(hw.description);
    setFormDueDate(hw.dueDate.split("T")[0]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingHomework(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSectionId || !formSubjectId || !formTitle || !formDueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateHomeworkPayload = {
        sectionId: formSectionId,
        subjectId: formSubjectId,
        title: formTitle,
        description: formDescription,
        dueDate: formDueDate,
      };

      if (editingHomework) {
        await updateMutation.mutateAsync({ id: editingHomework.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModal();
    } catch {
      // error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (hw: Homework) => {
    if (!confirm(`Delete homework "${hw.title}"?`)) return;
    try {
      await deleteMutation.mutateAsync(hw.id);
    } catch {
      // error handled by mutation
    }
  };

  const handleMarkReviewed = async (id: string) => {
    try {
      await markReviewedMutation.mutateAsync(id);
    } catch {
      // error handled by mutation
    }
  };

  const formSelectedClass = availableClasses.find((cls) => cls.id === formSectionId);
  const formAvailableSubjects = useMemo(() => {
    const allSubjects = Array.isArray(subjects) ? subjects : [];
    if (!formSelectedClass) return allSubjects;
    return allSubjects.filter((sub) => sub.classId === formSelectedClass.id);
  }, [subjects, formSelectedClass]);

  if (isLoading && !homeworkData.length) {
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
            <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="space-y-3 mt-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-200/50 dark:bg-slate-700/30 rounded-2xl animate-pulse" />
              ))}
            </div>
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
                  <BookMarked className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Homework
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Create, manage, and track homework assignments.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Homework
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {/* Stats Overview */}
            {(summaryStats.total > 0 || !isLoading) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {[
                  {
                    label: "Total",
                    value: summaryStats.total,
                    icon: BookMarked,
                    tint: "from-sky-400 to-indigo-500",
                  },
                  {
                    label: "Pending",
                    value: summaryStats.pending,
                    icon: Clock3,
                    tint: "from-amber-400 to-orange-500",
                  },
                  {
                    label: "Reviewed",
                    value: summaryStats.reviewed,
                    icon: Sparkles,
                    tint: "from-emerald-400 to-green-500",
                  },
                  {
                    label: "Overdue",
                    value: summaryStats.overdue,
                    icon: XCircle,
                    tint: "from-rose-400 to-red-500",
                  },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      whileHover={{ y: -2, scale: 1.01 }}
                      className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-4 shadow-sm"
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl mb-3 flex items-center justify-center bg-gradient-to-br ${stat.tint} text-white shadow-lg`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-white">
                        {isLoading ? "..." : stat.value}
                      </p>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Filters Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm p-4 sm:p-6 shadow-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Class
                  </label>
                  <div className="relative">
                    <select
                      value={classId}
                      onChange={(e) => {
                        setClassId(e.target.value);
                        const next = availableClasses.find((cls) => cls.id === e.target.value);
                        setSectionId(next?.sections?.[0]?.id ?? "");
                      }}
                      className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    >
                      <option value="">Select class</option>
                      {availableClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Section
                  </label>
                  <div className="relative">
                    <select
                      value={sectionId}
                      onChange={(e) => {
                        setSectionId(e.target.value);
                        setPage(1);
                      }}
                      className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    >
                      <option value="">Select section</option>
                      {availableSections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.name} {section.maxCapacity ? `(max ${section.maxCapacity})` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Subject
                  </label>
                  <div className="relative">
                    <select
                      value={subjectId}
                      onChange={(e) => {
                        setSubjectId(e.target.value);
                        setPage(1);
                      }}
                      className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    >
                      <option value="">Select subject</option>
                      {availableSubjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.code})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value as HomeworkStatusFilter);
                        setPage(1);
                      }}
                      className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    >
                      {HOMEWORK_STATUSES.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Tabs & Actions */}
              <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="inline-flex rounded-2xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 p-1">
                  {([
                    { key: "list" as TabType, label: "All Homework", icon: BookMarked },
                    { key: "overdue" as TabType, label: "Overdue", icon: Clock3 },
                  ]).map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => {
                          setActiveTab(tab.key);
                          setPage(1);
                        }}
                        className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                          isActive
                            ? "text-white"
                            : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5"
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="homeworkTab"
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className="relative flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefresh}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Homework Table */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm shadow-sm overflow-hidden"
            >
              {/* Search bar */}
              <div className="p-4 sm:p-5 border-b border-white/40 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                    {activeTab === "overdue" ? "Overdue Homework" : "My Homework"}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {activeTab === "overdue"
                      ? "Homework that is past due and not yet reviewed"
                      : "Manage your homework assignments and track student views"}
                  </p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title or subject..."
                    className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 pl-10 pr-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                  />
                </div>
              </div>

              {!sectionId ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/20 dark:via-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                  >
                    <BookMarked className="w-10 h-10 text-indigo-600 dark:text-indigo-300" />
                  </motion.div>
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                    Select a section
                  </h3>
                  <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                    Choose a class and section above to view homework.
                  </p>
                </div>
              ) : filteredHomework.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/20 dark:via-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                  >
                    <BookMarked className="w-10 h-10 text-indigo-600 dark:text-indigo-300" />
                  </motion.div>
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                    No homework found
                  </h3>
                  <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                    {activeTab === "overdue"
                      ? "No overdue homework. Great job!"
                      : "Create your first homework assignment to get started."}
                  </p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5">
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Title
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Section
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Subject
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                          Due Date
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                          Status
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                          Views
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40 dark:divide-white/10">
                      <AnimatePresence mode="popLayout">
                        {filteredHomework.map((hw, index) => {
                          const statusMeta = getStatusMeta(hw.isReviewed ? "REVIEWED" : hw.isOverdue ? "OVERDUE" : "PENDING", hw.isOverdue);
                          const viewProgress = hw.totalStudents
                            ? Math.round(((hw.viewedCount ?? 0) / hw.totalStudents) * 100)
                            : 0;
                          return (
                            <motion.tr
                              key={hw.id}
                              layout
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -30, scale: 0.98 }}
                              transition={{
                                delay: index * 0.02,
                                type: "spring",
                                stiffness: 120,
                                damping: 18,
                              }}
                              className={`group transition-colors duration-200 ${
                                hw.isOverdue && !hw.isReviewed
                                  ? "bg-rose-50/30 dark:bg-rose-500/5"
                                  : hw.isReviewed
                                    ? "bg-emerald-50/20 dark:bg-emerald-500/5"
                                    : "hover:bg-white/60 dark:hover:bg-white/5"
                              }`}
                            >
                              <td className="px-4 sm:px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                                      hw.isOverdue && !hw.isReviewed
                                        ? "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300"
                                        : hw.isReviewed
                                          ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                                          : "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300"
                                    }`}
                                  >
                                    {hw.title.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-medium text-slate-800 dark:text-white truncate block max-w-[200px]">
                                      {hw.title}
                                    </span>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
                                      {hw.description}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                  {hw.section.name}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                  {hw.subject.name}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                                  ({hw.subject.code})
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-center">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {formatDate(hw.dueDate)}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${statusMeta.badge}`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`} />
                                  {statusMeta.label}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    {hw.viewedCount ?? 0}/{hw.totalStudents ?? 0}
                                  </span>
                                  {hw.totalStudents ? (
                                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(viewProgress, 100)}%` }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                        className={`h-full rounded-full ${
                                          viewProgress >= 75
                                            ? "bg-emerald-500"
                                            : viewProgress >= 50
                                              ? "bg-amber-500"
                                              : "bg-rose-500"
                                        }`}
                                      />
                                    </div>
                                  ) : null}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => openEditModal(hw)}
                                    className="p-2 rounded-xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10 transition-colors"
                                    title="Edit"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  {!hw.isReviewed && (
                                    <button
                                      onClick={() => handleMarkReviewed(hw.id)}
                                      disabled={markReviewedMutation.isPending}
                                      className="p-2 rounded-xl border border-emerald-200/70 dark:border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                      title="Mark as reviewed"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDelete(hw)}
                                    disabled={deleteMutation.isPending}
                                    className="p-2 rounded-xl border border-rose-200/70 dark:border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer / Pagination */}
              {filteredHomework.length > 0 && activeTab === "list" && (
                <div className="p-4 sm:p-5 border-t border-white/40 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Showing{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {(page - 1) * PAGE_SIZE + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {Math.min(page * PAGE_SIZE, total)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {total}
                    </span>{" "}
                    homework items
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-4 py-2 rounded-xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Page {page} of {totalPages || 1}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="px-4 py-2 rounded-xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
              {isModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                  onClick={closeModal}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative w-full max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/40 dark:border-white/10 shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5">
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                        {editingHomework ? "Edit Homework" : "Create Homework"}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {editingHomework
                          ? "Update the homework assignment details."
                          : "Assign new homework to your students."}
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                          Section <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={formSectionId}
                            onChange={(e) => {
                              setFormSectionId(e.target.value);
                              setFormSubjectId("");
                            }}
                            className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                          >
                            <option value="">Select section</option>
                            {availableSections.map((section) => (
                              <option key={section.id} value={section.id}>
                                {section.name} {section.maxCapacity ? `(max ${section.maxCapacity})` : ""}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                          Subject <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={formSubjectId}
                            onChange={(e) => setFormSubjectId(e.target.value)}
                            className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                          >
                            <option value="">Select subject</option>
                            {formAvailableSubjects.map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name} ({sub.code})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                          Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          placeholder="Enter homework title"
                          className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                          Description
                        </label>
                        <textarea
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          placeholder="Enter homework description..."
                          rows={3}
                          className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                          Due Date <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formDueDate}
                          onChange={(e) => setFormDueDate(e.target.value)}
                          className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="px-5 py-2.5 rounded-xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <BookMarked className="w-4 h-4" />
                          )}
                          {editingHomework ? "Update" : "Create"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          Homework
        </motion.p>
      </motion.div>
    </div>
  );
}