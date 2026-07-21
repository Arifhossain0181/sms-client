"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { Search } from "lucide-react";

type StaffSummary = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  staffType: string;
  department?: { name: string };
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

export default function StaffDirectoryPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [staff, setStaff] = useState<StaffSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const url = `/hr/staff/directory${search ? `?search=${encodeURIComponent(search)}` : ""}`;
        const res = await api.get(url);
        const payload = res.data?.data ?? res.data;
        setStaff(Array.isArray(payload) ? payload : []);
      } catch {
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Staff Directory</h1>
        <p className="text-muted-foreground mt-1">
          Search staff by name, department, or designation
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, department, or designation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border/60 bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : staff.length === 0 ? (
          <p className="text-xs text-muted-foreground">No staff found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-2 font-medium">Employee ID</th>
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Designation</th>
                  <th className="pb-2 font-medium">Department</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 font-mono text-xs">{s.employeeId}</td>
                    <td className="py-3 font-medium">{s.name}</td>
                    <td className="py-3">{s.designation ?? "—"}</td>
                    <td className="py-3">{s.department?.name ?? "—"}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                        {s.staffType?.toLowerCase().replace("_", " ") ?? "non-teaching"}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">{s.email}</td>
                    <td className="py-3 text-muted-foreground">{s.phone ?? "—"}</td>
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
