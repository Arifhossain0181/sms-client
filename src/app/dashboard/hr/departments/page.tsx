"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { Plus, Building2 } from "lucide-react";

type Department = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
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

export default function DepartmentsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "", description: "" });

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/hr/departments");
      const payload = res.data?.data ?? res.data;
      setDepartments(Array.isArray(payload) ? payload : []);
    } catch {
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/hr/departments", formData);
      setFormData({ name: "", code: "", description: "" });
      setShowForm(false);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Failed to create department");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground mt-1">
            Configure staff designations, departments, and reporting structure
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Department
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft space-y-4">
          <h3 className="font-semibold">Create Department</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Name *</label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Code</label>
              <input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
              <input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">
              Create
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border/60 px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : departments.length === 0 ? (
          <p className="text-xs text-muted-foreground">No departments found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-border/60 bg-background p-4"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-sky-500" />
                  <div>
                    <p className="font-medium">{d.name}</p>
                    {d.code && (
                      <p className="text-xs text-muted-foreground font-mono">{d.code}</p>
                    )}
                  </div>
                </div>
                {d.description && (
                  <p className="mt-2 text-xs text-muted-foreground">{d.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      d.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {d.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
