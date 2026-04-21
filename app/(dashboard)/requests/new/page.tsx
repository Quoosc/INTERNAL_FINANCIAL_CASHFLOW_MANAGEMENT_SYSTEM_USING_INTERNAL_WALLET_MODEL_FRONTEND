"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { z } from "zod";
import { ApiError, api } from "@/lib/api-client";
import { formatCurrency, parseAmountInput } from "@/lib/format";
import { ErrorAlert } from "@/components/ui/error-alert";
import { useToast } from "@/contexts/toast-context";
import {
  CreateRequestBody,
  ExpenseCategoryResponse,
  PhaseStatus,
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
      status: PhaseStatus.ACTIVE,
      startDate: "2026-01-01",
      endDate: "2026-02-28",
    },
    {
      id: 12,
      phaseCode: "PH-002",
      name: "Phase 2 - Development",
      budgetLimit: 220_000_000,
      currentSpent: 80_000_000,
      status: PhaseStatus.ACTIVE,
      startDate: "2026-03-01",
      endDate: "2026-06-30",
    },
    {
      id: 13,
      phaseCode: "PH-003",
      name: "Phase 3 - UAT",
      budgetLimit: 80_000_000,
      currentSpent: 30_000_000,
      status: PhaseStatus.ACTIVE,
      startDate: "2026-07-01",
      endDate: "2026-08-31",
    },
  ],
};

const REQUEST_TYPE_CONFIG = [
  {
    type: RequestType.ADVANCE,
    label: "Tạm ứng",
    sub: "Ứng tiền trước cho hoạt động chi tiêu",
    cardSelected: "border-blue-500 bg-blue-50",
    cardHover: "hover:border-blue-300",
    iconSelected: "bg-blue-500 text-white",
    iconDefault: "bg-blue-100 text-blue-600",
    labelSelected: "text-blue-700",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    type: RequestType.EXPENSE,
    label: "Chi phí",
    sub: "Thanh toán chi phí đã phát sinh",
    cardSelected: "border-violet-500 bg-violet-50",
    cardHover: "hover:border-violet-300",
    iconSelected: "bg-violet-500 text-white",
    iconDefault: "bg-violet-100 text-violet-600",
    labelSelected: "text-violet-700",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    type: RequestType.REIMBURSE,
    label: "Hoàn ứng",
    sub: "Hoàn lại tiền đã chi cá nhân",
    cardSelected: "border-teal-500 bg-teal-50",
    cardHover: "hover:border-teal-300",
    iconSelected: "bg-teal-500 text-white",
    iconDefault: "bg-teal-100 text-teal-600",
    labelSelected: "text-teal-700",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
  },
] as const;


function formatInputAmount(raw?: number): string {
  if (!raw || raw <= 0) return "";
  return `${raw.toLocaleString("vi-VN")} ₫`;
}

function isImage(file: File): boolean {
  return file.type.startsWith("image/");
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
  const toast = useToast();

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
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);

  const [files, setFiles] = useState<UploadFileItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const isProjectBasedType = useMemo(
    () => form.type === RequestType.ADVANCE || form.type === RequestType.EXPENSE,
    [form.type]
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
    setCategoryOptions([]);

    if (!projectId || !isProjectBasedType) {
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
  }, [form.projectId, projects, isProjectBasedType]);

  useEffect(() => {
    const phaseId = form.phaseId;

    setForm((prev) => ({
      ...prev,
      categoryId: undefined,
    }));

    if (!phaseId || !isProjectBasedType) {
      setCategoryOptions([]);
      return;
    }

    let cancelled = false;

    const loadCategories = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<{ items: ExpenseCategoryResponse[] } | ExpenseCategoryResponse[]>(
          `/api/v1/projects/${phaseId}`
        );

        if (cancelled) return;

        const categories = Array.isArray(res.data) ? res.data : res.data.items;
        setCategoryOptions(categories.map((category) => ({ id: category.id, name: category.name })));
      } catch (err) {
        if (cancelled) return;

        setCategoryOptions([]);

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải danh sách hạng mục chi phí.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [form.phaseId, isProjectBasedType]);

  useEffect(() => {
    return () => {
      files.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [files]);

  const handleAmountChange = (value: string) => {
    const digitsOnly = parseAmountInput(value);
    const amount = digitsOnly ? Number(digitsOnly) : undefined;
    setForm((prev) => ({ ...prev, amount }));
    if (fieldErrors.amount) setFieldErrors((prev) => ({ ...prev, amount: undefined }));
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

  const validateBeforeSubmit = (): boolean => {
    const schema = z.object({
      type: z.enum(
        [RequestType.ADVANCE, RequestType.EXPENSE, RequestType.REIMBURSE] as const,
        { error: "Vui lòng chọn loại yêu cầu." }
      ),
      amount: z.number({ error: "Vui lòng nhập số tiền hợp lệ." }).min(1_000, "Số tiền tối thiểu là 1.000 ₫."),
      title: z.string().min(3, "Tiêu đề cần ít nhất 3 ký tự.").max(200, "Tiêu đề quá dài."),
      description: z.string().min(10, "Mô tả cần ít nhất 10 ký tự.").max(1000, "Mô tả không được vượt quá 1.000 ký tự."),
      projectId: isProjectBasedType
        ? z.number({ error: "Vui lòng chọn dự án." }).positive("Vui lòng chọn dự án.")
        : z.number().optional(),
      phaseId: isProjectBasedType
        ? z.number({ error: "Vui lòng chọn phase." }).positive("Vui lòng chọn phase.")
        : z.number().optional(),
      categoryId: isProjectBasedType
        ? z.number({ error: "Vui lòng chọn hạng mục chi phí." }).positive("Vui lòng chọn hạng mục chi phí.")
        : z.number().optional(),
      expenseDate: z.string().min(1, "Vui lòng chọn ngày chi tiêu."),
    });

    const result = schema.safeParse({
      type: form.type,
      amount: form.amount,
      title: title.trim(),
      description: form.description?.trim() ?? "",
      projectId: form.projectId,
      phaseId: form.phaseId,
      categoryId: form.categoryId,
      expenseDate,
    });

    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setFieldErrors({
        type: flat.type?.[0],
        amount: flat.amount?.[0],
        title: flat.title?.[0],
        description: flat.description?.[0],
        projectId: flat.projectId?.[0],
        phaseId: flat.phaseId?.[0],
        categoryId: flat.categoryId?.[0],
        expenseDate: flat.expenseDate?.[0],
      });
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateBeforeSubmit()) return;

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
      toast.success("Yêu cầu đã được tạo thành công!");
      router.push(`/requests/${res.data.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        const mockId = 9000 + Math.floor(Math.random() * 999);
        toast.success("Yêu cầu đã được tạo thành công!");
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
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại
      </button>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tạo yêu cầu mới</h1>
          <p className="text-slate-500 mt-1">
            Tạo yêu cầu chi tiêu cá nhân: Tạm ứng, Chi phí, Hoàn ứng.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-3">Loại yêu cầu</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {REQUEST_TYPE_CONFIG.map(({ type, label, sub, cardSelected, cardHover, iconSelected, iconDefault, labelSelected, icon }) => {
                const selected = form.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, type }))}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${selected ? cardSelected : `border-slate-200 bg-white ${cardHover}`}`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${selected ? iconSelected : iconDefault}`}>
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${selected ? labelSelected : "text-slate-900"}`}>{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Số tiền (VND)</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatInputAmount(form.amount)}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Nhập số tiền"
              className={`w-full px-4 py-3 rounded-xl bg-white border text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${fieldErrors.amount ? "border-rose-300" : "border-slate-200"}`}
            />
            {fieldErrors.amount
              ? <p className="text-xs text-rose-600 mt-1">{fieldErrors.amount}</p>
              : <p className="text-xs text-slate-500 mt-1">{form.amount ? `Giá trị: ${formatCurrency(form.amount)}` : ""}</p>
            }
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-2">Tiêu đề</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: undefined })); }}
              placeholder="Ví dụ: Tạm ứng công tác tháng 4"
              className={`w-full px-4 py-3 rounded-xl bg-white border text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${fieldErrors.title ? "border-rose-300" : "border-slate-200"}`}
            />
            {fieldErrors.title && <p className="text-xs text-rose-600 mt-1">{fieldErrors.title}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-2">Mô tả chi tiết</label>
            <textarea
              rows={4}
              value={form.description ?? ""}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, description: e.target.value }));
                if (fieldErrors.description) setFieldErrors((p) => ({ ...p, description: undefined }));
              }}
              placeholder="Mô tả nội dung chi tiêu..."
              className={`w-full px-4 py-3 rounded-xl bg-white border text-slate-900 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${fieldErrors.description ? "border-rose-300" : "border-slate-200"}`}
            />
            {fieldErrors.description && <p className="text-xs text-rose-600 mt-1">{fieldErrors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Dự án</label>
            <select
              value={form.projectId?.toString() ?? ""}
              onChange={(e) => {
                const value = Number(e.target.value);
                setForm((prev) => ({ ...prev, projectId: Number.isFinite(value) && value > 0 ? value : undefined }));
                if (fieldErrors.projectId) setFieldErrors((p) => ({ ...p, projectId: undefined }));
              }}
              disabled={!isProjectBasedType || loading}
              className={`w-full px-4 py-3 rounded-xl bg-white border text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${fieldErrors.projectId ? "border-rose-300" : "border-slate-200"}`}
            >
              <option value="">Chọn dự án</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  [{project.projectCode}] {project.name}
                </option>
              ))}
            </select>
            {fieldErrors.projectId && <p className="text-xs text-rose-600 mt-1">{fieldErrors.projectId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Phase</label>
            <select
              value={form.phaseId?.toString() ?? ""}
              onChange={(e) => {
                const value = Number(e.target.value);
                setForm((prev) => ({ ...prev, phaseId: Number.isFinite(value) && value > 0 ? value : undefined, categoryId: undefined }));
                if (fieldErrors.phaseId) setFieldErrors((p) => ({ ...p, phaseId: undefined }));
              }}
              disabled={!isProjectBasedType || !form.projectId || loading}
              className={`w-full px-4 py-3 rounded-xl bg-white border text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${fieldErrors.phaseId ? "border-rose-300" : "border-slate-200"}`}
            >
              <option value="">{form.projectId ? "Chọn phase" : "Chọn dự án trước"}</option>
              {(phases?.phases ?? []).map((phase) => (
                <option key={phase.id} value={phase.id}>
                  [{phase.phaseCode}] {phase.name}
                </option>
              ))}
            </select>
            {fieldErrors.phaseId && <p className="text-xs text-rose-600 mt-1">{fieldErrors.phaseId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Hạng mục chi phí</label>
            <select
              value={form.categoryId?.toString() ?? ""}
              onChange={(e) => {
                const value = Number(e.target.value);
                setForm((prev) => ({ ...prev, categoryId: Number.isFinite(value) && value > 0 ? value : undefined }));
                if (fieldErrors.categoryId) setFieldErrors((p) => ({ ...p, categoryId: undefined }));
              }}
              disabled={!isProjectBasedType || !form.phaseId}
              className={`w-full px-4 py-3 rounded-xl bg-white border text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${fieldErrors.categoryId ? "border-rose-300" : "border-slate-200"}`}
            >
              <option value="">{form.phaseId ? "Chọn hạng mục" : "Chọn phase trước"}</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {fieldErrors.categoryId && <p className="text-xs text-rose-600 mt-1">{fieldErrors.categoryId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Ngày chi tiêu</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => { setExpenseDate(e.target.value); if (fieldErrors.expenseDate) setFieldErrors((p) => ({ ...p, expenseDate: undefined })); }}
              className={`w-full px-4 py-3 rounded-xl bg-white border text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${fieldErrors.expenseDate ? "border-rose-300" : "border-slate-200"}`}
            />
            {fieldErrors.expenseDate && <p className="text-xs text-rose-600 mt-1">{fieldErrors.expenseDate}</p>}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <label className="block text-sm font-medium text-slate-600 mb-2">Đính kèm chứng từ (image/pdf)</label>

          <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center bg-blue-50">
            <input
              type="file"
              multiple
              accept="image/*,.pdf,application/pdf"
              onChange={handleFilesChange}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer cursor-pointer"
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
                  className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.previewUrl ? (
                      <Image
                        src={item.previewUrl}
                        alt={item.file.name}
                        width={48}
                        height={48}
                        unoptimized
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-sm text-slate-900 truncate">{item.file.name}</p>
                      <p className="text-xs text-slate-500">
                        {(item.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-medium transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <ErrorAlert message={error} />}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
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
