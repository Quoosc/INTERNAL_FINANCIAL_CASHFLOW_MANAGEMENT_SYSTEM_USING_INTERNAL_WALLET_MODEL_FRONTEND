"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  TransactionResponse,
  TransactionStatus,
  TransactionType,
} from "@/types";

const PAGE_SIZE = 10;

interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface LegacyPaginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type WalletTransactionsApi =
  | SpringPage<TransactionResponse>
  | LegacyPaginated<TransactionResponse>
  | TransactionResponse[];

interface TransactionFiltersState {
  type?: TransactionType;
  from?: string;
  to?: string;
  search?: string;
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getTypeLabel(type: TransactionType): string {
  switch (type) {
    case TransactionType.DEPOSIT:
      return "Nạp tiền";
    case TransactionType.WITHDRAW:
      return "Rút tiền";
    case TransactionType.SYSTEM_TOPUP:
      return "Nạp quỹ công ty";
    case TransactionType.REQUEST_PAYMENT:
      return "Thanh toán yêu cầu";
    case TransactionType.PAYSLIP_PAYMENT:
      return "Nhận lương";
    case TransactionType.ADVANCE_RETURN:
      return "Hoàn tạm ứng";
    case TransactionType.REVERSAL:
      return "Hoàn tiền";
    case TransactionType.DEPT_QUOTA_ALLOCATION:
      return "Cấp quỹ phòng ban";
    case TransactionType.PROJECT_QUOTA_ALLOCATION:
      return "Cấp quỹ dự án";
    case TransactionType.SYSTEM_ADJUSTMENT:
      return "Điều chỉnh hệ thống";
    default:
      return type;
  }
}

function getTypeBadgeClass(type: TransactionType): string {
  switch (type) {
    case TransactionType.DEPOSIT:
    case TransactionType.PAYSLIP_PAYMENT:
    case TransactionType.SYSTEM_TOPUP:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case TransactionType.WITHDRAW:
      return "bg-rose-50 text-rose-700 border-rose-200";
    case TransactionType.REQUEST_PAYMENT:
    case TransactionType.ADVANCE_RETURN:
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-500/15 text-slate-600 border-slate-500/30";
  }
}

function getStatusLabel(status: TransactionStatus): string {
  switch (status) {
    case TransactionStatus.SUCCESS:
      return "Thành công";
    case TransactionStatus.PENDING:
      return "Đang chờ";
    case TransactionStatus.FAILED:
      return "Thất bại";
    case TransactionStatus.CANCELLED:
      return "Đã hủy";
    default:
      return status;
  }
}

function getStatusClass(status: TransactionStatus): string {
  switch (status) {
    case TransactionStatus.SUCCESS:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case TransactionStatus.PENDING:
      return "bg-amber-50 text-amber-700 border-amber-200";
    case TransactionStatus.FAILED:
      return "bg-rose-50 text-rose-700 border-rose-200";
    case TransactionStatus.CANCELLED:
      return "bg-slate-500/15 text-slate-600 border-slate-500/30";
    default:
      return "bg-slate-500/15 text-slate-600 border-slate-500/30";
  }
}

function parseTypeValue(typeParam: string | null): TransactionType | undefined {
  if (!typeParam) return undefined;

  const validTypes = new Set<string>(Object.values(TransactionType));
  if (validTypes.has(typeParam)) {
    return typeParam as TransactionType;
  }

  return undefined;
}

function getInitialState(searchParams: {
  get: (key: string) => string | null;
}) {
  const pageParam = Number(searchParams.get("page") ?? "1");
  const parsedPage =
    Number.isFinite(pageParam) && pageParam > 0 ? pageParam - 1 : 0;

  return {
    filters: {
      type: parseTypeValue(searchParams.get("type")),
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    } as TransactionFiltersState,
    page: parsedPage,
  };
}

function normalizeList(payload: WalletTransactionsApi, fallbackPage: number) {
  if (Array.isArray(payload)) {
    const total = payload.length;
    return {
      items: payload,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      page: fallbackPage,
    };
  }

  if ("content" in payload) {
    return {
      items: payload.content,
      total: payload.totalElements,
      totalPages: Math.max(1, payload.totalPages),
      page: payload.number,
    };
  }

  return {
    items: payload.items,
    total: payload.total,
    totalPages: Math.max(1, payload.totalPages),
    page: Math.max(0, payload.page - 1),
  };
}

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialState = useMemo(
    () => getInitialState(searchParams),
    [searchParams],
  );

  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialState.page);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<TransactionFiltersState>(
    initialState.filters,
  );
  const [searchInput, setSearchInput] = useState(
    initialState.filters.search ?? "",
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncUrl = useCallback(
    (nextFilters: TransactionFiltersState, nextPage: number) => {
      const params = new URLSearchParams();

      if (nextFilters.type) params.set("type", nextFilters.type);
      if (nextFilters.from) params.set("from", nextFilters.from);
      if (nextFilters.to) params.set("to", nextFilters.to);
      if (nextFilters.search) params.set("search", nextFilters.search);
      if (nextPage > 0) params.set("page", String(nextPage + 1));

      const query = params.toString();
      router.replace(
        query ? `/wallet/transactions?${query}` : "/wallet/transactions",
      );
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;

    const loadTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams();
        if (filters.type) query.set("type", filters.type);
        if (filters.from) query.set("from", filters.from);
        if (filters.to) query.set("to", filters.to);
        if (filters.search) query.set("search", filters.search);
        query.set("page", String(page));
        query.set("size", String(PAGE_SIZE));

        const res = await api.get<WalletTransactionsApi>(
          `/api/v1/wallet/transactions?${query.toString()}`,
        );

        if (cancelled) return;

        const normalized = normalizeList(res.data, page);
        setTransactions(normalized.items);
        setTotal(normalized.total);
        setTotalPages(normalized.totalPages);
      } catch (err) {
        if (cancelled) return;

        setTransactions([]);
        setTotal(0);
        setTotalPages(1);

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải dữ liệu giao dịch.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadTransactions();

    return () => {
      cancelled = true;
    };
  }, [filters, page, syncUrl]);

  const handleTypeChange = (value: string) => {
    const nextFilters: TransactionFiltersState = {
      ...filters,
      type: value === "ALL" ? undefined : (value as TransactionType),
    };

    setFilters(nextFilters);
    setPage(0);
    syncUrl(nextFilters, 0);
  };

  const handleDateChange = (key: "from" | "to", value: string) => {
    const nextFilters: TransactionFiltersState = {
      ...filters,
      [key]: value || undefined,
    };

    setFilters(nextFilters);
    setPage(0);
    syncUrl(nextFilters, 0);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextFilters: TransactionFiltersState = {
      ...filters,
      search: searchInput.trim() || undefined,
    };

    setFilters(nextFilters);
    setPage(0);
    syncUrl(nextFilters, 0);
  };

  const handleResetFilters = () => {
    const resetFilters: TransactionFiltersState = {};
    setFilters(resetFilters);
    setSearchInput("");
    setPage(0);
    syncUrl(resetFilters, 0);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 0 || nextPage >= totalPages || nextPage === page) return;
    setPage(nextPage);
    syncUrl(filters, nextPage);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Lịch sử giao dịch</h1>
        <p className="text-slate-500 mt-1">
          Theo dõi toàn bộ biến động ví của bạn.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filters.type ?? "ALL"}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="ALL">Tất cả loại</option>
            {Object.values(TransactionType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.from ?? ""}
            onChange={(e) => handleDateChange("from", e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />

          <input
            type="date"
            value={filters.to ?? ""}
            onChange={(e) => handleDateChange("to", e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />

          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo mã giao dịch hoặc mô tả..."
            className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            Tìm
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-215">
            <thead>
              <tr className="border-b border-slate-200 bg-white/40">
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Ngày
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Loại
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Mô tả
                </th>
                <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Số tiền
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Trạng thái
                </th>
                <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Chi tiết
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-slate-500 text-sm"
                  >
                    Đang tải giao dịch...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-slate-500 text-sm"
                  >
                    Không có giao dịch phù hợp bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-slate-200 hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDateTime(tx.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full border text-xs ${getTypeBadgeClass(tx.type)}`}
                      >
                        {getTypeLabel(tx.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-900 truncate max-w-[320px]">
                        {tx.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {tx.transactionCode}
                      </p>
                    </td>
                    <td
                      className={`px-4 py-3 text-right text-sm font-semibold ${tx.amount >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                    >
                      {tx.amount >= 0 ? "+" : ""}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full border text-xs ${getStatusClass(tx.status)}`}
                      >
                        {getStatusLabel(tx.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/wallet/transactions/${tx.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 border border-blue-200 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 flex items-center justify-between border-t border-slate-200 bg-blue-50">
          <p className="text-sm text-slate-500">
            Tổng {total} giao dịch • Trang {page + 1}/{totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 0}
              className="px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm transition-colors"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-amber-700 text-sm">{error}</p>}
    </div>
  );
}
