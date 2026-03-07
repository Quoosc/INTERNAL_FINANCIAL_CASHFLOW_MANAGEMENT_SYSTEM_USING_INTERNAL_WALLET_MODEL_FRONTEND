"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserInfoResponse, Permission } from "@/types";
import { getAccessToken } from "@/lib/api-client";
import { logout as authLogout } from "@/lib/auth";

// =============================================================
// Auth Context - Quản lý trạng thái xác thực toàn cục
// =============================================================

interface AuthState {
  user: UserInfoResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  setUser: (user: UserInfoResponse | null) => void;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
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
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from stored token
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload) {
        // Extract user info from localStorage (set during login)
        const storedUser = localStorage.getItem("user_info");
        if (storedUser) {
          try {
            const user: UserInfoResponse = JSON.parse(storedUser);
            setState({ user, isAuthenticated: true, isLoading: false });
            return;
          } catch {
            // Invalid stored data
          }
        }
      }
    }
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  const setUser = useCallback((user: UserInfoResponse | null) => {
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

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!state.user) return false;
      return state.user.permissions.includes(permission);
    },
    [state.user]
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      if (!state.user) return false;
      return permissions.some((p) => state.user!.permissions.includes(p));
    },
    [state.user]
  );

  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      if (!state.user) return false;
      return permissions.every((p) => state.user!.permissions.includes(p));
    },
    [state.user]
  );

  return (
    <AuthContext.Provider
      value={{
        ...state,
        setUser,
        logout,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook để truy cập auth context
 * @example
 * const { user, hasPermission, logout } = useAuth();
 * if (hasPermission(Permission.WALLET_VIEW_SELF)) { ... }
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
