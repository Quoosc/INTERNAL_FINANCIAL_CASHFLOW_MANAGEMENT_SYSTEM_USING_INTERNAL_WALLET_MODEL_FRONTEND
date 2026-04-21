"use client";

import React from "react";
import { useToast } from "@/contexts/toast-context";

const STYLES = {
  success: {
    wrap: "bg-emerald-50 border-emerald-200 text-emerald-900",
    icon: "text-emerald-500",
    path: "M5 13l4 4L19 7",
  },
  error: {
    wrap: "bg-rose-50 border-rose-200 text-rose-900",
    icon: "text-rose-500",
    path: "M6 18L18 6M6 6l12 12",
  },
  warning: {
    wrap: "bg-amber-50 border-amber-200 text-amber-900",
    icon: "text-amber-500",
    path: "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  },
  info: {
    wrap: "bg-blue-50 border-blue-200 text-blue-900",
    icon: "text-blue-500",
    path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
} as const;

export function ToastStack() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none w-80">
      {toasts.map((toast) => {
        const s = STYLES[toast.type];
        return (
          <div
            key={toast.id}
            role="alert"
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg pointer-events-auto ${s.wrap}`}
          >
            <svg className={`w-5 h-5 shrink-0 mt-0.5 ${s.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.path} />
            </svg>
            <p className="text-sm flex-1 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Đóng thông báo"
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
