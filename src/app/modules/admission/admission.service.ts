/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";
import {
  Admission,
  AdmissionClassOption,
  AdmissionListResponse,
  AdmissionQuery,
  AdmissionStats,
  CreateAdmissionPayload,
  UpdateAdmissionStatusPayload,
} from "./admission.types";

function unwrap<T>(res: { data: any }): T {
  return res.data?.data ?? res.data;
}

export const admissionService = {
  // supports page/limit/search/status/classId — matches backend findAll()
  // pagination, so a 3000-row table never comes down in one response
  getAll: async (query: AdmissionQuery = {}): Promise<AdmissionListResponse> => {
    const res = await api.get("/admission", { params: query });
    const payload = unwrap<{ data?: Admission[]; meta?: AdmissionListResponse["meta"] }>(res);
    return {
      data: Array.isArray(payload?.data) ? payload.data : [],
      meta: payload?.meta ?? { page: 1, limit: 10, total: 0, pages: 0 },
    };
  },

  getById: async (id: string): Promise<Admission> => {
    const res = await api.get(`/admission/${id}`);
    return unwrap<Admission>(res);
  },

  create: async (data: CreateAdmissionPayload): Promise<Admission> => {
    const res = await api.post("/admission", data);
    return unwrap<Admission>(res);
  },

  update: async (id: string, data: Partial<CreateAdmissionPayload>): Promise<Admission> => {
    const res = await api.patch(`/admission/${id}`, data);
    return unwrap<Admission>(res);
  },

  // now sends rejectionReason too — required for req 1.3
  updateStatus: async (
    id: string,
    payload: UpdateAdmissionStatusPayload
  ): Promise<Admission> => {
    const res = await api.patch(`/admission/${id}/status`, payload);
    return unwrap<Admission>(res);
  },

  getStats: async (): Promise<AdmissionStats> => {
    const res = await api.get("/admission/stats");
    return unwrap<AdmissionStats>(res);
  },

  getPublicClasses: async (): Promise<AdmissionClassOption[]> => {
    const res = await api.get("/admission/classes");
    return unwrap<AdmissionClassOption[]>(res);
  },

  // public "check my application status" lookup by email
  getApplicationsByEmail: async (email: string): Promise<Admission[]> => {
    const res = await api.get("/admission/my-applications");
    const payload = unwrap<Admission[]>(res);
    return Array.isArray(payload) ? payload : [];
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/admission/${id}`);
  },
};