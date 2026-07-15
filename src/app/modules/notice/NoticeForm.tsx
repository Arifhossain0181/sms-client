"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Megaphone, Loader2, Sparkles } from "lucide-react";

import { useCreateNotice, useUpdateNotice } from "./useNotices";
import { Notice } from "./notice.types";
import RoleTargetSelect from "@/components/notices/role-target-select";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "At least 10 characters are required"),
  target: z.enum([
    "ALL",
    "SUPER_ADMIN",
    "SCHOOL_ADMIN",
    "ACCOUNTANT",
    "TEACHER",
    "STUDENT",
    "PARENT",
    "EXAM_CONTROLLER",
    "HR",
  ]),
  pinned: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  notice?: Notice | null;
  onClose: () => void;
}

export default function NoticeForm({ notice, onClose }: Props) {
  const { mutate: create, isPending: creating } = useCreateNotice();
  const { mutate: update, isPending: updating } = useUpdateNotice();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { pinned: false } });

  useEffect(() => {
    if (notice) {
      reset({
        title: notice.title,
        content: notice.content,
        target: notice.target,
        pinned: notice.pinned,
      });
    }
  }, [notice, reset]);

  const onSubmit = (data: FormData) => {
    if (notice) {
      update({ id: notice.id, data }, { onSuccess: onClose });
    } else {
      create(data, { onSuccess: onClose });
    }
  };

  const loading = creating || updating;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Animated background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: "spring", damping: 22, stiffness: 220 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 shadow-2xl backdrop-blur-xl"
        >
          {/* Gradient header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-6 py-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ rotate: -20, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 14 }}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30"
                >
                  <Megaphone className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                    {notice ? "Edit Notice" : "New Notice"}
                    <Sparkles className="h-4 w-4 text-white/80" />
                  </h2>
                  <p className="text-xs text-white/80">
                    {notice
                      ? "Update the notice details below."
                      : "Publish a new notice for your school."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200 text-slate-700 dark:bg-white/15 dark:text-white transition hover:bg-slate-300 dark:hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-6">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-sky-600 dark:text-sky-300/90">
                Title
              </label>
              <input
                {...register("title")}
                placeholder="Notice title..."
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800/60 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition focus:border-sky-500 dark:focus:border-sky-400/60 focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-400/30"
              />
              {errors.title && <p className="text-xs text-rose-400">{errors.title.message}</p>}
            </div>

            {/* Target */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-300/90">
                Target audience
              </label>
              <Controller
                control={control}
                name="target"
                render={({ field }) => (
                  <RoleTargetSelect value={field.value ?? ""} onChange={field.onChange} />
                )}
              />
              {errors.target && <p className="text-xs text-rose-400">{errors.target.message}</p>}
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-violet-600 dark:text-violet-300/90">
                Content
              </label>
              <textarea
                {...register("content")}
                rows={5}
                placeholder="Write the details..."
                className="w-full resize-none rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800/60 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition focus:border-violet-500 dark:focus:border-violet-400/60 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-400/30"
              />
              {errors.content && (
                <p className="text-xs text-rose-400">{errors.content.message}</p>
              )}
            </div>

            {/* Pin — req 3.2 */}
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                {...register("pinned")}
                className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
              />
              Pin this notice to the top of the list
            </label>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 transition hover:bg-slate-200 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="relative flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition disabled:opacity-60"
              >
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : notice ? (
                    "Update"
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Publish
                    </>
                  )}
                </span>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}