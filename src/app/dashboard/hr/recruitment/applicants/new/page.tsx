"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import {
  ArrowLeft, Plus, Briefcase, Upload, FileUp, CheckCircle, Loader2, Mail, Phone,
  User, FileText, StickyNote, Building2, Calendar, BookOpen, ShieldCheck, Sparkles,
  Award, Users, Heart, FileCheck,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";

type JobPosting = {
  id: string;
  title: string;
  designation: string;
  department?: { name: string };
};

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Phone is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  dob: z.string().min(1, "Date of birth required"),
  address: z.string().optional().or(z.literal("")),
  presentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
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
  notes: z.string().optional(),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

type DocType =
  | "photo"
  | "cv"
  | "nid"
  | "birthCert"
  | "sscCert"
  | "hscCert"
  | "bscCert"
  | "mscCert";

const inputCls =
  "mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20";
const selectCls = `${inputCls} [color-scheme:light] dark:[color-scheme:dark]`;
const optionCls = "bg-white text-slate-900 dark:bg-slate-800 dark:text-white";
const labelCls =
  "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300";
const errCls = "text-xs text-red-500 dark:text-red-400 mt-1";
const sectionTitleCls =
  "flex items-center gap-2 text-base font-bold text-slate-800 dark:text-white";

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
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className={span === 2 ? "md:col-span-2" : ""}
  >
    {children}
  </motion.div>
);

export default function NewApplicantPage() {
  useLenis();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryJobId = searchParams.get("jobId");
  const { role } = useAuth();

  const [loading, setLoading] = useState(false);
  const [fetchingJobs, setFetchingJobs] = useState(false);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(queryJobId || "");
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  // Load available jobs for selection
  useEffect(() => {
    setFetchingJobs(true);
    api.get("/recruitment/jobs?limit=100")
      .then((res) => {
        const payload = res.data?.data ?? res.data;
        const jobList = Array.isArray(payload)
          ? payload
          : payload.postings ?? payload.jobs ?? payload.data ?? [];
        setJobs(jobList);

        if (queryJobId) {
          const matched = jobList.find((j: JobPosting) => j.id === queryJobId);
          if (matched) {
            setSelectedJob(matched);
            setSelectedJobId(matched.id);
            setValue("designation", matched.designation);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch jobs:", err);
        setJobs([]);
      })
      .finally(() => setFetchingJobs(false));
  }, [queryJobId, setValue]);

  // Synchronize designation when selectedJobId changes
  useEffect(() => {
    if (selectedJobId && jobs.length > 0) {
      const found = jobs.find((j) => j.id === selectedJobId);
      if (found) {
        setSelectedJob(found);
        if (found.designation && !watch("designation")) {
          setValue("designation", found.designation);
        }
      }
    }
  }, [selectedJobId, jobs, setValue, watch]);

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

      toast.success("Document uploaded successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      setLoading(true);
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

      // 1. Submit full teaching application
      await api.post("/teaching/apply", payload);

      // 2. Register applicant under selected job posting if present
      if (selectedJobId) {
        try {
          await api.post("/recruitment/applicants", {
            jobPostingId: selectedJobId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            resumeUrl: payload.cvUrl,
            coverLetter: data.coverLetter,
            notes: data.notes,
          });
        } catch (recruitmentErr) {
          console.error("Recruitment applicant creation warning:", recruitmentErr);
        }
      }

      toast.success("Applicant & Teaching Application added successfully!");
      if (selectedJobId) {
        router.push(`/dashboard/hr/recruitment/jobs/${selectedJobId}`);
      } else {
        router.push("/dashboard/hr/recruitment/applicants");
      }
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to add applicant");
    } finally {
      setLoading(false);
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
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 p-4 backdrop-blur">
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
          <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-300 transition">
            {uploading[type] ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {currentUrl ? "Change File" : "Upload File"}
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
    <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
      {/* Background Orbs */}
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

      <div className="relative w-full max-w-4xl my-8 space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          {/* Header Bar */}
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <div className="relative flex flex-wrap items-center gap-4">
              <Link
                href={selectedJobId ? `/dashboard/hr/recruitment/jobs/${selectedJobId}` : "/dashboard/hr/recruitment/applicants"}
                className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>

              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  Add Applicant / Teaching Application
                  <span className="text-indigo-400">
                    <Briefcase className="w-5 h-5" />
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {fetchingJobs
                    ? "Loading job positions..."
                    : selectedJob
                      ? `Applying for: ${selectedJob.title} · ${selectedJob.designation}`
                      : "Fill in complete applicant & teaching application details"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-8">
            {/* 0. JOB POSTING SELECTOR */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 p-5 space-y-3">
              <h3 className={sectionTitleCls}>
                <span className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                  <Briefcase className="h-3.5 w-3.5" />
                </span>
                Target Job Position
              </h3>

              {queryJobId && selectedJob ? (
                <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/60 dark:bg-indigo-950/40 p-4">
                  <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">{selectedJob.title}</p>
                  <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">{selectedJob.designation} {selectedJob.department?.name ? `· ${selectedJob.department.name}` : ""}</p>
                </div>
              ) : (
                <div>
                  <label className={labelCls}>Select Job Position</label>
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className={selectCls}
                  >
                    <option className={optionCls} value="">-- Open Application / General Pool --</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id} className={optionCls}>
                        {j.title} ({j.designation})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 1. PERSONAL INFORMATION */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 p-5 space-y-4">
              <h3 className={sectionTitleCls}>
                <span className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                  <User className="h-3.5 w-3.5" />
                </span>
                Personal Information
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
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
                  <input type="date" {...register("dob")} className={inputCls} />
                  {errors.dob && <p className={errCls}>{errors.dob.message}</p>}
                </Field>

                <Field delay={0.3}>
                  <label className={labelCls}><Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Religion</label>
                  <input {...register("religion")} className={inputCls} placeholder="Islam / Hindu / Christian..." />
                </Field>

                <Field delay={0.35}>
                  <label className={labelCls}><Heart className="h-3.5 w-3.5 text-indigo-500" /> Marital Status</label>
                  <select {...register("maritalStatus")} className={selectCls}>
                    <option className={optionCls} value="">Select Status</option>
                    <option className={optionCls} value="Single">Single</option>
                    <option className={optionCls} value="Married">Married</option>
                    <option className={optionCls} value="Divorced">Divorced</option>
                    <option className={optionCls} value="Widowed">Widowed</option>
                  </select>
                </Field>

                <Field delay={0.4}>
                  <label className={labelCls}><User className="h-3.5 w-3.5 text-indigo-500" /> Nationality</label>
                  <input {...register("nationality")} className={inputCls} placeholder="Bangladeshi" />
                </Field>

                <Field delay={0.45}>
                  <label className={labelCls}><Users className="h-3.5 w-3.5 text-indigo-500" /> Father's Name</label>
                  <input {...register("fatherName")} className={inputCls} placeholder="Father's Full Name" />
                </Field>

                <Field delay={0.5}>
                  <label className={labelCls}><Users className="h-3.5 w-3.5 text-indigo-500" /> Mother's Name</label>
                  <input {...register("motherName")} className={inputCls} placeholder="Mother's Full Name" />
                </Field>
              </div>
            </div>

            {/* 2. ADDRESS DETAILS */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 p-5 space-y-4">
              <h3 className={sectionTitleCls}>
                <span className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white">
                  <Building2 className="h-3.5 w-3.5" />
                </span>
                Address Details
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <Field delay={0.05}>
                  <label className={labelCls}>Present Address</label>
                  <textarea {...register("presentAddress")} rows={3} className={inputCls} placeholder="House / Road / City / District" />
                </Field>

                <Field delay={0.1}>
                  <label className={labelCls}>Permanent Address</label>
                  <textarea {...register("permanentAddress")} rows={3} className={inputCls} placeholder="House / Road / City / District" />
                </Field>
              </div>
            </div>

            {/* 3. EMERGENCY CONTACT */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 p-5 space-y-4">
              <h3 className={sectionTitleCls}>
                <span className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <Phone className="h-3.5 w-3.5" />
                </span>
                Emergency Contact
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <Field delay={0.05}>
                  <label className={labelCls}>Emergency Contact Name</label>
                  <input {...register("emergencyContactName")} className={inputCls} placeholder="Contact Person Name" />
                </Field>

                <Field delay={0.1}>
                  <label className={labelCls}>Emergency Contact Phone</label>
                  <input {...register("emergencyContactPhone")} className={inputCls} placeholder="01XXXXXXXXX" />
                </Field>
              </div>
            </div>

            {/* 4. POSITION & QUALIFICATIONS */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 p-5 space-y-4">
              <h3 className={sectionTitleCls}>
                <span className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  <Briefcase className="h-3.5 w-3.5" />
                </span>
                Position & Qualifications
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <Field delay={0.05}>
                  <label className={labelCls}>Applied Designation *</label>
                  <input {...register("designation")} className={inputCls} placeholder="Senior Assistant Teacher" />
                  {errors.designation && <p className={errCls}>{errors.designation.message}</p>}
                </Field>

                <Field delay={0.1}>
                  <label className={labelCls}>Employment Type</label>
                  <select {...register("employmentType")} className={selectCls}>
                    <option className={optionCls} value="">Select Type</option>
                    <option className={optionCls} value="FULL_TIME">Full-Time</option>
                    <option className={optionCls} value="PART_TIME">Part-Time</option>
                    <option className={optionCls} value="CONTRACTUAL">Contractual</option>
                    <option className={optionCls} value="GUEST">Guest Teacher</option>
                  </select>
                </Field>

                <Field delay={0.15}>
                  <label className={labelCls}>Department</label>
                  <input {...register("department")} className={inputCls} placeholder="Science / Humanities" />
                </Field>

                <Field delay={0.2}>
                  <label className={labelCls}>Subject Specialization</label>
                  <input {...register("subjectSpecialization")} className={inputCls} placeholder="Physics / Mathematics" />
                </Field>

                <Field delay={0.25}>
                  <label className={labelCls}>Highest Qualification *</label>
                  <input {...register("qualification")} className={inputCls} placeholder="M.Sc in Physics / B.Ed" />
                  {errors.qualification && <p className={errCls}>{errors.qualification.message}</p>}
                </Field>

                <Field delay={0.3}>
                  <label className={labelCls}>Institution / University</label>
                  <input {...register("institution")} className={inputCls} placeholder="University Name" />
                </Field>

                <Field delay={0.35}>
                  <label className={labelCls}>Passing Year</label>
                  <input {...register("passingYear")} className={inputCls} placeholder="e.g. 2020" />
                </Field>

                <Field delay={0.4}>
                  <label className={labelCls}>Result / GPA</label>
                  <input {...register("result")} className={inputCls} placeholder="e.g. 3.75 / First Class" />
                </Field>

                <Field delay={0.45}>
                  <label className={labelCls}>Teaching Experience (Years) *</label>
                  <input type="number" {...register("experience")} min={0} className={inputCls} />
                  {errors.experience && <p className={errCls}>{errors.experience.message}</p>}
                </Field>

                <Field delay={0.5}>
                  <label className={labelCls}>Previous Organization</label>
                  <input {...register("previousOrganization")} className={inputCls} placeholder="Previous School" />
                </Field>

                <Field delay={0.55}>
                  <label className={labelCls}>Previous Designation</label>
                  <input {...register("previousDesignation")} className={inputCls} placeholder="Assistant Teacher" />
                </Field>

                <Field delay={0.6}>
                  <label className={labelCls}>Expected Salary (BDT)</label>
                  <input type="number" {...register("expectedSalary")} min={0} className={inputCls} placeholder="e.g. 35000" />
                </Field>
              </div>
            </div>

            {/* 5. DOCUMENT UPLOADS */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 p-5 space-y-4">
              <h3 className={sectionTitleCls}>
                <span className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
                  <Upload className="h-3.5 w-3.5" />
                </span>
                Document & Photo Uploads
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                {renderUploadBox("Applicant Photo (Image)", "photo", photoUrl, "image/*")}
                {renderUploadBox("National ID (NID Card Image)", "nid", nidUrl, "image/*")}
                {renderUploadBox("Birth Certificate Image", "birthCert", birthCertUrl, "image/*")}
                {renderUploadBox("CV / Resume (PDF / Image)", "cv", cvUrl, "image/*,.pdf")}
                {renderUploadBox("SSC Certificate", "sscCert", sscCertUrl, "image/*,.pdf")}
                {renderUploadBox("HSC Certificate", "hscCert", hscCertUrl, "image/*,.pdf")}
                {renderUploadBox("B.Sc Certificate", "bscCert", bscCertUrl, "image/*,.pdf")}
                {renderUploadBox("M.Sc Certificate", "mscCert", mscCertUrl, "image/*,.pdf")}
              </div>
            </div>

            {/* 6. COVER LETTER & INTERNAL NOTES */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 p-5 space-y-4">
              <h3 className={sectionTitleCls}>
                <span className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white">
                  <FileText className="h-3.5 w-3.5" />
                </span>
                Cover Letter & HR Notes
              </h3>

              <div className="space-y-4">
                <Field delay={0.05} span={2}>
                  <label className={labelCls}>Cover Letter / Additional Notes</label>
                  <textarea {...register("coverLetter")} rows={3} className={inputCls} placeholder="Cover letter or candidate notes..." />
                </Field>

                <Field delay={0.1} span={2}>
                  <label className={labelCls}><StickyNote className="h-3.5 w-3.5 text-indigo-400" /> Internal HR Notes</label>
                  <textarea {...register("notes")} rows={2} className={inputCls} placeholder="Optional internal notes for HR review..." />
                </Field>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex items-center gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 dark:from-indigo-600 dark:via-violet-600 dark:to-fuchsia-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-900/30 disabled:opacity-60 transition-all"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting Application...</>
                ) : (
                  <><ShieldCheck className="h-4 w-4" /> Add Applicant & Application</>
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => {
                  if (selectedJobId) router.push(`/dashboard/hr/recruitment/jobs/${selectedJobId}`);
                  else router.push("/dashboard/hr/recruitment/applicants");
                }}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
