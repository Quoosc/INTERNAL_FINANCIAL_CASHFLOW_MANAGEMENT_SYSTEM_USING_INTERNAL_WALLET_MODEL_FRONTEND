"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
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

// ─── Types ──────────────────────────────────────────────────────

type PeriodKey = "ytd" | "last6m" | "fy2025";
interface CashFlowPoint { date: string; inflow: number; outflow: number }
interface DeptSpending  { dept: string; spent: number; fill: string }
interface TopDebtor     { id: number; name: string; initials: string; dept: string; amount: number; days: number }

// ─── Mock chart data (not available from AdminDashboardResponse API) ─────────

// TODO: Replace when Sprint 6 is complete
const MOCK_DASHBOARD: AdminDashboardResponse = {
  totalUsers: 64,
  totalDepartments: 8,
  totalWalletBalance: 2_450_000_000,
  recentAuditEvents: [
    { id: 1, actorName: "Admin System",   action: "USER_CREATED",       entityName: "users",          createdAt: "2026-04-09T08:15:00" },
    { id: 2, actorName: "Admin System",   action: "DEPARTMENT_UPDATED", entityName: "departments",    createdAt: "2026-04-09T07:40:00" },
    { id: 3, actorName: "Admin Security", action: "CONFIG_UPDATED",     entityName: "system_configs", createdAt: "2026-04-09T06:30:00" },
    { id: 4, actorName: "Admin HR",       action: "USER_LOCKED",        entityName: "users",          createdAt: "2026-04-08T15:05:00" },
  ],
};

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "ytd",    label: "Năm 2026" },
  { value: "last6m", label: "6 tháng" },
  { value: "fy2025", label: "Năm 2025" },
];

const CASHFLOW: Record<PeriodKey, CashFlowPoint[]> = {
  ytd: [
    { date: "T1/26", inflow: 700_000_000, outflow: 330_000_000 },
    { date: "T2/26", inflow: 182_500_000, outflow: 103_500_000 },
  ],
  last6m: [
    { date: "T9/25",  inflow: 310_000_000, outflow: 228_000_000 },
    { date: "T10/25", inflow: 285_000_000, outflow: 210_000_000 },
    { date: "T11/25", inflow: 425_000_000, outflow: 295_000_000 },
    { date: "T12/25", inflow: 520_000_000, outflow: 382_000_000 },
    { date: "T1/26",  inflow: 700_000_000, outflow: 330_000_000 },
    { date: "T2/26",  inflow: 182_500_000, outflow: 103_500_000 },
  ],
  fy2025: [
    { date: "T1",  inflow: 180_000_000, outflow: 140_000_000 },
    { date: "T2",  inflow: 210_000_000, outflow: 155_000_000 },
    { date: "T3",  inflow: 195_000_000, outflow: 162_000_000 },
    { date: "T4",  inflow: 245_000_000, outflow: 190_000_000 },
    { date: "T5",  inflow: 230_000_000, outflow: 185_000_000 },
    { date: "T6",  inflow: 280_000_000, outflow: 210_000_000 },
    { date: "T7",  inflow: 260_000_000, outflow: 200_000_000 },
    { date: "T8",  inflow: 220_000_000, outflow: 165_000_000 },
    { date: "T9",  inflow: 310_000_000, outflow: 228_000_000 },
    { date: "T10", inflow: 285_000_000, outflow: 210_000_000 },
    { date: "T11", inflow: 425_000_000, outflow: 295_000_000 },
    { date: "T12", inflow: 520_000_000, outflow: 382_000_000 },
  ],
};

const DEPT_SPENDING: DeptSpending[] = [
  { dept: "Engineering",       spent: 60_200_000, fill: "#6366f1" },
  { dept: "Infrastructure",    spent: 32_750_000, fill: "#f59e0b" },
  { dept: "Architecture",      spent: 23_500_000, fill: "#0ea5e9" },
  { dept: "Data Analytics",    spent: 10_300_000, fill: "#14b8a6" },
  { dept: "Quality Assurance", spent:  5_000_000, fill: "#8b5cf6" },
  { dept: "Product Design",    spent:  3_200_000, fill: "#ec4899" },
];

const TOP_DEBTORS: TopDebtor[] = [
  { id: 1, name: "Phạm Minh Đức",  initials: "PĐ", dept: "Infrastructure",    amount: 12_750_000, days: 45 },
  { id: 2, name: "Bùi Thu Hương",  initials: "BH", dept: "Business Analysis", amount:  7_800_000, days: 52 },
  { id: 3, name: "Nguyễn Văn An",  initials: "NA", dept: "Engineering",       amount:  8_500_000, days: 34 },
  { id: 4, name: "Hoàng Thị Mai",  initials: "HM", dept: "Quality Assurance", amount:  5_000_000, days: 40 },
  { id: 5, name: "Đào Thị Thủy",   initials: "ĐT", dept: "Data Analytics",    amount:  2_500_000, days: 28 },
  { id: 6, name: "Trần Văn Bình",  initials: "TB", dept: "Engineering",       amount:  3_200_000, days: 22 },
];

// ─── Helpers ──────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function fmtM(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (a >= 1_000_000)     return `${(v / 1_000_000).toFixed(0)}M`;
  return `${(v / 1_000).toFixed(0)}K`;
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

function formatRelativeTime(iso: string): string {
  const diffMs  = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  return `${Math.floor(diffHour / 24)} ngày trước`;
}

function pickItems<T>(payload: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(payload) ? payload : payload.items;
}

function getTotal<T>(payload: PaginatedResponse<T> | T[]): number {
  return Array.isArray(payload) ? payload.length : payload.total;
}

const ACCENT_TO_GRADIENT: Record<string, string> = {
  "text-blue-700":    "bg-linear-to-br from-blue-500 to-blue-600",
  "text-emerald-700": "bg-linear-to-br from-emerald-500 to-emerald-600",
  "text-amber-700":   "bg-linear-to-br from-amber-500 to-orange-500",
  "text-violet-700":  "bg-linear-to-br from-violet-500 to-purple-600",
};

// ─── Chart tooltip components ─────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CashFlowTooltip({ active, payload, label }: any) {
  if (!active || !(payload as unknown[])?.length) return null;
  return (
    <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-3 min-w-[170px]">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">{label as string}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(payload as any[]).map((p: any) => (
        <div key={p.name as string} className="flex items-center justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color as string }} />
            {p.name as string}
          </span>
          <span className={`text-xs font-bold tabular-nums ${(p.name as string) === "Vào" ? "text-teal-600" : "text-rose-600"}`}>
            {formatCurrency(p.value as number)}
          </span>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DonutTooltip({ active, payload }: any) {
  if (!active || !(payload as unknown[])?.length) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = (payload as any[])[0];
  return (
    <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-3">
      <p className="text-xs font-semibold text-slate-700">{(p.payload as DeptSpending).dept}</p>
      <p className="text-sm font-black text-slate-900 tabular-nums">{formatCurrency(p.value as number)}</p>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────

function StatCard({ title, value, href, accent, icon }: {
  title: string; value: string; href: string; accent: string; icon: React.ReactNode;
}) {
  const iconGradient = ACCENT_TO_GRADIENT[accent] ?? "bg-linear-to-br from-slate-400 to-slate-500";
  return (
    <Link href={href} className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${accent}`}>{value}</p>
        </div>
        <span className={`w-9 h-9 rounded-lg ${iconGradient} text-white flex items-center justify-center shadow-sm`}>
          {icon}
        </span>
      </div>
    </Link>
  );
}

// ─── Main component ────────────────────────────────────────────

export function AdminDashboard() {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodKey>("last6m");
  const [activeDonut, setActiveDonut] = useState<number | null>(null);

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
            api.get<PaginatedResponse<AdminUserListItem> | AdminUserListItem[]>("/api/v1/admin/users?page=1&limit=1"),
            api.get<PaginatedResponse<DepartmentListItem> | DepartmentListItem[]>("/api/v1/admin/departments?page=1&limit=1"),
            api.get<PaginatedResponse<AuditLogResponse> | AuditLogResponse[]>("/api/v1/admin/audit?page=1&limit=5"),
            api.get<CompanyFundResponse>("/api/v1/company-fund"),
          ]);

          if (cancelled) return;
          const audits = pickItems(auditsRes.data).slice(0, 5);
          setDashboard({
            totalUsers: getTotal(usersRes.data),
            totalDepartments: getTotal(departmentsRes.data),
            totalWalletBalance: companyFundRes.data.currentWalletBalance,
            recentAuditEvents: audits.map((item) => ({
              id: item.id, actorName: item.actorName,
              action: item.action, entityName: item.entityName, createdAt: item.createdAt,
            })),
          });
        } catch (composeErr) {
          if (cancelled) return;
          setDashboard(MOCK_DASHBOARD);
          if (dashboardErr instanceof ApiError) setError(dashboardErr.apiMessage);
          else if (composeErr instanceof ApiError) setError(composeErr.apiMessage);
          else setError("Không thể tải dữ liệu API, đang hiển thị dữ liệu mẫu.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadDashboard();
    return () => { cancelled = true; };
  }, []);

  const todayLabel = useMemo(
    () => new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date()),
    []
  );

  const recentActivity = dashboard?.recentAuditEvents.length ?? 0;
  const cfData         = CASHFLOW[period];
  const totalInflow    = cfData.reduce((s, d) => s + d.inflow,  0);
  const totalOutflow   = cfData.reduce((s, d) => s + d.outflow, 0);
  const netFlow        = totalInflow - totalOutflow;
  const totalDeptSpend = DEPT_SPENDING.reduce((s, d) => s + d.spent, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản trị hệ thống</h1>
          <p className="text-slate-500 mt-1">Xin chào, {user?.fullName ?? "Admin"} • {todayLabel}</p>
        </div>
        <span className="inline-flex w-fit px-3 py-1.5 rounded-full border border-blue-300 bg-blue-50 text-blue-700 text-sm font-medium">Admin</span>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={`admin-skel-${i}`} className="h-24 rounded-2xl bg-white animate-pulse" />)
        ) : (
          <>
            <StatCard title="Tổng người dùng" value={String(dashboard?.totalUsers ?? 0)} href="/admin/users" accent="text-blue-700"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>}
            />
            <StatCard title="Tổng phòng ban" value={String(dashboard?.totalDepartments ?? 0)} href="/admin/departments" accent="text-emerald-700"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>}
            />
            <StatCard title="Quỹ hệ thống" value={formatCurrency(dashboard?.totalWalletBalance ?? 0)} href="/admin/system-fund" accent="text-amber-700"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
            />
            <StatCard title="Hoạt động gần đây" value={String(recentActivity)} href="/admin/audit-logs" accent="text-violet-700"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
          </>
        )}
      </div>

      {/* Period selector + Summary strip + Charts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-slate-900">Phân tích dòng tiền</h2>
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-0.5 shadow-sm">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  period === opt.value ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Tổng dòng vào", value: totalInflow,  color: "text-teal-600",    bg: "bg-teal-50 border-teal-200",    icon: "↑" },
            { label: "Tổng dòng ra",  value: totalOutflow, color: "text-rose-600",    bg: "bg-rose-50 border-rose-200",    icon: "↓" },
            { label: "Thặng dư",      value: netFlow,      color: netFlow >= 0 ? "text-emerald-600" : "text-rose-600",
              bg: netFlow >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200", icon: netFlow >= 0 ? "+" : "−" },
          ].map((item) => (
            <div key={item.label} className={`flex items-center gap-4 p-4 rounded-xl border ${item.bg}`}>
              <div className="p-2 bg-white/70 rounded-lg shadow-sm">
                <span className={`text-lg font-bold leading-none ${item.color}`}>{item.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-medium">{item.label}</p>
                <p className={`font-bold tabular-nums text-sm ${item.color}`}>{formatCurrency(item.value)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Cash flow area chart */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Xu hướng dòng tiền</h3>
                <p className="text-xs text-slate-400 mt-0.5">Dòng vào so với dòng ra theo kỳ</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-teal-500 rounded inline-block" /> Vào</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-rose-500 rounded inline-block" /> Ra</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={cfData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminGradIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#14b8a6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="adminGradOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtM} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={48} />
                <RechartsTooltip content={<CashFlowTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="inflow"  name="Vào" stroke="#14b8a6" strokeWidth={2} fill="url(#adminGradIn)"  dot={{ r: 3, fill: "#14b8a6", strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="outflow" name="Ra"  stroke="#f43f5e" strokeWidth={2} fill="url(#adminGradOut)" dot={{ r: 3, fill: "#f43f5e", strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>

            <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Thặng dư: <span className={`font-bold ${netFlow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{netFlow >= 0 ? "+" : ""}{formatCurrency(netFlow)}</span>
              </span>
              <span className="text-xs text-slate-400 tabular-nums">{cfData.length} điểm dữ liệu</span>
            </div>
          </div>

          {/* Dept spending donut */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800">Chi tiêu theo phòng ban</h3>
              <p className="text-xs text-slate-400 mt-0.5">MTD — tháng hiện tại</p>
            </div>

            <div className="relative mx-auto" style={{ width: "100%", height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={DEPT_SPENDING}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={76}
                    dataKey="spent" paddingAngle={2}
                    onMouseEnter={(_, i) => setActiveDonut(i)}
                    onMouseLeave={() => setActiveDonut(null)}
                  >
                    {DEPT_SPENDING.map((d, i) => (
                      <Cell key={d.dept} fill={d.fill} opacity={activeDonut === null || activeDonut === i ? 1 : 0.4} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tổng</p>
                <p className="text-base font-black text-slate-800 tabular-nums">{fmtM(totalDeptSpend)}</p>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              {DEPT_SPENDING.map((d, i) => {
                const pct = totalDeptSpend > 0 ? ((d.spent / totalDeptSpend) * 100).toFixed(1) : "0";
                return (
                  <div
                    key={d.dept}
                    className={`flex items-center gap-2 p-1.5 rounded-lg cursor-default transition-colors ${activeDonut === i ? "bg-slate-100" : "hover:bg-slate-50"}`}
                    onMouseEnter={() => setActiveDonut(i)}
                    onMouseLeave={() => setActiveDonut(null)}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.fill }} />
                    <span className="flex-1 text-xs text-slate-600 truncate">{d.dept}</span>
                    <span className="text-[10px] text-slate-400 tabular-nums w-9 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Top Debtors */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Tạm ứng tồn đọng
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Nhân viên có số dư tạm ứng chưa hoàn trả</p>
          </div>
          <span className="text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            {TOP_DEBTORS.filter((d) => d.days > 30).length} quá hạn &gt;30ng
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-5 pr-3 py-2.5">Nhân viên</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2.5 hidden sm:table-cell">Phòng ban</th>
                <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2.5">Tồn đọng</th>
                <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider pr-5 pl-3 py-2.5">Ngày</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TOP_DEBTORS.map((d) => {
                const overdue = d.days > 30;
                return (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="pl-5 pr-3 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-[11px] font-black shrink-0">
                          {d.initials}
                        </div>
                        <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 hidden sm:table-cell">
                      <span className="text-xs text-slate-500">{d.dept}</span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-sm font-black text-amber-600 tabular-nums">{formatCurrency(d.amount)}</span>
                    </td>
                    <td className="pr-5 pl-3 py-3.5 text-center">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${overdue ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600"}`}>
                        {d.days}ng
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/60 border-t border-slate-100">
                <td colSpan={2} className="pl-5 py-2.5 text-[11px] font-semibold text-slate-500">Tổng tồn đọng</td>
                <td className="px-3 py-2.5 text-right text-sm font-black text-amber-600 tabular-nums">
                  {formatCurrency(TOP_DEBTORS.reduce((s, d) => s + d.amount, 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* System health + Audit events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Sức khỏe hệ thống</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Người dùng / phòng ban</p>
              <p className="text-base font-semibold text-slate-900 mt-1">
                {dashboard && dashboard.totalDepartments > 0 ? (dashboard.totalUsers / dashboard.totalDepartments).toFixed(1) : "0.0"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Đăng nhập role</p>
              <p className="text-base font-semibold text-slate-900 mt-1">{user?.role ?? "ADMIN"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Sự kiện gần đây</p>
              <p className="text-base font-semibold text-slate-900 mt-1">{recentActivity}</p>
            </div>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            Trạng thái hệ thống ổn định. Theo dõi nhật ký audit để kiểm soát thay đổi IAM và cấu hình.
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Audit gần đây</h2>
            <Link href="/admin/audit-logs" className="text-sm text-blue-700 hover:text-blue-600">Xem tất cả →</Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={`audit-skel-${i}`} className="h-16 rounded-xl bg-white animate-pulse" />)}
            </div>
          ) : (dashboard?.recentAuditEvents.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
              Chưa có hoạt động audit.
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard?.recentAuditEvents.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-sm font-medium text-slate-900">{item.action}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.actorName ?? "System"} • {item.entityName}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatRelativeTime(item.createdAt)} ({formatDateTime(item.createdAt)})</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <h2 className="text-lg font-semibold text-slate-900">Truy cập nhanh</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <QuickLink href="/admin/users" label="Nhân sự" />
          <QuickLink href="/admin/departments" label="Phòng ban" />
          <QuickLink href="/admin/audit-logs" label="Nhật ký" />
          <QuickLink href="/admin/settings" label="Cấu hình" />
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm">{error}</div>
      )}
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14m-7-7l7 7-7 7" />
      </svg>
      {label}
    </Link>
  );
}
