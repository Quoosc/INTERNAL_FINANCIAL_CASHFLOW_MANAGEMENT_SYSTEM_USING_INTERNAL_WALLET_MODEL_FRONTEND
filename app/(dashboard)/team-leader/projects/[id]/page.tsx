
"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import {
  AddMemberBody,
  AvailableMemberResponse,
  CreatePhaseBody,
  ExpenseCategoryResponse,
  PhaseCategoriesResponse,
  PhaseStatus,
  ProjectPhaseResponse,
  ProjectRole,
  ProjectStatus,
  RequestType,
  TLProjectDetailResponse,
  UpdateCategoryBudgetBody,
  UpdateMemberBody,
  UpdatePhaseBody,
} from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

type TabKey = "phases" | "budget" | "members";

// TODO: Replace when Sprint 4 is complete
const MOCK_PROJECT: TLProjectDetailResponse = {
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
      userId: 11,
      fullName: "Đỗ Quốc Bảo",
      avatar: null,
      employeeCode: "EMP001",
      projectRole: ProjectRole.LEADER,
      position: "Tech Lead",
      joinedAt: "2026-01-10T08:00:00",
    },
    {
      userId: 12,
      fullName: "Vũ Thị Lan",
      avatar: null,
      employeeCode: "EMP002",
      projectRole: ProjectRole.MEMBER,
      position: "Backend Developer",
      joinedAt: "2026-01-15T08:00:00",
    },
  ],
  createdAt: "2026-01-10T08:00:00",
  updatedAt: "2026-04-01T08:00:00",
};

// TODO: Replace when Sprint 4 is complete
const MOCK_PHASE_CATEGORIES: Record<number, PhaseCategoriesResponse> = {
  1: {
    projectId: 1,
    phaseId: 1,
    phaseName: "Phase 1 - Phân tích",
    categories: [
      { categoryId: 1, categoryName: "Thiết bị", budgetLimit: 20_000_000, currentSpent: 18_500_000, remaining: 1_500_000 },
      { categoryId: 2, categoryName: "Công tác", budgetLimit: 10_000_000, currentSpent: 8_200_000, remaining: 1_800_000 },
      { categoryId: 3, categoryName: "Đào tạo", budgetLimit: 15_000_000, currentSpent: 14_300_000, remaining: 700_000 },
    ],
  },
  2: {
    projectId: 1,
    phaseId: 2,
    phaseName: "Phase 2 - Phát triển",
    categories: [
      { categoryId: 4, categoryName: "Cloud", budgetLimit: 30_000_000, currentSpent: 7_500_000, remaining: 22_500_000 },
      { categoryId: 5, categoryName: "Tools", budgetLimit: 25_000_000, currentSpent: 2_000_000, remaining: 23_000_000 },
      { categoryId: 1, categoryName: "Thiết bị", budgetLimit: 25_000_000, currentSpent: 5_000_000, remaining: 20_000_000 },
    ],
  },
};

// TODO: Replace when Sprint 4 is complete
const MOCK_AVAILABLE_MEMBERS: AvailableMemberResponse[] = [
  { id: 14, fullName: "Nguyễn Thị Minh", employeeCode: "EMP004", avatar: null, email: "emp.fin1@ifms.vn", jobTitle: "Business Analyst" },
  { id: 15, fullName: "Trần Văn Nam", employeeCode: "EMP005", avatar: null, email: "emp.it5@ifms.vn", jobTitle: "DevOps Engineer" },
];

// TODO: Replace when Sprint 4 is complete
const MOCK_EXPENSE_CATEGORIES: ExpenseCategoryResponse[] = [
  { id: 1, name: "Thiết bị", description: null, isSystemDefault: true },
  { id: 2, name: "Công tác", description: null, isSystemDefault: true },
  { id: 3, name: "Đào tạo", description: null, isSystemDefault: true },
  { id: 4, name: "Cloud", description: null, isSystemDefault: true },
  { id: 5, name: "Tools", description: null, isSystemDefault: true },
];

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
}

function burn(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.min(100, Math.round((spent / budget) * 100));
}

function burnColor(percent: number): string {
  if (percent >= 85) return "bg-rose-500";
  if (percent >= 65) return "bg-amber-500";
  return "bg-emerald-500";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(-2)
    .map((x) => x[0]?.toUpperCase() ?? "")
    .join("");
}

function statusBadge(status: ProjectStatus): string {
  if (status === ProjectStatus.ACTIVE) return "bg-emerald-100 border-emerald-200 text-emerald-700";
  if (status === ProjectStatus.PLANNING) return "bg-sky-100 border-sky-200 text-sky-700";
  if (status === ProjectStatus.PAUSED) return "bg-amber-100 border-amber-200 text-amber-700";
  return "bg-slate-100 border-slate-200 text-slate-600";
}

function roleBadge(role: ProjectRole): string {
  return role === ProjectRole.LEADER
    ? "bg-amber-100 border-amber-200 text-amber-700"
    : "bg-slate-100 border-slate-200 text-slate-600";
}

export default function TLProjectDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<TLProjectDetailResponse | null>(null);
  const [phaseCategories, setPhaseCategories] = useState<PhaseCategoriesResponse | null>(null);
  const [availableMembers, setAvailableMembers] = useState<AvailableMemberResponse[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryResponse[]>([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);
  const [tab, setTab] = useState<TabKey>("phases");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupNote, setTopupNote] = useState("");

  const [showCreatePhase, setShowCreatePhase] = useState(false);
  const [phaseName, setPhaseName] = useState("");
  const [phaseBudget, setPhaseBudget] = useState("");
  const [phaseStart, setPhaseStart] = useState("");
  const [phaseEnd, setPhaseEnd] = useState("");

  const [showEditPhase, setShowEditPhase] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<number | null>(null);
  const [editPhaseName, setEditPhaseName] = useState("");
  const [editPhaseBudget, setEditPhaseBudget] = useState("");
  const [editPhaseEnd, setEditPhaseEnd] = useState("");
  const [editPhaseStatus, setEditPhaseStatus] = useState<PhaseStatus>(PhaseStatus.ACTIVE);

  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState<Record<number, string>>({});

  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [memberPosition, setMemberPosition] = useState("");

  const [showEditMember, setShowEditMember] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [editingPosition, setEditingPosition] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<TLProjectDetailResponse>(`/api/v1/team-leader/projects/${id}`);
        if (cancelled) return;
        setProject(res.data);
        setSelectedPhaseId(res.data.currentPhaseId ?? res.data.phases[0]?.id ?? null);
      } catch {
        if (cancelled) return;
        const safe = Number(id);
        const fallback = {
          ...MOCK_PROJECT,
          id: Number.isFinite(safe) && safe > 0 ? safe : MOCK_PROJECT.id,
          projectCode: `PRJ-TL-${String(id).padStart(3, "0")}`,
        };
        setProject(fallback);
        setSelectedPhaseId(fallback.currentPhaseId ?? fallback.phases[0]?.id ?? null);
        setError("Không thể tải API, đang dùng dữ liệu mẫu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!project) return;
    let cancelled = false;
    const loadAux = async () => {
      try {
        const [mRes, cRes] = await Promise.all([
          api.get<AvailableMemberResponse[]>(`/api/v1/team-leader/projects/${project.id}/available-members`),
          api.get<ExpenseCategoryResponse[]>("/api/v1/team-leader/expense-categories"),
        ]);
        if (cancelled) return;
        setAvailableMembers(mRes.data);
        setExpenseCategories(cRes.data);
      } catch {
        if (cancelled) return;
        setAvailableMembers(MOCK_AVAILABLE_MEMBERS);
        setExpenseCategories(MOCK_EXPENSE_CATEGORIES);
      }
    };
    void loadAux();
    return () => {
      cancelled = true;
    };
  }, [project]);

  useEffect(() => {
    if (!project || !selectedPhaseId) {
      setPhaseCategories(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get<PhaseCategoriesResponse>(`/api/v1/team-leader/projects/${project.id}/categories?phaseId=${selectedPhaseId}`);
        if (!cancelled) setPhaseCategories(res.data);
      } catch {
        if (cancelled) return;
        const mapped = MOCK_PHASE_CATEGORIES[selectedPhaseId];
        if (mapped) {
          setPhaseCategories({ ...mapped, projectId: project.id, phaseId: selectedPhaseId });
        } else {
          const phase = project.phases.find((p) => p.id === selectedPhaseId);
          setPhaseCategories({
            projectId: project.id,
            phaseId: selectedPhaseId,
            phaseName: phase?.name ?? `Phase ${selectedPhaseId}`,
            categories: (expenseCategories.length ? expenseCategories : MOCK_EXPENSE_CATEGORIES).slice(0, 3).map((c) => ({
              categoryId: c.id,
              categoryName: c.name,
              budgetLimit: 5_000_000,
              currentSpent: 0,
              remaining: 5_000_000,
            })),
          });
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [project, selectedPhaseId, expenseCategories]);

  const overallBurn = useMemo(() => (project ? burn(project.totalSpent, project.totalBudget) : 0), [project]);

  const filteredAvailable = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return availableMembers;
    return availableMembers.filter((m) => `${m.fullName} ${m.employeeCode}`.toLowerCase().includes(q));
  }, [availableMembers, memberSearch]);

  const openEditPhase = (phase: ProjectPhaseResponse) => {
    setEditingPhaseId(phase.id);
    setEditPhaseName(phase.name);
    setEditPhaseBudget(String(phase.budgetLimit));
    setEditPhaseEnd(phase.endDate ?? "");
    setEditPhaseStatus(phase.status);
    setShowEditPhase(true);
  };

  const openEditMember = (userId: number, position: string) => {
    setEditingMemberId(userId);
    setEditingPosition(position);
    setShowEditMember(true);
  };

  const onCreatePhase = async () => {
    if (!project) return;
    if (!phaseName.trim() || !phaseStart || !phaseEnd || Number(phaseBudget) <= 0) {
      setError("Vui lòng nhập đủ thông tin phase hợp lệ.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const body: CreatePhaseBody = {
      name: phaseName.trim(),
      budgetLimit: Number(phaseBudget),
      startDate: phaseStart,
      endDate: phaseEnd,
    };
    try {
      const res = await api.post<ProjectPhaseResponse>(`/api/v1/team-leader/projects/${project.id}/phases`, body);
      setProject((prev) => (prev ? { ...prev, phases: [...prev.phases, res.data] } : prev));
      setSelectedPhaseId(res.data.id);
    } catch {
      const mock: ProjectPhaseResponse = {
        id: Date.now(),
        phaseCode: `PH-${String(Date.now()).slice(-3)}`,
        name: body.name,
        budgetLimit: body.budgetLimit,
        currentSpent: 0,
        status: PhaseStatus.ACTIVE,
        startDate: body.startDate,
        endDate: body.endDate,
      };
      setProject((prev) => (prev ? { ...prev, phases: [...prev.phases, mock] } : prev));
      setSelectedPhaseId(mock.id);
    } finally {
      setSubmitting(false);
      setShowCreatePhase(false);
      setPhaseName("");
      setPhaseBudget("");
      setPhaseStart("");
      setPhaseEnd("");
      setNotice("Đã tạo phase mới.");
    }
  };

  const onUpdatePhase = async () => {
    if (!project || !editingPhaseId || !editPhaseName.trim() || Number(editPhaseBudget) <= 0) {
      setError("Thông tin cập nhật phase chưa hợp lệ.");
      return;
    }
    setSubmitting(true);
    const body: UpdatePhaseBody = {
      name: editPhaseName.trim(),
      budgetLimit: Number(editPhaseBudget),
      endDate: editPhaseEnd || undefined,
      status: editPhaseStatus,
    };
    try {
      const res = await api.put<ProjectPhaseResponse>(`/api/v1/team-leader/projects/${project.id}/phases/${editingPhaseId}`, body);
      setProject((prev) =>
        prev ? { ...prev, phases: prev.phases.map((p) => (p.id === editingPhaseId ? res.data : p)) } : prev
      );
    } catch {
      setProject((prev) =>
        prev
          ? {
              ...prev,
              phases: prev.phases.map((p) =>
                p.id === editingPhaseId
                  ? { ...p, name: body.name ?? p.name, budgetLimit: body.budgetLimit ?? p.budgetLimit, endDate: body.endDate ?? p.endDate, status: body.status ?? p.status }
                  : p
              ),
            }
          : prev
      );
    } finally {
      setSubmitting(false);
      setShowEditPhase(false);
      setEditingPhaseId(null);
      setNotice("Đã cập nhật phase.");
    }
  };

  const startEditBudget = () => {
    if (!phaseCategories) return;
    const next: Record<number, string> = {};
    phaseCategories.categories.forEach((c) => {
      next[c.categoryId] = String(c.budgetLimit);
    });
    setBudgetDraft(next);
    setEditingBudget(true);
  };

  const onSaveBudget = async () => {
    if (!project || !selectedPhaseId || !phaseCategories) return;
    setSubmitting(true);
    const categories = phaseCategories.categories.map((c) => ({
      categoryId: c.categoryId,
      budgetLimit: Number(budgetDraft[c.categoryId]) > 0 ? Number(budgetDraft[c.categoryId]) : c.budgetLimit,
    }));
    const body: UpdateCategoryBudgetBody = { phaseId: selectedPhaseId, categories };
    try {
      const res = await api.put<PhaseCategoriesResponse>(`/api/v1/team-leader/projects/${project.id}/categories`, body);
      setPhaseCategories(res.data);
    } catch {
      setPhaseCategories({
        ...phaseCategories,
        categories: phaseCategories.categories.map((c) => {
          const match = categories.find((x) => x.categoryId === c.categoryId);
          const budgetLimit = match ? match.budgetLimit : c.budgetLimit;
          return { ...c, budgetLimit, remaining: budgetLimit - c.currentSpent };
        }),
      });
    } finally {
      setSubmitting(false);
      setEditingBudget(false);
      setNotice("Đã cập nhật ngân sách.");
    }
  };

  const onAddMember = async () => {
    if (!project || !selectedMemberId || !memberPosition.trim()) {
      setError("Vui lòng chọn thành viên và nhập vị trí.");
      return;
    }
    const selected = availableMembers.find((m) => m.id === selectedMemberId);
    if (!selected) return;
    setSubmitting(true);
    const body: AddMemberBody = { userId: selected.id, position: memberPosition.trim() };
    try {
      await api.post(`/api/v1/team-leader/projects/${project.id}/members`, body);
    } catch {
      // mock-first
    } finally {
      setProject((prev) =>
        prev
          ? {
              ...prev,
              members: [...prev.members, { userId: selected.id, fullName: selected.fullName, avatar: selected.avatar, employeeCode: selected.employeeCode, projectRole: ProjectRole.MEMBER, position: body.position, joinedAt: new Date().toISOString() }],
            }
          : prev
      );
      setAvailableMembers((prev) => prev.filter((m) => m.id !== selected.id));
      setSubmitting(false);
      setShowAddMember(false);
      setSelectedMemberId(null);
      setMemberSearch("");
      setMemberPosition("");
      setNotice("Đã thêm thành viên.");
    }
  };

  const onUpdateMember = async () => {
    if (!project || !editingMemberId || !editingPosition.trim()) {
      setError("Vị trí thành viên không hợp lệ.");
      return;
    }
    setSubmitting(true);
    const body: UpdateMemberBody = { position: editingPosition.trim() };
    try {
      await api.put(`/api/v1/team-leader/projects/${project.id}/members/${editingMemberId}`, body);
    } catch {
      // mock-first
    } finally {
      setProject((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.map((m) => (m.userId === editingMemberId ? { ...m, position: body.position } : m)),
            }
          : prev
      );
      setSubmitting(false);
      setShowEditMember(false);
      setEditingMemberId(null);
      setNotice("Đã cập nhật vị trí.");
    }
  };

  const onRemoveMember = async (userId: number) => {
    if (!project) return;
    const target = project.members.find((m) => m.userId === userId);
    if (!target) return;
    if (target.projectRole === ProjectRole.LEADER) {
      setError("Không thể xóa LEADER.");
      return;
    }
    if (!window.confirm("Bạn có chắc muốn xóa thành viên này?")) return;
    setSubmitting(true);
    try {
      await api.delete(`/api/v1/team-leader/projects/${project.id}/members/${userId}`);
    } catch {
      // mock-first
    } finally {
      setProject((prev) => (prev ? { ...prev, members: prev.members.filter((m) => m.userId !== userId) } : prev));
      setSubmitting(false);
      setNotice("Đã xóa thành viên.");
    }
  };

  const onTopup = async () => {
    if (!project || Number(topupAmount) <= 0) {
      setError("Số tiền xin cấp vốn không hợp lệ.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/api/v1/requests", {
        type: RequestType.PROJECT_TOPUP,
        projectId: project.id,
        amount: Number(topupAmount),
        description: topupNote.trim() || `Xin cấp vốn cho ${project.projectCode}`,
      });
    } catch {
      // mock-first
    } finally {
      setSubmitting(false);
      setShowTopup(false);
      setTopupAmount("");
      setTopupNote("");
      setNotice("Đã gửi yêu cầu xin cấp vốn.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-52 rounded bg-white animate-pulse" />
        <div className="h-24 rounded-2xl bg-white animate-pulse" />
        <div className="h-72 rounded-2xl bg-white animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return <div className="text-slate-600">Không tìm thấy dự án.</div>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.push("/team-leader/projects")} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
        Quay lại
      </button>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-mono">{project.projectCode}</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{project.name}</h1>
            <p className="text-slate-500 mt-1">{project.description ?? "Không có mô tả"}</p>
          </div>
          <span className={`inline-flex px-3 py-1.5 rounded-full border text-sm ${statusBadge(project.status)}`}>{project.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <Card title="Tổng ngân sách" value={formatCurrency(project.totalBudget)} tone="text-slate-900" />
        <Card title="Đã chi" value={formatCurrency(project.totalSpent)} tone="text-rose-700" />
        <Card title="Còn lại" value={formatCurrency(project.availableBudget)} tone="text-emerald-700" />
        <Card title="Phase hiện tại" value={project.phases.find((p) => p.id === project.currentPhaseId)?.name ?? "Chưa có"} tone="text-slate-900" />
        <Card title="Thành viên" value={String(project.members.length)} tone="text-indigo-700" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Tổng quan ngân sách</h2>
          <button onClick={() => setShowTopup(true)} className="px-4 py-2 rounded-xl border border-blue-300 text-blue-700 hover:bg-blue-50 text-sm">Xin cấp vốn</button>
        </div>
        <div className="h-3 rounded-full bg-white border border-slate-200 overflow-hidden">
          <div className={`h-full ${burnColor(overallBurn)}`} style={{ width: `${overallBurn}%` }} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">{formatCurrency(project.totalSpent)} / {formatCurrency(project.totalBudget)}</span>
          <span className="text-slate-900">{overallBurn}%</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-3 flex gap-2 flex-wrap">
        {([
          ["phases", "Phases"],
          ["budget", "Ngân sách"],
          ["members", "Thành viên"],
        ] as [TabKey, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 rounded-xl text-sm border ${tab === key ? "bg-blue-100 border-blue-300 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "phases" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Danh sách phase</h3>
            <button onClick={() => setShowCreatePhase(true)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm">+ Tạo phase</button>
          </div>
          {project.phases.map((p) => {
            const pct = burn(p.currentSpent, p.budgetLimit);
            return (
              <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500 font-mono">{p.phaseCode}</p>
                    <p className="text-sm text-slate-900 font-semibold mt-1">{p.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${p.status === PhaseStatus.ACTIVE ? "bg-emerald-100 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-600"}`}>{p.status}</span>
                    <button onClick={() => openEditPhase(p)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs">Sửa</button>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white border border-slate-200 overflow-hidden"><div className={`h-full ${burnColor(pct)}`} style={{ width: `${pct}%` }} /></div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 gap-2">
                  <span>{formatCurrency(p.currentSpent)} / {formatCurrency(p.budgetLimit)}</span>
                  <span>{p.startDate ?? "—"} - {p.endDate ?? "—"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "budget" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Ngân sách theo danh mục</h3>
              <select value={selectedPhaseId ?? ""} onChange={(e) => setSelectedPhaseId(Number(e.target.value))} className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm">
                {project.phases.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {editingBudget ? (
              <div className="flex gap-2">
                <button onClick={() => setEditingBudget(false)} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm">Hủy</button>
                <button onClick={onSaveBudget} disabled={submitting} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-slate-900 text-sm">Lưu</button>
              </div>
            ) : (
              <button onClick={startEditBudget} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm">Cập nhật ngân sách</button>
            )}
          </div>

          {!phaseCategories ? (
            <p className="text-sm text-slate-500">Không có dữ liệu danh mục cho phase này.</p>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-white/70 border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">Danh mục</th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-500">Ngân sách</th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-500">Đã dùng</th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-500">Còn lại</th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-500">Burn %</th>
                  </tr>
                </thead>
                <tbody>
                  {phaseCategories.categories.map((c) => {
                    const pct = burn(c.currentSpent, c.budgetLimit);
                    return (
                      <tr key={c.categoryId} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-900">{c.categoryName}</td>
                        <td className="px-4 py-3 text-right text-sm text-slate-900">
                          {editingBudget ? (
                            <input type="number" min={0} value={budgetDraft[c.categoryId] ?? ""} onChange={(e) => setBudgetDraft((prev) => ({ ...prev, [c.categoryId]: e.target.value }))} className="w-32 px-2 py-1 rounded bg-white border border-slate-200 text-right" />
                          ) : (
                            formatCurrency(c.budgetLimit)
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-rose-700">{formatCurrency(c.currentSpent)}</td>
                        <td className={`px-4 py-3 text-right text-sm ${c.remaining < 0 ? "text-rose-700 font-semibold" : "text-emerald-700"}`}>{formatCurrency(c.remaining)}</td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "members" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Thành viên dự án</h3>
            <button onClick={() => setShowAddMember(true)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm">Thêm thành viên</button>
          </div>
          <div className="space-y-2">
            {project.members.map((m) => (
              <div key={m.userId} className="rounded-xl border border-slate-200 bg-white p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-100 flex items-center justify-center text-xs font-semibold">{initials(m.fullName)}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{m.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">{m.employeeCode} • {m.position}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${roleBadge(m.projectRole)}`}>{m.projectRole}</span>
                  <button onClick={() => openEditMember(m.userId, m.position)} className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs">Sửa</button>
                  <button onClick={() => onRemoveMember(m.userId)} disabled={submitting} className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-slate-900 text-xs">Xóa</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">{error}</div>}
      {notice && <div className="px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">{notice}</div>}

      {showTopup && (
        <Modal title="Xin cấp vốn dự án" onClose={() => setShowTopup(false)}>
          <div className="space-y-3">
            <input type="number" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} placeholder="Số tiền cần cấp" className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900" />
            <textarea rows={4} value={topupNote} onChange={(e) => setTopupNote(e.target.value)} placeholder="Lý do (tuỳ chọn)" className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 resize-none" />
            <ModalActions onClose={() => setShowTopup(false)} onConfirm={onTopup} confirmText={submitting ? "Đang gửi..." : "Gửi yêu cầu"} />
          </div>
        </Modal>
      )}

      {showCreatePhase && (
        <Modal title="Tạo phase mới" onClose={() => setShowCreatePhase(false)}>
          <div className="space-y-3">
            <input value={phaseName} onChange={(e) => setPhaseName(e.target.value)} placeholder="Tên phase" className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900" />
            <input type="number" value={phaseBudget} onChange={(e) => setPhaseBudget(e.target.value)} placeholder="Ngân sách" className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="date" value={phaseStart} onChange={(e) => setPhaseStart(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900" />
              <input type="date" value={phaseEnd} onChange={(e) => setPhaseEnd(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900" />
            </div>
            <ModalActions onClose={() => setShowCreatePhase(false)} onConfirm={onCreatePhase} confirmText={submitting ? "Đang lưu..." : "Tạo phase"} />
          </div>
        </Modal>
      )}

      {showEditPhase && (
        <Modal title="Cập nhật phase" onClose={() => setShowEditPhase(false)}>
          <div className="space-y-3">
            <input value={editPhaseName} onChange={(e) => setEditPhaseName(e.target.value)} placeholder="Tên phase" className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900" />
            <input type="number" value={editPhaseBudget} onChange={(e) => setEditPhaseBudget(e.target.value)} placeholder="Ngân sách" className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="date" value={editPhaseEnd} onChange={(e) => setEditPhaseEnd(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900" />
              <select value={editPhaseStatus} onChange={(e) => setEditPhaseStatus(e.target.value as PhaseStatus)} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900">
                <option value={PhaseStatus.ACTIVE}>ACTIVE</option>
                <option value={PhaseStatus.CLOSED}>CLOSED</option>
              </select>
            </div>
            <ModalActions onClose={() => setShowEditPhase(false)} onConfirm={onUpdatePhase} confirmText={submitting ? "Đang lưu..." : "Lưu cập nhật"} />
          </div>
        </Modal>
      )}

      {showAddMember && (
        <Modal title="Thêm thành viên" onClose={() => setShowAddMember(false)}>
          <div className="space-y-3">
            <input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Tìm theo tên hoặc mã..." className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900" />
            <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white">
              {filteredAvailable.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-500">Không có thành viên phù hợp.</p>
              ) : (
                filteredAvailable.map((m) => (
                  <button key={m.id} type="button" onClick={() => setSelectedMemberId(m.id)} className={`w-full px-4 py-3 text-left border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors ${selectedMemberId === m.id ? "bg-blue-100 text-blue-700" : "text-slate-900 hover:bg-slate-100"}`}>
                    <p className="text-sm font-medium">{m.fullName}</p>
                    <p className="text-xs text-slate-500 mt-1">{m.employeeCode}</p>
                  </button>
                ))
              )}
            </div>
            <input value={memberPosition} onChange={(e) => setMemberPosition(e.target.value)} placeholder="Vị trí trong dự án" className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900" />
            <ModalActions onClose={() => setShowAddMember(false)} onConfirm={onAddMember} confirmText={submitting ? "Đang thêm..." : "Thêm"} disabled={!selectedMemberId} />
          </div>
        </Modal>
      )}

      {showEditMember && (
        <Modal title="Cập nhật vị trí" onClose={() => setShowEditMember(false)}>
          <div className="space-y-3">
            <input value={editingPosition} onChange={(e) => setEditingPosition(e.target.value)} placeholder="Vị trí" className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900" />
            <ModalActions onClose={() => setShowEditMember(false)} onConfirm={onUpdateMember} confirmText={submitting ? "Đang lưu..." : "Lưu"} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function Card({ title, value, tone }: { title: string; value: string; tone: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
      <p className="text-xs text-slate-500">{title}</p>
      <p className={`text-base font-semibold mt-1 ${tone}`}>{value}</p>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Đóng modal" />
      <div className="absolute inset-x-0 top-10 mx-auto w-[calc(100%-2rem)] max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ModalActions({
  onClose,
  onConfirm,
  confirmText,
  disabled,
}: {
  onClose: () => void;
  onConfirm: () => void;
  confirmText: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm">
        Hủy
      </button>
      <button type="button" onClick={onConfirm} disabled={disabled} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-slate-900 text-sm">
        {confirmText}
      </button>
    </div>
  );
}
