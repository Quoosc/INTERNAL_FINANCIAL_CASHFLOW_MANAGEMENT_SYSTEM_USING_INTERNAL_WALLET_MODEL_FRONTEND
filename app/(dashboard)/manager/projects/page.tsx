"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  CreateProjectBody,
  ManagerProjectFilterParams,
  ManagerProjectListItem,
  PaginatedResponse,
  ProjectStatus,
  TeamLeaderOptionResponse,
} from "@/types";

const PAGE_LIMIT = 9;

type ManagerProjectViewItem = ManagerProjectListItem & {
  teamLeaderName?: string | null;
};

// TODO: Replace when Sprint 4 is complete
const MOCK_PROJECTS: ManagerProjectViewItem[] = [
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
    teamLeaderName: "Hoàng Minh Tuấn",
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
    teamLeaderName: "Hoàng Minh Tuấn",
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
    teamLeaderName: "Lê Thu Trang",
  },
  {
    id: 4,
    projectCode: "PRJ-IT-004",
    name: "Migration legacy system",
    status: "PAUSED",
    totalBudget: 120_000_000,
    availableBudget: 45_000_000,
    totalSpent: 75_000_000,
    memberCount: 4,
    currentPhaseId: 5,
    currentPhaseName: "Phase 2 - Migration",
    createdAt: "2025-11-01T08:00:00",
    teamLeaderName: "Lê Thu Trang",
  },
];

// TODO: Replace when Sprint 4 is complete
const MOCK_TL_OPTIONS: TeamLeaderOptionResponse[] = [
  {
    id: 4,
    fullName: "Hoàng Minh Tuấn",
    employeeCode: "TL001",
    avatar: null,
    email: "tl.it@ifms.vn",
    jobTitle: "Team Leader IT",
  },
  {
    id: 6,
    fullName: "Lê Thu Trang",
    employeeCode: "TL002",
    avatar: null,
    email: "tl.infra@ifms.vn",
    jobTitle: "Team Leader Infra",
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function parsePage(value: string | null): number {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseStatus(value: string | null): ProjectStatus | undefined {
  if (!value) return undefined;
  const values = Object.values(ProjectStatus);
  return values.includes(value as ProjectStatus) ? (value as ProjectStatus) : undefined;
}

function statusLabel(status: string): string {
  switch (status) {
    case ProjectStatus.ACTIVE:
      return "Đang hoạt động";
    case ProjectStatus.PLANNING:
      return "Lập kế hoạch";
    case ProjectStatus.PAUSED:
      return "Tạm dừng";
    case ProjectStatus.CLOSED:
      return "Đã đóng";
    default:
      return status;
  }
}

function statusClass(status: string): string {
  switch (status) {
    case ProjectStatus.ACTIVE:
      return "bg-emerald-100 border-emerald-200 text-emerald-700";
    case ProjectStatus.PLANNING:
      return "bg-sky-100 border-sky-200 text-sky-700";
    case ProjectStatus.PAUSED:
      return "bg-amber-100 border-amber-200 text-amber-700";
    case ProjectStatus.CLOSED:
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

function pickItems<T>(payload: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(payload) ? payload : payload.items;
}

function normalizeProject(item: ManagerProjectListItem): ManagerProjectViewItem {
  const withLeader = item as ManagerProjectListItem & { teamLeaderName?: string | null };
  return {
    ...item,
    teamLeaderName: withLeader.teamLeaderName ?? null,
  };
}

function filterMock(
  source: ManagerProjectViewItem[],
  status?: ProjectStatus,
  search = ""
): ManagerProjectViewItem[] {
  const q = search.trim().toLowerCase();

  return source.filter((item) => {
    if (status && item.status !== status) return false;

    if (!q) return true;

    const haystack = `${item.projectCode} ${item.name} ${item.teamLeaderName ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });
}

export default function ManagerProjectsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsString = searchParams.toString();
  const statusFilter = useMemo(() => parseStatus(searchParams.get("status")), [searchParams]);
  const search = useMemo(() => searchParams.get("search") ?? "", [searchParams]);
  const page = useMemo(() => parsePage(searchParams.get("page")), [searchParams]);

  const [items, setItems] = useState<ManagerProjectViewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(search);

  const [teamLeaderOptions, setTeamLeaderOptions] = useState<TeamLeaderOptionResponse[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectBudget, setProjectBudget] = useState("");
  const [teamLeaderId, setTeamLeaderId] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const pushWithParams = useCallback(
    (params: URLSearchParams) => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router]
  );

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParamsString);
      if (value && value.trim()) {
        params.set(key, value.trim());
      } else {
        params.delete(key);
      }
      if (key !== "page") params.delete("page");
      pushWithParams(params);
    },
    [pushWithParams, searchParamsString]
  );

  const goToPage = useCallback(
    (nextPage: number) => {
      const params = new URLSearchParams(searchParamsString);
      if (nextPage <= 1) params.delete("page");
      else params.set("page", String(nextPage));
      pushWithParams(params);
    },
    [pushWithParams, searchParamsString]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed === search) return;
      updateParam("search", trimmed || undefined);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput, search, updateParam]);

  useEffect(() => {
    let cancelled = false;

    const loadTeamLeaders = async () => {
      try {
        const res = await api.get<TeamLeaderOptionResponse[]>("/api/v1/manager/department/team-leaders");
        if (cancelled) return;
        setTeamLeaderOptions(res.data);
      } catch {
        if (cancelled) return;
        setTeamLeaderOptions(MOCK_TL_OPTIONS);
      }
    };

    void loadTeamLeaders();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const filters: ManagerProjectFilterParams = {
          status: statusFilter,
          search: search.trim() || undefined,
          page,
          limit: PAGE_LIMIT,
        };

        const query = new URLSearchParams();
        if (filters.status) query.set("status", filters.status);
        if (filters.search) query.set("search", filters.search);
        query.set("page", String(filters.page ?? 1));
        query.set("limit", String(filters.limit ?? PAGE_LIMIT));

        const res = await api.get<PaginatedResponse<ManagerProjectListItem> | ManagerProjectListItem[]>(
          `/api/v1/manager/projects?${query.toString()}`
        );

        if (cancelled) return;

        const normalized = pickItems(res.data).map(normalizeProject);
        const apiTotal = Array.isArray(res.data) ? normalized.length : res.data.total;
        const apiTotalPages = Array.isArray(res.data)
          ? Math.max(1, Math.ceil(apiTotal / PAGE_LIMIT))
          : res.data.totalPages;

        setItems(normalized);
        setTotal(apiTotal);
        setTotalPages(apiTotalPages);
      } catch (err) {
        if (cancelled) return;

        const filtered = filterMock(MOCK_PROJECTS, statusFilter, search);
        const mockTotal = filtered.length;
        const mockTotalPages = Math.max(1, Math.ceil(mockTotal / PAGE_LIMIT));
        const safePage = Math.min(page, mockTotalPages);
        const start = (safePage - 1) * PAGE_LIMIT;

        setItems(filtered.slice(start, start + PAGE_LIMIT));
        setTotal(mockTotal);
        setTotalPages(mockTotalPages);

        if (safePage !== page) {
          goToPage(safePage);
        }

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải dữ liệu API, đang hiển thị dữ liệu mẫu.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [goToPage, page, search, statusFilter]);

  const statusTabs: { label: string; value?: ProjectStatus }[] = [
    { label: "Tất cả" },
    { label: "Đang hoạt động", value: ProjectStatus.ACTIVE },
    { label: "Lập kế hoạch", value: ProjectStatus.PLANNING },
    { label: "Tạm dừng", value: ProjectStatus.PAUSED },
    { label: "Đã đóng", value: ProjectStatus.CLOSED },
  ];

  const openCreateModal = () => {
    setProjectName("");
    setProjectDescription("");
    setProjectBudget("");
    setTeamLeaderId("");
    setNotice(null);
    setShowCreateModal(true);
  };

  const handleCreateProject = async () => {
    const budgetNumber = Number(projectBudget);
    const selectedTl = Number(teamLeaderId);

    if (!projectName.trim()) {
      setNotice("Tên dự án là bắt buộc.");
      return;
    }

    if (!Number.isFinite(budgetNumber) || budgetNumber <= 0) {
      setNotice("Tổng ngân sách phải lớn hơn 0.");
      return;
    }

    if (!Number.isFinite(selectedTl) || selectedTl <= 0) {
      setNotice("Vui lòng chọn Team Leader.");
      return;
    }

    setCreating(true);

    const body: CreateProjectBody = {
      name: projectName.trim(),
      description: projectDescription.trim() || undefined,
      totalBudget: budgetNumber,
      teamLeaderId: selectedTl,
    };

    const selectedTlName =
      teamLeaderOptions.find((option) => option.id === selectedTl)?.fullName ?? "Team Leader";

    try {
      const res = await api.post<ManagerProjectListItem>("/api/v1/manager/projects", body);

      const created = normalizeProject(res.data);
      created.teamLeaderName = created.teamLeaderName ?? selectedTlName;

      setItems((prev) => [created, ...prev].slice(0, PAGE_LIMIT));
      setTotal((prev) => prev + 1);
      setNotice("Đã tạo dự án mới.");
    } catch {
      const now = Date.now();
      const mockCreated: ManagerProjectViewItem = {
        id: now,
        projectCode: `PRJ-NEW-${String(now).slice(-4)}`,
        name: body.name,
        status: ProjectStatus.PLANNING,
        totalBudget: body.totalBudget,
        availableBudget: body.totalBudget,
        totalSpent: 0,
        memberCount: 1,
        currentPhaseId: null,
        currentPhaseName: null,
        createdAt: new Date().toISOString(),
        teamLeaderName: selectedTlName,
      };

      setItems((prev) => [mockCreated, ...prev].slice(0, PAGE_LIMIT));
      setTotal((prev) => prev + 1);
      setNotice("API chưa sẵn sàng, đã mô phỏng tạo dự án mới.");
    } finally {
      setCreating(false);
      setShowCreateModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dự án phòng ban</h1>
          <p className="text-slate-500 mt-1">Quản lý danh sách dự án, ngân sách và Team Leader phụ trách.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex w-fit px-3 py-1.5 rounded-full border border-blue-500/40 bg-blue-50 text-blue-700 text-sm font-medium">
            {total} dự án
          </span>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            Tạo dự án
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.value || (!statusFilter && !tab.value);

            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => updateParam("status", tab.value)}
                className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                  active
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-4.35-4.35m1.6-5.65a7.25 7.25 0 11-14.5 0 7.25 7.25 0 0114.5 0z"
            />
          </svg>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Tìm mã hoặc tên dự án..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={`manager-project-skeleton-${index}`} className="h-56 rounded-2xl bg-white animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </div>
          <p className="text-slate-600 mt-4">Không có dự án phù hợp bộ lọc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((project) => {
            const burn = burnPercent(project);

            return (
              <div
                key={project.id}
                className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-2xl p-4 transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-mono">{project.projectCode}</p>
                    <p className="text-base font-semibold text-slate-900 mt-1 truncate">{project.name}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${statusClass(project.status)}`}>
                    {statusLabel(project.status)}
                  </span>
                </div>

                <p className="text-sm text-slate-500">
                  Team Leader: {project.teamLeaderName ?? "Chưa gán"}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Budget burn</span>
                    <span>{burn}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white border border-slate-200 overflow-hidden">
                    <div className={`h-full ${burnClass(burn)}`} style={{ width: `${burn}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {formatCurrency(project.totalSpent)} / {formatCurrency(project.totalBudget)}
                    </span>
                    <span className="text-emerald-700">{formatCurrency(project.availableBudget)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/manager/projects/${project.id}`)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-sm text-slate-900"
                >
                  Xem chi tiết
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Trang {page}/{totalPages} • Tổng {total} dự án
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm transition-colors"
          >
            Trước
          </button>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm transition-colors"
          >
            Sau
          </button>
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

      {showCreateModal && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowCreateModal(false)}
            aria-label="Đóng modal tạo dự án"
          />

          <div className="absolute inset-x-0 top-10 mx-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Tạo dự án mới</h3>

            <div>
              <label className="block text-sm text-slate-600 mb-2">Tên dự án</label>
              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Nhập tên dự án"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-2">Mô tả</label>
              <textarea
                rows={4}
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
                placeholder="Mô tả dự án (tuỳ chọn)"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-2">Tổng ngân sách (VND)</label>
              <input
                type="number"
                min={1}
                value={projectBudget}
                onChange={(event) => setProjectBudget(event.target.value)}
                placeholder="Ví dụ: 100000000"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-2">Trưởng nhóm phụ trách</label>
              <select
                value={teamLeaderId}
                onChange={(event) => setTeamLeaderId(event.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="">Chọn Team Leader</option>
                {teamLeaderOptions.map((option) => (
                  <option key={option.id} value={String(option.id)}>
                    {option.fullName} ({option.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateProject}
                disabled={creating}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
              >
                {creating ? "Đang tạo..." : "Tạo dự án"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
