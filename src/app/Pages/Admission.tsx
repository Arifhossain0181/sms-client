/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from "@studio-freight/lenis";
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
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  applicantName: z.string().min(1, "Enter the student name"),
  studentEmail: z.string().email("Enter a valid student email"),
  studentPhone: z.string().min(7, "Enter the student phone number"),
  dob: z.string().min(1, "Enter the date of birth"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { message: "Select a gender" }),
  bloodGroup: z.enum(["A_POS", "A_NEG", "B_POS", "B_NEG", "O_POS", "O_NEG", "AB_POS", "AB_NEG"]).optional(),
  religion: z.string().optional(),
  address: z.string().min(1, "Enter the address"),
  presentHouseRoad: z.string().optional(),
  presentArea: z.string().optional(),
  presentCity: z.string().optional(),
  presentDistrict: z.string().optional(),
  presentPostalCode: z.string().optional(),
  guardianName: z.string().min(1, "Enter the guardian name"),
  guardianPhone: z.string().min(7, "Enter the guardian phone number"),
  guardianRelation: z.enum(["FATHER", "MOTHER", "OTHER"], { message: "Select the guardian relation" }),
    guardianEmail: z.string().trim().regex(/^[a-z0-9][a-z0-9._%+-]*@gmail\.com$/i, "Enter a valid Gmail address (example@gmail.com)"),
    fatherFullName: z.string().optional(), fatherPhone: z.string().optional(), fatherEmail: z.string().email().optional().or(z.literal("")),
    fatherNid: z.string().optional(), fatherOccupation: z.string().optional(), fatherOrganization: z.string().optional(), fatherDesignation: z.string().optional(), fatherIncome: z.string().optional(), fatherAddress: z.string().optional(),
    motherFullName: z.string().optional(), motherPhone: z.string().optional(), motherEmail: z.string().email().optional().or(z.literal("")),
    motherNid: z.string().optional(), motherOccupation: z.string().optional(), motherOrganization: z.string().optional(), motherDesignation: z.string().optional(), motherIncome: z.string().optional(), motherAddress: z.string().optional(),
  targetClassId: z.string().min(1, "Select a class"),
  payNow: z.boolean().default(true),
  paymentMethod: z.enum(["CASH", "STRIPE"]).optional(),
  paymentAmount: z.coerce.number().optional(),
  transactionId: z.string().optional(),
}).superRefine((data, ctx) => {
  const minimumDob = new Date();
  minimumDob.setFullYear(minimumDob.getFullYear() - 3);
  if (!data.dob || new Date(`${data.dob}T00:00:00`) > minimumDob) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dob"], message: "Student must be at least 3 years old" });
  }
  if (data.payNow) {
    if (!data.paymentMethod) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paymentMethod"], message: "Select a payment method" });
    }
    if (!data.paymentAmount || data.paymentAmount <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paymentAmount"], message: "Enter the payment amount" });
    }
  }
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;
type ClassOption = { id: string; name: string; numericLevel: number };

// Shared input class — works light + dark
const inputCls =
  "mt-2 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-white/10";
const selectCls = `${inputCls} [color-scheme:light] dark:[color-scheme:dark]`;
const optionCls = "bg-white text-slate-900 dark:bg-slate-800 dark:text-white";
const labelCls =
  "flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200";
const errCls = "text-xs text-red-500 dark:text-red-400 mt-1";
const sectionTitleCls =
  "flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white";

// Reusable field wrapper with animation
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

interface AdmissionProps {
  isAdmin?: boolean;
}

export default function Admission({ isAdmin = false }: AdmissionProps) {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classLoadError, setClassLoadError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [birthCertUrl, setBirthCertUrl] = useState<string | null>(null);
  const [fatherNidUrl, setFatherNidUrl] = useState<string | null>(null);
  const [motherNidUrl, setMotherNidUrl] = useState<string | null>(null);
  const [guardianNidUrl, setGuardianNidUrl] = useState<string | null>(null);
  const [fatherPhotoUrl, setFatherPhotoUrl] = useState<string | null>(null);
  const [motherPhotoUrl, setMotherPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ photo: boolean; birthCert: boolean; fatherNid: boolean; motherNid: boolean; guardianNid: boolean; fatherPhoto: boolean; motherPhoto: boolean }>({
    photo: false,
    birthCert: false,
    fatherNid: false,
    motherNid: false,
    guardianNid: false,
    fatherPhoto: false,
    motherPhoto: false,
  });
  const [stripeVerifying, setStripeVerifying] = useState(false);
  const [stripePaid, setStripePaid] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [checkingApplication, setCheckingApplication] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const autoSubmitRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({ resolver: zodResolver(schema) as any });

  const payNow = watch("payNow");
  const paymentMethod = watch("paymentMethod");
  const paymentAmount = Number(watch("paymentAmount") ?? 0);
  const applicantName = watch("applicantName");
  const targetClassId = watch("targetClassId");
  const isStripeFlow = payNow && paymentMethod === "STRIPE";

  // Lenis smooth scroll
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
    setSubmitSuccess(true);
    reset();
    setValue("payNow", false);
    setValue("paymentMethod", undefined);
    setValue("paymentAmount", undefined);
    setValue("transactionId", undefined);
    setPhotoUrl(null);
    setBirthCertUrl(null);
    setFatherNidUrl(null);
    setMotherNidUrl(null);
    setGuardianNidUrl(null);
    setFatherPhotoUrl(null);
    setMotherPhotoUrl(null);
    setStripePaid(false);
    autoSubmitRef.current = false;
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("admissionDraft");
    }
    if (isAdmin) {
      router.replace("/dashboard/school-admin/admissions");
    } else {
      router.replace("/apply-for-admission?success=1");
    }
  };

  const submitDraftForStripe = async (sessionId: string, amountTotal?: number | null) => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem("admissionDraft");
    if (!raw) {
      toast.error("Form data missing. Please fill the form before paying.");
      return;
    }
    const draft = JSON.parse(raw) as FormInput & { photoUrl?: string; birthCertUrl?: string };
    const requiredMissing = [
      draft.applicantName, draft.studentPhone, draft.dob, draft.gender, draft.address,
      draft.guardianName, draft.guardianPhone, draft.guardianEmail, draft.guardianRelation, draft.targetClassId,
      draft.birthCertUrl, draft.guardianNidUrl, draft.fatherPhotoUrl, draft.motherPhotoUrl
    ].some((v) => !v);
    if (requiredMissing) {
      toast.error("Stripe payment is complete, but the form data is incomplete. Please complete the form.");
      return;
    }
    await api.post("/admission/apply", {
      ...draft,
      payNow: true,
      paymentMethod: "STRIPE",
      paymentAmount: amountTotal ?? draft.paymentAmount,
      transactionId: sessionId,
      photoUrl: draft.photoUrl,
      birthCertUrl: draft.birthCertUrl,
      fatherNid: draft.fatherNidUrl || draft.fatherNid,
      motherNid: draft.motherNidUrl || draft.motherNid,
      guardianRelation: draft.guardianRelation,
      guardianNidUrl: draft.guardianNidUrl,
      fatherPhotoUrl: draft.fatherPhotoUrl,
      motherPhotoUrl: draft.motherPhotoUrl,
    });
    toast.success("Admission application submitted");
    finalizeSuccess();
  };

  const saveDraft = () => {
    if (typeof window === "undefined") return;
    const values = {
      applicantName: watch("applicantName"),
      studentEmail: watch("studentEmail"),
      studentPhone: watch("studentPhone"),
      dob: watch("dob"),
      gender: watch("gender"),
      bloodGroup: watch("bloodGroup"),
      religion: watch("religion"),
      address: watch("address"),
      presentHouseRoad: watch("presentHouseRoad"), presentArea: watch("presentArea"), presentCity: watch("presentCity"), presentDistrict: watch("presentDistrict"), presentPostalCode: watch("presentPostalCode"),
      guardianName: watch("guardianName"),
      guardianPhone: watch("guardianPhone"),
      guardianEmail: watch("guardianEmail"),
      guardianRelation: watch("guardianRelation"),
      fatherFullName: watch("fatherFullName"), fatherPhone: watch("fatherPhone"), fatherEmail: watch("fatherEmail"), fatherNid: watch("fatherNid"), fatherOccupation: watch("fatherOccupation"), fatherOrganization: watch("fatherOrganization"), fatherDesignation: watch("fatherDesignation"), fatherIncome: watch("fatherIncome"), fatherAddress: watch("fatherAddress"),
      motherFullName: watch("motherFullName"), motherPhone: watch("motherPhone"), motherEmail: watch("motherEmail"), motherNid: watch("motherNid"), motherOccupation: watch("motherOccupation"), motherOrganization: watch("motherOrganization"), motherDesignation: watch("motherDesignation"), motherIncome: watch("motherIncome"), motherAddress: watch("motherAddress"),
      targetClassId: watch("targetClassId"),
      payNow: watch("payNow"),
      paymentMethod: watch("paymentMethod"),
      paymentAmount: watch("paymentAmount"),
      transactionId: watch("transactionId"),
      photoUrl,
      birthCertUrl,
      fatherNidUrl,
      motherNidUrl,
      guardianNidUrl,
      fatherPhotoUrl,
      motherPhotoUrl,
    };
    try {
      window.sessionStorage.setItem("admissionDraft", JSON.stringify(values));
    } catch {}
  };

  const restoreDraft = () => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem("admissionDraft");
      if (!raw) return;
      const draft = JSON.parse(raw) as FormInput & { photoUrl?: string; birthCertUrl?: string; fatherNidUrl?: string; motherNidUrl?: string; guardianNidUrl?: string; fatherPhotoUrl?: string; motherPhotoUrl?: string; };
      reset({
        applicantName: draft.applicantName,
        studentEmail: draft.studentEmail,
        studentPhone: draft.studentPhone,
        dob: draft.dob,
        gender: draft.gender,
        bloodGroup: draft.bloodGroup,
        religion: draft.religion,
        address: draft.address,
        presentHouseRoad: draft.presentHouseRoad, presentArea: draft.presentArea, presentCity: draft.presentCity, presentDistrict: draft.presentDistrict, presentPostalCode: draft.presentPostalCode,
        guardianName: draft.guardianName,
        guardianPhone: draft.guardianPhone,
        guardianEmail: draft.guardianEmail,
        guardianRelation: draft.guardianRelation,
        fatherFullName: draft.fatherFullName, fatherPhone: draft.fatherPhone, fatherEmail: draft.fatherEmail, fatherNid: draft.fatherNid, fatherOccupation: draft.fatherOccupation, fatherOrganization: draft.fatherOrganization, fatherDesignation: draft.fatherDesignation, fatherIncome: draft.fatherIncome, fatherAddress: draft.fatherAddress,
        motherFullName: draft.motherFullName, motherPhone: draft.motherPhone, motherEmail: draft.motherEmail, motherNid: draft.motherNid, motherOccupation: draft.motherOccupation, motherOrganization: draft.motherOrganization, motherDesignation: draft.motherDesignation, motherIncome: draft.motherIncome, motherAddress: draft.motherAddress,
        targetClassId: draft.targetClassId,
        payNow: draft.payNow,
        paymentMethod: draft.paymentMethod,
        paymentAmount: draft.paymentAmount,
        transactionId: draft.transactionId,
      });
      setPhotoUrl(draft.photoUrl ?? null);
      setBirthCertUrl(draft.birthCertUrl ?? null);
      setFatherNidUrl(draft.fatherNidUrl ?? null);
      setMotherNidUrl(draft.motherNidUrl ?? null);
      setGuardianNidUrl(draft.guardianNidUrl ?? null);
      setFatherPhotoUrl(draft.fatherPhotoUrl ?? null);
      setMotherPhotoUrl(draft.motherPhotoUrl ?? null);
    } catch {}
  };

  useEffect(() => {
    if (user) {
      if (!watch("applicantName") && (user as any).name) setValue("applicantName", (user as any).name);
      if (!watch("studentEmail") && user.email) setValue("studentEmail", user.email);
    }
  }, [user, setValue, watch]);

  // Check for existing admission application
  useEffect(() => {
    const checkExistingApplication = async () => {
      try {
        setCheckingApplication(true);
        const res = await api.get("/admission/my-applications");
        const applications = res.data?.data ?? res.data ?? [];
        if (applications.length > 0) {
          // Show the most recent application
          const latest = applications[applications.length - 1];
          setExistingApplication(latest);
        }
      } catch (error) {
        // No application found or error - continue
        console.log("No existing application found");
      } finally {
        setCheckingApplication(false);
      }
    };
    checkExistingApplication();
  }, []);

  useEffect(() => {
    const loadClasses = async () => {
      setLoadingClasses(true);
      setClassLoadError(null);
      try {
        const res = await api.get("/admission/classes");
        const data = res.data?.data ?? res.data;
        setClasses(data || []);
      } catch (err: any) {
        const message = err?.response?.data?.message || "Class load failed";
        setClassLoadError(message);
        toast.error(message);
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    restoreDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId || stripePaid || stripeVerifying) return;

    const verify = async () => {
      setStripeVerifying(true);
      try {
        restoreDraft();
        const res = await api.get("/admission/stripe/verify", { params: { session_id: sessionId } });
        const payload = res.data?.data ?? res.data;
        if (payload?.paid) {
          setStripePaid(true);
          setValue("payNow", true);
          setValue("paymentMethod", "STRIPE");
          if (payload.amountTotal) setValue("paymentAmount", payload.amountTotal);
          setValue("transactionId", sessionId);
          toast.success("Stripe payment verified");
          if (!autoSubmitRef.current) {
            autoSubmitRef.current = true;
            await submitDraftForStripe(sessionId, payload.amountTotal);
          }
        } else {
          toast.error("Stripe payment not completed");
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Stripe verification failed");
      } finally {
        setStripeVerifying(false);
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setValue, stripePaid, stripeVerifying]);

  const handleStripeCheckout = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error("Enter the payment amount");
      return;
    }
    try {
      saveDraft();
      const res = await api.post("/admission/stripe/checkout", {
        amount: paymentAmount, applicantName, targetClassId,
      });
      const payload = res.data?.data ?? res.data;
      if (payload?.url) window.location.href = payload.url;
      else toast.error("Stripe checkout URL was not found");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Stripe checkout failed");
    }
  };

  const onSubmit: SubmitHandler<FormInput> = async (data) => {
    if (!isAdmin && (!isAuthenticated || !user)) {
      toast.error("You must be logged in to submit your admission application.");
      router.push(`/login?redirect=${encodeURIComponent("/apply-for-admission")}`);
      return;
    }

    try {
      if (!photoUrl) {
        toast.error("Student photo is required");
        return;
      }
      if (!birthCertUrl) {
        toast.error("Birth certificate is required");
        return;
      }
      if (!guardianNidUrl) {
        toast.error("Guardian NID is required");
        return;
      }
      if (!fatherNidUrl) {
        toast.error("Father's NID is required");
        return;
      }
      if (!motherNidUrl) {
        toast.error("Mother's NID is required");
        return;
      }
      if (!fatherPhotoUrl) {
        toast.error("Father's photo is required");
        return;
      }
      if (!motherPhotoUrl) {
        toast.error("Mother's photo is required");
        return;
      }
      if (!data.payNow || !data.paymentMethod || !data.paymentAmount) {
        toast.error("Payment is required");
        return;
      }
      if (!isAdmin && data.payNow && data.paymentMethod === "STRIPE" && !stripePaid) {
        toast.error("Complete the Stripe payment");
        return;
      }
      
      const endpoint = isAdmin ? "/admission" : "/admission/apply";
      
      await api.post(endpoint, {
        ...data,
        paymentMethod: data.payNow ? data.paymentMethod : undefined,
        paymentAmount: data.payNow ? data.paymentAmount : undefined,
        transactionId: data.payNow ? data.transactionId : undefined,
        photoUrl: photoUrl || undefined,
        birthCertUrl: birthCertUrl || undefined,
        fatherNid: fatherNidUrl || data.fatherNid || undefined,
        motherNid: motherNidUrl || data.motherNid || undefined,
        guardianRelation: data.guardianRelation,
        guardianNidUrl,
        fatherPhotoUrl,
        motherPhotoUrl,
      });
      toast.success("Admission application submitted");
      finalizeSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Application failed");
    }
  };

  const uploadDocument = async (file: File, type: "photo" | "birthCert" | "fatherNid" | "motherNid" | "guardianNid" | "fatherPhoto" | "motherPhoto") => {
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
      else if (type === "birthCert") setBirthCertUrl(url);
      else if (type === "fatherNid") setFatherNidUrl(url);
      else if (type === "motherNid") setMotherNidUrl(url);
      else if (type === "guardianNid") setGuardianNidUrl(url);
      else if (type === "fatherPhoto") setFatherPhotoUrl(url);
      else if (type === "motherPhoto") setMotherPhotoUrl(url);
      toast.success("Document uploaded");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
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
        {/* Success banner */}
        <AnimatePresence>
          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-500/10 backdrop-blur p-4 shadow-lg shadow-emerald-500/10"
            >
              <div className="grid place-items-center h-10 w-10 rounded-full bg-emerald-500 text-white shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-800 dark:text-emerald-200">
                  Payment verified and admission submitted!
                </h3>
                <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                  Your Stripe payment has been verified. The admission application was submitted successfully.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing Application Status Banner */}
        <AnimatePresence>
          {existingApplication && !checkingApplication && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              className={`mb-6 flex items-start gap-3 rounded-2xl border backdrop-blur p-4 shadow-lg ${
                existingApplication.status === "APPROVED"
                  ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-500/10"
                  : existingApplication.status === "PENDING"
                  ? "border-yellow-200 dark:border-yellow-500/30 bg-yellow-50/80 dark:bg-yellow-500/10"
                  : "border-red-200 dark:border-red-500/30 bg-red-50/80 dark:bg-red-500/10"
              }`}
            >
              <div className="flex-1">
                <h3 className={`font-bold ${
                  existingApplication.status === "APPROVED" ? "text-emerald-800 dark:text-emerald-200"
                  : existingApplication.status === "PENDING" ? "text-yellow-800 dark:text-yellow-200"
                  : "text-red-800 dark:text-red-200"
                }`}>
                  {existingApplication.status === "APPROVED" && "Your admission has been approved!"}
                  {existingApplication.status === "PENDING" && "⏳ Your admission is pending"}
                  {existingApplication.status === "REJECTED" && "❌ Your admission has been rejected"}
                </h3>
                <p className={`text-sm mt-0.5 ${
                  existingApplication.status === "APPROVED" ? "text-emerald-700/80 dark:text-emerald-300/80"
                  : existingApplication.status === "PENDING" ? "text-yellow-700/80 dark:text-yellow-300/80"
                  : "text-red-700/80 dark:text-red-300/80"
                }`}>
                  {existingApplication.status === "APPROVED" && "You can log in to your student dashboard. No new application is needed."}
                  {existingApplication.status === "PENDING" && "An admin is reviewing your application. Please wait."}
                  {existingApplication.status === "REJECTED" && `Reason: ${existingApplication.rejectionReason || "Not specified"}. You can apply again.`}
                </p>
                {existingApplication.status === "APPROVED" && (
                  <Link
                    href="/student-login?redirect=/dashboard/student"
                    className="mt-3 inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Go to Student Dashboard
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            New Admission · 2024–25
          </div>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-700 to-violet-700 dark:from-white dark:via-indigo-300 dark:to-violet-300 bg-clip-text text-transparent">
            Student Admission Form
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Enter all information correctly. The guardian phone and email must be valid.
          </p>
        </motion.div>

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
            {/* Student Info */}
            <div>
              <h2 className={sectionTitleCls}>
                <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                  <User className="h-4 w-4" />
                </span>
                Student Information
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field delay={0.05}>
                  <label className={labelCls}><User className="h-3.5 w-3.5 text-indigo-500" /> Student Name</label>
                  <input {...register("applicantName")} className={inputCls} placeholder="Full name" />
                  {errors.applicantName && <p className={errCls}>{errors.applicantName.message}</p>}
                </Field>

                <Field delay={0.1}>
                  <label className={labelCls}><Mail className="h-3.5 w-3.5 text-indigo-500" /> Student Email (for login)</label>
                  <input type="email" {...register("studentEmail")} className={inputCls} placeholder="student@email.com" />
                  {errors.studentEmail && <p className={errCls}>{errors.studentEmail.message}</p>}
                </Field>

                <Field delay={0.12}>
                  <label className={labelCls}><Phone className="h-3.5 w-3.5 text-indigo-500" /> Student Phone</label>
                  <input type="tel" {...register("studentPhone")} className={inputCls} placeholder="01XXXXXXXXX" />
                  {errors.studentPhone && <p className={errCls}>{errors.studentPhone.message}</p>}
                </Field>

                <Field delay={0.15}>
                  <label className={labelCls}><Calendar className="h-3.5 w-3.5 text-indigo-500" /> Date of Birth</label>
                  <input type="date" max={new Date(new Date().setFullYear(new Date().getFullYear() - 3)).toISOString().slice(0, 10)} {...register("dob")} className={inputCls} />
                  {errors.dob && <p className={errCls}>{errors.dob.message}</p>}
                </Field>

                <Field delay={0.2}>
                  <label className={labelCls}><Users className="h-3.5 w-3.5 text-indigo-500" /> Gender</label>
                  <select {...register("gender")} className={selectCls}>
                    <option className={optionCls} value="">Select gender</option>
                    <option className={optionCls} value="MALE">Male</option>
                    <option className={optionCls} value="FEMALE">Female</option>
                    <option className={optionCls} value="OTHER">Other</option>
                  </select>
                  {errors.gender && <p className={errCls}>{errors.gender.message}</p>}
                </Field>

                <Field delay={0.25}>
                  <label className={labelCls}><Droplet className="h-3.5 w-3.5 text-rose-500" /> Blood Group</label>
                  <select {...register("bloodGroup")} className={selectCls}>
                    <option className={optionCls} value="">Select blood group</option>
                    <option className={optionCls} value="A_POS">A+</option><option className={optionCls} value="A_NEG">A-</option>
                    <option className={optionCls} value="B_POS">B+</option><option className={optionCls} value="B_NEG">B-</option>
                    <option className={optionCls} value="O_POS">O+</option><option className={optionCls} value="O_NEG">O-</option>
                    <option className={optionCls} value="AB_POS">AB+</option><option className={optionCls} value="AB_NEG">AB-</option>
                  </select>
                </Field>

                <Field delay={0.25}>
                  <label className={labelCls}><BookOpen className="h-3.5 w-3.5 text-indigo-500" /> Religion</label>
                  <input {...register("religion")} className={inputCls} placeholder="Optional" />
                </Field>

                <Field delay={0.3}>
                  <label className={labelCls}><GraduationCap className="h-3.5 w-3.5 text-violet-500" /> Applying Class</label>
                  <select {...register("targetClassId")} className={selectCls} disabled={loadingClasses}>
                    <option className={optionCls} value="">{loadingClasses ? "Loading classes..." : "Select class"}</option>
                    {classes.map((cls) => (
                      <option className={optionCls} key={cls.id} value={cls.id}>
                        {cls.name} (Class {cls.numericLevel})
                      </option>
                    ))}
                  </select>
                  {loadingClasses && <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading classes...</p>}
                  {!loadingClasses && classes.length === 0 && !classLoadError && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">No classes available. Please add classes from the admin panel.</p>
                  )}
                  {classLoadError && <p className={errCls}>{classLoadError}</p>}
                  {errors.targetClassId && <p className={errCls}>{errors.targetClassId.message}</p>}
                </Field>

                <Field delay={0.35} span={2}>
                  <label className={labelCls}><MapPin className="h-3.5 w-3.5 text-indigo-500" /> Address</label>
                  <textarea {...register("address")} rows={3} className={inputCls} placeholder="Full address" />
                  {errors.address && <p className={errCls}>{errors.address.message}</p>}
                </Field>

                <Field delay={0.36}>
                  <label className={labelCls}>House/Road</label>
                  <input {...register("presentHouseRoad")} className={inputCls} placeholder="House and road" />
                </Field>
                <Field delay={0.37}>
                  <label className={labelCls}>Area</label>
                  <input {...register("presentArea")} className={inputCls} placeholder="Area" />
                </Field>
                <Field delay={0.38}>
                  <label className={labelCls}>City</label>
                  <input {...register("presentCity")} className={inputCls} placeholder="City" />
                </Field>
                <Field delay={0.39}>
                  <label className={labelCls}>District</label>
                  <input {...register("presentDistrict")} className={inputCls} placeholder="District" />
                </Field>
                <Field delay={0.4}>
                  <label className={labelCls}>Postal Code</label>
                  <input {...register("presentPostalCode")} className={inputCls} placeholder="Postal code" />
                </Field>

                <Field delay={0.4} span={2}>
                  <label className={labelCls}><ImageIcon className="h-3.5 w-3.5 text-emerald-500" /> Student Photo <span className="text-red-500 font-normal">(required)</span></label>
                  <label className="mt-2 group flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur px-4 py-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 transition">
                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {photoUrl ? "✓ Photo uploaded" : "Click to upload student photo"}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-indigo-600 dark:text-indigo-300 group-hover:translate-x-0.5 transition">Browse</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDocument(f, "photo"); }} />
                  </label>
                  {uploading.photo && <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</p>}
                </Field>

                <Field delay={0.45} span={2}>
                  <label className={labelCls}><FileText className="h-3.5 w-3.5 text-emerald-500" /> Birth Certificate <span className="text-red-500 font-normal">(required)</span></label>
                  <label className="mt-2 group flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur px-4 py-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 transition">
                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {birthCertUrl ? "✓ Document uploaded" : "Click to upload birth certificate"}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-indigo-600 dark:text-indigo-300 group-hover:translate-x-0.5 transition">Browse</span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDocument(f, "birthCert"); }} />
                  </label>
                  {uploading.birthCert && <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</p>}
                </Field>
              </div>
            </div>

            {/* Guardian Info */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-8">
              <h2 className={sectionTitleCls}>
                <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white">
                  <Users className="h-4 w-4" />
                </span>
                Guardian Information
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field delay={0.05}>
                  <label className={labelCls}><User className="h-3.5 w-3.5 text-sky-500" /> Guardian Name (Father or Mother or Others)</label>
                  <input {...register("guardianName")} className={inputCls} placeholder="Guardian name" />
                  {errors.guardianName && <p className={errCls}>{errors.guardianName.message}</p>}
                </Field>

                <Field delay={0.1}>
                  <label className={labelCls}><Phone className="h-3.5 w-3.5 text-sky-500" /> Guardian Phone</label>
                  <input {...register("guardianPhone")} className={inputCls} placeholder="01XXXXXXXXX" />
                  {errors.guardianPhone && <p className={errCls}>{errors.guardianPhone.message}</p>}
                </Field>

                <Field delay={0.15}>
                  <label className={labelCls}><Users className="h-3.5 w-3.5 text-sky-500" /> Guardian Relation</label>
                  <select {...register("guardianRelation")} className={selectCls}>
                    <option className={optionCls} value="">Select relation</option>
                    <option className={optionCls} value="FATHER">Father</option>
                    <option className={optionCls} value="MOTHER">Mother</option>
                    <option className={optionCls} value="OTHER">Other</option>
                  </select>
                  {errors.guardianRelation && <p className={errCls}>{errors.guardianRelation.message}</p>}
                </Field>

                <Field delay={0.15}>
                  <label className={labelCls}><Mail className="h-3.5 w-3.5 text-sky-500" /> Guardian Email</label>
                  <input type="email" {...register("guardianEmail")} className={inputCls} placeholder="guardian@gmail.com" />
                  {errors.guardianEmail && <p className={errCls}>{errors.guardianEmail.message}</p>}
                </Field>

                <Field delay={0.18} span={2}>
                  <label className={labelCls}><FileText className="h-3.5 w-3.5 text-emerald-500" /> Guardian NID <span className="text-red-500 font-normal">(required)</span></label>
                  <label className="mt-2 group flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur px-4 py-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 transition">
                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {guardianNidUrl ? "✓ Guardian NID uploaded" : "Click to upload Guardian NID"}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-indigo-600 dark:text-indigo-300 group-hover:translate-x-0.5 transition">Browse</span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDocument(f, "guardianNid"); }} />
                  </label>
                  {uploading.guardianNid && <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</p>}
                </Field>

                <Field delay={0.2} span={2}>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">Father&apos;s Information</h3>
                </Field>
                {([
                  ["fatherFullName", "Father's Full Name"], ["fatherPhone", "Father's Phone Number"], ["fatherEmail", "Father's Email"],
                  ["fatherOccupation", "Occupation"], ["fatherOrganization", "Organization/Company"], ["fatherDesignation", "Designation"], ["fatherIncome", "Monthly/Annual Income (optional)"], ["fatherAddress", "Address"],
                ] as const).map(([name, label]) => (
                  <Field key={name} delay={0.22}>
                    <label className={labelCls}>{label}</label>
                    <input type={name.endsWith("Email") ? "email" : "text"} {...register(name)} className={inputCls} placeholder={label} />
                  </Field>
                ))}
                
                <Field delay={0.25} span={2}>
                  <label className={labelCls}><ImageIcon className="h-3.5 w-3.5 text-emerald-500" /> Father&apos;s NID Image <span className="text-red-500 font-normal">(required)</span></label>
                  <label className="mt-2 group flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur px-4 py-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 transition">
                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {fatherNidUrl ? "✓ NID uploaded" : "Click to upload Father's NID"}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-indigo-600 dark:text-indigo-300 group-hover:translate-x-0.5 transition">Browse</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDocument(f, "fatherNid"); }} />
                  </label>
                  {uploading.fatherNid && <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</p>}
                </Field>
                
                <Field delay={0.26} span={2}>
                  <label className={labelCls}><ImageIcon className="h-3.5 w-3.5 text-emerald-500" /> Father&apos;s Photo <span className="text-red-500 font-normal">(required)</span></label>
                  <label className="mt-2 group flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur px-4 py-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 transition">
                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {fatherPhotoUrl ? "✓ Photo uploaded" : "Click to upload Father's Photo"}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-indigo-600 dark:text-indigo-300 group-hover:translate-x-0.5 transition">Browse</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDocument(f, "fatherPhoto"); }} />
                  </label>
                  {uploading.fatherPhoto && <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</p>}
                </Field>

                <Field delay={0.3} span={2}>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">Mother&apos;s Information</h3>
                </Field>
                {([
                  ["motherFullName", "Mother's Full Name"], ["motherPhone", "Mother's Phone Number"], ["motherEmail", "Mother's Email"],
                  ["motherOccupation", "Occupation"], ["motherOrganization", "Organization/Company"], ["motherDesignation", "Designation"], ["motherIncome", "Monthly/Annual Income (optional)"], ["motherAddress", "Address"],
                ] as const).map(([name, label]) => (
                  <Field key={name} delay={0.32}>
                    <label className={labelCls}>{label}</label>
                    <input type={name.endsWith("Email") ? "email" : "text"} {...register(name)} className={inputCls} placeholder={label} />
                  </Field>
                ))}

                <Field delay={0.35} span={2}>
                  <label className={labelCls}><ImageIcon className="h-3.5 w-3.5 text-emerald-500" /> Mother&apos;s NID Image <span className="text-red-500 font-normal">(required)</span></label>
                  <label className="mt-2 group flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur px-4 py-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 transition">
                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {motherNidUrl ? "✓ NID uploaded" : "Click to upload Mother's NID"}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-indigo-600 dark:text-indigo-300 group-hover:translate-x-0.5 transition">Browse</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDocument(f, "motherNid"); }} />
                  </label>
                  {uploading.motherNid && <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</p>}
                </Field>
                
                <Field delay={0.36} span={2}>
                  <label className={labelCls}><ImageIcon className="h-3.5 w-3.5 text-emerald-500" /> Mother&apos;s Photo <span className="text-red-500 font-normal">(required)</span></label>
                  <label className="mt-2 group flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur px-4 py-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 transition">
                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {motherPhotoUrl ? "✓ Photo uploaded" : "Click to upload Mother's Photo"}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-indigo-600 dark:text-indigo-300 group-hover:translate-x-0.5 transition">Browse</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDocument(f, "motherPhoto"); }} />
                  </label>
                  {uploading.motherPhoto && <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</p>}
                </Field>
              </div>
            </div>

            {/* Payment */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-8">
              <h2 className={sectionTitleCls}>
                <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <CreditCard className="h-4 w-4" />
                </span>
                Payment <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(required)</span>
              </h2>

              <div className="hidden">
                <input type="checkbox" {...register("payNow")} defaultChecked={true} />
              </div>

              <AnimatePresence>
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
                        <select {...register("paymentMethod")} className={selectCls}>
                          <option className={optionCls} value="">Select method</option>
                          <option className={optionCls} value="CASH">Cash</option>
                          <option className={optionCls} value="STRIPE">Stripe</option>
                        </select>
                        {errors.paymentMethod && <p className={errCls}>{errors.paymentMethod.message}</p>}
                      </Field>

                      <Field delay={0.1}>
                        <label className={labelCls}>Amount</label>
                        <input type="number" {...register("paymentAmount")} className={inputCls} placeholder="0.00" />
                        {errors.paymentAmount && <p className={errCls}>{errors.paymentAmount.message}</p>}
                      </Field>

                      <Field delay={0.15} span={2}>
                        <label className={labelCls}>Transaction ID <span className="text-slate-400 font-normal">(optional)</span></label>
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
                              <><CheckCircle2 className="h-4 w-4" /> Stripe Paid</>
                            ) : stripeVerifying ? (
                              <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
                            ) : (
                              <><CreditCard className="h-4 w-4" /> Pay with Stripe</>
                            )}
                          </motion.button>
                        </Field>
                      )}
                    </div>
                  </motion.div>
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
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                ) : isStripeFlow && !stripePaid ? (
                  <><CreditCard className="h-4 w-4" /> Complete Stripe Payment</>
                ) : (
                  <><ShieldCheck className="h-4 w-4" /> Submit Admission</>
                )}
              </motion.button>
              {isStripeFlow && !stripePaid && (
                <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                  The application will be submitted automatically after Stripe payment is complete.
                </p>
              )}
            </div>
          </div>
        </motion.form>
      </div>
    </section>
  );
}
