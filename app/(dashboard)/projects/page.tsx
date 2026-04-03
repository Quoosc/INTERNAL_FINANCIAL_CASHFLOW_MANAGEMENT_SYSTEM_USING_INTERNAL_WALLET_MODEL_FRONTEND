"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import { PaginatedResponse, ProjectListItem, ProjectStatus } from "@/types";

const PAGE_LIMIT = 9;

// TODO: Replace with real API call when Sprint 4 is complete
const MOCK_PROJECTS: ProjectListItem[] = [
  {
    id: 1,
    projectCode: "PRJ-IT-001",
    name: "Hệ thống quản lý nội bộ",
    status: ProjectStatus.ACTIVE,
    departmentId: 10,
    totalBudget: 500_000_000,
    totalSpent: 185_000_000,
    currentPhaseId: 12,
    currentPhaseName: "Phase 2 - Development",
  },
  {
    id: 2,
    projectCode: "PRJ-IT-002",
    name: "Ứng dụng mobile nhân sự",
    status: ProjectStatus.ACTIVE,
    departmentId: 10,
    totalBudget: 350_000_000,
    totalSpent: 90_000_000,
    currentPhaseId: 21,
    currentPhaseName: "Phase 1 - Planning",
  },
  {
    id: 3,
    projectCode: "PRJ-IT-003",
    name: "Nâng cấp BI Dashboard",
    status: ProjectStatus.ACTIVE,
    departmentId: 10,
    totalBudget: 280_000_000,
    totalSpent: 120_000_000,
    currentPhaseId: 31,
    currentPhaseName: "Phase 3 - UAT",
  },
  {
    id: 4,
    projectCode: "PRJ-HR-001",
    name: "Chuyển đổi hệ thống HR",
    status: ProjectStatus.PLANNING,
    departmentId: 8,
    totalBudget: 420_000_000,
    totalSpent: 0,
    currentPhaseId: null,
    currentPhaseName: null,
  },
  {
    id: 5,
    projectCode: "PRJ-FIN-001",
    name: "Tích hợp cổng thanh toán",
    status: ProjectStatus.PAUSED,
    departmentId: 12,
    totalBudget: 200_000_000,
    totalSpent: 75_000_000,
    currentPhaseId: null,
    currentPhaseName: null,
  },
  {
    id: 6,
    projectCode: "PRJ-IT-004",
    name: "ERP Nâng cấp modul kho",
    status: ProjectStatus.CLOSED,
    departmentId: 10,
    totalBudget: 150_000_000,
    totalSpent: 148_000_000,
    currentPhaseId: null,
    currentPhaseName: null,
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case ProjectStatus.ACTIVE:
      return "Đang triển khai";
    case ProjectStatus.PLANNING:
      return "Lên kế hoạch";
    case ProjectStatus.PAUSED:
      return "Tạm dừng";
    case ProjectStatus.CLOSED:
      return "Đã đóng";
    default:
      return status;
  }
}

function getStatusClass(status: ProjectStatus): string {
  switch (status) {
    case ProjectStatus.ACTIVE:
      return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
    case ProjectStatus.PLANNING:
      return "bg-blue-500/15 border-blue-500/30 text-blue-300";
    case ProjectStatus.PAUSED:
      return "bg-amber-500/15 border-amber-500/30 text-amber-300";
    case ProjectStatus.CLOSED:
      return "bg-slate-500/15 border-slate-500/30 text-slate-300";
    default:
      return "bg-slate-500/15 border-slate-500/30 text-slate-300";
  }
}

function getSpentPercent(item: ProjectListItem): number {
  if (!item.totalBudget || item.totalBudget <= 0) return 0;
  return Math.min(100, Math.round((item.totalSpent / item.totalBudget) * 100));
}

function getProgressBarClass(percent: number): string {
  if (percent >= 90) return "bg-rose-500";
  if (percent >= 70) return "bg-amber-500";
  return "bg-blue-500";
}

type StatusFilter = "ALL" | ProjectStatus;

function parseStatus(value: string | null): StatusFilter {
  if (!value) return "ALL";
  const valid = new Set<string>(Object.values(ProjectStatus));
  return valid.has(value) ? (value as ProjectStatus) : "ALL";
}

function parseSearch(value: string | null): string {
  return value ?? "";
}

function parsePage(value: string | null): number {
  const n = Number(value ?? "1");
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function filterMock(
  source: ProjectListItem[],
  status: StatusFilter,
  search: string
): ProjectListItem[] {
  return source.filter((item) => {
    if (status !== "ALL" && item.status !== status) return false;
    if (search) {
      const q = search.toLowerCase().trim();
      if (!`${item.projectCode} ${item.name}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    parseStatus(searchParams.get("status"))
  );
  const [search, setSearch] = useState(() => parseSearch(searchParams.get("search")));
  const [searchInput, setSearchInput] = useState(() => parseSearch(searchParams.get("search")));
  const [page, setPage] = useState(() => parsePage(searchParams.get("page")));

  const syncUrl = useCallback(
    (nextStatus: StatusFilter, nextSearch: string, nextPage: number) => {
      const params = new URLSearchParams();
      if (nextStatus !== "ALL") params.set("status", nextStatus);
      if (nextSearch) params.set("search", nextSearch);
      if (nextPage > 1) params.set("page", String(nextPage));
      const query = params.toString();
      router.replace(query ? `/projects?${query}` : "/projects");
    },
    [router]
  );

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams();
        if (statusFilter !== "ALL") query.set("status", statusFilter);
        if (search) query.set("search", search);
        query.set("page", String(page));
        query.set("limit", String(PAGE_LIMIT));

        // const res = await api.get<PaginatedResponse<ProjectListItem>>('/api/v1/projects', { params: filters })
        const res = await api.get<PaginatedResponse<ProjectListItem>>(
          `/api/v1/projects?${query.toString()}`
        );

        if (cancelled) return;
        setProjects(res.data.items);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        if (cancelled) return;

        const filtered = filterMock(MOCK_PROJECTS, statusFilter, search);
        const mockTotal = filtered.length;
        const mockTotalPages = Math.max(1, Math.ceil(mockTotal / PAGE_LIMIT));
        const currentPage = Math.min(page, mockTotalPages);
        const start = (currentPage - 1) * PAGE_LIMIT;

        setProjects(filtered.slice(start, start + PAGE_LIMIT));
        setTotal(mockTotal);
        setTotalPages(mockTotalPages);

        if (currentPage !== page) {
          setPage(currentPage);
          syncUrl(statusFilter, search, currentPage);
        }

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải danh sách dự án từ API, đang hiển thị dữ liệu mẫu.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [statusFilter, search, page, syncUrl]);

  const statusTabs = useMemo<{ label: string; value: StatusFilter }[]>(
    () => [
      { label: "Tất cả", value: "ALL" },
      { label: "Đang triển khai", value: ProjectStatus.ACTIVE },
      { label: "Lên kế hoạch", value: ProjectStatus.PLANNING },
      { label: "Tạm dừng", value: ProjectStatus.PAUSED },
      { label: "Đã đóng", value: ProjectStatus.CLOSED },
    ],
    []
  );

  const handleStatusChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
    syncUrl(value, search, 1);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    setSearch(trimmed);
    setPage(1);
    syncUrl(statusFilter, trimmed, 1);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
    syncUrl(statusFilter, search, nextPage);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dự án</h1>
        <p className="text-slate-400 mt-1">Xem danh sách và tiến độ các dự án.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleStatusChange(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              statusFilter === tab.value
                ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                : "bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo mã hoặc tên dự án..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          Tìm
        </button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-10 text-center text-slate-500 text-sm">
          Không có dự án phù hợp bộ lọc.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((project) => {
            const spentPercent = getSpentPercent(project);
            const remaining = Math.max(0, project.totalBudget - project.totalSpent);

            return (
              <button
                key={project.id}
                type="button"
                onClick={() => router.push(`/projects/${project.id}`)}
                className="bg-slate-800 border border-white/10 hover:border-white/20 rounded-2xl p-5 text-left transition-all hover:bg-slate-700/50 space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">{project.projectCode}</p>
                    <p className="text-base font-semibold text-white mt-0.5 truncate">{project.name}</p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusClass(project.status)}`}
                  >
                    {getStatusLabel(project.status)}
                  </span>
                </div>

                {project.currentPhaseName && (
                  <p className="text-xs text-slate-400">
                    Phase hiện tại: <span className="text-slate-200">{project.currentPhaseName}</span>
                  </p>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Tiến độ ngân sách</span>
                    <span className="text-slate-300 font-medium">{spentPercent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-900 border border-white/10 overflow-hidden">
                    <div
                      className={`h-full transition-all ${getProgressBarClass(spentPercent)}`}
                      style={{ width: `${spentPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2">
                    <p className="text-[11px] text-slate-500">Ngân sách</p>
                    <p className="text-xs font-semibold text-white mt-0.5">{formatCurrency(project.totalBudget)}</p>
                  </div>
                  <div className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2">
                    <p className="text-[11px] text-slate-500">Còn lại</p>
                    <p className="text-xs font-semibold text-emerald-300 mt-0.5">{formatCurrency(remaining)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Tổng {total} dự án • Trang {page}/{totalPages}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors"
          >
            Trước
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors"
          >
            Sau
          </button>
        </div>
      </div>

      {error && <p className="text-amber-400 text-sm">{error}</p>}
    </div>
  );
}
