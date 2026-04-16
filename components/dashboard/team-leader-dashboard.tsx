"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useWallet } from "@/contexts/wallet-context";
import { ApiError, api } from "@/lib/api-client";
import {
  PaginatedResponse,
  RequestStatus,
  RequestType,
  TLApprovalListItem,
  TLProjectListItem,
} from "@/types";

// TODO: Replace when Sprint 4-5 is complete
const MOCK_PENDING: TLApprovalListItem[] = [
  {
    id: 1,
    requestCode: "REQ-2026-0041",
    type: RequestType.ADVANCE,
    status: RequestStatus.PENDING,
    amount: 3_500_000,
    description: "Mua vật tư thiết bị thí nghiệm",
    requester: {
      id: 11,
      fullName: "Đỗ Quốc Bảo",
      avatar: null,
      employeeCode: "EMP001",
      jobTitle: "Frontend Developer",
      email: "emp.it1@ifms.vn",
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
      budgetLimit: 50_000_000,
      currentSpent: 12_000_000,
    },
    category: { id: 1, name: "Thiết bị & Phần cứng" },
    attachments: [],
    createdAt: "2026-04-03T09:15:00",
  },
  {
    id: 2,
    requestCode: "REQ-2026-0042",
    type: RequestType.EXPENSE,
    status: RequestStatus.PENDING,
    amount: 850_000,
    description: "Chi phí di chuyển gặp khách hàng",
    requester: {
      id: 12,
      fullName: "Vũ Thị Lan",
      avatar: null,
      employeeCode: "EMP002",
      jobTitle: "Backend Developer",
      email: "emp.it2@ifms.vn",
    },
    project: {
      id: 1,
      projectCode: "PRJ-IT-001",
      name: "Hệ thống quản lý nội bộ",
    },
    phase: {
      id: 2,
      phaseCode: "PH-002",
      name: "Phase 2 - Phát triển",
      budgetLimit: 80_000_000,
      currentSpent: 31_000_000,
    },
    category: { id: 2, name: "Di chuyển & Công tác" },
    attachments: [],
    createdAt: "2026-04-02T14:30:00",
  },
  {
    id: 3,
    requestCode: "REQ-2026-0043",
    type: RequestType.REIMBURSE,
    status: RequestStatus.PENDING,
    amount: 1_200_000,
    description: "Hoàn ứng chi phí ăn uống team",
    requester: {
      id: 11,
      fullName: "Đỗ Quốc Bảo",
      avatar: null,
      employeeCode: "EMP001",
      jobTitle: "Frontend Developer",
      email: "emp.it1@ifms.vn",
    },
    project: {
      id: 2,
      projectCode: "PRJ-IT-002",
      name: "Nâng cấp hạ tầng mạng",
    },
    phase: {
      id: 3,
      phaseCode: "PH-001",
      name: "Phase 1 - Triển khai",
      budgetLimit: 30_000_000,
      currentSpent: 8_500_000,
    },
    category: { id: 3, name: "Ăn uống & Tiếp khách" },
    attachments: [],
    createdAt: "2026-04-01T10:00:00",
  },
];

// TODO: Replace when Sprint 4 is complete
const MOCK_PROJECTS: TLProjectListItem[] = [
  {
    id: 1,
    projectCode: "PRJ-IT-001",
    name: "Hệ thống quản lý nội bộ",
    status: "ACTIVE",
    totalBudget: 150_000_000,
    availableBudget: 88_500_000,
    totalSpent: 61_500_000,
    memberCount: 5,
    currentPhaseId: 1,
    currentPhaseName: "Phase 1 - Phân tích",
    createdAt: "2026-01-10T08:00:00",
  },
  {
    id: 2,
    projectCode: "PRJ-IT-002",
    name: "Nâng cấp hạ tầng mạng",
    status: "ACTIVE",
    totalBudget: 80_000_000,
    availableBudget: 62_500_000,
    totalSpent: 17_500_000,
    memberCount: 3,
    currentPhaseId: 3,
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

function getApprovalTypeClass(type: RequestType): string {
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

function getApprovalTypeLabel(type: RequestType): string {
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

function getProjectStatusClass(status: string): string {
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

function getProjectStatusLabel(status: string): string {
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

function getBurnPercent(project: TLProjectListItem): number {
  if (project.totalBudget <= 0) return 0;
  return Math.min(100, Math.round((project.totalSpent / project.totalBudget) * 100));
}

function getBurnBarClass(percent: number): string {
  if (percent >= 85) return "bg-rose-500";
  if (percent >= 65) return "bg-amber-500";
  return "bg-emerald-500";
}

function pickItems<T>(payload: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(payload) ? payload : payload.items;
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
      className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 hover:bg-slate-50 hover:border-slate-300 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${accent}`}>{value}</p>
        </div>
        <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center">
          {icon}
        </span>
      </div>
    </Link>
  );
}

export function TeamLeaderDashboard() {
  const { user } = useAuth();
  const { wallet, fetchWallet } = useWallet();

  const [approvals, setApprovals] = useState<TLApprovalListItem[]>([]);
  const [projects, setProjects] = useState<TLProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      void fetchWallet();

      try {
        const [approvalRes, projectRes] = await Promise.all([
          api.get<PaginatedResponse<TLApprovalListItem> | TLApprovalListItem[]>(
            "/api/v1/team-leader/approvals?limit=3&status=PENDING"
          ),
          api.get<PaginatedResponse<TLProjectListItem> | TLProjectListItem[]>(
            "/api/v1/team-leader/projects?limit=3"
          ),
        ]);

        if (cancelled) return;

        setApprovals(pickItems(approvalRes.data).slice(0, 3));
        setProjects(pickItems(projectRes.data).slice(0, 3));
      } catch (err) {
        if (cancelled) return;

        setApprovals(MOCK_PENDING);
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

  const totalMembers = useMemo(
    () => projects.reduce((sum, project) => sum + project.memberCount, 0),
    [projects]
  );

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Xin chào, {user?.fullName ?? "Team Leader"}</h1>
          <p className="text-slate-500 mt-1">Hôm nay là {todayLabel}</p>
        </div>
        <span className="inline-flex w-fit px-3 py-1.5 rounded-full border border-indigo-500/40 bg-indigo-100 text-indigo-700 text-sm font-medium">
          Trưởng nhóm
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, index) => (
            <div key={`stat-skeleton-${index}`} className="h-24 rounded-2xl bg-white animate-pulse" />
          ))
        ) : (
          <>
            <StatCard
              title="Số dư ví"
              value={formatCurrency(wallet?.balance ?? 0)}
              href="/wallet"
              accent="text-emerald-700"
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
              title="Chờ duyệt"
              value={String(approvals.length)}
              href="/team-leader/approvals"
              accent="text-amber-700"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V7a2 2 0 00-2-2h-3m-4 0H6a2 2 0 00-2 2v6m16 0l-2 7H6l-2-7m16 0H4"
                  />
                </svg>
              }
            />
            <StatCard
              title="Dự án"
              value={String(projects.length)}
              href="/team-leader/projects"
              accent="text-sky-700"
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
              title="Thành viên"
              value={String(totalMembers)}
              href="/team-leader/team"
              accent="text-indigo-700"
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
            <h2 className="text-lg font-semibold text-slate-900">Yêu cầu đang chờ duyệt</h2>
            <Link href="/team-leader/approvals" className="text-sm text-blue-700 hover:text-blue-600">
              Xem tất cả →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={`approval-skeleton-${index}`} className="h-20 rounded-xl bg-white animate-pulse" />
              ))}
            </div>
          ) : approvals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
              Không có yêu cầu nào đang chờ duyệt.
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map((item) => (
                <Link
                  key={item.id}
                  href={`/team-leader/approvals/${item.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 hover:bg-white/70 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${getApprovalTypeClass(item.type)}`}>
                          {getApprovalTypeLabel(item.type)}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{item.requestCode}</span>
                        <span className="text-xs text-slate-500">{formatRelativeTime(item.createdAt)}</span>
                      </div>

                      <p className="text-sm text-slate-900 truncate">
                        <span className="font-medium text-slate-900">{item.requester.fullName}</span> • {item.project.name}
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
            <h2 className="text-lg font-semibold text-slate-900">Dự án của tôi</h2>
            <Link href="/team-leader/projects" className="text-sm text-blue-700 hover:text-blue-600">
              Xem tất cả →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={`project-skeleton-${index}`} className="h-24 rounded-xl bg-white animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
              Bạn chưa được phân công dự án.
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => {
                const burn = getBurnPercent(project);
                return (
                  <Link
                    key={project.id}
                    href={`/team-leader/projects/${project.id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 hover:bg-white/70 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{project.name}</p>
                      <span
                        className={`shrink-0 inline-flex px-2 py-1 rounded-full border text-[11px] ${getProjectStatusClass(project.status)}`}
                      >
                        {getProjectStatusLabel(project.status)}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Budget burn</span>
                        <span>{burn}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white border border-slate-200 overflow-hidden">
                        <div className={`h-full ${getBurnBarClass(burn)}`} style={{ width: `${burn}%` }} />
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
          <Link
            href="/wallet/deposit"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v14m7-7H5" />
            </svg>
            Nạp tiền
          </Link>

          <Link
            href="/wallet/withdraw"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14" />
            </svg>
            Rút tiền
          </Link>
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
