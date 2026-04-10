"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  AdminApprovalFilterParams,
  AdminApprovalListItem,
  CompanyFundResponse,
  PaginatedResponse,
  RequestStatus,
  RequestType,
} from "@/types";

const PAGE_LIMIT = 10;

// TODO: Replace when Sprint 6 is complete
const MOCK_APPROVALS: AdminApprovalListItem[] = [
  {
    id: 20,
    requestCode: "REQ-2026-0060",
    type: "DEPARTMENT_TOPUP",
    status: RequestStatus.PENDING,
    amount: 200_000_000,
    description:
      "Xin cấp thêm quota ngân sách cho phòng IT Q2/2026 - mở rộng headcount và nâng cấp hạ tầng.",
    requester: {
      id: 5,
      fullName: "Trần Thị Bích",
      avatar: null,
      employeeCode: "MGR001",
      jobTitle: "Manager IT",
      email: "manager.it@ifms.vn",
    },
    department: {
      id: 1,
      name: "Phòng Công nghệ thông tin",
      code: "IT",
      totalAvailableBalance: 80_000_000,
    },
    createdAt: "2026-04-02T09:00:00",
  },
  {
    id: 21,
    requestCode: "REQ-2026-0055",
    type: "DEPARTMENT_TOPUP",
    status: RequestStatus.PENDING,
    amount: 100_000_000,
    description: "Bổ sung ngân sách phòng Sales cho chiến dịch Q2.",
    requester: {
      id: 6,
      fullName: "Nguyễn Văn Tùng",
      avatar: null,
      employeeCode: "MGR002",
      jobTitle: "Manager Sales",
      email: "manager.sales@ifms.vn",
    },
    department: {
      id: 2,
      name: "Phòng Kinh doanh",
      code: "SALES",
      totalAvailableBalance: 35_000_000,
    },
    createdAt: "2026-04-01T11:00:00",
  },
];

// TODO: Replace when Sprint 6 is complete
const MOCK_SYSTEM_FUND_BALANCE = 1_248_500_000;

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

function filterMock(
  items: AdminApprovalListItem[],
  search = "",
): AdminApprovalListItem[] {
  const q = search.trim().toLowerCase();

  return items.filter((item) => {
    if (item.type !== RequestType.DEPARTMENT_TOPUP) return false;
    if (item.status !== RequestStatus.PENDING) return false;

    if (!q) return true;

    const haystack =
      `${item.requestCode} ${item.department.name} ${item.requester.fullName}`.toLowerCase();
    return haystack.includes(q);
  });
}

function pickItems<T>(payload: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(payload) ? payload : payload.items;
}

export default function CfoApprovalsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsString = searchParams.toString();
  const search = useMemo(
    () => searchParams.get("search") ?? "",
    [searchParams],
  );
  const page = useMemo(
    () => parsePage(searchParams.get("page")),
    [searchParams],
  );

  const [items, setItems] = useState<AdminApprovalListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [systemFundBalance, setSystemFundBalance] = useState(0);

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
    [pathname, router],
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
    [pushWithParams, searchParamsString],
  );

  const goToPage = useCallback(
    (nextPage: number) => {
      const params = new URLSearchParams(searchParamsString);
      if (nextPage <= 1) params.delete("page");
      else params.set("page", String(nextPage));
      pushWithParams(params);
    },
    [pushWithParams, searchParamsString],
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
        const filters: AdminApprovalFilterParams = {
          search: search.trim() || undefined,
          page,
          limit: PAGE_LIMIT,
        };

        const query = new URLSearchParams();
        if (filters.search) query.set("search", filters.search);
        query.set("page", String(filters.page ?? 1));
        query.set("limit", String(filters.limit ?? PAGE_LIMIT));

        const [approvalsRes, companyFundRes] = await Promise.all([
          api.get<
            PaginatedResponse<AdminApprovalListItem> | AdminApprovalListItem[]
          >(`/api/v1/cfo/approvals?${query.toString()}`),
          api.get<CompanyFundResponse>("/api/v1/company-fund"),
        ]);

        if (cancelled) return;

        const filteredItems = pickItems(approvalsRes.data).filter(
          (item) =>
            item.type === RequestType.DEPARTMENT_TOPUP &&
            item.status === RequestStatus.PENDING,
        );

        const apiTotal = Array.isArray(approvalsRes.data)
          ? filteredItems.length
          : approvalsRes.data.total;
        const apiTotalPages = Array.isArray(approvalsRes.data)
          ? Math.max(1, Math.ceil(apiTotal / PAGE_LIMIT))
          : approvalsRes.data.totalPages;

        setItems(filteredItems);
        setTotal(apiTotal);
        setTotalPages(apiTotalPages);
        setSystemFundBalance(companyFundRes.data.currentWalletBalance);
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
        setSystemFundBalance(MOCK_SYSTEM_FUND_BALANCE);

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

  const totalRequestedAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.amount, 0),
    [items],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Duyệt cấp quota ngân sách
          </h1>
          <p className="text-slate-400 mt-1">
            Flow 3: yêu cầu DEPARTMENT_TOPUP từ Manager chờ CFO duyệt.
          </p>
        </div>

        <span className="inline-flex w-fit px-3 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-300 text-sm font-medium">
          {total} chờ duyệt
        </span>
      </div>

      <div className="px-4 py-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm">
        Phê duyệt sẽ tự động chuyển tiền từ Quỹ hệ thống sang Quỹ phòng ban,
        không qua Kế toán.
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Quỹ hệ thống khả dụng</p>
            <p className="text-2xl font-bold text-white mt-1">
              {formatCurrency(systemFundBalance)}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3">
            <p className="text-xs text-slate-500">
              Tổng đề xuất trong trang hiện tại
            </p>
            <p className="text-sm font-semibold text-slate-100 mt-1">
              {formatCurrency(totalRequestedAmount)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-4">
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
            placeholder="Tìm theo mã yêu cầu, phòng ban, Manager..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div
              key={`cfo-approvals-skeleton-${index}`}
              className="h-44 rounded-2xl bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0l-2 7H6l-2-7m16 0H4"
              />
            </svg>
          </div>
          <p className="text-slate-300 mt-4">
            Không có yêu cầu DEPARTMENT_TOPUP chờ duyệt.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const deptCurrent = item.department.totalAvailableBalance;
            const deptAfter = deptCurrent + item.amount;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(`/cfo/approvals/${item.id}`)}
                className="w-full bg-slate-800 border border-white/10 hover:border-white/20 hover:bg-slate-700/40 rounded-2xl p-4 text-left transition-all"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex px-2 py-1 rounded-full border border-blue-500/30 bg-blue-500/15 text-blue-300">
                      Cấp quota
                    </span>
                    <span className="font-mono text-slate-300">
                      {item.requestCode}
                    </span>
                    <span className="text-slate-500">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">
                      {item.department.name}
                    </p>
                    <p className="text-sm text-slate-300">
                      {item.requester.fullName}
                      <span className="text-slate-500">
                        {" "}
                        • {item.requester.jobTitle ?? "Manager"}
                      </span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="rounded-xl border border-white/10 bg-slate-900 p-3">
                      <p className="text-xs text-slate-500">
                        Quỹ phòng ban hiện tại
                      </p>
                      <p className="text-sm font-semibold text-slate-100 mt-1">
                        {formatCurrency(deptCurrent)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-900 p-3">
                      <p className="text-xs text-slate-500">Số tiền đề xuất</p>
                      <p className="text-sm font-semibold text-blue-300 mt-1">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-900 p-3">
                      <p className="text-xs text-slate-500">Sau phê duyệt</p>
                      <p className="text-sm font-semibold text-emerald-300 mt-1">
                        {formatCurrency(deptAfter)}
                      </p>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm text-slate-400 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <span className="inline-flex w-fit px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-sm text-slate-200">
                      Xem chi tiết →
                    </span>
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
