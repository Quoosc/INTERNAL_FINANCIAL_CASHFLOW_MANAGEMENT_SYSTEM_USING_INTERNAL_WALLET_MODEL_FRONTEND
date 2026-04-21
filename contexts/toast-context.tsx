"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: Toast[];
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let _nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((type: ToastType, message: string) => {
    const id = _nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg: string) => add("success", msg), [add]);
  const error = useCallback((msg: string) => add("error", msg), [add]);
  const warning = useCallback((msg: string) => add("warning", msg), [add]);
  const info = useCallback((msg: string) => add("info", msg), [add]);

  return (
    <ToastContext.Provider value={{ toasts, success, error, warning, info, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
