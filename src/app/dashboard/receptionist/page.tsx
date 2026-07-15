"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { UserRound, ClipboardCheck, Bell } from "lucide-react";

type Visitor = {
  id: string;
  name: string;
  purpose: string;
  inTime: string;
  outTime?: string;
};

type Inquiry = {
  id: string;
  callerName: string;
  phone: string;
  subject: string;
  status: string;
};

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  SCHOOL_ADMIN: "School Admin",
  ADMIN: "Admin",
  ACCOUNTANT: "Accountant",
  LIBRARIAN: "Librarian",
  TEACHER: "Teacher",
  STUDENT: "Student",
  PARENT: "Parent",
  RECEPTIONIST: "Receptionist",
  EXAM_CONTROLLER: "Exam Controller",
  HR: "HR",
};

export default function ReceptionistDashboard() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "RECEPTIONIST") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [visitorsRes, inquiriesRes] = await Promise.all([
          api.get("/receptionist/visitors"),
          api.get("/receptionist/inquiries"),
        ]);
        const visitorsPayload = visitorsRes.data?.data ?? visitorsRes.data;
        const inquiriesPayload = inquiriesRes.data?.data ?? inquiriesRes.data;
        setVisitors(Array.isArray(visitorsPayload) ? visitorsPayload : []);
        setInquiries(Array.isArray(inquiriesPayload) ? inquiriesPayload : []);
      } catch {
        setVisitors([]);
        setInquiries([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          {roleLabels.RECEPTIONIST} Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Front desk operations, visitor log, and inquiry management.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Today&apos;s Visitors</h3>
          </div>
          <div className="mt-4">
            {loading && (
              <p className="text-xs text-muted-foreground">Loading visitors...</p>
            )}
            {!loading && visitors.length === 0 && (
              <p className="text-xs text-muted-foreground">No visitors today.</p>
            )}
            <div className="divide-y divide-border/60">
              {visitors.map((visitor) => (
                <div
                  key={visitor.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{visitor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {visitor.purpose}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {visitor.inTime}
                    </p>
                    {visitor.outTime && (
                      <p className="text-xs text-muted-foreground">
                        Out: {visitor.outTime}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Recent Inquiries</h3>
          </div>
          <div className="mt-4">
            {loading && (
              <p className="text-xs text-muted-foreground">Loading inquiries...</p>
            )}
            {!loading && inquiries.length === 0 && (
              <p className="text-xs text-muted-foreground">No inquiries.</p>
            )}
            <div className="divide-y divide-border/60">
              {inquiries.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{item.callerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.subject}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
