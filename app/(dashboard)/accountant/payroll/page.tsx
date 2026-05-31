"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import { useToast } from "@/contexts/toast-context";
import {
  CreatePayrollPeriodBody,
  PaginatedResponse,
  PayrollDetailResponse,
  PayrollPeriodListItem,
  PayrollStatus,
} from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { SideDrawer } from "@/components/ui/side-drawer";

const PAGE_LIMIT = 8;


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
  const toast = useToast();

  const searchParamsString = searchParams.toString();
  const page = useMemo(() => parsePage(searchParams.get("page")), [searchParams]);
  const year = useMemo(() => parseYear(searchParams.get("year")), [searchParams]);
  const status = useMemo(() => parseStatus(searchParams.get("status")), [searchParams]);

  const [items, setItems] = useState<PayrollPeriodListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

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
        setItems([]);
        setTotal(0);
        setTotalPages(1);
        toast.error(err instanceof ApiError ? err.apiMessage : "Không thể tải danh sách kỳ lương.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPeriods();
    return () => { cancelled = true; };
  }, [goToPage, page, year, status, toast]);

  const openCreateModal = () => {
    const now = new Date();
    const nextMonth = now.getMonth() + 2;
    const month = nextMonth > 12 ? 1 : nextMonth;
    const nextYear = nextMonth > 12 ? now.getFullYear() + 1 : now.getFullYear();

    setPeriodMonth(month);
    setPeriodYear(nextYear);
    setPeriodName(buildPeriodName(month, nextYear));
    setNameTouched(false);
    setShowCreateModal(true);
  };

  const handleCreatePeriod = async () => {
    if (periodMonth < 1 || periodMonth > 12) {
      toast.error("Tháng phải nằm trong khoảng 1–12.");
      return;
    }
    if (periodYear < 2000 || periodYear > 2100) {
      toast.error("Năm không hợp lệ.");
      return;
    }
    if (!periodName.trim()) {
      toast.error("Tên kỳ lương là bắt buộc.");
      return;
    }

    setCreating(true);

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
      toast.error(err instanceof ApiError ? err.apiMessage : "Không thể tạo kỳ lương.");
    } finally {
      setCreating(false);
    }
  };

  const totalNetOnPage = useMemo(
    () => items.reduce((sum, item) => sum + item.totalNetPayroll, 0),
    [items],
  );
  const completedCount = useMemo(
    () => items.filter((item) => item.status === PayrollStatus.COMPLETED).length,
    [items],
  );

  const statusTabs: Array<{ label: string; value?: PayrollStatus }> = [
    { label: "Tất cả" },
    { label: "Nháp", value: PayrollStatus.DRAFT },
    { label: "Đang xử lý", value: PayrollStatus.PROCESSING },
    { label: "Hoàn tất", value: PayrollStatus.COMPLETED },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blue-200 bg-linear-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-900/10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Payroll operations
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý bảng lương</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Tạo kỳ lương, import dữ liệu, rà soát khấu trừ tạm ứng và chạy payroll cho toàn bộ nhân viên.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/api/v1/accountant/payroll/template"
              download="payroll_template.xlsx"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Tải template
            </a>
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-lg shadow-blue-950/10 transition hover:bg-blue-50"
            >
              Tạo kỳ lương
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <PayrollMetric label="Tổng kỳ lương" value={String(total)} helper={`Trang ${page}/${totalPages}`} tone="blue" />
        <PayrollMetric label="Đã hoàn tất trên trang" value={String(completedCount)} helper={`${items.length} kỳ đang hiển thị`} tone="emerald" />
        <PayrollMetric label="Tổng net trên trang" value={formatCurrency(totalNetOnPage)} helper={year ? `Năm ${year}` : "Tất cả năm"} tone="violet" />
      </section>

      <div className="hidden">
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

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Bộ lọc kỳ lương</h2>
          <p className="mt-1 text-sm text-slate-500">Theo dõi trạng thái xử lý và lọc nhanh theo năm.</p>
        </div>
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
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/20"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
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
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
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
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-12 text-center">
          <p className="text-slate-600">Không có kỳ lương phù hợp bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => router.push(`/accountant/payroll/${item.id}`)}
              className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
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
                  <span className="inline-flex w-fit rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/20">
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

      <SideDrawer
        open={showCreateModal}
        title="Tạo kỳ lương mới"
        description="Thiết lập kỳ payroll trước khi import file Excel và chạy quy trình chi lương."
        onClose={() => setShowCreateModal(false)}
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleCreatePeriod()}
              disabled={creating}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Đang tạo..." : "Tạo kỳ lương"}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Tên kỳ lương</span>
            <input
              value={periodName}
              onChange={(event) => {
                setPeriodName(event.target.value);
                setNameTouched(true);
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Tháng</span>
              <select
                value={periodMonth}
                onChange={(event) => setPeriodMonth(Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                {Array.from({ length: 12 }).map((_, index) => (
                  <option key={index + 1} value={index + 1}>Tháng {index + 1}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Năm</span>
              <input
                type="number"
                min={2000}
                max={2100}
                value={periodYear}
                onChange={(event) => setPeriodYear(Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </div>
        </div>
      </SideDrawer>
    </div>
  );
}

function InfoCell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm font-medium mt-1 ${tone ?? "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function PayrollMetric({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: "blue" | "emerald" | "violet";
}) {
  const toneClass = {
    blue: "from-blue-50 to-indigo-50 border-blue-100 text-blue-700",
    emerald: "from-emerald-50 to-teal-50 border-emerald-100 text-emerald-700",
    violet: "from-violet-50 to-fuchsia-50 border-violet-100 text-violet-700",
  }[tone];

  return (
    <div className={`rounded-2xl border bg-linear-to-br ${toneClass} p-4 shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-75">{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  );
}
