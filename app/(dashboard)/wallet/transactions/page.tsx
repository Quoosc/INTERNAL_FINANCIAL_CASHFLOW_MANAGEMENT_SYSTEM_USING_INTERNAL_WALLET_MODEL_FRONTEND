"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  PaginatedResponse,
  PaymentProvider,
  ReferenceType,
  TransactionDetailResponse,
  TransactionFilterParams,
  TransactionResponse,
  TransactionStatus,
  TransactionType,
} from "@/types";

type TransactionFiltersState = TransactionFilterParams & { search?: string };

const PAGE_LIMIT = 10;

// TODO: Replace with real API call when Sprint 3 is complete
const MOCK_TRANSACTIONS: TransactionResponse[] = [
  {
    id: 1,
    transactionCode: "TXN-001",
    type: TransactionType.DEPOSIT,
    status: TransactionStatus.SUCCESS,
    amount: 1_000_000,
    balanceAfter: 11_000_000,
    referenceType: ReferenceType.SYSTEM,
    referenceId: 101,
    description: "Nạp tiền qua QR",
    createdAt: "2026-04-03T09:10:00",
  },
  {
    id: 2,
    transactionCode: "TXN-002",
    type: TransactionType.WITHDRAW,
    status: TransactionStatus.SUCCESS,
    amount: -500_000,
    balanceAfter: 10_500_000,
    referenceType: null,
    referenceId: null,
    description: "Rút tiền về MB Bank",
    createdAt: "2026-04-03T11:30:00",
  },
  {
    id: 3,
    transactionCode: "TXN-003",
    type: TransactionType.REQUEST_PAYMENT,
    status: TransactionStatus.SUCCESS,
    amount: -1_200_000,
    balanceAfter: 9_300_000,
    referenceType: ReferenceType.REQUEST,
    referenceId: 301,
    description: "Chi phí công tác",
    createdAt: "2026-04-02T08:20:00",
  },
  {
    id: 4,
    transactionCode: "TXN-004",
    type: TransactionType.PAYSLIP_PAYMENT,
    status: TransactionStatus.SUCCESS,
    amount: 12_500_000,
    balanceAfter: 21_800_000,
    referenceType: ReferenceType.PAYSLIP,
    referenceId: 78,
    description: "Lương tháng 03/2026",
    createdAt: "2026-04-01T08:00:00",
  },
  {
    id: 5,
    transactionCode: "TXN-005",
    type: TransactionType.SYSTEM_ADJUSTMENT,
    status: TransactionStatus.SUCCESS,
    amount: 150_000,
    balanceAfter: 21_950_000,
    referenceType: ReferenceType.SYSTEM,
    referenceId: 202,
    description: "Điều chỉnh cộng tiền",
    createdAt: "2026-03-30T17:05:00",
  },
  {
    id: 6,
    transactionCode: "TXN-006",
    type: TransactionType.DEPOSIT,
    status: TransactionStatus.PENDING,
    amount: 2_000_000,
    balanceAfter: 23_950_000,
    referenceType: ReferenceType.SYSTEM,
    referenceId: 203,
    description: "Nạp tiền chờ xác nhận",
    createdAt: "2026-03-29T14:22:00",
  },
  {
    id: 7,
    transactionCode: "TXN-007",
    type: TransactionType.WITHDRAW,
    status: TransactionStatus.FAILED,
    amount: -700_000,
    balanceAfter: 23_950_000,
    referenceType: null,
    referenceId: null,
    description: "Rút tiền thất bại",
    createdAt: "2026-03-28T15:10:00",
  },
  {
    id: 8,
    transactionCode: "TXN-008",
    type: TransactionType.REQUEST_PAYMENT,
    status: TransactionStatus.SUCCESS,
    amount: -800_000,
    balanceAfter: 23_150_000,
    referenceType: ReferenceType.REQUEST,
    referenceId: 302,
    description: "Thanh toán mua vật tư",
    createdAt: "2026-03-27T10:10:00",
  },
  {
    id: 9,
    transactionCode: "TXN-009",
    type: TransactionType.PAYSLIP_PAYMENT,
    status: TransactionStatus.SUCCESS,
    amount: 12_000_000,
    balanceAfter: 35_150_000,
    referenceType: ReferenceType.PAYSLIP,
    referenceId: 77,
    description: "Lương tháng 02/2026",
    createdAt: "2026-03-25T08:00:00",
  },
  {
    id: 10,
    transactionCode: "TXN-010",
    type: TransactionType.SYSTEM_ADJUSTMENT,
    status: TransactionStatus.SUCCESS,
    amount: 50_000,
    balanceAfter: 35_200_000,
    referenceType: ReferenceType.SYSTEM,
    referenceId: 204,
    description: "Hoàn phí giao dịch",
    createdAt: "2026-03-24T16:11:00",
  },
  {
    id: 11,
    transactionCode: "TXN-011",
    type: TransactionType.DEPOSIT,
    status: TransactionStatus.SUCCESS,
    amount: 500_000,
    balanceAfter: 35_700_000,
    referenceType: ReferenceType.SYSTEM,
    referenceId: 205,
    description: "Nạp bổ sung",
    createdAt: "2026-03-22T09:45:00",
  },
  {
    id: 12,
    transactionCode: "TXN-012",
    type: TransactionType.WITHDRAW,
    status: TransactionStatus.SUCCESS,
    amount: -1_000_000,
    balanceAfter: 34_700_000,
    referenceType: null,
    referenceId: null,
    description: "Rút tiền cá nhân",
    createdAt: "2026-03-20T10:30:00",
  },
  {
    id: 13,
    transactionCode: "TXN-013",
    type: TransactionType.REQUEST_PAYMENT,
    status: TransactionStatus.PENDING,
    amount: -450_000,
    balanceAfter: 34_250_000,
    referenceType: ReferenceType.REQUEST,
    referenceId: 303,
    description: "Yêu cầu hoàn ứng đang chờ",
    createdAt: "2026-03-18T12:44:00",
  },
  {
    id: 14,
    transactionCode: "TXN-014",
    type: TransactionType.PAYSLIP_PAYMENT,
    status: TransactionStatus.SUCCESS,
    amount: 11_800_000,
    balanceAfter: 46_050_000,
    referenceType: ReferenceType.PAYSLIP,
    referenceId: 76,
    description: "Lương tháng 01/2026",
    createdAt: "2026-03-15T08:00:00",
  },
  {
    id: 15,
    transactionCode: "TXN-015",
    type: TransactionType.SYSTEM_ADJUSTMENT,
    status: TransactionStatus.SUCCESS,
    amount: 100_000,
    balanceAfter: 46_150_000,
    referenceType: ReferenceType.SYSTEM,
    referenceId: 206,
    description: "Điều chỉnh thưởng",
    createdAt: "2026-03-13T16:20:00",
  },
];

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

function isPositiveType(type: TransactionType): boolean {
  return (
    type === TransactionType.DEPOSIT ||
    type === TransactionType.PAYSLIP_PAYMENT ||
    type === TransactionType.SYSTEM_ADJUSTMENT
  );
}

function getAmountByType(tx: TransactionResponse): number {
  const absAmount = Math.abs(tx.amount);
  return isPositiveType(tx.type) ? absAmount : -absAmount;
}

function getTypeLabel(type: TransactionType): string {
  switch (type) {
    case TransactionType.DEPOSIT:
      return "Nạp tiền";
    case TransactionType.WITHDRAW:
      return "Rút tiền";
    case TransactionType.REQUEST_PAYMENT:
      return "Thanh toán yêu cầu";
    case TransactionType.PAYSLIP_PAYMENT:
      return "Nhận lương";
    case TransactionType.SYSTEM_ADJUSTMENT:
      return "Điều chỉnh hệ thống";
    case TransactionType.DEPT_QUOTA_ALLOCATION:
      return "Cấp quỹ phòng ban";
    case TransactionType.PROJECT_QUOTA_ALLOCATION:
      return "Cấp quỹ dự án";
    default:
      return type;
  }
}

function getTypeBadgeClass(type: TransactionType): string {
  switch (type) {
    case TransactionType.DEPOSIT:
      return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    case TransactionType.WITHDRAW:
      return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    case TransactionType.REQUEST_PAYMENT:
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case TransactionType.PAYSLIP_PAYMENT:
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case TransactionType.SYSTEM_ADJUSTMENT:
      return "bg-violet-500/15 text-violet-300 border-violet-500/30";
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/30";
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
    default:
      return status;
  }
}

function getStatusClass(status: TransactionStatus): string {
  switch (status) {
    case TransactionStatus.SUCCESS:
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case TransactionStatus.PENDING:
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case TransactionStatus.FAILED:
      return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  }
}

function parseTypeValue(typeParam: string | null): TransactionType | undefined {
  if (!typeParam) return undefined;

  const validTypes = new Set<string>([
    TransactionType.DEPOSIT,
    TransactionType.WITHDRAW,
    TransactionType.REQUEST_PAYMENT,
    TransactionType.PAYSLIP_PAYMENT,
    TransactionType.SYSTEM_ADJUSTMENT,
    TransactionType.DEPT_QUOTA_ALLOCATION,
    TransactionType.PROJECT_QUOTA_ALLOCATION,
  ]);

  if (validTypes.has(typeParam)) {
    return typeParam as TransactionType;
  }

  return undefined;
}

function getInitialState(searchParams: { get: (key: string) => string | null }): {
  filters: TransactionFiltersState;
  page: number;
} {
  const pageParam = Number(searchParams.get("page") ?? "1");
  const parsedPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  return {
    filters: {
      type: parseTypeValue(searchParams.get("type")),
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      limit: PAGE_LIMIT,
    },
    page: parsedPage,
  };
}

function filterMockData(
  source: TransactionResponse[],
  filters: TransactionFiltersState
): TransactionResponse[] {
  return source.filter((tx) => {
    if (filters.type && tx.type !== filters.type) return false;

    if (filters.from) {
      const fromDate = new Date(`${filters.from}T00:00:00`).getTime();
      if (new Date(tx.createdAt).getTime() < fromDate) return false;
    }

    if (filters.to) {
      const toDate = new Date(`${filters.to}T23:59:59`).getTime();
      if (new Date(tx.createdAt).getTime() > toDate) return false;
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const target = `${tx.transactionCode} ${tx.description ?? ""}`.toLowerCase();
      if (!target.includes(q)) return false;
    }

    return true;
  });
}

function buildMockDetail(transaction: TransactionResponse): TransactionDetailResponse {
  return {
    ...transaction,
    paymentRef: transaction.transactionCode,
    gatewayProvider: PaymentProvider.INTERNAL_WALLET,
    walletId: 17,
    walletOwnerName: "Nguyễn Văn A",
    actorId: 17,
    actorName: "Nguyễn Văn A",
    relatedTransactionId: null,
    updatedAt: transaction.createdAt,
  };
}

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialState = useMemo(() => getInitialState(searchParams), [searchParams]);

  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialState.page);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<TransactionFiltersState>(initialState.filters);
  const [searchInput, setSearchInput] = useState(initialState.filters.search ?? "");

  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TransactionDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const syncUrl = useCallback(
    (nextFilters: TransactionFiltersState, nextPage: number) => {
      const params = new URLSearchParams();

      if (nextFilters.type) params.set("type", nextFilters.type);
      if (nextFilters.from) params.set("from", nextFilters.from);
      if (nextFilters.to) params.set("to", nextFilters.to);
      if (nextFilters.search) params.set("search", nextFilters.search);
      if (nextPage > 1) params.set("page", String(nextPage));

      const query = params.toString();
      router.replace(query ? `/wallet/transactions?${query}` : "/wallet/transactions");
    },
    [router]
  );

  useEffect(() => {
    let cancelled = false;

    const loadTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        // const res = await api.get<PaginatedResponse<TransactionResponse>>('/api/v1/wallet/transactions', { params: filters })
        const query = new URLSearchParams();
        if (filters.type) query.set("type", filters.type);
        if (filters.from) query.set("from", filters.from);
        if (filters.to) query.set("to", filters.to);
        if (filters.search) query.set("search", filters.search);
        query.set("page", String(page));
        query.set("limit", String(PAGE_LIMIT));

        const res = await api.get<PaginatedResponse<TransactionResponse>>(
          `/api/v1/wallet/transactions?${query.toString()}`
        );

        if (cancelled) return;

        setTransactions(res.data.items);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        if (cancelled) return;

        const filtered = filterMockData(MOCK_TRANSACTIONS, filters);
        const mockTotal = filtered.length;
        const mockTotalPages = Math.max(1, Math.ceil(mockTotal / PAGE_LIMIT));
        const currentPage = Math.min(page, mockTotalPages);
        const start = (currentPage - 1) * PAGE_LIMIT;

        setTransactions(filtered.slice(start, start + PAGE_LIMIT));
        setTotal(mockTotal);
        setTotalPages(mockTotalPages);

        if (currentPage !== page) {
          setPage(currentPage);
          syncUrl(filters, currentPage);
        }

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải giao dịch từ API, đang hiển thị dữ liệu mẫu.");
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
      limit: PAGE_LIMIT,
    };

    setFilters(nextFilters);
    setPage(1);
    syncUrl(nextFilters, 1);
  };

  const handleDateChange = (key: "from" | "to", value: string) => {
    const nextFilters: TransactionFiltersState = {
      ...filters,
      [key]: value || undefined,
      limit: PAGE_LIMIT,
    };

    setFilters(nextFilters);
    setPage(1);
    syncUrl(nextFilters, 1);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextFilters: TransactionFiltersState = {
      ...filters,
      search: searchInput.trim() || undefined,
      limit: PAGE_LIMIT,
    };

    setFilters(nextFilters);
    setPage(1);
    syncUrl(nextFilters, 1);
  };

  const handleResetFilters = () => {
    const resetFilters: TransactionFiltersState = { limit: PAGE_LIMIT };
    setFilters(resetFilters);
    setSearchInput("");
    setPage(1);
    syncUrl(resetFilters, 1);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
    syncUrl(filters, nextPage);
  };

  const handleSelectTransaction = async (tx: TransactionResponse) => {
    setSelectedId(String(tx.id));
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);

    try {
      const res = await api.get<TransactionDetailResponse>(
        `/api/v1/wallet/transactions/${tx.id}`
      );
      setDetail(res.data);
    } catch (err) {
      setDetail(buildMockDetail(tx));
      if (err instanceof ApiError) {
        setDetailError(err.apiMessage);
      } else {
        setDetailError("Không thể tải chi tiết từ API, đang hiển thị dữ liệu mẫu.");
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailPanel = () => {
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Lịch sử giao dịch</h1>
        <p className="text-slate-400 mt-1">Theo dõi toàn bộ biến động ví của bạn.</p>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 md:p-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filters.type ?? "ALL"}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="ALL">Tất cả loại</option>
            <option value={TransactionType.DEPOSIT}>DEPOSIT</option>
            <option value={TransactionType.WITHDRAW}>WITHDRAW</option>
            <option value={TransactionType.REQUEST_PAYMENT}>REQUEST_PAYMENT</option>
            <option value={TransactionType.PAYSLIP_PAYMENT}>PAYSLIP_PAYMENT</option>
            <option value={TransactionType.SYSTEM_ADJUSTMENT}>SYSTEM_ADJUSTMENT</option>
          </select>

          <input
            type="date"
            value={filters.from ?? ""}
            onChange={(e) => handleDateChange("from", e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />

          <input
            type="date"
            value={filters.to ?? ""}
            onChange={(e) => handleDateChange("to", e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />

          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
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
            className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            Tìm
          </button>
        </form>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Ngày</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Loại</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Mô tả</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Số tiền</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
                      <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang tải giao dịch...
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-sm">
                    Không có giao dịch phù hợp bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const displayAmount = getAmountByType(tx);
                  const positive = displayAmount >= 0;

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => void handleSelectTransaction(tx)}
                      className="border-b border-white/5 hover:bg-slate-700/30 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm text-slate-300">{formatDateTime(tx.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${getTypeBadgeClass(tx.type)}`}>
                          {getTypeLabel(tx.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-white truncate max-w-[320px]">{tx.description ?? "Không có mô tả"}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{tx.transactionCode}</p>
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${positive ? "text-emerald-400" : "text-rose-400"}`}>
                        {positive ? "+" : "-"}
                        {formatCurrency(Math.abs(displayAmount))}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${getStatusClass(tx.status)}`}>
                          {getStatusLabel(tx.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 flex items-center justify-between border-t border-white/10 bg-slate-900/30">
          <p className="text-sm text-slate-400">
            Tổng {total} giao dịch • Trang {page}/{totalPages}
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
      </div>

      {error && <p className="text-amber-400 text-sm">{error}</p>}

      {selectedId && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={closeDetailPanel}
            aria-label="Đóng chi tiết giao dịch"
          />

          <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-white/10 shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Chi tiết giao dịch</h2>
              <button
                type="button"
                onClick={closeDetailPanel}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                aria-label="Đóng"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : detail ? (
              <div className="space-y-4">
                <DetailRow label="Mã giao dịch" value={detail.transactionCode} />
                <DetailRow label="Loại" value={getTypeLabel(detail.type)} />
                <DetailRow label="Ngày tạo" value={formatDateTime(detail.createdAt)} />
                <DetailRow label="Mô tả" value={detail.description ?? "Không có"} />
                <DetailRow label="Số tiền" value={formatCurrency(detail.amount)} />
                <DetailRow label="Số dư sau giao dịch" value={formatCurrency(detail.balanceAfter)} />
                <DetailRow label="Nguồn tham chiếu" value={detail.referenceType ?? "—"} />
                <DetailRow label="Reference ID" value={detail.referenceId?.toString() ?? "—"} />
                <DetailRow label="Payment Ref" value={detail.paymentRef ?? "—"} />
                <DetailRow label="Cập nhật lúc" value={formatDateTime(detail.updatedAt)} />
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Không có dữ liệu chi tiết.</p>
            )}

            {detailError && <p className="text-amber-400 text-xs mt-4">{detailError}</p>}
          </aside>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-white font-medium mt-1 break-all">{value}</p>
    </div>
  );
}
