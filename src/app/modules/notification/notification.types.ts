export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  userId: string;
  createdAt: string;
}

export interface CreateNotificationPayload {
  title: string;
  message: string;
  userId: string;
}