"use client";

import React, { useEffect } from "react";

interface SideDrawerProps {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  widthClassName?: string;
}

export function SideDrawer({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  widthClassName = "max-w-xl",
}: SideDrawerProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Đóng panel"
      />

      <aside className={`absolute inset-y-0 right-0 flex w-full ${widthClassName} flex-col bg-white shadow-2xl`}>
        <header className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center"
              aria-label="Đóng"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && <footer className="border-t border-slate-200 bg-slate-50 px-6 py-4">{footer}</footer>}
      </aside>
    </div>
  );
}
