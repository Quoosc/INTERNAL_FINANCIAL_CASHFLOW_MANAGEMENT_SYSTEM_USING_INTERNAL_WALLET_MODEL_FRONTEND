"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  DisbursementFilterParams,
  DisbursementListItem,
  PaginatedResponse,
  RequestType,
} from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { MOCK_SYSTEM_FUND_BALANCE } from "@/lib/mocks/system";
import { CardListSkeleton } from "@/components/ui/skeleton";

interface DisbursementApprover {
  fullName: string;
  approvedAt: string;
}

interface DisbursementListViewItem extends DisbursementListItem {
  approver?: DisbursementApprover;
}

const PAGE_LIMIT = 10;

// TODO: Replace when Sprint 6 is complete
const MOCK_DISBURSEMENTS: DisbursementListViewItem[] = [
  {
    id: 1,
    requestCode: "REQ-2026-0041",
    type: RequestType.ADVANCE,
    status: "PENDING_ACCOUNTANT_EXECUTION",
    amount: 3_500_000,
    approvedAmount: 3_500_000,
    description: "Mua vật tư thiết bị thí nghiệm cho phase 1.",
    requester: {
      id: 11,
      fullName: "Đỗ Quốc Bảo",
      avatar: null,
      employeeCode: "EMP001",
      jobTitle: "Frontend Developer",
      departmentName: "Phòng IT",
      bankName: "Vietcombank",
      bankAccountNum: "001100220011",
      bankAccountOwner: "DO QUOC BAO",
    },
    approver: {
      fullName: "Hoàng Minh Tuấn",
      approvedAt: "2026-04-03T10:00:00",
    },
    project: {
      id: 1,
      projectCode: "PRJ-IT-001",
      name: "Hệ thống quản lý nội bộ",
    },
    phase: {
      id: 1,
      phaseCode: "PH-001",
      name: "Phase 1 - Phân tích",
    },
    attachments: [],
    createdAt: "2026-04-03T09:15:00",
  },
  {
    id: 2,
    requestCode: "REQ-2026-0042",
    type: RequestType.EXPENSE,
    status: "PENDING_ACCOUNTANT_EXECUTION",
    amount: 850_000,
    approvedAmount: 850_000,
    description: "Chi phí mua license công cụ.",
    requester: {
      id: 12,
      fullName: "Vũ Thị Lan",
      avatar: null,
      employeeCode: "EMP002",
      jobTitle: "Backend Developer",
      departmentName: "Phòng IT",
      bankName: "BIDV",
      bankAccountNum: "102030405060",
      bankAccountOwner: "VU THI LAN",
    },
    approver: {
      fullName: "Hoàng Minh Tuấn",
      approvedAt: "2026-04-03T09:30:00",
    },
    project: {
      id: 1,
      projectCode: "PRJ-IT-001",
      name: "Hệ thống quản lý nội bộ",
    },
    phase: {
      id: 1,
      phaseCode: "PH-001",
      name: "Phase 1 - Phân tích",
    },
    attachments: [],
    createdAt: "2026-04-02T14:30:00",
  },
  {
    id: 3,
    requestCode: "REQ-2026-0038",
    type: RequestType.REIMBURSE,
    status: "PENDING_ACCOUNTANT_EXECUTION",
    amount: 1_200_000,
    approvedAmount: 1_200_000,
    description: "Hoàn ứng chi phí kiểm thử QA.",
    requester: {
      id: 13,
      fullName: "Phạm Văn Đức",
      avatar: null,
      employeeCode: "EMP003",
      jobTitle: "QA Engineer",
      departmentName: "Phòng IT",
      bankName: "Techcombank",
      bankAccountNum: "778899665544",
      bankAccountOwner: "PHAM VAN DUC",
    },
    approver: {
      fullName: "Hoàng Minh Tuấn",
      approvedAt: "2026-04-02T16:00:00",
    },
    project: {
      id: 2,
      projectCode: "PRJ-IT-002",
      name: "Nâng cấp hạ tầng mạng",
    },
    phase: {
      id: 4,
      phaseCode: "PH-004",
      name: "Phase 1 - Triển khai",
    },
    attachments: [],
    createdAt: "2026-04-01T10:00:00",
  },
  {
    id: 4,
    requestCode: "REQ-2026-0035",
    type: RequestType.ADVANCE,
    status: "PENDING_ACCOUNTANT_EXECUTION",
    amount: 5_000_000,
    approvedAmount: 4_500_000,
    description: "Tạm ứng chi phí triển khai thiết bị.",
    requester: {
      id: 11,
      fullName: "Đỗ Quốc Bảo",
      avatar: null,
      employeeCode: "EMP001",
      jobTitle: "Frontend Developer",
      departmentName: "Phòng IT",
      bankName: "Vietcombank",
      bankAccountNum: "001100220011",
      bankAccountOwner: "DO QUOC BAO",
    },
    approver: {
      fullName: "Hoàng Minh Tuấn",
      approvedAt: "2026-04-01T14:00:00",
    },
    project: {
      id: 1,
      projectCode: "PRJ-IT-001",
      name: "Hệ thống quản lý nội bộ",
    },
    phase: {
      id: 2,
      phaseCode: "PH-002",
      name: "Phase 2 - Phát triển",
    },
    attachments: [],
    createdAt: "2026-03-31T11:00:00",
  },
];



function parsePage(value: string | null): number {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseTypeQuery(value: string | null): RequestType | undefined {
  if (!value) return undefined;

  if (value === RequestType.ADVANCE) return RequestType.ADVANCE;
  if (value === RequestType.EXPENSE) return RequestType.EXPENSE;
  if (value === RequestType.REIMBURSE) return RequestType.REIMBURSE;

  return undefined;
}

function pickItems<T>(payload: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(payload) ? payload : payload.items;
}

function getFundHealth(balance: number): "HEALTHY" | "LOW" | "CRITICAL" {
  if (balance >= 500_000_000) return "HEALTHY";
  if (balance >= 100_000_000) return "LOW";
  return "CRITICAL";
}

function getFundHealthClass(health: "HEALTHY" | "LOW" | "CRITICAL"): string {
  switch (health) {
    case "HEALTHY":
      return "bg-emerald-100 border-emerald-200 text-emerald-700";
    case "LOW":
      return "bg-amber-100 border-amber-200 text-amber-700";
    case "CRITICAL":
      return "bg-rose-100 border-rose-200 text-rose-700";
    default:
      return "bg-slate-100 border-slate-200 text-slate-600";
  }
}

function getRequestTypeLabel(type: RequestType): string {
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

function getRequestTypeClass(type: RequestType): string {
  switch (type) {
    case RequestType.ADVANCE:
      return "bg-violet-100 border-violet-200 text-violet-700";
    case RequestType.EXPENSE:
      return "bg-sky-100 border-sky-200 text-sky-700";
    case RequestType.REIMBURSE:
      return "bg-amber-100 border-amber-200 text-amber-700";
    default:
      return "bg-slate-100 border-slate-200 text-slate-600";
  }
}

function filterMockData(
  source: DisbursementListViewItem[],
  type?: RequestType,
  search?: string,
): DisbursementListViewItem[] {
  const q = search?.trim().toLowerCase() ?? "";

  return source.filter((item) => {
    if (item.status !== "PENDING_ACCOUNTANT_EXECUTION") return false;
    if (type && item.type !== type) return false;

    if (!q) return true;

    const haystack = [
      item.requestCode,
      item.requester.fullName,
      item.requester.employeeCode,
      item.project.projectCode,
      item.project.name,
      item.phase.name,
      item.approver?.fullName ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

export default function AccountantDisbursementsPage() {
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
  const type = useMemo(
    () => parseTypeQuery(searchParams.get("type")),
    [searchParams],
  );

  const [items, setItems] = useState<DisbursementListViewItem[]>([]);
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

    const loadDisbursements = async () => {
      setLoading(true);
      setError(null);

      try {
        const filters: DisbursementFilterParams = {
          type,
          search: search.trim() || undefined,
          page,
          limit: PAGE_LIMIT,
        };

        const query = new URLSearchParams();
        query.set("status", "PENDING_ACCOUNTANT_EXECUTION");
        if (filters.type) query.set("type", filters.type);
        if (filters.search) query.set("search", filters.search);
        query.set("page", String(filters.page ?? 1));
        query.set("limit", String(filters.limit ?? PAGE_LIMIT));

        const res = await api.get<
          PaginatedResponse<DisbursementListItem> | DisbursementListItem[]
        >(`/api/v1/accountant/disbursements?${query.toString()}`);

        if (cancelled) return;

        const apiItems = pickItems(res.data)
          .filter((item) => item.status === "PENDING_ACCOUNTANT_EXECUTION")
          .map((item) => ({ ...item }));

        const apiTotal = Array.isArray(res.data)
          ? apiItems.length
          : res.data.total;
        const apiTotalPages = Array.isArray(res.data)
          ? Math.max(1, Math.ceil(apiTotal / PAGE_LIMIT))
          : res.data.totalPages;

        setItems(apiItems);
        setTotal(apiTotal);
        setTotalPages(apiTotalPages);
      } catch (err) {
        if (cancelled) return;

        const filtered = filterMockData(MOCK_DISBURSEMENTS, type, search);
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

    void loadDisbursements();

    return () => {
      cancelled = true;
    };
  }, [goToPage, page, search, type]);

  const fundHealth = getFundHealth(MOCK_SYSTEM_FUND_BALANCE);

  const tabs: Array<{ label: string; value?: RequestType }> = [
    { label: "Tất cả" },
    { label: "Tạm ứng", value: RequestType.ADVANCE },
    { label: "Chi phí", value: RequestType.EXPENSE },
    { label: "Hoàn ứng", value: RequestType.REIMBURSE },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Giải ngân</h1>
          <p className="text-slate-500 mt-1">
            Danh sách yêu cầu đã được Team Leader duyệt và chờ Kế toán xử lý.
          </p>
        </div>
        <span className="inline-flex w-fit px-3 py-1.5 rounded-full border border-amber-300 bg-amber-100 text-amber-700 text-sm font-medium">
          {total} chờ xử lý
        </span>
      </div>

      <div className="rounded-2xl border border-cyan-200 bg-linear-to-r from-cyan-50 to-blue-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-slate-900">
          Quỹ hệ thống:{" "}
          <span className="font-semibold text-slate-900">
            {formatCurrency(MOCK_SYSTEM_FUND_BALANCE)}
          </span>
        </p>
        <span
          className={`inline-flex w-fit px-2.5 py-1 rounded-full border text-xs font-medium ${getFundHealthClass(fundHealth)}`}
        >
          {fundHealth}
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = type === tab.value || (!type && !tab.value);
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => updateParam("type", tab.value)}
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
            placeholder="Tìm theo mã yêu cầu, nhân viên, dự án..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      {loading ? (
        <CardListSkeleton rows={4} height="h-48" />
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500">
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
                d="M3 7h18M3 12h18M3 17h18"
              />
            </svg>
          </div>
          <p className="text-slate-600 mt-4">
            Không có yêu cầu chờ giải ngân theo bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const changedAmount = item.approvedAmount !== item.amount;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  router.push(`/accountant/disbursements/${item.id}`)
                }
                className="w-full bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-2xl p-4 text-left transition-all"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full border ${getRequestTypeClass(item.type)}`}
                    >
                      {getRequestTypeLabel(item.type)}
                    </span>
                    <span className="font-mono text-slate-600">
                      {item.requestCode}
                    </span>
                    <span className="text-slate-500">
                      Tạo lúc {formatDateTime(item.createdAt)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.requester.fullName}{" "}
                      <span className="text-slate-500">
                        ({item.requester.employeeCode})
                      </span>
                    </p>
                    <p className="text-sm text-slate-600">
                      {item.project.name}{" "}
                      <span className="text-slate-500">
                        ({item.project.projectCode})
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Duyệt bởi: {item.approver?.fullName ?? "Team Leader"}
                      {item.approver?.approvedAt
                        ? ` • ${formatDateTime(item.approver.approvedAt)}`
                        : ""}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <p className="text-xs text-slate-500">Số tiền yêu cầu</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>

                    <div
                      className={`rounded-xl border px-3 py-2 ${
                        changedAmount
                          ? "border-amber-200 bg-amber-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <p
                        className={`text-xs ${changedAmount ? "text-amber-700" : "text-slate-500"}`}
                      >
                        Số tiền giải ngân
                      </p>
                      <p
                        className={`text-sm font-semibold mt-1 ${changedAmount ? "text-amber-200" : "text-slate-900"}`}
                      >
                        {formatCurrency(item.approvedAmount)}
                      </p>
                    </div>

                    <div className="flex items-center md:justify-end">
                      <span className="inline-flex w-fit px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-900">
                        Xử lý →
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
