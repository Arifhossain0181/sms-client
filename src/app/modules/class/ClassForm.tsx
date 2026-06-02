"use client";

import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { motion, AnimatePresence  } from "framer-motion";
import {
  X,
  BookOpen,
  Hash,
  Layers,
  Users,
  Save,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useCreateClass, useUpdateClass } from "./useClasses";
import { classService } from "./class.service";
import { Class } from "./class.types";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "Class নাম দাও"),
  numericLevel: z.number().min(1, "Numeric level দাও"),
  sectionName: z.string().optional(),
  sectionCapacity: z.number().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  cls?: Class | null;
  onClose: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2, delay: 0.1 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 40 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
      staggerChildren: 0.07,
      delayChildren: 0.15,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.25, ease: "easeIn" as const },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const floatLabelBase =
  "absolute left-11 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium pointer-events-none transition-all duration-300 peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-[10px] peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px]";

const fieldBase =
  "peer w-full pl-10 pr-4 pt-6 pb-2 bg-white/50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white outline-none transition-all duration-300 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-white/[0.06] hover:border-gray-300 dark:hover:border-white/20";

function cn(...inputs: (string | undefined | false | null)[]) {
  return inputs.filter(Boolean).join(" ");
}

const FieldIcon = ({
  icon: Icon,
  className,
}: {
  icon: React.ElementType;
  className?: string;
}) => (
  <Icon
    className={cn(
      "absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 dark:text-gray-500 z-10",
      className
    )}
  />
);

const ErrorMsg = ({ message }: { message?: string }) => (
  <motion.span
    initial={{ opacity: 0, y: -4 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-1 text-[11px] text-red-500 mt-1 ml-1"
  >
    <AlertCircle className="w-3 h-3" />
    {message}
  </motion.span>
);

export default function ClassForm({ cls, onClose }: Props) {
  const { mutateAsync: create, isPending: creating } = useCreateClass();
  const { mutateAsync: update, isPending: updating } = useUpdateClass();
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (cls) {
      const section = cls.sections?.[0];
      reset({
        name: cls.name,
        numericLevel: cls.numericLevel,
        sectionName: section?.name,
        sectionCapacity: section?.maxCapacity,
      });
    }
  }, [cls, reset]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      setSubmitting(true);
      if (cls) {
        const { sectionName, sectionCapacity, ...classData } = data;
        await update({ id: cls.id, data: classData });

        // Update existing section capacity if provided
        if (sectionCapacity && cls.sections?.[0]) {
          await classService.updateSection(cls.sections[0].id, {
            maxCapacity: sectionCapacity,
          });
        }
        // Create new section if name provided and no existing section
        else if (sectionName && cls.sections?.length === 0) {
          await classService.createSection({
            classId: cls.id,
            name: sectionName,
            maxCapacity: sectionCapacity,
          });
        }
      } else {
        const { sectionName, sectionCapacity, ...classData } = data;
        const created = await create(classData);

        if (sectionName && created?.id) {
          await classService.createSection({
            classId: created.id,
            name: sectionName,
            maxCapacity: sectionCapacity,
          });
        }
      }
      // Invalidate and refetch to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 300));
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.refetchQueries({ queryKey: ["classes"] });
      
      toast.success(cls ? "Class updated successfully!" : "Class created successfully!");
      
      // Close form after successful submission
      setTimeout(() => onClose(), 500);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Something went wrong!");
    } finally {
      setSubmitting(false);
    }
  };

  const isPending = creating || updating || submitting;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => !isPending && onClose()}
        />

        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-[100px]"
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 w-72 h-72 bg-fuchsia-500/20 rounded-full blur-[100px]"
            animate={{
              x: [0, -20, 0],
              y: [0, 30, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          className="relative z-10 w-full max-w-md bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-gray-200 dark:border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.3)] overflow-hidden"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Gradient top bar */}
          <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-pink-500" />

          {/* Header */}
          <motion.div
            className="relative px-7 pt-7 pb-5 border-b border-gray-200 dark:border-white/10"
            variants={itemVariants}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {cls ? "Class Edit" : "নতুন Class"}
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {cls
                    ? "Class details update করুন"
                    : "নতুন class ও section যোগ করুন"}
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ rotate: isPending ? 0 : 90, scale: isPending ? 1 : 1.1 }}
              whileTap={{ scale: isPending ? 1 : 0.9 }}
              onClick={onClose}
              disabled={isPending}
              className="absolute right-5 top-6 w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </motion.button>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-7 space-y-5">
            {/* Section: Class Info */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Class Information
                </span>
              </div>

              <motion.div variants={itemVariants} className="relative">
                <FieldIcon icon={BookOpen} />
                <input
                  {...register("name")}
                  type="text"
                  placeholder=" "
                  className={fieldBase}
                  defaultValue={cls?.name || ""}
                />
                <label className={floatLabelBase}>Class নাম</label>
                {errors.name && <ErrorMsg message={errors.name.message} />}
              </motion.div>

              <motion.div variants={itemVariants} className="relative">
                <FieldIcon icon={Hash} />
                <input
                  {...register("numericLevel", { valueAsNumber: true })}
                  type="number"
                  placeholder=" "
                  className={fieldBase}
                  defaultValue={cls?.numericLevel || ""}
                />
                <label className={floatLabelBase}>Numeric Level</label>
                {errors.numericLevel && (
                  <ErrorMsg message={errors.numericLevel.message} />
                )}
              </motion.div>
            </motion.div>

            {/* Section: Section Info */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-fuchsia-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Section (Optional)
                </span>
              </div>

              <motion.div variants={itemVariants} className="relative">
                <FieldIcon icon={Layers} />
                <input
                  {...register("sectionName")}
                  type="text"
                  placeholder=" "
                  className={fieldBase}
                />
                <label className={floatLabelBase}>Section Name</label>
              </motion.div>

              <motion.div variants={itemVariants} className="relative">
                <FieldIcon icon={Users} />
                <input
                  {...register("sectionCapacity", { valueAsNumber: true })}
                  type="number"
                  placeholder=" "
                  className={fieldBase}
                />
                <label className={floatLabelBase}>Section Capacity</label>
              </motion.div>
            </motion.div>

            {/* Buttons */}
            <motion.div variants={itemVariants} className="flex gap-3 pt-3">
              <motion.button
                type="button"
                disabled={isPending}
                whileHover={{ scale: isPending ? 1 : 1.02 }}
                whileTap={{ scale: isPending ? 1 : 0.97 }}
                onClick={onClose}
                className="flex-1 px-5 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.05] text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={isPending}
                whileHover={{ scale: isPending ? 1 : 1.02 }}
                whileTap={{ scale: isPending ? 1 : 0.97 }}
                className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-pink-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-fuchsia-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {cls ? "Update" : "Add Class"}
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
