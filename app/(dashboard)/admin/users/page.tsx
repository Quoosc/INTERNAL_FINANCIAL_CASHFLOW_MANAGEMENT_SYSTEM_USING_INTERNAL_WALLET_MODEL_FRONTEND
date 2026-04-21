"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  AdminUserFilterParams,
  AdminUserListItem,
  CreateUserBody,
  CreateUserResponse,
  DepartmentListItem,
  LockUserResponse,
  PaginatedResponse,
  RoleName,
  UnlockUserResponse,
  UserStatus,
} from "@/types";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { MOCK_DEPARTMENTS } from "@/lib/mocks/departments";
import { TableRowSkeleton } from "@/components/ui/skeleton";

const PAGE_LIMIT = 10;

const ROLE_OPTIONS: { value: RoleName; label: string; roleId: number }[] = [
  { value: RoleName.EMPLOYEE, label: "Nhân viên", roleId: 1 },
  { value: RoleName.TEAM_LEADER, label: "Team Leader", roleId: 2 },
  { value: RoleName.MANAGER, label: "Manager", roleId: 3 },
  { value: RoleName.ACCOUNTANT, label: "Kế toán", roleId: 4 },
  { value: RoleName.CFO, label: "CFO", roleId: 5 },
  { value: RoleName.ADMIN, label: "Admin", roleId: 6 },
];

// TODO: Replace when Sprint 2 is complete
const MOCK_USERS: AdminUserListItem[] = [
  {
    id: 1,
    fullName: "Trần Quang Minh",
    email: "admin@ifms.vn",
    employeeCode: "ADM001",
    role: RoleName.ADMIN,
    departmentId: null,
    departmentName: null,
    jobTitle: "System Administrator",
    avatar: null,
    debtBalance: 0,
    status: UserStatus.ACTIVE,
    createdAt: "2026-01-01T08:00:00",
  },
  {
    id: 2,
    fullName: "Nguyễn Văn Tùng",
    email: "manager.sales@ifms.vn",
    employeeCode: "MGR002",
    role: RoleName.MANAGER,
    departmentId: 2,
    departmentName: "Phòng Kinh doanh",
    jobTitle: "Manager Sales",
    avatar: null,
    debtBalance: 0,
    status: UserStatus.ACTIVE,
    createdAt: "2026-01-03T08:00:00",
  },
  {
    id: 3,
    fullName: "Lê Thu Trang",
    email: "tl.it@ifms.vn",
    employeeCode: "TL002",
    role: RoleName.TEAM_LEADER,
    departmentId: 1,
    departmentName: "Phòng CNTT",
    jobTitle: "Team Leader IT",
    avatar: null,
    debtBalance: 0,
    status: UserStatus.ACTIVE,
    createdAt: "2026-01-05T08:00:00",
  },
  {
    id: 4,
    fullName: "Đỗ Quốc Bảo",
    email: "emp.it1@ifms.vn",
    employeeCode: "EMP001",
    role: RoleName.EMPLOYEE,
    departmentId: 1,
    departmentName: "Phòng CNTT",
    jobTitle: "Frontend Developer",
    avatar: null,
    debtBalance: 2_500_000,
    status: UserStatus.LOCKED,
    createdAt: "2026-01-08T08:00:00",
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

function roleLabel(role: string): string {
  const match = ROLE_OPTIONS.find((item) => item.value === role);
  return match?.label ?? role;
}

function roleBadgeClass(role: string): string {
  switch (role) {
    case RoleName.ADMIN:
      return "bg-rose-100 border-rose-200 text-rose-700";
    case RoleName.CFO:
      return "bg-violet-100 border-violet-200 text-violet-700";
    case RoleName.ACCOUNTANT:
      return "bg-amber-100 border-amber-200 text-amber-700";
    case RoleName.MANAGER:
      return "bg-blue-100 border-blue-200 text-blue-700";
    case RoleName.TEAM_LEADER:
      return "bg-indigo-100 border-indigo-200 text-indigo-700";
    default:
      return "bg-slate-100 border-slate-200 text-slate-600";
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case UserStatus.ACTIVE:
      return "bg-emerald-100 border-emerald-200 text-emerald-700";
    case UserStatus.LOCKED:
      return "bg-rose-100 border-rose-200 text-rose-700";
    case UserStatus.PENDING:
      return "bg-amber-100 border-amber-200 text-amber-700";
    default:
      return "bg-slate-100 border-slate-200 text-slate-600";
  }
}

function filterMockUsers(
  users: AdminUserListItem[],
  role?: string,
  status?: string,
  search = ""
): AdminUserListItem[] {
  const q = search.trim().toLowerCase();

  return users.filter((user) => {
    if (role && user.role !== role) return false;
    if (status && user.status !== status) return false;

    if (!q) return true;

    const haystack = `${user.fullName} ${user.email} ${user.employeeCode ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });
}

export default function AdminUsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsString = searchParams.toString();
  const roleFilter = useMemo(() => searchParams.get("role") ?? "", [searchParams]);
  const statusFilter = useMemo(() => searchParams.get("status") ?? "", [searchParams]);
  const search = useMemo(() => searchParams.get("search") ?? "", [searchParams]);
  const page = useMemo(() => parsePage(searchParams.get("page")), [searchParams]);

  const [items, setItems] = useState<AdminUserListItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(search);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<RoleName>(RoleName.EMPLOYEE);
  const [newDepartmentId, setNewDepartmentId] = useState("");

  const [processingUserId, setProcessingUserId] = useState<number | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: "", onConfirm: () => {} });

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

    const loadDepartments = async () => {
      try {
        const res = await api.get<PaginatedResponse<DepartmentListItem> | DepartmentListItem[]>(
          "/api/v1/admin/departments?page=1&limit=100"
        );
        if (cancelled) return;
        setDepartments(pickItems(res.data));
      } catch {
        if (cancelled) return;
        setDepartments(MOCK_DEPARTMENTS);
      }
    };

    void loadDepartments();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const filters: AdminUserFilterParams = {
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          search: search.trim() || undefined,
          page,
          limit: PAGE_LIMIT,
        };

        const query = new URLSearchParams();
        if (filters.role) query.set("role", filters.role);
        if (filters.status) query.set("status", filters.status);
        if (filters.search) query.set("search", filters.search);
        query.set("page", String(filters.page ?? 1));
        query.set("limit", String(filters.limit ?? PAGE_LIMIT));

        const res = await api.get<PaginatedResponse<AdminUserListItem> | AdminUserListItem[]>(
          `/api/v1/admin/users?${query.toString()}`
        );

        if (cancelled) return;

        setItems(pickItems(res.data));
        setTotal(getTotal(res.data));
        setTotalPages(Array.isArray(res.data) ? Math.max(1, Math.ceil(getTotal(res.data) / PAGE_LIMIT)) : res.data.totalPages);
      } catch (err) {
        if (cancelled) return;

        const filtered = filterMockUsers(MOCK_USERS, roleFilter || undefined, statusFilter || undefined, search);
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

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [goToPage, page, roleFilter, search, statusFilter]);

  const handleCreateUser = async () => {
    const selectedRole = ROLE_OPTIONS.find((option) => option.value === newRole);
    if (!selectedRole) {
      setNotice("Không xác định được role hợp lệ.");
      return;
    }

    if (!newFullName.trim()) {
      setNotice("Họ tên là bắt buộc.");
      return;
    }

    if (!newEmail.trim() || !newEmail.includes("@")) {
      setNotice("Email không hợp lệ.");
      return;
    }

    setCreating(true);

    const departmentIdNumber = Number(newDepartmentId);

    const body: CreateUserBody = {
      fullName: newFullName.trim(),
      email: newEmail.trim(),
      roleId: selectedRole.roleId,
      departmentId: Number.isFinite(departmentIdNumber) && departmentIdNumber > 0 ? departmentIdNumber : undefined,
    };

    try {
      const res = await api.post<CreateUserResponse>("/api/v1/admin/users", body);

      const createdItem: AdminUserListItem = {
        id: res.data.id,
        fullName: res.data.fullName,
        email: res.data.email,
        employeeCode: null,
        role: res.data.role,
        departmentId: res.data.departmentId,
        departmentName: res.data.departmentName,
        jobTitle: null,
        avatar: null,
        debtBalance: 0,
        status: res.data.status,
        createdAt: res.data.createdAt,
      };

      setItems((prev) => [createdItem, ...prev].slice(0, PAGE_LIMIT));
      setTotal((prev) => prev + 1);
      setNotice("Đã tạo user mới và gửi email onboarding.");
    } catch {
      const mockId = Date.now();
      const selectedDepartment = departments.find((department) => department.id === body.departmentId);

      const createdItem: AdminUserListItem = {
        id: mockId,
        fullName: body.fullName,
        email: body.email,
        employeeCode: null,
        role: newRole,
        departmentId: body.departmentId ?? null,
        departmentName: selectedDepartment?.name ?? null,
        jobTitle: null,
        avatar: null,
        debtBalance: 0,
        status: UserStatus.PENDING,
        createdAt: new Date().toISOString(),
      };

      setItems((prev) => [createdItem, ...prev].slice(0, PAGE_LIMIT));
      setTotal((prev) => prev + 1);
      setNotice("API chưa sẵn sàng, đã mô phỏng tạo user mới.");
    } finally {
      setCreating(false);
      setShowCreateModal(false);
      setNewFullName("");
      setNewEmail("");
      setNewRole(RoleName.EMPLOYEE);
      setNewDepartmentId("");
    }
  };

  const handleToggleLock = (user: AdminUserListItem) => {
    const isLocked = user.status === UserStatus.LOCKED;
    setConfirmState({
      open: true,
      message: isLocked ? `Mở khóa tài khoản ${user.fullName}?` : `Khóa tài khoản ${user.fullName}?`,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        setProcessingUserId(user.id);
        try {
          if (isLocked) {
            const res = await api.post<UnlockUserResponse>(`/api/v1/admin/users/${user.id}/unlock`);
            setItems((prev) => prev.map((item) => (item.id === user.id ? { ...item, status: res.data.status } : item)));
            setNotice(`Đã mở khóa ${user.fullName}.`);
          } else {
            const res = await api.post<LockUserResponse>(`/api/v1/admin/users/${user.id}/lock`);
            setItems((prev) => prev.map((item) => (item.id === user.id ? { ...item, status: res.data.status } : item)));
            setNotice(`Đã khóa ${user.fullName}.`);
          }
        } catch {
          setItems((prev) =>
            prev.map((item) =>
              item.id === user.id
                ? { ...item, status: isLocked ? UserStatus.ACTIVE : UserStatus.LOCKED }
                : item
            )
          );
          setNotice("API chưa sẵn sàng, đã mô phỏng thao tác lock/unlock.");
        } finally {
          setProcessingUserId(null);
        }
      },
    });
  };

  const handleResetPassword = (user: AdminUserListItem) => {
    setConfirmState({
      open: true,
      message: `Reset mật khẩu tạm cho ${user.fullName}?`,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        setProcessingUserId(user.id);
        try {
          await api.post<{ message: string }>(`/api/v1/admin/users/${user.id}/reset-password`);
          setNotice(`Đã reset mật khẩu và gửi email cho ${user.email}.`);
        } catch {
          setNotice("API chưa sẵn sàng, đã mô phỏng reset mật khẩu.");
        } finally {
          setProcessingUserId(null);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý nhân sự</h1>
          <p className="text-slate-500 mt-1">Danh sách nhân sự, tạo tài khoản và quản lý trạng thái truy cập.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNotice(null);
            setShowCreateModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          Tạo người dùng
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={roleFilter}
            onChange={(event) => updateParam("role", event.target.value || undefined)}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm"
          >
            <option value="">Tất cả vai trò</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => updateParam("status", event.target.value || undefined)}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value={UserStatus.ACTIVE}>ACTIVE</option>
            <option value={UserStatus.LOCKED}>LOCKED</option>
            <option value={UserStatus.PENDING}>PENDING</option>
          </select>

          <div className="md:col-span-2 relative">
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
              placeholder="Tìm theo tên, email, mã nhân viên..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3.5">Mã NV</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3.5">Họ tên</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3.5">Vai trò</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3.5">Phòng ban</th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3.5">Trạng thái</th>
                <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3.5">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton colSpan={6} rows={6} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 text-sm py-12">
                    Không có user phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                items.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-600">{user.employeeCode ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{user.fullName}</p>
                        <p className="text-xs text-slate-500 mt-1">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${roleBadgeClass(user.role)}`}>
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{user.departmentName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${statusBadgeClass(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs"
                        >
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleLock(user)}
                          disabled={processingUserId === user.id}
                          className={`px-2.5 py-1.5 rounded-lg text-xs text-slate-900 disabled:opacity-60 ${
                            user.status === UserStatus.LOCKED
                              ? "bg-emerald-600 hover:bg-emerald-500"
                              : "bg-rose-600 hover:bg-rose-500"
                          }`}
                        >
                          {user.status === UserStatus.LOCKED ? "Mở khóa" : "Khóa"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetPassword(user)}
                          disabled={processingUserId === user.id}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs disabled:opacity-60"
                        >
                          Reset MK
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Trang {page}/{totalPages} • Tổng {total} user
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

      {showCreateModal && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowCreateModal(false)}
            aria-label="Đóng modal tạo user"
          />

          <div className="absolute inset-x-0 top-10 mx-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Tạo người dùng mới</h3>
            <p className="text-sm text-slate-500">
              Hệ thống sẽ tạo mật khẩu tạm và gửi email onboarding cho người dùng.
            </p>

            <div>
              <label className="block text-sm text-slate-600 mb-2">Họ tên</label>
              <input
                value={newFullName}
                onChange={(event) => setNewFullName(event.target.value)}
                placeholder="Nhập họ tên"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-2">Email công ty</label>
              <input
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="name@ifms.vn"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600 mb-2">Vai trò</label>
                <select
                  value={newRole}
                  onChange={(event) => setNewRole(event.target.value as RoleName)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">Phòng ban</label>
                <select
                  value={newDepartmentId}
                  onChange={(event) => setNewDepartmentId(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="">Không gán phòng ban</option>
                  {departments.map((department) => (
                    <option key={department.id} value={String(department.id)}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
                onClick={handleCreateUser}
                disabled={creating}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
              >
                {creating ? "Đang tạo..." : "Tạo user"}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
