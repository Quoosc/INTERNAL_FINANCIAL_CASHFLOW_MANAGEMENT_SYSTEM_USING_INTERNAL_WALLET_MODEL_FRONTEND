"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  PaginatedResponse,
  RequestStatus,
  RequestType,
  TLTeamMemberDetailResponse,
  TLTeamMemberListItem,
} from "@/types";

const PAGE_LIMIT = 20;

// TODO: Replace when Sprint 5 is complete
const MOCK_MEMBERS: TLTeamMemberListItem[] = [
  {
    id: 11,
    fullName: "Đỗ Quốc Bảo",
    email: "emp.it1@ifms.vn",
    employeeCode: "EMP001",
    avatar: null,
    jobTitle: "Frontend Developer",
    status: "ACTIVE",
    debtBalance: 2_500_000,
    pendingRequestsCount: 2,
    projects: [
      { projectId: 1, projectCode: "PRJ-IT-001", projectName: "Hệ thống quản lý nội bộ", position: "Tech Lead" },
      { projectId: 2, projectCode: "PRJ-IT-002", projectName: "Nâng cấp hạ tầng mạng", position: "Developer" },
    ],
  },
  {
    id: 12,
    fullName: "Vũ Thị Lan",
    email: "emp.it2@ifms.vn",
    employeeCode: "EMP002",
    avatar: null,
    jobTitle: "Backend Developer",
    status: "ACTIVE",
    debtBalance: 0,
    pendingRequestsCount: 1,
    projects: [
      { projectId: 1, projectCode: "PRJ-IT-001", projectName: "Hệ thống quản lý nội bộ", position: "Backend Developer" },
    ],
  },
  {
    id: 13,
    fullName: "Phạm Văn Đức",
    email: "emp.sales1@ifms.vn",
    employeeCode: "EMP003",
    avatar: null,
    jobTitle: "QA Engineer",
    status: "ACTIVE",
    debtBalance: 1_200_000,
    pendingRequestsCount: 0,
    projects: [
      { projectId: 1, projectCode: "PRJ-IT-001", projectName: "Hệ thống quản lý nội bộ", position: "QA" },
    ],
  },
];

// TODO: Replace when Sprint 5 is complete
const MOCK_MEMBER_DETAIL: TLTeamMemberDetailResponse = {
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
  projects: [
    { projectId: 1, projectCode: "PRJ-IT-001", projectName: "Hệ thống quản lý nội bộ", position: "Tech Lead", joinedAt: "2026-01-10T08:00:00" },
    { projectId: 2, projectCode: "PRJ-IT-002", projectName: "Nâng cấp hạ tầng mạng", position: "Developer", joinedAt: "2026-02-15T08:00:00" },
  ],
  recentRequests: [
    { id: 1, requestCode: "REQ-2026-0041", type: RequestType.ADVANCE, amount: 3_500_000, status: RequestStatus.PENDING, projectCode: "PRJ-IT-001", categoryName: "Thiết bị", createdAt: "2026-04-03T09:15:00" },
    { id: 2, requestCode: "REQ-2026-0035", type: RequestType.EXPENSE, amount: 850_000, status: RequestStatus.PAID, projectCode: "PRJ-IT-001", categoryName: "Công tác", createdAt: "2026-03-28T14:00:00" },
  ],
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function parsePage(v: string | null): number {
  const n = Number(v ?? "1");
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function initials(name: string): string {
  return name.split(/\s+/).slice(-2).map((x) => x[0]?.toUpperCase() ?? "").join("");
}

function avatarColor(id: number): string {
  const colors = ["bg-sky-600", "bg-emerald-600", "bg-amber-600", "bg-indigo-600", "bg-rose-600"];
  return colors[id % colors.length];
}

function typeBadge(type: RequestType): string {
  if (type === RequestType.ADVANCE) return "bg-violet-500/15 border-violet-500/30 text-violet-300";
  if (type === RequestType.EXPENSE) return "bg-sky-500/15 border-sky-500/30 text-sky-300";
  return "bg-amber-500/15 border-amber-500/30 text-amber-300";
}

function statusBadge(status: string): string {
  if (status === "ACTIVE") return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
  if (status === "LOCKED") return "bg-rose-500/15 border-rose-500/30 text-rose-300";
  return "bg-slate-500/15 border-slate-500/30 text-slate-300";
}

function filterMock(source: TLTeamMemberListItem[], search: string, projectId: string): TLTeamMemberListItem[] {
  const q = search.trim().toLowerCase();
  return source.filter((m) => {
    if (projectId && !m.projects.some((p) => String(p.projectId) === projectId)) return false;
    if (q) {
      const haystack = `${m.fullName} ${m.employeeCode} ${m.email}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export default function TLTeamPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsString = searchParams.toString();
  const search = searchParams.get("search") ?? "";
  const projectFilter = searchParams.get("projectId") ?? "";
  const page = parsePage(searchParams.get("page"));

  const [members, setMembers] = useState<TLTeamMemberListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMember, setSelectedMember] = useState<TLTeamMemberDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const [searchInput, setSearchInput] = useState(search);

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
      if (value && value.trim()) params.set(key, value.trim());
      else params.delete(key);
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
    const t = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed === search) return;
      updateParam("search", trimmed || undefined);
    }, 300);
    return () => {
      window.clearTimeout(t);
    };
  }, [searchInput, search, updateParam]);

  useEffect(() => {
    let cancelled = false;
    const loadMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        if (search.trim()) query.set("search", search.trim());
        if (projectFilter) query.set("projectId", projectFilter);
        query.set("page", String(page));
        query.set("limit", String(PAGE_LIMIT));

        const res = await api.get<PaginatedResponse<TLTeamMemberListItem>>(`/api/v1/team-leader/team-members?${query.toString()}`);
        if (cancelled) return;
        setMembers(res.data.items);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        if (cancelled) return;
        const filtered = filterMock(MOCK_MEMBERS, search, projectFilter);
        const mockTotal = filtered.length;
        const mockTotalPages = Math.max(1, Math.ceil(mockTotal / PAGE_LIMIT));
        const safePage = Math.min(page, mockTotalPages);
        const start = (safePage - 1) * PAGE_LIMIT;
        setMembers(filtered.slice(start, start + PAGE_LIMIT));
        setTotal(mockTotal);
        setTotalPages(mockTotalPages);
        if (safePage !== page) goToPage(safePage);
        if (err instanceof ApiError) setError(err.apiMessage);
        else setError("Không thể tải API, đang hiển thị dữ liệu mẫu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadMembers();
    return () => {
      cancelled = true;
    };
  }, [goToPage, page, projectFilter, search]);

  const projectOptions = useMemo(() => {
    const map = new Map<number, string>();
    [...members, ...MOCK_MEMBERS].forEach((m) => {
      m.projects.forEach((p) => map.set(p.projectId, `${p.projectCode} - ${p.projectName}`));
    });
    return [...map.entries()].map(([id, label]) => ({ id, label }));
  }, [members]);

  const loadMemberDetail = async (userId: number) => {
    setShowDetail(true);
    setDetailLoading(true);
    try {
      const res = await api.get<TLTeamMemberDetailResponse>(`/api/v1/team-leader/team-members/${userId}`);
      setSelectedMember(res.data);
    } catch {
      const member = members.find((m) => m.id === userId);
      setSelectedMember({
        ...MOCK_MEMBER_DETAIL,
        id: userId,
        fullName: member?.fullName ?? MOCK_MEMBER_DETAIL.fullName,
        employeeCode: member?.employeeCode ?? MOCK_MEMBER_DETAIL.employeeCode,
        email: member?.email ?? MOCK_MEMBER_DETAIL.email,
        jobTitle: member?.jobTitle ?? MOCK_MEMBER_DETAIL.jobTitle,
        debtBalance: member?.debtBalance ?? MOCK_MEMBER_DETAIL.debtBalance,
        pendingRequestsCount: member?.pendingRequestsCount ?? MOCK_MEMBER_DETAIL.pendingRequestsCount,
        projects: member
          ? member.projects.map((p) => ({ ...p, joinedAt: new Date().toISOString() }))
          : MOCK_MEMBER_DETAIL.projects,
      });
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Thành viên nhóm</h1>
          <p className="text-slate-400 mt-1">Theo dõi thông tin và tình trạng tài chính của thành viên trong nhóm.</p>
        </div>
        <span className="inline-flex w-fit px-3 py-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/15 text-indigo-300 text-sm font-medium">{total} thành viên</span>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Tìm theo tên, mã, email..." className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 placeholder-slate-500 text-sm" />
        <select value={projectFilter} onChange={(e) => updateParam("projectId", e.target.value || undefined)} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 text-sm">
          <option value="">Tất cả dự án</option>
          {projectOptions.map((opt) => (
            <option key={opt.id} value={String(opt.id)}>{opt.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, idx) => <div key={idx} className="h-44 rounded-2xl bg-slate-800 animate-pulse" />)}
        </div>
      ) : members.length === 0 ? (
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-12 text-center text-slate-400">Không có thành viên phù hợp bộ lọc.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {members.map((m) => (
            <button key={m.id} type="button" onClick={() => loadMemberDetail(m.id)} className="bg-slate-800 border border-white/10 hover:border-white/20 hover:bg-slate-700/40 rounded-2xl p-4 text-left transition-all space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full ${avatarColor(m.id)} text-white font-semibold text-sm flex items-center justify-center`}>{initials(m.fullName)}</div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{m.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">{m.jobTitle ?? "—"} • {m.employeeCode}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${statusBadge(m.status)}`}>{m.status}</span>
                {m.debtBalance > 0 && <span className="inline-flex px-2 py-1 rounded-full border border-rose-500/30 bg-rose-500/15 text-rose-300 text-xs">Dư nợ {formatCurrency(m.debtBalance)}</span>}
                {m.pendingRequestsCount > 0 && <span className="inline-flex px-2 py-1 rounded-full border border-amber-500/30 bg-amber-500/15 text-amber-300 text-xs">{m.pendingRequestsCount} chờ duyệt</span>}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {m.projects.slice(0, 2).map((p) => (
                  <span key={p.projectId} className="inline-flex px-2 py-1 rounded-full border border-white/10 bg-slate-900 text-slate-300 text-xs">{p.projectCode}</span>
                ))}
                {m.projects.length > 2 && <span className="inline-flex px-2 py-1 rounded-full border border-white/10 bg-slate-900 text-slate-400 text-xs">... +{m.projects.length - 2}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Trang {page}/{totalPages} • Tổng {total} thành viên</p>
        <div className="flex items-center gap-2">
          <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm">Trước</button>
          <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm">Sau</button>
        </div>
      </div>

      {error && <div className="px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm">{error}</div>}

      {showDetail && (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/60" onClick={() => setShowDetail(false)} aria-label="Đóng panel" />
          <div className="absolute right-0 top-0 h-full w-full max-w-[400px] bg-slate-900 border-l border-white/10 p-5 overflow-y-auto">
            {detailLoading || !selectedMember ? (
              <div className="space-y-3">
                <div className="h-10 rounded bg-slate-800 animate-pulse" />
                <div className="h-24 rounded bg-slate-800 animate-pulse" />
                <div className="h-40 rounded bg-slate-800 animate-pulse" />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full ${avatarColor(selectedMember.id)} text-white font-semibold text-sm flex items-center justify-center`}>{initials(selectedMember.fullName)}</div>
                    <div>
                      <p className="text-sm font-semibold text-white">{selectedMember.fullName}</p>
                      <p className="text-xs text-slate-500">{selectedMember.employeeCode} • {selectedMember.jobTitle ?? "—"}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowDetail(false)} className="text-slate-500 hover:text-white">✕</button>
                </div>

                <div className="text-sm text-slate-300 space-y-1">
                  <p>{selectedMember.email}</p>
                  <p>{selectedMember.phoneNumber ?? "Chưa cập nhật số điện thoại"}</p>
                  <p className={selectedMember.debtBalance > 0 ? "text-rose-300 font-medium" : "text-emerald-300"}>Dư nợ: {formatCurrency(selectedMember.debtBalance)}</p>
                </div>

                <section className="space-y-2">
                  <h4 className="text-sm font-semibold text-white">Dự án tham gia</h4>
                  {selectedMember.projects.map((p) => (
                    <div key={`${p.projectId}-${p.position}`} className="rounded-lg border border-white/10 bg-slate-800 p-3">
                      <p className="text-sm text-white">{p.projectCode} • {p.projectName}</p>
                      <p className="text-xs text-slate-500 mt-1">{p.position} • {formatDateTime(p.joinedAt)}</p>
                    </div>
                  ))}
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-semibold text-white">Yêu cầu gần đây</h4>
                  {selectedMember.recentRequests.map((r) => (
                    <div key={r.id} className="rounded-lg border border-white/10 bg-slate-800 p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-slate-300">{r.requestCode}</span>
                        <span className={`inline-flex px-2 py-1 rounded-full border text-[11px] ${typeBadge(r.type)}`}>{r.type}</span>
                      </div>
                      <p className="text-sm text-white">{formatCurrency(r.amount)}</p>
                      <p className="text-xs text-slate-500">{r.status} • {formatDateTime(r.createdAt)}</p>
                    </div>
                  ))}
                </section>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
