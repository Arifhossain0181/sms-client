import api from "@/lib/axios";
import {
  TeachingApplication,
  UpdateTeachingApplicationStatusPayload,
  UpdateTeachingApplicationPayload,
} from "./teachingApplication.types";

export const teachingApplicationService = {
  getAll: async (): Promise<TeachingApplication[]> => {
    const res = await api.get("/teaching");
    const payload = res.data?.data?.data ?? res.data?.data ?? res.data;
    return Array.isArray(payload) ? payload : [];
  },

  updateStatus: async (
    id: string,
    data: UpdateTeachingApplicationStatusPayload
  ): Promise<TeachingApplication> => {
    const res = await api.patch(`/teaching/${id}/status`, data);
    return res.data?.data ?? res.data;
  },

  update: async (id: string, data: UpdateTeachingApplicationPayload): Promise<TeachingApplication> => {
    const res = await api.patch(`/teaching/${id}`, data);
    return res.data?.data ?? res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/teaching/${id}`);
  },
};
