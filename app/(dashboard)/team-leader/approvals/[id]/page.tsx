"use client";

import Link from "next/link";
import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import { useToast } from "@/contexts/toast-context";
import {
  RequestAction,
  RequestStatus,
  RequestType,
  TLApproveBody,
  TLApprovalDetailResponse,
  TLApproveResponse,
  TLRejectBody,
  TLRejectResponse,
} from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { normalizeTLApprovalDetail } from "@/lib/adapters/team-leader";
import { CurrencyInput } from "@/components/ui/currency-input";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface TLApprovalDetailView {
  id: number;
  requestCode: string;
  type: RequestType;
  status: RequestStatus;
  amount: number;
  approvedAmount: number | null;
  description: string | null;
  rejectReason: string | null;
  projectId: number;
  projectName: string | null;
  projectCode: string;
  phaseId: number;
  phaseName: string | null;
  phaseCode: string;
  categoryId: number | null;
  categoryName: string | null;
  requesterId: number;
  requesterName: string;
  requesterEmail?: string;
  requesterEmployeeCode?: string;
  createdAt: string;
  updatedAt: string;
  phaseBudgetLimit?: number;
  phaseCurrentSpent?: number;
  attachments: TLApprovalDetailResponse["attachments"];
  timeline: NonNullable<TLApprovalDetailResponse["timeline"]>;
}


function toTLApprovalDetailView(
  detail: TLApprovalDetailResponse,
): TLApprovalDetailView {
  return {
    id: detail.id,
    requestCode: detail.requestCode,
    type: detail.type,
    status: detail.status,
    amount: detail.amount,
    approvedAmount: detail.approvedAmount ?? null,
    description: detail.description,
    rejectReason: detail.rejectReason ?? null,
    projectId: detail.project.id,
    projectName: detail.project.name ?? null,
    projectCode: detail.project.projectCode,
    phaseId: detail.phase.id,
    phaseName: detail.phase.name ?? null,
    phaseCode: detail.phase.phaseCode,
    categoryId: detail.categoryId,
    categoryName: detail.categoryName,
    requesterId: detail.requester.id,
    requesterName: detail.requester.fullName,
    requesterEmail: detail.requester.email,
    requesterEmployeeCode: detail.requester.employeeCode,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    phaseBudgetLimit: detail.phase.budgetLimit,
    phaseCurrentSpent: detail.phase.currentSpent,
    attachments: detail.attachments,
    timeline: detail.timeline ?? [],
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(-2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function getTypeClass(type: RequestType): string {
  switch (type) {
    case RequestType.ADVANCE:
      return "bg-violet-100 border-violet-200 text-violet-700";
    case RequestType.EXPENSE:
      return "bg-sky-100 border-sky-200 text-sky-700";
    case RequestType.REIMBURSE:
      return "bg-amber-100 border-amber-200 text-amber-700";
    default:
      return "bg-slate-100 border-slate-200 text-slate-600";
  }
}

function getTypeLabel(type: RequestType): string {
  switch (type) {
    case RequestType.ADVANCE:
      return "Tạm ứng";
    case RequestType.EXPENSE:
      return "Chi phí";
    case RequestType.REIMBURSE:
      return "Hoàn ứng";
    default:
      return type;
  }
}

function getStatusClass(status: RequestStatus): string {
  switch (status) {
    case RequestStatus.PENDING:
      return "bg-amber-100 border-amber-200 text-amber-700";
    case RequestStatus.APPROVED_BY_TEAM_LEADER:
      return "bg-blue-50 border-blue-200 text-blue-700";
    case RequestStatus.PAID:
      return "bg-emerald-100 border-emerald-200 text-emerald-700";
    case RequestStatus.REJECTED:
      return "bg-rose-100 border-rose-200 text-rose-700";
    case RequestStatus.CANCELLED:
      return "bg-slate-100 border-slate-200 text-slate-600";
    default:
      return "bg-slate-100 border-slate-200 text-slate-600";
  }
}

function getStatusLabel(status: RequestStatus): string {
  switch (status) {
    case RequestStatus.PENDING:
      return "Chờ duyệt";
    case RequestStatus.APPROVED_BY_TEAM_LEADER:
      return "Chờ kế toán";
    case RequestStatus.PAID:
      return "Đã chi";
    case RequestStatus.REJECTED:
      return "Từ chối";
    case RequestStatus.CANCELLED:
      return "Đã hủy";
    default:
      return status;
  }
}

function getTimelineIcon(action: RequestAction): React.ReactNode {
  switch (action) {
    case RequestAction.APPROVE:
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 13l4 4L19 7"
          />
        </svg>
      );
    case RequestAction.REJECT:
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      );
    case RequestAction.PAYOUT:
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1"
          />
        </svg>
      );
    default:
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
}

function getTimelineActionLabel(action: RequestAction): string {
  switch (action) {
    case RequestAction.APPROVE:
      return "Đã duyệt";
    case RequestAction.REJECT:
      return "Đã từ chối";
    case RequestAction.PAYOUT:
      return "Đã giải ngân";
    case RequestAction.CANCEL:
      return "Đã hủy";
    default:
      return action;
  }
}

function getAttachmentIcon(fileType: string): React.ReactNode {
  const lower = fileType.toLowerCase();

  if (lower.includes("pdf")) {
    return (
      <svg
        className="w-5 h-5 text-rose-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 3h7l5 5v13H7V3zm7 0v5h5"
        />
      </svg>
    );
  }

  if (lower.includes("image")) {
    return (
      <svg
        className="w-5 h-5 text-emerald-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 11l3 3 2-2 4 4"
        />
      </svg>
    );
  }

  if (
    lower.includes("excel") ||
    lower.includes("spreadsheet") ||
    lower.includes("sheet")
  ) {
    return (
      <svg
        className="w-5 h-5 text-emerald-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 3h10l4 4v14H7V3zm10 0v4h4"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M10 10l4 6m0-6l-4 6"
        />
      </svg>
    );
  }

  if (
    lower.includes("word") ||
    lower.includes("document") ||
    lower.includes("doc")
  ) {
    return (
      <svg
        className="w-5 h-5 text-sky-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 3h10l4 4v14H7V3zm10 0v4h4"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 11l1.5 5L12 11l1.5 5L15 11"
        />
      </svg>
    );
  }

  return (
    <svg
      className="w-5 h-5 text-slate-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7 3h10l4 4v14H7V3zm10 0v4h4"
      />
    </svg>
  );
}

export default function TLApprovalDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const toast = useToast();

  const [request, setRequest] = useState<TLApprovalDetailView | null>(null);
  const [loading, setLoading] = useState(true);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveComment, setApproveComment] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      setLoading(true);

      try {
        const res = await api.get<unknown>(
          `/api/v1/team-leader/approvals/${id}`,
        );

        if (cancelled) return;

        const normalized = normalizeTLApprovalDetail(res.data);
        const mapped = toTLApprovalDetailView(normalized);

        setRequest(mapped);
      } catch (err) {
        if (cancelled) return;
        setRequest(null);
        toast.error(err instanceof ApiError ? err.apiMessage : "Không thể tải chi tiết yêu cầu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  const budgetSummary = useMemo(() => {
    if (!request) return null;

    const budgetLimit = request.phaseBudgetLimit ?? Math.max(request.amount, 1);
    const currentSpent = request.phaseCurrentSpent ?? 0;
    const totalAfter = currentSpent + request.amount;

    const safeLimit = Math.max(1, budgetLimit);
    const spentPercent = Math.max(
      0,
      Math.min(100, (currentSpent / safeLimit) * 100),
    );
    const requestPercent = Math.max(
      0,
      Math.min(100 - spentPercent, (request.amount / safeLimit) * 100),
    );

    const severityClass =
      totalAfter / safeLimit >= 0.85
        ? "bg-rose-500"
        : totalAfter / safeLimit >= 0.65
          ? "bg-amber-500"
          : "bg-emerald-500";

    return {
      budgetLimit,
      currentSpent,
      totalAfter,
      spentPercent,
      requestPercent,
      severityClass,
      overBudget: totalAfter > safeLimit,
    };
  }, [request]);

  const canTakeAction = request?.status === RequestStatus.PENDING;

  const openApproveModal = () => {
    if (!request) return;
    setApprovedAmount(String(request.amount));
    setApproveComment("");
    setActionError(null);
    setShowApproveModal(true);
  };

  const openRejectModal = () => {
    setRejectReason("");
    setActionError(null);
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!request) return;

    const numericApprovedAmount = Number(approvedAmount);
    if (!Number.isFinite(numericApprovedAmount) || numericApprovedAmount < 1) {
      setActionError("Số tiền duyệt phải lớn hơn 0.");
      return;
    }

    if (numericApprovedAmount > request.amount) {
      setActionError("Số tiền duyệt không được vượt quá số tiền yêu cầu.");
      return;
    }

    setSubmitting(true);
    setActionError(null);

    const body: TLApproveBody = {
      comment: approveComment.trim() || undefined,
      approvedAmount: numericApprovedAmount,
    };

    try {
      await api.post<TLApproveResponse>(
        `/api/v1/team-leader/approvals/${id}/approve`,
        body,
      );
      toast.success("Đã duyệt yêu cầu thành công.");
      router.push("/team-leader/approvals");
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.apiMessage);
      } else {
        setActionError("Không thể duyệt yêu cầu. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;

    if (rejectReason.trim().length < 10) {
      setActionError("Lý do từ chối phải có ít nhất 10 ký tự.");
      return;
    }

    setSubmitting(true);
    setActionError(null);

    const body: TLRejectBody = { reason: rejectReason.trim() };

    try {
      await api.post<TLRejectResponse>(
        `/api/v1/team-leader/approvals/${id}/reject`,
        body,
      );
      toast.success("Đã từ chối yêu cầu.");
      router.push("/team-leader/approvals");
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.apiMessage);
      } else {
        setActionError("Không thể từ chối yêu cầu. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-3xl bg-white" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-3xl bg-white" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-3xl bg-white" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-4">
        <Link
          href="/team-leader/approvals"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Quay lại danh sách
        </Link>
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0l-2 7H6l-2-7m16 0H4" />
            </svg>
          </div>
          <h2 className="mt-4 text-base font-bold text-slate-900">Không tìm thấy yêu cầu</h2>
          <p className="mt-1 text-sm text-slate-500">Yêu cầu có thể đã bị xóa hoặc bạn không còn quyền truy cập.</p>
        </div>
      </div>
    );
  }

  const sortedTimeline = [...request.timeline].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const requesterLabel = request.requesterEmployeeCode ?? `ID ${request.requesterId}`;
  const approvedValue = request.approvedAmount ?? request.amount;
  const remainingBudget = budgetSummary
    ? Math.max(0, budgetSummary.budgetLimit - budgetSummary.totalAfter)
    : 0;
  const afterUsagePercent = budgetSummary
    ? Math.min(100, Math.round((budgetSummary.totalAfter / Math.max(1, budgetSummary.budgetLimit)) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-indigo-200 bg-linear-to-br from-indigo-700 via-blue-600 to-cyan-600 text-white shadow-xl shadow-indigo-900/15">
        <div className="relative px-6 py-7 sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.28),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(103,232,249,0.22),_transparent_34%)]" />
          <div className="relative">
            <Link
              href="/team-leader/approvals"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại danh sách
            </Link>

            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-indigo-100">{request.requestCode}</p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Chi tiết yêu cầu phê duyệt</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100">
                  Kiểm tra người gửi, hạng mục, chứng từ và sức khỏe ngân sách phase trước khi xử lý Flow 1.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 lg:items-end">
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${getTypeClass(request.type)}`}>
                    {getTypeLabel(request.type)}
                  </span>
                  <span className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${getStatusClass(request.status)}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </div>
                <p className="text-3xl font-bold">{formatCurrency(request.amount)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Số tiền yêu cầu" value={formatCurrency(request.amount)} helper={`Tạo lúc ${formatDateTime(request.createdAt)}`} tone="blue" />
        <MetricCard label="Số tiền duyệt" value={formatCurrency(approvedValue)} helper={request.approvedAmount ? "Đã có giá trị duyệt" : "Mặc định bằng số tiền yêu cầu"} tone="emerald" />
        <MetricCard label="Ngân sách còn lại" value={formatCurrency(remainingBudget)} helper={`Sau yêu cầu: ${afterUsagePercent}% sử dụng`} tone={budgetSummary?.overBudget ? "rose" : "indigo"} />
        <MetricCard label="Timeline" value={String(sortedTimeline.length)} helper="Sự kiện đã ghi nhận" tone="slate" />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Thông tin chi tiết</h2>
                <p className="mt-1 text-sm text-slate-500">Ngữ cảnh nghiệp vụ và người chịu trách nhiệm yêu cầu.</p>
              </div>
              <span className="font-mono text-xs font-semibold text-blue-700">{request.requestCode}</span>
            </div>

            <div className="mb-4 rounded-3xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                  {getInitials(request.requesterName)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-950">{request.requesterName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {requesterLabel}
                    {request.requesterEmail ? ` • ${request.requesterEmail}` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoCard
                label="Mô tả"
                value={request.description || "Không có mô tả"}
                multiline
              />
              <InfoCard
                label="Dự án"
                value={
                  `${request.projectCode ?? ""} ${request.projectName ?? ""}`.trim() ||
                  "—"
                }
              />
              <InfoCard
                label="Phase"
                value={
                  `${request.phaseCode ?? ""} ${request.phaseName ?? ""}`.trim() ||
                  "—"
                }
              />
              <InfoCard label="Danh mục" value={request.categoryName ?? "—"} />
            </div>
          </div>

          {budgetSummary && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Sức khỏe ngân sách Phase
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{request.phaseName ?? "N/A"}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  budgetSummary.overBudget
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}>
                  {budgetSummary.overBudget ? "Vượt ngân sách" : "Trong giới hạn"}
                </span>
              </div>

              <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-r-full ${budgetSummary.severityClass}`}
                  style={{ width: `${budgetSummary.spentPercent}%` }}
                />
                <div
                  className="h-full bg-blue-300/80"
                  style={{ width: `${budgetSummary.requestPercent}%` }}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <InfoCard label="Đã dùng" value={formatCurrency(budgetSummary.currentSpent)} />
                <InfoCard label="Yêu cầu này" value={formatCurrency(request.amount)} />
                <InfoCard label="Tổng sau duyệt" value={`${formatCurrency(budgetSummary.totalAfter)} / ${formatCurrency(budgetSummary.budgetLimit)}`} />
              </div>

              {budgetSummary.overBudget && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  ⚠ Yêu cầu này vượt ngân sách phase. Cần xem xét kỹ trước khi duyệt.
                </div>
              )}
            </div>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">Tệp đính kèm</h2>
              <p className="mt-1 text-sm text-slate-500">Chứng từ và tài liệu được gửi kèm yêu cầu.</p>
            </div>

            {request.attachments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Không có tệp đính kèm.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {request.attachments.map((file) => (
                  <div
                    key={file.fileId}
                    className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5">
                        {getAttachmentIcon(file.fileType)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-900 truncate">
                          {file.fileName}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>

                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-600"
                    >
                      Tải xuống
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 5v14m0 0l-4-4m4 4l4-4"
                        />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {canTakeAction && (
            <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Thao tác phê duyệt</h2>
                <p className="mt-1 text-sm text-slate-500">Sau khi duyệt, yêu cầu sẽ chuyển sang bước xử lý tiếp theo.</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openApproveModal}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-500"
                >
                  Duyệt
                </button>

                <button
                  type="button"
                  onClick={openRejectModal}
                  className="rounded-2xl border border-rose-200 bg-white px-5 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
                >
                  Từ chối
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Timeline</h2>
            <p className="mt-1 text-sm text-slate-500">Lịch sử xử lý yêu cầu.</p>
          </div>

          <div className="space-y-3">
            {sortedTimeline.map((entry, index) => (
              <div key={entry.id} className="relative pl-8">
                {index < sortedTimeline.length - 1 && (
                  <span className="absolute left-3 top-7 bottom-[-10px] w-px bg-slate-200" />
                )}
                <span className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                  {getTimelineIcon(entry.action)}
                </span>
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="text-sm font-bold text-slate-900">
                    {getTimelineActionLabel(entry.action)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {entry.actorName}
                  </p>
                  {entry.comment && (
                    <p className="text-xs text-slate-600 mt-1">
                      {entry.comment}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDateTime(entry.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showApproveModal && request && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowApproveModal(false)}
            aria-label="Đóng modal duyệt"
          />

          <div className="absolute inset-x-0 top-10 mx-auto w-[calc(100%-2rem)] max-w-xl rounded-3xl border border-blue-100 bg-white p-6 shadow-2xl shadow-slate-950/20">
            <div className="mb-5">
              <h3 className="text-xl font-bold text-slate-900">
                Xác nhận duyệt yêu cầu
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {request.requestCode} - {request.requesterName}
              </p>
            </div>

            <div className="space-y-5">
            <div>
              <label className="block text-sm text-slate-600 mb-2">
                Số tiền duyệt
              </label>
              <CurrencyInput
                value={Number(approvedAmount) || null}
                onChange={(value) => setApprovedAmount(value ? String(value) : "")}
                error={actionError ?? undefined}
                max={request.amount}
                className="focus:ring-blue-500/40"
              />
              <p className="text-xs text-slate-500 mt-1">
                Tối đa {formatCurrency(request.amount)}
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-2">
                Ghi chú
              </label>
              <textarea
                rows={4}
                value={approveComment}
                onChange={(event) => setApproveComment(event.target.value)}
                placeholder="Nhận xét của bạn..."
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
            </div>

            {actionError && (
              <div className="px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-5">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={submitting}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Đang xử lý..." : "Xác nhận duyệt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && request && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowRejectModal(false)}
            aria-label="Đóng modal từ chối"
          />

          <div className="absolute inset-x-0 top-10 mx-auto w-[calc(100%-2rem)] max-w-xl rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl shadow-slate-950/20">
            <div className="mb-5">
              <h3 className="text-xl font-bold text-slate-900">
                Từ chối yêu cầu - {request.requestCode}
              </h3>
              <p className="mt-1 text-sm text-slate-500">Lý do từ chối sẽ được ghi vào timeline xử lý.</p>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-2">
                Lý do từ chối
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-500/10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                "Thiếu chứng từ",
                "Số tiền không hợp lý",
                "Không đúng danh mục",
                "Vượt ngân sách",
              ].map((reasonChip) => (
                <button
                  key={reasonChip}
                  type="button"
                  onClick={() =>
                    setRejectReason((prev) =>
                      prev.trim()
                        ? `${prev.trim()}. ${reasonChip}`
                        : reasonChip,
                    )
                  }
                  className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-100"
                >
                  {reasonChip}
                </button>
              ))}
            </div>

            {actionError && (
              <div className="px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-5">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={rejectReason.trim().length < 10 || submitting}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: "blue" | "emerald" | "indigo" | "rose" | "slate";
}) {
  const toneClassName = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
  }[tone];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 h-2 w-12 rounded-full border ${toneClassName}`} />
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function InfoCard({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p
        className={`mt-2 text-sm font-semibold text-slate-900 ${multiline ? "whitespace-pre-line font-normal leading-6" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
