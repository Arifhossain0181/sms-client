import api from "@/lib/axios";
import { Fee, CreateFeePayload, PayFeePayload, CashPaymentPayload, FeeStatus, CashPaymentResponse } from "./fees.types";

type ApiFee = {
  id: string;
  studentId?: string;
  student?: {
    id: string;
    user?: { name?: string };
    class?: { id: string; name: string };
  };
  amount?: number;
  paidAmount?: number;
  Paidamount?: number;
  dueDate?: string;
  status?: string;
  createdAt: string;
};

const toMonth = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 7);
};

const mapStatus = (status?: string): FeeStatus => {
  if (status === "PAID") return "PAID";
  if (status === "PARTIAL") return "PARTIAL";
  return "UNPAID";
};

const mapFee = (item: ApiFee): Fee => {
  const amount = item.amount ?? 0;
  const paidAmount = item.paidAmount ?? item.Paidamount ?? 0;
  const dueAmount = Math.max(amount - paidAmount, 0);
  return {
    id: item.id,
    studentId: item.studentId ?? item.student?.id ?? "",
    student: item.student
      ? {
          id: item.student.id,
          name: item.student.user?.name ?? "",
          class: item.student.class,
        }
      : undefined,
    amount,
    paidAmount,
    dueAmount,
    month: toMonth(item.dueDate),
    status: mapStatus(item.status),
    createdAt: item.createdAt,
  };
};

export const feesService = {
  // সব fees আনো
  getAll: async (): Promise<Fee[]> => {
    const res = await api.get("/fees");
    const payload = res.data?.data ?? res.data;
    if (Array.isArray(payload)) return payload.map(mapFee);
    if (Array.isArray(payload?.data)) return payload.data.map(mapFee);
    return [];
  },

  // একজন student এর fees
  getByStudent: async (studentId: string): Promise<Fee[]> => {
    const res = await api.get(`/fees?studentId=${studentId}`);
    const payload = res.data?.data ?? res.data;
    if (Array.isArray(payload)) return payload.map(mapFee);
    if (Array.isArray(payload?.data)) return payload.data.map(mapFee);
    return [];
  },

  // নতুন fee তৈরি
  create: async (data: CreateFeePayload): Promise<Fee> => {
    const dueDay = new Date(data.dueDate).getDate();
    const res = await api.post("/fees", { ...data, dueDay });
    const payload = res.data?.data ?? res.data;
    return mapFee(payload);
  },

  // Fee payment করো
  pay: async (id: string, data: PayFeePayload): Promise<Fee> => {
    const res = await api.put(`/fees/${id}/pay`, data);
    return res.data;
  },

  // Cash payment entry (no fee create needed)
  payCash: async (data: CashPaymentPayload): Promise<CashPaymentResponse> => {
    const res = await api.post("/fees/cash", data);
    const payload = res.data?.data ?? res.data;
    return payload;
  },

  // Delete
  delete: async (id: string): Promise<void> => {
    await api.delete(`/fees/${id}`);
  },
};