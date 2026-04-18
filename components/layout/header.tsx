"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getUnreadCount } from "@/lib/api";

// ─── Breadcrumb mapping ───────────────────────────────────────

const BREADCRUMB_MAP: Record<string, string[]> = {
  "/dashboard":                    ["Tổng quan"],
  "/wallet":                       ["Ví của tôi"],
  "/wallet/deposit":               ["Ví của tôi", "Nạp tiền"],
  "/wallet/withdraw":              ["Ví của tôi", "Rút tiền"],
  "/wallet/transactions":          ["Ví của tôi", "Lịch sử giao dịch"],
  "/notifications":                ["Thông báo"],
  "/requests":                     ["Yêu cầu của tôi"],
  "/requests/new":                 ["Yêu cầu của tôi", "Tạo mới"],
  "/payroll":                      ["Phiếu lương"],
  "/projects":                     ["Dự án"],
  "/profile":                      ["Hồ sơ cá nhân"],
  "/team-leader/approvals":        ["Team Leader", "Duyệt yêu cầu"],
  "/team-leader/projects":         ["Team Leader", "Dự án"],
  "/team-leader/team":             ["Team Leader", "Nhóm"],
  "/manager/approvals":            ["Manager", "Duyệt nạp quỹ"],
  "/manager/projects":             ["Manager", "Dự án"],
  "/manager/department":           ["Manager", "Phòng ban"],
  "/accountant/disbursements":     ["Kế toán", "Giải ngân"],
  "/accountant/payroll":           ["Kế toán", "Bảng lương"],
  "/accountant/ledger":            ["Kế toán", "Sổ cái"],
  "/accountant/withdrawals":       ["Kế toán", "Rút tiền"],
  "/admin/users":                  ["Quản trị", "Nhân sự"],
  "/admin/departments":            ["Quản trị", "Phòng ban"],
  "/admin/system-fund":            ["Quản trị", "Quỹ hệ thống"],
  "/admin/settings":               ["Quản trị", "Cấu hình"],
  "/admin/audit-logs":             ["Quản trị", "Nhật ký hệ thống"],
  "/admin/roles":                  ["Quản trị", "Phân quyền"],
  "/admin/approvals":              ["Quản trị", "Duyệt ngân sách"],
  "/cfo/approvals":                ["CFO", "Duyệt ngân sách"],
  "/cfo/system-fund":              ["CFO", "Quỹ hệ thống"],
};

function getBreadcrumbs(pathname: string): string[] {
  // Exact match first
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname];

  // Dynamic segment: /requests/123, /payroll/456, etc.
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 2) {
    // Try parent path
    const parentPath = "/" + segments.slice(0, -1).join("/");
    const parentCrumbs = BREADCRUMB_MAP[parentPath];
    if (parentCrumbs) return [...parentCrumbs, "Chi tiết"];

    // Two-level role prefix: /team-leader/projects/123
    if (segments.length >= 3) {
      const grandparentPath = "/" + segments.slice(0, -2).join("/") + "/" + segments[segments.length - 2];
      const grandparentCrumbs = BREADCRUMB_MAP[grandparentPath];
      if (grandparentCrumbs) return [...grandparentCrumbs, "Chi tiết"];
    }
  }

  return ["Tổng quan"];
}

// ─── Inline SVG icons ─────────────────────────────────────────

function BellIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ─── Header component ─────────────────────────────────────────

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = React.useState(0);

  const breadcrumbs = getBreadcrumbs(pathname);
  const initials = user?.fullName?.charAt(0)?.toUpperCase() ?? "U";

  React.useEffect(() => {
    let mounted = true;

    async function fetchCount() {
      try {
        const res = await getUnreadCount();
        if (mounted) setUnreadCount(Math.max(0, res.data));
      } catch {
        // ignore
      }
    }

    void fetchCount();
    const id = window.setInterval(() => void fetchCount(), 60_000);
    const onChanged = () => void fetchCount();
    window.addEventListener("notifications:changed", onChanged);

    return () => {
      mounted = false;
      window.clearInterval(id);
      window.removeEventListener("notifications:changed", onChanged);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRightIcon />}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? "font-semibold text-slate-900"
                    : "text-slate-500"
                }
              >
                {crumb}
              </span>
            </div>
          ))}
        </nav>

        {/* Right: Bell + User */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <Link
            href="/notifications"
            className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </Link>

          {/* Divider */}
          <div className="w-px h-7 bg-slate-200" />

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-slate-900 leading-tight">
                {user?.fullName ?? "—"}
              </p>
              <p className="text-xs text-slate-400 leading-tight mt-0.5">
                {user?.departmentName ?? user?.role ?? "—"}
              </p>
            </div>
            <div className="w-9 h-9 bg-linear-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
