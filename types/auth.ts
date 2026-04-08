// =============================================================
// Auth DTOs - khớp với com.mkwang.backend.modules.auth.dto.*
// Cập nhật: align 100% với API_Spec.md v2.0
// =============================================================

// --- Request DTOs ---

/** POST /auth/login */
export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /auth/refresh-token */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/** POST /auth/change-password — đổi MK lần đầu (isFirstLogin = true) */
export interface FirstLoginChangePasswordRequest {
  newPassword: string;
}

/**
 * POST /auth/first-login/complete — thiết lập tài khoản lần đầu (1 bước)
 * Gộp đổi mật khẩu + tạo PIN trong 1 request duy nhất.
 * setupToken lấy từ LoginResponse.setupToken khi requiresSetup = true.
 */
export interface FirstLoginSetupRequest {
  setupToken: string;
  newPassword: string;
  confirmPassword: string;
  pin: string; // 5 chữ số
}

/** POST /auth/forgot-password */
export interface ForgotPasswordRequest {
  email: string;
}

/** POST /auth/reset-password — đặt lại MK bằng token từ email */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// --- Response DTOs ---

/**
 * User info trả về trong login response & GET /auth/me.
 * Khớp với backend AuthenticationResponse.user
 *
 * > role: tên role (string) — "EMPLOYEE" | "TEAM_LEADER" | "MANAGER" | "ACCOUNTANT" | "ADMIN"
 * > departmentId/departmentName: nullable nếu chưa gán phòng ban
 * > avatar: Signed URL Cloudinary (15 phút), nullable
 * > isFirstLogin: nếu true → FE redirect đổi MK
 * > status: ACTIVE | LOCKED | PENDING
 */
export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  departmentId: number | null;
  departmentName: string | null;
  avatar: string | null;
  isFirstLogin: boolean;
  status: string;
}

/** POST /auth/login — response */
export interface LoginResponse {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  /** true khi user đăng nhập lần đầu — chưa phát access/refresh token */
  requiresSetup: boolean;
  /** Short-lived token (15 phút) để xác thực POST /auth/first-login/complete. Chỉ có khi requiresSetup = true */
  setupToken: string | null;
}

/** POST /auth/refresh-token — response */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/** GET /auth/me — response (giống AuthUser) */
export type AuthMeResponse = AuthUser;
