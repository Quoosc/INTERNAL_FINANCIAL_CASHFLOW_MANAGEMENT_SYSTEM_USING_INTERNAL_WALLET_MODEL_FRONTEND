"use client";

import React from "react";

interface DiffViewerProps {
  oldValues: Record<string, unknown> | null | undefined;
  newValues: Record<string, unknown> | null | undefined;
  fieldLabels?: Record<string, string>;
  emptyMessage?: string;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Không có";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "number") return value.toLocaleString("vi-VN");
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function humanizeToken(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^\w/, (char) => char.toUpperCase());
}

export function DiffViewer({
  oldValues,
  newValues,
  fieldLabels = {},
  emptyMessage = "Không có dữ liệu thay đổi.",
}: DiffViewerProps) {
  const fields = Array.from(
    new Set([...Object.keys(oldValues ?? {}), ...Object.keys(newValues ?? {})])
  );

  if (fields.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full min-w-[720px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Trường dữ liệu</th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Giá trị cũ</th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Giá trị mới</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field} className="border-b border-slate-100 last:border-b-0">
              <td className="px-4 py-3 text-sm font-medium text-slate-900">
                {fieldLabels[field] ?? humanizeToken(field)}
              </td>
              <td className="px-4 py-3 text-sm">
                <span className="inline-flex max-w-full rounded-lg bg-rose-50 px-2 py-1 text-rose-700 line-through">
                  {formatValue(oldValues?.[field])}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                <span className="inline-flex max-w-full rounded-lg bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                  {formatValue(newValues?.[field])}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
