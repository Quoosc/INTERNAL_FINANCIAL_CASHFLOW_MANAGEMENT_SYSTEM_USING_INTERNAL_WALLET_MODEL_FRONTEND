// =============================================================
// Audit Types - khớp với com.mkwang.backend.modules.audit.entity.*
// =============================================================

/** khớp với audit.entity.AuditAction */
export enum AuditAction {
  // User & Security
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_LOCKED = "USER_LOCKED",
  USER_UNLOCKED = "USER_UNLOCKED",
  ROLE_CREATED = "ROLE_CREATED",
  ROLE_UPDATED = "ROLE_UPDATED",
  ROLE_ASSIGNED = "ROLE_ASSIGNED",

  // Wallet
  WALLET_DEPOSIT = "WALLET_DEPOSIT",
  WALLET_WITHDRAW = "WALLET_WITHDRAW",
  WITHDRAW_APPROVED = "WITHDRAW_APPROVED",

  // Project
  PROJECT_CREATED = "PROJECT_CREATED",
  PROJECT_UPDATED = "PROJECT_UPDATED",
  PROJECT_STATUS_CHANGED = "PROJECT_STATUS_CHANGED",
  PHASE_CREATED = "PHASE_CREATED",
  PHASE_BUDGET_ALLOCATED = "PHASE_BUDGET_ALLOCATED",

  // Request
  REQUEST_CREATED = "REQUEST_CREATED",
  REQUEST_APPROVED = "REQUEST_APPROVED",
  REQUEST_REJECTED = "REQUEST_REJECTED",
  REQUEST_ESCALATED = "REQUEST_ESCALATED",
  REQUEST_PAID = "REQUEST_PAID",

  // Payroll
  PAYROLL_CREATED = "PAYROLL_CREATED",
  PAYROLL_EXECUTED = "PAYROLL_EXECUTED",

  // System
  SYSTEM_CONFIG_CHANGED = "SYSTEM_CONFIG_CHANGED",
  QUOTA_TOPUP = "QUOTA_TOPUP",
  SYSTEM_FUND_TOPUP = "SYSTEM_FUND_TOPUP",

  // Department
  DEPT_CREATED = "DEPT_CREATED",
  DEPT_UPDATED = "DEPT_UPDATED",
  DEPT_BUDGET_ALLOCATED = "DEPT_BUDGET_ALLOCATED",
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
