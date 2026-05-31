"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import { useToast } from "@/contexts/toast-context";
import {
  AdminApprovalFilterParams,
  AdminApprovalListItem,
  CompanyFundResponse,
  PaginatedResponse,
  RequestStatus,
  RequestType,
} from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { CardListSkeleton } from "@/components/ui/skeleton";

const PAGE_LIMIT = 10;

function parsePage(value: string | null): number {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function pickItems<T>(payload: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(payload) ? payload : payload.items;
}

export default function CfoApprovalsPage() {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsString = searchParams.toString();
  const search = useMemo(() => searchParams.get("search") ?? "", [searchParams]);
  const page = useMemo(() => parsePage(searchParams.get("page")), [searchParams]);

  const [items, setItems] = useState<AdminApprovalListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [systemFundBalance, setSystemFundBalance] = useState(0);

  const [loading, setLoading] = useState(true);
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

      try {
        const filters: AdminApprovalFilterParams = {
          search: search.trim() || undefined,
          page,
          limit: PAGE_LIMIT,
        };

        const query = new URLSearchParams();
        if (filters.search) query.set("search", filters.search);
        query.set("page", String(Math.max(0, (filters.page ?? 1) - 1)));
        query.set("size", String(filters.limit ?? PAGE_LIMIT));

        const [approvalsRes, companyFundRes] = await Promise.all([
          api.get<PaginatedResponse<AdminApprovalListItem> | AdminApprovalListItem[]>(
            `/api/v1/cfo/approvals?${query.toString()}`
          ),
          api.get<CompanyFundResponse>("/api/v1/company-fund"),
        ]);

        if (cancelled) return;

        const filteredItems = pickItems(approvalsRes.data).filter(
          (item) => item.type === RequestType.DEPARTMENT_TOPUP && item.status === RequestStatus.PENDING
        );

        const apiTotal = Array.isArray(approvalsRes.data) ? filteredItems.length : approvalsRes.data.total;
        const apiTotalPages = Array.isArray(approvalsRes.data)
          ? Math.max(1, Math.ceil(apiTotal / PAGE_LIMIT))
          : approvalsRes.data.totalPages;

        setItems(filteredItems);
        setTotal(apiTotal);
        setTotalPages(apiTotalPages);
        setSystemFundBalance(companyFundRes.data.currentWalletBalance);
      } catch (err) {
        if (cancelled) return;
        setItems([]);
        setTotal(0);
        setTotalPages(1);
        setSystemFundBalance(0);
        toast.error(err instanceof ApiError ? err.apiMessage : "Không thể tải danh sách yêu cầu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadApprovals();

    return () => {
      cancelled = true;
    };
  }, [page, search, toast]);

  const totalRequestedAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.amount, 0),
    [items]
  );

  const filtered = Boolean(search.trim());

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blue-200 bg-linear-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-900/10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              CFO approval center
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Duyệt cấp quota ngân sách</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Flow 3: CFO duyệt yêu cầu nạp quỹ phòng ban từ Manager. Khi phê duyệt, tiền chuyển trực tiếp từ quỹ hệ thống sang quỹ phòng ban.
            </p>
          </div>

          <span className="inline-flex w-fit rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-lg shadow-blue-950/10">
            {total.toLocaleString("vi-VN")} chờ duyệt
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard label="Quỹ hệ thống khả dụng" value={formatCurrency(systemFundBalance)} />
        <MetricCard label="Tổng đề xuất trang này" value={formatCurrency(totalRequestedAmount)} />
        <MetricCard label="Số yêu cầu chờ duyệt" value={total.toLocaleString("vi-VN")} />
      </section>

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Bộ lọc phê duyệt</h2>
            <p className="mt-1 text-sm text-slate-500">Tìm theo mã yêu cầu, phòng ban hoặc người gửi yêu cầu.</p>
          </div>
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateParam("search", undefined);
              }}
              className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Xóa tìm kiếm
            </button>
          )}
        </div>

        <div className="relative mt-4">
          <svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35m1.6-5.65a7.25 7.25 0 11-14.5 0 7.25 7.25 0 0114.5 0z" />
          </svg>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Tìm theo mã yêu cầu, phòng ban, Manager..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </section>

      {loading ? (
        <CardListSkeleton rows={5} height="h-44" />
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0l-2 7H6l-2-7m16 0H4" />
            </svg>
          </div>
          <p className="mt-4 font-semibold text-slate-700">Không có yêu cầu cấp quỹ phòng ban chờ duyệt.</p>
          <p className="mt-1 text-sm text-slate-500">Khi Manager gửi yêu cầu mới, danh sách sẽ hiển thị tại đây.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const deptCurrent = item.department.totalAvailableBalance;
            const deptAfter = deptCurrent + item.amount;
            const enoughFund = systemFundBalance >= item.amount;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(`/cfo/approvals/${item.id}`)}
                className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="flex flex-col gap-4 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                          Cấp quota phòng ban
                        </span>
                        <span className="font-mono text-slate-500">{item.requestCode}</span>
                        <span className="text-slate-500">{formatDateTime(item.createdAt)}</span>
                      </div>
                      <h2 className="mt-3 text-lg font-bold text-slate-900">{item.department.name}</h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Người gửi: {item.requester.fullName}
                        <span className="text-slate-500"> - {item.requester.jobTitle ?? "Manager"}</span>
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                        enoughFund ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
                      }`}
                    >
                      {enoughFund ? "Đủ quỹ" : "Vượt quỹ khả dụng"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <AmountBox label="Quỹ phòng ban hiện tại" value={formatCurrency(deptCurrent)} />
                    <AmountBox label="Số tiền đề xuất" value={formatCurrency(item.amount)} highlight="blue" />
                    <AmountBox label="Sau phê duyệt" value={formatCurrency(deptAfter)} highlight="emerald" />
                  </div>

                  {item.description && <p className="line-clamp-2 text-sm leading-6 text-slate-500">{item.description}</p>}

                  <div className="flex justify-end">
                    <span className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                      Xem chi tiết
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Trang {page}/{totalPages} - Tổng {total.toLocaleString("vi-VN")} yêu cầu
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trước
          </button>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 h-2 w-12 rounded-full bg-blue-600" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function AmountBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "blue" | "emerald";
}) {
  const valueClass = highlight === "blue" ? "text-blue-700" : highlight === "emerald" ? "text-emerald-700" : "text-slate-900";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-sm font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}
