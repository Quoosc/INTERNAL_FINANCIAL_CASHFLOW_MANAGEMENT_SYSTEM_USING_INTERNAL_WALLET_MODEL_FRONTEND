"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ApiError, api } from "@/lib/api-client";
import {
  AdminDashboardResponse,
  AdminUserListItem,
  AuditLogResponse,
  CompanyFundResponse,
  DepartmentListItem,
  PaginatedResponse,
} from "@/types";

// TODO: Replace when Sprint 6 is complete
const MOCK_DASHBOARD: AdminDashboardResponse = {
  totalUsers: 64,
  totalDepartments: 8,
  totalWalletBalance: 2_450_000_000,
  recentAuditEvents: [
    {
      id: 1,
      actorName: "Admin System",
      action: "USER_CREATED",
      entityName: "users",
      createdAt: "2026-04-09T08:15:00",
    },
    {
      id: 2,
      actorName: "Admin System",
      action: "DEPARTMENT_UPDATED",
      entityName: "departments",
      createdAt: "2026-04-09T07:40:00",
    },
    {
      id: 3,
      actorName: "Admin Security",
      action: "CONFIG_UPDATED",
      entityName: "system_configs",
      createdAt: "2026-04-09T06:30:00",
    },
    {
      id: 4,
      actorName: "Admin HR",
      action: "USER_LOCKED",
      entityName: "users",
      createdAt: "2026-04-08T15:05:00",
    },
  ],
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));

  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} ngày trước`;
}

function pickItems<T>(payload: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(payload) ? payload : payload.items;
}

function getTotal<T>(payload: PaginatedResponse<T> | T[]): number {
  return Array.isArray(payload) ? payload.length : payload.total;
}

function StatCard({
  title,
  value,
  href,
  accent,
  icon,
}: {
  title: string;
  value: string;
  href: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="bg-slate-800 border border-white/10 rounded-2xl p-4 hover:bg-slate-700/40 hover:border-white/20 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">{title}</p>
          <p className={`text-xl font-bold mt-1 ${accent}`}>{value}</p>
        </div>
        <span className="w-9 h-9 rounded-xl bg-slate-900 border border-white/10 text-slate-300 flex items-center justify-center">
          {icon}
        </span>
      </div>
    </Link>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<AdminDashboardResponse>("/api/v1/admin/dashboard");
        if (cancelled) return;
        setDashboard(res.data);
      } catch (dashboardErr) {
        try {
          const [usersRes, departmentsRes, auditsRes, companyFundRes] = await Promise.all([
            api.get<PaginatedResponse<AdminUserListItem> | AdminUserListItem[]>(
              "/api/v1/admin/users?page=1&limit=1"
            ),
            api.get<PaginatedResponse<DepartmentListItem> | DepartmentListItem[]>(
              "/api/v1/admin/departments?page=1&limit=1"
            ),
            api.get<PaginatedResponse<AuditLogResponse> | AuditLogResponse[]>(
              "/api/v1/admin/audit?page=1&limit=5"
            ),
            api.get<CompanyFundResponse>("/api/v1/company-fund"),
          ]);

          if (cancelled) return;

          const audits = pickItems(auditsRes.data).slice(0, 5);

          setDashboard({
            totalUsers: getTotal(usersRes.data),
            totalDepartments: getTotal(departmentsRes.data),
            totalWalletBalance: companyFundRes.data.currentWalletBalance,
            recentAuditEvents: audits.map((item) => ({
              id: item.id,
              actorName: item.actorName,
              action: item.action,
              entityName: item.entityName,
              createdAt: item.createdAt,
            })),
          });
        } catch (composeErr) {
          if (cancelled) return;

          setDashboard(MOCK_DASHBOARD);

          if (dashboardErr instanceof ApiError) {
            setError(dashboardErr.apiMessage);
          } else if (composeErr instanceof ApiError) {
            setError(composeErr.apiMessage);
          } else {
            setError("Không thể tải dữ liệu API, đang hiển thị dữ liệu mẫu.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date()),
    []
  );

  const recentActivity = dashboard?.recentAuditEvents.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản trị hệ thống</h1>
          <p className="text-slate-400 mt-1">
            Xin chào, {user?.fullName ?? "Admin"} • {todayLabel}
          </p>
        </div>

        <span className="inline-flex w-fit px-3 py-1.5 rounded-full border border-blue-500/40 bg-blue-500/15 text-blue-300 text-sm font-medium">
          Admin
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, index) => (
            <div key={`admin-stat-skeleton-${index}`} className="h-24 rounded-2xl bg-slate-800 animate-pulse" />
          ))
        ) : (
          <>
            <StatCard
              title="Tổng người dùng"
              value={String(dashboard?.totalUsers ?? 0)}
              href="/admin/users"
              accent="text-blue-300"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"
                  />
                </svg>
              }
            />

            <StatCard
              title="Tổng phòng ban"
              value={String(dashboard?.totalDepartments ?? 0)}
              href="/admin/departments"
              accent="text-emerald-300"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
                  />
                </svg>
              }
            />

            <StatCard
              title="Số dư quỹ hệ thống"
              value={formatCurrency(dashboard?.totalWalletBalance ?? 0)}
              href="/admin/system-fund"
              accent="text-amber-300"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              }
            />

            <StatCard
              title="Hoạt động gần đây"
              value={String(recentActivity)}
              href="/admin/audit-logs"
              accent="text-violet-300"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-800 border border-white/10 rounded-2xl p-4 space-y-4">
          <h2 className="text-lg font-semibold text-white">Sức khỏe hệ thống</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-slate-900 p-3">
              <p className="text-xs text-slate-500">Người dùng / phòng ban</p>
              <p className="text-base font-semibold text-white mt-1">
                {dashboard && dashboard.totalDepartments > 0
                  ? (dashboard.totalUsers / dashboard.totalDepartments).toFixed(1)
                  : "0.0"}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-900 p-3">
              <p className="text-xs text-slate-500">Đăng nhập role</p>
              <p className="text-base font-semibold text-white mt-1">{user?.role ?? "ADMIN"}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-900 p-3">
              <p className="text-xs text-slate-500">Sự kiện gần đây</p>
              <p className="text-base font-semibold text-white mt-1">{recentActivity}</p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-300">
            Trạng thái hệ thống ổn định. Theo dõi nhật ký audit để kiểm soát thay đổi IAM và cấu hình.
          </div>
        </div>

        <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Audit gần đây</h2>
            <Link href="/admin/audit-logs" className="text-sm text-blue-300 hover:text-blue-200">
              Xem tất cả →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, index) => (
                <div key={`audit-skeleton-${index}`} className="h-16 rounded-xl bg-slate-900 animate-pulse" />
              ))}
            </div>
          ) : (dashboard?.recentAuditEvents.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-slate-900/40 p-8 text-center text-sm text-slate-500">
              Chưa có hoạt động audit.
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard?.recentAuditEvents.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-slate-900 p-3">
                  <p className="text-sm font-medium text-white">{item.action}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {item.actorName ?? "System"} • {item.entityName}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatRelativeTime(item.createdAt)} ({formatDateTime(item.createdAt)})
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-4">
        <h2 className="text-lg font-semibold text-white">Truy cập nhanh</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <QuickLink href="/admin/users" label="Nhân sự" />
          <QuickLink href="/admin/departments" label="Phòng ban" />
          <QuickLink href="/admin/audit-logs" label="Nhật ký" />
          <QuickLink href="/admin/settings" label="Cấu hình" />
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14m-7-7l7 7-7 7" />
      </svg>
      {label}
    </Link>
  );
}
