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

  // নতুন notification আসলে count বাড়াও
  increment: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  // সব read করলে reset
  reset: () => set({ unreadCount: 0 }),
}));