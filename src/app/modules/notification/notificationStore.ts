import { create } from "zustand";

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  increment: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,

  setUnreadCount: (count) => set({ unreadCount: count }),

  // Increase the count when a new notification arrives
  increment: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  // Reset when all notifications are read
  reset: () => set({ unreadCount: 0 }),
}));