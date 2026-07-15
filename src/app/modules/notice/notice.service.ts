/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";
import { Notice, CreateNoticePayload } from "./notice.types";

type ApiNotice = {
  id: string;
  title: string;
  content: string;
  target?: Notice["target"];
  audience?: string;
  pinned?: boolean;
  createdBy?: { id: string; name: string };
  author?: { id: string; name: string };
  createdAt: string;
};

// Map backend audience to frontend target
const mapAudienceToTarget = (audience?: string): Notice["target"] => {
  switch (audience) {
    case "STUDENTS": return "STUDENT";
    case "TEACHERS": return "TEACHER";
    case "PARENTS": return "PARENT";
    case "ALL": return "ALL";
    default: return (audience as Notice["target"]) || "ALL";
  }
};

// Map frontend target to backend audience
const mapTargetToAudience = (target: Notice["target"]): string => {
  switch (target) {
    case "STUDENT": return "STUDENTS";
    case "TEACHER": return "TEACHERS";
    case "PARENT": return "PARENTS";
    case "ALL": return "ALL";
    default: return target; // For HR, SUPER_ADMIN, etc, pass the target directly
  }
};

const mapNotice = (item: ApiNotice): Notice => {
  const author = item.createdBy ?? item.author;
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    target: item.target || mapAudienceToTarget(item.audience),
    pinned: item.pinned ?? false,
    createdBy: author ? { id: author.id || "", name: author.name || "Unknown" } : undefined,
    createdAt: item.createdAt,
  };
};

export const noticeService = {
  getAll: async (): Promise<Notice[]> => {
    const res = await api.get("/notices");
    const payload = res.data?.data?.data ?? res.data?.data ?? res.data;
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
    const payloadData = { ...data, audience: mapTargetToAudience(data.target) };
    delete (payloadData as any).target;
    const res = await api.post("/notices", payloadData);
    const payload = res.data?.data ?? res.data;
    return mapNotice(payload as ApiNotice);
  },

  update: async (id: string, data: Partial<CreateNoticePayload>): Promise<Notice> => {
    const payloadData = { ...data };
    if (data.target) {
      (payloadData as any).audience = mapTargetToAudience(data.target);
      delete (payloadData as any).target;
    }
    const res = await api.patch(`/notices/${id}`, payloadData);
    const payload = res.data?.data ?? res.data;
    return mapNotice(payload as ApiNotice);
  },

  // req 3.2: pin an important notice to the top of the list
  togglePin: async (id: string, pinned: boolean): Promise<Notice> => {
    const res = await api.patch(`/notices/${id}/pin`, { pinned });
    const payload = res.data?.data ?? res.data;
    return mapNotice(payload as ApiNotice);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notices/${id}`);
  },
};