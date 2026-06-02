"use client";

import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Building2,
  Award,
  Clock,
  Calendar,
  CalendarCheck,
  BookOpen,
  Droplet,
  DollarSign,
  IdCard,
  Save,
  Loader2,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { useCreateTeacher, useUpdateTeacher } from "./useTeachers";
import { Teacher } from "./teacher.types";

const schema = z.object({
  name: z.string().min(2, "নাম দাও"),
  email: z.string().email("Valid email দাও"),
  TeachersId: z.string().optional(),
  designation: z.string().min(2, "Designation দাও"),
  department: z.string().optional(),
  qualification: z.string().min(2, "Qualification দাও"),
  experience: z.coerce.number().min(0, "Experience দাও"),
  phone: z.string().min(11, "Phone নম্বর দাও"),
  address: z.string().min(3, "Address দাও"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  dateOfBirth: z.string().min(1, "Date of birth দাও"),
  dateOfJoining: z.string().min(1, "Joining date দাও"),
  bloodGroup: z.string().optional(),
  salary: z.coerce.number().optional(),
  subjectId: z.string().optional(),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

interface Props {
  teacher?: Teacher | null;
  onClose: () => void;
}

/* ---------- shared classes (sky → indigo → violet theme) ---------- */
const inputBase =
  "w-full rounded-xl border bg-white/70 dark:bg-white/5 backdrop-blur " +
  "border-slate-200 dark:border-white/10 " +
  "px-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 " +
  "placeholder:text-slate-400 dark:placeholder:text-slate-500 " +
  "shadow-sm transition-all " +
  "focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15 " +
  "hover:border-slate-300 dark:hover:border-white/20";

const labelBase =
  "block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300 mb-1.5";

const errCls = "text-rose-500 text-[11px] mt-1 font-medium flex items-center gap-1";

const sectionWrap =
  "rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm p-5 sm:p-6 shadow-sm";

const sectionTitle =
  "flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] font-bold text-slate-700 dark:text-slate-200 mb-5";

const iconWrap =
  "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function TeacherForm({ teacher, onClose }: Props) {
  const { mutate: create, isPending: creating } = useCreateTeacher();
  const { mutate: update, isPending: updating } = useUpdateTeacher();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (teacher) {
      reset({
        name: teacher.name,
        email: teacher.email,
        TeachersId: "",
        designation: "",
        department: "",
        qualification: "",
        experience: 0,
        phone: teacher.phone,
        address: teacher.address,
        gender: teacher.gender as "MALE" | "FEMALE" | "OTHER",
        dateOfBirth: teacher.dateOfBirth?.slice(0, 10),
        dateOfJoining: "",
        bloodGroup: "",
        salary: undefined,
        subjectId: teacher.subjectId,
      });
    }
  }, [teacher, reset]);

  const onSubmit: SubmitHandler<FormInput> = (raw) => {
    const data = raw as unknown as FormData;
    if (teacher) {
      const { TeachersId, ...rest } = data;
      update({ id: teacher.id, data: rest }, { onSuccess: onClose });
    } else {
      create(data, { onSuccess: onClose });
    }
  };

  const isPending = creating || updating;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: "spring", damping: 22, stiffness: 240 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-white dark:bg-slate-950 shadow-[0_30px_80px_-20px_rgba(99,102,241,0.45)] border border-slate-200/70 dark:border-white/10"
        >
          <div className="grid lg:grid-cols-[300px_1fr] max-h-[92vh]">
            {/* LEFT: gradient panel */}
            <div className="relative hidden lg:flex flex-col justify-between p-8 bg-gradient-to-br from-sky-500 via-indigo-600 to-violet-600 text-white overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-fuchsia-400/20 blur-3xl" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-[11px] font-semibold uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  {teacher ? "Edit Mode" : "New Entry"}
                </div>
                <h2 className="mt-5 text-2xl font-bold leading-tight">
                  {teacher ? "Update teacher profile" : "Add a new teacher"}
                </h2>
                <p className="mt-3 text-sm text-white/80 leading-relaxed">
                  সঠিক তথ্য দিয়ে form পূরণ করুন। সব fields validation অনুযায়ী save হবে।
                </p>
              </div>

              <div className="relative space-y-3 mt-10">
                {[
                  { icon: User, label: "Personal info" },
                  { icon: Briefcase, label: "Professional info" },
                  { icon: MapPin, label: "Contact details" },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm text-white/90 bg-white/10 backdrop-blur rounded-xl px-3 py-2.5 border border-white/10"
                  >
                    <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center">
                      <s.icon className="h-4 w-4" />
                    </div>
                    {s.label}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: form */}
            <div className="flex flex-col max-h-[92vh] bg-slate-50/60 dark:bg-slate-950">
              {/* Header */}
              <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <UserCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                      {teacher ? "Teacher Edit" : "নতুন Teacher"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Fill in the details below
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable body */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6"
              >
                {/* Personal */}
                <motion.section variants={stagger} initial="hidden" animate="show" className={sectionWrap}>
                  <h4 className={sectionTitle}>
                    <User className="h-4 w-4 text-indigo-500" /> Personal Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <motion.div variants={item}>
                      <label className={labelBase}>Name</label>
                      <div className="relative">
                        <User className={`${iconWrap} h-4 w-4`} />
                        <input {...register("name")} placeholder="Full name" className={inputBase} />
                      </div>
                      {errors.name && <p className={errCls}>{errors.name.message}</p>}
                    </motion.div>

                    <motion.div variants={item}>
                      <label className={labelBase}>Email</label>
                      <div className="relative">
                        <Mail className={`${iconWrap} h-4 w-4`} />
                        <input {...register("email")} placeholder="name@example.com" className={inputBase} />
                      </div>
                      {errors.email && <p className={errCls}>{errors.email.message}</p>}
                    </motion.div>

                    <motion.div variants={item}>
                      <label className={labelBase}>Date of Birth</label>
                      <div className="relative">
                        <Calendar className={`${iconWrap} h-4 w-4`} />
                        <input type="date" {...register("dateOfBirth")} className={inputBase} />
                      </div>
                      {errors.dateOfBirth && <p className={errCls}>{errors.dateOfBirth.message}</p>}
                    </motion.div>

                    <motion.div variants={item}>
                      <label className={labelBase}>Gender</label>
                      <div className="relative">
                        <UserCircle2 className={`${iconWrap} h-4 w-4`} />
                        <select {...register("gender")} className={inputBase}>
                          <option value="">Select</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      {errors.gender && <p className={errCls}>{errors.gender.message}</p>}
                    </motion.div>

                    <motion.div variants={item}>
                      <label className={labelBase}>Blood Group</label>
                      <div className="relative">
                        <Droplet className={`${iconWrap} h-4 w-4`} />
                        <input {...register("bloodGroup")} placeholder="e.g. A+" className={inputBase} />
                      </div>
                    </motion.div>

                    <motion.div variants={item}>
                      <label className={labelBase}>Teacher ID</label>
                      <div className="relative">
                        <IdCard className={`${iconWrap} h-4 w-4`} />
                        <input {...register("TeachersId")} placeholder="T-0001" className={inputBase} />
                      </div>
                    </motion.div>
                  </div>
                </motion.section>

                {/* Professional */}
                <motion.section variants={stagger} initial="hidden" animate="show" className={sectionWrap}>
                  <h4 className={sectionTitle}>
                    <Briefcase className="h-4 w-4 text-indigo-500" /> Professional Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <motion.div variants={item}>
                      <label className={labelBase}>Designation</label>
                      <div className="relative">
                        <Award className={`${iconWrap} h-4 w-4`} />
                        <input {...register("designation")} placeholder="Senior Teacher" className={inputBase} />
                      </div>
                      {errors.designation && <p className={errCls}>{errors.designation.message}</p>}
                    </motion.div>

                    <motion.div variants={item}>
                      <label className={labelBase}>Department</label>
                      <div className="relative">
                        <Building2 className={`${iconWrap} h-4 w-4`} />
                        <input {...register("department")} placeholder="Science" className={inputBase} />
                      </div>
                    </motion.div>

                    <motion.div variants={item}>
                      <label className={labelBase}>Qualification</label>
                      <div className="relative">
                        <GraduationCap className={`${iconWrap} h-4 w-4`} />
                        <input {...register("qualification")} placeholder="M.Sc, B.Ed" className={inputBase} />
                      </div>
                      {errors.qualification && <p className={errCls}>{errors.qualification.message}</p>}
                    </motion.div>

                    <motion.div variants={item}>
                      <label className={labelBase}>Experience (yrs)</label>
                      <div className="relative">
                        <Clock className={`${iconWrap} h-4 w-4`} />
                        <input type="number" {...register("experience")} placeholder="5" className={inputBase} />
                      </div>
                      {errors.experience && <p className={errCls}>{errors.experience.message}</p>}
                    </motion.div>

                    <motion.div variants={item}>
                      <label className={labelBase}>Joining Date</label>
                      <div className="relative">
                        <CalendarCheck className={`${iconWrap} h-4 w-4`} />
                        <input type="date" {...register("dateOfJoining")} className={inputBase} />
                      </div>
                      {errors.dateOfJoining && <p className={errCls}>{errors.dateOfJoining.message}</p>}
                    </motion.div>

                    <motion.div variants={item}>
                      <label className={labelBase}>Subject ID</label>
                      <div className="relative">
                        <BookOpen className={`${iconWrap} h-4 w-4`} />
                        <input {...register("subjectId")} placeholder="SUB-101" className={inputBase} />
                      </div>
                    </motion.div>

                    <motion.div variants={item}>
                      <label className={labelBase}>Salary</label>
                      <div className="relative">
                        <DollarSign className={`${iconWrap} h-4 w-4`} />
                        <input type="number" {...register("salary")} placeholder="30000" className={inputBase} />
                      </div>
                    </motion.div>
                  </div>
                </motion.section>

                {/* Contact */}
                <motion.section variants={stagger} initial="hidden" animate="show" className={sectionWrap}>
                  <h4 className={sectionTitle}>
                    <MapPin className="h-4 w-4 text-indigo-500" /> Contact
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.div variants={item}>
                      <label className={labelBase}>Phone</label>
                      <div className="relative">
                        <Phone className={`${iconWrap} h-4 w-4`} />
                        <input {...register("phone")} placeholder="01XXXXXXXXX" className={inputBase} />
                      </div>
                      {errors.phone && <p className={errCls}>{errors.phone.message}</p>}
                    </motion.div>

                    <motion.div variants={item}>
                      <label className={labelBase}>Address</label>
                      <div className="relative">
                        <MapPin className={`${iconWrap} h-4 w-4`} />
                        <input {...register("address")} placeholder="Street, City" className={inputBase} />
                      </div>
                      {errors.address && <p className={errCls}>{errors.address.message}</p>}
                    </motion.div>
                  </div>
                </motion.section>
              </form>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] backdrop-blur">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  onClick={handleSubmit(onSubmit)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 transition-all"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {teacher ? "Update" : "Add Teacher"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
