"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePayFee } from "./useFees";
import { Fee } from "./fees.types";
import { formatTaka } from "@/lib/utils";

interface Props {
  fee: Fee;
  onClose: () => void;
}

export default function PaymentModal({ fee, onClose }: Props) {
  const { mutate: pay, isPending } = usePayFee();

  const schema = z.object({
    paidAmount: z.coerce
      .number()
      .min(1, "Amount দাও")
      .max(fee.dueAmount, `সর্বোচ্চ ${fee.dueAmount} টাকা দেওয়া যাবে`),
  });

  type FormInput = z.input<typeof schema>;
  type FormData = z.output<typeof schema>;

  const { register, handleSubmit, formState: { errors } } =
    useForm<FormInput, unknown, FormData>({ resolver: zodResolver(schema) });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    pay({ id: fee.id, data }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Payment করুন</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Fee Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Student</span>
            <span className="font-medium">{fee.student?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Month</span>
            <span className="font-medium">{fee.month}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total Amount</span>
            <span className="font-medium">{formatTaka(fee.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Already Paid</span>
            <span className="font-medium text-green-600">{formatTaka(fee.paidAmount)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-500 font-medium">Due Amount</span>
            <span className="font-bold text-red-600">{formatTaka(fee.dueAmount)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Payment Amount (৳)
            </label>
            <input
              {...register("paidAmount")}
              type="number"
              placeholder={`সর্বোচ্চ ${fee.dueAmount}`}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.paidAmount && (
              <p className="text-red-500 text-xs mt-1">{errors.paidAmount.message}</p>
            )}
          </div>

          <div className="flex gap-3">
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
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm disabled:opacity-50"
            >
              {isPending ? "Processing..." : "Payment করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}