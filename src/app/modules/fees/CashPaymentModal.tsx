"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStudents } from "../student/useStudents";
import { useCashPayment } from "./useFees";
import { useClasses } from "../class/useClasses";
import { CashPaymentResponse } from "./fees.types";

const schema = z.object({
  classId: z.string().min(1, "Class select করো"),
  sectionId: z.string().min(1, "Section select করো"),
  studentId: z.string().min(1, "Student select করো"),
  type: z.enum(["TUITION", "ADMISSION", "EXAM"]),
  amountPaid: z.number().min(1, "Amount দাও"),
  dueDate: z.string().optional(),
  transactionId: z.string().optional(),
  note: z.string().optional(),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

interface Props {
  onClose: () => void;
}

export default function CashPaymentModal({ onClose }: Props) {
  const { data: students } = useStudents();
  const { data: classes } = useClasses();
  const { mutate: payCash, isPending } = useCashPayment();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<FormInput, unknown, FormData>({
      resolver: zodResolver(schema),
      defaultValues: { classId: "", sectionId: "", studentId: "" },
    });

  const classId = watch("classId");
  const sectionId = watch("sectionId");

  const selectedClass = useMemo(
    () => (Array.isArray(classes) ? classes : []).find((c) => c.id === classId),
    [classes, classId]
  );
  const sections = selectedClass?.sections ?? [];

  const hasSectionIds = Array.isArray(students) && students.some((s) => s.sectionId);
  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    return students.filter((s) => {
      if (s.classId !== classId) return false;
      if (!hasSectionIds) return true;
      return s.sectionId === sectionId;
    });
  }, [students, classId, sectionId, hasSectionIds]);

  useEffect(() => {
    setValue("sectionId", "");
    setValue("studentId", "");
    setReceipt(null);
  }, [classId, setValue]);

  useEffect(() => {
    setValue("studentId", "");
    setReceipt(null);
  }, [sectionId, setValue]);

  const onSubmit: SubmitHandler<FormData> = (data) => {
    const { classId: _classId, sectionId: _sectionId, ...payload } = data;
    payCash(payload, {
      onSuccess: (res: CashPaymentResponse) => {
        const student = filteredStudents.find((s) => s.id === data.studentId);
        const sectionName = sections.find((s) => s.id === data.sectionId)?.name ?? "";
        setReceipt({
          ...res,
          studentName: student?.name ?? "",
          className: selectedClass?.name ?? "",
          sectionName,
          type: data.type,
          amountPaid: data.amountPaid,
          dueDate: data.dueDate,
          transactionId: data.transactionId,
          note: data.note,
        });
      },
    });
  };

  const handleDownloadReceipt = () => {
    if (!receipt) return;
    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const formatDate = (value?: string) => {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleDateString("en-GB");
    };

    const html = `
      <html>
        <head>
          <title>Cash Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { font-size: 20px; margin-bottom: 8px; }
            .meta { font-size: 12px; color: #555; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            td { padding: 8px; border-bottom: 1px solid #eee; }
            .label { color: #555; width: 160px; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Cash Payment Receipt</h1>
          <div class="meta">Receipt ID: ${escapeHtml(receipt.payment.id)}</div>
          <table>
            <tr><td class="label">Student</td><td>${escapeHtml(receipt.studentName)}</td></tr>
            <tr><td class="label">Class</td><td>${escapeHtml(receipt.className)}</td></tr>
            <tr><td class="label">Section</td><td>${escapeHtml(receipt.sectionName)}</td></tr>
            <tr><td class="label">Fee Type</td><td>${escapeHtml(receipt.type)}</td></tr>
            <tr><td class="label">Amount</td><td class="total">৳${receipt.amountPaid}</td></tr>
            <tr><td class="label">Payment Date</td><td>${escapeHtml(formatDate(receipt.payment.paidAt || receipt.dueDate))}</td></tr>
            <tr><td class="label">Transaction ID</td><td>${escapeHtml(receipt.transactionId || "-")}</td></tr>
            <tr><td class="label">Note</td><td>${escapeHtml(receipt.note || "-")}</td></tr>
          </table>
        </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Cash Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Class</label>
            <select
              {...register("classId")}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Class select করো</option>
              {(Array.isArray(classes) ? classes : []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.classId && <p className="text-red-500 text-xs mt-1">{errors.classId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Section</label>
            <select
              {...register("sectionId")}
              disabled={!classId}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
            >
              <option value="">Section select করো</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.sectionId && <p className="text-red-500 text-xs mt-1">{errors.sectionId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Student</label>
            <select
              {...register("studentId")}
              disabled={!classId || !sectionId}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Student select করো</option>
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              {...register("type")}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select type</option>
              <option value="TUITION">Tuition</option>
              <option value="ADMISSION">Admission</option>
              <option value="EXAM">Exam</option>
            </select>
            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount (৳)</label>
            <input
              {...register("amountPaid", { valueAsNumber: true })}
              type="number"
              min={1}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.amountPaid && <p className="text-red-500 text-xs mt-1">{errors.amountPaid.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Payment Date</label>
            <input
              {...register("dueDate")}
              type="date"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Transaction ID (optional)</label>
            <input
              {...register("transactionId")}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Note (optional)</label>
            <input
              {...register("note")}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm disabled:opacity-50"
            >
              {isPending ? "Processing..." : "Record Payment"}
            </button>
          </div>
          <button
            type="button"
            onClick={handleDownloadReceipt}
            disabled={!receipt}
            className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Download Receipt
          </button>
        </form>
      </div>
    </div>
  );
}

interface ReceiptData extends CashPaymentResponse {
  studentName: string;
  className: string;
  sectionName: string;
  type: string;
  amountPaid: number;
  dueDate?: string;
  transactionId?: string;
  note?: string;
}
