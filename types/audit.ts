// =============================================================
// Audit Types - khớp với com.mkwang.backend.modules.audit.entity.*
// =============================================================

/** khớp 100% với audit.entity.AuditAction (backend) */
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

  // 3. Department & Budget (Core Admin powers)
  DEPARTMENT_CREATED = "DEPARTMENT_CREATED",
  DEPARTMENT_UPDATED = "DEPARTMENT_UPDATED",
  DEPARTMENT_DELETED = "DEPARTMENT_DELETED",
  QUOTA_TOPUP = "QUOTA_TOPUP",
  QUOTA_ADJUSTED = "QUOTA_ADJUSTED",

  // 4. System & Fund Config
  CONFIG_UPDATED = "CONFIG_UPDATED",
  SYSTEM_FUND_ADJUSTED = "SYSTEM_FUND_ADJUSTED",

  // 5. Security & Access (Crucial for defense)
  PIN_RESET = "PIN_RESET",
  PIN_LOCKED = "PIN_LOCKED",
  USER_LOGIN_SUCCESS = "USER_LOGIN_SUCCESS",
  USER_LOGIN_FAILED = "USER_LOGIN_FAILED",
  DATA_EXPORTED = "DATA_EXPORTED",

  // 6. Generic fallback
  MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT",
}

/** khớp với audit.entity.AuditLog */
export interface AuditLog {
  id: number;
  actorId: number | null;
  actorName: string | null;
  action: AuditAction;
  entityName: string;
  entityId: string;
  oldValues: string | null; // JSON string
  newValues: string | null; // JSON string
  createdAt: string;
}
