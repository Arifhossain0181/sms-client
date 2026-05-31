import api from "@/lib/axios";
import {
  TeachingApplication,
  UpdateTeachingApplicationStatusPayload,
} from "./teachingApplication.types";

export const teachingApplicationService = {
  getAll: async (): Promise<TeachingApplication[]> => {
    const res = await api.get("/teaching");
    const payload = res.data?.data ?? res.data;
    return Array.isArray(payload) ? payload : [];
  },

  updateStatus: async (
    id: string,
    data: UpdateTeachingApplicationStatusPayload
  ): Promise<TeachingApplication> => {
    const res = await api.patch(`/teaching/${id}/status`, data);
    return res.data?.data ?? res.data;
  },
};
