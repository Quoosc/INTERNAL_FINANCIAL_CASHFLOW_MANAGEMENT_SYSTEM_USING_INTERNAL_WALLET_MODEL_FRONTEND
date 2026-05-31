"use client";

import React, { createContext, useCallback, useContext } from "react";
import { toast, type Id } from "react-toastify";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: Id;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: Toast[];
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: Id) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const success = useCallback((message: string) => {
    toast.success(message);
  }, []);

  const error = useCallback((message: string) => {
    toast.error(message);
  }, []);

  const warning = useCallback((message: string) => {
    toast.warning(message);
  }, []);

  const info = useCallback((message: string) => {
    toast.info(message);
  }, []);

  const dismiss = useCallback((id: Id) => {
    toast.dismiss(id);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts: [], success, error, warning, info, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
