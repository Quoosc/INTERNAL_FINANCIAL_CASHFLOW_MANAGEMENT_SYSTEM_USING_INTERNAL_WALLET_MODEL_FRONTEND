// =============================================================
// User Types - khớp với backend API_Spec.md v2.0
// Cập nhật: tách thành Response DTOs thay vì map 1:1 entity
// =============================================================

// --- Enums ---

/** khớp với user.entity.UserStatus */
export enum UserStatus {
  ACTIVE = "ACTIVE",
  LOCKED = "LOCKED",
  PENDING = "PENDING",
}

/**
 * Roles mặc định trong hệ thống — 5 roles.
 * Dùng cho FE logic (menu, routing, permission check).
 * Backend trả role dưới dạng string trong AuthUser.role
 */
export enum RoleName {
  EMPLOYEE = "EMPLOYEE",
  TEAM_LEADER = "TEAM_LEADER",
  MANAGER = "MANAGER",
  ACCOUNTANT = "ACCOUNTANT",
  ADMIN = "ADMIN",
}

/**
 * Dynamic RBAC Permissions.
 * Định nghĩa cứng trong source code, Admin gán cho Role qua UI.
 */
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

// --- Response DTOs (khớp API Spec) ---

/**
 * GET /users/me/profile — response
 *
 * > bankInfo, securitySettings là nested object
 * > avatar: Signed URL Cloudinary, nullable
 */
export interface UserProfileResponse {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  dateOfBirth: string | null;     // "YYYY-MM-DD"
  address: string | null;
  departmentId: number | null;
  departmentName: string | null;
  jobTitle: string | null;
  citizenId: string | null;
  avatar: string | null;         // Signed URL 15 min
  bankInfo: BankInfo;
  securitySettings: SecuritySettings;
}

export interface BankInfo {
  bankName: string | null;
  accountNumber: string | null;
  accountOwner: string | null;
}

export interface SecuritySettings {
  hasPIN: boolean;
  pinLockedUntil: string | null; // ISO datetime, null = not locked
}

// --- Request DTOs ---

/** PUT /users/me/profile — body */
export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;       // "YYYY-MM-DD"
  citizenId?: string;
  address?: string;
}

/** PUT /users/me/avatar — body (sau khi upload lên Cloudinary) */
export interface UpdateAvatarRequest {
  cloudinaryPublicId: string;
  fileName: string;
  fileType: string;
  size: number;
}

/** PUT /users/me/bank-info — body */
export interface UpdateBankInfoRequest {
  bankName: string;
  accountNumber: string;
  accountOwner: string;
}

/** PUT /users/me/password — body (đổi MK khi đã đăng nhập) */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** POST /users/me/pin — body (tạo PIN lần đầu) */
export interface CreatePinRequest {
  pin: string; // 5 chữ số
}

/** PUT /users/me/pin — body (đổi PIN) */
export interface UpdatePinRequest {
  currentPin: string;
  newPin: string; // 5 chữ số
}

/** POST /users/me/pin/verify — body */
export interface VerifyPinRequest {
  pin: string;
}

/** POST /users/me/pin/verify — response */
export interface VerifyPinResponse {
  valid: boolean;
}

/** PUT /users/me/avatar — response */
export interface UpdateAvatarResponse {
  avatar: string; // Signed URL
}

// --- Bank List (static data) ---

/** GET /banks — response item */
export interface BankOption {
  value: string;    // "MB Bank" — lưu vào user_profiles.bank_name
  label: string;    // "MB Bank (Quân đội)" — hiển thị dropdown
}
