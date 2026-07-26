"use client";

import { useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import {
  GraduationCap,
  User,
  Calendar,
  Users,
  Droplet,
  BookOpen,
  MapPin,
  Phone,
  Mail,
  Image as ImageIcon,
  FileText,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdmissionClasses, useCreateAdmission } from "./useAdmission";
import { useAuth } from "@/hooks/useAuth";

const schema = z
  .object({
    applicantName: z.string().min(1, "Student name is required"),
    studentEmail: z.string().email("Enter a valid student email"),
    dob: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], { message: "Select a gender" }),
    bloodGroup: z
      .enum(["A_POS", "A_NEG", "B_POS", "B_NEG", "O_POS", "O_NEG", "AB_POS", "AB_NEG"])
      .optional(),
    religion: z.string().optional(),
    address: z.string().min(1, "Address is required"),
    guardianName: z.string().min(1, "Guardian name is required"),
    guardianPhone: z.string().min(7, "Enter a valid guardian phone"),
    guardianEmail: z.string().email("Enter a valid guardian email"),
    targetClassId: z.string().min(1, "Select a class"),
    payNow: z.boolean().default(false),
    paymentMethod: z.enum(["CASH", "STRIPE"]).optional(),
    paymentAmount: z.coerce.number().optional(),
    transactionId: z.string().optional(),
    photoUrl: z.string().optional(),
    birthCertUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.payNow) {
      if (!data.paymentMethod) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["paymentMethod"],
          message: "Select a payment method",
        });
      }
      if (!data.paymentAmount || data.paymentAmount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["paymentAmount"],
          message: "Enter a payment amount",
        });
      }
    }
  });

type FormInput = z.input<typeof schema>;

function Field({
  delay,
  span = 1,
  children,
}: {
  delay?: number;
  span?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay ?? 0, duration: 0.4 }}
      style={{ gridColumn: span === 2 ? "span 2" : undefined }}
    >
      {children}
    </motion.div>
  );
}

const sectionTitleCls = "flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-white";
const labelCls = "flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200";
const inputCls =
  "w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition";
const errCls = "mt-1 text-xs font-medium text-red-600 dark:text-red-400";

const DRAFT_KEY = "admissionDraft";

export default function Admission() {
  const { data: classes = [], isLoading: loadingClasses } = useAdmissionClasses();
  const { mutateAsync: createAdmission } = useCreateAdmission();
  const { role } = useAuth();

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [birthCertUrl, setBirthCertUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ photo: boolean; birthCert: boolean }>({
    photo: false,
    birthCert: false,
  });
  const [stripeVerifying, setStripeVerifying] = useState(false);
  const [stripePaid, setStripePaid] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const autoSubmitRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({ resolver: zodResolver(schema) });

  const payNow = watch("payNow");
  const paymentMethod = watch("paymentMethod");
  const paymentAmount = Number(watch("paymentAmount") ?? 0);
  const applicantName = watch("applicantName");
  const targetClassId = watch("targetClassId");
  const isStripeFlow = payNow && paymentMethod === "STRIPE";

  // smooth scroll on this page
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    function raf(t: number) {
      lenis.raf(t);
      requestAnimationFrame(raf);
    }
    const id = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
    };
  }, []);

  const finalizeSuccess = () => {
    reset();
    setPhotoUrl(null);
    setBirthCertUrl(null);
    setStripePaid(false);
    autoSubmitRef.current = false;
    if (typeof window !== "undefined") window.sessionStorage.removeItem(DRAFT_KEY);
    toast.success("Admission application submitted!");
    if (role === "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    } else {
      router.replace("/apply-for-admission?success=1");
    }
  };

  // only saved while a Stripe redirect is in flight — restored on return from Stripe
  const saveDraft = () => {
    if (typeof window === "undefined") return;
    const values = {
      applicantName: watch("applicantName"),
      studentEmail: watch("studentEmail"),
      dob: watch("dob"),
      gender: watch("gender"),
      bloodGroup: watch("bloodGroup"),
      religion: watch("religion"),
      address: watch("address"),
      guardianName: watch("guardianName"),
      guardianPhone: watch("guardianPhone"),
      guardianEmail: watch("guardianEmail"),
      targetClassId: watch("targetClassId"),
      photoUrl,
      birthCertUrl,
    };
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    } catch {
      /* sessionStorage may be unavailable — non-fatal */
    }
  };

  const restoreDraft = (): (FormInput & { photoUrl?: string; birthCertUrl?: string }) | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const draft = restoreDraft();
    if (draft) {
      reset(draft);
      setPhotoUrl(draft.photoUrl ?? null);
      setBirthCertUrl(draft.birthCertUrl ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadDocument = async (file: File, type: "photo" | "birthCert") => {
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
      else setBirthCertUrl(url);
      toast.success("Document uploaded");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(message || "Upload failed");
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const submitDraftForStripe = async (sessionId: string, amountTotal?: number | null) => {
    const draft = restoreDraft();
    if (!draft) {
      toast.error("Form data missing. Please fill the form again before paying.");
      return;
    }
    await createAdmission({
      applicantName: draft.applicantName!,
      studentEmail: draft.studentEmail!,
      dob: draft.dob!,
      gender: draft.gender!,
      bloodGroup: draft.bloodGroup,
      religion: draft.religion,
      address: draft.address!,
      guardianName: draft.guardianName!,
      guardianPhone: draft.guardianPhone!,
      guardianEmail: draft.guardianEmail!,
      targetClassId: draft.targetClassId!,
      paymentMethod: "STRIPE",
      paymentAmount: amountTotal ?? (draft.paymentAmount as number | undefined),
      transactionId: sessionId,
      photoUrl: draft.photoUrl ?? photoUrl ?? undefined,
      birthCertUrl: draft.birthCertUrl ?? birthCertUrl ?? undefined,
    });
    finalizeSuccess();
  };

  // NOTE: /admission/stripe/checkout and /admission/stripe/verify do not
  // exist on the backend yet — this UI is wired up but will 404 until those
  // two endpoints are built there.
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId || stripePaid || stripeVerifying) return;

    const verify = async () => {
      setStripeVerifying(true);
      try {
        const res = await api.get("/admission/stripe/verify", { params: { session_id: sessionId } });
        const payload = res.data?.data ?? res.data;
        if (payload?.paid) {
          setStripePaid(true);
          setValue("payNow", true);
          setValue("paymentMethod", "STRIPE");
          if (payload.amountTotal) setValue("paymentAmount", payload.amountTotal);
          setValue("transactionId", sessionId);

          if (!autoSubmitRef.current) {
            autoSubmitRef.current = true;
            await submitDraftForStripe(sessionId, payload.amountTotal);
          }
        } else {
          toast.error("Stripe payment not completed");
        }
      } catch (err: unknown) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message;
        toast.error(message || "Stripe verification failed");
      } finally {
        setStripeVerifying(false);
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setValue, stripePaid, stripeVerifying]);

  const handleStripeCheckout = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error("Enter a payment amount");
      return;
    }
    try {
      saveDraft();
      const res = await api.post("/admission/stripe/checkout", {
        amount: paymentAmount,
        applicantName,
        targetClassId,
      });
      const payload = res.data?.data ?? res.data;
      if (payload?.url) window.location.href = payload.url;
      else toast.error("Could not get the Stripe checkout URL");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(message || "Stripe checkout failed");
    }
  };

  const onSubmit: SubmitHandler<FormInput> = async (data) => {
    if (data.payNow && data.paymentMethod === "STRIPE" && !stripePaid) {
      toast.error("Please complete the Stripe payment first");
      return;
    }

    try {
      await createAdmission({
        applicantName: data.applicantName,
        studentEmail: data.studentEmail,
        dob: data.dob,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        religion: data.religion,
        address: data.address,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        guardianEmail: data.guardianEmail,
        targetClassId: data.targetClassId,
        paymentMethod: data.payNow ? data.paymentMethod : undefined,
        paymentAmount: data.payNow ? (data.paymentAmount as number | undefined) : undefined,
        transactionId: data.payNow ? data.transactionId : undefined,
        photoUrl: photoUrl || undefined,
        birthCertUrl: birthCertUrl || undefined,
      });
      finalizeSuccess();
    } catch {
      // error toast already shown by useCreateAdmission's onError
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/50 dark:from-slate-950 dark:via-indigo-950/40 dark:to-violet-950/40 py-12 px-4 sm:px-6 lg:px-8">
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
            New Admission
          </div>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-700 to-violet-700 dark:from-white dark:via-indigo-300 dark:to-violet-300 bg-clip-text text-transparent">
            Student Admission Form
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Fill in the student and guardian details below to apply.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-indigo-500/5 overflow-hidden"
        >
          <div className="h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600" />

          <div className="p-6 sm:p-8 lg:p-10 space-y-10">
            {/* Student + Admission Info */}
            <div>
              <h2 className={sectionTitleCls}>
                <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white">
                  <User className="h-4 w-4" />
                </span>
                Student Information
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field delay={0.05}>
                  <label className={labelCls}>
                    <User className="h-3.5 w-3.5 text-indigo-500" /> Student Name
                  </label>
                  <input {...register("applicantName")} className={inputCls} placeholder="Full name" />
                  {errors.applicantName && <p className={errCls}>{errors.applicantName.message}</p>}
                </Field>

                <Field delay={0.1}>
                  <label className={labelCls}>
                    <Mail className="h-3.5 w-3.5 text-indigo-500" /> Student Email
                  </label>
                  <input
                    type="email"
                    {...register("studentEmail")}
                    className={inputCls}
                    placeholder="student@email.com"
                  />
                  {errors.studentEmail && <p className={errCls}>{errors.studentEmail.message}</p>}
                  <p className="mt-1 text-[11px] text-slate-400">
                    Used to send login details if the application is approved.
                  </p>
                </Field>

                <Field delay={0.15}>
                  <label className={labelCls}>
                    <Calendar className="h-3.5 w-3.5 text-indigo-500" /> Date of Birth
                  </label>
                  <input type="date" {...register("dob")} className={inputCls} />
                  {errors.dob && <p className={errCls}>{errors.dob.message}</p>}
                </Field>

                <Field delay={0.2}>
                  <label className={labelCls}>
                    <Users className="h-3.5 w-3.5 text-indigo-500" /> Gender
                  </label>
                  <select {...register("gender")} className={inputCls}>
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {errors.gender && <p className={errCls}>{errors.gender.message}</p>}
                </Field>

                <Field delay={0.25}>
                  <label className={labelCls}>
                    <Droplet className="h-3.5 w-3.5 text-rose-500" /> Blood Group
                  </label>
                  <select {...register("bloodGroup")} className={inputCls} defaultValue="">
                    <option value="">Optional</option>
                    {["A_POS", "A_NEG", "B_POS", "B_NEG", "O_POS", "O_NEG", "AB_POS", "AB_NEG"].map(
                      (bg) => (
                        <option key={bg} value={bg}>
                          {bg.replace("_POS", "+").replace("_NEG", "-")}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field delay={0.3}>
                  <label className={labelCls}>
                    <BookOpen className="h-3.5 w-3.5 text-violet-500" /> Religion
                    <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input {...register("religion")} className={inputCls} placeholder="Optional" />
                </Field>

                <Field delay={0.35} span={2}>
                  <label className={labelCls}>
                    <MapPin className="h-3.5 w-3.5 text-indigo-500" /> Address
                  </label>
                  <textarea {...register("address")} rows={3} className={inputCls} placeholder="Full address" />
                  {errors.address && <p className={errCls}>{errors.address.message}</p>}
                </Field>

                <Field delay={0.4} span={2}>
                  <label className={labelCls}>
                    <GraduationCap className="h-3.5 w-3.5 text-violet-500" /> Applying Class
                  </label>
                  <select {...register("targetClassId")} className={inputCls} disabled={loadingClasses}>
                    <option value="">{loadingClasses ? "Loading classes..." : "Select class"}</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} (Class {cls.numericLevel})
                      </option>
                    ))}
                  </select>
                  {errors.targetClassId && <p className={errCls}>{errors.targetClassId.message}</p>}
                </Field>

                <Field delay={0.45} span={2}>
                  <label className={labelCls} style={{ alignItems: "center" }}>
                    <ImageIcon className="h-3.5 w-3.5 text-emerald-500" /> Student Photo{" "}
                    <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <label className="mt-2 group flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur px-4 py-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 transition">
                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {photoUrl ? "✓ Photo uploaded" : "Click to upload student photo"}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                      Browse
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadDocument(f, "photo");
                      }}
                    />
                  </label>
                  {uploading.photo && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                    </p>
                  )}
                </Field>

                <Field delay={0.5} span={2}>
                  <label className={labelCls}>
                    <FileText className="h-3.5 w-3.5 text-emerald-500" /> Birth Certificate{" "}
                    <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <label className="mt-2 group flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur px-4 py-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 transition">
                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {birthCertUrl ? "✓ Document uploaded" : "Click to upload birth certificate"}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                      Browse
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadDocument(f, "birthCert");
                      }}
                    />
                  </label>
                  {uploading.birthCert && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                    </p>
                  )}
                </Field>
              </div>
            </div>

            {/* Guardian */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-8">
              <h2 className={sectionTitleCls}>
                <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white">
                  <Users className="h-4 w-4" />
                </span>
                Guardian Information
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field delay={0.05}>
                  <label className={labelCls}>
                    <User className="h-3.5 w-3.5 text-sky-500" /> Guardian Name
                  </label>
                  <input {...register("guardianName")} className={inputCls} placeholder="Guardian name" />
                  {errors.guardianName && <p className={errCls}>{errors.guardianName.message}</p>}
                </Field>

                <Field delay={0.1}>
                  <label className={labelCls}>
                    <Phone className="h-3.5 w-3.5 text-sky-500" /> Guardian Phone
                  </label>
                  <input {...register("guardianPhone")} className={inputCls} placeholder="01XXXXXXXXX" />
                  {errors.guardianPhone && <p className={errCls}>{errors.guardianPhone.message}</p>}
                </Field>

                <Field delay={0.15} span={2}>
                  <label className={labelCls}>
                    <Mail className="h-3.5 w-3.5 text-sky-500" /> Guardian Email
                  </label>
                  <input
                    type="email"
                    {...register("guardianEmail")}
                    className={inputCls}
                    placeholder="guardian@email.com"
                  />
                  {errors.guardianEmail && <p className={errCls}>{errors.guardianEmail.message}</p>}
                </Field>
              </div>
            </div>

            {/* Payment */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-8">
              <h2 className={sectionTitleCls}>
                <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <CreditCard className="h-4 w-4" />
                </span>
                Payment <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(optional)</span>
              </h2>

              <Field delay={0.05}>
                <label className="mt-5 flex items-center gap-3 cursor-pointer select-none group">
                  <span className="relative inline-flex">
                    <input type="checkbox" {...register("payNow")} className="peer sr-only" />
                    <span className="h-6 w-11 rounded-full bg-slate-200 dark:bg-white/10 peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-600 transition-colors" />
                    <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow peer-checked:translate-x-5 transition-transform" />
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 transition">
                    Pay now
                  </span>
                </label>
              </Field>

              <AnimatePresence>
                {payNow && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      <Field delay={0.05}>
                        <label className={labelCls}>Payment Method</label>
                        <select {...register("paymentMethod")} className={inputCls}>
                          <option value="">Select method</option>
                          <option value="CASH">Cash</option>
                          <option value="STRIPE">Stripe</option>
                        </select>
                        {errors.paymentMethod && (
                          <p className={errCls}>{errors.paymentMethod.message}</p>
                        )}
                      </Field>

                      <Field delay={0.1}>
                        <label className={labelCls}>Amount</label>
                        <input type="number" {...register("paymentAmount")} className={inputCls} placeholder="0.00" />
                        {errors.paymentAmount && (
                          <p className={errCls}>{errors.paymentAmount.message}</p>
                        )}
                      </Field>

                      <Field delay={0.15} span={2}>
                        <label className={labelCls}>
                          Transaction ID <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <input {...register("transactionId")} className={inputCls} placeholder="TXN-XXXXXX" />
                      </Field>

                      {paymentMethod === "STRIPE" && (
                        <Field delay={0.2} span={2}>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={handleStripeCheckout}
                            disabled={stripeVerifying || stripePaid}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 disabled:opacity-60 transition-all"
                          >
                            {stripePaid ? (
                              <>
                                <CheckCircle2 className="h-4 w-4" /> Stripe Paid
                              </>
                            ) : stripeVerifying ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-4 w-4" /> Pay with Stripe
                              </>
                            )}
                          </motion.button>
                        </Field>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-8">
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                className="group relative w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 dark:from-indigo-600 dark:via-violet-600 dark:to-fuchsia-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-900/30 hover:shadow-indigo-900/50 disabled:opacity-60 transition-all overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : isStripeFlow && !stripePaid ? (
                  <>
                    <CreditCard className="h-4 w-4" /> Complete Stripe Payment
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Submit Admission
                  </>
                )}
              </motion.button>

              {isStripeFlow && !stripePaid && (
                <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                  The application will submit automatically once Stripe payment is complete.
                </p>
              )}
            </div>
          </div>
        </motion.form>
      </div>
    </section>
  );
}