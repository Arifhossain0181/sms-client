import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "./notification.service";
import { useNotificationStore } from "./notificationStore";
import { useEffect } from "react";
import { toast } from "sonner";

export const useNotifications = () => {
  const { setUnreadCount } = useNotificationStore();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationService.getAll,
  });

  // Unread count update করো
  useEffect(() => {
    if (query.data) {
      const unread = query.data.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    }
  }, [query.data]);

  return query;
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const { setUnreadCount } = useNotificationStore();

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const { reset } = useNotificationStore();

  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      reset();
      toast.success("সব notification read হয়েছে!");
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};