/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  X,
  User,
  Mail,
  Calendar,
  Users,
  Droplet,
  BookOpen,
  MapPin,
  Phone,
  GraduationCap,
  FileText,
  Sparkles,
  Loader2,
  UserPlus,
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useCreateAdmission } from "./useAdmission";

const schema = z.object({
  applicantName: z.string().min(1, "Student নাম দাও"),
  studentEmail: z.string().email("Student email ঠিক নয়"),
  dob: z.string().min(1, "জন্ম তারিখ দাও"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { message: "Gender select করো" }),
  bloodGroup: z
    .enum(["A_POS", "A_NEG", "B_POS", "B_NEG", "O_POS", "O_NEG", "AB_POS", "AB_NEG"])
    .optional(),
  religion: z.string().optional(),
  address: z.string().min(1, "ঠিকানা দাও"),
  guardianName: z.string().min(1, "Guardian নাম দাও"),
  guardianPhone: z.string().min(7, "Guardian phone দাও"),
  guardianEmail: z.string().email("Guardian email ঠিক নয়"),
  targetClassId: z.string().min(1, "Class select করো"),
});

type FormInput = z.input<typeof schema>;
type ClassOption = { id: string; name: string; numericLevel: number };

export default function AdminAdmissionForm({ onClose }: { onClose: () => void }) {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [birthCertUrl, setBirthCertUrl] = useState<string | null>(null);

  const { mutate: createAdmission, isPending: isSubmitting } = useCreateAdmission();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput>({ resolver: zodResolver(schema) as any });

  useEffect(() => {
    const loadClasses = async () => {
      setLoadingClasses(true);
      try {
        const res = await api.get("/admission/classes");
        const data = res.data?.data ?? res.data;
        setClasses(data || []);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Class load failed");
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClasses();
  }, []);

  const uploadDocument = async (file: File, type: "photo" | "birthCert") => {
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
      toast.success("Document upload হয়েছে");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Upload failed");
    }
  };

  const onSubmit: SubmitHandler<FormInput> = async (data) => {
    createAdmission(
      {
        ...data,
        photoUrl: photoUrl || undefined,
        birthCertUrl: birthCertUrl || undefined,
      },
      {
        onSuccess: () => {
          reset();
          setPhotoUrl(null);
          setBirthCertUrl(null);
          onClose();
        },
      }
    );
  };

  const inputCls =
    "mt-2 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20";
  const labelCls = "flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200";
  const errCls = "text-xs text-red-500 dark:text-red-400 mt-1";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }}
        transition={{ type: "spring", damping: 22, stiffness: 220 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 bg-gradient-to-r from-sky-500/15 via-indigo-500/15 to-violet-500/15">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  নতুন Admission
                  <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-300" />
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">নতুন student admission তৈরি করুন</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:text-rose-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Student Info */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-500" /> Student Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls}>
                  <User className="h-3.5 w-3.5 text-indigo-500" /> Student Name
                </label>
                <input {...register("applicantName")} placeholder="পূর্ণ নাম" className={inputCls} />
                {errors.applicantName && <p className={errCls}>{errors.applicantName.message}</p>}
              </div>
              <div>
                <label className={labelCls}>
                  <Mail className="h-3.5 w-3.5 text-indigo-500" /> Email
                </label>
                <input type="email" {...register("studentEmail")} placeholder="student@email.com" className={inputCls} />
                {errors.studentEmail && <p className={errCls}>{errors.studentEmail.message}</p>}
              </div>
              <div>
                <label className={labelCls}>
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" /> DOB
                </label>
                <input type="date" {...register("dob")} className={inputCls} />
                {errors.dob && <p className={errCls}>{errors.dob.message}</p>}
              </div>
              <div>
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
              </div>
              <div>
                <label className={labelCls}>
                  <Droplet className="h-3.5 w-3.5 text-rose-500" /> Blood Group
                </label>
                <select {...register("bloodGroup")} className={inputCls}>
                  <option value="">Select</option>
                  <option value="A_POS">A+</option>
                  <option value="A_NEG">A-</option>
                  <option value="B_POS">B+</option>
                  <option value="B_NEG">B-</option>
                  <option value="O_POS">O+</option>
                  <option value="O_NEG">O-</option>
                  <option value="AB_POS">AB+</option>
                  <option value="AB_NEG">AB-</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>
                  <BookOpen className="h-3.5 w-3.5 text-indigo-500" /> Religion
                </label>
                <input {...register("religion")} placeholder="Optional" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>
                  <GraduationCap className="h-3.5 w-3.5 text-violet-500" /> Applying Class
                </label>
                <select {...register("targetClassId")} className={inputCls} disabled={loadingClasses}>
                  <option value="">Select Class</option>
                  {(classes as any[]).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.targetClassId && <p className={errCls}>{errors.targetClassId.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>
                  <MapPin className="h-3.5 w-3.5 text-indigo-500" /> Address
                </label>
                <textarea {...register("address")} rows={3} placeholder="পূর্ণ ঠিকানা" className={inputCls} />
                {errors.address && <p className={errCls}>{errors.address.message}</p>}
              </div>
            </div>
          </div>

          {/* Guardian Info */}
          <div className="border-t border-slate-200 dark:border-white/10 pt-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-500" /> Guardian Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls}>
                  <User className="h-3.5 w-3.5 text-sky-500" /> Guardian Name
                </label>
                <input {...register("guardianName")} placeholder="Guardian নাম" className={inputCls} />
                {errors.guardianName && <p className={errCls}>{errors.guardianName.message}</p>}
              </div>
              <div>
                <label className={labelCls}>
                  <Phone className="h-3.5 w-3.5 text-sky-500" /> Guardian Phone
                </label>
                <input {...register("guardianPhone")} placeholder="01XXXXXXXXX" className={inputCls} />
                {errors.guardianPhone && <p className={errCls}>{errors.guardianPhone.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>
                  <Mail className="h-3.5 w-3.5 text-sky-500" /> Guardian Email
                </label>
                <input type="email" {...register("guardianEmail")} placeholder="guardian@email.com" className={inputCls} />
                {errors.guardianEmail && <p className={errCls}>{errors.guardianEmail.message}</p>}
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="border-t border-slate-200 dark:border-white/10 pt-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-500" /> Documents (Optional)
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 px-4 py-3 cursor-pointer hover:border-indigo-400 transition">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {photoUrl ? "✓ Photo Uploaded" : "Upload Photo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) uploadDocument(e.target.files[0], "photo");
                  }}
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 px-4 py-3 cursor-pointer hover:border-indigo-400 transition">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {birthCertUrl ? "✓ Birth Cert Uploaded" : "Upload Birth Certificate"}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) uploadDocument(e.target.files[0], "birthCert");
                  }}
                />
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30 disabled:opacity-60 flex items-center justify-center gap-2 transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Create Admission
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
