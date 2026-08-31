"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Briefcase, Building2, Calendar, BookOpen } from "lucide-react";

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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Apply for Teaching</h1>
          <p className="text-muted-foreground mt-2">
            Fill in your details to apply for a teaching position.
            {jobId && !loadingJob && job && (
              <span className="block text-indigo-500 dark:text-indigo-400 mt-1">
                Application is linked to a specific job posting.
              </span>
            )}
          </p>
        </div>

        {jobId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-border/60 bg-card/80 p-6 shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shrink-0">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{loadingJob ? "Loading job..." : job?.title ?? "Job Details"}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
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
              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> Subject / Designation
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{loadingJob ? "..." : job?.designation ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Department
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{loadingJob ? "..." : job?.department?.name ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Last Date
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {loadingJob || !job?.deadline ? "..." : new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>

            {!loadingJob && job?.description && (
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{job.description}</p>
              </div>
            )}
            {!loadingJob && job?.requirements && (
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Requirements</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{job.requirements}</p>
              </div>
            )}
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card/80 border border-border/60 rounded-2xl p-6 shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                {...register("name")}
                className="w-full bg-transparent border border-border/60 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Your name"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                {...register("email")}
                type="email"
                className="w-full bg-transparent border border-border/60 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                {...register("phone")}
                className="w-full bg-transparent border border-border/60 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="01XXXXXXXXX"
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                {...register("gender")}
                className="w-full bg-transparent border border-border/60 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <input
                {...register("dob")}
                type="date"
                max={maxDob}
                className="w-full bg-transparent border border-border/60 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {errors.dob && <p className="text-xs text-red-500 mt-1">Applicant must be at least 20 years old</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Designation</label>
              <input
                {...register("designation")}
                className="w-full bg-transparent border border-border/60 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Senior Teacher"
              />
              {errors.designation && <p className="text-xs text-red-500 mt-1">{errors.designation.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <input
                {...register("department")}
                className="w-full bg-transparent border border-border/60 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Science"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Qualification</label>
              <input
                {...register("qualification")}
                className="w-full bg-transparent border border-border/60 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="MSc / B.Ed"
              />
              {errors.qualification && <p className="text-xs text-red-500 mt-1">{errors.qualification.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Experience (years)</label>
              <input
                {...register("experience")}
                type="number"
                min={0}
                className="w-full bg-transparent border border-border/60 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {errors.experience && <p className="text-xs text-red-500 mt-1">{errors.experience.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subject Specialization</label>
              <input
                {...register("subjectSpecialization")}
                className="w-full bg-transparent border border-border/60 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Mathematics"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Expected Salary</label>
              <input
                {...register("expectedSalary")}
                type="number"
                min={0}
                className="w-full bg-transparent border border-border/60 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Optional"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Resume URL</label>
              <input
                {...register("resumeUrl")}
                className="w-full bg-transparent border border-border/60 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="https://..."
              />
              {errors.resumeUrl && <p className="text-xs text-red-500 mt-1">{errors.resumeUrl.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              {...register("address")}
              rows={3}
              className="w-full bg-transparent border border-border/60 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="Your address"
            />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cover Letter</label>
            <textarea
              {...register("coverLetter")}
              rows={4}
              className="w-full bg-transparent border border-border/60 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="Tell us about your teaching experience and motivation"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="reset"
              onClick={() => reset()}
              className="px-5 py-2.5 rounded-lg text-sm border border-border/60 text-muted-foreground bg-transparent"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
