"use client";

import React from "react";
import { AuthProvider } from "@/contexts/auth-context";

// =============================================================
// Auth Layout - Centered layout for Login / Register (no sidebar)
// Wraps children in AuthProvider so useAuth() is available
// =============================================================

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="w-full max-w-md px-4">{children}</div>
      </div>
    </AuthProvider>
  );
}
