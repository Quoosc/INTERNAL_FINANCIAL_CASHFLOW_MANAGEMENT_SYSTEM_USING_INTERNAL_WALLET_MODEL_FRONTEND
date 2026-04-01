// =============================================================
// Notification Types - khớp với backend API_Spec.md v2.0
// =============================================================

// --- Enums ---

/** khớp với notification.entity.NotificationType */
export enum NotificationType {
  SYSTEM = "SYSTEM",
  REQUEST_APPROVED = "REQUEST_APPROVED",
  REQUEST_REJECTED = "REQUEST_REJECTED",
  SALARY_PAID = "SALARY_PAID",
  WARN = "WARN",
}

/** notification.ref_type — loại entity liên quan */
export enum NotificationRefType {
  REQUEST = "REQUEST",
  PAYSLIP = "PAYSLIP",
  PROJECT = "PROJECT",
}

// --- Response DTOs ---

/** GET /notifications — response item */
export interface NotificationResponse {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  refId: number | null;        // ID đối tượng liên quan (BigInt)
  refType: NotificationRefType | null;
  createdAt: string;
}

/**
 * GET /notifications — full paginated response
 * (extends PaginatedResponse but has extra unreadCount)
 */
export interface NotificationListResponse {
  items: NotificationResponse[];
  unreadCount: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** PUT /notifications/:id/read — response */
export interface MarkReadResponse {
  id: number;
  isRead: true;
}

/** PUT /notifications/read-all — response */
export interface MarkAllReadResponse {
  message: string;
  updatedCount: number;
}

// --- Filter Params ---

/** GET /notifications — query params */
export interface NotificationFilterParams {
  isRead?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
}

// --- WebSocket Payloads ---

/** /user/queue/notifications — message payload */
export interface NotificationMessage {
  type: "NEW_NOTIFICATION";
  data: NotificationResponse;
  timestamp: string;
}
