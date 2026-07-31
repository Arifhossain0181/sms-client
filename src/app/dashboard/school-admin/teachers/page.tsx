"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import { teacherService } from "@/app/modules/teachers/teacher.service";
import { classService } from "@/app/modules/class/class.service";
import { subjectService } from "@/app/modules/subject/subject.service";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  BookOpen,
  Calendar,
  Mars,
  Venus,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import TeacherForm from "@/app/modules/teachers/teacherForm";

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
  classes?: string[];
  isActive?: boolean;
};

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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SchoolAdminTeachersPage() {
  const router = useRouter();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  // ── Role guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (role && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const canCreate = role ? hasPermission(role, "create_teacher") : false;
  const canEdit = role ? hasPermission(role, "edit_teacher") : false;
  const canDelete = role ? hasPermission(role, "delete_teacher") : false;

  // ── State ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [assignSubjectIds, setAssignSubjectIds] = useState<string[]>([]);
  const [assignClassIds, setAssignClassIds] = useState<string[]>([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

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
    enabled: canCreate || canEdit || canDelete,
  });

  const teacherList = Array.isArray(teachers) ? teachers : [];

  // ── Fetch classes & subjects ───────────────────────────────────────────────
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: classService.getAll,
  });

  const classList = Array.isArray(classes) ? classes : [];

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      return await subjectService.getAll(undefined);
    },
  });

  const subjectList = Array.isArray(subjects) ? subjects : [];

  // ── Mutations ──────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => teacherService.delete(id),
    onSuccess: async () => {
      toast.success("Teacher deleted successfully");
      await queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
           ?.message ?? (err instanceof Error ? err.message : "Failed to delete teacher");
      toast.error(msg);
    },
  });

  const assignSubjectsMutation = useMutation({
    mutationFn: ({ id, subjectIds }: { id: string; subjectIds: string[] }) =>
      teacherService.assignSubjects(id, subjectIds),
    onSuccess: async () => {
      toast.success("Subjects assigned successfully");
      await queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setShowSubjectModal(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to assign subjects");
      toast.error(msg);
    },
    onSettled: () => setAssignLoading(false),
  });

  const assignClassesMutation = useMutation({
    mutationFn: ({ id, classIds }: { id: string; classIds: string[] }) =>
      teacherService.assignClasses(id, classIds),
    onSuccess: async () => {
      toast.success("Classes assigned successfully");
      await queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setShowClassModal(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to assign classes");
      toast.error(msg);
    },
    onSettled: () => setAssignLoading(false),
  });

  // ── useMemo: derived values ────────────────────────────────────────────────
  const filterKey = search.toLowerCase().replace(/[^a-z0-9]/g, "");

  const filtered = useMemo(() => {
    if (!filterKey) return teacherList;
    return teacherList.filter((t) => {
      const hay = `${t.name} ${t.email} ${t.phone} ${t.subject ?? ""} ${t.designation ?? ""}`.toLowerCase().replace(/[^a-z0-9]/g, "");
      return hay.includes(filterKey);
    });
  }, [teacherList, filterKey]);

  const totalTeachers = teacherList.length;
  const totalDepartments = useMemo(() => {
    const depts = new Set(teacherList.map((t) => (t as any).department).filter(Boolean));
    return depts.size;
  }, [teacherList]);

  const activeTeachers = useMemo(
    () => teacherList.filter((t) => t.isActive !== false).length,
    [teacherList]
  );

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedTeacher(null);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to deactivate this teacher?")) {
      deleteMutation.mutate(id);
    }
  };

  const openAssignSubjects = (teacher: Teacher) => {
    const currentIds = teacher.subjectAssignments?.map((sa) => sa.subjectId) ?? [];
    setAssignSubjectIds(currentIds);
    setSelectedTeacher(teacher);
    setShowSubjectModal(true);
  };

  const openAssignClasses = (teacher: Teacher) => {
    const currentIds = teacher.sectionTeacher?.map((st) => st.class.id) ?? [];
    setAssignClassIds(currentIds);
    setSelectedTeacher(teacher);
    setShowClassModal(true);
  };

  const handleAssignSubjects = () => {
    if (!selectedTeacher) return;
    setAssignLoading(true);
    assignSubjectsMutation.mutate({ id: selectedTeacher.id, subjectIds: assignSubjectIds });
  };

  const handleAssignClasses = () => {
    if (!selectedTeacher) return;
    setAssignLoading(true);
    assignClassesMutation.mutate({ id: selectedTeacher.id, classIds: assignClassIds });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTeacher(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!canCreate && !canEdit && !canDelete) {
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
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage teaching staff, assign subjects and classes.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        )}
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
            label: "Total Teachers",
            value: totalTeachers,
            color: "text-foreground",
            bg: "bg-secondary/60",
            icon: GraduationCap,
          },
          {
            label: "Departments",
            value: totalDepartments,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/30",
            icon: BookOpen,
          },
          {
            label: "Active",
            value: activeTeachers,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
            icon: Users,
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
            placeholder="Search by name, email, phone or subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors"
        >
          <GraduationCap className="w-4 h-4" /> Refresh
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
                  Teacher
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">
                  Email
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">
                  Phone
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Subject
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Gender
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">
                  Joining Date
                </th>
                {(canEdit || canDelete) && <th className="px-5 py-3.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><Skel className="w-28 h-4" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><Skel className="w-32 h-4" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><Skel className="w-24 h-4" /></td>
                    <td className="px-5 py-4"><Skel className="w-20 h-4" /></td>
                    <td className="px-5 py-4"><Skel className="w-16 h-5 rounded-full" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><Skel className="w-24 h-4" /></td>
                    {(canEdit || canDelete) && <td className="px-5 py-4"><Skel className="w-20 h-8 rounded" /></td>}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={(canEdit || canDelete) ? 7 : 6} className="px-5 py-16 text-center">
                    <GraduationCap className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No teachers found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((teacher) => {
                  const genderIcon =
                    teacher.gender?.toLowerCase() === "female" ? (
                      <Venus className="w-3 h-3" />
                    ) : teacher.gender?.toLowerCase() === "male" ? (
                      <Mars className="w-3 h-3" />
                    ) : (
                      <User className="w-3 h-3" />
                    );
                  const genderColor =
                    teacher.gender?.toLowerCase() === "female"
                      ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"
                      : teacher.gender?.toLowerCase() === "male"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-secondary text-muted-foreground";

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
                              {teacher.classes?.length ? teacher.classes.join(", ") : ""}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{teacher.email}</td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell">{teacher.phone}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg">
                          <BookOpen className="w-3 h-3" />
                          {teacher.subject ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${genderColor}`}>
                          {genderIcon}
                          {teacher.gender}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                        {teacher.joiningDate ? fmt(teacher.joiningDate) : "—"}
                      </td>
                       {(canEdit || canDelete) && (
                         <td className="px-5 py-3.5">
                           <div className="flex items-center justify-end gap-1">
                             {canEdit && (
                               <>
                                 <button
                                   onClick={() => openAssignSubjects(teacher)}
                                   className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
                                   title="Assign subjects"
                                 >
                                   <BookOpen className="w-4 h-4 text-muted-foreground" />
                                 </button>
                                 <button
                                   onClick={() => openAssignClasses(teacher)}
                                   className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
                                   title="Assign classes"
                                 >
                                   <Users className="w-4 h-4 text-muted-foreground" />
                                 </button>
                                 <button
                                   onClick={() => handleEdit(teacher)}
                                   className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
                                   title="Edit teacher"
                                 >
                                   <Pencil className="w-4 h-4 text-muted-foreground" />
                                 </button>
                               </>
                             )}
                             {canDelete && (
                               <button
                                 onClick={() => handleDelete(teacher.id)}
                                 disabled={deleteMutation.isPending}
                                 className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors disabled:opacity-50"
                                 title="Deactivate teacher"
                               >
                                 <Trash2 className="w-4 h-4 text-red-500" />
                               </button>
                             )}
                           </div>
                         </td>
                       )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal */}
      {showModal && (
        <TeacherForm
          teacher={selectedTeacher ?? undefined}
          onClose={handleCloseModal}
        />
      )}

      {/* Subject Assignment Modal */}
      {showSubjectModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSubjectModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/60 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-semibold text-base">Assign Subjects</h2>
              <button onClick={() => setShowSubjectModal(false)} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Select subjects for <span className="font-medium text-foreground">{selectedTeacher.name}</span>
              </p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {subjectList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No subjects available.</p>
                ) : (
                  subjectList.map((subj) => (
                    <label key={subj.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:bg-secondary/20 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={assignSubjectIds.includes(subj.id)}
                        onChange={(e) => {
                          setAssignSubjectIds((prev) =>
                            e.target.checked ? [...prev, subj.id] : prev.filter((id) => id !== subj.id)
                          );
                        }}
                        className="rounded border-gray-300"
                      />
                      <div>
                        <p className="text-sm font-medium">{subj.name}</p>
                        <p className="text-xs text-muted-foreground">{subj.code}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowSubjectModal(false)} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors text-sm font-medium">
                  Cancel
                </button>
                <button onClick={handleAssignSubjects} disabled={assignLoading || assignSubjectsMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {assignLoading || assignSubjectsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Subjects
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Class Assignment Modal */}
      {showClassModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowClassModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/60 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-semibold text-base">Assign Classes</h2>
              <button onClick={() => setShowClassModal(false)} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Select classes for <span className="font-medium text-foreground">{selectedTeacher.name}</span>
              </p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {classList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No classes available.</p>
                ) : (
                  classList.map((cls) => (
                    <label key={cls.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:bg-secondary/20 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={assignClassIds.includes(cls.id)}
                        onChange={(e) => {
                          setAssignClassIds((prev) =>
                            e.target.checked ? [...prev, cls.id] : prev.filter((id) => id !== cls.id)
                          );
                        }}
                        className="rounded border-gray-300"
                      />
                      <div>
                        <p className="text-sm font-medium">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">Level {cls.numericLevel}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowClassModal(false)} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors text-sm font-medium">
                  Cancel
                </button>
                <button onClick={handleAssignClasses} disabled={assignLoading || assignClassesMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {assignLoading || assignClassesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Classes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
