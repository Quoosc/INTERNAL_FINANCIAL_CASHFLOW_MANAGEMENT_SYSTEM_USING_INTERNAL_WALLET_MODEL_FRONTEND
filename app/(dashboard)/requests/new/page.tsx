"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ApiError, api } from "@/lib/api-client";
import {
  CreateRequestBody,
  PaginatedResponse,
  ProjectListItem,
  ProjectPhasesResponse,
  ProjectStatus,
  RequestDetailResponse,
  RequestType,
} from "@/types";

interface UploadFileItem {
  id: string;
  file: File;
  previewUrl: string | null;
}

interface CategoryOption {
  id: number;
  name: string;
}

// TODO: Replace with real API calls when Sprint 4/5 is complete
const MOCK_PROJECTS: ProjectListItem[] = [
  {
    id: 1,
    projectCode: "PRJ-IT-001",
    name: "Hệ thống quản lý nội bộ",
    status: ProjectStatus.ACTIVE,
    departmentId: 10,
    totalBudget: 500_000_000,
    totalSpent: 180_000_000,
    currentPhaseId: 11,
    currentPhaseName: "Phase 2 - Development",
  },
  {
    id: 2,
    projectCode: "PRJ-IT-002",
    name: "Ứng dụng mobile nhân sự",
    status: ProjectStatus.ACTIVE,
    departmentId: 10,
    totalBudget: 350_000_000,
    totalSpent: 90_000_000,
    currentPhaseId: 21,
    currentPhaseName: "Phase 1 - Planning",
  },
  {
    id: 3,
    projectCode: "PRJ-IT-003",
    name: "Nâng cấp BI Dashboard",
    status: ProjectStatus.ACTIVE,
    departmentId: 10,
    totalBudget: 280_000_000,
    totalSpent: 120_000_000,
    currentPhaseId: 31,
    currentPhaseName: "Phase 3 - UAT",
  },
];

// TODO: Replace with real API calls when Sprint 4/5 is complete
const MOCK_PHASES: ProjectPhasesResponse = {
  projectId: 1,
  projectName: "Hệ thống quản lý nội bộ",
  phases: [
    {
      id: 11,
      phaseCode: "PH-001",
      name: "Phase 1 - Analysis",
      budgetLimit: 120_000_000,
      currentSpent: 70_000_000,
      status: "ACTIVE",
      startDate: "2026-01-01",
      endDate: "2026-02-28",
    },
    {
      id: 12,
      phaseCode: "PH-002",
      name: "Phase 2 - Development",
      budgetLimit: 220_000_000,
      currentSpent: 80_000_000,
      status: "ACTIVE",
      startDate: "2026-03-01",
      endDate: "2026-06-30",
    },
    {
      id: 13,
      phaseCode: "PH-003",
      name: "Phase 3 - UAT",
      budgetLimit: 80_000_000,
      currentSpent: 30_000_000,
      status: "ACTIVE",
      startDate: "2026-07-01",
      endDate: "2026-08-31",
    },
  ],
};

const MOCK_CATEGORIES_BY_PHASE: Record<number, CategoryOption[]> = {
  11: [
    { id: 101, name: "Khảo sát" },
    { id: 102, name: "Văn phòng phẩm" },
  ],
  12: [
    { id: 103, name: "Di chuyển" },
    { id: 104, name: "Thiết bị" },
    { id: 105, name: "Dịch vụ cloud" },
  ],
  13: [
    { id: 106, name: "Kiểm thử" },
    { id: 107, name: "Hỗ trợ triển khai" },
  ],
  21: [
    { id: 108, name: "Workshop" },
    { id: 109, name: "Thiết kế UI" },
  ],
  31: [
    { id: 110, name: "Báo cáo" },
    { id: 111, name: "Đào tạo" },
  ],
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatInputAmount(raw?: number): string {
  if (!raw || raw <= 0) return "";
  return `${raw.toLocaleString("vi-VN")} ₫`;
}

function isImage(file: File): boolean {
  return file.type.startsWith("image/");
}

function buildCategoryOptions(phases: ProjectPhasesResponse | null, phaseId?: number): CategoryOption[] {
  if (!phases || !phaseId) return [];

  const selectedPhase = phases.phases.find((p) => p.id === phaseId) as
    | (typeof phases.phases[number] & { categories?: CategoryOption[] })
    | undefined;

  if (selectedPhase?.categories && selectedPhase.categories.length > 0) {
    return selectedPhase.categories;
  }

  return MOCK_CATEGORIES_BY_PHASE[phaseId] ?? [];
}

async function uploadAttachments(files: UploadFileItem[]): Promise<number[]> {
  if (files.length === 0) return [];

  const uploadedFileIds: number[] = [];

  for (const item of files) {
    const formData = new FormData();
    formData.append("file", item.file);

    // await api.post('/api/v1/files/...', formData, { headers: {} })
    uploadedFileIds.push(Date.now() + Math.floor(Math.random() * 1000));
  }

  return uploadedFileIds;
}

export default function NewRequestPage() {
  const router = useRouter();

  const [form, setForm] = useState<Partial<CreateRequestBody>>({
    type: RequestType.ADVANCE,
    amount: undefined,
    projectId: undefined,
    phaseId: undefined,
    categoryId: undefined,
    description: "",
  });

  const [title, setTitle] = useState("");
  const [expenseDate, setExpenseDate] = useState("");

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [phases, setPhases] = useState<ProjectPhasesResponse | null>(null);

  const [files, setFiles] = useState<UploadFileItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = useMemo(
    () => buildCategoryOptions(phases, form.phaseId),
    [phases, form.phaseId]
  );

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        // const projectsRes = await api.get<PaginatedResponse<ProjectListItem>>('/api/v1/projects')
        const projectsRes = await api.get<PaginatedResponse<ProjectListItem>>(
          "/api/v1/projects?page=1&limit=100"
        );

        if (cancelled) return;
        setProjects(projectsRes.data.items);
      } catch (err) {
        if (cancelled) return;
        setProjects(MOCK_PROJECTS);

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải danh sách dự án, đang hiển thị dữ liệu mẫu.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const projectId = form.projectId;

    setForm((prev) => ({
      ...prev,
      phaseId: undefined,
      categoryId: undefined,
    }));

    if (!projectId) {
      setPhases(null);
      return;
    }

    let cancelled = false;

    const loadPhases = async () => {
      setLoading(true);
      setError(null);

      try {
        // const phasesRes = await api.get<ProjectPhasesResponse>(`/api/v1/projects/${form.projectId}/phases`)
        const phasesRes = await api.get<ProjectPhasesResponse>(
          `/api/v1/projects/${projectId}/phases`
        );

        if (cancelled) return;
        setPhases(phasesRes.data);
      } catch (err) {
        if (cancelled) return;

        setPhases({
          ...MOCK_PHASES,
          projectId,
          projectName:
            projects.find((p) => p.id === projectId)?.name ?? MOCK_PHASES.projectName,
        });

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải phase dự án, đang hiển thị dữ liệu mẫu.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPhases();

    return () => {
      cancelled = true;
    };
  }, [form.projectId, projects]);

  useEffect(() => {
    return () => {
      files.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [files]);

  const handleAmountChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    const amount = digitsOnly ? Number(digitsOnly) : undefined;

    setForm((prev) => ({ ...prev, amount }));
  };

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length === 0) return;

    const accepted = selected.filter(
      (file) => file.type === "application/pdf" || file.type.startsWith("image/")
    );

    const mapped = accepted.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
      file,
      previewUrl: isImage(file) ? URL.createObjectURL(file) : null,
    }));

    setFiles((prev) => [...prev, ...mapped]);

    event.target.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const validateBeforeSubmit = (): string | null => {
    if (!form.type) return "Vui lòng chọn loại yêu cầu.";
    if (!form.amount || form.amount <= 0) return "Vui lòng nhập số tiền hợp lệ.";
    if (!title.trim()) return "Vui lòng nhập tiêu đề yêu cầu.";
    if (!form.description?.trim()) return "Vui lòng nhập mô tả yêu cầu.";
    if (!form.projectId) return "Vui lòng chọn dự án.";
    if (!form.phaseId) return "Vui lòng chọn phase.";
    if (!form.categoryId) return "Vui lòng chọn category.";
    if (!expenseDate) return "Vui lòng chọn ngày chi tiêu.";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validationError = validateBeforeSubmit();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const uploadedFileIds = await uploadAttachments(files);

      const descriptionParts = [
        `Tiêu đề: ${title.trim()}`,
        `Ngày chi tiêu: ${expenseDate}`,
        form.description?.trim() ?? "",
      ].filter(Boolean);

      const payload: CreateRequestBody = {
        type: form.type as RequestType,
        amount: form.amount as number,
        projectId: form.projectId,
        phaseId: form.phaseId,
        categoryId: form.categoryId,
        description: descriptionParts.join("\n"),
        attachmentFileIds: uploadedFileIds.length > 0 ? uploadedFileIds : undefined,
      };

      // const res = await api.post<RequestDetailResponse>('/api/v1/requests', form)
      const res = await api.post<RequestDetailResponse>("/api/v1/requests", payload);
      router.push(`/requests/${res.data.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        const mockId = 9000 + Math.floor(Math.random() * 999);
        router.push(`/requests/${mockId}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại
      </button>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Tạo yêu cầu mới</h1>
          <p className="text-slate-400 mt-1">
            Tạo yêu cầu chi tiêu cá nhân: Tạm ứng, Chi phí, Hoàn ứng.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Loại yêu cầu</label>
            <select
              value={form.type ?? RequestType.ADVANCE}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  type: e.target.value as RequestType,
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value={RequestType.ADVANCE}>ADVANCE</option>
              <option value={RequestType.EXPENSE}>EXPENSE</option>
              <option value={RequestType.REIMBURSE}>REIMBURSE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Số tiền (VND)</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatInputAmount(form.amount)}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Nhập số tiền"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <p className="text-xs text-slate-500 mt-1">
              {form.amount ? `Giá trị: ${formatCurrency(form.amount)}` : ""}
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Tiêu đề</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Tạm ứng công tác tháng 4"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Mô tả chi tiết</label>
            <textarea
              rows={4}
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Mô tả nội dung chi tiêu..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Dự án</label>
            <select
              value={form.projectId?.toString() ?? ""}
              onChange={(e) => {
                const value = Number(e.target.value);
                setForm((prev) => ({
                  ...prev,
                  projectId: Number.isFinite(value) && value > 0 ? value : undefined,
                }));
              }}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">Chọn dự án</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  [{project.projectCode}] {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Phase</label>
            <select
              value={form.phaseId?.toString() ?? ""}
              onChange={(e) => {
                const value = Number(e.target.value);
                setForm((prev) => ({
                  ...prev,
                  phaseId: Number.isFinite(value) && value > 0 ? value : undefined,
                  categoryId: undefined,
                }));
              }}
              disabled={!form.projectId || loading}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">{form.projectId ? "Chọn phase" : "Chọn dự án trước"}</option>
              {(phases?.phases ?? []).map((phase) => (
                <option key={phase.id} value={phase.id}>
                  [{phase.phaseCode}] {phase.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
            <select
              value={form.categoryId?.toString() ?? ""}
              onChange={(e) => {
                const value = Number(e.target.value);
                setForm((prev) => ({
                  ...prev,
                  categoryId: Number.isFinite(value) && value > 0 ? value : undefined,
                }));
              }}
              disabled={!form.phaseId}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">{form.phaseId ? "Chọn category" : "Chọn phase trước"}</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Ngày chi tiêu</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>

        <div className="bg-slate-800 border border-white/10 rounded-2xl p-5">
          <label className="block text-sm font-medium text-slate-300 mb-2">Đính kèm chứng từ (image/pdf)</label>

          <div className="border-2 border-dashed border-white/10 rounded-xl p-5 text-center bg-slate-900/50">
            <input
              type="file"
              multiple
              accept="image/*,.pdf,application/pdf"
              onChange={handleFilesChange}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-2">
              Hỗ trợ nhiều file. Định dạng: JPG, PNG, PDF.
            </p>
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 bg-slate-900 border border-white/10 rounded-xl p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.previewUrl ? (
                      <Image
                        src={item.previewUrl}
                        alt={item.file.name}
                        width={48}
                        height={48}
                        unoptimized
                        className="w-12 h-12 rounded-lg object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg border border-white/10 bg-slate-800 flex items-center justify-center text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{item.file.name}</p>
                      <p className="text-xs text-slate-500">
                        {(item.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
          >
            Hủy
          </button>

          <button
            type="submit"
            disabled={submitting || loading}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang tạo...
              </>
            ) : (
              "Gửi yêu cầu"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
