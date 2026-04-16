"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  PhaseStatus,
  ProjectDetailResponse,
  ProjectRole,
  ProjectStatus,
  TeamLeaderOptionResponse,
  UpdateProjectBody,
} from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

// TODO: Replace when Sprint 4 is complete
const MOCK_PROJECT: ProjectDetailResponse = {
  id: 1,
  projectCode: "PRJ-IT-001",
  name: "Hệ thống quản lý nội bộ",
  description: "Quản lý tài chính nội bộ theo phase và workflow duyệt.",
  status: ProjectStatus.ACTIVE,
  totalBudget: 150_000_000,
  availableBudget: 88_500_000,
  totalSpent: 61_500_000,
  departmentId: 1,
  managerId: 5,
  currentPhaseId: 1,
  phases: [
    {
      id: 1,
      phaseCode: "PH-001",
      name: "Phase 1 - Phân tích",
      budgetLimit: 50_000_000,
      currentSpent: 47_000_000,
      status: PhaseStatus.ACTIVE,
      startDate: "2026-01-10",
      endDate: "2026-03-31",
    },
    {
      id: 2,
      phaseCode: "PH-002",
      name: "Phase 2 - Phát triển",
      budgetLimit: 80_000_000,
      currentSpent: 14_500_000,
      status: PhaseStatus.ACTIVE,
      startDate: "2026-04-01",
      endDate: "2026-07-31",
    },
  ],
  members: [
    {
      userId: 4,
      fullName: "Hoàng Minh Tuấn",
      avatar: null,
      employeeCode: "TL001",
      projectRole: ProjectRole.LEADER,
      position: "Team Leader IT",
      joinedAt: "2026-01-10T08:00:00",
    },
    {
      userId: 11,
      fullName: "Đỗ Quốc Bảo",
      avatar: null,
      employeeCode: "EMP001",
      projectRole: ProjectRole.MEMBER,
      position: "Frontend Developer",
      joinedAt: "2026-01-15T08:00:00",
    },
  ],
  createdAt: "2026-01-10T08:00:00",
  updatedAt: "2026-04-01T08:00:00",
};

// TODO: Replace when Sprint 4 is complete
const MOCK_TL_OPTIONS: TeamLeaderOptionResponse[] = [
  {
    id: 4,
    fullName: "Hoàng Minh Tuấn",
    employeeCode: "TL001",
    avatar: null,
    email: "tl.it@ifms.vn",
    jobTitle: "Team Leader IT",
  },
  {
    id: 6,
    fullName: "Lê Thu Trang",
    employeeCode: "TL002",
    avatar: null,
    email: "tl.infra@ifms.vn",
    jobTitle: "Team Leader Infra",
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function statusClass(status: string): string {
  switch (status) {
    case ProjectStatus.ACTIVE:
      return "bg-emerald-100 border-emerald-200 text-emerald-700";
    case ProjectStatus.PLANNING:
      return "bg-sky-100 border-sky-200 text-sky-700";
    case ProjectStatus.PAUSED:
      return "bg-amber-100 border-amber-200 text-amber-700";
    case ProjectStatus.CLOSED:
      return "bg-slate-100 border-slate-200 text-slate-600";
    default:
      return "bg-slate-100 border-slate-200 text-slate-600";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case ProjectStatus.ACTIVE:
      return "Đang hoạt động";
    case ProjectStatus.PLANNING:
      return "Lập kế hoạch";
    case ProjectStatus.PAUSED:
      return "Tạm dừng";
    case ProjectStatus.CLOSED:
      return "Đã đóng";
    default:
      return status;
  }
}

function burnPercent(totalSpent: number, totalBudget: number): number {
  if (totalBudget <= 0) return 0;
  return Math.min(100, Math.round((totalSpent / totalBudget) * 100));
}

function burnClass(percent: number): string {
  if (percent >= 85) return "bg-rose-500";
  if (percent >= 65) return "bg-amber-500";
  return "bg-emerald-500";
}

function applyTeamLeader(
  project: ProjectDetailResponse,
  nextLeaderId: number,
  teamLeaders: TeamLeaderOptionResponse[]
): ProjectDetailResponse {
  const selectedLeader = teamLeaders.find((option) => option.id === nextLeaderId);
  if (!selectedLeader) return project;

  const existingLeader = project.members.find((member) => member.projectRole === ProjectRole.LEADER);

  const membersWithoutLeaders = project.members.map((member) => {
    if (member.projectRole !== ProjectRole.LEADER) return member;
    return { ...member, projectRole: ProjectRole.MEMBER };
  });

  const existingSelected = membersWithoutLeaders.find((member) => member.userId === nextLeaderId);

  if (existingSelected) {
    return {
      ...project,
      members: membersWithoutLeaders.map((member) =>
        member.userId === nextLeaderId
          ? { ...member, projectRole: ProjectRole.LEADER, position: selectedLeader.jobTitle ?? member.position }
          : member
      ),
    };
  }

  return {
    ...project,
    members: [
      ...membersWithoutLeaders,
      {
        userId: selectedLeader.id,
        fullName: selectedLeader.fullName,
        avatar: selectedLeader.avatar,
        employeeCode: selectedLeader.employeeCode,
        projectRole: ProjectRole.LEADER,
        position: selectedLeader.jobTitle ?? "Team Leader",
        joinedAt: existingLeader?.joinedAt ?? new Date().toISOString(),
      },
    ],
  };
}

export default function ManagerProjectDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<ProjectDetailResponse | null>(null);
  const [teamLeaders, setTeamLeaders] = useState<TeamLeaderOptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTotalBudget, setEditTotalBudget] = useState("");
  const [editStatus, setEditStatus] = useState<ProjectStatus>(ProjectStatus.PLANNING);
  const [editTeamLeaderId, setEditTeamLeaderId] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProject = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<ProjectDetailResponse>(`/api/v1/manager/projects/${id}`);
        if (cancelled) return;
        setProject(res.data);
      } catch (err) {
        if (cancelled) return;

        const safeId = Number(id);
        setProject({
          ...MOCK_PROJECT,
          id: Number.isFinite(safeId) && safeId > 0 ? safeId : MOCK_PROJECT.id,
          projectCode: `PRJ-MGR-${String(id).padStart(3, "0")}`,
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

    void loadProject();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    const loadTeamLeaders = async () => {
      try {
        const res = await api.get<TeamLeaderOptionResponse[]>("/api/v1/manager/department/team-leaders");
        if (cancelled) return;
        setTeamLeaders(res.data);
      } catch {
        if (cancelled) return;
        setTeamLeaders(MOCK_TL_OPTIONS);
      }
    };

    void loadTeamLeaders();

    return () => {
      cancelled = true;
    };
  }, []);

  const leader = useMemo(
    () => project?.members.find((member) => member.projectRole === ProjectRole.LEADER) ?? null,
    [project]
  );

  const overallBurn = useMemo(() => {
    if (!project) return 0;
    return burnPercent(project.totalSpent, project.totalBudget);
  }, [project]);

  const openEditModal = () => {
    if (!project) return;

    setEditName(project.name);
    setEditDescription(project.description ?? "");
    setEditTotalBudget(String(project.totalBudget));
    setEditStatus(project.status);
    setEditTeamLeaderId(leader ? String(leader.userId) : "");
    setNotice(null);
    setShowEditModal(true);
  };

  const handleSaveChanges = async () => {
    if (!project) return;

    const totalBudgetNumber = Number(editTotalBudget);
    const teamLeaderId = Number(editTeamLeaderId);

    if (!editName.trim()) {
      setNotice("Tên dự án là bắt buộc.");
      return;
    }

    if (!Number.isFinite(totalBudgetNumber) || totalBudgetNumber <= 0) {
      setNotice("Tổng ngân sách phải lớn hơn 0.");
      return;
    }

    if (!Number.isFinite(teamLeaderId) || teamLeaderId <= 0) {
      setNotice("Vui lòng chọn Team Leader.");
      return;
    }

    setSaving(true);

    const body: UpdateProjectBody = {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      totalBudget: totalBudgetNumber,
      status: editStatus,
      teamLeaderId,
    };

    try {
      const res = await api.put<ProjectDetailResponse>(`/api/v1/manager/projects/${project.id}`, body);
      setProject(res.data);
      setNotice("Đã cập nhật thông tin dự án.");
    } catch {
      setProject((prev) => {
        if (!prev) return prev;

        const availableBudget = Math.max(0, totalBudgetNumber - prev.totalSpent);
        const updated = {
          ...prev,
          name: body.name ?? prev.name,
          description: body.description ?? null,
          totalBudget: body.totalBudget ?? prev.totalBudget,
          availableBudget,
          status: body.status ?? prev.status,
        };

        return applyTeamLeader(updated, teamLeaderId, teamLeaders);
      });

      setNotice("API chưa sẵn sàng, đã mô phỏng cập nhật dự án.");
    } finally {
      setSaving(false);
      setShowEditModal(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded bg-white animate-pulse" />
        <div className="h-40 rounded-2xl bg-white animate-pulse" />
        <div className="h-80 rounded-2xl bg-white animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return <div className="text-slate-600">Không tìm thấy dự án.</div>;
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push("/manager/projects")}
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
            <p className="text-xs text-slate-500 font-mono">{project.projectCode}</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{project.name}</h1>
            <p className="text-slate-500 mt-1">{project.description ?? "Không có mô tả"}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex px-3 py-1.5 rounded-full border text-sm ${statusClass(project.status)}`}>
              {statusLabel(project.status)}
            </span>
            <button
              type="button"
              onClick={openEditModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold"
            >
              Sửa thông tin
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Tổng quan ngân sách</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InfoCard label="Tổng ngân sách" value={formatCurrency(project.totalBudget)} tone="text-slate-900" />
          <InfoCard label="Đã chi" value={formatCurrency(project.totalSpent)} tone="text-rose-700" />
          <InfoCard label="Còn lại" value={formatCurrency(project.availableBudget)} tone="text-emerald-700" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Budget burn</span>
            <span>{overallBurn}%</span>
          </div>
          <div className="h-2 rounded-full bg-white border border-slate-200 overflow-hidden">
            <div className={`h-full ${burnClass(overallBurn)}`} style={{ width: `${overallBurn}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Thông tin dự án</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoCard label="Trưởng nhóm" value={leader?.fullName ?? "Chưa gán"} />
          <InfoCard label="Phòng ban" value={`Phòng ban #${project.departmentId}`} />
          <InfoCard label="Ngày tạo" value={formatDate(project.createdAt)} />
          <InfoCard label="Mô tả" value={project.description ?? "Không có mô tả"} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Phases (read-only)</h2>

        {project.phases.length === 0 ? (
          <p className="text-sm text-slate-500">Dự án chưa có phase.</p>
        ) : (
          <div className="space-y-3">
            {project.phases.map((phase) => {
              const phaseBurn = burnPercent(phase.currentSpent, phase.budgetLimit);
              return (
                <div key={phase.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-500 font-mono">{phase.phaseCode}</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{phase.name}</p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 rounded-full border text-xs ${
                        phase.status === "ACTIVE"
                          ? "bg-emerald-100 border-emerald-200 text-emerald-700"
                          : "bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                    >
                      {phase.status}
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-white border border-slate-200 overflow-hidden">
                    <div className={`h-full ${burnClass(phaseBurn)}`} style={{ width: `${phaseBurn}%` }} />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 gap-2">
                    <span>
                      {formatCurrency(phase.currentSpent)} / {formatCurrency(phase.budgetLimit)}
                    </span>
                    <span>
                      {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Members (read-only)</h2>

        {project.members.length === 0 ? (
          <p className="text-sm text-slate-500">Dự án chưa có thành viên.</p>
        ) : (
          <div className="space-y-2">
            {project.members.map((member) => (
              <div
                key={member.userId}
                className="rounded-xl border border-slate-200 bg-white p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{member.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {member.employeeCode} • {member.position}
                  </p>
                </div>

                <span
                  className={`inline-flex px-2 py-1 rounded-full border text-xs ${
                    member.projectRole === ProjectRole.LEADER
                      ? "bg-indigo-100 border-indigo-200 text-indigo-700"
                      : "bg-slate-100 border-slate-200 text-slate-600"
                  }`}
                >
                  {member.projectRole}
                </span>
              </div>
            ))}
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
            aria-label="Đóng modal chỉnh sửa dự án"
          />

          <div className="absolute inset-x-0 top-10 mx-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Sửa thông tin dự án</h3>

            <div>
              <label className="block text-sm text-slate-600 mb-2">Tên dự án</label>
              <input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-2">Mô tả</label>
              <textarea
                rows={4}
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600 mb-2">Tổng ngân sách (VND)</label>
                <input
                  type="number"
                  min={1}
                  value={editTotalBudget}
                  onChange={(event) => setEditTotalBudget(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">Trạng thái</label>
                <select
                  value={editStatus}
                  onChange={(event) => setEditStatus(event.target.value as ProjectStatus)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value={ProjectStatus.PLANNING}>PLANNING</option>
                  <option value={ProjectStatus.ACTIVE}>ACTIVE</option>
                  <option value={ProjectStatus.PAUSED}>PAUSED</option>
                  <option value={ProjectStatus.CLOSED}>CLOSED</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-2">Team Leader</label>
              <select
                value={editTeamLeaderId}
                onChange={(event) => setEditTeamLeaderId(event.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="">Chọn Team Leader</option>
                {teamLeaders.map((option) => (
                  <option key={option.id} value={String(option.id)}>
                    {option.fullName} ({option.employeeCode})
                  </option>
                ))}
              </select>
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
                onClick={handleSaveChanges}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
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
      <p className={`text-sm mt-1 ${tone ?? "text-slate-900"}`}>{value}</p>
    </div>
  );
}
