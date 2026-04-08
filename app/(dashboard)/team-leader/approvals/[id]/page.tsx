"use client";

import Link from "next/link";
import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  RequestAction,
  RequestDetailResponse,
  RequestStatus,
  RequestType,
  TLApproveBody,
  TLApproveResponse,
  TLRejectBody,
  TLRejectResponse,
} from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface TLApprovalDetailView extends RequestDetailResponse {
  phaseBudgetLimit?: number;
  phaseCurrentSpent?: number;
  requesterEmail?: string;
  requesterEmployeeCode?: string;
}

const PHASE_BUDGET_FALLBACK: Record<number, { budgetLimit: number; currentSpent: number }> = {
  1: { budgetLimit: 50_000_000, currentSpent: 47_000_000 },
  2: { budgetLimit: 80_000_000, currentSpent: 31_000_000 },
  3: { budgetLimit: 30_000_000, currentSpent: 8_500_000 },
};

// TODO: Replace when Sprint 4-5 is complete
const MOCK_DETAIL: TLApprovalDetailView = {
  id: 1,
  requestCode: "REQ-2026-0041",
  type: RequestType.ADVANCE,
  status: RequestStatus.PENDING,
  amount: 3_500_000,
  approvedAmount: null,
  description:
    "Mua vật tư thiết bị thí nghiệm phục vụ dự án. Bao gồm màn hình đo kiểm, cáp kết nối chuyên dụng và bộ nguồn dự phòng UPS.",
  rejectReason: null,
  projectId: 1,
  projectName: "Hệ thống quản lý nội bộ",
  projectCode: "PRJ-IT-001",
  phaseId: 1,
  phaseName: "Phase 1 - Phân tích",
  phaseCode: "PH-001",
  categoryId: 1,
  categoryName: "Thiết bị & Phần cứng",
  requesterId: 11,
  requesterName: "Đỗ Quốc Bảo",
  requesterEmail: "emp.it1@ifms.vn",
  requesterEmployeeCode: "EMP001",
  createdAt: "2026-04-03T09:15:00",
  updatedAt: "2026-04-03T09:15:00",
  phaseBudgetLimit: 50_000_000,
  phaseCurrentSpent: 47_000_000,
  attachments: [
    {
      fileId: 1,
      fileName: "hoa_don_thiet_bi.pdf",
      url: "#",
      fileType: "application/pdf",
      size: 245_000,
    },
    {
      fileId: 2,
      fileName: "bang_bao_gia.xlsx",
      url: "#",
      fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 184_000,
    },
  ],
  timeline: [
    {
      id: 1,
      action: RequestAction.APPROVE,
      statusAfterAction: RequestStatus.PENDING,
      actorId: 11,
      actorName: "Đỗ Quốc Bảo",
      comment: "Tạo yêu cầu",
      createdAt: "2026-04-03T09:15:00",
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

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
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
      return "bg-violet-500/15 border-violet-500/30 text-violet-300";
    case RequestType.EXPENSE:
      return "bg-sky-500/15 border-sky-500/30 text-sky-300";
    case RequestType.REIMBURSE:
      return "bg-amber-500/15 border-amber-500/30 text-amber-300";
    default:
      return "bg-slate-500/15 border-slate-500/30 text-slate-300";
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
      return "bg-amber-500/15 border-amber-500/30 text-amber-300";
    case RequestStatus.PENDING_ACCOUNTANT_EXECUTION:
      return "bg-blue-500/15 border-blue-500/30 text-blue-300";
    case RequestStatus.PAID:
      return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
    case RequestStatus.REJECTED:
      return "bg-rose-500/15 border-rose-500/30 text-rose-300";
    case RequestStatus.CANCELLED:
      return "bg-slate-500/15 border-slate-500/30 text-slate-300";
    default:
      return "bg-slate-500/15 border-slate-500/30 text-slate-300";
  }
}

function getStatusLabel(status: RequestStatus): string {
  switch (status) {
    case RequestStatus.PENDING:
      return "Chờ duyệt";
    case RequestStatus.PENDING_ACCOUNTANT_EXECUTION:
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
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
        </svg>
      );
    case RequestAction.REJECT:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case RequestAction.PAYOUT:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      <svg className="w-5 h-5 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 3h7l5 5v13H7V3zm7 0v5h5" />
      </svg>
    );
  }

  if (lower.includes("image")) {
    return (
      <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11l3 3 2-2 4 4" />
      </svg>
    );
  }

  if (lower.includes("excel") || lower.includes("spreadsheet") || lower.includes("sheet")) {
    return (
      <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 3h10l4 4v14H7V3zm10 0v4h4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 10l4 6m0-6l-4 6" />
      </svg>
    );
  }

  if (lower.includes("word") || lower.includes("document") || lower.includes("doc")) {
    return (
      <svg className="w-5 h-5 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 3h10l4 4v14H7V3zm10 0v4h4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 11l1.5 5L12 11l1.5 5L15 11" />
      </svg>
    );
  }

  return (
    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 3h10l4 4v14H7V3zm10 0v4h4" />
    </svg>
  );
}

export default function TLApprovalDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [request, setRequest] = useState<TLApprovalDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);

      try {
        const res = await api.get<TLApprovalDetailView>(`/api/v1/team-leader/approvals/${id}`);

        if (cancelled) return;

        const fallbackBudget =
          res.data.phaseId && PHASE_BUDGET_FALLBACK[res.data.phaseId]
            ? PHASE_BUDGET_FALLBACK[res.data.phaseId]
            : undefined;

        setRequest({
          ...res.data,
          phaseBudgetLimit: res.data.phaseBudgetLimit ?? fallbackBudget?.budgetLimit,
          phaseCurrentSpent: res.data.phaseCurrentSpent ?? fallbackBudget?.currentSpent,
        });
      } catch (err) {
        if (cancelled) return;

        const safeId = Number(id);
        setRequest({
          ...MOCK_DETAIL,
          id: Number.isFinite(safeId) && safeId > 0 ? safeId : MOCK_DETAIL.id,
          requestCode: `REQ-2026-${String(id).padStart(4, "0")}`,
        });

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải chi tiết từ API, đang hiển thị dữ liệu mẫu.");
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

  const budgetSummary = useMemo(() => {
    if (!request) return null;

    const fromMap = request.phaseId ? PHASE_BUDGET_FALLBACK[request.phaseId] : undefined;
    const budgetLimit = request.phaseBudgetLimit ?? fromMap?.budgetLimit ?? Math.max(request.amount, 1);
    const currentSpent = request.phaseCurrentSpent ?? fromMap?.currentSpent ?? 0;
    const totalAfter = currentSpent + request.amount;

    const safeLimit = Math.max(1, budgetLimit);
    const spentPercent = Math.max(0, Math.min(100, (currentSpent / safeLimit) * 100));
    const requestPercent = Math.max(
      0,
      Math.min(100 - spentPercent, (request.amount / safeLimit) * 100)
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
      await api.post<TLApproveResponse>(`/api/v1/team-leader/approvals/${id}/approve`, body);
      router.push("/team-leader/approvals");
    } catch {
      router.push("/team-leader/approvals");
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
      await api.post<TLRejectResponse>(`/api/v1/team-leader/approvals/${id}/reject`, body);
      router.push("/team-leader/approvals");
    } catch {
      router.push("/team-leader/approvals");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 rounded bg-slate-800 animate-pulse" />
        <div className="h-28 rounded-2xl bg-slate-800 animate-pulse" />
        <div className="h-80 rounded-2xl bg-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-4">
        <Link href="/team-leader/approvals" className="inline-flex items-center gap-2 text-slate-300 hover:text-white">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại danh sách
        </Link>
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 text-center text-slate-400">
          Không tìm thấy yêu cầu.
        </div>
      </div>
    );
  }

  const sortedTimeline = [...request.timeline].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/team-leader/approvals" className="hover:text-slate-200 transition-colors">
          Duyệt yêu cầu
        </Link>
        <span>/</span>
        <span className="text-slate-300 font-mono">{request.requestCode}</span>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500">Mã yêu cầu</p>
            <h1 className="text-2xl font-bold text-white font-mono mt-1">{request.requestCode}</h1>
            <p className="text-sm text-slate-400 mt-1">Tạo lúc {formatDateTime(request.createdAt)}</p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2">
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex px-3 py-1.5 rounded-full border text-sm ${getTypeClass(request.type)}`}>
                {getTypeLabel(request.type)}
              </span>
              <span className={`inline-flex px-3 py-1.5 rounded-full border text-sm ${getStatusClass(request.status)}`}>
                {getStatusLabel(request.status)}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(request.amount)}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-white">Người gửi yêu cầu</h2>
        <div className="mt-3 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-slate-900 border border-white/10 text-slate-100 flex items-center justify-center text-sm font-semibold">
            {getInitials(request.requesterName)}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{request.requesterName}</p>
            <p className="text-xs text-slate-500">
              {request.requesterEmployeeCode ?? `ID ${request.requesterId}`}
              {request.requesterEmail ? ` • ${request.requesterEmail}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Thông tin chi tiết</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoCard label="Mô tả" value={request.description || "Không có mô tả"} multiline />
              <InfoCard
                label="Dự án"
                value={`${request.projectCode ?? ""} ${request.projectName ?? ""}`.trim() || "—"}
              />
              <InfoCard
                label="Phase"
                value={`${request.phaseCode ?? ""} ${request.phaseName ?? ""}`.trim() || "—"}
              />
              <InfoCard label="Danh mục" value={request.categoryName ?? "—"} />
            </div>
          </div>

          {budgetSummary && (
            <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-3">
              <h2 className="text-lg font-semibold text-white">
                Sức khỏe ngân sách Phase: {request.phaseName ?? "N/A"}
              </h2>

              <div className="h-3 rounded-full bg-slate-900 border border-white/10 overflow-hidden flex">
                <div className={`h-full ${budgetSummary.severityClass}`} style={{ width: `${budgetSummary.spentPercent}%` }} />
                <div className="h-full bg-slate-300/60" style={{ width: `${budgetSummary.requestPercent}%` }} />
              </div>

              <p className="text-sm text-slate-300">
                {formatCurrency(budgetSummary.currentSpent)} đã dùng + {formatCurrency(request.amount)} yêu cầu ={" "}
                {formatCurrency(budgetSummary.totalAfter)} / {formatCurrency(budgetSummary.budgetLimit)}
              </p>

              {budgetSummary.overBudget && (
                <div className="px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
                  ⚠ Yêu cầu này vượt ngân sách phase - xem xét kỹ trước khi duyệt
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Tệp đính kèm</h2>

            {request.attachments.length === 0 ? (
              <p className="text-sm text-slate-500">Không có tệp đính kèm.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {request.attachments.map((file) => (
                  <div key={file.fileId} className="rounded-xl border border-white/10 bg-slate-900 p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5">{getAttachmentIcon(file.fileType)}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{file.fileName}</p>
                        <p className="text-xs text-slate-500 mt-1">{formatFileSize(file.size)}</p>
                      </div>
                    </div>

                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-300 hover:text-blue-200"
                    >
                      Tải xuống
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v14m0 0l-4-4m4 4l4-4" />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {canTakeAction && (
            <div className="bg-slate-800 border border-white/10 rounded-2xl p-5">
              <h2 className="text-lg font-semibold text-white">Thao tác phê duyệt</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openApproveModal}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                >
                  Duyệt
                </button>

                <button
                  type="button"
                  onClick={openRejectModal}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors"
                >
                  Từ chối
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-800 border border-white/10 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Timeline</h2>

          <div className="space-y-3">
            {sortedTimeline.map((entry, index) => (
              <div key={entry.id} className="relative pl-8">
                {index < sortedTimeline.length - 1 && (
                  <span className="absolute left-3 top-7 bottom-[-10px] w-px bg-slate-600" />
                )}
                <span className="absolute left-0 top-1 w-6 h-6 rounded-full border border-white/20 bg-slate-900 text-slate-300 flex items-center justify-center">
                  {getTimelineIcon(entry.action)}
                </span>
                <div className="rounded-xl border border-white/10 bg-slate-900 p-3">
                  <p className="text-sm font-medium text-white">{getTimelineActionLabel(entry.action)}</p>
                  <p className="text-xs text-slate-400 mt-1">{entry.actorName}</p>
                  {entry.comment && <p className="text-xs text-slate-300 mt-1">{entry.comment}</p>}
                  <p className="text-xs text-slate-500 mt-1">{formatDateTime(entry.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm">
          {error}
        </div>
      )}

      {showApproveModal && request && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowApproveModal(false)}
            aria-label="Đóng modal duyệt"
          />

          <div className="absolute inset-x-0 top-10 mx-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-slate-900 border border-white/10 p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">Xác nhận duyệt yêu cầu</h3>
            <p className="text-sm text-slate-400">
              {request.requestCode} - {request.requesterName}
            </p>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Số tiền duyệt</label>
              <input
                type="number"
                min={1}
                max={request.amount}
                value={approvedAmount}
                onChange={(event) => setApprovedAmount(event.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <p className="text-xs text-slate-500 mt-1">Tối đa {formatCurrency(request.amount)}</p>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Ghi chú</label>
              <textarea
                rows={4}
                value={approveComment}
                onChange={(event) => setApproveComment(event.target.value)}
                placeholder="Nhận xét của bạn..."
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            {actionError && (
              <div className="px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
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

          <div className="absolute inset-x-0 top-10 mx-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-slate-900 border border-white/10 p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">Từ chối yêu cầu - {request.requestCode}</h3>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Lý do từ chối</label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {["Thiếu chứng từ", "Số tiền không hợp lý", "Không đúng danh mục", "Vượt ngân sách"].map(
                (reasonChip) => (
                  <button
                    key={reasonChip}
                    type="button"
                    onClick={() =>
                      setRejectReason((prev) => (prev.trim() ? `${prev.trim()}. ${reasonChip}` : reasonChip))
                    }
                    className="px-3 py-1.5 rounded-full border border-white/15 bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                  >
                    {reasonChip}
                  </button>
                )
              )}
            </div>

            {actionError && (
              <div className="px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={rejectReason.trim().length < 10 || submitting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
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
    <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm text-white mt-1 ${multiline ? "whitespace-pre-line" : ""}`}>{value}</p>
    </div>
  );
}
