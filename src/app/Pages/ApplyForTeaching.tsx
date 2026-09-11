"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Briefcase,
  Building2,
  Calendar,
  BookOpen,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Phone is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  dob: z
    .string()
    .min(1, "Date of birth required")
    .refine((value) => {
      if (!value) return false;

      const dobDate = new Date(`${value}T00:00:00`);
      if (Number.isNaN(dobDate.getTime())) return false;

      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age -= 1;
      }

      return age >= 20;
    }, "Applicant must be at least 20 years old"),
  address: z.string().min(3, "Address required"),
  designation: z.string().min(2, "Designation required"),
  department: z.string().optional(),
  qualification: z.string().min(2, "Qualification required"),
  experience: z.coerce.number().min(0, "Experience required"),
  subjectSpecialization: z.string().optional(),
  expectedSalary: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().min(0).optional()
  ),
  resumeUrl: z.string().url("Valid URL required").optional().or(z.literal("")),
  coverLetter: z.string().optional(),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

type JobPosting = {
  id: string;
  title: string;
  designation: string;
  department?: { name: string };
  vacancies: number;
  deadline: string;
  description?: string;
  requirements?: string;
};

const inputCls =
  "mt-2 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-white/10";
const selectCls = `${inputCls} [color-scheme:light] dark:[color-scheme:dark]`;
const optionCls = "bg-white text-slate-900 dark:bg-slate-800 dark:text-white";
const labelCls =
  "flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200";
const errCls = "text-xs text-red-500 dark:text-red-400 mt-1";
const sectionTitleCls =
  "flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white";

const Field = ({
  children,
  delay = 0,
  span = 1,
}: {
  children: React.ReactNode;
  delay?: number;
  span?: 1 | 2;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    className={span === 2 ? "md:col-span-2" : ""}
  >
    {children}
  </motion.div>
);

export default function ApplyForTeaching() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const { user, isAuthenticated } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);
  const [job, setJob] = useState<JobPosting | null>(null);

  const maxDobDate = new Date();
  maxDobDate.setFullYear(maxDobDate.getFullYear() - 20);
  const maxDob = maxDobDate.toISOString().slice(0, 10);

  const { register, handleSubmit, reset, setValue, formState: { errors } } =
    useForm<FormInput, unknown, FormData>({
      resolver: zodResolver(schema),
      mode: "onChange",
      reValidateMode: "onChange",
    });

  useEffect(() => {
    if (!jobId) return;

    let isCancelled = false;

    const loadJob = async () => {
      setLoadingJob(true);

      try {
        const res = await api.get(`/recruitment/jobs/${jobId}`);
        const payload = res.data?.data ?? res.data;
        const jobData = payload as JobPosting;

        if (!isCancelled) {
          setJob(jobData);
          if (jobData.designation) {
            setValue("designation", jobData.designation);
          }
        }
      } catch {
        if (!isCancelled) {
          setJob(null);
        }
      } finally {
        if (!isCancelled) {
          setLoadingJob(false);
        }
      }
    };

    void loadJob();

    return () => {
      isCancelled = true;
    };
  }, [jobId, setValue]);
  // redirect to login if not authenticated and trying to submit without login

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!isAuthenticated || !user) {
      toast.error("You must be logged in to submit your application.");
      router.push(`/login?redirect=${encodeURIComponent(`/apply-for-Teaching${jobId ? `?jobId=${jobId}` : ""}`)}`);
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/teaching/apply", data);

      if (jobId) {
        try {
          await api.post("/recruitment/applicants/public", {
            jobPostingId: jobId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            resumeUrl: data.resumeUrl,
            coverLetter: data.coverLetter,
          });
        } catch (applicantErr) {
          console.error("Failed to create recruitment applicant:", applicantErr);
        }
      }

      toast.success("Application submitted successfully");
      reset();
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;

      toast.error(message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/50 dark:from-slate-950 dark:via-indigo-950/40 dark:to-violet-950/40 py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-sky-300/30 to-indigo-400/20 dark:from-sky-500/15 dark:to-indigo-600/15 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-violet-300/30 to-fuchsia-400/20 dark:from-violet-600/15 dark:to-fuchsia-600/15 blur-3xl"
        />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Teaching Application · 2024–25
          </div>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-700 to-violet-700 dark:from-white dark:via-indigo-300 dark:to-violet-300 bg-clip-text text-transparent">
            Apply for Teaching
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Fill in your details to apply for a teaching position.
            {jobId && !loadingJob && job && (
              <span className="block text-indigo-500 dark:text-indigo-400 mt-1">
                Application is linked to a specific job posting.
              </span>
            )}
          </p>
        </motion.div>

        {jobId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 shadow-2xl shadow-indigo-500/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shrink-0">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{loadingJob ? "Loading job..." : job?.title ?? "Job Details"}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {!loadingJob && job ? `${job.designation} · ${job.department?.name ?? "—"}` : ""}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Open
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur p-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> Subject / Designation
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{loadingJob ? "..." : job?.designation ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur p-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Department
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{loadingJob ? "..." : job?.department?.name ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur p-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Last Date
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {loadingJob || !job?.deadline ? "..." : new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>

            {!loadingJob && job?.description && (
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Description</p>
                <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{job.description}</p>
              </div>
            )}
            {!loadingJob && job?.requirements && (
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Requirements</p>
                <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{job.requirements}</p>
              </div>
            )}
          </motion.div>
        )}

        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-indigo-500/5 overflow-hidden"
        >
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600" />

          <div className="p-6 sm:p-8 lg:p-10 space-y-10">
            {/* Personal Info */}
            <div>
              <h2 className={sectionTitleCls}>
                <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                  <User className="h-4 w-4" />
                </span>
                Personal Information
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field delay={0.05}>
                  <label className={labelCls}><User className="h-3.5 w-3.5 text-indigo-500" /> Full Name</label>
                  <input {...register("name")} className={inputCls} placeholder="Your full name" />
                  {errors.name && <p className={errCls}>{errors.name.message}</p>}
                </Field>

                <Field delay={0.1}>
                  <label className={labelCls}><Mail className="h-3.5 w-3.5 text-indigo-500" /> Email</label>
                  <input type="email" {...register("email")} className={inputCls} placeholder="you@example.com" />
                  {errors.email && <p className={errCls}>{errors.email.message}</p>}
                </Field>

                <Field delay={0.15}>
                  <label className={labelCls}><Phone className="h-3.5 w-3.5 text-indigo-500" /> Phone</label>
                  <input {...register("phone")} className={inputCls} placeholder="01XXXXXXXXX" />
                  {errors.phone && <p className={errCls}>{errors.phone.message}</p>}
                </Field>

                <Field delay={0.2}>
                  <label className={labelCls}><User className="h-3.5 w-3.5 text-indigo-500" /> Gender</label>
                  <select {...register("gender")} className={selectCls}>
                    <option className={optionCls} value="">Select</option>
                    <option className={optionCls} value="MALE">Male</option>
                    <option className={optionCls} value="FEMALE">Female</option>
                    <option className={optionCls} value="OTHER">Other</option>
                  </select>
                  {errors.gender && <p className={errCls}>{errors.gender.message}</p>}
                </Field>

                <Field delay={0.25}>
                  <label className={labelCls}><Calendar className="h-3.5 w-3.5 text-indigo-500" /> Date of Birth</label>
                  <input type="date" {...register("dob")} max={maxDob} className={inputCls} />
                  {errors.dob && <p className={errCls}>{errors.dob.message}</p>}
                </Field>

                <Field delay={0.3} span={2}>
                  <label className={labelCls}><MapPin className="h-3.5 w-3.5 text-indigo-500" /> Address</label>
                  <textarea {...register("address")} rows={3} className={inputCls} placeholder="Your address" />
                  {errors.address && <p className={errCls}>{errors.address.message}</p>}
                </Field>
              </div>
            </div>

            {/* Professional Info */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-8">
              <h2 className={sectionTitleCls}>
                <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white">
                  <Briefcase className="h-4 w-4" />
                </span>
                Professional Information
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field delay={0.05}>
                  <label className={labelCls}><Briefcase className="h-3.5 w-3.5 text-sky-500" /> Designation</label>
                  <input {...register("designation")} className={inputCls} placeholder="Senior Teacher" />
                  {errors.designation && <p className={errCls}>{errors.designation.message}</p>}
                </Field>

                <Field delay={0.1}>
                  <label className={labelCls}><Building2 className="h-3.5 w-3.5 text-sky-500" /> Department</label>
                  <input {...register("department")} className={inputCls} placeholder="Science" />
                </Field>

                <Field delay={0.15}>
                  <label className={labelCls}><BookOpen className="h-3.5 w-3.5 text-indigo-500" /> Qualification</label>
                  <input {...register("qualification")} className={inputCls} placeholder="MSc / B.Ed" />
                  {errors.qualification && <p className={errCls}>{errors.qualification.message}</p>}
                </Field>

                <Field delay={0.2}>
                  <label className={labelCls}><Calendar className="h-3.5 w-3.5 text-indigo-500" /> Experience (years)</label>
                  <input type="number" {...register("experience")} min={0} className={inputCls} />
                  {errors.experience && <p className={errCls}>{errors.experience.message}</p>}
                </Field>

                <Field delay={0.25}>
                  <label className={labelCls}><BookOpen className="h-3.5 w-3.5 text-indigo-500" /> Subject Specialization</label>
                  <input {...register("subjectSpecialization")} className={inputCls} placeholder="Mathematics" />
                </Field>

                <Field delay={0.3}>
                  <label className={labelCls}><Briefcase className="h-3.5 w-3.5 text-indigo-500" /> Expected Salary</label>
                  <input type="number" {...register("expectedSalary")} min={0} className={inputCls} placeholder="Optional" />
                </Field>

                <Field delay={0.35} span={2}>
                  <label className={labelCls}><Mail className="h-3.5 w-3.5 text-indigo-500" /> Resume URL</label>
                  <input {...register("resumeUrl")} className={inputCls} placeholder="https://..." />
                  {errors.resumeUrl && <p className={errCls}>{errors.resumeUrl.message}</p>}
                </Field>
              </div>
            </div>

            {/* Additional Info */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-8">
              <h2 className={sectionTitleCls}>
                <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
                  <FileText className="h-4 w-4" />
                </span>
                Additional Information
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field delay={0.05} span={2}>
                  <label className={labelCls}><FileText className="h-3.5 w-3.5 text-violet-500" /> Cover Letter</label>
                  <textarea {...register("coverLetter")} rows={4} className={inputCls} placeholder="Tell us about your teaching experience and motivation" />
                </Field>
              </div>
            </div>

            {/* Submit */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-8">
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                className="group relative w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 dark:from-indigo-600 dark:via-violet-600 dark:to-fuchsia-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-900/30 hover:shadow-indigo-900/50 disabled:opacity-60 transition-all overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                ) : (
                  <><ShieldCheck className="h-4 w-4" /> Submit Application</>
                )}
              </motion.button>
            </div>
          </div>
        </motion.form>
      </div>
    </section>
  );
}
