"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  ReferenceType,
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

// Fallback mock data
const MOCK_TRANSACTIONS: TransactionResponse[] = [
  {
    id: 1,
    transactionCode: "TXN-001",
    type: TransactionType.DEPOSIT,
    status: TransactionStatus.SUCCESS,
    amount: 1_000_000,
    referenceType: ReferenceType.DEPOSIT,
    referenceId: 101,
    description: "Nap tien qua QR",
    createdAt: "2026-04-03T09:10:00",
  },
  {
    id: 2,
    transactionCode: "TXN-002",
    type: TransactionType.WITHDRAW,
    status: TransactionStatus.PENDING,
    amount: -500_000,
    referenceType: ReferenceType.WITHDRAWAL,
    referenceId: 501,
    description: "Yeu cau rut tien",
    createdAt: "2026-04-03T11:30:00",
  },
  {
    id: 3,
    transactionCode: "TXN-003",
    type: TransactionType.REQUEST_PAYMENT,
    status: TransactionStatus.SUCCESS,
    amount: -1_200_000,
    referenceType: ReferenceType.REQUEST,
    referenceId: 301,
    description: "Chi phi cong tac",
    createdAt: "2026-04-02T08:20:00",
  },
  {
    id: 4,
    transactionCode: "TXN-004",
    type: TransactionType.PAYSLIP_PAYMENT,
    status: TransactionStatus.SUCCESS,
    amount: 12_500_000,
    referenceType: ReferenceType.PAYSLIP,
    referenceId: 78,
    description: "Luong thang 03/2026",
    createdAt: "2026-04-01T08:00:00",
  },
  {
    id: 5,
    transactionCode: "TXN-005",
    type: TransactionType.SYSTEM_ADJUSTMENT,
    status: TransactionStatus.SUCCESS,
    amount: 150_000,
    referenceType: ReferenceType.SYSTEM,
    referenceId: 202,
    description: "Dieu chinh cong tien",
    createdAt: "2026-03-30T17:05:00",
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

function getTypeLabel(type: TransactionType): string {
  switch (type) {
    case TransactionType.DEPOSIT:
      return "Nap tien";
    case TransactionType.WITHDRAW:
      return "Rut tien";
    case TransactionType.SYSTEM_TOPUP:
      return "Nap quy cong ty";
    case TransactionType.REQUEST_PAYMENT:
      return "Thanh toan yeu cau";
    case TransactionType.PAYSLIP_PAYMENT:
      return "Nhan luong";
    case TransactionType.ADVANCE_RETURN:
      return "Hoan tam ung";
    case TransactionType.REVERSAL:
      return "Hoan tien";
    case TransactionType.DEPT_QUOTA_ALLOCATION:
      return "Cap quy phong ban";
    case TransactionType.PROJECT_QUOTA_ALLOCATION:
      return "Cap quy du an";
    case TransactionType.SYSTEM_ADJUSTMENT:
      return "Dieu chinh he thong";
    default:
      return type;
  }
}

function getTypeBadgeClass(type: TransactionType): string {
  switch (type) {
    case TransactionType.DEPOSIT:
    case TransactionType.PAYSLIP_PAYMENT:
    case TransactionType.SYSTEM_TOPUP:
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case TransactionType.WITHDRAW:
      return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    case TransactionType.REQUEST_PAYMENT:
    case TransactionType.ADVANCE_RETURN:
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  }
}

function getStatusLabel(status: TransactionStatus): string {
  switch (status) {
    case TransactionStatus.SUCCESS:
      return "Thanh cong";
    case TransactionStatus.PENDING:
      return "Dang cho";
    case TransactionStatus.FAILED:
      return "That bai";
    case TransactionStatus.CANCELLED:
      return "Da huy";
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
    case TransactionStatus.CANCELLED:
      return "bg-slate-500/15 text-slate-300 border-slate-500/30";
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/30";
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

function getInitialState(searchParams: { get: (key: string) => string | null }) {
  const pageParam = Number(searchParams.get("page") ?? "1");
  const parsedPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam - 1 : 0;

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

function filterMockData(source: TransactionResponse[], filters: TransactionFiltersState) {
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
      const target = `${tx.transactionCode} ${tx.description}`.toLowerCase();
      if (!target.includes(q)) return false;
    }

    return true;
  });
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
        const query = new URLSearchParams();
        if (filters.type) query.set("type", filters.type);
        if (filters.from) query.set("from", filters.from);
        if (filters.to) query.set("to", filters.to);
        if (filters.search) query.set("search", filters.search);
        query.set("page", String(page));
        query.set("size", String(PAGE_SIZE));

        const res = await api.get<WalletTransactionsApi>(`/api/v1/wallet/transactions?${query.toString()}`);

        if (cancelled) return;

        const normalized = normalizeList(res.data, page);
        setTransactions(normalized.items);
        setTotal(normalized.total);
        setTotalPages(normalized.totalPages);
      } catch (err) {
        if (cancelled) return;

        const filtered = filterMockData(MOCK_TRANSACTIONS, filters);
        const mockTotal = filtered.length;
        const mockTotalPages = Math.max(1, Math.ceil(mockTotal / PAGE_SIZE));
        const currentPage = Math.min(page, mockTotalPages - 1);
        const start = currentPage * PAGE_SIZE;

        setTransactions(filtered.slice(start, start + PAGE_SIZE));
        setTotal(mockTotal);
        setTotalPages(mockTotalPages);

        if (currentPage !== page) {
          setPage(currentPage);
          syncUrl(filters, currentPage);
        }

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Khong the tai giao dich tu API, dang hien thi du lieu mau.");
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
        <h1 className="text-2xl font-bold text-white">Lich su giao dich</h1>
        <p className="text-slate-400 mt-1">Theo doi toan bo bien dong vi cua ban.</p>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 md:p-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filters.type ?? "ALL"}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="ALL">Tat ca loai</option>
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
            Xoa bo loc
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tim theo ma giao dich hoac mo ta..."
            className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            Tim
          </button>
        </form>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-215">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Ngay</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Loai</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Mo ta</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">So tien</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Trang thai</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Chi tiet</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                    Dang tai giao dich...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-sm">
                    Khong co giao dich phu hop bo loc hien tai.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-300">{formatDateTime(tx.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${getTypeBadgeClass(tx.type)}`}>
                        {getTypeLabel(tx.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-white truncate max-w-[320px]">{tx.description}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{tx.transactionCode}</p>
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-semibold ${tx.amount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {tx.amount >= 0 ? "+" : ""}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${getStatusClass(tx.status)}`}>
                        {getStatusLabel(tx.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/wallet/transactions/${tx.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-medium hover:bg-blue-600/30 transition-colors"
                      >
                        Xem chi tiet
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 flex items-center justify-between border-t border-white/10 bg-slate-900/30">
          <p className="text-sm text-slate-400">
            Tong {total} giao dich • Trang {page + 1}/{totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 0}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors"
            >
              Truoc
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-amber-400 text-sm">{error}</p>}
    </div>
  );
}

