import {
  LoginRequest,
  LoginResponse,
  FirstLoginChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthUser,
} from "@/types";
import { api, setTokens, setTokenCookie, clearTokens, clearTokenCookie } from "./api-client";

// =============================================================
// Auth Service - Gọi các API Authentication
// Cập nhật: align với API_Spec v2.0 (camelCase tokens, bỏ register)
// =============================================================

/**
 * Đăng nhập - POST /api/v1/auth/login
 */
export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    "/api/v1/auth/login",
    request,
    { skipAuth: true }
  );

  // Lưu tokens (accessToken, refreshToken — camelCase)
  setTokens(response.data.accessToken, response.data.refreshToken);
  setTokenCookie(response.data.accessToken);

  return response.data;
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
 * Đổi mật khẩu lần đầu - POST /api/v1/auth/change-password
 * Chỉ gọi khi user.isFirstLogin = true
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
