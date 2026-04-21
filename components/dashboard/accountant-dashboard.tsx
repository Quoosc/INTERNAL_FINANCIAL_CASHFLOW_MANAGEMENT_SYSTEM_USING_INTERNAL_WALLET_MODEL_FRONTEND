"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/contexts/auth-context";
import { ApiError, api } from "@/lib/api-client";
import {
  AccountantDashboardResponse,
  DisbursementListItem,
  PaginatedResponse,
  PayrollPeriodListItem,
  PayrollStatus,
  RequestType,
  RoleName,
} from "@/types";

type FundHealth = "HEALTHY" | "LOW" | "CRITICAL";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

function pickItems<T>(payload: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(payload) ? payload : payload.items;
}

function getRequestTypeLabel(type: RequestType): string {
  switch (type) {
    case RequestType.ADVANCE:
      return "Tạm ứng";
    case RequestType.EXPENSE:
      return "Chi phí";
    case RequestType.REIMBURSE:
      return "Hoàn ứng";
    default:
      return type;
  }
}

function getRequestTypeClass(type: RequestType): string {
  switch (type) {
    case RequestType.ADVANCE:
      return "bg-violet-100 border-violet-200 text-violet-700";
    case RequestType.EXPENSE:
      return "bg-sky-100 border-sky-200 text-sky-700";
    case RequestType.REIMBURSE:
      return "bg-amber-100 border-amber-200 text-amber-700";
    default:
      return "bg-slate-100 border-slate-200 text-slate-600";
  }
}

function getPayrollStatusLabel(status: PayrollStatus | null): string {
  switch (status) {
    case PayrollStatus.DRAFT:
      return "Nháp";
    case PayrollStatus.PROCESSING:
      return "Đang xử lý";
    case PayrollStatus.COMPLETED:
      return "Hoàn tất";
    default:
      return "Chưa có kỳ lương";
  }
}

function getPayrollStatusClass(status: PayrollStatus | null): string {
  switch (status) {
    case PayrollStatus.DRAFT:
      return "bg-slate-100 border-slate-200 text-slate-600";
    case PayrollStatus.PROCESSING:
      return "bg-amber-100 border-amber-200 text-amber-700";
    case PayrollStatus.COMPLETED:
      return "bg-emerald-100 border-emerald-200 text-emerald-700";
    default:
      return "bg-slate-500/10 border-slate-500/20 text-slate-500";
  }
}

function parsePayrollStatus(value: string | null): PayrollStatus | null {
  if (!value) return null;
  if (value === PayrollStatus.DRAFT) return PayrollStatus.DRAFT;
  if (value === PayrollStatus.PROCESSING) return PayrollStatus.PROCESSING;
  if (value === PayrollStatus.COMPLETED) return PayrollStatus.COMPLETED;
  return null;
}

function getFundHealth(balance: number): FundHealth {
  if (balance >= 500_000_000) return "HEALTHY";
  if (balance >= 100_000_000) return "LOW";
  return "CRITICAL";
}

function getFundHealthClass(health: FundHealth): string {
  switch (health) {
    case "HEALTHY":
      return "bg-emerald-100 border-emerald-200 text-emerald-700";
    case "LOW":
      return "bg-amber-100 border-amber-200 text-amber-700";
    case "CRITICAL":
      return "bg-rose-100 border-rose-200 text-rose-700";
    default:
      return "bg-slate-100 border-slate-200 text-slate-600";
  }
}

function getFundProgress(balance: number): number {
  const safe = Math.max(0, balance);
  return Math.min(100, Math.round((safe / 1_500_000_000) * 100));
}

type PeriodKey = "ytd" | "last6m" | "fy2025";

interface CashFlowPoint {
  label: string;
  inflow: number;
  outflow: number;
}

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "ytd", label: "Năm 2026" },
  { key: "last6m", label: "6 tháng" },
  { key: "fy2025", label: "Năm 2025" },
];

// mock chart data — replace when analytics API is available
const CASHFLOW: Record<PeriodKey, CashFlowPoint[]> = {
  ytd: [
    { label: "T1", inflow: 280, outflow: 145 },
    { label: "T2", inflow: 310, outflow: 162 },
    { label: "T3", inflow: 295, outflow: 178 },
    { label: "T4", inflow: 320, outflow: 188 },
  ],
  last6m: [
    { label: "T11/25", inflow: 240, outflow: 130 },
    { label: "T12/25", inflow: 290, outflow: 155 },
    { label: "T1/26",  inflow: 280, outflow: 145 },
    { label: "T2/26",  inflow: 310, outflow: 162 },
    { label: "T3/26",  inflow: 295, outflow: 178 },
    { label: "T4/26",  inflow: 320, outflow: 188 },
  ],
  fy2025: [
    { label: "T1",  inflow: 195, outflow: 112 },
    { label: "T2",  inflow: 210, outflow: 118 },
    { label: "T3",  inflow: 225, outflow: 130 },
    { label: "T4",  inflow: 240, outflow: 138 },
    { label: "T5",  inflow: 255, outflow: 147 },
    { label: "T6",  inflow: 270, outflow: 155 },
    { label: "T7",  inflow: 260, outflow: 150 },
    { label: "T8",  inflow: 248, outflow: 143 },
    { label: "T9",  inflow: 265, outflow: 152 },
    { label: "T10", inflow: 275, outflow: 158 },
    { label: "T11", inflow: 240, outflow: 130 },
    { label: "T12", inflow: 290, outflow: 155 },
  ],
};

function fmtM(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}B`;
  return `${v}M`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function CashFlowTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const inflow = (payload as any[])[0]?.value ?? 0;
  const outflow = (payload as any[])[1]?.value ?? 0;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-emerald-600">Vào: {fmtM(inflow)}</p>
      <p className="text-rose-600">Ra: {fmtM(outflow)}</p>
    </div>
  );
}

const MOCK_DASHBOARD: AccountantDashboardResponse = {
  systemFundBalance: 1_248_500_000,
  pendingDisbursementsCount: 4,
  monthlyInflow: 320_000_000,
  monthlyOutflow: 187_500_000,
  payrollStatus: {
    latestPeriod: "Tháng 03/2026",
    status: PayrollStatus.COMPLETED,
  },
};

// TODO: Replace when Sprint 6-7 is complete
const MOCK_PENDING_DISBURSEMENTS: DisbursementListItem[] = [
  {
    id: 1,
    requestCode: "REQ-2026-0041",
    type: RequestType.ADVANCE,
    status: "PENDING_ACCOUNTANT_EXECUTION",
    amount: 3_500_000,
    approvedAmount: 3_500_000,
    description: "Mua vật tư thiết bị cho phase 1.",
    requester: {
      id: 11,
      fullName: "Đỗ Quốc Bảo",
      avatar: null,
      employeeCode: "EMP001",
      jobTitle: "Frontend Developer",
      departmentName: "Phòng IT",
      bankName: "Vietcombank",
      bankAccountNum: "001100220011",
      bankAccountOwner: "DO QUOC BAO",
    },
    project: {
      id: 1,
      projectCode: "PRJ-IT-001",
      name: "Hệ thống quản lý nội bộ",
    },
    phase: {
      id: 1,
      phaseCode: "PH-001",
      name: "Phase 1 - Phân tích",
    },
    attachments: [],
    createdAt: "2026-04-03T09:15:00",
  },
  {
    id: 2,
    requestCode: "REQ-2026-0042",
    type: RequestType.EXPENSE,
    status: "PENDING_ACCOUNTANT_EXECUTION",
    amount: 850_000,
    approvedAmount: 850_000,
    description: "Chi phí mua license công cụ.",
    requester: {
      id: 12,
      fullName: "Vũ Thị Lan",
      avatar: null,
      employeeCode: "EMP002",
      jobTitle: "Backend Developer",
      departmentName: "Phòng IT",
      bankName: "BIDV",
      bankAccountNum: "102030405060",
      bankAccountOwner: "VU THI LAN",
    },
    project: {
      id: 1,
      projectCode: "PRJ-IT-001",
      name: "Hệ thống quản lý nội bộ",
    },
    phase: {
      id: 1,
      phaseCode: "PH-001",
      name: "Phase 1 - Phân tích",
    },
    attachments: [],
    createdAt: "2026-04-02T14:30:00",
  },
  {
    id: 3,
    requestCode: "REQ-2026-0038",
    type: RequestType.REIMBURSE,
    status: "PENDING_ACCOUNTANT_EXECUTION",
    amount: 1_200_000,
    approvedAmount: 1_200_000,
    description: "Hoàn ứng chi phí QA.",
    requester: {
      id: 13,
      fullName: "Phạm Văn Đức",
      avatar: null,
      employeeCode: "EMP003",
      jobTitle: "QA Engineer",
      departmentName: "Phòng IT",
      bankName: "Techcombank",
      bankAccountNum: "778899665544",
      bankAccountOwner: "PHAM VAN DUC",
    },
    project: {
      id: 2,
      projectCode: "PRJ-IT-002",
      name: "Nâng cấp hạ tầng mạng",
    },
    phase: {
      id: 4,
      phaseCode: "PH-004",
      name: "Phase 1 - Triển khai",
    },
    attachments: [],
    createdAt: "2026-04-01T10:00:00",
  },
];

// TODO: Replace when Sprint 7 is complete
const MOCK_PAYROLL_PERIODS: PayrollPeriodListItem[] = [
  {
    id: 5,
    periodCode: "PR-2026-03",
    name: "Lương tháng 03/2026",
    month: 3,
    year: 2026,
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    status: PayrollStatus.COMPLETED,
    employeeCount: 12,
    totalNetPayroll: 162_500_000,
    createdAt: "2026-03-28T08:00:00",
    updatedAt: "2026-04-02T17:00:00",
  },
];

export function AccountantDashboard() {
  const { user, hasRole } = useAuth();

  const [dashboard, setDashboard] =
    useState<AccountantDashboardResponse | null>(null);
  const [pendingDisbursements, setPendingDisbursements] = useState<
    DisbursementListItem[]
  >([]);
  const [latestPayroll, setLatestPayroll] =
    useState<PayrollPeriodListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodKey>("last6m");

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      const dashboardReq = api.get<AccountantDashboardResponse>(
        "/api/v1/dashboard/accountant",
      );
      const disbursementsReq = api.get<
        PaginatedResponse<DisbursementListItem> | DisbursementListItem[]
      >(
        "/api/v1/accountant/disbursements?limit=3&status=PENDING_ACCOUNTANT_EXECUTION",
      );
      const payrollReq = api.get<
        PaginatedResponse<PayrollPeriodListItem> | PayrollPeriodListItem[]
      >("/api/v1/accountant/payroll?limit=1");

      const [dashboardResult, disbursementsResult, payrollResult] =
        await Promise.allSettled([dashboardReq, disbursementsReq, payrollReq]);

      if (cancelled) return;

      let nextDashboard = MOCK_DASHBOARD;
      let nextDisbursements = MOCK_PENDING_DISBURSEMENTS;
      let nextPayroll = MOCK_PAYROLL_PERIODS[0] ?? null;
      let nextError: string | null = null;

      if (dashboardResult.status === "fulfilled") {
        nextDashboard = dashboardResult.value.data;
      } else if (dashboardResult.reason instanceof ApiError) {
        nextError = dashboardResult.reason.apiMessage;
      }

      if (disbursementsResult.status === "fulfilled") {
        nextDisbursements = pickItems(disbursementsResult.value.data)
          .filter((item) => item.status === "PENDING_ACCOUNTANT_EXECUTION")
          .slice(0, 3);
      } else if (!nextError && disbursementsResult.reason instanceof ApiError) {
        nextError = disbursementsResult.reason.apiMessage;
      }

      if (payrollResult.status === "fulfilled") {
        const periods = pickItems(payrollResult.value.data);
        nextPayroll = periods[0] ?? null;
      } else if (!nextError && payrollResult.reason instanceof ApiError) {
        nextError = payrollResult.reason.apiMessage;
      }

      if (
        !nextError &&
        (dashboardResult.status === "rejected" ||
          disbursementsResult.status === "rejected" ||
          payrollResult.status === "rejected")
      ) {
        nextError =
          "Không thể tải đầy đủ dữ liệu API, đang hiển thị dữ liệu mẫu.";
      }

      setDashboard(nextDashboard);
      setPendingDisbursements(nextDisbursements);
      setLatestPayroll(nextPayroll);
      setError(nextError);
      setLoading(false);
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const fundBalance = dashboard?.systemFundBalance ?? 0;
  const health = getFundHealth(fundBalance);
  const fundProgress = getFundProgress(fundBalance);

  const payrollStatus = useMemo(() => {
    if (latestPayroll) return latestPayroll.status;
    return parsePayrollStatus(dashboard?.payrollStatus.status ?? null);
  }, [dashboard?.payrollStatus.status, latestPayroll]);

  const payrollPeriodLabel = latestPayroll
    ? `${String(latestPayroll.month).padStart(2, "0")}/${latestPayroll.year}`
    : (dashboard?.payrollStatus.latestPeriod ?? "Chưa có dữ liệu");

  const monthlyNetFlow =
    (dashboard?.monthlyInflow ?? 0) - (dashboard?.monthlyOutflow ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Bảng điều khiển Kế toán
          </h1>
          <p className="text-slate-500 mt-1">
            Theo dõi giải ngân Flow 1, bảng lương và sổ cái hệ thống.
          </p>
        </div>
        <span className="inline-flex w-fit px-3 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-100 text-cyan-700 text-sm font-medium">
          {hasRole(RoleName.ACCOUNTANT)
            ? "Kế toán"
            : (user?.role ?? "ACCOUNTANT")}
        </span>
      </div>

      <div className="bg-linear-to-br from-cyan-100 via-blue-100 to-blue-50 border border-cyan-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/80">
              System Fund
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {formatCurrency(fundBalance)}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Sức khỏe quỹ hệ thống theo ngưỡng vận hành.
            </p>
          </div>

          <span
            className={`inline-flex px-3 py-1.5 rounded-full border text-sm font-semibold ${getFundHealthClass(health)}`}
          >
            {health}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Mức quỹ hiện tại</span>
            <span>{fundProgress}%</span>
          </div>
          <div className="h-3 rounded-full bg-white border border-slate-200 overflow-hidden">
            <div
              className={`h-full ${
                health === "HEALTHY"
                  ? "bg-emerald-500"
                  : health === "LOW"
                    ? "bg-amber-500"
                    : "bg-rose-500"
              }`}
              style={{ width: `${fundProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/accountant/disbursements"
          className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 hover:shadow-md hover:border-slate-300 transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Chờ giải ngân</p>
              <p className="text-3xl font-bold text-amber-700 mt-1">
                {dashboard?.pendingDisbursementsCount ??
                  pendingDisbursements.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">PENDING_ACCOUNTANT_EXECUTION</p>
            </div>
            <span className="w-9 h-9 rounded-lg bg-linear-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
          </div>
        </Link>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Dòng tiền vào tháng này</p>
              <p className="text-3xl font-bold text-emerald-700 mt-1">
                {formatCurrency(dashboard?.monthlyInflow ?? 0)}
              </p>
            </div>
            <span className="w-9 h-9 rounded-lg bg-linear-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Dòng tiền ra tháng này</p>
              <p className="text-3xl font-bold text-rose-700 mt-1">
                {formatCurrency(dashboard?.monthlyOutflow ?? 0)}
              </p>
              <p className={`text-xs mt-1 ${monthlyNetFlow >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                Dòng tiền ròng: {formatCurrency(monthlyNetFlow)}
              </p>
            </div>
            <span className="w-9 h-9 rounded-lg bg-linear-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Xu hướng dòng tiền</h2>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setPeriod(opt.key)}
                className={`px-3 py-1.5 transition-colors ${
                  period === opt.key
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Dòng vào
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            Dòng ra
          </span>
        </div>

        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={CASHFLOW[period]} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="acctGradIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="acctGradOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtM} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={40} />
              <RechartsTooltip content={<CashFlowTooltip />} />
              <Area type="monotone" dataKey="inflow" stroke="#10b981" strokeWidth={2} fill="url(#acctGradIn)" dot={false} />
              <Area type="monotone" dataKey="outflow" stroke="#f43f5e" strokeWidth={2} fill="url(#acctGradOut)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Chờ giải ngân
            </h2>
            <Link
              href="/accountant/disbursements"
              className="text-sm text-blue-700 hover:text-blue-600"
            >
              Xem tất cả →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div
                  key={`accountant-disbursement-loading-${index}`}
                  className="h-24 rounded-xl bg-white animate-pulse"
                />
              ))}
            </div>
          ) : pendingDisbursements.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
              Không có yêu cầu đang chờ giải ngân.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDisbursements.map((item) => (
                <Link
                  key={item.id}
                  href={`/accountant/disbursements/${item.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 hover:bg-white/70 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full border ${getRequestTypeClass(item.type)}`}
                        >
                          {getRequestTypeLabel(item.type)}
                        </span>
                        <span className="font-mono text-slate-600">
                          {item.requestCode}
                        </span>
                        <span className="text-slate-500">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-900 truncate">
                        {item.requester.fullName}{" "}
                        <span className="text-slate-500">
                          ({item.requester.employeeCode})
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {item.project.name} • {item.phase.name}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-amber-700">
                      {formatCurrency(item.approvedAmount)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Kỳ lương gần nhất
            </h2>
            <Link
              href="/accountant/payroll"
              className="text-sm text-blue-700 hover:text-blue-600"
            >
              Quản lý lương →
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <p className="text-xs text-slate-500">Kỳ lương</p>
            <p className="text-lg font-semibold text-slate-900">
              {latestPayroll?.name ?? payrollPeriodLabel}
            </p>
            <div className="flex items-center justify-between gap-2">
              <span
                className={`inline-flex px-2.5 py-1 rounded-full border text-xs ${getPayrollStatusClass(payrollStatus)}`}
              >
                {getPayrollStatusLabel(payrollStatus)}
              </span>
              {latestPayroll && (
                <span className="text-xs text-slate-500">
                  {latestPayroll.employeeCount} nhân viên
                </span>
              )}
            </div>
            {latestPayroll && (
              <p className="text-sm text-emerald-700">
                Tổng net: {formatCurrency(latestPayroll.totalNetPayroll)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Link
              href="/accountant/ledger"
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 hover:border-slate-300 hover:bg-white transition-colors"
            >
              <span>Sổ cái</span>
              <span>→</span>
            </Link>
            <Link
              href="/admin/system-fund"
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 hover:border-slate-300 hover:bg-white transition-colors"
            >
              <span>Quỹ hệ thống</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
