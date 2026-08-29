/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  Hash,
  GraduationCap,
  Users,
  Calendar,
  MapPin,
  Droplet,
  Heart,
  Loader2,
  UserPlus,
  Save,
} from "lucide-react";
import { useCreateStudent, useUpdateStudent, useStudents } from "./useStudents";
import { useClasses, useClass } from "../class/useClasses";
import { Student } from "./student.types";

const baseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().optional(),
  password: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  rollNumber: z.string().min(1, "Roll number is required"),
  classId: z.string().min(1, "Class is required"),
  gender: z.enum(["Male", "Female", "Other"]).refine((v) => v, "Gender is required"),
  address: z.string().min(1, "Address is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .refine((v) => v, "Blood group is required"),
  guardianName: z.string().min(1, "Guardian name is required"),
  guardianEmail: z.string().email("Guardian email is required"),
  guardianPhone: z.string().min(1, "Guardian phone is required"),
  guardianRelation: z.string().min(1, "Guardian relation is required"),
});

type FormData = z.infer<typeof baseSchema>;
interface Props {
  student?: Student | null;
  onClose: () => void;
  mode?: "admin" | "student";
}

const inputCls =
  "w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400";

const labelCls =
  "flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5";

const errCls = "mt-1 text-xs text-rose-500 dark:text-rose-400";

export default function StudentForm({ student, onClose, mode = "admin" }: Props) {
  const { mutate: create, isPending: creating } = useCreateStudent();
  const { mutate: update, isPending: updating } = useUpdateStudent();
  const { data: classes = [], isLoading: isLoadingClasses } = useClasses();
  const { data: studentsData, isLoading: isLoadingStudents } = useStudents();
  const students = Array.isArray(studentsData) ? studentsData : [];

  const schema = baseSchema.superRefine((data, ctx) => {
    if (mode === "student" && !student) {
      if (!data.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["email"],
          message: "Email is required for self-registration",
        });
      }
      if (!data.password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "Password is required",
        });
      }
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedClassId = watch("classId");
  const { data: selectedClass } = useClass(selectedClassId);

  const rollNumbersData = useMemo(() => {
    if (!selectedClassId) return { all: [], assigned: new Set<number>() };
    try {
      const validStudents = Array.isArray(students) ? students.filter((s) => s != null) : [];
      const capacity = selectedClass?.sections?.[0]?.maxCapacity || 50;

      if (validStudents.length === 0) {
        const all: number[] = [];
        for (let i = 1; i <= capacity; i++) all.push(i);
        return { all, assigned: new Set<number>() };
      }

      const classStudents = validStudents.filter(
        (s) => s && String(s.classId) === String(selectedClassId),
      );
      const assigned = new Set<number>();
      classStudents.forEach((s) => {
        try {
          if (s?.rollNumber) {
            const num = parseInt(String(s.rollNumber).trim(), 10);
            if (!isNaN(num) && num > 0 && num < 1000) assigned.add(num);
          }
        } catch {}
      });
      if (capacity <= 0) return { all: [], assigned };
      const all: number[] = [];
      for (let i = 1; i <= Math.min(capacity, 500); i++) all.push(i);
      return { all, assigned };
    } catch {
      return { all: [], assigned: new Set<number>() };
    }
  }, [selectedClassId, students, selectedClass?.sections]);

  useEffect(() => {
    if (student) {
      let normalizedGender: "Male" | "Female" | "Other" | undefined;
      if (student.gender) {
        if (student.gender.toUpperCase() === "MALE") normalizedGender = "Male";
        else if (student.gender.toUpperCase() === "FEMALE") normalizedGender = "Female";
        else normalizedGender = student.gender as any;
      }
      reset({
        name: student.name || "",
        email: student.email || "",
        phone: student.phone ? String(student.phone).trim() : undefined,
        rollNumber: student.rollNumber ? String(student.rollNumber).trim() : undefined,
        address: student.address || "",
        gender: normalizedGender,
        dateOfBirth: student.dateOfBirth ? String(student.dateOfBirth).slice(0, 10) : undefined,
        classId: student.classId ? String(student.classId).trim() : undefined,
        bloodGroup: (student as any)?.bloodGroup || undefined,
        guardianName: (student as any)?.guardianName || undefined,
        guardianEmail: (student as any)?.guardianEmail || undefined,
        guardianPhone: (student as any)?.guardianPhone || undefined,
        guardianRelation: (student as any)?.guardianRelation || undefined,
      });
    }
  }, [student, reset]);

  const onSubmit = (data: FormData) => {
    try {
      const formattedData: any = {
        name: String(data.name || "").trim(),
        phone: String(data.phone || "").trim(),
        rollNumber: String(data.rollNumber || "").trim(),
        classId: String(data.classId || "").trim(),
        gender: data.gender,
        address: String(data.address || "").trim(),
        dateOfBirth: String(data.dateOfBirth || "").trim(),
        bloodGroup: data.bloodGroup,
        guardianName: String(data.guardianName || "").trim(),
        guardianEmail: String(data.guardianEmail || "").trim(),
        guardianPhone: String(data.guardianPhone || "").trim(),
        guardianRelation: String(data.guardianRelation || "").trim(),
      };
      if (data.email && String(data.email).trim()) formattedData.email = String(data.email).trim();
      if (data.password && String(data.password).trim())
        formattedData.password = String(data.password).trim();

      if (!formattedData.name) {
        alert("Name is required");
        return;
      }
      if (mode === "student" && !formattedData.email) {
        alert("Email is required for self-registration");
        return;
      }
      if (mode === "admin" && data.email && !String(data.email).includes("@")) {
        alert("Please enter a valid email address");
        return;
      }

      if (student) {
        update({ id: student.id, data: formattedData }, { onSuccess: onClose });
      } else {
        create(formattedData, { onSuccess: onClose });
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      alert("An error occurred while submitting the form. Please check the console.");
    }
  };

  const isPending = creating || updating;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 22, stiffness: 240 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-3xl border border-white/20 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-2xl shadow-indigo-500/20"
        >
          {/* Decorative orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
            <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-sky-400/20 dark:bg-sky-500/10 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-violet-400/20 dark:bg-violet-500/10 blur-3xl" />
          </div>

          {/* Header */}
          <div className="relative flex items-center justify-between px-6 py-5 border-b border-slate-200/70 dark:border-white/10 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-slate-800/60 dark:via-indigo-950/40 dark:to-violet-950/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                {student ? (
                  <Save className="h-5 w-5 text-white" />
                ) : (
                  <UserPlus className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-extrabold bg-gradient-to-r from-slate-900 via-indigo-700 to-violet-700 dark:from-white dark:via-indigo-200 dark:to-violet-200 bg-clip-text text-transparent">
                  {student
                    ? "Student Edit"
                    : mode === "admin"
                      ? "Add Student (Admin)"
                      : "Student Registration"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Complete all information correctly
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Scrollable form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="relative overflow-y-auto max-h-[calc(92vh-160px)] px-6 py-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className={labelCls}>
                  <User className="h-3.5 w-3.5 text-indigo-500" /> Name
                </label>
                <input
                  {...register("name")}
                  placeholder="Full name"
                  className={inputCls}
                />
                {errors.name && <p className={errCls}>{errors.name.message}</p>}
              </div>

              {/* Email */}
              {mode === "student" && (
                <div>
                  <label className={labelCls}>
                    <Mail className="h-3.5 w-3.5 text-indigo-500" /> Email
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                  {errors.email && <p className={errCls}>{errors.email.message}</p>}
                </div>
              )}

              {/* Password */}
              {mode === "student" && !student && (
                <div>
                  <label className={labelCls}>
                    <Lock className="h-3.5 w-3.5 text-indigo-500" /> Password
                  </label>
                  <input
                    {...register("password")}
                    type="password"
                    placeholder="••••••••"
                    className={inputCls}
                  />
                  {errors.password && <p className={errCls}>{errors.password.message}</p>}
                </div>
              )}

              {/* Phone */}
              <div>
                <label className={labelCls}>
                  <Phone className="h-3.5 w-3.5 text-indigo-500" /> Phone
                </label>
                <input
                  {...register("phone")}
                  placeholder="01XXXXXXXXX"
                  className={inputCls}
                />
                {errors.phone && <p className={errCls}>{errors.phone.message}</p>}
              </div>

              {/* Class */}
              <div>
                <label className={labelCls}>
                  <GraduationCap className="h-3.5 w-3.5 text-indigo-500" /> Class
                </label>
                <select {...register("classId")} className={inputCls}>
                  <option value="">-- Select a Class --</option>
                  {isLoadingClasses ? (
                    <option disabled>Loading classes...</option>
                  ) : classes.length > 0 ? (
                    classes.map((cls: any) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No classes available</option>
                  )}
                </select>
                {errors.classId && <p className={errCls}>{errors.classId.message}</p>}
              </div>

              {/* Roll Number */}
              <div>
                <label className={labelCls}>
                  <Hash className="h-3.5 w-3.5 text-indigo-500" /> Roll Number
                </label>
                {selectedClassId ? (
                  <select {...register("rollNumber")} className={inputCls}>
                    <option value="">-- Select Roll Number --</option>
                    {isLoadingStudents ? (
                      <option disabled>Loading roll numbers...</option>
                    ) : rollNumbersData?.all?.length > 0 ? (
                      rollNumbersData.all.map((num) => {
                        const isAssigned = rollNumbersData.assigned?.has(num);
                        return (
                          <option key={num} value={num} disabled={isAssigned}>
                            {num} {isAssigned ? "(Assigned)" : ""}
                          </option>
                        );
                      })
                    ) : (
                      <option disabled>No roll numbers available</option>
                    )}
                  </select>
                ) : (
                  <input
                    disabled
                    placeholder="Select class first"
                    className={`${inputCls} opacity-60 cursor-not-allowed`}
                  />
                )}
                {errors.rollNumber && <p className={errCls}>{errors.rollNumber.message}</p>}
              </div>

              {/* Gender */}
              <div>
                <label className={labelCls}>
                  <Users className="h-3.5 w-3.5 text-indigo-500" /> Gender
                </label>
                <select {...register("gender")} className={inputCls}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className={errCls}>{errors.gender.message}</p>}
              </div>

              {/* DOB */}
              <div>
                <label className={labelCls}>
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" /> Date of Birth
                </label>
                <input {...register("dateOfBirth")} type="date" className={inputCls} />
                {errors.dateOfBirth && <p className={errCls}>{errors.dateOfBirth.message}</p>}
              </div>

              {/* Blood Group */}
              <div>
                <label className={labelCls}>
                  <Droplet className="h-3.5 w-3.5 text-rose-500" /> Blood Group
                </label>
                <select {...register("bloodGroup")} className={inputCls}>
                  <option value="">Select Blood Group</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                {errors.bloodGroup && <p className={errCls}>{errors.bloodGroup.message}</p>}
              </div>

              {/* Address (full width) */}
              <div className="md:col-span-2">
                <label className={labelCls}>
                  <MapPin className="h-3.5 w-3.5 text-indigo-500" /> Address
                </label>
                <textarea
                  {...register("address")}
                  rows={2}
                  placeholder="Street, City, Country"
                  className={inputCls}
                />
                {errors.address && <p className={errCls}>{errors.address.message}</p>}
              </div>
            </div>

            {/* Guardian section */}
            <div className="mt-6 rounded-2xl border border-indigo-100 dark:border-white/10 bg-gradient-to-br from-indigo-50/60 via-violet-50/40 to-sky-50/60 dark:from-indigo-950/30 dark:via-violet-950/20 dark:to-sky-950/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Guardian Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Guardian Name</label>
                  <input
                    {...register("guardianName")}
                    placeholder="Guardian's name"
                    className={inputCls}
                  />
                  {errors.guardianName && <p className={errCls}>{errors.guardianName.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Guardian Email</label>
                  <input
                    {...register("guardianEmail")}
                    type="email"
                    placeholder="guardian@example.com"
                    className={inputCls}
                  />
                  {errors.guardianEmail && (
                    <p className={errCls}>{errors.guardianEmail.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Guardian Phone</label>
                  <input
                    {...register("guardianPhone")}
                    placeholder="01XXXXXXXXX"
                    className={inputCls}
                  />
                  {errors.guardianPhone && (
                    <p className={errCls}>{errors.guardianPhone.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Guardian Relation</label>
                  <select {...register("guardianRelation")} className={inputCls}>
                    <option value="">Select Relation</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Aunt">Aunt</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.guardianRelation && (
                    <p className={errCls}>{errors.guardianRelation.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200/70 dark:border-white/10">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={isPending}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : student ? (
                  <>
                    <Save className="h-4 w-4" />
                    Update
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Add Student
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
