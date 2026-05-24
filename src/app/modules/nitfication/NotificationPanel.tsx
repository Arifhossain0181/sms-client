"use client";

import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from "./useNotifications";
import { formatDate } from "@/lib/utils";

export default function NotificationPanel() {
  const { data: notifications, isLoading } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending } = useMarkAllAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-sm text-gray-500">
            {unread > 0 ? `${unread} টি unread notification` : "সব read হয়েছে"}
          </p>
        </div>

        {unread > 0 && (
          <button
            onClick={() => markAllAsRead()}
            disabled={isPending}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
          >
            সব Read করুন
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {notifications?.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white rounded-xl shadow p-4 border-l-4 transition ${
              notification.isRead
                ? "border-gray-200 opacity-70"
                : "border-blue-500"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">

                {/* Title */}
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {notification.title}
                  </h3>
                  {!notification.isRead && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>

                {/* Message */}
                <p className="text-sm text-gray-600">{notification.message}</p>

                {/* Time */}
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(notification.createdAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 ml-4">
                {!notification.isRead && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Read
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="text-xs text-red-400 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {notifications?.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            কোনো notification নেই
          </div>
        )}
      </div>
    </div>
  );
}