// =============================================================
// Audit Types - khớp với backend API_Spec.md v2.0
// =============================================================

/**
 * khớp 100% với audit.entity.AuditAction (backend)
 * Thêm: PROJECT_TOPUP, CATEGORY_BUDGET_UPDATED
 */
export enum AuditAction {
  // 1. User management
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_LOCKED = "USER_LOCKED",
  USER_UNLOCKED = "USER_UNLOCKED",
  BANK_INFO_UPDATED = "BANK_INFO_UPDATED",

  // 2. Role & Permission management
  ROLE_ASSIGNED = "ROLE_ASSIGNED",
  ROLE_REVOKED = "ROLE_REVOKED",
  PERMISSION_GRANTED = "PERMISSION_GRANTED",
  PERMISSION_REVOKED = "PERMISSION_REVOKED",

  // 3. Department & Budget
  DEPARTMENT_CREATED = "DEPARTMENT_CREATED",
  DEPARTMENT_UPDATED = "DEPARTMENT_UPDATED",
  DEPARTMENT_DELETED = "DEPARTMENT_DELETED",
  DEPARTMENT_TOPUP = "DEPARTMENT_TOPUP",
  QUOTA_ADJUSTED = "QUOTA_ADJUSTED",

  // 4. Project & Category (MỚI)
  PROJECT_TOPUP = "PROJECT_TOPUP",
  CATEGORY_BUDGET_UPDATED = "CATEGORY_BUDGET_UPDATED",

  // 5. System & Fund Config
  CONFIG_UPDATED = "CONFIG_UPDATED",
  SYSTEM_FUND_ADJUSTED = "SYSTEM_FUND_ADJUSTED",

  // 6. Security & Access
  PIN_RESET = "PIN_RESET",
  PIN_LOCKED = "PIN_LOCKED",
  USER_LOGIN_SUCCESS = "USER_LOGIN_SUCCESS",
  USER_LOGIN_FAILED = "USER_LOGIN_FAILED",
  DATA_EXPORTED = "DATA_EXPORTED",

  // 7. Generic fallback
  MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT",
}

/** GET /admin/audit — response item */
export interface AuditLogResponse {
  id: number;
  actorId: number | null;
  actorName: string | null;
  action: AuditAction;
  entityName: string;            // tên bảng bị tác động: "users", "departments"...
  entityId: string;              // ID dòng dữ liệu bị tác động
  oldValues: Record<string, unknown> | null;  // JSON snapshot trạng thái trước
  newValues: Record<string, unknown> | null;  // JSON snapshot trạng thái sau
  createdAt: string;
}

/** GET /admin/audit — query params */
export interface AuditLogFilterParams {
  actor?: string;
  action?: AuditAction;
  startDate?: string;         // "YYYY-MM-DD"
  endDate?: string;           // "YYYY-MM-DD"
  page?: number;
  limit?: number;
}
