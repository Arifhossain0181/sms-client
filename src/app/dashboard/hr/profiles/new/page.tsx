"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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

export default function NewStaffPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    designation: "",
    departmentId: "",
    staffType: "NON_TEACHING",
    qualification: "",
    experience: "",
    address: "",
    gender: "",
    dateOfBirth: "",
    bloodGroup: "",
    joiningDate: "",
    idProofUrl: "",
    contractUrl: "",
  });

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    api.get("/hr/departments").then((res) => {
      const payload = res.data?.data ?? res.data;
      setDepartments(Array.isArray(payload) ? payload : []);
    });
  }, []);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Record<string, any> = { ...form };
      if (!payload.experience) delete payload.experience;
      if (!payload.departmentId) delete payload.departmentId;
      await api.post("/hr/staff", payload);
      router.push("/dashboard/hr/profiles");
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Failed to create staff profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/hr/profiles"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">New Staff Profile</h1>
          <p className="text-muted-foreground mt-1">
            Create a profile for teaching or non-teaching staff
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft space-y-6">
        <div>
          <h3 className="font-semibold mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Full Name *</label>
              <input required value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Gender</label>
              <select value={form.gender} onChange={(e) => update("gender", e.target.value)} className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm">
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Date of Birth</label>
              <input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Blood Group</label>
              <input value={form.bloodGroup} onChange={(e) => update("bloodGroup", e.target.value)} className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Address</label>
              <textarea value={form.address} onChange={(e) => update("address", e.target.value)} rows={2} className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Employment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Staff Type *</label>
              <select value={form.staffType} onChange={(e) => update("staffType", e.target.value)} className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm">
                <option value="NON_TEACHING">Non-Teaching</option>
                <option value="TEACHING">Teaching</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Designation</label>
              <input value={form.designation} onChange={(e) => update("designation", e.target.value)} className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Department</label>
              <select value={form.departmentId} onChange={(e) => update("departmentId", e.target.value)} className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm">
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Qualification</label>
              <input value={form.qualification} onChange={(e) => update("qualification", e.target.value)} className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Experience (years)</label>
              <input type="number" value={form.experience} onChange={(e) => update("experience", e.target.value)} className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Joining Date</label>
              <input type="date" value={form.joiningDate} onChange={(e) => update("joiningDate", e.target.value)} className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">ID Proof URL</label>
              <input value={form.idProofUrl} onChange={(e) => update("idProofUrl", e.target.value)} className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm" placeholder="https://..." />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Contract URL</label>
              <input value={form.contractUrl} onChange={(e) => update("contractUrl", e.target.value)} className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm" placeholder="https://..." />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
            {loading ? "Creating..." : "Create Staff Profile"}
          </button>
          <Link href="/dashboard/hr/profiles" className="rounded-lg border border-border/60 px-6 py-2 text-sm">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
