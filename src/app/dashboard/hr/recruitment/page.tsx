"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { Briefcase, Users, Award, Plus, Building2, X } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type RecruitmentStats = {
  totalPostings: number;
  openPostings: number;
  totalApplicants: number;
  shortlisted: number;
  offersSent: number;
  offersAccepted: number;
};

type JobPosting = {
  id: string;
  title: string;
  designation: string;
  vacancies: number;
  deadline: string;
  status: string;
  department?: { name: string };
  applicantCount?: number;
};

type Department = {
  id: string;
  name: string;
  code?: string;
  description?: string;
};

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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function RecruitmentDashboard() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [stats, setStats] = useState<RecruitmentStats | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [savingDept, setSavingDept] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [savingEditDept, setSavingEditDept] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: "",
    designation: "",
    vacancies: "",
    deadline: "",
    departmentId: "",
    status: "OPEN",
  });
  const [deptForm, setDeptForm] = useState({ name: "", code: "", description: "" });

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const canCreateDepartment = role === "HR" || role === "SCHOOL_ADMIN" || role === "SUPER_ADMIN";

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, jobsRes, deptsRes] = await Promise.allSettled([
          api.get("/recruitment/dashboard"),
          api.get("/recruitment/jobs?limit=10"),
          api.get("/hr/departments"),
        ]);

        if (!cancelled) {
          if (statsRes.status === "fulfilled") {
            const payload = statsRes.value.data?.data ?? statsRes.value.data;
            setStats(payload);
          }
          if (jobsRes.status === "fulfilled") {
            const payload = jobsRes.value.data?.data ?? jobsRes.value.data;
            setJobs(payload.postings ?? []);
          }
          if (deptsRes.status === "fulfilled") {
            const payload = deptsRes.value.data?.data ?? deptsRes.value.data;
            setDepartments(Array.isArray(payload) ? payload : []);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const updateJobForm = (field: string, value: string) => {
    setJobForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingJob(true);
    try {
      const payload: Record<string, any> = {
        title: jobForm.title,
        designation: jobForm.designation,
        vacancies: Number(jobForm.vacancies),
        deadline: jobForm.deadline,
        status: jobForm.status,
        departmentId: jobForm.departmentId || undefined,
      };
      await api.post("/recruitment/jobs", payload);
      setJobForm({ title: "", designation: "", vacancies: "", deadline: "", departmentId: "", status: "OPEN" });
      setShowJobForm(false);
      const res = await api.get("/recruitment/jobs?limit=10");
      const data = res.data?.data ?? res.data;
      setJobs(data.postings ?? []);
      const statsRes = await api.get("/recruitment/dashboard");
      const statsPayload = statsRes.data?.data ?? statsRes.data;
      setStats(statsPayload);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Failed to create job posting");
    } finally {
      setSavingJob(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDept(true);
    try {
      await api.post("/hr/departments", deptForm);
      setDeptForm({ name: "", code: "", description: "" });
      setShowDeptForm(false);
      const res = await api.get("/hr/departments");
      const payload = res.data?.data ?? res.data;
      setDepartments(Array.isArray(payload) ? payload : []);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Failed to create department");
    } finally {
      setSavingDept(false);
    }
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    setSavingEditDept(true);
    try {
      await api.patch(`/hr/departments/${editingDept.id}`, {
        name: editingDept.name,
        code: editingDept.code,
        description: editingDept.description,
      });
      setEditingDept(null);
      const res = await api.get("/hr/departments");
      const payload = res.data?.data ?? res.data;
      setDepartments(Array.isArray(payload) ? payload : []);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Failed to update department");
    } finally {
      setSavingEditDept(false);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await api.delete(`/hr/departments/${id}`);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Failed to delete department. It might be in use.");
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      OPEN: { cls: "bg-emerald-100 text-emerald-700", label: "Open" },
      CLOSED: { cls: "bg-red-100 text-red-700", label: "Closed" },
      FILLED: { cls: "bg-sky-100 text-sky-700", label: "Filled" },
    };
    const s = map[status] ?? { cls: "bg-gray-100 text-gray-700", label: status };
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
  };

  const statCards = [
    {
      label: "Open Jobs",
      value: stats ? String(stats.openPostings) : "—",
      sub: stats ? `${stats.totalPostings} total postings` : undefined,
      icon: <Briefcase className="h-5 w-5 text-sky-600 dark:text-sky-400" />,
    },
    {
      label: "Total Applicants",
      value: stats ? String(stats.totalApplicants) : "—",
      sub: stats ? `${stats.shortlisted} shortlisted` : undefined,
      icon: <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      label: "Offers",
      value: stats ? String(stats.offersSent) : "—",
      sub: stats ? `${stats.offersAccepted} accepted` : undefined,
      icon: <Award className="h-5 w-5 text-violet-600 dark:text-violet-400" />,
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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

      <div className="relative w-full max-w-none px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden transition-all duration-300 hover:shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)]">
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  Recruitment
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-indigo-400"
                  >
                    <Briefcase className="w-5 h-5" />
                  </motion.span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Job postings, applicant tracking, interviews, and offers
                </p>
              </div>
              <div className="flex items-center gap-3">
                {canCreateDepartment && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDeptForm(!showDeptForm)}
                    className="flex items-center gap-2 rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10"
                  >
                    <Building2 className="h-4 w-4" /> New Department
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowJobForm(!showJobForm)}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-4 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
                >
                  <Plus className="h-4 w-4" /> New Job Post
                </motion.button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {showDeptForm && canCreateDepartment && (
              <motion.form
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleCreateDepartment}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 shadow-xl space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-400" /> Create Department
                  </h3>
                  <button type="button" onClick={() => setShowDeptForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Name *</label>
                    <input
                      required
                      value={deptForm.name}
                      onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                      placeholder="e.g. Mathematics"
                      className="w-full rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Code</label>
                    <input
                      value={deptForm.code}
                      onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                      placeholder="e.g. MATH"
                      className="w-full rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Description</label>
                    <input
                      value={deptForm.description}
                      onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                      placeholder="Brief description"
                      className="w-full rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={savingDept}
                    className="rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-4 py-2 text-sm font-semibold shadow-md shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingDept ? "Creating..." : "Create"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowDeptForm(false)}
                    className="rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10"
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.form>
            )}

            {showJobForm && (
              <motion.form
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleCreateJob}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 shadow-xl space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-400" /> Create Job Posting
                  </h3>
                  <button type="button" onClick={() => setShowJobForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Job Title *</label>
                    <input
                      required
                      value={jobForm.title}
                      onChange={(e) => updateJobForm("title", e.target.value)}
                      placeholder="e.g. Senior Mathematics Teacher"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Designation *</label>
                    <input
                      required
                      value={jobForm.designation}
                      onChange={(e) => updateJobForm("designation", e.target.value)}
                      placeholder="e.g. Teacher, Accountant, Admin"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Vacancies *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={jobForm.vacancies}
                      onChange={(e) => updateJobForm("vacancies", e.target.value)}
                      placeholder="1"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Deadline *</label>
                    <input
                      required
                      type="date"
                      value={jobForm.deadline}
                      onChange={(e) => updateJobForm("deadline", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Department</label>
                    <select
                      value={jobForm.departmentId}
                      onChange={(e) => updateJobForm("departmentId", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    >
                      <option value="">Select department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Status</label>
                    <select
                      value={jobForm.status}
                      onChange={(e) => updateJobForm("status", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    >
                      <option value="OPEN">Open</option>
                      <option value="CLOSED">Closed</option>
                      <option value="FILLED">Filled</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={savingJob}
                    className="rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-4 py-2 text-sm font-semibold shadow-md shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingJob ? "Creating..." : "Create Job Post"}
                  </motion.button>
                  <button type="button" onClick={() => setShowJobForm(false)} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10">
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    <Skeleton className="w-14 h-14 rounded-2xl shrink-0 mb-4" />
                    <Skeleton className="h-3 w-32 rounded-md mb-2" />
                    <Skeleton className="h-6 w-12 rounded-md" />
                  </div>
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {statCards.map((card, i) => (
                  <motion.div
                    key={card.label}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {card.icon}
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {card.label}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                        {card.value}
                      </p>
                      {card.sub && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {card.sub}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                >
                  <Briefcase className="w-10 h-10 text-indigo-400" />
                </motion.div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  No recruitment data available
                </h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  Create your first job posting to get started.
                </p>
              </motion.div>
            )}

            {jobs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Job Postings</h3>
                <div className="space-y-3">
                  {jobs.map((job, idx) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:bg-white/80 dark:hover:bg-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 shrink-0">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{job.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {job.designation} · {job.department?.name ?? "—"} · {job.vacancies} vacancy/ies
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(job.status)}
                        <button
                          onClick={() => router.push(`/dashboard/hr/recruitment/jobs/${job.id}`)}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          View
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <button
                  onClick={() => router.push("/dashboard/hr/recruitment/jobs")}
                  className="mt-4 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View all job postings →
                </button>
              </motion.div>
            )}

            {departments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 shadow-xl"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" /> Departments
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map((dept, idx) => (
                    <motion.div
                      key={dept.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-4 shadow-sm relative group"
                    >
                      {editingDept?.id === dept.id ? (
                        <form onSubmit={handleUpdateDepartment} className="space-y-3">
                          <input
                            required
                            value={editingDept.name}
                            onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                            placeholder="Department Name"
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-2 py-1 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                          <input
                            value={editingDept.code ?? ""}
                            onChange={(e) => setEditingDept({ ...editingDept, code: e.target.value })}
                            placeholder="Code"
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-2 py-1 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                          <input
                            value={editingDept.description ?? ""}
                            onChange={(e) => setEditingDept({ ...editingDept, description: e.target.value })}
                            placeholder="Description"
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-2 py-1 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={savingEditDept}
                              className="text-xs bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingDept(null)}
                              className="text-xs border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="pr-12">
                            <h4 className="font-semibold text-slate-900 dark:text-white truncate" title={dept.name}>
                              {dept.name}
                            </h4>
                            {dept.code && (
                              <p className="text-xs font-mono text-indigo-500 mt-1">{dept.code}</p>
                            )}
                            {dept.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2" title={dept.description}>
                                {dept.description}
                              </p>
                            )}
                          </div>
                          {canCreateDepartment && (
                            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingDept(dept)}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteDepartment(dept.id)}
                                className="text-xs text-red-600 dark:text-red-400 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
