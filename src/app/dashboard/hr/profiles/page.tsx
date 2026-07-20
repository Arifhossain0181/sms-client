"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { Plus, Search, UserCog, FolderOpen, Eye, Trash2, RotateCcw } from "lucide-react";

type StaffRecord = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  staffType: string;
  department?: { name: string };
  isActive: boolean;
  joiningDate: string;
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

export default function StaffProfilesPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/hr/staff?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`);
      const payload = res.data?.data ?? res.data;
      setStaff(payload.staff ?? []);
      setMeta(payload.meta ?? { page: 1, totalPages: 1 });
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this staff profile?")) return;
    try {
      await api.patch(`/hr/staff/${id}`);
      load(meta.page);
    } catch {
      alert("Failed to deactivate staff profile");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.patch(`/hr/staff/${id}/restore`);
      load(meta.page);
    } catch {
      alert("Failed to restore staff profile");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Staff Profiles</h1>
          <p className="text-muted-foreground mt-1">
            Manage teaching and non-teaching staff records
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/hr/profiles/new")}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Staff
        </button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : staff.length === 0 ? (
          <p className="text-xs text-muted-foreground">No staff records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-2 font-medium">Employee ID</th>
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Designation</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Department</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 font-mono text-xs">{s.employeeId}</td>
                    <td className="py-3 font-medium">{s.name}</td>
                    <td className="py-3 text-muted-foreground">{s.email}</td>
                    <td className="py-3">{s.designation ?? "—"}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                        {s.staffType?.toLowerCase().replace("_", " ") ?? "non-teaching"}
                      </span>
                    </td>
                    <td className="py-3">{s.department?.name ?? "—"}</td>
                    <td className="py-3">
                      {s.isActive ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/hr/profiles/${s.id}`)}
                          className="rounded-lg p-1.5 hover:bg-white/10"
                          title="View"
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {s.isActive ? (
                          <button
                            onClick={() => handleArchive(s.id)}
                            className="rounded-lg p-1.5 hover:bg-white/10"
                            title="Deactivate"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestore(s.id)}
                            className="rounded-lg p-1.5 hover:bg-white/10"
                            title="Restore"
                          >
                            <RotateCcw className="h-4 w-4 text-emerald-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
