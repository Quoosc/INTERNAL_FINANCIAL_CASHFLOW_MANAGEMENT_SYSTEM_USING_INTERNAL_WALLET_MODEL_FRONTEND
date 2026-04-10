"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ApiError, api } from "@/lib/api-client";
import {
  AdminApprovalListItem,
  CfoDashboardResponse,
  CompanyFundResponse,
  PaginatedResponse,
  RequestStatus,
} from "@/types";

// TODO: Replace when Sprint 6 is complete
const MOCK_DASHBOARD: CfoDashboardResponse = {
  companyFundBalance: 1_248_500_000,
  pendingApprovalsCount: 2,
  monthlyApprovedAmount: 500_000_000,
  monthlyRejectedCount: 1,
  recentApprovals: [
    {
      id: 20,
      requestCode: "REQ-2026-0060",
      departmentName: "Phong Cong nghe thong tin",
      amount: 200_000_000,
      status: RequestStatus.PENDING,
      createdAt: "2026-04-02T09:00:00",
    },
    {
      id: 21,
      requestCode: "REQ-2026-0055",
      departmentName: "Phong Kinh doanh",
      amount: 100_000_000,
      status: RequestStatus.PENDING,
      createdAt: "2026-04-01T11:00:00",
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

function getFundHealth(balance: number): {
  label: string;
  tone: string;
  borderTone: string;
  bgTone: string;
} {
  if (balance >= 500_000_000) {
    return {
      label: "HEALTHY",
      tone: "text-emerald-300",
      borderTone: "border-emerald-500/40",
      bgTone: "bg-emerald-500/10",
    };
  }
  if (balance >= 100_000_000) {
    return {
      label: "LOW",
      tone: "text-amber-300",
      borderTone: "border-amber-500/40",
      bgTone: "bg-amber-500/10",
    };
  }
  return {
    label: "CRITICAL",
    tone: "text-rose-300",
    borderTone: "border-rose-500/40",
    bgTone: "bg-rose-500/10",
  };
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

export function CfoDashboard() {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState<CfoDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        // TODO: Replace when Sprint 6 is complete — GET /api/v1/cfo/dashboard
        const res = await api.get<CfoDashboardResponse>("/api/v1/cfo/dashboard");
        if (cancelled) return;
        setDashboard(res.data);
      } catch (dashboardErr) {
        // Fallback: compose from existing endpoints
        try {
          const [fundRes, approvalsRes] = await Promise.all([
            api.get<CompanyFundResponse>("/api/v1/company-fund"),
            api.get<PaginatedResponse<AdminApprovalListItem> | AdminApprovalListItem[]>(
              "/api/v1/cfo/approvals?status=PENDING&page=1&limit=5"
            ),
          ]);

          if (cancelled) return;

          const items = Array.isArray(approvalsRes.data)
            ? approvalsRes.data
            : approvalsRes.data.items;

          const total = Array.isArray(approvalsRes.data)
            ? approvalsRes.data.length
            : approvalsRes.data.total;

          setDashboard({
            companyFundBalance: fundRes.data.currentWalletBalance,
            pendingApprovalsCount: total,
            monthlyApprovedAmount: 0,
            monthlyRejectedCount: 0,
            recentApprovals: items.slice(0, 5).map((item) => ({
              id: item.id,
              requestCode: item.requestCode,
              departmentName: item.department?.name ?? "-",
              amount: item.amount,
              status: item.status,
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

  const health = useMemo(
    () => getFundHealth(dashboard?.companyFundBalance ?? 0),
    [dashboard?.companyFundBalance]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý tài chính</h1>
          <p className="text-slate-400 mt-1">
            Xin chào, {user?.fullName ?? "CFO"} • {todayLabel}
          </p>
        </div>

        <span className="inline-flex w-fit px-3 py-1.5 rounded-full border border-violet-500/40 bg-violet-500/15 text-violet-300 text-sm font-medium">
          CFO
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, index) => (
            <div key={`cfo-stat-skeleton-${index}`} className="h-24 rounded-2xl bg-slate-800 animate-pulse" />
          ))
        ) : (
          <>
            <StatCard
              title="Số dư quỹ hệ thống"
              value={formatCurrency(dashboard?.companyFundBalance ?? 0)}
              href="/cfo/system-fund"
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
              title="Chờ duyệt cap quota"
              value={String(dashboard?.pendingApprovalsCount ?? 0)}
              href="/cfo/approvals"
              accent="text-rose-300"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-3-3v6m9 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />

            <StatCard
              title="Đã duyệt tháng này"
              value={formatCurrency(dashboard?.monthlyApprovedAmount ?? 0)}
              href="/cfo/approvals"
              accent="text-emerald-300"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />

            <StatCard
              title="Từ chối tháng này"
              value={String(dashboard?.monthlyRejectedCount ?? 0)}
              href="/cfo/approvals"
              accent="text-slate-300"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
          </>
        )}
      </div>

      {/* Main section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending approvals list */}
        <div className="lg:col-span-2 bg-slate-800 border border-white/10 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Yêu cầu chờ duyệt</h2>
            <Link href="/cfo/approvals" className="text-sm text-blue-300 hover:text-blue-200">
              Xem tất cả →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={`approval-skeleton-${index}`} className="h-20 rounded-xl bg-slate-900 animate-pulse" />
              ))}
            </div>
          ) : (dashboard?.recentApprovals.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-slate-900/40 p-8 text-center text-sm text-slate-500">
              Không có yêu cầu nào đang chờ duyệt.
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard?.recentApprovals.map((item) => (
                <Link
                  key={item.id}
                  href={`/cfo/approvals/${item.id}`}
                  className="block rounded-xl border border-white/10 bg-slate-900 p-3 hover:bg-slate-900/60 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.requestCode}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.departmentName}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-amber-300">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{formatRelativeTime(item.createdAt)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Company fund health */}
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 space-y-4">
          <h2 className="text-lg font-semibold text-white">Sức khỏe quỹ</h2>

          {loading ? (
            <div className="h-32 rounded-xl bg-slate-900 animate-pulse" />
          ) : (
            <>
              <div
                className={`rounded-xl border p-4 text-center space-y-1 ${health.borderTone} ${health.bgTone}`}
              >
                <p className={`text-xs font-semibold uppercase tracking-wide ${health.tone}`}>
                  {health.label}
                </p>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(dashboard?.companyFundBalance ?? 0)}
                </p>
                <p className="text-xs text-slate-400">Số dư COMPANY_FUND</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900 p-3 text-xs text-slate-400 space-y-1">
                <p>
                  <span className="text-emerald-300 font-medium">HEALTHY</span> — ≥ 500 triệu
                </p>
                <p>
                  <span className="text-amber-300 font-medium">LOW</span> — 100 → 500 triệu
                </p>
                <p>
                  <span className="text-rose-300 font-medium">CRITICAL</span> — dưới 100 triệu
                </p>
              </div>

              <Link
                href="/cfo/system-fund"
                className="block text-center px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors"
              >
                Xem chi tiết quỹ →
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-slate-800 border border-white/10 rounded-2xl p-4">
        <h2 className="text-lg font-semibold text-white">Truy cập nhanh</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <QuickLink href="/cfo/approvals" label="Duyệt cap quota" />
          <QuickLink href="/cfo/system-fund" label="Quỹ hệ thống" />
          <QuickLink href="/cfo/audit-logs" label="Nhật ký" />
          <QuickLink href="/cfo/settings" label="Cấu hình" />
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
