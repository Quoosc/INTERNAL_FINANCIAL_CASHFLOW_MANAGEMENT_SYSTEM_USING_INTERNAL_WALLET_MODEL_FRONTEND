"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = getAccessToken();
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload && typeof window !== "undefined") {
        const storedUser = localStorage.getItem("user_info");
        if (storedUser) {
          try {
            const user: AuthUser = JSON.parse(storedUser);
            return { user, isAuthenticated: true, isLoading: false };
          } catch {
            // Invalid stored data
          }
        }
      }
    }
    return { user: null, isAuthenticated: false, isLoading: false };
  });

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
    const isMock = localStorage.getItem("mock_auth") === "true";
    if (!isMock) {
      await authLogout();
    } else {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      document.cookie = "access_token=; path=/; max-age=0";
    }
    localStorage.removeItem("mock_auth");
    localStorage.removeItem("user_info");
    setState({ user: null, isAuthenticated: false, isLoading: false });
    window.location.href = "/login";
  }, []);

  const hasRole = useCallback(
    (role: RoleName): boolean => {
      if (!state.user) return false;
      return state.user.role === role;
    },
    [state.user]
  );

  const hasAnyRole = useCallback(
    (roles: RoleName[]): boolean => {
      if (!state.user) return false;
      return roles.some((r) => state.user!.role === r);
    },
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
