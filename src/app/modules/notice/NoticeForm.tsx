"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateNotice, useUpdateNotice } from "./useNotices";
import { Notice } from "./notice.types";

const schema = z.object({
  title:   z.string().min(1, "Title দাও"),
  content: z.string().min(10, "কমপক্ষে ১০ অক্ষর লেখো"),
  target:  z.enum(["ALL", "TEACHER", "STUDENT"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  notice?: Notice | null;
  onClose: () => void;
}

export default function NoticeForm({ notice, onClose }: Props) {
  const { mutate: create, isPending: creating } = useCreateNotice();
  const { mutate: update, isPending: updating } = useUpdateNotice();

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (notice) {
      reset({
        title:   notice.title,
        content: notice.content,
        target:  notice.target,
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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            {notice ? "Notice Edit" : "নতুন Notice"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              {...register("title")}
              placeholder="Notice এর title"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Target */}
          <div>
            <label className="block text-sm font-medium mb-1">কার জন্য?</label>
            <select
              {...register("target")}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select</option>
              <option value="ALL">সবার জন্য</option>
              <option value="TEACHER">শুধু Teacher</option>
              <option value="STUDENT">শুধু Student</option>
            </select>
            {errors.target && (
              <p className="text-red-500 text-xs mt-1">{errors.target.message}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              {...register("content")}
              placeholder="Notice এর বিস্তারিত লেখো..."
              rows={5}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {errors.content && (
              <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || updating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm disabled:opacity-50"
            >
              {creating || updating ? "Loading..." : notice ? "Update" : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}