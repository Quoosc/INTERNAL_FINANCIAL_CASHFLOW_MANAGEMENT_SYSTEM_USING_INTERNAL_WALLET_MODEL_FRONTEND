import React from "react";

interface AlertProps {
  message: string;
  className?: string;
}

export function ErrorAlert({ message, className }: AlertProps) {
  return (
    <div
      role="alert"
      className={`px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm ${className ?? ""}`}
    >
      {message}
    </div>
  );
}

export function WarningAlert({ message, className }: AlertProps) {
  return (
    <div
      role="alert"
      className={`px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm ${className ?? ""}`}
    >
      {message}
    </div>
  );
}

export function InfoAlert({ message, className }: AlertProps) {
  return (
    <div
      role="status"
      className={`px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm ${className ?? ""}`}
    >
      {message}
    </div>
  );
}

export function SuccessAlert({ message, className }: AlertProps) {
  return (
    <div
      role="status"
      className={`px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm ${className ?? ""}`}
    >
      {message}
    </div>
  );
}
