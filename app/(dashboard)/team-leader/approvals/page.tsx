"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  PaginatedResponse,
  RequestStatus,
  RequestType,
  TLApprovalListItem,
} from "@/types";

const PAGE_LIMIT = 10;

// TODO: Replace when Sprint 4-5 is complete
const MOCK_APPROVALS: TLApprovalListItem[] = [
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
    project: { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ" },
    phase: {
      id: 1,
      phaseCode: "PH-001",
      name: "Phase 1 - Phân tích",
      budgetLimit: 50_000_000,
      currentSpent: 47_000_000,
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
    project: { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ" },
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
    project: { id: 2, projectCode: "PRJ-IT-002", name: "Nâng cấp hạ tầng mạng" },
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
  {
    id: 4,
    requestCode: "REQ-2026-0038",
    type: RequestType.ADVANCE,
    status: RequestStatus.PENDING,
    amount: 5_000_000,
    description: "Ứng trước chi phí đào tạo nội bộ",
    requester: {
      id: 13,
      fullName: "Phạm Văn Đức",
      avatar: null,
      employeeCode: "EMP003",
      jobTitle: "QA Engineer",
      email: "emp.sales1@ifms.vn",
    },
    project: { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ" },
    phase: {
      id: 2,
      phaseCode: "PH-002",
      name: "Phase 2 - Phát triển",
      budgetLimit: 80_000_000,
      currentSpent: 31_000_000,
    },
    category: { id: 4, name: "Đào tạo & Phát triển" },
    attachments: [],
    createdAt: "2026-03-31T11:00:00",
  },
  {
    id: 5,
    requestCode: "REQ-2026-0035",
    type: RequestType.EXPENSE,
    status: RequestStatus.PENDING,
    amount: 2_300_000,
    description: "Mua sách tham khảo kỹ thuật",
    requester: {
      id: 12,
      fullName: "Vũ Thị Lan",
      avatar: null,
      employeeCode: "EMP002",
      jobTitle: "Backend Developer",
      email: "emp.it2@ifms.vn",
    },
    project: { id: 2, projectCode: "PRJ-IT-002", name: "Nâng cấp hạ tầng mạng" },
    phase: {
      id: 3,
      phaseCode: "PH-001",
      name: "Phase 1 - Triển khai",
      budgetLimit: 30_000_000,
      currentSpent: 8_500_000,
    },
    category: { id: 5, name: "Tài liệu & In ấn" },
    attachments: [],
    createdAt: "2026-03-29T16:45:00",
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(-2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function getTypeClass(type: RequestType): string {
  switch (type) {
    case RequestType.ADVANCE:
      return "bg-violet-500/15 border-violet-500/30 text-violet-300";
    case RequestType.EXPENSE:
      return "bg-sky-500/15 border-sky-500/30 text-sky-300";
    case RequestType.REIMBURSE:
      return "bg-amber-500/15 border-amber-500/30 text-amber-300";
    default:
      return "bg-slate-500/15 border-slate-500/30 text-slate-300";
  }
}

function getTypeLabel(type: RequestType): string {
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

function parseType(value: string | null): RequestType | undefined {
  if (!value) return undefined;
  const valid = [RequestType.ADVANCE, RequestType.EXPENSE, RequestType.REIMBURSE];
  return valid.includes(value as RequestType) ? (value as RequestType) : undefined;
}

function parsePage(value: string | null): number {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function filterMock(source: TLApprovalListItem[], type?: RequestType, search = ""): TLApprovalListItem[] {
  const q = search.trim().toLowerCase();
  return source.filter((item) => {
    if (item.status !== RequestStatus.PENDING) return false;
    if (type && item.type !== type) return false;
    if (q) {
      const haystack = `${item.requestCode} ${item.requester.fullName}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export default function TLApprovalsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsString = searchParams.toString();
  const typeFilter = useMemo(() => parseType(searchParams.get("type")), [searchParams]);
  const search = useMemo(() => searchParams.get("search") ?? "", [searchParams]);
  const page = useMemo(() => parsePage(searchParams.get("page")), [searchParams]);

  const [items, setItems] = useState<TLApprovalListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      if (nextPage <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(nextPage));
      }
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

    const loadApprovals = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams();
        if (typeFilter) query.set("type", typeFilter);
        if (search.trim()) query.set("search", search.trim());
        query.set("page", String(page));
        query.set("limit", String(PAGE_LIMIT));

        const res = await api.get<PaginatedResponse<TLApprovalListItem>>(
          `/api/v1/team-leader/approvals?${query.toString()}`
        );

        if (cancelled) return;

        setItems(res.data.items.filter((item) => item.status === RequestStatus.PENDING));
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        if (cancelled) return;

        const filtered = filterMock(MOCK_APPROVALS, typeFilter, search);
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

    void loadApprovals();

    return () => {
      cancelled = true;
    };
  }, [goToPage, page, search, typeFilter]);

  const typeTabs: { label: string; value?: RequestType }[] = [
    { label: "Tất cả" },
    { label: "Tạm ứng", value: RequestType.ADVANCE },
    { label: "Chi phí", value: RequestType.EXPENSE },
    { label: "Hoàn ứng", value: RequestType.REIMBURSE },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Duyệt yêu cầu</h1>
          <p className="text-slate-400 mt-1">Danh sách yêu cầu Flow 1 đang chờ Trưởng nhóm phê duyệt.</p>
        </div>
        <span className="inline-flex w-fit px-3 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-300 text-sm font-medium">
          {total} chờ duyệt
        </span>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {typeTabs.map((tab) => {
            const active = typeFilter === tab.value || (!typeFilter && !tab.value);
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => updateParam("type", tab.value)}
                className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                  active
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                    : "bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-700"
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35m1.6-5.65a7.25 7.25 0 11-14.5 0 7.25 7.25 0 0114.5 0z" />
          </svg>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Tìm mã YC, tên nhân viên..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={`skeleton-${index}`} className="h-36 rounded-2xl bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0l-2 7H6l-2-7m16 0H4" />
            </svg>
          </div>
          <p className="text-slate-300 mt-4">Không có yêu cầu nào đang chờ duyệt</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const projectedSpent = item.phase.currentSpent + item.amount;
            const overBudget = projectedSpent > item.phase.budgetLimit;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(`/team-leader/approvals/${item.id}`)}
                className="w-full bg-slate-800 border border-white/10 hover:border-white/20 hover:bg-slate-700/40 rounded-2xl p-4 text-left transition-all"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`inline-flex px-2 py-1 rounded-full border ${getTypeClass(item.type)}`}>
                      {getTypeLabel(item.type)}
                    </span>
                    <span className="font-mono text-slate-300">{item.requestCode}</span>
                    <span className="text-slate-500">{formatRelativeTime(item.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-900 border border-white/10 text-slate-200 flex items-center justify-center text-xs font-semibold">
                      {getInitials(item.requester.fullName)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.requester.fullName}</p>
                      <p className="text-xs text-slate-500">{item.requester.employeeCode}</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300">
                    {item.project.name} <span className="text-slate-500">/</span> {item.phase.name} <span className="text-slate-500">/</span> {item.category.name}
                  </p>

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      {overBudget ? (
                        <p className="text-sm text-rose-300 font-medium">⚠ Vượt ngân sách phase</p>
                      ) : (
                        <p className="text-sm text-emerald-300">Ngân sách phase còn an toàn</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        {formatCurrency(item.phase.currentSpent)} + {formatCurrency(item.amount)} / {formatCurrency(item.phase.budgetLimit)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold text-white">{formatCurrency(item.amount)}</p>
                      <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-sm text-slate-200">
                        Chi tiết →
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Trang {page}/{totalPages} • Tổng {total} yêu cầu
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors"
          >
            Trước
          </button>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors"
          >
            Sau
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
