import { BaseEntity } from "./api";

// =============================================================
// Notification Types - khớp với com.mkwang.backend.modules.notification.entity.*
// =============================================================

/** khớp với notification.entity.NotificationType */
export enum NotificationType {
  SYSTEM = "SYSTEM",
  REQUEST_APPROVED = "REQUEST_APPROVED",
  REQUEST_REJECTED = "REQUEST_REJECTED",
  SALARY_PAID = "SALARY_PAID",
  WALLET_UPDATED = "WALLET_UPDATED",
  WARN = "WARN",
}

/** khớp với notification.entity.Notification */
export interface Notification extends BaseEntity {
  id: number;
  userId: number;
  title: string;
  message: string | null;
  type: NotificationType;
  refId: number | null;
  refType: string | null;
  isRead: boolean;
  referenceLink: string | null; // computed từ backend
}
