"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useNotificationStore } from "./notificationStore";
import { useAuthStore } from "@/store/authstore";

const SOCKET_URL =
  (process.env.NEXT_PUBLIC_SOCKET_URL as string | undefined) ?? "";

export default function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const { increment } = useNotificationStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || !SOCKET_URL) return;

    // Connect to the backend
    const socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    // Join the user's room after connecting
    socket.on("connect", () => {
      socket.emit("join", { userId: user.id, role: user.role });
    });

    // Handle new notifications
    const handleNotification = (data: {
      title?: string;
      body?: string;
      message?: string;
    }) => {
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