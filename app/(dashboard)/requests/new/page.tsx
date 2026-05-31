"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { z } from "zod";
import { ApiError, api } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/contexts/toast-context";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  AdvanceBalanceItem,
  CreateRequestBody,
  ExpenseCategoryResponse,
  FileStorageRequest,
  PaginatedResponse,
  ProjectListItem,
  ProjectPhasesResponse,
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


interface UploadSignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format?: string;
  original_filename: string;
  bytes: number;
}


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


function isImage(file: File): boolean {
  return file.type.startsWith("image/");
}

async function uploadAttachments(files: UploadFileItem[]): Promise<FileStorageRequest[]> {
  if (files.length === 0) return [];

  const uploadedFiles: FileStorageRequest[] = [];

  for (const item of files) {
    const signatureRes = await api.get<UploadSignatureResponse>(
      "/api/v1/uploads/signature?folder=REQUEST"
    );

    const signature = signatureRes.data;
    const formData = new FormData();
    formData.append("file", item.file);

    formData.append("api_key", signature.apiKey);
    formData.append("timestamp", String(signature.timestamp));
    formData.append("signature", signature.signature);
    formData.append("folder", signature.folder);

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!cloudinaryRes.ok) {
      let detail = "";

      try {
        const errBody = (await cloudinaryRes.json()) as { error?: { message?: string } };
        if (errBody.error?.message) detail = `: ${errBody.error.message}`;
      } catch {
        // ignore Cloudinary error body parse failure
      }

      throw new Error(
        `Tải tệp ${item.file.name} thất bại${detail} (HTTP ${cloudinaryRes.status}). Vui lòng thử lại.`
      );
    }

    const uploaded = (await cloudinaryRes.json()) as CloudinaryUploadResponse;

    uploadedFiles.push({
      fileName: item.file.name || `${uploaded.original_filename}.${uploaded.format ?? "bin"}`,
      cloudinaryPublicId: uploaded.public_id,
      url: uploaded.secure_url,
      fileType: item.file.type || `${uploaded.resource_type}/${uploaded.format ?? "octet-stream"}`,
      size: item.file.size || uploaded.bytes,
    });
  }

  return uploadedFiles;
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

  const [advanceOptions, setAdvanceOptions] = useState<AdvanceBalanceItem[]>([]);
  const [advanceBalanceId, setAdvanceBalanceId] = useState<number | undefined>(undefined);
  const [loadingAdvances, setLoadingAdvances] = useState(false);
  const [loadingPhases, setLoadingPhases] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [files, setFiles] = useState<UploadFileItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const isReimburseType = form.type === RequestType.REIMBURSE;
  const isProjectBasedType = useMemo(
    () =>
      form.type === RequestType.ADVANCE ||
      form.type === RequestType.EXPENSE ||
      form.type === RequestType.REIMBURSE,
    [form.type]
  );

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      setLoading(true);

      try {
        const projectsRes = await api.get<ProjectListItem[] | PaginatedResponse<ProjectListItem>>(
          "/api/v1/projects"
        );

        if (cancelled) return;
        const projectList = Array.isArray(projectsRes.data)
          ? projectsRes.data
          : (projectsRes.data as PaginatedResponse<ProjectListItem>).items ?? [];
        setProjects(projectList);
      } catch (err) {
        if (cancelled) return;
        setProjects([]);

        if (err instanceof ApiError) {
          toast.error(err.apiMessage);
        } else {
          toast.error("Không thể tải danh sách dự án.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [toast]);

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
      setLoadingPhases(true);

      try {
        const phasesRes = await api.get<ProjectPhasesResponse>(
          `/api/v1/projects/${projectId}/phases`
        );

        if (cancelled) return;
        setPhases(phasesRes.data);
      } catch (err) {
        if (cancelled) return;

        setPhases(null);

        if (err instanceof ApiError) {
          toast.error(err.apiMessage);
        } else {
          toast.error("Không thể tải phase dự án.");
        }
      } finally {
        if (!cancelled) setLoadingPhases(false);
      }
    };

    void loadPhases();

    return () => {
      cancelled = true;
    };
  }, [form.projectId, projects, isProjectBasedType, toast]);

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
      setLoadingCategories(true);

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
          toast.error(err.apiMessage);
        } else {
          toast.error("Không thể tải danh sách hạng mục chi phí.");
        }
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [form.phaseId, isProjectBasedType, toast]);

  useEffect(() => {
    if (!isReimburseType) {
      setAdvanceOptions([]);
      setAdvanceBalanceId(undefined);
      return;
    }

    let cancelled = false;

    const loadAdvanceBalances = async () => {
      setLoadingAdvances(true);

      try {
        const res = await api.get<AdvanceBalanceItem[]>("/api/v1/requests/my-advance-balances");

        if (cancelled) return;

        setAdvanceOptions(res.data);
      } catch (err) {
        if (cancelled) return;

        setAdvanceOptions([]);

        if (err instanceof ApiError) {
          toast.error(err.apiMessage);
        } else {
          toast.error("Không thể tải danh sách tạm ứng.");
        }
      } finally {
        if (!cancelled) setLoadingAdvances(false);
      }
    };

    void loadAdvanceBalances();

    return () => {
      cancelled = true;
    };
  }, [isReimburseType, toast]);

  useEffect(() => {
    return () => {
      files.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [files]);

  const handleAmountChange = (amount: number | null) => {
    setForm((prev) => ({ ...prev, amount: amount ?? undefined }));
    if (fieldErrors.amount) setFieldErrors((prev) => ({ ...prev, amount: undefined }));
  };

  const handleAmountBlur = () => {
    const amt = form.amount;
    if (amt !== undefined && amt < 1_000) {
      setFieldErrors((p) => ({ ...p, amount: "Số tiền tối thiểu là 1.000 ₫." }));
    }
  };

  const handleTitleBlur = () => {
    const t = title.trim();
    if (t.length > 0 && t.length < 3) {
      setFieldErrors((p) => ({ ...p, title: "Tiêu đề cần ít nhất 3 ký tự." }));
    } else if (t.length > 200) {
      setFieldErrors((p) => ({ ...p, title: "Tiêu đề quá dài." }));
    }
  };

  const handleDescriptionBlur = () => {
    const d = (form.description ?? "").trim();
    if (d.length > 0 && d.length < 10) {
      setFieldErrors((p) => ({ ...p, description: "Mô tả cần ít nhất 10 ký tự." }));
    }
  };

  const handleExpenseDateBlur = () => {
    if (!expenseDate) {
      setFieldErrors((p) => ({ ...p, expenseDate: "Vui lòng chọn ngày chi tiêu." }));
    }
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

    if (isReimburseType && !advanceBalanceId) {
      setFieldErrors((prev) => ({
        ...prev,
        advanceBalanceId: "Vui lòng chọn khoản tạm ứng cần hoàn.",
      }));
      return false;
    }

    const requiresAttachment =
      form.type === RequestType.EXPENSE || form.type === RequestType.REIMBURSE;
    if (requiresAttachment && files.length === 0) {
      toast.error("Yêu cầu Chi phí và Hoàn ứng bắt buộc phải đính kèm ít nhất 1 chứng từ.");
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateBeforeSubmit()) return;

    setSubmitting(true);

    try {
      const uploadedFiles = await uploadAttachments(files);

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
        advanceBalanceId: isReimburseType ? advanceBalanceId : undefined,
        description: descriptionParts.join("\n"),
        attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined,
      };

      const res = await api.post<RequestDetailResponse>("/api/v1/requests", payload);
      toast.success("Yêu cầu đã được tạo thành công!");
      router.push(`/requests/${res.data.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.apiMessage);
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Không thể tạo yêu cầu. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blue-200 bg-linear-to-br from-blue-700 via-blue-600 to-cyan-600 text-white shadow-xl shadow-blue-900/15">
        <div className="relative p-6 sm:p-8">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-10 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">IFMS workspace</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Create request</h1>
            <p className="mt-3 text-sm leading-6 text-blue-100">Submit advance, expense or reimbursement requests with project context and evidence files.</p>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
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
        <div className="rounded-3xl border border-slate-200 bg-white p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${selected ? cardSelected : `border-slate-200 bg-white ${cardHover}`}`}
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
            <CurrencyInput
              value={form.amount ?? null}
              onChange={handleAmountChange}
              onBlur={handleAmountBlur}
              placeholder="Nhập số tiền"
              error={fieldErrors.amount}
            />
            {!fieldErrors.amount && (
              <p className="text-xs text-slate-500 mt-1">{form.amount ? `Giá trị: ${formatCurrency(form.amount)}` : ""}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-2">Tiêu đề</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: undefined })); }}
              onBlur={handleTitleBlur}
              placeholder="Ví dụ: Tạm ứng công tác tháng 4"
              className={`w-full px-4 py-3 rounded-2xl border bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${fieldErrors.title ? "border-rose-300" : "border-slate-200"}`}
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
              onBlur={handleDescriptionBlur}
              placeholder="Mô tả nội dung chi tiêu..."
              className={`w-full px-4 py-3 rounded-2xl border bg-white text-slate-900 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${fieldErrors.description ? "border-rose-300" : "border-slate-200"}`}
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
              className={`w-full px-4 py-3 rounded-2xl border bg-white text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${fieldErrors.projectId ? "border-rose-300" : "border-slate-200"}`}
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
              disabled={!isProjectBasedType || !form.projectId || loadingPhases}
              className={`w-full px-4 py-3 rounded-2xl border bg-white text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${fieldErrors.phaseId ? "border-rose-300" : "border-slate-200"}`}
            >
              <option value="">{loadingPhases ? "Đang tải phase..." : form.projectId ? "Chọn phase" : "Chọn dự án trước"}</option>
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
              disabled={!isProjectBasedType || !form.phaseId || loadingCategories}
              className={`w-full px-4 py-3 rounded-2xl border bg-white text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${fieldErrors.categoryId ? "border-rose-300" : "border-slate-200"}`}
            >
              <option value="">{loadingCategories ? "Đang tải hạng mục..." : form.phaseId ? "Chọn hạng mục" : "Chọn phase trước"}</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {fieldErrors.categoryId && <p className="text-xs text-rose-600 mt-1">{fieldErrors.categoryId}</p>}
          </div>

          {isReimburseType && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Khoản tạm ứng cần hoàn <span className="text-rose-500">*</span>
              </label>
              <select
                value={advanceBalanceId?.toString() ?? ""}
                onChange={(e) => {
                  const id = Number(e.target.value) || undefined;
                  setAdvanceBalanceId(id);
                  setFieldErrors((p) => ({ ...p, advanceBalanceId: undefined }));
                }}
                disabled={loadingAdvances}
                className={`w-full px-4 py-3 rounded-2xl border bg-white text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500/40 ${fieldErrors.advanceBalanceId ? "border-rose-300" : "border-slate-200"}`}
              >
                <option value="">
                  {loadingAdvances ? "Đang tải..." : advanceOptions.length === 0 ? "Không có khoản tạm ứng chưa hoàn" : "Chọn khoản tạm ứng"}
                </option>
                {advanceOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.requestCode} — còn {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(opt.remainingAmount)}
                    {opt.status === "PARTIALLY_SETTLED" ? " (hoàn một phần)" : ""}
                  </option>
                ))}
              </select>
              {fieldErrors.advanceBalanceId && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.advanceBalanceId}</p>
              )}
              {advanceBalanceId && (
                <p className="text-xs text-teal-600 mt-1">✓ Đã chọn khoản tạm ứng</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Ngày chi tiêu</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => { setExpenseDate(e.target.value); if (fieldErrors.expenseDate) setFieldErrors((p) => ({ ...p, expenseDate: undefined })); }}
              onBlur={handleExpenseDateBlur}
              className={`w-full px-4 py-3 rounded-2xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${fieldErrors.expenseDate ? "border-rose-300" : "border-slate-200"}`}
            />
            {fieldErrors.expenseDate && <p className="text-xs text-rose-600 mt-1">{fieldErrors.expenseDate}</p>}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <label className="block text-sm font-medium text-slate-600 mb-2">Đính kèm chứng từ (image/pdf)</label>

          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center bg-blue-50">
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
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3"
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
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-medium transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
          >
            Hủy
          </button>

          <button
            type="submit"
            disabled={submitting || loading}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors"
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
