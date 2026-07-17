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

function unwrap<T>(res: { data: any }): T {
  return res.data?.data ?? res.data;
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
      `/notifications?${queryParams.toString()}`
    );
    return unwrap<Notification[]>(response);
  },

  // Get unread count
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get("/notifications/unread-count");
    return unwrap<{ count: number }>(response);
  },

  // Mark a notification as read
  markAsRead: async (notificationId: string): Promise<Notification> => {
    const response = await api.patch(
      `/notifications/${notificationId}/read`
    );
    return unwrap<Notification>(response);
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<{ updated: number }> => {
    const response = await api.patch("/notifications/mark-all-read");
    return unwrap<{ updated: number }>(response);
  },

  // Delete a notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  },

  // Delete all notifications
  deleteAllNotifications: async (): Promise<{ deleted: number }> => {
    const response = await api.delete("/notifications/clear-all");
    return unwrap<{ deleted: number }>(response);
  },
};
