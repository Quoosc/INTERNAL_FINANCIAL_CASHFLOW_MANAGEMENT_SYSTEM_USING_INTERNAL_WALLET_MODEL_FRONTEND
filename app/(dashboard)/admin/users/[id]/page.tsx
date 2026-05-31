"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import { useToast } from "@/contexts/toast-context";
import {
  AdminUserDetailResponse,
  DepartmentListItem,
  LockUserResponse,
  PaginatedResponse,
  RoleName,
  UnlockUserResponse,
  UpdateUserBody,
  UserStatus,
} from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { SideDrawer } from "@/components/ui/side-drawer";
interface PageProps {
  params: Promise<{ id: string }>;
}

const ROLE_OPTIONS: { value: RoleName; label: string; roleId: number }[] = [
  { value: RoleName.EMPLOYEE, label: "Nhân viên", roleId: 1 },
  { value: RoleName.TEAM_LEADER, label: "Team Leader", roleId: 2 },
  { value: RoleName.MANAGER, label: "Manager", roleId: 3 },
  { value: RoleName.ACCOUNTANT, label: "Kế toán", roleId: 4 },
  { value: RoleName.CFO, label: "CFO", roleId: 5 },
  { value: RoleName.ADMIN, label: "Admin", roleId: 6 },
];

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

function roleLabel(role: string): string {
  const option = ROLE_OPTIONS.find((item) => item.value === role);
  return option?.label ?? role;
}

function normalizeRole(role: string): RoleName {
  const values = Object.values(RoleName);
  return values.includes(role as RoleName) ? (role as RoleName) : RoleName.EMPLOYEE;
}

function normalizeMoney(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export default function AdminUserDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const toast = useToast();

  const [user, setUser] = useState<AdminUserDetailResponse | null>(null);
  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [confirmState, setConfirmState] = useState<{ open: boolean; message: string; onConfirm: () => void }>(
    { open: false, message: "", onConfirm: () => {} }
  );

  const [processing, setProcessing] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState<RoleName>(RoleName.EMPLOYEE);
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      setLoading(true);

      try {
        const res = await api.get<AdminUserDetailResponse>(`/api/v1/admin/users/${id}`);
        if (cancelled) return;
        setUser(res.data);
      } catch (err) {
        if (cancelled) return;
        setUser(null);
        toast.error(err instanceof ApiError ? err.apiMessage : "Không thể tải thông tin user.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  useEffect(() => {
    let cancelled = false;

    const loadDepartments = async () => {
      try {
        const res = await api.get<PaginatedResponse<DepartmentListItem> | DepartmentListItem[]>(
          "/api/v1/admin/departments?page=1&limit=100"
        );
        if (cancelled) return;
        setDepartments(Array.isArray(res.data) ? res.data : res.data.items);
      } catch {
        if (cancelled) return;
        setDepartments([]);
      }
    };

    void loadDepartments();

    return () => {
      cancelled = true;
    };
  }, []);

  const initials = useMemo(() => {
    const fullName = user?.fullName ?? "User";
    return fullName
      .split(/\s+/)
      .slice(-2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [user]);

  const openEditModal = () => {
    if (!user) return;

    setEditFullName(user.fullName);
    setEditRole(normalizeRole(user.role));
    setEditDepartmentId(user.departmentId ? String(user.departmentId) : "");
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!user) return;

    const selectedRole = ROLE_OPTIONS.find((option) => option.value === editRole);
    if (!selectedRole) {
      toast.error("Vai trò không hợp lệ.");
      return;
    }

    if (!editFullName.trim()) {
      toast.error("Họ tên là bắt buộc.");
      return;
    }

    const departmentIdNumber = Number(editDepartmentId);

    const body: UpdateUserBody = {
      fullName: editFullName.trim(),
      roleId: selectedRole.roleId,
      departmentId:
        Number.isFinite(departmentIdNumber) && departmentIdNumber > 0 ? departmentIdNumber : undefined,
    };

    setSaving(true);

    try {
      const res = await api.put<AdminUserDetailResponse>(`/api/v1/admin/users/${user.id}`, body);
      setUser(res.data);
      toast.success("Đã cập nhật thông tin user.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.apiMessage : "Không thể cập nhật thông tin user.");
    } finally {
      setSaving(false);
      setShowEditModal(false);
    }
  };

  const handleToggleLock = () => {
    if (!user) return;
    const isLocked = user.status === UserStatus.LOCKED;
    setConfirmState({
      open: true,
      message: isLocked ? "Mở khóa tài khoản này?" : "Khóa tài khoản này?",
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }));

    setProcessing(true);

    try {
      if (isLocked) {
        const res = await api.post<UnlockUserResponse>(`/api/v1/admin/users/${user.id}/unlock`);
        setUser((prev) => (prev ? { ...prev, status: res.data.status } : prev));
        toast.success("Đã mở khóa tài khoản.");
      } else {
        const res = await api.post<LockUserResponse>(`/api/v1/admin/users/${user.id}/lock`);
        setUser((prev) => (prev ? { ...prev, status: res.data.status } : prev));
        toast.success("Đã khóa tài khoản.");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.apiMessage : "Không thể thay đổi trạng thái tài khoản.");
      } finally {
        setProcessing(false);
      }
    },
    });
  };

  const handleResetPassword = () => {
    if (!user) return;
    setConfirmState({
      open: true,
      message: "Reset mật khẩu tạm và gửi email cho user này?",
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }));

    setProcessing(true);

    try {
      await api.post<{ message: string }>(`/api/v1/admin/users/${user.id}/reset-password`);
      toast.success("Đã reset mật khẩu và gửi email onboarding.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.apiMessage : "Không thể reset mật khẩu.");
      } finally {
        setProcessing(false);
      }
    },
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blue-200 bg-linear-to-br from-blue-700 via-blue-600 to-cyan-600 text-white shadow-xl shadow-blue-900/15">
        <div className="relative p-6 sm:p-8">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-10 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">IFMS workspace</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">User profile</h1>
            <p className="mt-3 text-sm leading-6 text-blue-100">Manage employee identity, role, department and account status.</p>
          </div>
        </div>
      </section>

        <div className="h-8 w-52 rounded bg-white animate-pulse" />
        <div className="h-32 rounded-2xl bg-white animate-pulse" />
        <div className="h-72 rounded-2xl bg-white animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <div className="text-slate-600">Không tìm thấy user.</div>;
  }

  const securitySettings = user.securitySettings ?? {
    hasPIN: false,
    pinLockedUntil: null,
    retryCount: 0,
  };
  const walletBalance = normalizeMoney(user.wallet?.balance);
  const walletPendingBalance = normalizeMoney(user.wallet?.pendingBalance);
  const walletDebtBalance = normalizeMoney(user.wallet?.debtBalance);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blue-200 bg-linear-to-br from-blue-700 via-blue-600 to-cyan-600 text-white shadow-xl shadow-blue-900/15">
        <div className="relative p-6 sm:p-8">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-10 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">IFMS workspace</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">User profile</h1>
            <p className="mt-3 text-sm leading-6 text-blue-100">Manage employee identity, role, department and account status.</p>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => router.push("/admin/users")}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại
      </button>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border border-slate-200 bg-white text-slate-100 flex items-center justify-center font-semibold">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{user.fullName}</h1>
              <p className="text-sm text-slate-500 mt-1">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex px-3 py-1.5 rounded-full border text-sm ${roleBadgeClass(user.role)}`}>
              {roleLabel(user.role)}
            </span>
            <span className={`inline-flex px-3 py-1.5 rounded-full border text-sm ${statusBadgeClass(user.status)}`}>
              {user.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Thông tin cơ bản</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoCard label="Mã nhân viên" value={user.employeeCode ?? "—"} />
              <InfoCard label="Phòng ban" value={user.departmentName ?? "—"} />
              <InfoCard label="Chức danh" value={user.jobTitle ?? "—"} />
              <InfoCard label="Số điện thoại" value={user.phoneNumber ?? "—"} />
              <InfoCard label="Ngày sinh" value={user.dateOfBirth ?? "—"} />
              <InfoCard label="CCCD" value={user.citizenId ?? "—"} />
              <InfoCard label="Địa chỉ" value={user.address ?? "—"} />
              <InfoCard label="Ngày tạo" value={formatDateTime(user.createdAt)} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Thông tin ví</h2>
            {user.wallet ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <InfoCard label="Tổng số dư" value={formatCurrency(walletBalance)} tone="text-slate-900" />
                <InfoCard label="Đang xử lý" value={formatCurrency(walletPendingBalance)} tone="text-amber-700" />
                <InfoCard label="Tạm ứng còn nợ" value={formatCurrency(walletDebtBalance)} tone="text-rose-700" />
              </div>
            ) : (
              <p className="text-sm text-slate-500">User chưa có ví.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Bảo mật</h2>
            <InfoCard label="Đã có PIN" value={securitySettings.hasPIN ? "Có" : "Chưa"} />
            <InfoCard label="PIN khóa đến" value={securitySettings.pinLockedUntil ?? "—"} />
            <InfoCard label="Số lần nhập sai PIN" value={String(securitySettings.retryCount ?? 0)} />
            <InfoCard label="Đăng nhập lần đầu" value={user.isFirstLogin ? "Có" : "Không"} />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Thao tác</h2>
            <button
              type="button"
              onClick={openEditModal}
              className="w-full px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold"
            >
              Sửa thông tin
            </button>
            <button
              type="button"
              onClick={handleToggleLock}
              disabled={processing}
              className={`w-full px-4 py-2.5 rounded-xl text-slate-900 text-sm font-semibold disabled:opacity-60 ${
                user.status === UserStatus.LOCKED
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-rose-600 hover:bg-rose-500"
              }`}
            >
              {user.status === UserStatus.LOCKED ? "Mở khóa" : "Khóa tài khoản"}
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={processing}
              className="w-full px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold disabled:opacity-60"
            >
              Reset mật khẩu
            </button>
          </div>
        </div>
      </div>

      <SideDrawer
        open={showEditModal}
        title="Sửa thông tin user"
        onClose={() => setShowEditModal(false)}
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
            >
              {saving ? "Đang lưu..." : "Lưu cập nhật"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-2">Họ tên</label>
            <input
              value={editFullName}
              onChange={(event) => setEditFullName(event.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-600 mb-2">Vai trò</label>
              <select
                value={editRole}
                onChange={(event) => setEditRole(event.target.value as RoleName)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
                value={editDepartmentId}
                onChange={(event) => setEditDepartmentId(event.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
        </div>
      </SideDrawer>
      <ConfirmModal
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}

function InfoCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm mt-1 ${tone ?? "text-slate-900"}`}>{value}</p>
    </div>
  );
}
