"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
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
  Upload,
  CheckCircle,
  Award,
  Users,
  Heart,
  FileUp,
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
  address: z.string().optional().or(z.literal("")),
  presentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  nationalId: z.string().optional(),
  birthCertificateNo: z.string().optional(),
  religion: z.string().optional(),
  maritalStatus: z.string().optional(),
  nationality: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  designation: z.string().min(2, "Designation required"),
  employmentType: z.string().optional(),
  department: z.string().optional(),
  qualification: z.string().min(2, "Qualification required"),
  institution: z.string().optional(),
  passingYear: z.string().optional(),
  result: z.string().optional(),
  experience: z.coerce.number().min(0, "Experience required"),
  previousOrganization: z.string().optional(),
  previousDesignation: z.string().optional(),
  subjectSpecialization: z.string().optional(),
  expectedSalary: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().min(0).optional()
  ),
  resumeUrl: z.string().optional(),
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

type DocType =
  | "photo"
  | "cv"
  | "nid"
  | "birthCert"
  | "sscCert"
  | "hscCert"
  | "bscCert"
  | "mscCert";

export default function ApplyForTeaching() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const { user, isAuthenticated } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);
  const [job, setJob] = useState<JobPosting | null>(null);

  // Upload URLs state
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [nidUrl, setNidUrl] = useState<string | null>(null);
  const [birthCertUrl, setBirthCertUrl] = useState<string | null>(null);
  const [sscCertUrl, setSscCertUrl] = useState<string | null>(null);
  const [hscCertUrl, setHscCertUrl] = useState<string | null>(null);
  const [bscCertUrl, setBscCertUrl] = useState<string | null>(null);
  const [mscCertUrl, setMscCertUrl] = useState<string | null>(null);

  const [uploading, setUploading] = useState<Record<DocType, boolean>>({
    photo: false,
    cv: false,
    nid: false,
    birthCert: false,
    sscCert: false,
    hscCert: false,
    bscCert: false,
    mscCert: false,
  });

  const maxDobDate = new Date();
  maxDobDate.setFullYear(maxDobDate.getFullYear() - 20);
  const maxDob = maxDobDate.toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  // Auto-populate logged in user info
  useEffect(() => {
    if (user) {
      if (!watch("name") && (user as any).name) setValue("name", (user as any).name);
      if (!watch("email") && user.email) setValue("email", user.email);
    }
  }, [user, setValue, watch]);

  // Load Job details if jobId query present
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
        if (!isCancelled) setJob(null);
      } finally {
        if (!isCancelled) setLoadingJob(false);
      }
    };
    void loadJob();
    return () => { isCancelled = true; };
  }, [jobId, setValue]);

  const uploadDocument = async (file: File, type: DocType) => {
    setUploading((prev) => ({ ...prev, [type]: true }));
    try {
      const formData = new FormData();
      formData.append("document", file);
      const res = await api.post("/admission/upload-document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.data?.url || res.data?.url;
      if (!url) throw new Error("Upload failed");

      if (type === "photo") setPhotoUrl(url);
      else if (type === "cv") setCvUrl(url);
      else if (type === "nid") setNidUrl(url);
      else if (type === "birthCert") setBirthCertUrl(url);
      else if (type === "sscCert") setSscCertUrl(url);
      else if (type === "hscCert") setHscCertUrl(url);
      else if (type === "bscCert") setBscCertUrl(url);
      else if (type === "mscCert") setMscCertUrl(url);

      toast.success("File uploaded successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!isAuthenticated || !user) {
      toast.error("You must be logged in to submit your application.");
      router.push(`/login?redirect=${encodeURIComponent(`/apply-for-Teaching${jobId ? `?jobId=${jobId}` : ""}`)}`);
      return;
    }

    try {
      setSubmitting(true);
      const mainAddress = data.address || data.presentAddress || data.permanentAddress || "Not specified";
      const payload = {
        ...data,
        address: mainAddress,
        photoUrl: photoUrl || undefined,
        cvUrl: cvUrl || data.resumeUrl || undefined,
        resumeUrl: cvUrl || data.resumeUrl || undefined,
        nidUrl: nidUrl || undefined,
        birthCertUrl: birthCertUrl || undefined,
        sscCertUrl: sscCertUrl || undefined,
        hscCertUrl: hscCertUrl || undefined,
        bscCertUrl: bscCertUrl || undefined,
        mscCertUrl: mscCertUrl || undefined,
      };

      await api.post("/teaching/apply", payload);

      if (jobId) {
        try {
          await api.post("/recruitment/applicants/public", {
            jobPostingId: jobId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            resumeUrl: payload.cvUrl,
            coverLetter: data.coverLetter,
          });
        } catch (applicantErr) {
          console.error("Failed to create recruitment applicant:", applicantErr);
        }
      }

      toast.success("Teaching Application submitted successfully!");
      reset();
      setPhotoUrl(null);
      setCvUrl(null);
      setNidUrl(null);
      setBirthCertUrl(null);
      setSscCertUrl(null);
      setHscCertUrl(null);
      setBscCertUrl(null);
      setMscCertUrl(null);
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

  const renderUploadBox = (
    label: string,
    type: DocType,
    currentUrl: string | null,
    accept = "image/*,.pdf"
  ) => {
    const isImage = currentUrl && (currentUrl.match(/\.(jpeg|jpg|png|webp|gif)/i) || !currentUrl.endsWith(".pdf"));
    return (
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-4 backdrop-blur">
        <label className={labelCls}>
          <FileUp className="h-3.5 w-3.5 text-indigo-500" /> {label}
        </label>
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          {currentUrl ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
              {isImage ? (
                <img src={currentUrl} alt={label} className="h-7 w-7 rounded object-cover border border-emerald-300 dark:border-emerald-700" />
              ) : (
                <CheckCircle className="h-4 w-4 shrink-0" />
              )}
              <a href={currentUrl} target="_blank" rel="noreferrer" className="underline truncate max-w-[150px]">
                Uploaded Document
              </a>
            </div>
          ) : null}
          <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-300 transition">
            {uploading[type] ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {currentUrl ? "Change Image/File" : "Upload Image/File"}
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadDocument(file, type);
              }}
            />
          </label>
        </div>
      </div>
    );
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/50 dark:from-slate-950 dark:via-indigo-950/40 dark:to-violet-950/40 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Orbs */}
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
            Teacher Recruitment Portal
          </div>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-700 to-violet-700 dark:from-white dark:via-indigo-300 dark:to-violet-300 bg-clip-text text-transparent">
            Apply for Teaching Position
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Please fill out all details and upload the required documents carefully.
          </p>
        </motion.div>

        {/* Job info banner if available */}
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
          </motion.div>
        )}

        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-indigo-500/5 overflow-hidden"
        >
          <div className="h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600" />

          <div className="p-6 sm:p-8 lg:p-10 space-y-10">
            {/* 1. PERSONAL INFORMATION */}
            <div>
              <h2 className={sectionTitleCls}>
                <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                  <User className="h-4 w-4" />
                </span>
                Personal Details
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field delay={0.05}>
                  <label className={labelCls}><User className="h-3.5 w-3.5 text-indigo-500" /> Full Name *</label>
                  <input {...register("name")} className={inputCls} placeholder="Full Name" />
                  {errors.name && <p className={errCls}>{errors.name.message}</p>}
                </Field>

                <Field delay={0.1}>
                  <label className={labelCls}><Mail className="h-3.5 w-3.5 text-indigo-500" /> Email *</label>
                  <input type="email" {...register("email")} className={inputCls} placeholder="you@example.com" />
                  {errors.email && <p className={errCls}>{errors.email.message}</p>}
                </Field>

                <Field delay={0.15}>
                  <label className={labelCls}><Phone className="h-3.5 w-3.5 text-indigo-500" /> Phone *</label>
                  <input {...register("phone")} className={inputCls} placeholder="01XXXXXXXXX" />
                  {errors.phone && <p className={errCls}>{errors.phone.message}</p>}
                </Field>

                <Field delay={0.2}>
                  <label className={labelCls}><User className="h-3.5 w-3.5 text-indigo-500" /> Gender *</label>
                  <select {...register("gender")} className={selectCls}>
                    <option className={optionCls} value="">Select Gender</option>
                    <option className={optionCls} value="MALE">Male</option>
                    <option className={optionCls} value="FEMALE">Female</option>
                    <option className={optionCls} value="OTHER">Other</option>
                  </select>
                  {errors.gender && <p className={errCls}>{errors.gender.message}</p>}
                </Field>

                <Field delay={0.25}>
                  <label className={labelCls}><Calendar className="h-3.5 w-3.5 text-indigo-500" /> Date of Birth *</label>
                  <input type="date" {...register("dob")} max={maxDob} className={inputCls} />
                  {errors.dob && <p className={errCls}>{errors.dob.message}</p>}
                </Field>

                <Field delay={0.3}>
                  {renderUploadBox("National ID (NID Image Upload)", "nid", nidUrl, "image/*")}
                </Field>

                <Field delay={0.35}>
                  {renderUploadBox("Birth Certificate Image Upload", "birthCert", birthCertUrl, "image/*")}
                </Field>

                <Field delay={0.4}>
                  <label className={labelCls}><Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Religion</label>
                  <input {...register("religion")} className={inputCls} placeholder="Islam / Hindu / Christian..." />
                </Field>

                <Field delay={0.45}>
                  <label className={labelCls}><Heart className="h-3.5 w-3.5 text-indigo-500" /> Marital Status</label>
                  <select {...register("maritalStatus")} className={selectCls}>
                    <option className={optionCls} value="">Select Status</option>
                    <option className={optionCls} value="Single">Single</option>
                    <option className={optionCls} value="Married">Married</option>
                    <option className={optionCls} value="Divorced">Divorced</option>
                    <option className={optionCls} value="Widowed">Widowed</option>
                  </select>
                </Field>

                <Field delay={0.5}>
                  <label className={labelCls}><User className="h-3.5 w-3.5 text-indigo-500" /> Nationality</label>
                  <input {...register("nationality")} className={inputCls} placeholder="Bangladeshi" />
                </Field>

                <Field delay={0.55}>
                  <label className={labelCls}><Users className="h-3.5 w-3.5 text-indigo-500" /> Father's Name</label>
                  <input {...register("fatherName")} className={inputCls} placeholder="Father's Full Name" />
                </Field>

                <Field delay={0.6}>
                  <label className={labelCls}><Users className="h-3.5 w-3.5 text-indigo-500" /> Mother's Name</label>
                  <input {...register("motherName")} className={inputCls} placeholder="Mother's Full Name" />
                </Field>
              </div>
            </div>

            {/* 2. ADDRESS DETAILS */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-8">
              <h2 className={sectionTitleCls}>
                <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white">
                  <MapPin className="h-4 w-4" />
                </span>
                Address Details
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field delay={0.05}>
                  <label className={labelCls}><MapPin className="h-3.5 w-3.5 text-sky-500" /> Present Address</label>
                  <textarea {...register("presentAddress")} rows={3} className={inputCls} placeholder="House / Village, Road, City, District" />
                </Field>

                <Field delay={0.1}>
                  <label className={labelCls}><MapPin className="h-3.5 w-3.5 text-sky-500" /> Permanent Address</label>
                  <textarea {...register("permanentAddress")} rows={3} className={inputCls} placeholder="House / Village, Road, City, District" />
                </Field>
              </div>
            </div>

            {/* 3. EMERGENCY CONTACT */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-8">
              <h2 className={sectionTitleCls}>
                <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <Phone className="h-4 w-4" />
                </span>
                Emergency Contact
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field delay={0.05}>
                  <label className={labelCls}><User className="h-3.5 w-3.5 text-emerald-500" /> Emergency Contact Name</label>
                  <input {...register("emergencyContactName")} className={inputCls} placeholder="Contact Person Name" />
                </Field>

                <Field delay={0.1}>
                  <label className={labelCls}><Phone className="h-3.5 w-3.5 text-emerald-500" /> Emergency Contact Phone</label>
                  <input {...register("emergencyContactPhone")} className={inputCls} placeholder="01XXXXXXXXX" />
                </Field>
              </div>
            </div>

            {/* 4. PROFESSIONAL & ACADEMIC INFO */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-8">
              <h2 className={sectionTitleCls}>
                <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  <Briefcase className="h-4 w-4" />
                </span>
                Position & Qualifications
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field delay={0.05}>
                  <label className={labelCls}><Briefcase className="h-3.5 w-3.5 text-indigo-500" /> Applied Position (Designation) *</label>
                  <input {...register("designation")} className={inputCls} placeholder="Senior Assistant Teacher" />
                  {errors.designation && <p className={errCls}>{errors.designation.message}</p>}
                </Field>

                <Field delay={0.1}>
                  <label className={labelCls}><Briefcase className="h-3.5 w-3.5 text-indigo-500" /> Employment Type</label>
                  <select {...register("employmentType")} className={selectCls}>
                    <option className={optionCls} value="">Select Type</option>
                    <option className={optionCls} value="FULL_TIME">Full-Time</option>
                    <option className={optionCls} value="PART_TIME">Part-Time</option>
                    <option className={optionCls} value="CONTRACTUAL">Contractual</option>
                    <option className={optionCls} value="GUEST">Guest Teacher</option>
                  </select>
                </Field>

                <Field delay={0.15}>
                  <label className={labelCls}><Building2 className="h-3.5 w-3.5 text-indigo-500" /> Department</label>
                  <input {...register("department")} className={inputCls} placeholder="Science / Humanities / Business Studies" />
                </Field>

                <Field delay={0.2}>
                  <label className={labelCls}><BookOpen className="h-3.5 w-3.5 text-indigo-500" /> Subject Specialization</label>
                  <input {...register("subjectSpecialization")} className={inputCls} placeholder="Physics / Mathematics / English" />
                </Field>

                <Field delay={0.25}>
                  <label className={labelCls}><Award className="h-3.5 w-3.5 text-indigo-500" /> Highest Qualification *</label>
                  <input {...register("qualification")} className={inputCls} placeholder="M.Sc in Physics / B.Ed" />
                  {errors.qualification && <p className={errCls}>{errors.qualification.message}</p>}
                </Field>

                <Field delay={0.3}>
                  <label className={labelCls}><Building2 className="h-3.5 w-3.5 text-indigo-500" /> Institution / University</label>
                  <input {...register("institution")} className={inputCls} placeholder="University Name" />
                </Field>

                <Field delay={0.35}>
                  <label className={labelCls}><Calendar className="h-3.5 w-3.5 text-indigo-500" /> Passing Year</label>
                  <input {...register("passingYear")} className={inputCls} placeholder="e.g. 2020" />
                </Field>

                <Field delay={0.4}>
                  <label className={labelCls}><Award className="h-3.5 w-3.5 text-indigo-500" /> Result / GPA / Class</label>
                  <input {...register("result")} className={inputCls} placeholder="e.g. 3.75 / First Class" />
                </Field>

                <Field delay={0.45}>
                  <label className={labelCls}><Calendar className="h-3.5 w-3.5 text-indigo-500" /> Teaching Experience (Years) *</label>
                  <input type="number" {...register("experience")} min={0} className={inputCls} />
                  {errors.experience && <p className={errCls}>{errors.experience.message}</p>}
                </Field>

                <Field delay={0.5}>
                  <label className={labelCls}><Building2 className="h-3.5 w-3.5 text-indigo-500" /> Previous Organization</label>
                  <input {...register("previousOrganization")} className={inputCls} placeholder="Previous School/College" />
                </Field>

                <Field delay={0.55}>
                  <label className={labelCls}><Briefcase className="h-3.5 w-3.5 text-indigo-500" /> Previous Designation</label>
                  <input {...register("previousDesignation")} className={inputCls} placeholder="Assistant Teacher" />
                </Field>

                <Field delay={0.6}>
                  <label className={labelCls}><Briefcase className="h-3.5 w-3.5 text-indigo-500" /> Expected Salary (BDT)</label>
                  <input type="number" {...register("expectedSalary")} min={0} className={inputCls} placeholder="e.g. 35000" />
                </Field>
              </div>
            </div>

            {/* 5. DOCUMENT UPLOADS */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-8">
              <h2 className={sectionTitleCls}>
                <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
                  <Upload className="h-4 w-4" />
                </span>
                Document & Photo Uploads
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {renderUploadBox("Applicant Photo (Image)", "photo", photoUrl, "image/*")}
                {renderUploadBox("CV / Resume (PDF / Image)", "cv", cvUrl, "image/*,.pdf")}
                {renderUploadBox("National ID (NID Card)", "nid", nidUrl, "image/*,.pdf")}
                {renderUploadBox("Birth Certificate", "birthCert", birthCertUrl, "image/*,.pdf")}
                {renderUploadBox("SSC Certificate", "sscCert", sscCertUrl, "image/*,.pdf")}
                {renderUploadBox("HSC Certificate", "hscCert", hscCertUrl, "image/*,.pdf")}
                {renderUploadBox("B.Sc Certificate", "bscCert", bscCertUrl, "image/*,.pdf")}
                {renderUploadBox("M.Sc Certificate", "mscCert", mscCertUrl, "image/*,.pdf")}
              </div>
            </div>

            {/* 6. COVER LETTER & SUBMIT */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-8">
              <h2 className={sectionTitleCls}>
                <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white">
                  <FileText className="h-4 w-4" />
                </span>
                Cover Letter
              </h2>

              <div className="mt-5">
                <Field delay={0.05} span={2}>
                  <label className={labelCls}><FileText className="h-3.5 w-3.5 text-rose-500" /> Cover Letter / Additional Notes</label>
                  <textarea {...register("coverLetter")} rows={4} className={inputCls} placeholder="Write a few lines about your teaching background and why you are applying..." />
                </Field>
              </div>

              <div className="mt-8">
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  className="group relative w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 dark:from-indigo-600 dark:via-violet-600 dark:to-fuchsia-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-900/30 hover:shadow-indigo-900/50 disabled:opacity-60 transition-all overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting Application...</>
                  ) : (
                    <><ShieldCheck className="h-4 w-4" /> Submit Application</>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.form>
      </div>
    </section>
  );
}
