"use client";

import React from "react";
import { AuthProvider } from "@/contexts/auth-context";
import { ToastProvider } from "@/contexts/toast-context";
import { ToastStack } from "@/components/ui/toast";

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
      <ToastProvider>
        <div className="min-h-screen">
          {children}
          <ToastStack />
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
