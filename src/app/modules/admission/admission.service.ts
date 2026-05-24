import api from "@/lib/axios";
import { Admission, AdmissionClassOption, CreateAdmissionPayload } from "./admission.types";
import { AdmissionStatus } from "./admission.types";

export const admissionService = {
  getAll: async (): Promise<Admission[]> => {
    const res = await api.get("/admission");
    const payload = res.data?.data ?? res.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  },

  getById: async (id: string): Promise<Admission> => {
    const res = await api.get(`/admission/${id}`);
    return res.data?.data ?? res.data;
  },

  create: async (data: CreateAdmissionPayload): Promise<Admission> => {
    const res = await api.post("/admission", data);
    return res.data?.data ?? res.data;
  },

  updateStatus: async (
    id: string,
    status: AdmissionStatus
  ): Promise<Admission> => {
    const res = await api.patch(`/admission/${id}/status`, { status });
    return res.data?.data ?? res.data;
  },

  getPublicClasses: async (): Promise<AdmissionClassOption[]> => {
    const res = await api.get("/admission/classes");
    return res.data?.data ?? res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/admission/${id}`);
  },
};