"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  AdminUserListItem,
  CreateDepartmentBody,
  DepartmentListItem,
  PaginatedResponse,
  UpdateDepartmentBody,
} from "@/types";
import { formatCurrency } from "@/lib/format";
import { MOCK_DEPARTMENTS, MOCK_MANAGERS } from "@/lib/mocks/departments";

const PAGE_LIMIT = 10;


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

function filterMockDepartments(items: DepartmentListItem[], search = ""): DepartmentListItem[] {
  const q = search.trim().toLowerCase();
  if (!q) return items;

  return items.filter((item) => {
    const haystack = `${item.code} ${item.name} ${item.manager?.fullName ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });
}

export default function AdminDepartmentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsString = searchParams.toString();
  const search = useMemo(() => searchParams.get("search") ?? "", [searchParams]);
  const page = useMemo(() => parsePage(searchParams.get("page")), [searchParams]);

  const [items, setItems] = useState<DepartmentListItem[]>([]);
  const [managers, setManagers] = useState<AdminUserListItem[]>([]);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(search);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formManagerId, setFormManagerId] = useState("");
  const [formQuota, setFormQuota] = useState("");

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

    const loadManagers = async () => {
      try {
        const res = await api.get<PaginatedResponse<AdminUserListItem> | AdminUserListItem[]>(
          "/api/v1/admin/users?role=MANAGER&page=1&limit=100"
        );
        if (cancelled) return;
        setManagers(pickItems(res.data));
      } catch {
        if (cancelled) return;
        setManagers(MOCK_MANAGERS);
      }
    };

    void loadManagers();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDepartments = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams();
        if (search.trim()) query.set("search", search.trim());
        query.set("page", String(page));
        query.set("limit", String(PAGE_LIMIT));

        const res = await api.get<PaginatedResponse<DepartmentListItem> | DepartmentListItem[]>(
          `/api/v1/admin/departments?${query.toString()}`
        );

        if (cancelled) return;

        setItems(pickItems(res.data));
        setTotal(getTotal(res.data));
        setTotalPages(Array.isArray(res.data) ? Math.max(1, Math.ceil(getTotal(res.data) / PAGE_LIMIT)) : res.data.totalPages);
      } catch (err) {
        if (cancelled) return;

        const filtered = filterMockDepartments(MOCK_DEPARTMENTS, search);
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
          setError("Không thể tải dữ liệu API, đang hiển thị dữ liệu mẫu.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadDepartments();

    return () => {
      cancelled = true;
    };
  }, [goToPage, page, search]);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingDepartmentId(null);
    setFormName("");
    setFormCode("");
    setFormManagerId("");
    setFormQuota("");
    setNotice(null);
    setShowModal(true);
  };

  const openEditModal = (department: DepartmentListItem) => {
    setIsEditing(true);
    setEditingDepartmentId(department.id);
    setFormName(department.name);
    setFormCode(department.code);
    setFormManagerId(department.manager?.id ? String(department.manager.id) : "");
    setFormQuota(String(department.totalProjectQuota));
    setNotice(null);
    setShowModal(true);
  };

  const handleSaveDepartment = async () => {
    const quotaNumber = Number(formQuota);
    const managerIdNumber = Number(formManagerId);

    if (!formName.trim()) {
      setNotice("Tên phòng ban là bắt buộc.");
      return;
    }

    if (formQuota && (!Number.isFinite(quotaNumber) || quotaNumber < 0)) {
      setNotice("Quota phải là số không âm.");
      return;
    }

    setSaving(true);

    try {
      if (!isEditing) {
        const body: CreateDepartmentBody = {
          name: formName.trim(),
          code: formCode.trim() || undefined,
          managerId: Number.isFinite(managerIdNumber) && managerIdNumber > 0 ? managerIdNumber : undefined,
          totalProjectQuota: Number.isFinite(quotaNumber) ? quotaNumber : undefined,
        };

        const res = await api.post<DepartmentListItem>("/api/v1/admin/departments", body);
        setItems((prev) => [res.data, ...prev].slice(0, PAGE_LIMIT));
        setTotal((prev) => prev + 1);
        setNotice("Đã tạo phòng ban mới.");
      } else {
        if (!editingDepartmentId) return;

        const body: UpdateDepartmentBody = {
          name: formName.trim(),
          managerId: Number.isFinite(managerIdNumber) && managerIdNumber > 0 ? managerIdNumber : undefined,
          totalProjectQuota: Number.isFinite(quotaNumber) ? quotaNumber : undefined,
        };

        const res = await api.put<DepartmentListItem>(`/api/v1/admin/departments/${editingDepartmentId}`, body);
        setItems((prev) => prev.map((item) => (item.id === editingDepartmentId ? res.data : item)));
        setNotice("Đã cập nhật phòng ban.");
      }
    } catch {
      const selectedManager = managers.find((manager) => manager.id === managerIdNumber);

      if (!isEditing) {
        const mockDepartment: DepartmentListItem = {
          id: Date.now(),
          name: formName.trim(),
          code: formCode.trim() || `DEP${String(Date.now()).slice(-3)}`,
          manager: selectedManager ? { id: selectedManager.id, fullName: selectedManager.fullName } : null,
          employeeCount: 0,
          totalProjectQuota: Number.isFinite(quotaNumber) ? quotaNumber : 0,
          totalAvailableBalance: Number.isFinite(quotaNumber) ? quotaNumber : 0,
          createdAt: new Date().toISOString(),
        };

        setItems((prev) => [mockDepartment, ...prev].slice(0, PAGE_LIMIT));
        setTotal((prev) => prev + 1);
        setNotice("API chưa sẵn sàng, đã mô phỏng tạo phòng ban.");
      } else if (editingDepartmentId) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === editingDepartmentId
              ? {
                  ...item,
                  name: formName.trim(),
                  code: formCode.trim() || item.code,
                  manager: selectedManager ? { id: selectedManager.id, fullName: selectedManager.fullName } : null,
                  totalProjectQuota: Number.isFinite(quotaNumber) ? quotaNumber : item.totalProjectQuota,
                }
              : item
          )
        );
        setNotice("API chưa sẵn sàng, đã mô phỏng cập nhật phòng ban.");
      }
    } finally {
      setSaving(false);
      setShowModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý phòng ban</h1>
          <p className="text-slate-500 mt-1">Tạo phòng ban, phân bổ quota và theo dõi ngân sách.</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          Tạo phòng ban
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
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
            placeholder="Tìm theo mã, tên phòng ban, manager..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={`department-skeleton-${index}`} className="h-52 rounded-2xl bg-white animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center text-slate-500">
          Không có phòng ban phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((department) => (
            <div
              key={department.id}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4 hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-500 font-mono">{department.code}</p>
                  <p className="text-base font-semibold text-slate-900 mt-1">{department.name}</p>
                </div>
                <span className="text-xs text-slate-500">{department.employeeCount} nhân sự</span>
              </div>

              <div className="space-y-1 text-sm text-slate-600">
                <p>Trưởng phòng: {department.manager?.fullName ?? "Chưa gán"}</p>
                <p>Quota: {formatCurrency(department.totalProjectQuota)}</p>
                <p>Khả dụng: {formatCurrency(department.totalAvailableBalance)}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/admin/departments/${department.id}`)}
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-sm text-slate-900"
                >
                  Xem chi tiết
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(department)}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white"
                >
                  Sửa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Trang {page}/{totalPages} • Tổng {total} phòng ban
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

      {notice && (
        <div className="px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm">
          {notice}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowModal(false)}
            aria-label="Đóng modal phòng ban"
          />

          <div className="absolute inset-x-0 top-10 mx-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">
              {isEditing ? "Cập nhật phòng ban" : "Tạo phòng ban mới"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600 mb-2">Tên phòng ban</label>
                <input
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">Mã phòng ban</label>
                <input
                  value={formCode}
                  onChange={(event) => setFormCode(event.target.value)}
                  placeholder="Có thể để trống"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600 mb-2">Trưởng phòng</label>
                <select
                  value={formManagerId}
                  onChange={(event) => setFormManagerId(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900"
                >
                  <option value="">Chưa gán trưởng phòng</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={String(manager.id)}>
                      {manager.fullName} ({manager.employeeCode ?? manager.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">Tổng quota</label>
                <input
                  type="number"
                  min={0}
                  value={formQuota}
                  onChange={(event) => setFormQuota(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveDepartment}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
              >
                {saving ? "Đang lưu..." : isEditing ? "Lưu cập nhật" : "Tạo phòng ban"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
