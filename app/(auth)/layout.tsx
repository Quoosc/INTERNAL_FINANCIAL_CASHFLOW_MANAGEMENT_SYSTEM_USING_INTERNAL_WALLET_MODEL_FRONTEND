"use client";

import React from "react";
import { AuthProvider } from "@/contexts/auth-context";

// =============================================================
// Auth Layout - Wrapper for Login / Change-password / Create-pin
// No centering: each page owns its full-screen layout.
// =============================================================

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen">{children}</div>
    </AuthProvider>
  );
}
