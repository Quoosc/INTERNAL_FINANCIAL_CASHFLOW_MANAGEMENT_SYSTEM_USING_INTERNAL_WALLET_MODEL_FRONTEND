import {
  LoginRequest,
  LoginResponse,
  FirstLoginChangePasswordRequest,
  FirstLoginSetupRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthUser,
} from "@/types";
import { api, setTokens, setTokenCookie, clearTokens, clearTokenCookie } from "./api-client";

// =============================================================
// Auth Service - Gọi các API Authentication
// Cập nhật: align với backend v3.0 (first-login flow gộp 1 bước)
// =============================================================

/**
 * Đăng nhập - POST /api/v1/auth/login
 *
 * Nếu requiresSetup = true: KHÔNG lưu tokens (backend không cấp).
 * Chỉ lưu tokens khi requiresSetup = false (login bình thường).
 */
export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    "/api/v1/auth/login",
    request,
    { skipAuth: true }
  );

  const data = response.data;

  // Chỉ lưu tokens khi login bình thường (không phải first-login setup)
  if (!data.requiresSetup && data.accessToken && data.refreshToken) {
    setTokens(data.accessToken, data.refreshToken);
    setTokenCookie(data.accessToken);
  }

  return data;
}

/**
 * Hoàn tất thiết lập tài khoản lần đầu - POST /api/v1/auth/first-login/complete
 * Gộp đổi mật khẩu + tạo PIN trong 1 request.
 * Nhận setupToken từ LoginResponse.setupToken (requiresSetup = true).
 * Trả về AccessToken + RefreshToken đầy đủ sau khi setup xong.
 */
export async function firstLoginSetup(
  request: FirstLoginSetupRequest
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    "/api/v1/auth/first-login/complete",
    request,
    { skipAuth: true }
  );

  const data = response.data;

  // Backend trả về tokens đầy đủ sau setup
  if (data.accessToken && data.refreshToken) {
    setTokens(data.accessToken, data.refreshToken);
    setTokenCookie(data.accessToken);
  }

  return data;
}

/**
 * Đăng xuất - POST /api/v1/auth/logout
 * Backend dùng Bearer token từ header, không cần body
 */
export async function logout(): Promise<void> {
  try {
    await api.post("/api/v1/auth/logout");
  } catch {
    // Ignore logout errors, still clear local tokens
  }
  clearTokens();
  clearTokenCookie();
}

/**
 * Đổi mật khẩu lần đầu (legacy) - POST /api/v1/auth/change-password
 * @deprecated Dùng firstLoginSetup() thay thế cho first-login flow mới
 */
export async function changePasswordFirstLogin(
  request: FirstLoginChangePasswordRequest
): Promise<void> {
  await api.post("/api/v1/auth/change-password", request);
}

/**
 * Quên mật khẩu - POST /api/v1/auth/forgot-password
 */
export async function forgotPassword(
  request: ForgotPasswordRequest
): Promise<void> {
  await api.post("/api/v1/auth/forgot-password", request, { skipAuth: true });
}

/**
 * Đặt lại mật khẩu bằng token - POST /api/v1/auth/reset-password
 */
export async function resetPassword(
  request: ResetPasswordRequest
): Promise<void> {
  await api.post("/api/v1/auth/reset-password", request, { skipAuth: true });
}

/**
 * Lấy thông tin user hiện tại - GET /api/v1/auth/me
 */
export async function getMe(): Promise<AuthUser> {
  const response = await api.get<AuthUser>("/api/v1/auth/me");
  return response.data;
}
