"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  AuditAction,
  AuditLogFilterParams,
  AuditLogResponse,
  PaginatedResponse,
} from "@/types";
import { formatDateTime } from "@/lib/format";
import { TableRowSkeleton } from "@/components/ui/skeleton";

const PAGE_LIMIT = 20;

// TODO: Replace when Sprint 6 is complete
const MOCK_AUDITS: AuditLogResponse[] = [
  {
    id: 1,
    actorId: 1,
    actorName: "Admin System",
    action: AuditAction.USER_CREATED,
    entityName: "users",
    entityId: "101",
    oldValues: null,
    newValues: {
      email: "new.user@ifms.vn",
      role: "EMPLOYEE",
      status: "PENDING",
    },
    createdAt: "2026-04-09T08:15:00",
  },
  {
    id: 2,
    actorId: 1,
    actorName: "Admin Security",
    action: AuditAction.CONFIG_UPDATED,
    entityName: "system_configs",
    entityId: "PIN_MAX_RETRY",
    oldValues: { value: "3" },
    newValues: { value: "5" },
    createdAt: "2026-04-09T07:40:00",
  },
  {
    id: 3,
    actorId: 2,
    actorName: "Admin HR",
    action: AuditAction.USER_LOCKED,
    entityName: "users",
    entityId: "EMP001",
    oldValues: { status: "ACTIVE" },
    newValues: { status: "LOCKED" },
    createdAt: "2026-04-08T15:30:00",
  },
  {
    id: 4,
    actorId: 4,
    actorName: "CFO",
    action: AuditAction.QUOTA_ADJUSTED,
    entityName: "departments",
    entityId: "IT",
    oldValues: { totalProjectQuota: 700000000 },
    newValues: { totalProjectQuota: 800000000 },
    createdAt: "2026-04-08T11:20:00",
  },
];

function parsePage(value: string | null): number {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page > 0 ? page : 1;
}


function pickItems<T>(payload: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(payload) ? payload : payload.items;
}

function getTotal<T>(payload: PaginatedResponse<T> | T[]): number {
  return Array.isArray(payload) ? payload.length : payload.total;
}

function filterMock(
  audits: AuditLogResponse[],
  actor = "",
  action = "",
  startDate = "",
  endDate = ""
): AuditLogResponse[] {
  return audits.filter((item) => {
    if (actor.trim()) {
      const actorValue = actor.trim().toLowerCase();
      const haystack = `${item.actorName ?? ""} ${item.actorId ?? ""}`.toLowerCase();
      if (!haystack.includes(actorValue)) return false;
    }

    if (action && item.action !== action) return false;

    const createdTime = new Date(item.createdAt).getTime();

    if (startDate) {
      const startTime = new Date(`${startDate}T00:00:00`).getTime();
      if (createdTime < startTime) return false;
    }

    if (endDate) {
      const endTime = new Date(`${endDate}T23:59:59`).getTime();
      if (createdTime > endTime) return false;
    }

    return true;
  });
}

export default function AuditLogsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsString = searchParams.toString();
  const actorFilter = useMemo(() => searchParams.get("actor") ?? "", [searchParams]);
  const actionFilter = useMemo(() => searchParams.get("action") ?? "", [searchParams]);
  const startDate = useMemo(() => searchParams.get("startDate") ?? "", [searchParams]);
  const endDate = useMemo(() => searchParams.get("endDate") ?? "", [searchParams]);
  const page = useMemo(() => parsePage(searchParams.get("page")), [searchParams]);

  const [items, setItems] = useState<AuditLogResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [actorInput, setActorInput] = useState(actorFilter);

  const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    setActorInput(actorFilter);
  }, [actorFilter]);

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
      const trimmed = actorInput.trim();
      if (trimmed === actorFilter) return;
      updateParam("actor", trimmed || undefined);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [actorInput, actorFilter, updateParam]);

  useEffect(() => {
    let cancelled = false;

    const loadAudits = async () => {
      setLoading(true);
      setError(null);

      try {
        const filters: AuditLogFilterParams = {
          actor: actorFilter.trim() || undefined,
          action: actionFilter ? (actionFilter as AuditAction) : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page,
          limit: PAGE_LIMIT,
        };

        const query = new URLSearchParams();
        if (filters.actor) query.set("actor", filters.actor);
        if (filters.action) query.set("action", filters.action);
        if (filters.startDate) query.set("startDate", filters.startDate);
        if (filters.endDate) query.set("endDate", filters.endDate);
        query.set("page", String(filters.page ?? 1));
        query.set("limit", String(filters.limit ?? PAGE_LIMIT));

        const res = await api.get<PaginatedResponse<AuditLogResponse> | AuditLogResponse[]>(
          `/api/v1/admin/audit?${query.toString()}`
        );

        if (cancelled) return;

        const list = pickItems(res.data);
        const apiTotal = getTotal(res.data);
        const apiTotalPages = Array.isArray(res.data)
          ? Math.max(1, Math.ceil(apiTotal / PAGE_LIMIT))
          : res.data.totalPages;

        setItems(Array.isArray(res.data) ? list.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT) : list);
        setTotal(apiTotal);
        setTotalPages(apiTotalPages);
      } catch (err) {
        if (cancelled) return;

        const filtered = filterMock(MOCK_AUDITS, actorFilter, actionFilter, startDate, endDate);
        const mockTotal = filtered.length;
        const mockTotalPages = Math.max(1, Math.ceil(mockTotal / PAGE_LIMIT));
        const safePage = Math.min(page, mockTotalPages);
        const start = (safePage - 1) * PAGE_LIMIT;

        setItems(filtered.slice(start, start + PAGE_LIMIT));
        setTotal(mockTotal);
        setTotalPages(mockTotalPages);

        if (safePage !== page) goToPage(safePage);

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Khong the tai du lieu API, dang hien thi du lieu mau.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadAudits();

    return () => {
      cancelled = true;
    };
  }, [actionFilter, actorFilter, endDate, goToPage, page, startDate]);

  const openDetail = (item: AuditLogResponse) => {
    setSelectedLog(item);
    setShowDetailModal(true);
  };

  const handleExport = () => {
    setNotice("Xuat CSV se duoc bo sung o Sprint tiep theo.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nhat ky he thong</h1>
          <p className="text-slate-500 mt-1">Audit trail bat bien cho moi thao tac quan trong trong he thong.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex w-fit px-3 py-1.5 rounded-full border border-rose-300 bg-rose-100 text-rose-700 text-sm font-medium">
            Read-only
          </span>
          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm text-slate-900"
          >
            Xuat CSV
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          value={actorInput}
          onChange={(event) => setActorInput(event.target.value)}
          placeholder="Nguoi thuc hien (ID/ten)"
          className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm"
        />

        <select
          value={actionFilter}
          onChange={(event) => updateParam("action", event.target.value || undefined)}
          className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm"
        >
          <option value="">Tat ca hanh dong</option>
          {Object.values(AuditAction).map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(event) => updateParam("startDate", event.target.value || undefined)}
          className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm"
        />

        <input
          type="date"
          value={endDate}
          onChange={(event) => updateParam("endDate", event.target.value || undefined)}
          className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3.5">Thoi gian</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3.5">Nguoi thuc hien</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3.5">Hanh dong</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3.5">Doi tuong</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3.5">Chi tiet</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton colSpan={5} rows={8} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500 text-sm py-12">
                    Khong co ban ghi audit phu hop.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors hover:bg-slate-100/20 cursor-pointer"
                    onClick={() => openDetail(item)}
                  >
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDateTime(item.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{item.actorName ?? "System"}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex px-2 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs">
                        {item.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.entityName}#{item.entityId}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">Xem chi tiet</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Trang {page}/{totalPages} • Tong {total} ban ghi
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm transition-colors"
          >
            Truoc
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

      {notice && (
        <div className="px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm">
          {notice}
        </div>
      )}

      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowDetailModal(false)}
            aria-label="Dong modal chi tiet audit"
          />

          <div className="absolute inset-x-0 top-10 mx-auto w-[calc(100%-2rem)] max-w-3xl rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Chi tiet audit #{selectedLog.id}</h3>
                <p className="text-sm text-slate-500 mt-1">{formatDateTime(selectedLog.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                X
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <InfoCard label="Nguoi thuc hien" value={selectedLog.actorName ?? "System"} />
              <InfoCard label="Hanh dong" value={selectedLog.action} />
              <InfoCard label="Doi tuong" value={`${selectedLog.entityName}#${selectedLog.entityId}`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <JsonCard title="Gia tri cu" value={selectedLog.oldValues} />
              <JsonCard title="Gia tri moi" value={selectedLog.newValues} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-100 mt-1">{value}</p>
    </div>
  );
}

function JsonCard({ title, value }: { title: string; value: Record<string, unknown> | null }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 space-y-2">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <pre className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-3 overflow-auto max-h-64">
        {value ? JSON.stringify(value, null, 2) : "null"}
      </pre>
    </div>
  );
}
