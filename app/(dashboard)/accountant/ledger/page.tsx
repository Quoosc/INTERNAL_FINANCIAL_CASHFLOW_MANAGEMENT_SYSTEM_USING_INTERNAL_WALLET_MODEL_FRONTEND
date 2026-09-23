"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import { useToast } from "@/contexts/toast-context";
import {
  AccountantLedgerFilterParams,
  AccountantLedgerItemResponse,
  LedgerSummaryResponse,
  PaginatedResponse,
  ReferenceType,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
  WalletOwnerType,
} from "@/types";
import { formatCurrency, formatDateTime, parseApiDate } from "@/lib/format";

const PAGE_LIMIT = 20;


function parsePage(value: string | null): number {
  const p = Number(value ?? "1");
  return Number.isFinite(p) && p > 0 ? p : 1;
}

function parseEnum<T extends string>(value: string | null, values: T[]): T | undefined {
  if (!value) return undefined;
  return values.includes(value as T) ? (value as T) : undefined;
}

function pickPaginated<T>(payload: PaginatedResponse<T> | T[]): { items: T[]; total: number; totalPages: number } {
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length, totalPages: Math.max(1, Math.ceil(payload.length / PAGE_LIMIT)) };
  }
  return { items: payload.items, total: payload.total, totalPages: Math.max(1, payload.totalPages) };
}

function getTypeLabel(type: TransactionType): string {
  const labels: Record<string, string> = {
    REQUEST_PAYMENT:        "Giải ngân yêu cầu",
    PAYSLIP_PAYMENT:        "Chi trả lương",
    SYSTEM_TOPUP:           "Nạp quỹ hệ thống",
    DEPOSIT:                "Nạp tiền vào ví",
    WITHDRAW:               "Rút tiền về ngân hàng",
    DEPT_QUOTA_ALLOCATION:  "Cấp ngân sách phòng ban",
    PROJECT_QUOTA_ALLOCATION: "Cấp vốn dự án",
    ADVANCE_RETURN:         "Hoàn tạm ứng",
    REVERSAL:               "Hoàn giao dịch",
    SYSTEM_ADJUSTMENT:      "Điều chỉnh số dư",
  };
  return labels[type] ?? type;
}

function getTypeClass(type: TransactionType): string {
  switch (type) {
    case TransactionType.REQUEST_PAYMENT:         return "bg-violet-100 border-violet-200 text-violet-700";
    case TransactionType.PAYSLIP_PAYMENT:         return "bg-blue-50 border-blue-200 text-blue-700";
    case TransactionType.SYSTEM_TOPUP:            return "bg-emerald-100 border-emerald-200 text-emerald-700";
    case TransactionType.DEPOSIT:                 return "bg-teal-100 border-teal-200 text-teal-700";
    case TransactionType.WITHDRAW:                return "bg-rose-100 border-rose-200 text-rose-700";
    case TransactionType.DEPT_QUOTA_ALLOCATION:   return "bg-amber-100 border-amber-200 text-amber-700";
    case TransactionType.PROJECT_QUOTA_ALLOCATION: return "bg-orange-100 border-orange-200 text-orange-700";
    default: return "bg-slate-100 border-slate-200 text-slate-600";
  }
}

function getDirectionClass(direction: TransactionDirection): string {
  return direction === TransactionDirection.CREDIT
    ? "bg-emerald-100 border-emerald-200 text-emerald-700"
    : "bg-rose-100 border-rose-200 text-rose-700";
}

function getDirectionLabel(direction: TransactionDirection): string {
  return direction === TransactionDirection.CREDIT ? "Tiền vào" : "Tiền ra";
}

function getStatusLabel(status: TransactionStatus): string {
  const labels: Record<string, string> = {
    SUCCESS: "Thành công",
    PENDING: "Đang xử lý",
    FAILED: "Thất bại",
    CANCELLED: "Đã hủy",
  };
  return labels[status] ?? status;
}

function getReferenceTypeLabel(referenceType: ReferenceType): string {
  const labels: Record<string, string> = {
    REQUEST: "Yêu cầu chi tiền",
    PAYSLIP: "Phiếu lương",
    PROJECT: "Dự án",
    DEPARTMENT: "Phòng ban",
    ADVANCE_BALANCE: "Dư tạm ứng",
    SYSTEM: "Quỹ hệ thống",
    WITHDRAWAL: "Yêu cầu rút tiền",
    DEPOSIT: "Nạp tiền",
  };
  return labels[referenceType] ?? referenceType;
}

function formatOwnerLabel(ownerType: WalletOwnerType, ownerId: number, ownerName?: string | null): string {
  if (ownerName) return ownerName;

  switch (ownerType) {
    case WalletOwnerType.USER:
      return `Người dùng #${ownerId}`;
    case WalletOwnerType.DEPARTMENT:
      return `Phòng ban #${ownerId}`;
    case WalletOwnerType.PROJECT:
      return `Dự án #${ownerId}`;
    case WalletOwnerType.COMPANY_FUND:
      return "Quỹ hệ thống";
    case WalletOwnerType.FLOAT_MAIN:
      return "Ví kiểm soát hệ thống";
    default:
      return `${ownerType} #${ownerId}`;
  }
}

export default function AccountantLedgerPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();

  const searchParamsString = searchParams.toString();

  const page = useMemo(() => parsePage(searchParams.get("page")), [searchParams]);
  const type = useMemo(
    () => parseEnum(searchParams.get("type"), Object.values(TransactionType)),
    [searchParams]
  );
  const txStatus = useMemo(
    () => parseEnum(searchParams.get("status"), Object.values(TransactionStatus)),
    [searchParams]
  );
  const refType = useMemo(
    () => parseEnum(searchParams.get("referenceType"), Object.values(ReferenceType)),
    [searchParams]
  );
  const from = useMemo(() => searchParams.get("from") ?? "", [searchParams]);
  const to   = useMemo(() => searchParams.get("to")   ?? "", [searchParams]);

  const [summary, setSummary] = useState<LedgerSummaryResponse | null>(null);
  const [items, setItems]     = useState<AccountantLedgerItemResponse[]>([]);
  const [sortBy, setSortBy]   = useState<"amount" | "timestamp" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [total, setTotal]     = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

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
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const filters: AccountantLedgerFilterParams = {
          type,
          status: txStatus,
          referenceType: refType,
          from: from || undefined,
          to: to || undefined,
          page,
          limit: PAGE_LIMIT,
        };

        const q = new URLSearchParams();
        if (filters.type)          q.set("type", filters.type);
        if (filters.status)        q.set("status", filters.status);
        if (filters.referenceType) q.set("referenceType", filters.referenceType);
        if (filters.from)          q.set("from", filters.from);
        if (filters.to)            q.set("to", filters.to);
        q.set("page",  String(page));
        q.set("limit", String(PAGE_LIMIT));

        const summaryQ = new URLSearchParams();
        if (filters.from) summaryQ.set("from", filters.from);
        if (filters.to)   summaryQ.set("to",   filters.to);

        const [summaryRes, listRes] = await Promise.all([
          api.get<LedgerSummaryResponse>(`/api/v1/accountant/ledger/summary?${summaryQ.toString()}`),
          api.get<PaginatedResponse<AccountantLedgerItemResponse> | AccountantLedgerItemResponse[]>(
            `/api/v1/accountant/ledger?${q.toString()}`
          ),
        ]);

        if (cancelled) return;

        const { items: pageItems, total: apiTotal, totalPages: apiTotalPages } = pickPaginated(listRes.data);
        setSummary(summaryRes.data);
        setItems(pageItems);
        setTotal(apiTotal);
        setTotalPages(apiTotalPages);

        const safePage = Math.min(page, Math.max(1, apiTotalPages));
        if (safePage !== page) goToPage(safePage);
      } catch (err) {
        if (cancelled) return;
        setSummary(null);
        setItems([]);
        setTotal(0);
        setTotalPages(1);
        toast.error(err instanceof ApiError ? err.apiMessage : "Không thể tải dữ liệu sổ cái.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [from, goToPage, page, refType, to, txStatus, type, toast]);

  const typeOptions = Object.values(TransactionType);
  const statusOptions = Object.values(TransactionStatus);
  const refTypeOptions = Object.values(ReferenceType);
  const pageInflow = useMemo(
    () => items.filter((item) => item.direction === TransactionDirection.CREDIT).reduce((sum, item) => sum + item.amount, 0),
    [items],
  );
  const pageOutflow = useMemo(
    () => items.filter((item) => item.direction === TransactionDirection.DEBIT).reduce((sum, item) => sum + item.amount, 0),
    [items],
  );

  const sortedItems = useMemo(() => {
    if (!sortBy) return items;
    return [...items].sort((a, b) => {
      const av = sortBy === "amount" ? a.amount : (parseApiDate(a.timestamp)?.getTime() ?? 0);
      const bv = sortBy === "amount" ? b.amount : (parseApiDate(b.timestamp)?.getTime() ?? 0);
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [items, sortBy, sortDir]);

  const handleSort = (col: "amount" | "timestamp") => {
    if (sortBy === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: "amount" | "timestamp" }) => (
    <span className="ml-1 inline-flex opacity-50">
      {sortBy === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blue-200 bg-linear-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-900/10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Nhật ký giao dịch
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Sổ cái</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Tra cứu giao dịch hệ thống, theo dõi tiền vào ra và đối chiếu từng ghi nhận kế toán.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">Giao dịch</p>
            <p className="mt-2 text-3xl font-bold">{total}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <LedgerMetric label="Tiền vào trang này" value={formatCurrency(pageInflow)} helper="Các giao dịch làm tăng số dư ví" tone="emerald" />
        <LedgerMetric label="Tiền ra trang này" value={formatCurrency(pageOutflow)} helper="Các giao dịch làm giảm số dư ví" tone="rose" />
        <LedgerMetric label="Bộ lọc" value={type ? getTypeLabel(type) : "Tất cả"} helper={from || to ? `${from || "..."} - ${to || "..."}` : "Toàn bộ thời gian"} tone="blue" />
      </section>

      {/* Header */}
      <div className="hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sổ cái</h1>
          <p className="text-slate-500 mt-1">Tất cả giao dịch hệ thống — immutable, chỉ đọc.</p>
        </div>
        <span className="inline-flex w-fit px-3 py-1.5 rounded-full border border-slate-300 bg-slate-100 text-slate-600 text-sm font-medium">
          Immutable · Chỉ đọc
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard label="Số dư quỹ"       value={formatCurrency(summary?.currentBalance ?? 0)} tone="text-slate-900" />
        <SummaryCard label="Tổng nạp vào"    value={formatCurrency(summary?.totalInflow ?? 0)}    tone="text-emerald-700" />
        <SummaryCard label="Tổng chi ra"     value={formatCurrency(summary?.totalOutflow ?? 0)}   tone="text-rose-700" />
        <SummaryCard label="Số giao dịch"    value={String(summary?.transactionCount ?? 0)}       tone="text-blue-700" />
      </div>

      {/* Filters */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">Bộ lọc sổ cái</h2>
          <p className="mt-1 text-sm text-slate-500">Kết hợp loại giao dịch, trạng thái, nguồn tham chiếu và khoảng thời gian.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <select
            value={type ?? ""}
            onChange={(e) => updateParam("type", e.target.value || undefined)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Tất cả loại</option>
            {typeOptions.map((v) => (
              <option key={v} value={v}>{getTypeLabel(v)}</option>
            ))}
          </select>

          <select
            value={txStatus ?? ""}
            onChange={(e) => updateParam("status", e.target.value || undefined)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Tất cả trạng thái</option>
            {statusOptions.map((v) => (
              <option key={v} value={v}>{getStatusLabel(v)}</option>
            ))}
          </select>

          <select
            value={refType ?? ""}
            onChange={(e) => updateParam("referenceType", e.target.value || undefined)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Tất cả nguồn</option>
            {refTypeOptions.map((v) => (
              <option key={v} value={v}>{getReferenceTypeLabel(v)}</option>
            ))}
          </select>

          <input
            type="date"
            value={from}
            onChange={(e) => updateParam("from", e.target.value || undefined)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />

          <input
            type="date"
            value={to}
            onChange={(e) => updateParam("to", e.target.value || undefined)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="bg-blue-50/80 border-b border-slate-200">
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Mã GD</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Loại</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Hướng tiền</th>
                <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600" onClick={() => handleSort("amount")}>Số tiền<SortIcon col="amount" /></th>
                <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Số dư sau</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Ví liên quan</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600" onClick={() => handleSort("timestamp")}>Thời gian<SortIcon col="timestamp" /></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">
                    Đang tải dữ liệu sổ cái...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">
                    Không có giao dịch phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-blue-50/60 transition-colors cursor-pointer"
                    onClick={() => router.push(`/accountant/ledger/${item.transactionId ?? item.id}`)}
                  >
                    <td className="px-4 py-3 text-sm text-slate-900 font-mono">{item.transactionCode}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${getTypeClass(item.type)}`}>
                        {getTypeLabel(item.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${getDirectionClass(item.direction)}`}>
                        {getDirectionLabel(item.direction)}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-semibold ${item.direction === TransactionDirection.CREDIT ? "text-emerald-700" : "text-rose-700"}`}>
                      {item.direction === TransactionDirection.CREDIT ? "+" : "-"}{formatCurrency(item.amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-900">{formatCurrency(item.balanceAfter)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatOwnerLabel(item.walletOwnerType, item.ownerId, item.ownerName)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDateTime(item.timestamp)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-slate-200 bg-white/30">
          <p className="text-sm text-slate-500">
            Trang {page}/{totalPages} · Tổng {total} giao dịch
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${tone}`}>{value}</p>
    </div>
  );
}

function LedgerMetric({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: "blue" | "emerald" | "rose";
}) {
  const toneClass = {
    blue: "from-blue-50 to-indigo-50 border-blue-100 text-blue-700",
    emerald: "from-emerald-50 to-teal-50 border-emerald-100 text-emerald-700",
    rose: "from-rose-50 to-red-50 border-rose-100 text-rose-700",
  }[tone];

  return (
    <div className={`rounded-2xl border bg-linear-to-br ${toneClass} p-4 shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-75">{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  );
}
