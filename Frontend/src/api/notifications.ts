import { api } from "./client";
import { Notification, CreateNotificationRequest, NotificationListResponse } from "./types";

export const notificationsApi = {
  getAll: () =>
    api.get<NotificationListResponse>("/notifications"),

  create: (data: CreateNotificationRequest) =>
    api.post<Notification>("/notifications", data),

  markAsRead: (id: string) =>
    api.put<{ message: string }>(`/notifications/${id}/read`, {}),

  markAllAsRead: () =>
    api.put<{ message: string }>("/notifications/read-all", {}),

  delete: (id: string) =>
    api.del<{ message: string }>(`/notifications/${id}`),
};
