import api from "@/lib/axios";
import { Notification } from "./notification.types";

export const notificationService = {
  // Fetch all notifications
  getAll: async (): Promise<Notification[]> => {
    const res = await api.get("/notifications");
    return res.data;
  },

  // Mark one notification as read
  markAsRead: async (id: string): Promise<Notification> => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    await api.put("/notifications/read-all");
  },

  // Delete
  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};