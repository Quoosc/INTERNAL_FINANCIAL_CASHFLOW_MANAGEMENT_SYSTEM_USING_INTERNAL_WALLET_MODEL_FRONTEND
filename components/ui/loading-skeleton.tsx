import React from "react";

interface SkeletonProps {
  className?: string;
}

/** Generic pulsing block */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={`rounded-lg bg-slate-100 animate-pulse ${className ?? "h-4 w-full"}`} />;
}

/** Stat/KPI card skeleton — matches the h-24 rounded-xl cards used in dashboards */
export function StatCardSkeleton({ className }: SkeletonProps) {
  return <div className={`h-24 rounded-xl bg-slate-100 animate-pulse ${className ?? ""}`} />;
}

/** Generic content card skeleton */
export function CardSkeleton({ className }: SkeletonProps) {
  return <div className={`rounded-2xl bg-slate-100 animate-pulse ${className ?? "h-32"}`} />;
}

/** Table row skeleton — renders N cells with pulsing bars */
export function TableRowSkeleton({ cols = 4, className }: { cols?: number; className?: string }) {
  return (
    <tr className={className}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 rounded bg-slate-100 animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

/** A small inline spinner for button loading states */
export function Spinner({ className }: SkeletonProps) {
  return (
    <svg
      aria-hidden="true"
      className={`animate-spin ${className ?? "h-4 w-4"}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/** Full-page loading placeholder */
export function PageLoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-8 w-8 text-blue-500" />
        <p className="text-slate-500 text-sm">Đang tải...</p>
      </div>
    </div>
  );
}

/** Empty state placeholder */
export function EmptyState({
  message = "Không có dữ liệu.",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500 ${className ?? ""}`}
    >
      {message}
    </div>
  );
}
