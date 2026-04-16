"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useWallet } from "@/contexts/wallet-context";
import { ApiError, api } from "@/lib/api-client";
import {
  ManagerApprovalListItem,
  ManagerDashboardResponse,
  ManagerProjectListItem,
  PaginatedResponse,
  RequestStatus,
  RequestType,
} from "@/types";

// TODO: Replace when Sprint 4-5 is complete
const MOCK_DASHBOARD: ManagerDashboardResponse = {
  departmentBudget: {
    totalProjectQuota: 800_000_000,
    totalAvailableBalance: 524_500_000,
    totalSpent: 275_500_000,
  },
  projectStatusSummary: { active: 3, planning: 2, paused: 1, closed: 0 },
  pendingApprovalsCount: 2,
  teamDebtSummary: { totalDebt: 5_200_000, employeesWithDebt: 3 },
};

// TODO: Replace when Sprint 4-5 is complete
const MOCK_PENDING_APPROVALS: ManagerApprovalListItem[] = [
  {
    id: 10,
    requestCode: "REQ-2026-0050",
    type: RequestType.PROJECT_TOPUP,
    status: RequestStatus.PENDING,
    amount: 50_000_000,
    description: "Xin cấp vốn bổ sung Phase 2 dự án HTQL nội bộ",
    requester: {
      id: 4,
      fullName: "Hoàng Minh Tuấn",
      avatar: null,
      employeeCode: "TL001",
      jobTitle: "Team Leader",
      email: "tl.it@ifms.vn",
    },
    project: {
      id: 1,
      projectCode: "PRJ-IT-001",
      name: "Hệ thống quản lý nội bộ",
      availableBudget: 12_000_000,
    },
    createdAt: "2026-04-03T10:00:00",
  },
  {
    id: 11,
    requestCode: "REQ-2026-0048",
    type: RequestType.PROJECT_TOPUP,
    status: RequestStatus.PENDING,
    amount: 30_000_000,
    description: "Cấp vốn cho Phase triển khai dự án hạ tầng mạng",
    requester: {
      id: 4,
      fullName: "Hoàng Minh Tuấn",
      avatar: null,
      employeeCode: "TL001",
      jobTitle: "Team Leader",
      email: "tl.it@ifms.vn",
    },
    project: {
      id: 2,
      projectCode: "PRJ-IT-002",
      name: "Nâng cấp hạ tầng mạng",
      availableBudget: 8_500_000,
    },
    createdAt: "2026-04-02T14:00:00",
  },
];

// TODO: Replace when Sprint 4 is complete
const MOCK_PROJECTS: ManagerProjectListItem[] = [
  {
    id: 1,
    projectCode: "PRJ-IT-001",
    name: "Hệ thống quản lý nội bộ",
    status: "ACTIVE",
    totalBudget: 150_000_000,
    availableBudget: 12_000_000,
    totalSpent: 138_000_000,
    memberCount: 5,
    currentPhaseId: 2,
    currentPhaseName: "Phase 2 - Triển khai",
    createdAt: "2026-01-10T08:00:00",
  },
  {
    id: 2,
    projectCode: "PRJ-IT-002",
    name: "Nâng cấp hạ tầng mạng",
    status: "ACTIVE",
    totalBudget: 80_000_000,
    availableBudget: 8_500_000,
    totalSpent: 71_500_000,
    memberCount: 3,
    currentPhaseId: 4,
    currentPhaseName: "Phase 1 - Triển khai",
    createdAt: "2026-02-15T08:00:00",
  },
  {
    id: 3,
    projectCode: "PRJ-IT-003",
    name: "Nghiên cứu AI integration",
    status: "PLANNING",
    totalBudget: 50_000_000,
    availableBudget: 50_000_000,
    totalSpent: 0,
    memberCount: 2,
    currentPhaseId: null,
    currentPhaseName: null,
    createdAt: "2026-03-20T08:00:00",
  },
];

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

function parseItems<T>(payload: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(payload) ? payload : payload.items;
}

function projectStatusLabel(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "Đang hoạt động";
    case "PLANNING":
      return "Lập kế hoạch";
    case "PAUSED":
      return "Tạm dừng";
    case "CLOSED":
      return "Đã đóng";
    default:
      return status;
  }
}

function projectStatusClass(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 border-emerald-200 text-emerald-700";
    case "PLANNING":
      return "bg-sky-100 border-sky-200 text-sky-700";
    case "PAUSED":
      return "bg-amber-100 border-amber-200 text-amber-700";
    case "CLOSED":
      return "bg-slate-100 border-slate-200 text-slate-600";
    default:
      return "bg-slate-100 border-slate-200 text-slate-600";
  }
}

function burnPercent(project: ManagerProjectListItem): number {
  if (project.totalBudget <= 0) return 0;
  return Math.min(100, Math.round((project.totalSpent / project.totalBudget) * 100));
}

function burnClass(percent: number): string {
  if (percent >= 85) return "bg-rose-500";
  if (percent >= 65) return "bg-amber-500";
  return "bg-emerald-500";
}

function StatCard({
  title,
  value,
  sub,
  href,
  accent,
  icon,
}: {
  title: string;
  value: string;
  sub?: string;
  href: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 hover:bg-slate-50 hover:border-slate-300 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${accent}`}>{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center">
          {icon}
        </span>
      </div>
    </Link>
  );
}

export function ManagerDashboard() {
  const { user } = useAuth();
  const { fetchWallet } = useWallet();

  const [dashboard, setDashboard] = useState<ManagerDashboardResponse | null>(null);
  const [approvals, setApprovals] = useState<ManagerApprovalListItem[]>([]);
  const [projects, setProjects] = useState<ManagerProjectListItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaAmount, setQuotaAmount] = useState("");
  const [quotaDescription, setQuotaDescription] = useState("");
  const [quotaSubmitting, setQuotaSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      void fetchWallet();

      try {
        const [dashRes, approvalsRes, projectsRes] = await Promise.all([
          api.get<ManagerDashboardResponse>("/api/v1/dashboard/manager"),
          api.get<PaginatedResponse<ManagerApprovalListItem> | ManagerApprovalListItem[]>(
            "/api/v1/manager/approvals?limit=3"
          ),
          api.get<PaginatedResponse<ManagerProjectListItem> | ManagerProjectListItem[]>(
            "/api/v1/manager/projects?limit=4"
          ),
        ]);

        if (cancelled) return;

        const pendingItems = parseItems(approvalsRes.data)
          .filter(
            (item) =>
              item.type === RequestType.PROJECT_TOPUP &&
              item.status === RequestStatus.PENDING
          )
          .slice(0, 3);

        setDashboard(dashRes.data);
        setApprovals(pendingItems);
        setProjects(parseItems(projectsRes.data).slice(0, 4));
      } catch (err) {
        if (cancelled) return;

        setDashboard(MOCK_DASHBOARD);
        setApprovals(MOCK_PENDING_APPROVALS);
        setProjects(MOCK_PROJECTS);

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải dashboard từ API, đang hiển thị dữ liệu mẫu.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [fetchWallet]);

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

  const activeProjects = dashboard?.projectStatusSummary.active ?? projects.filter((p) => p.status === "ACTIVE").length;
  const pendingCount = dashboard?.pendingApprovalsCount ?? approvals.length;
  const deptBalance = dashboard?.departmentBudget.totalAvailableBalance ?? 0;
  const teamDebt = dashboard?.teamDebtSummary.totalDebt ?? 0;
  const debtUsers = dashboard?.teamDebtSummary.employeesWithDebt ?? 0;

  const handleOpenQuotaModal = () => {
    setQuotaAmount("");
    setQuotaDescription("");
    setNotice(null);
    setShowQuotaModal(true);
  };

  const handleCreateQuotaTopup = async () => {
    const amountNumber = Number(quotaAmount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setNotice("Số tiền xin cấp vốn phải lớn hơn 0.");
      return;
    }

    if (quotaDescription.trim().length < 10) {
      setNotice("Mô tả cần ít nhất 10 ký tự.");
      return;
    }

    setQuotaSubmitting(true);

    try {
      await api.post("/api/v1/requests", {
        type: RequestType.DEPARTMENT_TOPUP,
        amount: amountNumber,
        description: quotaDescription.trim(),
      });
      setNotice("Đã gửi yêu cầu xin cấp vốn phòng ban.");
    } catch {
      setNotice("API chưa sẵn sàng, đã mô phỏng gửi yêu cầu xin cấp vốn.");
    } finally {
      setQuotaSubmitting(false);
      setShowQuotaModal(false);
      setQuotaAmount("");
      setQuotaDescription("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Xin chào, {user?.fullName ?? "Quản lý"}</h1>
          <p className="text-slate-500 mt-1">Hôm nay là {todayLabel}</p>
        </div>
        <span className="inline-flex w-fit px-3 py-1.5 rounded-full border border-blue-500/40 bg-blue-50 text-blue-700 text-sm font-medium">
          Quản lý
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, index) => (
            <div key={`manager-stat-skeleton-${index}`} className="h-24 rounded-2xl bg-white animate-pulse" />
          ))
        ) : (
          <>
            <StatCard
              title="Quỹ phòng ban"
              value={formatCurrency(deptBalance)}
              sub="Số dư khả dụng"
              href="/manager/department"
              accent="text-blue-700"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
              }
            />

            <StatCard
              title="Chờ duyệt"
              value={String(pendingCount)}
              sub="PROJECT_TOPUP"
              href="/manager/approvals"
              accent="text-amber-700"
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
              title="Dự án active"
              value={String(activeProjects)}
              sub="Đang triển khai"
              href="/manager/projects"
              accent="text-emerald-700"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 7h18M3 12h18M3 17h18"
                  />
                </svg>
              }
            />

            <StatCard
              title="Dư nợ nhóm"
              value={formatCurrency(teamDebt)}
              sub={`${debtUsers} nhân viên`}
              href="/manager/department"
              accent={teamDebt > 0 ? "text-rose-700" : "text-slate-600"}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20h10M12 7a3 3 0 110 6 3 3 0 010-6z"
                  />
                </svg>
              }
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">PROJECT_TOPUP chờ duyệt</h2>
            <Link href="/manager/approvals" className="text-sm text-blue-700 hover:text-blue-600">
              Xem tất cả →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={`manager-approval-skeleton-${index}`} className="h-24 rounded-xl bg-white animate-pulse" />
              ))}
            </div>
          ) : approvals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
              Không có yêu cầu PROJECT_TOPUP đang chờ duyệt.
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map((item) => (
                <Link
                  key={item.id}
                  href={`/manager/approvals/${item.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 hover:bg-white/70 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex px-2 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                          Cấp vốn DA
                        </span>
                        <span className="text-slate-500 font-mono">{item.requestCode}</span>
                        <span className="text-slate-500">{formatRelativeTime(item.createdAt)}</span>
                      </div>

                      <p className="text-sm text-slate-900 truncate">
                        <span className="font-medium text-slate-900">{item.project.name}</span> • {item.requester.fullName}
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.amount)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Dự án phòng ban</h2>
            <Link href="/manager/projects" className="text-sm text-blue-700 hover:text-blue-600">
              Xem tất cả →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={`manager-project-skeleton-${index}`} className="h-24 rounded-xl bg-white animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
              Chưa có dự án trong phòng ban.
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => {
                const burn = burnPercent(project);
                return (
                  <Link
                    key={project.id}
                    href={`/manager/projects/${project.id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 hover:bg-white/70 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{project.name}</p>
                      <span
                        className={`shrink-0 inline-flex px-2 py-1 rounded-full border text-[11px] ${projectStatusClass(project.status)}`}
                      >
                        {projectStatusLabel(project.status)}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Budget burn</span>
                        <span>{burn}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white border border-slate-200 overflow-hidden">
                        <div className={`h-full ${burnClass(burn)}`} style={{ width: `${burn}%` }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <h2 className="text-lg font-semibold text-slate-900">Thao tác nhanh</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleOpenQuotaModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v14m7-7H5" />
            </svg>
            Xin cấp vốn PB
          </button>

          <Link
            href="/wallet"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            Ví cá nhân
          </Link>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm">
          {error}
        </div>
      )}

      {notice && (
        <div className="px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm">
          {notice}
        </div>
      )}

      {showQuotaModal && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowQuotaModal(false)}
            aria-label="Đóng modal xin cấp vốn phòng ban"
          />

          <div className="absolute inset-x-0 top-10 mx-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Xin cấp vốn phòng ban</h3>
            <p className="text-sm text-slate-500">Flow 3: DEPARTMENT_TOPUP gửi Admin phê duyệt.</p>

            <div>
              <label className="block text-sm text-slate-600 mb-2">Số tiền cần cấp</label>
              <input
                type="number"
                min={1}
                value={quotaAmount}
                onChange={(event) => setQuotaAmount(event.target.value)}
                placeholder="Ví dụ: 100000000"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-2">Mô tả nhu cầu</label>
              <textarea
                rows={4}
                value={quotaDescription}
                onChange={(event) => setQuotaDescription(event.target.value)}
                placeholder="Mô tả lý do xin cấp vốn..."
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowQuotaModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateQuotaTopup}
                disabled={quotaSubmitting}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
              >
                {quotaSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
