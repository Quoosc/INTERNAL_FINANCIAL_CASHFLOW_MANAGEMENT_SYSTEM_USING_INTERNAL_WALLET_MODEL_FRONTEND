"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  ManagerDashboardResponse,
  ManagerDeptMemberDetailResponse,
  ManagerDeptMemberFilterParams,
  ManagerDeptMemberListItem,
  PaginatedResponse,
  RequestStatus,
} from "@/types";

const PAGE_LIMIT = 12;

type MemberRole = "TEAM_LEADER" | "EMPLOYEE";

type ManagerMemberView = ManagerDeptMemberListItem & {
  role: MemberRole;
  projectsCount: number;
};

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
const MOCK_MEMBERS: ManagerMemberView[] = [
  {
    id: 4,
    fullName: "Hoàng Minh Tuấn",
    email: "tl.it@ifms.vn",
    employeeCode: "TL001",
    avatar: null,
    jobTitle: "Team Leader IT",
    status: "ACTIVE",
    pendingRequestsCount: 1,
    debtBalance: 0,
    role: "TEAM_LEADER",
    projectsCount: 3,
  },
  {
    id: 11,
    fullName: "Đỗ Quốc Bảo",
    email: "emp.it1@ifms.vn",
    employeeCode: "EMP001",
    avatar: null,
    jobTitle: "Frontend Developer",
    status: "ACTIVE",
    pendingRequestsCount: 2,
    debtBalance: 2_500_000,
    role: "EMPLOYEE",
    projectsCount: 2,
  },
  {
    id: 12,
    fullName: "Vũ Thị Lan",
    email: "emp.it2@ifms.vn",
    employeeCode: "EMP002",
    avatar: null,
    jobTitle: "Backend Developer",
    status: "ACTIVE",
    pendingRequestsCount: 1,
    debtBalance: 0,
    role: "EMPLOYEE",
    projectsCount: 1,
  },
  {
    id: 13,
    fullName: "Phạm Văn Đức",
    email: "emp.it3@ifms.vn",
    employeeCode: "EMP003",
    avatar: null,
    jobTitle: "QA Engineer",
    status: "ACTIVE",
    pendingRequestsCount: 0,
    debtBalance: 1_200_000,
    role: "EMPLOYEE",
    projectsCount: 1,
  },
];

// TODO: Replace when Sprint 4-5 is complete
const MOCK_MEMBER_DETAIL: ManagerDeptMemberDetailResponse = {
  id: 11,
  fullName: "Đỗ Quốc Bảo",
  email: "emp.it1@ifms.vn",
  employeeCode: "EMP001",
  avatar: null,
  jobTitle: "Frontend Developer",
  phoneNumber: "0901234567",
  status: "ACTIVE",
  debtBalance: 2_500_000,
  pendingRequestsCount: 2,
  assignedProjects: [
    {
      projectId: 1,
      projectCode: "PRJ-IT-001",
      projectName: "Hệ thống quản lý nội bộ",
      projectRole: "MEMBER",
      position: "Frontend Developer",
    },
    {
      projectId: 3,
      projectCode: "PRJ-IT-003",
      projectName: "Nghiên cứu AI integration",
      projectRole: "MEMBER",
      position: "Frontend Developer",
    },
  ],
  recentRequests: [
    {
      id: 1001,
      requestCode: "REQ-2026-0041",
      type: "ADVANCE",
      amount: 3_500_000,
      status: RequestStatus.PENDING,
      createdAt: "2026-04-03T09:15:00",
    },
    {
      id: 1002,
      requestCode: "REQ-2026-0035",
      type: "EXPENSE",
      amount: 850_000,
      status: RequestStatus.PAID,
      createdAt: "2026-03-28T14:00:00",
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

function parsePage(value: string | null): number {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseRole(value: string | null): MemberRole | undefined {
  if (value === "TEAM_LEADER" || value === "EMPLOYEE") return value;
  return undefined;
}

function inferRole(member: ManagerDeptMemberListItem): MemberRole {
  const withRole = member as ManagerDeptMemberListItem & { role?: string };
  if (withRole.role === "TEAM_LEADER" || withRole.role === "EMPLOYEE") {
    return withRole.role;
  }

  const jobTitle = member.jobTitle?.toLowerCase() ?? "";
  return jobTitle.includes("team leader") ? "TEAM_LEADER" : "EMPLOYEE";
}

function normalizeMember(member: ManagerDeptMemberListItem): ManagerMemberView {
  const withCounts = member as ManagerDeptMemberListItem & { projectsCount?: number };
  return {
    ...member,
    role: inferRole(member),
    projectsCount: withCounts.projectsCount ?? 0,
  };
}

function filterMock(
  source: ManagerMemberView[],
  role?: MemberRole,
  search = ""
): ManagerMemberView[] {
  const q = search.trim().toLowerCase();

  return source.filter((item) => {
    if (role && item.role !== role) return false;

    if (!q) return true;

    const haystack = `${item.fullName} ${item.employeeCode} ${item.email}`.toLowerCase();
    return haystack.includes(q);
  });
}

function roleBadgeClass(role: MemberRole): string {
  return role === "TEAM_LEADER"
    ? "bg-indigo-100 border-indigo-200 text-indigo-700"
    : "bg-slate-100 border-slate-200 text-slate-600";
}

function statusBadgeClass(status: string): string {
  if (status === "ACTIVE") return "bg-emerald-100 border-emerald-200 text-emerald-700";
  if (status === "LOCKED") return "bg-rose-100 border-rose-200 text-rose-700";
  return "bg-slate-100 border-slate-200 text-slate-600";
}

export default function ManagerDepartmentPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsString = searchParams.toString();
  const search = useMemo(() => searchParams.get("search") ?? "", [searchParams]);
  const roleFilter = useMemo(() => parseRole(searchParams.get("role")), [searchParams]);
  const page = useMemo(() => parsePage(searchParams.get("page")), [searchParams]);

  const [deptDashboard, setDeptDashboard] = useState<ManagerDashboardResponse | null>(null);

  const [members, setMembers] = useState<ManagerMemberView[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(search);

  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ManagerDeptMemberDetailResponse | null>(null);

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

    const loadDeptBudget = async () => {
      try {
        const res = await api.get<ManagerDashboardResponse>("/api/v1/dashboard/manager");
        if (cancelled) return;
        setDeptDashboard(res.data);
      } catch {
        if (cancelled) return;
        setDeptDashboard(MOCK_DASHBOARD);
      }
    };

    void loadDeptBudget();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadMembers = async () => {
      setLoading(true);
      setError(null);

      try {
        const filters: ManagerDeptMemberFilterParams = {
          search: search.trim() || undefined,
          page,
          limit: PAGE_LIMIT,
        };

        const query = new URLSearchParams();
        if (filters.search) query.set("search", filters.search);
        if (roleFilter) query.set("role", roleFilter);
        query.set("page", String(filters.page ?? 1));
        query.set("limit", String(filters.limit ?? PAGE_LIMIT));

        const res = await api.get<PaginatedResponse<ManagerDeptMemberListItem> | ManagerDeptMemberListItem[]>(
          `/api/v1/manager/department/members?${query.toString()}`
        );

        if (cancelled) return;

        const normalized = (Array.isArray(res.data) ? res.data : res.data.items).map(normalizeMember);
        const filtered = roleFilter ? normalized.filter((item) => item.role === roleFilter) : normalized;

        const apiTotal = Array.isArray(res.data) ? filtered.length : res.data.total;
        const apiTotalPages = Array.isArray(res.data)
          ? Math.max(1, Math.ceil(apiTotal / PAGE_LIMIT))
          : res.data.totalPages;

        setMembers(filtered);
        setTotal(apiTotal);
        setTotalPages(apiTotalPages);
      } catch (err) {
        if (cancelled) return;

        const filtered = filterMock(MOCK_MEMBERS, roleFilter, search);
        const mockTotal = filtered.length;
        const mockTotalPages = Math.max(1, Math.ceil(mockTotal / PAGE_LIMIT));
        const safePage = Math.min(page, mockTotalPages);
        const start = (safePage - 1) * PAGE_LIMIT;

        setMembers(filtered.slice(start, start + PAGE_LIMIT));
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

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [goToPage, page, roleFilter, search]);

  const roleTabs: { label: string; value?: MemberRole }[] = [
    { label: "Tất cả" },
    { label: "Team Leader", value: "TEAM_LEADER" },
    { label: "Nhân viên", value: "EMPLOYEE" },
  ];

  const loadMemberDetail = async (memberId: number) => {
    setShowDetail(true);
    setDetailLoading(true);

    try {
      const res = await api.get<ManagerDeptMemberDetailResponse>(
        `/api/v1/manager/department/members/${memberId}`
      );
      setSelectedMember(res.data);
    } catch {
      const summary = members.find((member) => member.id === memberId);
      setSelectedMember({
        ...MOCK_MEMBER_DETAIL,
        id: memberId,
        fullName: summary?.fullName ?? MOCK_MEMBER_DETAIL.fullName,
        email: summary?.email ?? MOCK_MEMBER_DETAIL.email,
        employeeCode: summary?.employeeCode ?? MOCK_MEMBER_DETAIL.employeeCode,
        jobTitle: summary?.jobTitle ?? MOCK_MEMBER_DETAIL.jobTitle,
        status: summary?.status ?? MOCK_MEMBER_DETAIL.status,
        debtBalance: summary?.debtBalance ?? MOCK_MEMBER_DETAIL.debtBalance,
        pendingRequestsCount: summary?.pendingRequestsCount ?? MOCK_MEMBER_DETAIL.pendingRequestsCount,
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const totalQuota = deptDashboard?.departmentBudget.totalProjectQuota ?? 0;
  const availableBudget = deptDashboard?.departmentBudget.totalAvailableBalance ?? 0;
  const availablePercent = totalQuota > 0 ? Math.round((availableBudget / totalQuota) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Phòng ban của tôi</h1>
          <p className="text-slate-500 mt-1">Theo dõi thành viên, dư nợ và các hoạt động gần đây trong phòng ban.</p>
        </div>

        <span className="inline-flex w-fit px-3 py-1.5 rounded-full border border-blue-300 bg-blue-50 text-blue-700 text-sm font-medium">
          {total} thành viên
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm text-slate-600">
            Quỹ phòng ban khả dụng: <span className="font-semibold text-emerald-700">{formatCurrency(availableBudget)}</span>
            <span className="text-slate-500"> / {formatCurrency(totalQuota)}</span>
          </p>
          <span className="text-sm text-slate-500">{availablePercent}% khả dụng</span>
        </div>

        <div className="h-2 rounded-full bg-white border border-slate-200 overflow-hidden">
          <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, availablePercent)}%` }} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {roleTabs.map((tab) => {
            const active = roleFilter === tab.value || (!roleFilter && !tab.value);
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => updateParam("role", tab.value)}
                className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                  active
                    ? "bg-blue-100 border-blue-300 text-blue-700"
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
            placeholder="Tìm theo tên, mã nhân viên, email..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={`manager-members-skeleton-${index}`} className="h-48 rounded-2xl bg-white animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center text-slate-500">
          Không có thành viên phù hợp bộ lọc.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => loadMemberDetail(member.id)}
              className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-2xl p-4 text-left transition-all space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{member.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {member.jobTitle ?? "—"} • {member.employeeCode}
                  </p>
                </div>

                <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${roleBadgeClass(member.role)}`}>
                  {member.role === "TEAM_LEADER" ? "Team Leader" : "Nhân viên"}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${statusBadgeClass(member.status)}`}>
                  {member.status}
                </span>

                {member.debtBalance > 0 && (
                  <span className="inline-flex px-2 py-1 rounded-full border border-rose-200 bg-rose-100 text-rose-700 text-xs">
                    Dư nợ {formatCurrency(member.debtBalance)}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500">
                {member.projectsCount} dự án • {member.pendingRequestsCount} yêu cầu chờ xử lý
              </p>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Trang {page}/{totalPages} • Tổng {total} thành viên
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

      {showDetail && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowDetail(false)}
            aria-label="Đóng panel chi tiết thành viên"
          />

          <div className="absolute right-0 top-0 h-full w-full max-w-[400px] bg-white border-l border-slate-200 p-5 overflow-y-auto">
            {detailLoading || !selectedMember ? (
              <div className="space-y-3">
                <div className="h-10 rounded bg-white animate-pulse" />
                <div className="h-24 rounded bg-white animate-pulse" />
                <div className="h-40 rounded bg-white animate-pulse" />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selectedMember.fullName}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedMember.employeeCode} • {selectedMember.jobTitle ?? "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDetail(false)}
                    className="text-slate-500 hover:text-slate-900"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-sm text-slate-600 space-y-1">
                  <p>{selectedMember.email}</p>
                  <p>{selectedMember.phoneNumber ?? "Chưa cập nhật số điện thoại"}</p>
                  <p className={selectedMember.debtBalance > 0 ? "text-rose-700 font-medium" : "text-emerald-700"}>
                    Dư nợ: {formatCurrency(selectedMember.debtBalance)}
                  </p>
                </div>

                <section className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-900">Dự án tham gia</h4>
                  {selectedMember.assignedProjects.length === 0 ? (
                    <p className="text-xs text-slate-500">Chưa có dữ liệu dự án.</p>
                  ) : (
                    selectedMember.assignedProjects.map((project) => (
                      <div
                        key={`${project.projectId}-${project.projectRole}`}
                        className="rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <p className="text-sm text-slate-900">
                          {project.projectCode} • {project.projectName}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {project.projectRole} • {project.position}
                        </p>
                      </div>
                    ))
                  )}
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-900">Yêu cầu gần đây</h4>
                  {selectedMember.recentRequests.length === 0 ? (
                    <p className="text-xs text-slate-500">Không có yêu cầu gần đây.</p>
                  ) : (
                    selectedMember.recentRequests.map((request) => (
                      <div key={request.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono text-slate-600">{request.requestCode}</span>
                          <span className="text-xs text-slate-500">{request.type}</span>
                        </div>
                        <p className="text-sm text-slate-900">{formatCurrency(request.amount)}</p>
                        <p className="text-xs text-slate-500">
                          {request.status} • {formatDateTime(request.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
