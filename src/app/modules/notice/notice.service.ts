import api from "@/lib/axios";
import { Notice, CreateNoticePayload, NoticeTarget } from "./notice.types";

type ApiNotice = {
  id: string;
  title: string;
  content: string;
  audience?: "ALL" | "TEACHERS" | "STUDENTS" | "PARENTS" | "STAFF";
  target?: NoticeTarget;
  author?: { id: string; name: string };
  createdBy?: { id: string; name: string };
  createdAt: string;
};

const mapAudienceToTarget = (audience?: ApiNotice["audience"], fallback?: NoticeTarget): NoticeTarget => {
  if (audience === "TEACHERS") return "TEACHER";
  if (audience === "STUDENTS") return "STUDENT";
  if (audience === "ALL") return "ALL";
  return fallback ?? "ALL";
};

const mapTargetToAudience = (target: NoticeTarget) => {
  if (target === "TEACHER") return "TEACHERS";
  if (target === "STUDENT") return "STUDENTS";
  return "ALL";
};

const mapNotice = (item: ApiNotice): Notice => ({
  id: item.id,
  title: item.title,
  content: item.content,
  target: mapAudienceToTarget(item.audience, item.target),
  createdBy: item.createdBy ?? item.author,
  createdAt: item.createdAt,
});

export const noticeService = {
  getAll: async (): Promise<Notice[]> => {
    const res = await api.get("/notices");
    const payload = res.data?.data ?? res.data;
    return Array.isArray(payload) ? payload.map(mapNotice) : [];
  },

  getFeed: async (): Promise<Notice[]> => {
    const res = await api.get("/notices/feed");
    const payload = res.data?.data ?? res.data;
    return Array.isArray(payload) ? payload.map(mapNotice) : [];
  },

  getById: async (id: string): Promise<Notice> => {
    const res = await api.get(`/notices/${id}`);
    const payload = res.data?.data ?? res.data;
    return mapNotice(payload as ApiNotice);
  },

  create: async (data: CreateNoticePayload): Promise<Notice> => {
    const res = await api.post("/notices", {
      title: data.title,
      content: data.content,
      audience: mapTargetToAudience(data.target),
    });
    const payload = res.data?.data ?? res.data;
    return mapNotice(payload as ApiNotice);
  },

  update: async (id: string, data: Partial<CreateNoticePayload>): Promise<Notice> => {
    const payload: Record<string, unknown> = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.target !== undefined && { audience: mapTargetToAudience(data.target) }),
    };
    const res = await api.patch(`/notices/${id}`, payload);
    const response = res.data?.data ?? res.data;
    return mapNotice(response as ApiNotice);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notices/${id}`);
  },
};