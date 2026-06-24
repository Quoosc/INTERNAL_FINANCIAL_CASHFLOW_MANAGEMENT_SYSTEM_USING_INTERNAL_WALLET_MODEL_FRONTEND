"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import { PaginatedResponse, ProjectListItem, ProjectStatus } from "@/types";
import { formatCurrency, getBurnClass } from "@/lib/format";
import { useToast } from "@/contexts/toast-context";

const PAGE_LIMIT = 9;


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
      return "bg-emerald-50 border-emerald-200 text-emerald-700";
    case ProjectStatus.PLANNING:
      return "bg-blue-50 border-blue-200 text-blue-700";
    case ProjectStatus.PAUSED:
      return "bg-amber-50 border-amber-200 text-amber-700";
    case ProjectStatus.CLOSED:
      return "bg-slate-500/15 border-slate-500/30 text-slate-600";
    default:
      return "bg-slate-500/15 border-slate-500/30 text-slate-600";
  }
}


type StatusFilter = "ALL" | ProjectStatus;
type ProjectListPayload =
  | PaginatedResponse<ProjectListItem>
  | { content?: ProjectListItem[]; totalElements?: number; totalPages?: number }
  | ProjectListItem[];
function getProjectBudget(item: ProjectListItem): number {
  const budget = Number(item.totalBudget);
  return Number.isFinite(budget) ? budget : 0;
}

function getProjectSpent(item: ProjectListItem): number {
  const spent = Number(item.totalSpent);
  return Number.isFinite(spent) ? spent : 0;
}

function getProjectRemaining(item: ProjectListItem): number {
  const available = Number(item.availableBudget);
  return Number.isFinite(available)
    ? available
    : Math.max(0, getProjectBudget(item) - getProjectSpent(item));
}

function getSpentPercent(item: ProjectListItem): number {
  const budget = getProjectBudget(item);
  if (budget <= 0) return 0;
  return Math.min(100, Math.round((getProjectSpent(item) / budget) * 100));
}

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

function getProjectItems(payload: ProjectListPayload): ProjectListItem[] {
  if (Array.isArray(payload)) return payload;
  if ("items" in payload && Array.isArray(payload.items)) return payload.items;
  if ("content" in payload && Array.isArray(payload.content)) return payload.content;
  return [];
}

function getProjectTotal(payload: ProjectListPayload, itemCount: number): number {
  if (Array.isArray(payload)) return itemCount;
  if ("total" in payload && typeof payload.total === "number") return payload.total;
  if ("totalElements" in payload && typeof payload.totalElements === "number") return payload.totalElements;
  return itemCount;
}

function getProjectTotalPages(payload: ProjectListPayload, totalItems: number): number {
  if (!Array.isArray(payload) && typeof payload.totalPages === "number") {
    return Math.max(1, payload.totalPages);
  }
  return Math.max(1, Math.ceil(totalItems / PAGE_LIMIT));
}

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

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

      try {
        const query = new URLSearchParams();
        if (statusFilter !== "ALL") query.set("status", statusFilter);
        if (search) query.set("search", search);
        query.set("page", String(page));
        query.set("limit", String(PAGE_LIMIT));

        const res = await api.get<ProjectListPayload>(
          `/api/v1/projects?${query.toString()}`
        );

        if (cancelled) return;
        const items = getProjectItems(res.data);
        const nextTotal = getProjectTotal(res.data, items.length);
        setProjects(items);
        setTotal(nextTotal);
        setTotalPages(getProjectTotalPages(res.data, nextTotal));
      } catch (err) {
        if (cancelled) return;

        setProjects([]);
        setTotal(0);
        setTotalPages(1);

        if (err instanceof ApiError) {
          toast.error(err.apiMessage);
        } else {
          toast.error("Không thể tải danh sách dự án.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [statusFilter, search, page, syncUrl, toast]);

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
      <section className="overflow-hidden rounded-3xl border border-blue-200 bg-linear-to-br from-blue-700 via-blue-600 to-cyan-600 text-white shadow-xl shadow-blue-900/15">
        <div className="relative p-6 sm:p-8">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-10 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">Không gian IFMS</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Dự án của tôi</h1>
            <p className="mt-3 text-sm leading-6 text-blue-100">Theo dõi ngân sách, giai đoạn hiện tại và tiến độ của các dự án bạn đang tham gia.</p>
          </div>
        </div>
      </section>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dự án</h1>
        <p className="text-slate-500 mt-1">Xem danh sách và tiến độ các dự án.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleStatusChange(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              statusFilter === tab.value
                ? "bg-blue-100 border-blue-300 text-blue-700"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-blue-50"
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
          className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
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
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 text-sm">
          Không có dự án phù hợp bộ lọc.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((project) => {
            const spentPercent = getSpentPercent(project);
            const budget = getProjectBudget(project);
            const remaining = getProjectRemaining(project);

            return (
              <button
                key={project.id}
                type="button"
                onClick={() => router.push(`/projects/${project.id}`)}
                className="border border-slate-200 bg-white hover:border-slate-200 rounded-3xl p-5 text-left transition-all hover:bg-blue-50/50 space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">{project.projectCode}</p>
                    <p className="text-base font-semibold text-slate-900 mt-0.5 truncate">{project.name}</p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusClass(project.status)}`}
                  >
                    {getStatusLabel(project.status)}
                  </span>
                </div>

                {project.currentPhaseName && (
                  <p className="text-xs text-slate-500">
                    Giai đoạn hiện tại: <span className="text-slate-700">{project.currentPhaseName}</span>
                  </p>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Tiến độ ngân sách</span>
                    <span className="text-slate-600 font-medium">{spentPercent}%</span>
                  </div>
                  <div className="h-2 rounded-full border border-slate-200 bg-white overflow-hidden">
                    <div
                      className={`h-full transition-all ${getBurnClass(spentPercent)}`}
                      style={{ width: `${spentPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[11px] text-slate-500">Hạn mức</p>
                    <p className="text-xs font-semibold text-slate-900 mt-0.5">{formatCurrency(budget)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[11px] text-slate-500">Đã chi</p>
                    <p className="text-xs font-semibold text-rose-700 mt-0.5">{formatCurrency(getProjectSpent(project))}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[11px] text-slate-500">Khả dụng</p>
                    <p className="text-xs font-semibold text-emerald-700 mt-0.5">{formatCurrency(remaining)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Tổng {total} dự án • Trang {page}/{totalPages}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-xl bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm transition-colors"
          >
            Trước
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-xl bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm transition-colors"
          >
            Sau
          </button>
        </div>
      </div>

    </div>
  );
}
