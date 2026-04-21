"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  AdminUserListItem,
  DepartmentDetailResponse,
  DepartmentMemberItem,
  UpdateDepartmentBody,
} from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { MOCK_MANAGERS } from "@/lib/mocks/departments";

interface PageProps {
  params: Promise<{ id: string }>;
}

// TODO: Replace when Sprint 2 is complete
const MOCK_DEPARTMENT_DETAIL: DepartmentDetailResponse = {
  id: 1,
  name: "Phòng CNTT",
  code: "IT",
  manager: {
    id: 5,
    fullName: "Trần Thị Bích",
  },
  totalProjectQuota: 800_000_000,
  totalAvailableBalance: 524_500_000,
  members: [
    {
      id: 5,
      fullName: "Trần Thị Bích",
      employeeCode: "MGR001",
      email: "manager.it@ifms.vn",
      jobTitle: "Manager IT",
      avatar: null,
      status: "ACTIVE",
    },
    {
      id: 11,
      fullName: "Đỗ Quốc Bảo",
      employeeCode: "EMP001",
      email: "emp.it1@ifms.vn",
      jobTitle: "Frontend Developer",
      avatar: null,
      status: "ACTIVE",
    },
    {
      id: 12,
      fullName: "Vũ Thị Lan",
      employeeCode: "EMP002",
      email: "emp.it2@ifms.vn",
      jobTitle: "Backend Developer",
      avatar: null,
      status: "ACTIVE",
    },
  ],
  createdAt: "2026-01-01T08:00:00",
  updatedAt: "2026-04-08T09:00:00",
};

// TODO: Replace when Sprint 2 is complete
function statusBadgeClass(status: string): string {
  if (status === "ACTIVE") return "bg-emerald-100 border-emerald-200 text-emerald-700";
  if (status === "LOCKED") return "bg-rose-100 border-rose-200 text-rose-700";
  return "bg-slate-100 border-slate-200 text-slate-600";
}

export default function AdminDepartmentDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [department, setDepartment] = useState<DepartmentDetailResponse | null>(null);
  const [managers, setManagers] = useState<AdminUserListItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editManagerId, setEditManagerId] = useState("");
  const [editQuota, setEditQuota] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<DepartmentDetailResponse>(`/api/v1/admin/departments/${id}`);
        if (cancelled) return;
        setDepartment(res.data);
      } catch (err) {
        if (cancelled) return;

        const safeId = Number(id);
        setDepartment({
          ...MOCK_DEPARTMENT_DETAIL,
          id: Number.isFinite(safeId) && safeId > 0 ? safeId : MOCK_DEPARTMENT_DETAIL.id,
          code: `DEP-${String(id).padStart(3, "0")}`,
        });

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải dữ liệu API, đang hiển thị dữ liệu mẫu.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [id]);

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
        setManagers(MOCK_MANAGERS);
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
    setEditManagerId(department.manager?.id ? String(department.manager.id) : "");
    setEditQuota(String(department.totalProjectQuota));
    setNotice(null);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!department) return;

    const quotaNumber = Number(editQuota);
    const managerIdNumber = Number(editManagerId);

    if (!editName.trim()) {
      setNotice("Tên phòng ban là bắt buộc.");
      return;
    }

    if (!Number.isFinite(quotaNumber) || quotaNumber < 0) {
      setNotice("Quota phải là số không âm.");
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
      setNotice("Đã cập nhật thông tin phòng ban.");
    } catch {
      const selectedManager = managers.find((manager) => manager.id === body.managerId);

      setDepartment((prev) =>
        prev
          ? {
              ...prev,
              name: body.name ?? prev.name,
              manager: selectedManager
                ? { id: selectedManager.id, fullName: selectedManager.fullName }
                : null,
              totalProjectQuota: body.totalProjectQuota ?? prev.totalProjectQuota,
            }
          : prev
      );

      setNotice("API chưa sẵn sàng, đã mô phỏng cập nhật phòng ban.");
    } finally {
      setSaving(false);
      setShowEditModal(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-60 rounded bg-white animate-pulse" />
        <div className="h-32 rounded-2xl bg-white animate-pulse" />
        <div className="h-80 rounded-2xl bg-white animate-pulse" />
      </div>
    );
  }

  if (!department) {
    return <div className="text-slate-600">Không tìm thấy phòng ban.</div>;
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push("/admin/departments")}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại
      </button>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-mono">{department.code}</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{department.name}</h1>
            <p className="text-sm text-slate-500 mt-1">Trưởng phòng: {department.manager?.fullName ?? "Chưa gán"}</p>
          </div>

          <button
            type="button"
            onClick={openEditModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold"
          >
            Sửa phòng ban
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <InfoCard label="Tổng quota" value={formatCurrency(department.totalProjectQuota)} tone="text-slate-900" />
        <InfoCard label="Khả dụng" value={formatCurrency(department.totalAvailableBalance)} tone="text-emerald-700" />
        <InfoCard label="Số thành viên" value={String(department.members.length)} tone="text-blue-700" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Danh sách thành viên</h2>
          <p className="text-sm text-slate-500">Cập nhật: {formatDateTime(department.updatedAt)}</p>
        </div>

        {department.members.length === 0 ? (
          <p className="text-sm text-slate-500">Phòng ban chưa có thành viên.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3.5">Mã NV</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3.5">Họ tên</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3.5">Email</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3.5">Chức danh</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3.5">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {department.members.map((member: DepartmentMemberItem) => (
                  <tr key={member.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-600">{member.employeeCode}</td>
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{member.fullName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{member.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{member.jobTitle ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${statusBadgeClass(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

      {showEditModal && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowEditModal(false)}
            aria-label="Đóng modal chỉnh sửa phòng ban"
          />

          <div className="absolute inset-x-0 top-10 mx-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Cập nhật phòng ban</h3>

            <div>
              <label className="block text-sm text-slate-600 mb-2">Tên phòng ban</label>
              <input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600 mb-2">Trưởng phòng</label>
                <select
                  value={editManagerId}
                  onChange={(event) => setEditManagerId(event.target.value)}
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
                  value={editQuota}
                  onChange={(event) => setEditQuota(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
              >
                {saving ? "Đang lưu..." : "Lưu cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}
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
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-base font-semibold mt-1 ${tone ?? "text-slate-900"}`}>{value}</p>
    </div>
  );
}
