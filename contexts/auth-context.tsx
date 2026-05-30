"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AuthUser, RoleName } from "@/types";
import { getAccessToken } from "@/lib/api-client";
import { logout as authLogout } from "@/lib/auth";

// =============================================================
// Auth Context - Quản lý trạng thái xác thực toàn cục
// Kiến trúc mới: 5 Roles, role-based access (không permission-level)
// =============================================================

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
  /** Kiểm tra user có đúng role cụ thể không */
  hasRole: (role: RoleName) => boolean;
  /** Kiểm tra user có bất kỳ role nào trong danh sách không */
  hasAnyRole: (roles: RoleName[]) => boolean;
  /** Kiểm tra user có phải first login (cần đổi MK) không */
  isFirstLogin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Decode JWT to extract user info ---
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// ─── Initial auth resolver (called once after mount, safe from SSR) ───────────

function resolveStoredAuth(): { user: AuthUser; isAuthenticated: true } | { user: null; isAuthenticated: false } {
  const token = getAccessToken();
  if (token && decodeJwtPayload(token)) {
    try {
      const raw = localStorage.getItem("user_info");
      if (raw) {
        const user = JSON.parse(raw) as AuthUser;
        return { user, isAuthenticated: true };
      }
    } catch {
      // corrupt data — fall through
    }
  }
  return { user: null, isAuthenticated: false };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Start with isLoading: true so server HTML and initial client render are identical
  // (localStorage is not readable during SSR → no hydration mismatch).
  // useEffect runs after mount and resolves the actual stored user in one pass.
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // One-time read from localStorage after client mount — safe, no dependency loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ ...resolveStoredAuth(), isLoading: false });
  }, []);

  const setUser = useCallback((user: AuthUser | null) => {
    if (user) {
      localStorage.setItem("user_info", JSON.stringify(user));
      setState({ user, isAuthenticated: true, isLoading: false });
    } else {
      localStorage.removeItem("user_info");
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    localStorage.removeItem("user_info");
    setState({ user: null, isAuthenticated: false, isLoading: false });
    window.location.href = "/login";
  }, []);

  const hasRole = useCallback(
    (role: RoleName): boolean => state.user?.role === role,
    [state.user]
  );

  const hasAnyRole = useCallback(
    (roles: RoleName[]): boolean => roles.some((r) => state.user?.role === r),
    [state.user]
  );

  const isFirstLogin = state.user?.isFirstLogin ?? false;

  return (
    <AuthContext.Provider
      value={{
        ...state,
        setUser,
        logout,
        hasRole,
        hasAnyRole,
        isFirstLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook để truy cập auth context
 * @example
 * const { user, hasRole, logout } = useAuth();
 * if (hasRole(RoleName.ADMIN)) { ... }
 * if (hasAnyRole([RoleName.ADMIN, RoleName.MANAGER])) { ... }
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
