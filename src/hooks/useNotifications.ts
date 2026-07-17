"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  notificationService,
  Notification,
  NotificationQueryParams,
} from "@/service/notification.service";

const NOTIFICATIONS_KEY = ["notifications"];
const UNREAD_COUNT_KEY = ["notifications", "unread"];

export const useNotifications = (params?: NotificationQueryParams) => {
  return useQuery<Notification[]>({
    queryKey: [...NOTIFICATIONS_KEY, params],
    queryFn: () => notificationService.getNotifications(params),
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.markAsRead(notificationId),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
};

export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.deleteAllNotifications(),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
};
