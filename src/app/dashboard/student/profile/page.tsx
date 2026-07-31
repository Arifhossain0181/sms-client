"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

export default function StudentProfilePage() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [profile, setProfile] = useState<{
    id: string;
    name: string;
    studentId: string;
    rollNumber?: number;
    dob: string;
    gender?: string;
    bloodGroup?: string;
    address?: string;
    user?: { email?: string };
    class?: { name: string };
    section?: { name: string };
    parent?: { name?: string; phone?: string; user?: { email?: string } };
    createdAt: string;
  } | null>(null);

  useEffect(() => {
    if (role && role !== "STUDENT") {
      window.location.href = "/dashboard";
    }
  }, [role]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/students/me");
        const data = unwrap<any>(res);

        if (data.pending) {
          setPending(true);
          setProfile(null);
          return;
        }

        setProfile(data);
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (pending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive font-semibold mb-2">Profile Pending Approval</p>
          <p className="text-muted-foreground">Your profile is awaiting admin approval. Please contact the school administration.</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive font-semibold mb-2">Error loading profile</p>
          <p className="text-muted-foreground">{error ?? "Profile not found"}</p>
        </div>
      </div>
    );
  }

  const fields = [
    { label: "Full Name", value: profile.name },
    { label: "Student ID", value: profile.studentId },
    { label: "Email", value: profile.user?.email ?? "Not provided" },
    { label: "Class", value: profile.class?.name ?? "-" },
    { label: "Section", value: profile.section?.name ?? "-" },
    { label: "Roll Number", value: profile.rollNumber?.toString() ?? "-" },
    { label: "Date of Birth", value: new Date(profile.dob).toLocaleDateString("en-GB") },
    { label: "Gender", value: profile.gender ?? "-" },
    { label: "Blood Group", value: profile.bloodGroup ?? "-" },
    { label: "Address", value: profile.address ?? "-" },
    { label: "Guardian Name", value: profile.parent?.name ?? "-" },
    { label: "Guardian Phone", value: profile.parent?.phone ?? "-" },
    { label: "Guardian Email", value: profile.parent?.user?.email ?? "-" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground">Your personal and academic information.</p>
        </div>
        <Link href="/dashboard/student" className="text-sm text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.label} className="rounded-lg border border-border/50 bg-secondary/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{field.label}</p>
              <p className="mt-1 text-sm font-medium text-foreground break-all">{field.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
