"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  CreatePayrollPeriodBody,
  PaginatedResponse,
  PayrollDetailResponse,
  PayrollPeriodListItem,
  PayrollStatus,
} from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { CardListSkeleton } from "@/components/ui/skeleton";

const PAGE_LIMIT = 8;

// ─── MOCK (xóa khi backend sẵn sàng) ───────────────────────────────────────
const MOCK_PERIODS: PayrollPeriodListItem[] = [
  {
    id: 6,
    periodCode: "PR-2026-04",
    name: "Lương tháng 04/2026",
    month: 4,
    year: 2026,
    startDate: "2026-04-01",
    endDate: "2026-04-30",
    status: PayrollStatus.PROCESSING,
    employeeCount: 12,
    totalNetPayroll: 0,
    createdAt: "2026-04-04T08:00:00",
    updatedAt: "2026-04-04T09:30:00",
  },
  {
    id: 5,
    periodCode: "PR-2026-03",
    name: "Lương tháng 03/2026",
    month: 3,
    year: 2026,
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    status: PayrollStatus.COMPLETED,
    employeeCount: 12,
    totalNetPayroll: 162_500_000,
    createdAt: "2026-03-28T08:00:00",
    updatedAt: "2026-04-02T17:00:00",
  },
  {
    id: 4,
    periodCode: "PR-2026-02",
    name: "Lương tháng 02/2026",
    month: 2,
    year: 2026,
    startDate: "2026-02-01",
    endDate: "2026-02-28",
    status: PayrollStatus.COMPLETED,
    employeeCount: 12,
    totalNetPayroll: 159_750_000,
    createdAt: "2026-02-25T08:00:00",
    updatedAt: "2026-03-03T16:00:00",
  },
  {
    id: 3,
    periodCode: "PR-2026-01",
    name: "Lương tháng 01/2026",
    month: 1,
    year: 2026,
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    status: PayrollStatus.COMPLETED,
    employeeCount: 11,
    totalNetPayroll: 154_000_000,
    createdAt: "2026-01-28T08:00:00",
    updatedAt: "2026-02-02T15:00:00",
  },
];
// TODO: Replace when backend ready (đã có — xóa mock sau khi xác nhận hoạt động)
// ────────────────────────────────────────────────────────────────────────────

function parsePage(value: string | null): number {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseYear(value: string | null): number | undefined {
  if (!value) return undefined;
  const year = Number(value);
  return Number.isFinite(year) && year >= 2000 ? year : undefined;
}

function parseStatus(value: string | null): PayrollStatus | undefined {
  if (!value) return undefined;
  if (value === PayrollStatus.DRAFT) return PayrollStatus.DRAFT;
  if (value === PayrollStatus.PROCESSING) return PayrollStatus.PROCESSING;
  if (value === PayrollStatus.COMPLETED) return PayrollStatus.COMPLETED;
  return undefined;
}

function pickItems<T>(payload: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(payload) ? payload : payload.items;
}

function pickTotal<T>(payload: PaginatedResponse<T> | T[], fallbackSize: number): number {
  return Array.isArray(payload) ? fallbackSize : payload.total;
}

function pickTotalPages<T>(payload: PaginatedResponse<T> | T[], fallbackSize: number): number {
  return Array.isArray(payload)
    ? Math.max(1, Math.ceil(fallbackSize / PAGE_LIMIT))
    : payload.totalPages;
}

function getStatusLabel(status: PayrollStatus): string {
  switch (status) {
    case PayrollStatus.DRAFT:       return "Nháp";
    case PayrollStatus.PROCESSING:  return "Đang xử lý";
    case PayrollStatus.COMPLETED:   return "Hoàn tất";
    default: return status;
  }
}

function getStatusClass(status: PayrollStatus): string {
  switch (status) {
    case PayrollStatus.DRAFT:      return "bg-slate-100 border-slate-200 text-slate-600";
    case PayrollStatus.PROCESSING: return "bg-amber-100 border-amber-200 text-amber-700";
    case PayrollStatus.COMPLETED:  return "bg-emerald-100 border-emerald-200 text-emerald-700";
    default: return "bg-slate-100 border-slate-200 text-slate-600";
  }
}

function buildPeriodName(month: number, year: number): string {
  return `Lương tháng ${String(month).padStart(2, "0")}/${year}`;
}

function getMonthRange(month: number, year: number): { startDate: string; endDate: string } {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

export default function AccountantPayrollPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsString = searchParams.toString();
  const page = useMemo(() => parsePage(searchParams.get("page")), [searchParams]);
  const year = useMemo(() => parseYear(searchParams.get("year")), [searchParams]);
  const status = useMemo(() => parseStatus(searchParams.get("status")), [searchParams]);

  const [items, setItems] = useState<PayrollPeriodListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const currentDate = new Date();
  const [periodMonth, setPeriodMonth] = useState(currentDate.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(currentDate.getFullYear());
  const [periodName, setPeriodName] = useState(buildPeriodName(currentDate.getMonth() + 1, currentDate.getFullYear()));
  const [nameTouched, setNameTouched] = useState(false);

  useEffect(() => {
    if (!nameTouched) {
      setPeriodName(buildPeriodName(periodMonth, periodYear));
    }
  }, [nameTouched, periodMonth, periodYear]);

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
    let cancelled = false;

    const loadPeriods = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams();
        if (year) query.set("year", String(year));
        if (status) query.set("status", status);
        query.set("page", String(page));
        query.set("limit", String(PAGE_LIMIT));

        const res = await api.get<PaginatedResponse<PayrollPeriodListItem> | PayrollPeriodListItem[]>(
          `/api/v1/accountant/payroll?${query.toString()}`
        );

        if (cancelled) return;

        const pageItems = pickItems(res.data);
        const apiTotal = pickTotal(res.data, pageItems.length);
        const apiTotalPages = pickTotalPages(res.data, pageItems.length);

        setItems(pageItems);
        setTotal(apiTotal);
        setTotalPages(apiTotalPages);

        const safePage = Math.min(page, Math.max(1, apiTotalPages));
        if (safePage !== page) goToPage(safePage);
      } catch (err) {
        if (cancelled) return;

        // Defensive fallback: hiển thị mock khi API lỗi
        const filtered = MOCK_PERIODS.filter((item) => {
          if (status && item.status !== status) return false;
          if (year && item.year !== year) return false;
          return true;
        });
        const mockTotal = filtered.length;
        const mockTotalPages = Math.max(1, Math.ceil(mockTotal / PAGE_LIMIT));
        const safePage = Math.min(page, mockTotalPages);
        const start = (safePage - 1) * PAGE_LIMIT;

        setItems(filtered.slice(start, start + PAGE_LIMIT));
        setTotal(mockTotal);
        setTotalPages(mockTotalPages);
        if (safePage !== page) goToPage(safePage);

        setError(err instanceof ApiError ? err.apiMessage : "Không thể tải dữ liệu, đang hiển thị dữ liệu mẫu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPeriods();
    return () => { cancelled = true; };
  }, [goToPage, page, year, status]);

  const openCreateModal = () => {
    const now = new Date();
    const nextMonth = now.getMonth() + 2;
    const month = nextMonth > 12 ? 1 : nextMonth;
    const nextYear = nextMonth > 12 ? now.getFullYear() + 1 : now.getFullYear();

    setPeriodMonth(month);
    setPeriodYear(nextYear);
    setPeriodName(buildPeriodName(month, nextYear));
    setNameTouched(false);
    setCreateError(null);
    setShowCreateModal(true);
  };

  const handleCreatePeriod = async () => {
    if (periodMonth < 1 || periodMonth > 12) {
      setCreateError("Tháng phải nằm trong khoảng 1–12.");
      return;
    }
    if (periodYear < 2000 || periodYear > 2100) {
      setCreateError("Năm không hợp lệ.");
      return;
    }
    if (!periodName.trim()) {
      setCreateError("Tên kỳ lương là bắt buộc.");
      return;
    }

    setCreating(true);
    setCreateError(null);

    const { startDate, endDate } = getMonthRange(periodMonth, periodYear);
    const body: CreatePayrollPeriodBody = {
      name: periodName.trim(),
      month: periodMonth,
      year: periodYear,
      startDate,
      endDate,
    };

    try {
      // POST trả PayrollPeriodDetailResponse
      const res = await api.post<PayrollDetailResponse>("/api/v1/accountant/payroll", body);
      setShowCreateModal(false);
      router.push(`/accountant/payroll/${res.data.id}`);
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.apiMessage : "Không thể tạo kỳ lương.");
    } finally {
      setCreating(false);
    }
  };

  const statusTabs: Array<{ label: string; value?: PayrollStatus }> = [
    { label: "Tất cả" },
    { label: "Nháp", value: PayrollStatus.DRAFT },
    { label: "Đang xử lý", value: PayrollStatus.PROCESSING },
    { label: "Hoàn tất", value: PayrollStatus.COMPLETED },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý bảng lương</h1>
          <p className="text-slate-500 mt-1">Danh sách kỳ lương và quy trình xử lý payroll cho toàn bộ nhân viên.</p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/v1/accountant/payroll/template"
            download="payroll_template.xlsx"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v13m0 0l-4-4m4 4l4-4M4 20h16" />
            </svg>
            Tải template
          </a>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v14m7-7H5" />
            </svg>
            Tạo kỳ lương
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((tab) => {
            const active = status === tab.value || (!status && !tab.value);
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => updateParam("status", tab.value)}
                className={`px-3 py-1.5 rounded-xl border text-sm transition-colors ${
                  active
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Year filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600 shrink-0">Năm:</label>
          <select
            value={year ?? ""}
            onChange={(e) => updateParam("year", e.target.value || undefined)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">Tất cả</option>
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <CardListSkeleton rows={4} height="h-40" />
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
          <p className="text-slate-600">Không có kỳ lương phù hợp bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => router.push(`/accountant/payroll/${item.id}`)}
              className="w-full bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-2xl p-4 text-left transition-all"
            >
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500 font-mono">{item.periodCode}</p>
                    <p className="text-lg font-semibold text-slate-900 mt-1">{item.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Tháng {item.month}/{item.year}</p>
                  </div>
                  <span
                    className={`inline-flex w-fit px-2.5 py-1 rounded-full border text-xs ${getStatusClass(item.status)} ${
                      item.status === PayrollStatus.PROCESSING ? "animate-pulse" : ""
                    }`}
                  >
                    {getStatusLabel(item.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <InfoCell label="Nhân viên" value={`${item.employeeCount} người`} />
                  <InfoCell label="Tổng net" value={formatCurrency(item.totalNetPayroll)} tone="text-emerald-700" />
                  <InfoCell label="Tạo lúc" value={formatDateTime(item.createdAt)} />
                  <InfoCell
                    label={item.status === PayrollStatus.COMPLETED ? "Hoàn tất" : "Cập nhật"}
                    value={formatDateTime(item.updatedAt)}
                  />
                </div>

                <div className="flex justify-end">
                  <span className="inline-flex w-fit px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-900">
                    Xem chi tiết →
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Trang {page}/{totalPages} · Tổng {total} kỳ lương
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

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowCreateModal(false)}
            aria-label="Đóng"
          />
          <div className="absolute inset-x-0 top-10 mx-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Tạo kỳ lương mới</h3>

            <div>
              <label className="block text-sm text-slate-600 mb-2">Tên kỳ lương</label>
              <input
                value={periodName}
                onChange={(e) => { setPeriodName(e.target.value); setNameTouched(true); }}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600 mb-2">Tháng</label>
                <select
                  value={periodMonth}
                  onChange={(e) => setPeriodMonth(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-2">Năm</label>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={periodYear}
                  onChange={(e) => setPeriodYear(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>

            {createError && (
              <div className="px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm">
                {createError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleCreatePeriod()}
                disabled={creating}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
              >
                {creating ? "Đang tạo..." : "Tạo kỳ lương"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm font-medium mt-1 ${tone ?? "text-slate-900"}`}>{value}</p>
    </div>
  );
}
