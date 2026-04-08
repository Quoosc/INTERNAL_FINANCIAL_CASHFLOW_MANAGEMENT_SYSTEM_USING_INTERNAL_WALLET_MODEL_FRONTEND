// =============================================================
// Notification API — khớp với NotificationController
// Base URL: /api/v1/notifications (context-path /api/v1 + mapping /notifications)
// =============================================================

import { api } from "@/lib/api-client";
import type { NotificationResponse } from "@/types";

// Spring Data Page<T> response format
interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;   // 0-indexed page
  size: number;
}

/** GET /api/v1/notifications — Danh sách notification */
export async function getNotifications(
  unreadOnly = false,
  page = 0,
  size = 20
) {
  const params = new URLSearchParams();
  if (unreadOnly) params.set("unreadOnly", "true");
  params.set("page", String(page));
  params.set("size", String(size));
  return api.get<SpringPage<NotificationResponse>>(
    `/api/v1/notifications?${params.toString()}`
  );
}

/** GET /api/v1/notifications/unread-count — Số chưa đọc (badge) */
export async function getUnreadCount() {
  return api.get<number>("/api/v1/notifications/unread-count");
}

/** PATCH /api/v1/notifications/{id}/read — Đánh dấu đã đọc 1 noti */
export async function markAsRead(id: number) {
  return api.patch<NotificationResponse>(`/api/v1/notifications/${id}/read`);
}

/** PATCH /api/v1/notifications/read-all — Đánh dấu tất cả đã đọc */
export async function markAllAsRead() {
  return api.patch<void>("/api/v1/notifications/read-all");
}
