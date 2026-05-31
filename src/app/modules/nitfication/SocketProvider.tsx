"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";

import { useNotificationStore } from "./notificationStore";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authstore";

export default function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const { increment } = useNotificationStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    // Backend এ connect করো
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      withCredentials: true,
    });

    // Connect হলে user এর room এ join করো
    socket.on("connect", () => {
      socket.emit("join", { userId: user.id, role: user.role });
    });

    // নতুন notification আসলে
    const handleNotification = (data: { title?: string; body?: string; message?: string }) => {
      increment();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.info(data.title ?? "Notification", {
        description: data.body ?? data.message,
      });
    };

    socket.on("notification", handleNotification);
    socket.on("notification:new", handleNotification);

    return () => {
      socket.disconnect();
    };
  }, [increment, queryClient, user]);

  return <>{children}</>;
}