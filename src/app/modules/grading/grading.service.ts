import api from "@/lib/axios";
import {
  GradingRule,
  CreateGradingRulePayload,
  UpdateGradingRulePayload,
  BulkUpsertGradingRulesPayload,
} from "./grading.types";

export const gradingService = {
  list: async (classId: string, academicYear?: string): Promise<GradingRule[]> => {
    const params: Record<string, string> = { classId };
    if (academicYear) params.academicYear = academicYear;
    const res = await api.get("/grading-rules", { params });
    const payload = res.data?.data ?? res.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.rules)) return payload.rules;
    return [];
  },

  create: async (data: CreateGradingRulePayload): Promise<GradingRule> => {
    const res = await api.post("/grading-rules", data);
    return res.data?.data ?? res.data;
  },

  bulkUpsert: async (data: BulkUpsertGradingRulesPayload): Promise<GradingRule[]> => {
    const res = await api.post("/grading-rules/bulk", data);
    const payload = res.data?.data ?? res.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  },

  update: async (id: string, data: UpdateGradingRulePayload): Promise<GradingRule> => {
    const res = await api.put(`/grading-rules/${id}`, data);
    return res.data?.data ?? res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/grading-rules/${id}`);
  },
};
