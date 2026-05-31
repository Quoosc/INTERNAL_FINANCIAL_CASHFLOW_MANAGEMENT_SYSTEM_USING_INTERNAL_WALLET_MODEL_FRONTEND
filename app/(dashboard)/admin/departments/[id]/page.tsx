"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import { useToast } from "@/contexts/toast-context";
import {
  AdminUserListItem,
  DepartmentDetailResponse,
  DepartmentMemberItem,
  UpdateDepartmentBody,
} from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { CurrencyInput } from "@/components/ui/currency-input";
import { SideDrawer } from "@/components/ui/side-drawer";

interface PageProps {
  params: Promise<{ id: string }>;
}

function statusBadgeClass(status: string): string {
  if (status === "ACTIVE") return "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (status === "LOCKED") return "bg-rose-50 border-rose-200 text-rose-700";
  if (status === "PENDING") return "bg-amber-50 border-amber-200 text-amber-700";
  return "bg-slate-100 border-slate-200 text-slate-600";
}

function statusLabel(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "Đang hoạt động";
    case "LOCKED":
      return "Đã khóa";
    case "PENDING":
      return "Chờ kích hoạt";
    default:
      return status;
  }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function quotaUsagePercent(department: DepartmentDetailResponse): number {
  if (!department.totalProjectQuota || department.totalProjectQuota <= 0) return 0;
  const used = Math.max(0, department.totalProjectQuota - department.totalAvailableBalance);
  return Math.min(100, Math.round((used / department.totalProjectQuota) * 100));
}

function MetricCard({
  label,
  value,
  helper,
  tone = "blue",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "blue" | "emerald" | "violet" | "amber";
}) {
  const toneClass = {
    blue: "from-blue-50 to-indigo-50 text-blue-700 border-blue-100",
    emerald: "from-emerald-50 to-teal-50 text-emerald-700 border-emerald-100",
    violet: "from-violet-50 to-fuchsia-50 text-violet-700 border-violet-100",
    amber: "from-amber-50 to-orange-50 text-amber-700 border-amber-100",
  }[tone];

  return (
    <div className={`rounded-2xl border bg-linear-to-br ${toneClass} p-4 shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-75">{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

export default function AdminDepartmentDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const toast = useToast();

  const [department, setDepartment] = useState<DepartmentDetailResponse | null>(null);
  const [managers, setManagers] = useState<AdminUserListItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [memberSearch, setMemberSearch] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editNameError, setEditNameError] = useState("");
  const [editManagerId, setEditManagerId] = useState("");
  const [editQuota, setEditQuota] = useState<number | null>(null);
  const [editQuotaError, setEditQuotaError] = useState("");

  const filteredMembers = useMemo(() => {
    if (!department) return [];
    const q = memberSearch.trim().toLowerCase();
    if (!q) return department.members;

    return department.members.filter((member) => {
      const haystack = `${member.employeeCode} ${member.fullName} ${member.email} ${member.jobTitle ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [department, memberSearch]);

  const budget = useMemo(() => {
    if (!department) {
      return { used: 0, usage: 0 };
    }

    const used = Math.max(0, department.totalProjectQuota - department.totalAvailableBalance);
    return {
      used,
      usage: quotaUsagePercent(department),
    };
  }, [department]);

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      setLoading(true);

      try {
        const res = await api.get<DepartmentDetailResponse>(`/api/v1/admin/departments/${id}`);
        if (cancelled) return;
        setDepartment(res.data);
      } catch (err) {
        if (cancelled) return;
        setDepartment(null);
        toast.error(err instanceof ApiError ? err.apiMessage : "Không thể tải thông tin phòng ban.");
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

    const loadManagers = async () => {
      try {
        const res = await api.get<{ items?: AdminUserListItem[] } | AdminUserListItem[]>(
          "/api/v1/admin/users?role=MANAGER&page=1&limit=100"
        );

        if (cancelled) return;

        if (Array.isArray(res.data)) {
          setManagers(res.data);
        } else {
          setManagers(res.data.items ?? []);
        }
      } catch {
        if (cancelled) return;
        setManagers([]);
      }
    };

    void loadManagers();

    return () => {
      cancelled = true;
    };
  }, []);

  const openEditModal = () => {
    if (!department) return;

    setEditName(department.name);
    setEditNameError("");
    setEditManagerId(department.manager?.id ? String(department.manager.id) : "");
    setEditQuota(department.totalProjectQuota);
    setEditQuotaError("");
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!department) return;

    const quotaNumber = editQuota ?? 0;
    const managerIdNumber = Number(editManagerId);

    if (!editName.trim()) {
      setEditNameError("Tên phòng ban là bắt buộc.");
      toast.error("Tên phòng ban là bắt buộc.");
      return;
    }

    if (quotaNumber < 0) {
      setEditQuotaError("Quota phải là số không âm.");
      toast.error("Quota phải là số không âm.");
      return;
    }

    setSaving(true);

    const body: UpdateDepartmentBody = {
      name: editName.trim(),
      managerId: Number.isFinite(managerIdNumber) && managerIdNumber > 0 ? managerIdNumber : undefined,
      totalProjectQuota: quotaNumber,
    };

    try {
      const res = await api.put<DepartmentDetailResponse>(`/api/v1/admin/departments/${department.id}`, body);
      setDepartment(res.data);
      toast.success("Đã cập nhật thông tin phòng ban.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.apiMessage : "Không thể cập nhật phòng ban.");
    } finally {
      setSaving(false);
      setShowEditModal(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-40 animate-pulse rounded-2xl bg-white" />
        <div className="h-52 animate-pulse rounded-3xl bg-white" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-3xl bg-white" />
      </div>
    );
  }

  if (!department) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-950">Không tìm thấy phòng ban</h1>
        <p className="mt-2 text-sm text-slate-500">Phòng ban này không tồn tại hoặc bạn không có quyền truy cập.</p>
        <button
          type="button"
          onClick={() => router.push("/admin/departments")}
          className="mt-5 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push("/admin/departments")}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:border-blue-200 hover:text-blue-700"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại
      </button>

      <section className="overflow-hidden rounded-3xl border border-blue-200 bg-linear-to-br from-blue-700 via-blue-600 to-cyan-600 text-white shadow-xl shadow-blue-900/15">
        <div className="relative px-6 py-7 sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.28),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(125,211,252,0.24),_transparent_34%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-50 backdrop-blur">
                {department.code}
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{department.name}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-50/90">
                Chi tiết cấu trúc phòng ban, phân bổ ngân sách và danh sách nhân sự thuộc phòng ban.
              </p>

              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur">
                  Trưởng phòng: {department.manager?.fullName ?? "Chưa gán"}
                </span>
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur">
                  Cập nhật: {formatDateTime(department.updatedAt)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={openEditModal}
              className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-blue-700 shadow-lg shadow-blue-950/20 hover:bg-blue-50"
            >
              Sửa phòng ban
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tổng quota"
          value={formatCurrency(department.totalProjectQuota)}
          helper="Ngân sách được phân bổ"
          tone="violet"
        />
        <MetricCard
          label="Đã sử dụng"
          value={formatCurrency(budget.used)}
          helper={`${budget.usage}% tổng quota`}
          tone={budget.usage >= 85 ? "amber" : "blue"}
        />
        <MetricCard
          label="Khả dụng"
          value={formatCurrency(department.totalAvailableBalance)}
          helper="Có thể cấp cho dự án"
          tone="emerald"
        />
        <MetricCard
          label="Thành viên"
          value={String(department.members.length)}
          helper={`${filteredMembers.length} theo bộ lọc hiện tại`}
          tone="amber"
        />
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">Tình trạng quota</h2>
              <p className="mt-1 text-sm text-slate-500">Theo dõi mức sử dụng ngân sách của phòng ban.</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {budget.usage}% đã dùng
            </span>
          </div>

          <div className="mt-6">
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${budget.usage >= 85 ? "bg-rose-500" : budget.usage >= 65 ? "bg-amber-500" : "bg-blue-500"}`}
                style={{ width: `${budget.usage}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <BudgetPill label="Đã dùng" value={formatCurrency(budget.used)} />
              <BudgetPill label="Khả dụng" value={formatCurrency(department.totalAvailableBalance)} />
              <BudgetPill label="Tổng quota" value={formatCurrency(department.totalProjectQuota)} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-950">Thông tin quản trị</h2>
          <div className="mt-4 space-y-3">
            <InfoRow label="Mã phòng ban" value={department.code} mono />
            <InfoRow label="Trưởng phòng" value={department.manager?.fullName ?? "Chưa gán"} />
            <InfoRow label="Ngày tạo" value={formatDateTime(department.createdAt)} />
            <InfoRow label="Cập nhật lần cuối" value={formatDateTime(department.updatedAt)} />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Danh sách thành viên</h2>
            <p className="mt-1 text-sm text-slate-500">Nhân sự đang thuộc phòng ban này.</p>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35m1.6-5.65a7.25 7.25 0 11-14.5 0 7.25 7.25 0 0114.5 0z" />
            </svg>
            <input
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder="Tìm thành viên..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87M12 12a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-950">Không có thành viên phù hợp</h3>
            <p className="mt-1 text-sm text-slate-500">Thử đổi từ khóa tìm kiếm hoặc kiểm tra dữ liệu phòng ban.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur">
                <tr className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-5 py-4">Nhân sự</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Chức danh</th>
                  <th className="px-5 py-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member: DepartmentMemberItem) => (
                  <tr key={member.id} className="transition hover:bg-slate-50/80">
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-700">
                          {member.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={member.avatar} alt="" className="h-full w-full rounded-2xl object-cover" />
                          ) : (
                            initials(member.fullName)
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">{member.fullName}</p>
                          <p className="mt-1 font-mono text-xs text-slate-500">{member.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5 text-sm text-slate-600">{member.email}</td>
                    <td className="px-5 py-5 text-sm text-slate-600">{member.jobTitle ?? "-"}</td>
                    <td className="px-5 py-5">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(member.status)}`}>
                        {statusLabel(member.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <SideDrawer
        open={showEditModal}
        title="Cập nhật phòng ban"
        description="Điều chỉnh thông tin quản trị và quota ngân sách."
        widthClassName="max-w-2xl"
        onClose={() => setShowEditModal(false)}
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/15 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu cập nhật"}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">Cấu hình phòng ban</p>
            <p className="mt-1 text-sm text-blue-700">
              Thay đổi trưởng phòng hoặc quota sẽ ảnh hưởng đến quy trình cấp ngân sách dự án.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tên phòng ban <span className="text-rose-500">*</span>
            </label>
            <input
              value={editName}
              onChange={(event) => {
                setEditName(event.target.value);
                if (editNameError) setEditNameError("");
              }}
              onBlur={() => {
                if (!editName.trim()) setEditNameError("Tên phòng ban là bắt buộc.");
              }}
              className={`w-full rounded-2xl border bg-white px-4 py-3 text-slate-900 outline-none transition focus:ring-4 focus:ring-blue-500/10 ${
                editNameError ? "border-rose-300" : "border-slate-200 focus:border-blue-300"
              }`}
            />
            {editNameError && <p className="mt-1 text-xs text-rose-600">{editNameError}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Trưởng phòng</label>
              <select
                value={editManagerId}
                onChange={(event) => setEditManagerId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
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
              <label className="mb-2 block text-sm font-semibold text-slate-700">Tổng quota</label>
              <CurrencyInput
                value={editQuota}
                onChange={(value) => {
                  setEditQuota(value);
                  if (editQuotaError) setEditQuotaError("");
                }}
                error={editQuotaError}
              />
            </div>
          </div>
        </div>
      </SideDrawer>
    </div>
  );
}

function BudgetPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-right text-sm font-semibold text-slate-900 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
