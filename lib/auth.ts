import {
  LoginRequest,
  RegisterRequest,
  AuthenticationResponse,
} from "@/types";
import { api, setTokens, setTokenCookie, clearTokens, clearTokenCookie, getRefreshToken } from "./api-client";

// =============================================================
// Auth Service - Gọi các API Authentication
// =============================================================

/**
 * Đăng nhập - POST /api/v1/auth/login
 */
export async function login(request: LoginRequest): Promise<AuthenticationResponse> {
  const response = await api.post<AuthenticationResponse>(
    "/api/v1/auth/login",
    request,
    { skipAuth: true }
  );

  // Lưu tokens
  setTokens(response.data.access_token, response.data.refresh_token);
  setTokenCookie(response.data.access_token);

  return response.data;
}

/**
 * Đăng ký - POST /api/v1/auth/register
 */
export async function register(request: RegisterRequest): Promise<AuthenticationResponse> {
  const response = await api.post<AuthenticationResponse>(
    "/api/v1/auth/register",
    request,
    { skipAuth: true }
  );

  // Lưu tokens
  setTokens(response.data.access_token, response.data.refresh_token);
  setTokenCookie(response.data.access_token);

  return response.data;
}

/**
 * Đăng xuất - POST /api/v1/auth/logout
 */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await api.post("/api/v1/auth/logout", { refreshToken });
    } catch {
      // Ignore logout errors, still clear local tokens
    }
  }
  clearTokens();
  clearTokenCookie();
}
