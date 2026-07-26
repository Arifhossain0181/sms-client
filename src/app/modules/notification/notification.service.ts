import api from "@/lib/axios";
import { Notification } from "./notification.types";

export const notificationService = {
  // আমার সব notification আনো
  getAll: async (): Promise<Notification[]> => {
    const res = await api.get("/notifications");
    return res.data;
  },

  // একটা notification read করো
  markAsRead: async (id: string): Promise<Notification> => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },

  // সব notification read করো
  markAllAsRead: async (): Promise<void> => {
    await api.put("/notifications/read-all");
  },

  // Delete
  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};