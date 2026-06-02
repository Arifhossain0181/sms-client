import api from "@/lib/axios";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type:
    | "ADMISSION"
    | "FEE"
    | "EXAM"
    | "RESULT"
    | "ATTENDANCE"
    | "NOTICE"
    | "TIMETABLE"
    | "GENERAL";
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}

export interface NotificationResponse {
  data: Notification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const notificationService = {
  // Get all notifications for the current user
  getNotifications: async (
    params?: NotificationQueryParams
  ): Promise<Notification[]> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.isRead !== undefined)
      queryParams.append("isRead", params.isRead.toString());
    if (params?.type) queryParams.append("type", params.type);

    const response = await api.get(
      `/notification?${queryParams.toString()}`
    );
    return response.data.data;
  },

  // Get unread count
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get("/notification/unread-count");
    return response.data.data;
  },

  // Mark a notification as read
  markAsRead: async (notificationId: string): Promise<Notification> => {
    const response = await api.patch(
      `/notification/${notificationId}/read`
    );
    return response.data.data;
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<{ updated: number }> => {
    const response = await api.patch("/notification/mark-all-read");
    return response.data.data;
  },

  // Delete a notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/notification/${notificationId}`);
  },

  // Delete all notifications
  deleteAllNotifications: async (): Promise<{ deleted: number }> => {
    const response = await api.delete("/notification/clear-all");
    return response.data.data;
  },
};
