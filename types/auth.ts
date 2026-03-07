// =============================================================
// Auth DTOs - khớp với com.mkwang.backend.modules.auth.dto.*
// =============================================================

// --- Request DTOs ---

/** khớp với auth.dto.request.LoginRequest */
export interface LoginRequest {
  email: string;
  password: string;
}

/** khớp với auth.dto.request.RegisterRequest */
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/** khớp với auth.dto.request.RefreshTokenRequest */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/** khớp với auth.dto.request.LogoutRequest */
export interface LogoutRequest {
  refreshToken: string;
}

// --- Response DTOs ---

/** khớp với auth.dto.response.UserInfoResponse */
export interface UserInfoResponse {
  id: number;
  email: string;
  full_name: string;
  role: string;
  permissions: string[];
}

/** khớp với auth.dto.response.AuthenticationResponse */
export interface AuthenticationResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserInfoResponse;
}
