"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  ManagerApprovalFilterParams,
  ManagerApprovalListItem,
  PaginatedResponse,
  RequestStatus,
  RequestType,
} from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { CardListSkeleton } from "@/components/ui/skeleton";

const PAGE_LIMIT = 10;

// TODO: Replace when Sprint 4-5 is complete
const MOCK_APPROVALS: ManagerApprovalListItem[] = [
  {
    id: 10,
    requestCode: "REQ-2026-0050",
    type: RequestType.PROJECT_TOPUP,
    status: RequestStatus.PENDING,
    amount: 50_000_000,
    description: "Xin cấp vốn bổ sung Phase 2 - nhóm IT thiếu ngân sách phát triển module báo cáo",
    requester: {
      id: 4,
      fullName: "Hoàng Minh Tuấn",
      avatar: null,
      employeeCode: "TL001",
      jobTitle: "Team Leader IT",
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
    description: "Cấp vốn phase triển khai - mua thêm server và license phần mềm",
    requester: {
      id: 4,
      fullName: "Hoàng Minh Tuấn",
      avatar: null,
      employeeCode: "TL001",
      jobTitle: "Team Leader IT",
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
  {
    id: 12,
    requestCode: "REQ-2026-0045",
    type: RequestType.PROJECT_TOPUP,
    status: RequestStatus.PENDING,
    amount: 9_000_000,
    description: "Topup dự phòng cho giai đoạn test hiệu năng",
    requester: {
      id: 6,
      fullName: "Lê Thu Trang",
      avatar: null,
      employeeCode: "TL002",
      jobTitle: "Team Leader Infra",
      email: "tl.infra@ifms.vn",
    },
    project: {
      id: 3,
      projectCode: "PRJ-IT-003",
      name: "Nghiên cứu AI integration",
      availableBudget: 15_000_000,
    },
    createdAt: "2026-04-01T08:45:00",
  },
];



function parsePage(value: string | null): number {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function filterMock(items: ManagerApprovalListItem[], search = ""): ManagerApprovalListItem[] {
  const q = search.trim().toLowerCase();
  return items.filter((item) => {
    if (item.type !== RequestType.PROJECT_TOPUP) return false;
    if (item.status !== RequestStatus.PENDING) return false;

    if (!q) return true;

    const haystack = `${item.requestCode} ${item.requester.fullName} ${item.project.projectCode} ${item.project.name}`.toLowerCase();
    return haystack.includes(q);
  });
}

function pickItems<T>(payload: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(payload) ? payload : payload.items;
}

export default function ManagerApprovalsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsString = searchParams.toString();
  const search = useMemo(() => searchParams.get("search") ?? "", [searchParams]);
  const page = useMemo(() => parsePage(searchParams.get("page")), [searchParams]);

  const [items, setItems] = useState<ManagerApprovalListItem[]>([]);
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

    const loadApprovals = async () => {
      setLoading(true);
      setError(null);

      try {
        const filters: ManagerApprovalFilterParams = {
          search: search.trim() || undefined,
          page,
          limit: PAGE_LIMIT,
        };

        const query = new URLSearchParams();
        if (filters.search) query.set("search", filters.search);
        query.set("page", String(filters.page ?? 1));
        query.set("limit", String(filters.limit ?? PAGE_LIMIT));

        const res = await api.get<PaginatedResponse<ManagerApprovalListItem> | ManagerApprovalListItem[]>(
          `/api/v1/manager/approvals?${query.toString()}`
        );

        if (cancelled) return;

        const filteredItems = pickItems(res.data).filter(
          (item) =>
            item.type === RequestType.PROJECT_TOPUP &&
            item.status === RequestStatus.PENDING
        );

        const apiTotal = Array.isArray(res.data) ? filteredItems.length : res.data.total;
        const apiTotalPages = Array.isArray(res.data)
          ? Math.max(1, Math.ceil(apiTotal / PAGE_LIMIT))
          : res.data.totalPages;

        setItems(filteredItems);
        setTotal(apiTotal);
        setTotalPages(apiTotalPages);
      } catch (err) {
        if (cancelled) return;

        const filtered = filterMock(MOCK_APPROVALS, search);
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
  }, [goToPage, page, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Duyệt cấp vốn dự án</h1>
          <p className="text-slate-500 mt-1">Flow 2: chỉ xử lý PROJECT_TOPUP từ Team Leaders.</p>
        </div>
        <span className="inline-flex w-fit px-3 py-1.5 rounded-full border border-amber-300 bg-amber-100 text-amber-700 text-sm font-medium">
          {total} chờ duyệt
        </span>
      </div>

      <div className="px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm">
        Phê duyệt sẽ tự động cấp vốn từ quỹ phòng ban sang dự án, không cần qua Kế toán.
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
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
            placeholder="Tìm theo mã yêu cầu, dự án, Team Leader..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      {loading ? (
        <CardListSkeleton rows={5} height="h-44" />
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0l-2 7H6l-2-7m16 0H4"
              />
            </svg>
          </div>
          <p className="text-slate-600 mt-4">Không có yêu cầu PROJECT_TOPUP chờ duyệt.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const overBudget = item.amount > item.project.availableBudget;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(`/manager/approvals/${item.id}`)}
                className="w-full bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-2xl p-4 text-left transition-all"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex px-2 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                      Cấp vốn DA
                    </span>
                    <span className="font-mono text-slate-600">{item.requestCode}</span>
                    <span className="text-slate-500">{formatDateTime(item.createdAt)}</span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{item.requester.fullName}</p>
                    <p className="text-sm text-slate-600">
                      {item.project.name} <span className="text-slate-500">({item.project.projectCode})</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Ngân sách DA hiện có: {formatCurrency(item.project.availableBudget)}
                    </p>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-slate-900">{formatCurrency(item.amount)}</p>
                      {overBudget && (
                        <p className="text-sm text-rose-700 font-medium">Vượt ngân sách DA</p>
                      )}
                    </div>

                    <span className="inline-flex w-fit px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-900">
                      Xem chi tiết →
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-sm text-slate-500 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Trang {page}/{totalPages} • Tổng {total} yêu cầu
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
    </div>
  );
}
