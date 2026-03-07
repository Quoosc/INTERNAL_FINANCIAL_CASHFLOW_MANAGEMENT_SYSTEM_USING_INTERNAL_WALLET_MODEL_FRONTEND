import { BaseEntity } from "./api";

// =============================================================
// User Enums - khớp với com.mkwang.backend.modules.user.entity.*
// =============================================================

/** khớp với user.entity.UserStatus */
export enum UserStatus {
  ACTIVE = "ACTIVE",
  LOCKED = "LOCKED",
  PENDING = "PENDING",
}

/** khớp với user.entity.Permission - Dynamic RBAC */
export enum Permission {
  // --- 1. IAM & Security ---
  USER_PROFILE_VIEW = "USER_PROFILE_VIEW",
  USER_PROFILE_UPDATE = "USER_PROFILE_UPDATE",
  USER_PIN_UPDATE = "USER_PIN_UPDATE",
  NOTIFICATION_VIEW = "NOTIFICATION_VIEW",
  USER_VIEW_LIST = "USER_VIEW_LIST",
  USER_CREATE = "USER_CREATE",
  USER_UPDATE = "USER_UPDATE",
  USER_LOCK = "USER_LOCK",
  ROLE_MANAGE = "ROLE_MANAGE",

  // --- 2. Core Wallet ---
  WALLET_VIEW_SELF = "WALLET_VIEW_SELF",
  WALLET_DEPOSIT = "WALLET_DEPOSIT",
  WALLET_WITHDRAW = "WALLET_WITHDRAW",
  WALLET_TRANSACTION_VIEW = "WALLET_TRANSACTION_VIEW",
  TRANSACTION_APPROVE_WITHDRAW = "TRANSACTION_APPROVE_WITHDRAW",

  // --- 3. Project Lifecycle ---
  PROJECT_VIEW_ACTIVE = "PROJECT_VIEW_ACTIVE",
  PROJECT_CREATE = "PROJECT_CREATE",
  PROJECT_UPDATE = "PROJECT_UPDATE",
  PROJECT_PHASE_MANAGE = "PROJECT_PHASE_MANAGE",
  PROJECT_MEMBER_MANAGE = "PROJECT_MEMBER_MANAGE",
  PROJECT_STATUS_MANAGE = "PROJECT_STATUS_MANAGE",
  PROJECT_VIEW_ALL = "PROJECT_VIEW_ALL",

  // --- 4. Request Flow ---
  REQUEST_CREATE = "REQUEST_CREATE",
  REQUEST_VIEW_SELF = "REQUEST_VIEW_SELF",
  REQUEST_VIEW_DEPT = "REQUEST_VIEW_DEPT",
  REQUEST_APPROVE_TIER1 = "REQUEST_APPROVE_TIER1",
  REQUEST_REJECT = "REQUEST_REJECT",
  REQUEST_VIEW_ALL = "REQUEST_VIEW_ALL",
  REQUEST_APPROVE_TIER2 = "REQUEST_APPROVE_TIER2",
  REQUEST_VIEW_APPROVED = "REQUEST_VIEW_APPROVED",
  REQUEST_PAYOUT = "REQUEST_PAYOUT",

  // --- 5. Payroll & Accounting ---
  PAYROLL_VIEW_SELF = "PAYROLL_VIEW_SELF",
  PAYROLL_DOWNLOAD = "PAYROLL_DOWNLOAD",
  PAYROLL_MANAGE = "PAYROLL_MANAGE",
  PAYROLL_EXECUTE = "PAYROLL_EXECUTE",
  SYSTEM_FUND_VIEW = "SYSTEM_FUND_VIEW",
  SYSTEM_FUND_TOPUP = "SYSTEM_FUND_TOPUP",

  // --- 6. Organization & Config ---
  DEPT_VIEW_DASHBOARD = "DEPT_VIEW_DASHBOARD",
  DEPT_MANAGE = "DEPT_MANAGE",
  DEPT_BUDGET_ALLOCATE = "DEPT_BUDGET_ALLOCATE",
  SYSTEM_CONFIG_MANAGE = "SYSTEM_CONFIG_MANAGE",
  DASHBOARD_VIEW_GLOBAL = "DASHBOARD_VIEW_GLOBAL",
  AUDIT_LOG_VIEW = "AUDIT_LOG_VIEW",
}

// =============================================================
// User Interfaces - khớp với com.mkwang.backend.modules.user.entity.*
// =============================================================

/** khớp với user.entity.Role */
export interface Role extends BaseEntity {
  id: number;
  name: string;
  description: string | null;
  permissions: Permission[];
}

/** khớp với user.entity.UserProfile */
export interface UserProfile {
  userId: number;
  employeeCode: string | null;
  jobTitle: string | null;
  phoneNumber: string | null;
  dateOfBirth: string | null; // ISO date
  citizenId: string | null;
  address: string | null;
  avatarFileId: number | null;
  bankName: string | null;
  bankAccountNum: string | null;
  bankAccountOwner: string | null;
}

/** khớp với user.entity.UserSecuritySettings */
export interface UserSecuritySettings {
  userId: number;
  hasPinSet: boolean; // FE chỉ cần biết có PIN chưa, không nhận PIN hash
  retryCount: number;
  lockedUntil: string | null;
  isPinLocked: boolean;
}

/** khớp với user.entity.User */
export interface User extends BaseEntity {
  id: number;
  email: string;
  fullName: string;
  isFirstLogin: boolean;
  role: Role;
  departmentId: number | null;
  status: UserStatus;
  profile: UserProfile | null;
  enabled: boolean;
  accountNonExpired: boolean;
  accountNonLocked: boolean;
  credentialsNonExpired: boolean;
}
