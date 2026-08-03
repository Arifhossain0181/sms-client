"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, XCircle, CheckCircle, Building2, Users, GraduationCap, X } from "lucide-react";
import type { Role } from "@/tyPes/auth.tyPes";

type School = {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  principalName?: string;
  principalEmail?: string;
  isActive: boolean;
  academicYear?: string;
  gradingScale?: string;
  createdAt: string;
  stats: { students: number; teachers: number; staff: number; classes: number; admins: number };
  subscription?: { plan: string; status: string; startDate: string; endDate: string; amount?: number } | null;
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
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export default function SuperAdminSchoolsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    principalName: "",
    principalEmail: "",
    academicYear: "",
    gradingScale: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const res = await api.get("/super-admin/schools");
      const payload = res.data?.data ?? res.data;
      setSchools(Array.isArray(payload) ? payload : []);
    } catch {
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setModalMode("create");
    setSelectedSchool(null);
    setForm({ name: "", code: "", address: "", phone: "", email: "", principalName: "", principalEmail: "", academicYear: "", gradingScale: "" });
    setShowModal(true);
  };

  const openEdit = (school: School) => {
    setModalMode("edit");
    setSelectedSchool(school);
    setForm({
      name: school.name,
      code: school.code,
      address: school.address ?? "",
      phone: school.phone ?? "",
      email: school.email ?? "",
      principalName: school.principalName ?? "",
      principalEmail: school.principalEmail ?? "",
      academicYear: school.academicYear ?? "",
      gradingScale: school.gradingScale ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === "create") {
        await api.post("/super-admin/schools", form);
      } else if (selectedSchool) {
        await api.put(`/super-admin/schools/${selectedSchool.id}`, form);
      }
      setShowModal(false);
      loadSchools();
    } catch {
      // handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async (schoolId: string) => {
    if (!confirm("Are you sure you want to suspend this school?")) return;
    try {
      await api.post(`/super-admin/schools/${schoolId}/suspend`);
      loadSchools();
    } catch {}
  };

  const handleReactivate = async (schoolId: string) => {
    try {
      await api.post(`/super-admin/schools/${schoolId}/reactivate`);
      loadSchools();
    } catch {}
  };

  const handleDelete = async (schoolId: string) => {
    if (!confirm("Are you sure? This will permanently delete the school and all related data.")) return;
    try {
      await api.delete(`/super-admin/schools/${schoolId}`);
      loadSchools();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Schools</h1>
          <p className="text-muted-foreground mt-1">Onboard and manage school branches.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium shadow-elegant hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Onboard School
        </button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 shadow-soft">
        <div className="p-6 border-b border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">All Schools</h3>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search schools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading schools...</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground">No schools found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((school, idx) => (
                <motion.div
                  key={school.id}
                  custom={idx}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="rounded-xl border border-border/60 bg-secondary/20 p-5 hover:border-border transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{school.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Code: {school.code}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        school.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {school.isActive ? "Active" : "Suspended"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-secondary/40 p-2 text-center">
                      <p className="text-[10px] text-muted-foreground">Students</p>
                      <p className="text-sm font-semibold">{school.stats?.students ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/40 p-2 text-center">
                      <p className="text-[10px] text-muted-foreground">Teachers</p>
                      <p className="text-sm font-semibold">{school.stats?.teachers ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/40 p-2 text-center">
                      <p className="text-[10px] text-muted-foreground">Classes</p>
                      <p className="text-sm font-semibold">{school.stats?.classes ?? 0}</p>
                    </div>
                  </div>

                  {school.subscription && (
                    <div className="mt-3 text-[10px] text-muted-foreground">
                      Plan: <span className="font-medium">{school.subscription.plan}</span> · Status:{" "}
                      <span className="font-medium">{school.subscription.status}</span>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/super-admin/users?schoolId=${school.id}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary text-xs font-medium transition-colors"
                      title="View Users"
                    >
                      <Users className="w-3.5 h-3.5" /> Users
                    </button>
                    <button
                      onClick={() => openEdit(school)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary text-xs font-medium transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    {school.isActive ? (
                      <button
                        onClick={() => handleSuspend(school.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivate(school.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-medium transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Reactivate
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(school.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition-colors ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl border border-border/60 shadow-elegant w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-border/60 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{modalMode === "create" ? "Onboard New School" : "Edit School"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">School Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">School Code *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    disabled={modalMode === "edit"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Principal Name</label>
                  <input
                    type="text"
                    value={form.principalName}
                    onChange={(e) => setForm({ ...form, principalName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Principal Email</label>
                  <input
                    type="email"
                    value={form.principalEmail}
                    onChange={(e) => setForm({ ...form, principalEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={form.academicYear}
                    onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                    placeholder="e.g. 2024-2025"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Grading Scale</label>
                  <input
                    type="text"
                    value={form.gradingScale}
                    onChange={(e) => setForm({ ...form, gradingScale: e.target.value })}
                    placeholder="e.g. A+, A, B, C, D, F"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium shadow-elegant hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : modalMode === "create" ? "Create School" : "Update School"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
