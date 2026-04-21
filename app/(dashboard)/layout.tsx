"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getUnreadCount } from "@/lib/api";
import { RoleName } from "@/types";
import { AuthProvider } from "@/contexts/auth-context";
import { WalletProvider } from "@/contexts/wallet-context";
import { ToastProvider } from "@/contexts/toast-context";
import { ToastStack } from "@/components/ui/toast";
import { Header } from "@/components/layout/header";
import { ErrorBoundary } from "@/components/ui/error-boundary";

// =============================================================
// Dashboard Layout — Sidebar role-aware + Header + Providers
//
// Cấu trúc menu theo role:
//   EMPLOYEE     → Dashboard, Wallet, Requests(my), Payroll(payslips), Projects, Notifications
//   TEAM_LEADER  → Dashboard, Wallet, TL-Approvals, TL-Projects, TL-Team, Notifications
//   MANAGER      → Dashboard, Wallet, Mgr-Approvals, Mgr-Projects, Mgr-Department, Notifications
//   ACCOUNTANT   → Dashboard, Wallet, Disbursements, Acc-Payroll, Ledger, System Fund, Notifications
//   ADMIN        → Dashboard, Wallet, Users, Departments, System Fund,
//                  Settings, Audit Logs, Notifications
// =============================================================

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

// ─── Shared icons helper ──────────────────────────────────────

const icons = {
  dashboard: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  wallet: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  ),
  requests: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  payroll: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
  projects: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  ),
  notifications: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  ),
  approvals: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  team: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  department: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  ),
  disbursements: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  ledger: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  ),
  users: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  profile: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  systemFund: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
      />
    </svg>
  ),
  settings: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  auditLogs: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      />
    </svg>
  ),
};

// ─── Role-specific nav configs ────────────────────────────────

interface NavGroup {
  label: string;
  items: NavItem[];
}

function getNavGroups(role: RoleName | undefined): NavGroup[] {
  const shared: NavItem[] = [
    { label: "Tổng quan", href: "/dashboard", icon: icons.dashboard },
    { label: "Ví của tôi", href: "/wallet", icon: icons.wallet },
    { label: "Hồ sơ cá nhân", href: "/profile", icon: icons.profile },
  ];
  const notifications: NavItem = {
    label: "Thông báo",
    href: "/notifications",
    icon: icons.notifications,
  };

  switch (role) {
    case RoleName.EMPLOYEE:
      return [
        {
          label: "Menu chính",
          items: [
            ...shared,
            {
              label: "Yêu cầu của tôi",
              href: "/requests",
              icon: icons.requests,
            },
            { label: "Phiếu lương", href: "/payroll", icon: icons.payroll },
            { label: "Dự án", href: "/projects", icon: icons.projects },
            notifications,
          ],
        },
      ];

    case RoleName.TEAM_LEADER:
      return [
        {
          label: "Menu chính",
          items: [...shared, notifications],
        },
        {
          label: "Team Leader",
          items: [
            {
              label: "Duyệt yêu cầu",
              href: "/team-leader/approvals",
              icon: icons.approvals,
            },
            {
              label: "Dự án",
              href: "/team-leader/projects",
              icon: icons.projects,
            },
            {
              label: "Nhóm của tôi",
              href: "/team-leader/team",
              icon: icons.team,
            },
          ],
        },
        {
          label: "Cá nhân",
          items: [
            {
              label: "Yêu cầu của tôi",
              href: "/requests",
              icon: icons.requests,
            },
            { label: "Phiếu lương", href: "/payroll", icon: icons.payroll },
          ],
        },
      ];

    case RoleName.MANAGER:
      return [
        {
          label: "Menu chính",
          items: [...shared, notifications],
        },
        {
          label: "Manager",
          items: [
            {
              label: "Duyệt nạp quỹ DA",
              href: "/manager/approvals",
              icon: icons.approvals,
            },
            { label: "Dự án", href: "/manager/projects", icon: icons.projects },
            {
              label: "Phòng ban",
              href: "/manager/department",
              icon: icons.department,
            },
          ],
        },
        {
          label: "Cá nhân",
          items: [
            {
              label: "Yêu cầu của tôi",
              href: "/requests",
              icon: icons.requests,
            },
            { label: "Phiếu lương", href: "/payroll", icon: icons.payroll },
          ],
        },
      ];

    case RoleName.ACCOUNTANT:
      return [
        {
          label: "Menu chính",
          items: [...shared, notifications],
        },
        {
          label: "Kế toán",
          items: [
            {
              label: "Giải ngân",
              href: "/accountant/disbursements",
              icon: icons.disbursements,
            },
            {
              label: "Bảng lương",
              href: "/accountant/payroll",
              icon: icons.payroll,
            },
            { label: "Sổ cái", href: "/accountant/ledger", icon: icons.ledger },
            {
              label: "Yeu cau rut tien",
              href: "/accountant/withdrawals",
              icon: icons.wallet,
            },
            {
              label: "Quỹ hệ thống",
              href: "/admin/system-fund",
              icon: icons.systemFund,
            },
          ],
        },
        {
          label: "Cá nhân",
          items: [
            { label: "Phiếu lương", href: "/payroll", icon: icons.payroll },
          ],
        },
      ];

    case RoleName.ADMIN:
      return [
        {
          label: "Menu chính",
          items: [...shared, notifications],
        },
        {
          label: "Quản trị",
          items: [
            { label: "Nhân sự", href: "/admin/users", icon: icons.users },
            {
              label: "Phòng ban",
              href: "/admin/departments",
              icon: icons.department,
            },
            {
              label: "Quỹ hệ thống",
              href: "/admin/system-fund",
              icon: icons.systemFund,
            },
            {
              label: "Cấu hình",
              href: "/admin/settings",
              icon: icons.settings,
            },
            {
              label: "Nhật ký hệ thống",
              href: "/admin/audit-logs",
              icon: icons.auditLogs,
            },
          ],
        },
      ];

    case RoleName.CFO:
      return [
        {
          label: "Menu chính",
          items: [...shared, notifications],
        },
        {
          label: "CFO",
          items: [
            {
              label: "Duyệt ngân sách PB",
              href: "/cfo/approvals",
              icon: icons.approvals,
            },
            {
              label: "Quỹ hệ thống",
              href: "/cfo/system-fund",
              icon: icons.systemFund,
            },
            { label: "Cấu hình", href: "/cfo/settings", icon: icons.settings },
            {
              label: "Nhật ký hệ thống",
              href: "/cfo/audit-logs",
              icon: icons.auditLogs,
            },
          ],
        },
      ];

    default:
      // Fallback: chỉ shared items (khi role chưa load)
      return [{ label: "Menu chính", items: [...shared, notifications] }];
  }
}

// ─── Sidebar ──────────────────────────────────────────────────

const ROLE_ACCENT: Record<string, { bg: string; text: string; bar: string; hover: string }> = {
  [RoleName.ADMIN]:        { bg: "bg-violet-50", text: "text-violet-700", bar: "bg-violet-600", hover: "hover:bg-violet-50" },
  [RoleName.CFO]:          { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-600", hover: "hover:bg-emerald-50" },
  [RoleName.MANAGER]:      { bg: "bg-indigo-50", text: "text-indigo-700", bar: "bg-indigo-600", hover: "hover:bg-indigo-50" },
  [RoleName.ACCOUNTANT]:   { bg: "bg-indigo-50", text: "text-indigo-700", bar: "bg-indigo-600", hover: "hover:bg-indigo-50" },
  [RoleName.TEAM_LEADER]:  { bg: "bg-teal-50", text: "text-teal-700", bar: "bg-teal-600", hover: "hover:bg-teal-50" },
  [RoleName.EMPLOYEE]:     { bg: "bg-blue-50", text: "text-blue-700", bar: "bg-blue-600", hover: "hover:bg-blue-50" },
};

const ROLE_LABELS: Partial<Record<RoleName, string>> = {
  [RoleName.EMPLOYEE]: "Nhân viên",
  [RoleName.TEAM_LEADER]: "Team Leader",
  [RoleName.MANAGER]: "Manager",
  [RoleName.ACCOUNTANT]: "Kế toán",
  [RoleName.CFO]: "CFO",
  [RoleName.ADMIN]: "Quản trị viên",
};

function Sidebar({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const accent = ROLE_ACCENT[user?.role ?? ""] ?? ROLE_ACCENT[RoleName.EMPLOYEE];

  const refreshUnreadCount = React.useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(Math.max(0, res.data));
    } catch {
      // keep previous count when API temporarily fails
    }
  }, []);

  React.useEffect(() => {
    void refreshUnreadCount();

    const intervalId = window.setInterval(() => {
      void refreshUnreadCount();
    }, 60000);

    const onNotificationsChanged = () => {
      void refreshUnreadCount();
    };

    window.addEventListener("notifications:changed", onNotificationsChanged);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(
        "notifications:changed",
        onNotificationsChanged,
      );
    };
  }, [refreshUnreadCount]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const navGroups = getNavGroups(user?.role as RoleName | undefined);

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 shadow-sm flex flex-col z-50 transition-all duration-200 ${isCollapsed ? "w-[68px]" : "w-64"}`}
      >
        {/* Logo + toggle */}
        <div className={`border-b border-slate-200 flex items-center ${isCollapsed ? "p-3 justify-center flex-col gap-2" : "p-4 gap-3"}`}>
          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="text-slate-900 font-bold text-sm truncate">IFMS Finance</h2>
              <p className="text-slate-400 text-xs truncate">Internal Wallet</p>
            </div>
          )}
          <button
            type="button"
            onClick={onToggle}
            title={isCollapsed ? "Mở rộng sidebar" : "Thu nhỏ sidebar"}
            className={`shrink-0 w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors ${isCollapsed ? "" : "ml-auto"}`}
          >
            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!isCollapsed && (
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5 px-3">
                  {group.label}
                </p>
              )}
              {isCollapsed && <div className="my-1 border-t border-slate-100" />}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={`relative flex items-center rounded-lg text-sm font-medium transition-all duration-150 ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"} ${
                        active
                          ? `${accent.bg} ${accent.text}`
                          : `text-slate-600 hover:text-slate-900 ${accent.hover}`
                      }`}
                    >
                      {active && (
                        <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 ${accent.bar} rounded-r-full`} />
                      )}
                      {item.icon}
                      {!isCollapsed && (
                        <span className="flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.href === "/notifications" && unreadCount > 0 && (
                            <span className="inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-rose-500 text-white text-[11px] font-semibold leading-none">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </span>
                      )}
                      {isCollapsed && item.href === "/notifications" && unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Info */}
        <div className={`border-t border-slate-200 ${isCollapsed ? "p-2" : "p-4"}`}>
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
              <span className="text-white font-semibold text-sm">
                {user?.fullName?.charAt(0)?.toUpperCase() ?? "U"}
              </span>
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{user?.fullName ?? "User"}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {user?.role ? (ROLE_LABELS[user.role as RoleName] ?? user.role) : "—"}
                  </p>
                </div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1 shrink-0"
                  title="Đăng xuất"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Logout confirm dialog */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 w-80 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Đăng xuất khỏi hệ thống?</h3>
                <p className="text-xs text-slate-500 mt-1">Bạn sẽ được chuyển về trang đăng nhập.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(false); logout(); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Inner Layout ─────────────────────────────────────────────

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-blue-500"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-slate-500 text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed((prev) => !prev)} />
      <ToastStack />
      <div className="flex flex-col min-h-screen transition-all duration-200" style={{ marginLeft: isCollapsed ? 68 : 256 }}>
        <Header />
        <main className="flex-1 p-6">
          <ErrorBoundary>
            <React.Suspense
              fallback={
                <div className="text-slate-500 text-sm">
                  Đang tải dữ liệu trang...
                </div>
              }
            >
              {children}
            </React.Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

// ─── Export with Providers ────────────────────────────────────

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <WalletProvider>
        <ToastProvider>
          <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </ToastProvider>
      </WalletProvider>
    </AuthProvider>
  );
}
