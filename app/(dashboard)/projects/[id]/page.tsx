"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  PhaseStatus,
  ProjectDetailResponse,
  ProjectMemberResponse,
  ProjectPhasesResponse,
  ProjectPhaseResponse,
  ProjectRole,
  ProjectStatus,
} from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface PhaseCategoryBudget {
  categoryId: number;
  categoryName: string;
  categoryBudget: number;
  currentSpent: number;
  remainingBudget: number;
}

type PhaseWithCategories = ProjectPhaseResponse & {
  categories?: PhaseCategoryBudget[];
};

type ProjectPhasesWithCategoriesResponse = Omit<ProjectPhasesResponse, "phases"> & {
  phases: PhaseWithCategories[];
};

// TODO: Replace with real API call when Sprint 4 is complete
const MOCK_PROJECT: ProjectDetailResponse = {
  id: 1,
  projectCode: "PRJ-IT-001",
  name: "Hệ thống quản lý nội bộ",
  description: "Nâng cấp hệ thống nội bộ cho toàn bộ phòng ban.",
  status: ProjectStatus.ACTIVE,
  totalBudget: 500_000_000,
  availableBudget: 265_000_000,
  totalSpent: 185_000_000,
  departmentId: 10,
  managerId: 5,
  currentPhaseId: 12,
  phases: [],
  members: [
    {
      userId: 5,
      fullName: "Trần Minh Hưng",
      avatar: null,
      employeeCode: "EMP005",
      projectRole: ProjectRole.LEADER,
      position: "Team Leader",
      joinedAt: "2026-01-05T09:00:00",
    },
    {
      userId: 17,
      fullName: "Nguyễn Văn A",
      avatar: null,
      employeeCode: "EMP017",
      projectRole: ProjectRole.MEMBER,
      position: "Frontend Developer",
      joinedAt: "2026-01-08T09:00:00",
    },
    {
      userId: 22,
      fullName: "Lê Thị B",
      avatar: null,
      employeeCode: "EMP022",
      projectRole: ProjectRole.MEMBER,
      position: "Backend Developer",
      joinedAt: "2026-01-10T09:00:00",
    },
  ],
  createdAt: "2026-01-01T08:00:00",
  updatedAt: "2026-04-03T10:30:00",
};

// TODO: Replace with real API call when Sprint 4 is complete
const MOCK_PHASES: ProjectPhasesWithCategoriesResponse = {
  projectId: 1,
  projectName: "Hệ thống quản lý nội bộ",
  phases: [
    {
      id: 11,
      phaseCode: "PH-001",
      name: "Phase 1 - Analysis",
      budgetLimit: 120_000_000,
      currentSpent: 95_000_000,
      status: PhaseStatus.CLOSED,
      startDate: "2026-01-01",
      endDate: "2026-02-20",
      categories: [
        {
          categoryId: 101,
          categoryName: "Khảo sát yêu cầu",
          categoryBudget: 45_000_000,
          currentSpent: 40_000_000,
          remainingBudget: 5_000_000,
        },
        {
          categoryId: 102,
          categoryName: "Workshop",
          categoryBudget: 35_000_000,
          currentSpent: 30_000_000,
          remainingBudget: 5_000_000,
        },
        {
          categoryId: 103,
          categoryName: "Văn phòng phẩm",
          categoryBudget: 40_000_000,
          currentSpent: 25_000_000,
          remainingBudget: 15_000_000,
        },
      ],
    },
    {
      id: 12,
      phaseCode: "PH-002",
      name: "Phase 2 - Development",
      budgetLimit: 220_000_000,
      currentSpent: 80_000_000,
      status: PhaseStatus.ACTIVE,
      startDate: "2026-02-21",
      endDate: "2026-06-30",
      categories: [
        {
          categoryId: 104,
          categoryName: "Nhân sự dev",
          categoryBudget: 130_000_000,
          currentSpent: 55_000_000,
          remainingBudget: 75_000_000,
        },
        {
          categoryId: 105,
          categoryName: "Hạ tầng cloud",
          categoryBudget: 60_000_000,
          currentSpent: 20_000_000,
          remainingBudget: 40_000_000,
        },
        {
          categoryId: 106,
          categoryName: "Thiết bị",
          categoryBudget: 30_000_000,
          currentSpent: 5_000_000,
          remainingBudget: 25_000_000,
        },
      ],
    },
    {
      id: 13,
      phaseCode: "PH-003",
      name: "Phase 3 - UAT & Rollout",
      budgetLimit: 100_000_000,
      currentSpent: 10_000_000,
      status: PhaseStatus.ACTIVE,
      startDate: "2026-07-01",
      endDate: "2026-09-30",
      categories: [
        {
          categoryId: 107,
          categoryName: "Testing",
          categoryBudget: 40_000_000,
          currentSpent: 6_000_000,
          remainingBudget: 34_000_000,
        },
        {
          categoryId: 108,
          categoryName: "Training",
          categoryBudget: 30_000_000,
          currentSpent: 2_000_000,
          remainingBudget: 28_000_000,
        },
        {
          categoryId: 109,
          categoryName: "Rollout",
          categoryBudget: 30_000_000,
          currentSpent: 2_000_000,
          remainingBudget: 28_000_000,
        },
      ],
    },
  ],
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

function getProjectStatusBadge(status: ProjectStatus): string {
  switch (status) {
    case ProjectStatus.ACTIVE:
      return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
    case ProjectStatus.PLANNING:
      return "bg-blue-500/15 border-blue-500/30 text-blue-300";
    case ProjectStatus.PAUSED:
      return "bg-amber-500/15 border-amber-500/30 text-amber-300";
    case ProjectStatus.CLOSED:
      return "bg-slate-500/15 border-slate-500/30 text-slate-300";
    default:
      return "bg-slate-500/15 border-slate-500/30 text-slate-300";
  }
}

function getProjectStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case ProjectStatus.ACTIVE:
      return "ACTIVE";
    case ProjectStatus.PLANNING:
      return "PLANNING";
    case ProjectStatus.PAUSED:
      return "PAUSED";
    case ProjectStatus.CLOSED:
      return "CLOSED";
    default:
      return status;
  }
}

function getPhaseStatusBadge(status: PhaseStatus): string {
  return status === PhaseStatus.ACTIVE
    ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
    : "bg-slate-500/15 border-slate-500/30 text-slate-300";
}

function getPhaseStatusLabel(status: PhaseStatus): string {
  return status === PhaseStatus.ACTIVE ? "ACTIVE" : "CLOSED";
}

function getRoleLabel(role: ProjectRole): string {
  return role === ProjectRole.LEADER ? "PROJECT_MANAGER" : "MEMBER";
}

function getRoleBadge(role: ProjectRole): string {
  return role === ProjectRole.LEADER
    ? "bg-violet-500/15 border-violet-500/30 text-violet-300"
    : "bg-slate-500/15 border-slate-500/30 text-slate-300";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(-2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("");
}

export default function ProjectDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [project, setProject] = useState<ProjectDetailResponse | null>(null);
  const [phases, setPhases] = useState<ProjectPhasesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      const numericId = Number(id);
      const safeId = Number.isFinite(numericId) && numericId > 0 ? numericId : 1;

      try {
        // const phasesRes = await api.get<ProjectPhasesResponse>(`/api/v1/projects/${id}/phases`)
        const phasesRes = await api.get<ProjectPhasesResponse>(`/api/v1/projects/${id}/phases`);

        if (cancelled) return;

        setPhases(phasesRes.data);
        setProject({
          ...MOCK_PROJECT,
          id: safeId,
          projectCode: `PRJ-EMP-${String(safeId).padStart(3, "0")}`,
          name: phasesRes.data.projectName || MOCK_PROJECT.name,
          phases: phasesRes.data.phases,
        });
      } catch (err) {
        if (cancelled) return;

        const fallbackPhases: ProjectPhasesWithCategoriesResponse = {
          ...MOCK_PHASES,
          projectId: safeId,
          projectName: MOCK_PROJECT.name,
        };

        setPhases(fallbackPhases);
        setProject({
          ...MOCK_PROJECT,
          id: safeId,
          projectCode: `PRJ-EMP-${String(safeId).padStart(3, "0")}`,
          phases: fallbackPhases.phases,
        });

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải dữ liệu API dự án, đang hiển thị dữ liệu mẫu.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const phaseList = useMemo(() => phases?.phases ?? project?.phases ?? [], [phases?.phases, project?.phases]);

  const budgetStats = useMemo(() => {
    const totalBudget = project?.totalBudget ?? 0;
    const allocatedBudget = phaseList.reduce((sum, phase) => sum + phase.budgetLimit, 0);
    const spentAmount = project?.totalSpent ?? phaseList.reduce((sum, phase) => sum + phase.currentSpent, 0);
    const remainingBudget = Math.max(0, project?.availableBudget ?? totalBudget - spentAmount);

    const safeTotal = Math.max(totalBudget, 1);
    const spentPercent = Math.max(0, Math.min(100, (spentAmount / safeTotal) * 100));
    const allocatedRemaining = Math.max(0, allocatedBudget - spentAmount);
    const allocatedRemainingPercent = Math.max(0, Math.min(100 - spentPercent, (allocatedRemaining / safeTotal) * 100));
    const unallocatedPercent = Math.max(0, 100 - spentPercent - allocatedRemainingPercent);

    return {
      totalBudget,
      allocatedBudget,
      spentAmount,
      remainingBudget,
      spentPercent,
      allocatedRemainingPercent,
      unallocatedPercent,
    };
  }, [phaseList, project?.availableBudget, project?.totalBudget, project?.totalSpent]);

  const teamLeader = useMemo(() => {
    const leader = project?.members.find((member) => member.projectRole === ProjectRole.LEADER);
    return leader?.fullName ?? "Chưa cập nhật";
  }, [project?.members]);

  const togglePhase = (phaseId: number) => {
    const key = String(phaseId);
    setExpandedPhaseId((prev) => (prev === key ? null : key));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-40 rounded bg-slate-800 animate-pulse" />
        <div className="h-28 rounded-2xl bg-slate-800 animate-pulse" />
        <div className="h-64 rounded-2xl bg-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => router.push("/projects")}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại danh sách dự án
        </button>

        <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 text-center text-slate-400">
          Không tìm thấy dự án.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push("/projects")}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại
      </button>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500">{project.projectCode}</p>
            <h1 className="text-2xl font-bold text-white mt-1">{project.name}</h1>
            <p className="text-slate-400 mt-1">Phòng ban #{project.departmentId} • Team Leader: {teamLeader}</p>
          </div>

          <span className={`inline-flex w-fit px-3 py-1.5 rounded-full border text-sm ${getProjectStatusBadge(project.status)}`}>
            {getProjectStatusLabel(project.status)}
          </span>
        </div>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-white">Budget Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <BudgetCard title="Total Budget" value={budgetStats.totalBudget} tone="text-white" />
          <BudgetCard title="Allocated Budget" value={budgetStats.allocatedBudget} tone="text-blue-300" />
          <BudgetCard title="Spent Amount" value={budgetStats.spentAmount} tone="text-rose-300" />
          <BudgetCard title="Remaining Budget" value={budgetStats.remainingBudget} tone="text-emerald-300" />
        </div>

        <div className="space-y-2">
          <div className="h-3 rounded-full bg-slate-900 border border-white/10 overflow-hidden flex">
            <div className="h-full bg-rose-500" style={{ width: `${budgetStats.spentPercent}%` }} />
            <div className="h-full bg-blue-500" style={{ width: `${budgetStats.allocatedRemainingPercent}%` }} />
            <div className="h-full bg-emerald-500" style={{ width: `${budgetStats.unallocatedPercent}%` }} />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Đã chi
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Đã phân bổ (chưa chi)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Chưa phân bổ
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Phases</h2>
        </div>

        {phaseList.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-500">Dự án chưa có phase.</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {phaseList.map((phase) => {
              const isExpanded = expandedPhaseId === String(phase.id);
              const categories = (phase as PhaseWithCategories).categories ?? [];

              return (
                <li key={phase.id} className="bg-slate-800">
                  <button
                    type="button"
                    onClick={() => togglePhase(phase.id)}
                    className="w-full px-5 py-4 text-left hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500">{phase.phaseCode}</p>
                        <p className="text-sm font-semibold text-white mt-0.5">{phase.name}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`inline-flex px-2 py-1 rounded-full border ${getPhaseStatusBadge(phase.status)}`}>
                          {getPhaseStatusLabel(phase.status)}
                        </span>
                        <span className="inline-flex px-2 py-1 rounded-full border border-white/10 bg-slate-900 text-slate-300">
                          Budget: {formatCurrency(phase.budgetLimit)}
                        </span>
                        <span className="inline-flex px-2 py-1 rounded-full border border-white/10 bg-slate-900 text-slate-300">
                          {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          {isExpanded ? "Thu gọn" : "Mở rộng"}
                          <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4">
                      {categories.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-500">
                          Chưa có category budget cho phase này.
                        </div>
                      ) : (
                        <div className="rounded-xl border border-white/10 overflow-hidden">
                          <table className="w-full min-w-[720px]">
                            <thead>
                              <tr className="bg-slate-900/70 border-b border-white/10">
                                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Category</th>
                                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-400">Budget</th>
                                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-400">Spent</th>
                                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-400">Remaining</th>
                              </tr>
                            </thead>
                            <tbody>
                              {categories.map((category) => (
                                <tr key={category.categoryId} className="border-b border-white/5 last:border-b-0">
                                  <td className="px-4 py-3 text-sm text-white">{category.categoryName}</td>
                                  <td className="px-4 py-3 text-sm text-right text-slate-300">
                                    {formatCurrency(category.categoryBudget)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right text-rose-300">
                                    {formatCurrency(category.currentSpent)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right text-emerald-300">
                                    {formatCurrency(category.remainingBudget)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Members</h2>
        </div>

        {project.members.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-500">Chưa có thành viên.</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {project.members.map((member: ProjectMemberResponse) => (
              <li key={member.userId} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center text-sm font-semibold border border-white/10">
                    {getInitials(member.fullName)}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{member.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {member.employeeCode} • {member.position}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${getRoleBadge(member.projectRole)}`}>
                    {getRoleLabel(member.projectRole)}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">Tham gia: {formatDate(member.joinedAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

function BudgetCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{title}</p>
      <p className={`text-lg font-bold mt-2 ${tone}`}>{formatCurrency(value)}</p>
    </div>
  );
}
