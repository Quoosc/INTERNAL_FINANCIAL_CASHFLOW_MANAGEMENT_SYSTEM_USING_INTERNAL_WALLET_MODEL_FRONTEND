import { ApiResponse } from "@/types";

// =============================================================
// Centralized API Client with JWT Token Management
// =============================================================

const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// --- Token Helpers ---

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// --- Cookie helpers for middleware (SSR-readable) ---

export function setTokenCookie(accessToken: string): void {
  if (typeof document === "undefined") return;
  // Cookie accessible by Next.js middleware (httpOnly=false for client-set cookies)
  document.cookie = `${TOKEN_KEY}=${accessToken}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
}

export function clearTokenCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

// --- Core Fetch Wrapper ---

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public apiMessage: string,
    public data?: unknown
  ) {
    super(apiMessage);
    this.name = "ApiError";
  }
}

export { ApiError };

function toFriendlyApiMessage(message: string | null | undefined, status?: number): string {
  const raw = (message || "").trim();
  const normalized = raw.toLowerCase();

  if (!raw) {
    return "Không thể xử lý yêu cầu. Vui lòng thử lại.";
  }

  if (
    normalized.includes("usersecuritysettings not found") ||
    normalized.includes("transaction pin has not been set up")
  ) {
    return "Tài khoản chưa thiết lập PIN giao dịch. Vui lòng vào Hồ sơ cá nhân để tạo PIN hoặc liên hệ quản trị viên.";
  }

  if (
    normalized.includes("team leader cannot approve their own request") ||
    normalized.includes("team leader cannot reject their own request")
  ) {
    return "Bạn không thể tự duyệt hoặc từ chối yêu cầu do chính mình tạo.";
  }

  if (normalized.includes("insufficient wallet balance")) {
    if (normalized.includes("debit")) {
      return "Số dư ví nguồn không đủ để thực hiện giao dịch. Vui lòng kiểm tra lại quỹ khả dụng trước khi duyệt.";
    }

    if (normalized.includes("lock")) {
      return "Số dư khả dụng không đủ để giữ tiền cho yêu cầu này. Vui lòng kiểm tra lại quỹ trước khi duyệt.";
    }

    return "Số dư ví không đủ để thực hiện giao dịch này.";
  }

  if (normalized.includes("full authentication is required") || normalized.includes("session expired")) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (normalized.includes("malformed or unreadable request body")) {
    return "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại thông tin.";
  }

  if (normalized.includes("bad credentials")) {
    return "Email hoặc mật khẩu không đúng.";
  }

  if (normalized.includes("access denied") || normalized.includes("forbidden")) {
    return "Bạn không có quyền thực hiện thao tác này.";
  }

  if (status === 404 && normalized.includes("not found")) {
    return "Không tìm thấy dữ liệu phù hợp. Vui lòng tải lại trang và thử lại.";
  }

  if (status && status >= 500) {
    return "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.";
  }

  return raw;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch("/api/v1/auth/refresh-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      clearTokenCookie();
      return null;
    }

    const json: ApiResponse<{ accessToken: string; refreshToken: string }> =
      await res.json();

    if (json.success && json.data) {
      setTokens(json.data.accessToken, json.data.refreshToken);
      setTokenCookie(json.data.accessToken);
      return json.data.accessToken;
    }

    return null;
  } catch {
    clearTokens();
    clearTokenCookie();
    return null;
  }
}

/**
 * Centralized API client.
 * - Auto-attaches Authorization header
 * - Auto-refreshes token on 401
 * - Unwraps ApiResponse<T>
 */
export async function apiClient<T>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { skipAuth = false, headers: customHeaders, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let res = await fetch(url, { headers, ...rest });

  if (res.status === 503) {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/maintenance")) {
      window.location.href = "/maintenance";
    }
    throw new ApiError(503, "Hệ thống đang bảo trì. Vui lòng thử lại sau.");
  }

  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(url, { headers, ...rest });
    } else {
      // Redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new ApiError(401, toFriendlyApiMessage("Session expired. Please login again.", 401));
    }
  }

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    throw new ApiError(
      res.status,
      toFriendlyApiMessage(json.message || "An error occurred", res.status),
      json
    );
  }

  return json;
}

export async function downloadFile(
  url: string,
  filename: string,
  options: FetchOptions = {}
): Promise<void> {
  const { skipAuth = false, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let res = await fetch(url, { method: "GET", headers, ...rest });

  if (res.status === 503) {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/maintenance")) {
      window.location.href = "/maintenance";
    }
    throw new ApiError(503, "Hệ thống đang bảo trì. Vui lòng thử lại sau.");
  }

  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(url, { method: "GET", headers, ...rest });
    } else {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new ApiError(401, toFriendlyApiMessage("Session expired. Please login again.", 401));
    }
  }

  if (!res.ok) {
    let message = "Không thể tải file. Vui lòng thử lại.";

    try {
      const json = await res.json();
      message = toFriendlyApiMessage(json?.message || message, res.status);
    } catch {
      message = toFriendlyApiMessage(message, res.status);
    }

    throw new ApiError(res.status, message);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

// --- Convenience Methods ---

function serializeBody(body?: unknown): BodyInit | undefined {
  if (body == null) return undefined;
  if (typeof FormData !== "undefined" && body instanceof FormData) return body;
  return JSON.stringify(body);
}

export const api = {
  get: <T>(url: string, options?: FetchOptions) =>
    apiClient<T>(url, { method: "GET", ...options }),

  post: <T>(url: string, body?: unknown, options?: FetchOptions) =>
    apiClient<T>(url, {
      method: "POST",
      body: serializeBody(body),
      ...options,
    }),

  put: <T>(url: string, body?: unknown, options?: FetchOptions) =>
    apiClient<T>(url, {
      method: "PUT",
      body: serializeBody(body),
      ...options,
    }),

  patch: <T>(url: string, body?: unknown, options?: FetchOptions) =>
    apiClient<T>(url, {
      method: "PATCH",
      body: serializeBody(body),
      ...options,
    }),

  delete: <T>(url: string, options?: FetchOptions) =>
    apiClient<T>(url, { method: "DELETE", ...options }),
};
