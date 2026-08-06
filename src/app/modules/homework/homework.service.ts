import api from "@/lib/axios";
import { CreateHomeworkPayload, EvaluationDetails, Homework, HomeworkListResponse, UpdateHomeworkPayload } from "./homework.types";

export const homeworkService = {
  listMine: async (params?: { sectionId?: string; subjectId?: string; status?: string; page?: number; pageSize?: number }): Promise<HomeworkListResponse> => {
    const query = new URLSearchParams();
    if (params?.sectionId) query.set("sectionId", params.sectionId);
    if (params?.subjectId) query.set("subjectId", params.subjectId);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    const res = await api.get(`/homework/my${query.toString() ? `?${query.toString()}` : ""}`);
    return res.data?.data ?? res.data;
  },

  listOverdue: async (): Promise<Homework[]> => {
    const res = await api.get("/homework/my/overdue");
    return res.data?.data ?? res.data;
  },

  getById: async (id: string): Promise<Homework> => {
    const res = await api.get(`/homework/${id}`);
    return res.data?.data ?? res.data;
  },

  create: async (data: CreateHomeworkPayload): Promise<Homework> => {
    const res = await api.post("/homework", data);
    return res.data?.data ?? res.data;
  },

  update: async (id: string, data: UpdateHomeworkPayload): Promise<Homework> => {
    const res = await api.patch(`/homework/${id}`, data);
    return res.data?.data ?? res.data;
  },

  markReviewed: async (id: string): Promise<Homework> => {
    const res = await api.patch(`/homework/${id}/review`);
    return res.data?.data ?? res.data;
  },

  getEvaluationDetails: async (homeworkId: string): Promise<EvaluationDetails> => {
    const res = await api.get(`/homework/${homeworkId}/evaluate`);
    return res.data?.data ?? res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/homework/${id}`);
  },
};
