import React from "react";

export type BadgeVariant =
  | "emerald"
  | "amber"
  | "rose"
  | "blue"
  | "violet"
  | "indigo"
  | "sky"
  | "teal"
  | "cyan"
  | "slate";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  emerald: "bg-emerald-100 border-emerald-200 text-emerald-700",
  amber:   "bg-amber-100 border-amber-200 text-amber-700",
  rose:    "bg-rose-100 border-rose-200 text-rose-700",
  blue:    "bg-blue-100 border-blue-200 text-blue-700",
  violet:  "bg-violet-100 border-violet-200 text-violet-700",
  indigo:  "bg-indigo-100 border-indigo-200 text-indigo-700",
  sky:     "bg-sky-100 border-sky-200 text-sky-700",
  teal:    "bg-teal-100 border-teal-200 text-teal-700",
  cyan:    "bg-cyan-100 border-cyan-200 text-cyan-700",
  slate:   "bg-slate-100 border-slate-200 text-slate-600",
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  size?: "xs" | "sm";
  className?: string;
}

export function StatusBadge({ variant, label, size = "sm", className }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border font-medium ${
        size === "xs" ? "text-[10px]" : "text-xs"
      } ${VARIANT_CLASSES[variant]} ${className ?? ""}`}
    >
      {label}
    </span>
  );
}

// ─── Role badge helpers ───────────────────────────────────────

import { RoleName } from "@/types";

const ROLE_VARIANT: Record<string, BadgeVariant> = {
  [RoleName.ADMIN]:       "violet",
  [RoleName.CFO]:         "emerald",
  [RoleName.MANAGER]:     "blue",
  [RoleName.ACCOUNTANT]:  "indigo",
  [RoleName.TEAM_LEADER]: "teal",
  [RoleName.EMPLOYEE]:    "sky",
};

const ROLE_LABEL: Partial<Record<RoleName, string>> = {
  [RoleName.ADMIN]:       "Quản trị viên",
  [RoleName.CFO]:         "CFO",
  [RoleName.MANAGER]:     "Manager",
  [RoleName.ACCOUNTANT]:  "Kế toán",
  [RoleName.TEAM_LEADER]: "Team Leader",
  [RoleName.EMPLOYEE]:    "Nhân viên",
};

export function RoleBadge({ role, size }: { role: string; size?: "xs" | "sm" }) {
  const variant = ROLE_VARIANT[role] ?? "slate";
  const label = ROLE_LABEL[role as RoleName] ?? role;
  return <StatusBadge variant={variant} label={label} size={size} />;
}

// ─── Request status badge helpers ─────────────────────────────

import { RequestStatus } from "@/types";

const REQUEST_STATUS_VARIANT: Record<string, BadgeVariant> = {
  [RequestStatus.PENDING]:                         "amber",
  [RequestStatus.APPROVED_BY_TEAM_LEADER]:         "blue",
  [RequestStatus.PENDING_ACCOUNTANT_EXECUTION]:    "indigo",
  [RequestStatus.APPROVED_BY_MANAGER]:             "teal",
  [RequestStatus.APPROVED_BY_CFO]:                 "cyan",
  [RequestStatus.PAID]:                            "emerald",
  [RequestStatus.REJECTED]:                        "rose",
  [RequestStatus.CANCELLED]:                       "slate",
};

const REQUEST_STATUS_LABEL: Partial<Record<RequestStatus, string>> = {
  [RequestStatus.PENDING]:                         "Đang chờ",
  [RequestStatus.APPROVED_BY_TEAM_LEADER]:         "TL đã duyệt",
  [RequestStatus.PENDING_ACCOUNTANT_EXECUTION]:    "Chờ giải ngân",
  [RequestStatus.APPROVED_BY_MANAGER]:             "Manager đã duyệt",
  [RequestStatus.APPROVED_BY_CFO]:                 "CFO đã duyệt",
  [RequestStatus.PAID]:                            "Đã thanh toán",
  [RequestStatus.REJECTED]:                        "Từ chối",
  [RequestStatus.CANCELLED]:                       "Đã hủy",
};

export function RequestStatusBadge({ status, size }: { status: RequestStatus | string; size?: "xs" | "sm" }) {
  const variant = REQUEST_STATUS_VARIANT[status] ?? "slate";
  const label = REQUEST_STATUS_LABEL[status as RequestStatus] ?? status;
  return <StatusBadge variant={variant} label={label} size={size} />;
}
