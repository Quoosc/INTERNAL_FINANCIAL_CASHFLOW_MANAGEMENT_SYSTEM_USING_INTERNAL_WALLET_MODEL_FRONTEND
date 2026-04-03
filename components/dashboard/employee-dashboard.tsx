"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/contexts/auth-context";
import {
  EmployeeDashboardResponse,
  RequestListItem,
  RequestType,
  RequestStatus,
} from "@/types";
// import { api } from "@/lib/api-client";
// import { PaginatedResponse } from "@/types";

// =============================================================
// Employee Dashboard Page
// API: GET /dashboard/employee  (Sprint 9 — chưa sẵn sàng)
//      GET /requests?status=PENDING_APPROVAL&limit=3  (Sprint 5)
// =============================================================

// ─── MOCK DATA (xóa khi backend sẵn sàng) ───────────────────
const MOCK_DASHBOARD: EmployeeDashboardResponse = {
  wallet: {
    balance: 15_500_000,
    pendingBalance: 2_300_000,
    debtBalance: 3_200_000,
  },
  pendingRequestsCount: 3,
  recentTransactions: [
    {
      id: 1,
      transactionCode: "TXN-8829145A",
      type: "REQUEST_PAYMENT",
      amount: 5_000_000,
      status: "COMPLETED",
      createdAt: "2026-03-28T14:30:00",
    },
    {
      id: 2,
      transactionCode: "TXN-7714209B",
      type: "PAYSLIP_PAYMENT",
      amount: 12_500_000,
      status: "COMPLETED",
      createdAt: "2026-03-25T09:00:00",
    },
    {
      id: 3,
      transactionCode: "TXN-6612034C",
      type: "WITHDRAW",
      amount: -2_000_000,
      status: "COMPLETED",
      createdAt: "2026-03-22T11:20:00",
    },
    {
      id: 4,
      transactionCode: "TXN-5501988D",
      type: "DEPOSIT",
      amount: 1_000_000,
      status: "COMPLETED",
      createdAt: "2026-03-20T16:45:00",
    },
    {
      id: 5,
      transactionCode: "TXN-4498771E",
      type: "REQUEST_PAYMENT",
      amount: 850_000,
      status: "COMPLETED",
      createdAt: "2026-03-18T10:05:00",
    },
  ],
  recentPayslip: {
    id: 7,
    payslipCode: "PS-2026-03",
    periodName: "Tháng 3/2026",
    finalNetSalary: 12_500_000,
    status: "PAID",
  },
};

const MOCK_PENDING_REQUESTS: RequestListItem[] = [
  {
    id: 101,
    requestCode: "REQ-IT-0326-001",
    type: RequestType.ADVANCE,
    status: RequestStatus.PENDING_APPROVAL,
    amount: 1_200_000,
    approvedAmount: null,
    description: "Tạm ứng chi phí đi công tác Đà Nẵng",
    rejectReason: null,
    projectId: 5,
    projectName: "Hệ thống quản lý nội bộ",
    phaseId: 12,
    phaseName: "Phase 2 - Development",
    categoryId: 3,
    categoryName: "Chi phí di chuyển",
    createdAt: "2026-04-01T09:15:00",
    updatedAt: "2026-04-01T09:15:00",
  },
  {
    id: 102,
    requestCode: "REQ-IT-0326-002",
    type: RequestType.EXPENSE,
    status: RequestStatus.PENDING_APPROVAL,
    amount: 450_000,
    approvedAmount: null,
    description: "Hoàn ứng mua văn phòng phẩm",
    rejectReason: null,
    projectId: 5,
    projectName: "Hệ thống quản lý nội bộ",
    phaseId: 12,
    phaseName: "Phase 2 - Development",
    categoryId: 7,
    categoryName: "Văn phòng phẩm",
    createdAt: "2026-03-31T14:30:00",
    updatedAt: "2026-03-31T14:30:00",
  },
  {
    id: 103,
    requestCode: "REQ-IT-0326-003",
    type: RequestType.REIMBURSE,
    status: RequestStatus.PENDING_ACCOUNTANT,
    amount: 850_000,
    approvedAmount: 850_000,
    description: "Hoàn tiền mua thiết bị văn phòng",
    rejectReason: null,
    projectId: 5,
    projectName: "Hệ thống quản lý nội bộ",
    phaseId: 11,
    phaseName: "Phase 1 - Planning",
    categoryId: 8,
    categoryName: "Thiết bị",
    createdAt: "2026-03-29T10:45:00",
    updatedAt: "2026-04-01T08:00:00",
  },
];

// Mock dữ liệu chi tiêu theo tháng (không có API riêng — tổng hợp từ transactions)
const MOCK_MONTHLY: { month: string; chiTieu: number; tamUng: number }[] = [
  { month: "T10/25", chiTieu: 3_500_000, tamUng: 2_800_000 },
  { month: "T11/25", chiTieu: 4_200_000, tamUng: 3_300_000 },
  { month: "T12/25", chiTieu: 6_100_000, tamUng: 5_200_000 },
  { month: "T1/26", chiTieu: 4_800_000, tamUng: 3_600_000 },
  { month: "T2/26", chiTieu: 5_500_000, tamUng: 4_300_000 },
  { month: "T3/26", chiTieu: 3_900_000, tamUng: 2_100_000 },
];
// ─────────────────────────────────────────────────────────────

// ─── Helpers ─────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffH = Math.floor(diffMs / 3_600_000);
  if (diffH < 1) return "Vừa xong";
  if (diffH < 24) return `${diffH} giờ trước`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Hôm qua";
  return `${diffD} ngày trước`;
}

const REQUEST_TYPE_CONFIG: Record<
  RequestType,
  { label: string; badgeCls: string }
> = {
  [RequestType.ADVANCE]: {
    label: "Tạm ứng",
    badgeCls: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  },
  [RequestType.EXPENSE]: {
    label: "Chi phí",
    badgeCls: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  },
  [RequestType.REIMBURSE]: {
    label: "Hoàn ứng",
    badgeCls: "bg-teal-500/20 text-teal-300 border border-teal-500/30",
  },
  [RequestType.PROJECT_TOPUP]: {
    label: "Nạp DA",
    badgeCls: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  },
  [RequestType.QUOTA_TOPUP]: {
    label: "Nạp Quota",
    badgeCls: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
  },
};

const REQUEST_STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; cls: string }
> = {
  [RequestStatus.PENDING_APPROVAL]: {
    label: "Chờ duyệt",
    cls: "text-amber-400",
  },
  [RequestStatus.PENDING_ACCOUNTANT]: {
    label: "Chờ giải ngân",
    cls: "text-blue-400",
  },
  [RequestStatus.APPROVED]: { label: "Đã duyệt", cls: "text-emerald-400" },
  [RequestStatus.PAID]: { label: "Đã chi", cls: "text-emerald-400" },
  [RequestStatus.REJECTED]: { label: "Từ chối", cls: "text-rose-400" },
  [RequestStatus.CANCELLED]: { label: "Đã hủy", cls: "text-slate-400" },
};

const TX_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> =
  {
    REQUEST_PAYMENT: {
      label: "Giải ngân yêu cầu",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    PAYSLIP_PAYMENT: {
      label: "Nhận lương",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    WITHDRAW: {
      label: "Rút tiền",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      ),
    },
    DEPOSIT: {
      label: "Nạp tiền",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V12m0 0V8m0 4h4m4 0h-4m4 0V8m0 4v4"
          />
        </svg>
      ),
    },
  };

// ─── Sub-components ───────────────────────────────────────────

function StatCard({
  title,
  value,
  sub,
  icon,
  gradient,
  iconBg,
  iconColor,
  tooltip,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  iconColor: string;
  tooltip?: string;
}) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div
      className={`bg-slate-800/60 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all ${gradient}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}
        >
          <span className={iconColor}>{icon}</span>
        </div>
        {tooltip && (
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowTip(true)}
              onMouseLeave={() => setShowTip(false)}
              className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs text-slate-400 hover:bg-white/20 transition-colors"
            >
              i
            </button>
            {showTip && (
              <div className="absolute right-0 top-7 w-56 bg-slate-900 border border-white/10 text-white text-xs rounded-lg p-3 z-20 shadow-xl">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      <p className="text-sm text-slate-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {subtitle && (
            <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export function EmployeeDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<EmployeeDashboardResponse | null>(null);
  const [pendingRequests, setPendingRequests] = useState<RequestListItem[]>([]);
  const [chartRange, setChartRange] = useState<3 | 6>(6);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        // ─── API CALL THẬT (bỏ comment khi backend Sprint 9 sẵn sàng) ──────
        // const [dashRes, reqRes] = await Promise.all([
        //   api.get<EmployeeDashboardResponse>("/api/v1/dashboard/employee"),
        //   api.get<PaginatedResponse<RequestListItem>>("/api/v1/requests", {
        //     params: { status: "PENDING_APPROVAL", limit: 3 },
        //   }),
        // ]);
        // setData(dashRes.data);
        // setPendingRequests(reqRes.data.items);
        // ─────────────────────────────────────────────────────────────────────

        // ─── MOCK DATA (xóa khi API sẵn sàng) ───────────────────────────────
        await new Promise((r) => setTimeout(r, 600)); // giả lập network delay
        setData(MOCK_DASHBOARD);
        setPendingRequests(MOCK_PENDING_REQUESTS);
        // ─────────────────────────────────────────────────────────────────────
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const chartData = MOCK_MONTHLY.slice(-chartRange);

  const availableBalance = data
    ? data.wallet.balance - data.wallet.pendingBalance
    : 0;

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
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
          <p className="text-slate-400 text-sm">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Xin chào, {user?.fullName || "Bạn"} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1 capitalize">{today}</p>
        </div>
        <Link
          href="/requests/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Tạo yêu cầu mới
        </Link>
      </div>

      {/* ── Section A: Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Số dư khả dụng"
          value={formatCurrency(availableBalance)}
          sub="Số dư hiện tại trừ tiền treo"
          gradient="hover:shadow-blue-500/10 hover:shadow-lg"
          iconBg="bg-blue-500/20"
          iconColor="text-blue-400"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          }
        />
        <StatCard
          title="Tiền treo"
          value={formatCurrency(data?.wallet.pendingBalance ?? 0)}
          sub="Đang chờ xử lý"
          gradient="hover:shadow-amber-500/10 hover:shadow-lg"
          iconBg="bg-amber-500/20"
          iconColor="text-amber-400"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Dư nợ tạm ứng"
          value={formatCurrency(data?.wallet.debtBalance ?? 0)}
          sub="Sẽ trừ vào lương tháng sau"
          gradient="hover:shadow-rose-500/10 hover:shadow-lg"
          iconBg="bg-rose-500/20"
          iconColor="text-rose-400"
          tooltip="Khoản tạm ứng chưa hoàn trả sẽ được khấu trừ tự động vào lương kỳ tiếp theo."
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
              />
            </svg>
          }
        />
        <StatCard
          title="Yêu cầu đang chờ"
          value={String(data?.pendingRequestsCount ?? 0).padStart(2, "0")}
          sub={
            data?.recentPayslip
              ? `Lương ${data.recentPayslip.periodName}: ${formatCurrency(data.recentPayslip.finalNetSalary)}`
              : "Chưa có phiếu lương"
          }
          gradient="hover:shadow-purple-500/10 hover:shadow-lg"
          iconBg="bg-purple-500/20"
          iconColor="text-purple-400"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
        />
      </div>

      {/* ── Section B: Charts + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Spending Bar Chart */}
        <SectionCard
          title="Chi tiêu theo tháng"
          subtitle="So sánh chi phí & tạm ứng"
          action={
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              {([3, 6] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setChartRange(n)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    chartRange === n
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {n} tháng
                </button>
              ))}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                  fontSize: "12px",
                }}
                formatter={(value, name) => {
                  const numericValue = typeof value === "number" ? value : 0;
                  const label = name === "chiTieu" ? "Chi phí" : "Tạm ứng";
                  return [formatCurrency(numericValue), label];
                }}
                labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: 16,
                  fontSize: 12,
                  color: "#94a3b8",
                }}
                formatter={(value) =>
                  value === "chiTieu" ? "Chi phí" : "Tạm ứng"
                }
                iconType="circle"
              />
              <Bar dataKey="chiTieu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tamUng" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Recent Transactions Activity Feed */}
        <SectionCard
          title="Hoạt động gần đây"
          subtitle="Giao dịch mới nhất"
          action={
            <Link
              href="/wallet/transactions"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Xem tất cả →
            </Link>
          }
        >
          <div className="space-y-3">
            {(data?.recentTransactions ?? []).map((tx) => {
              const isPositive = tx.amount > 0;
              const txInfo = TX_TYPE_LABELS[tx.type] ?? {
                label: tx.type,
                icon: null,
              };
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isPositive
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {txInfo.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {txInfo.label}
                      </p>
                      <p className="text-xs text-slate-500">
                        {timeAgo(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold shrink-0 ${
                      isPositive ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* ── Section C: Pending Requests + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Requests List */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Yêu cầu đang xử lý"
            subtitle="Cần theo dõi"
            action={
              <Link
                href="/requests"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Xem tất cả →
              </Link>
            }
          >
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="w-10 h-10 text-slate-600 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-slate-500 text-sm">
                  Không có yêu cầu nào đang chờ xử lý
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => {
                  const typeConf = REQUEST_TYPE_CONFIG[req.type];
                  const statusConf = REQUEST_STATUS_CONFIG[req.status];
                  return (
                    <Link
                      key={req.id}
                      href={`/requests/${req.id}`}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${typeConf.badgeCls}`}
                        >
                          {typeConf.label}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                            {req.description ?? req.requestCode}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {req.projectName} • {formatDate(req.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-white">
                          {formatCurrency(req.amount)}
                        </p>
                        <p
                          className={`text-xs font-medium mt-0.5 ${statusConf.cls}`}
                        >
                          {statusConf.label}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Quick Actions */}
        <SectionCard
          title="Thao tác nhanh"
          subtitle="Các chức năng thường dùng"
        >
          <div className="grid grid-cols-2 gap-3">
            <QuickAction
              href="/wallet/deposit"
              label="Nạp tiền"
              iconBg="bg-blue-500/20"
              iconColor="text-blue-400"
              hoverBorder="hover:border-blue-500/40"
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6v12m6-6H6"
                  />
                </svg>
              }
            />
            <QuickAction
              href="/wallet/withdraw"
              label="Rút tiền"
              iconBg="bg-emerald-500/20"
              iconColor="text-emerald-400"
              hoverBorder="hover:border-emerald-500/40"
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              }
            />
            <QuickAction
              href="/requests/new"
              label="Tạo yêu cầu"
              iconBg="bg-purple-500/20"
              iconColor="text-purple-400"
              hoverBorder="hover:border-purple-500/40"
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              }
            />
            <QuickAction
              href="/wallet/transactions"
              label="Lịch sử GD"
              iconBg="bg-amber-500/20"
              iconColor="text-amber-400"
              hoverBorder="hover:border-amber-500/40"
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              }
            />
            <QuickAction
              href="/payroll"
              label="Bảng lương"
              iconBg="bg-teal-500/20"
              iconColor="text-teal-400"
              hoverBorder="hover:border-teal-500/40"
              icon={
                <svg
                  className="w-6 h-6"
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
              }
            />
            <QuickAction
              href="/notifications"
              label="Thông báo"
              iconBg="bg-rose-500/20"
              iconColor="text-rose-400"
              hoverBorder="hover:border-rose-500/40"
              icon={
                <svg
                  className="w-6 h-6"
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
              }
            />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ─── Quick Action Button ──────────────────────────────────────

function QuickAction({
  href,
  label,
  icon,
  iconBg,
  iconColor,
  hoverBorder,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  hoverBorder: string;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border border-white/5 ${hoverBorder} hover:bg-white/5 transition-all group`}
    >
      <div
        className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center transition-all group-hover:scale-110`}
      >
        <span className={iconColor}>{icon}</span>
      </div>
      <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">
        {label}
      </span>
    </Link>
  );
}
