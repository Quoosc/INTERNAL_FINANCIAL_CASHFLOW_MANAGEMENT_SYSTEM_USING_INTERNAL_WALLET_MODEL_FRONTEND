// =============================================================
// Notification routing — map notification → destination URL
// Backend (Notification.getReferenceLink) đã compute đúng URL theo type + role.
// Frontend chỉ cần fallback đơn giản khi referenceLink null.
// =============================================================

import { NotificationResponse } from "@/types";

/**
 * Trả về URL đích khi user click vào một notification.
 * Ưu tiên referenceLink từ backend — đã được tính đúng theo type + recipient role.
 * Fallback theo refType khi referenceLink null (notification cũ trong DB chưa migrate).
 */
export function getNotificationTarget(item: NotificationResponse): string | null {
  if (item.referenceLink) return item.referenceLink;

  // Fallback cho notification cũ không có referenceLink
  if (item.refType === "REQUEST"  && item.refId) return `/requests/${item.refId}`;
  if (item.refType === "PAYSLIP"  && item.refId) return `/payroll/${item.refId}`;
  if (item.refType === "PROJECT"  && item.refId) return `/projects/${item.refId}`;

  return null;
}
