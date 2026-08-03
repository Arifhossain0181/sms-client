"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { ArrowLeft, Award } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

type Applicant = {
  id: string;
  name: string;
  email: string;
  jobPosting?: { id: string; title: string; designation: string; department?: { id: string; name: string } };
};

export default function OfferPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [fetching, setFetching] = useState(false);
  const [form, setForm] = useState({
    position: "",
    departmentId: "",
    salary: "",
    joiningDate: "",
    validUntil: "",
    terms: "",
  });

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const id = window.location.pathname.split("/").pop();
    if (!id) return;
    setFetching(true);
    api.get(`/recruitment/applicants/${id}`)
      .then((res) => {
        const payload = res.data?.data ?? res.data;
        setApplicant(payload as Applicant);
        if (payload?.jobPosting?.designation) {
          setForm((prev) => ({ ...prev, position: payload.jobPosting.designation }));
        }
        if (payload?.jobPosting?.department?.id) {
          setForm((prev) => ({ ...prev, departmentId: payload.jobPosting.department.id }));
        }
      })
      .catch(() => setApplicant(null))
      .finally(() => setFetching(false));
  }, []);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pathParts = window.location.pathname.split("/");
    const applicantId = pathParts[pathParts.length - 1];
    if (!applicantId) return;
    setLoading(true);
    try {
      await api.post("/recruitment/offers", {
        applicantId,
        position: form.position,
        departmentId: form.departmentId || undefined,
        salary: Number(form.salary),
        joiningDate: new Date(form.joiningDate).toISOString(),
        validUntil: new Date(form.validUntil).toISOString(),
        terms: form.terms || undefined,
      });
      router.push(`/dashboard/hr/recruitment/applicants/${applicantId}`);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Failed to create offer");
    } finally {
      setLoading(false);
    }
  };

  const backHref = applicant?.jobPosting?.id
    ? `/dashboard/hr/recruitment/jobs/${applicant.jobPosting.id}`
    : "/dashboard/hr/recruitment/applicants";

  return (
    <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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

      <div className="relative w-full max-w-3xl my-8 space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative flex flex-wrap items-center gap-4">
              <Link
                href={backHref}
                className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  Send Offer
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-indigo-400"
                  >
                    <Award className="w-5 h-5" />
                  </motion.span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {fetching
                    ? "Loading applicant..."
                    : applicant
                      ? `Sending offer to: ${applicant.name}`
                      : "Create a job offer"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 shadow-xl space-y-4"
              >
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-400" /> Offer Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Position *</label>
                    <input
                      required
                      value={form.position}
                      onChange={(e) => updateForm("position", e.target.value)}
                      placeholder="e.g. Senior Teacher"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Salary *</label>
                    <input
                      required
                      type="number"
                      min={0}
                      value={form.salary}
                      onChange={(e) => updateForm("salary", e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Joining Date *</label>
                    <input
                      required
                      type="date"
                      value={form.joiningDate}
                      onChange={(e) => updateForm("joiningDate", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Valid Until *</label>
                    <input
                      required
                      type="date"
                      value={form.validUntil}
                      onChange={(e) => updateForm("validUntil", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Terms & Conditions</label>
                  <textarea
                    value={form.terms}
                    onChange={(e) => updateForm("terms", e.target.value)}
                    rows={4}
                    placeholder="Optional terms and conditions..."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 resize-none"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap items-center gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-6 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? "Sending..." : "Send Offer"}
                </motion.button>
                <Link href={applicant ? `/dashboard/hr/recruitment/applicants/${applicant.id}` : "/dashboard/hr/recruitment/applicants"}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className="rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-6 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10"
                  >
                    Cancel
                  </motion.button>
                </Link>
              </motion.div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
