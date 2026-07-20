/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";
import {
  Fee,
  CreateFeePayload,
  PayFeePayload,
  CashPaymentPayload,
  FeeStatus,
  CashPaymentResponse,
  FeeSummaryResponse,
  CollectionReportResponse,
  OverdueReportResponse,
  TransactionsResponse,
  MonthlyAnalyticsResponse,
  BulkCreatePayload,
} from "./fees.types";



type ApiFee = {
  id: string;
  studentId?: string;
  student?: {
    id: string;
    user?: { name?: string };
    rollNumber?: string;
    class?: { id: string; name: string };
  };
  feeType?: string;
  title?: string;
  amount?: number;
  paidAmount?: number;
  Paidamount?: number;
  dueDate?: string;
  status?: string;
  payments?: { id: string; amount: number; method: string; status?: string; paidAt?: string; transactionId?: string; createdAt?: string }[];
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
          rollNumber: item.student.rollNumber,
          class: item.student.class,
        }
      : undefined,
    feeType: item.feeType ?? "",
    title: item.title ?? "",
    amount,
    paidAmount,
    dueAmount,
    dueDate: item.dueDate ?? "",
    month: toMonth(item.dueDate),
    status: mapStatus(item.status),
    payments: item.payments?.map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      status: p.status ?? "PENDING",
      paidAt: p.paidAt ?? "",
      transactionId: p.transactionId,
      createdAt: p.createdAt ?? "",
    })),
    createdAt: item.createdAt,
  };
};

function unwrapList(res: { data: any }): ApiFee[] {
  const payload = res.data?.data ?? res.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export const feesService = {
  getAll: async (): Promise<Fee[]> => {
    const res = await api.get("/fees");
    return unwrapList(res).map(mapFee);
  },

  getAllPaginated: async (params?: Record<string, string | number>): Promise<{ fees: Fee[]; meta?: any }> => {
    const res = await api.get("/fees", { params });
    const payload = res.data?.data ?? res.data;
    const fees = Array.isArray(payload) ? payload.map(mapFee) : [];
    const meta = payload?.meta;
    return { fees, meta };
  },

  getMyFees: async (): Promise<Fee[]> => {
    const res = await api.get("/fees/my-fees");
    return unwrapList(res).map(mapFee);
  },

  getByStudent: async (studentId: string): Promise<Fee[]> => {
    const res = await api.get("/fees", { params: { studentId } });
    return unwrapList(res).map(mapFee);
  },

  create: async (data: CreateFeePayload): Promise<Fee> => {
    const dueDay = new Date(data.dueDate).getDate();
    const res = await api.post("/fees", { ...data, dueDay });
    const payload = res.data?.data ?? res.data;
    return mapFee(payload);
  },

  bulkCreate: async (data: BulkCreatePayload): Promise<any> => {
    const res = await api.post("/fees/bulk", data);
    return res.data?.data ?? res.data;
  },

  pay: async (id: string, data: PayFeePayload): Promise<Fee> => {
    const res = await api.patch(`/fees/${id}/pay`, data);
    const payload = res.data?.data ?? res.data;
    return mapFee(payload);
  },

  payCash: async (data: CashPaymentPayload): Promise<CashPaymentResponse> => {
    const res = await api.post("/fees/cash", data);
    return res.data?.data ?? res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/fees/${id}`);
  },

  getSummary: async (params?: { month?: string }): Promise<FeeSummaryResponse> => {
    const res = await api.get("/fees/summary", { params });
    return res.data?.data ?? res.data;
  },

  getCollectionReport: async (params?: { month?: string; type?: string }): Promise<CollectionReportResponse> => {
    const res = await api.get("/fees/report/collection", { params });
    return res.data?.data ?? res.data;
  },

  getOverdue: async (params?: { classId?: string; page?: number; limit?: number }): Promise<OverdueReportResponse> => {
    const res = await api.get("/fees/report/overdue", { params });
    return res.data?.data ?? res.data;
  },

  getTransactions: async (params?: { page?: number; limit?: number; method?: string; status?: string; month?: string }): Promise<TransactionsResponse> => {
    const cleanParams = {
      ...(params?.page ? { page: Number(params.page) } : {}),
      ...(params?.limit ? { limit: Number(params.limit) } : {}),
      ...(params?.method && ['STRIPE', 'CASH'].includes(params.method) ? { method: params.method } : {}),
      ...(params?.status && ['PENDING', 'PAID', 'FAILED', 'REFUNDED'].includes(params.status) ? { status: params.status } : {}),
      ...(params?.month && /^\d{4}-\d{2}$/.test(params.month) ? { month: params.month } : {}),
    };
    const res = await api.get("/fees/transactions", { params: cleanParams });
    return res.data?.data ?? res.data;
  },

  getMonthlyAnalytics: async (params?: { year: number }): Promise<MonthlyAnalyticsResponse> => {
    const res = await api.get("/fees/analytics/monthly", { params });
    return res.data?.data ?? res.data;
  },
};