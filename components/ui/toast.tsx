"use client";

import React from "react";
import { useToast } from "@/contexts/toast-context";

const STYLES = {
  success: {
    bar:  "bg-emerald-500",
    glow: "shadow-emerald-500/20",
    icon: "text-emerald-400",
    path: "M5 13l4 4L19 7",
  },
  error: {
    bar:  "bg-rose-500",
    glow: "shadow-rose-500/20",
    icon: "text-rose-400",
    path: "M6 18L18 6M6 6l12 12",
  },
  warning: {
    bar:  "bg-amber-400",
    glow: "shadow-amber-500/20",
    icon: "text-amber-400",
    path: "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  },
  info: {
    bar:  "bg-blue-500",
    glow: "shadow-blue-500/20",
    icon: "text-blue-400",
    path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
} as const;

export function ToastStack() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center pointer-events-none min-w-72 max-w-sm w-full px-4">
      {toasts.map((t) => {
        const s = STYLES[t.type];
        return (
          <div
            key={t.id}
            role="alert"
            style={{
              animation: t.leaving
                ? "toast-out 0.32s cubic-bezier(0.4, 0, 1, 1) forwards"
                : "toast-in 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
            className={`w-full flex items-start gap-3 bg-zinc-900 text-white rounded-2xl border border-white/8 overflow-hidden pointer-events-auto ${s.glow} shadow-2xl ${t.leaving ? "" : "mb-2"}`}
          >
            {/* Left color bar */}
            <div className={`w-1 self-stretch shrink-0 rounded-r-full ${s.bar}`} />
            {/* Icon */}
            <svg
              className={`w-5 h-5 shrink-0 mt-[14px] ${s.icon}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.path} />
            </svg>
            {/* Message */}
            <p className="text-sm flex-1 py-3.5 pr-1 leading-snug text-white/90">{t.message}</p>
            {/* Dismiss */}
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Đóng thông báo"
              className="shrink-0 mt-3 mr-3 w-5 h-5 flex items-center justify-center rounded-full text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
