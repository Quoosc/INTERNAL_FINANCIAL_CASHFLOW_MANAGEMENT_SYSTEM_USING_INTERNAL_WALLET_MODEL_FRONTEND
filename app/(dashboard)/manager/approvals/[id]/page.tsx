"use client";

import Link from "next/link";
import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  ManagerApprovalDetailResponse,
  ManagerApproveBody,
  ManagerApproveResponse,
  ManagerRejectBody,
  ManagerRejectResponse,
  RequestAction,
  RequestStatus,
  RequestType,
} from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

// TODO: Replace when Sprint 4-5 is complete
const MOCK_DETAIL: ManagerApprovalDetailResponse = {
  id: 10,
  requestCode: "REQ-2026-0050",
  type: RequestType.PROJECT_TOPUP,
  status: RequestStatus.PENDING,
  amount: 50_000_000,
  approvedAmount: null,
  description:
    "Xin cấp vốn bổ sung Phase 2 - nhóm IT thiếu ngân sách phát triển module báo cáo tài chính. Dự kiến dùng cho: nhân công outsource (30M) + infrastructure (20M).",
  rejectReason: null,
  requester: {
    id: 4,
    fullName: "Hoàng Minh Tuấn",
    avatar: null,
    employeeCode: "TL001",
    jobTitle: "Team Leader IT",
    email: "tl.it@ifms.vn",
    departmentName: "Phòng CNTT",
  },
  project: {
    id: 1,
    projectCode: "PRJ-IT-001",
    name: "Hệ thống quản lý nội bộ",
    totalBudget: 150_000_000,
    availableBudget: 12_000_000,
  },
  department: {
    id: 1,
    name: "Phòng CNTT",
    totalAvailableBalance: 245_000_000,
  },
  timeline: [
    {
      id: 1,
      action: RequestAction.APPROVE,
      statusAfterAction: RequestStatus.PENDING,
      actorId: 4,
      actorName: "Hoàng Minh Tuấn",
      comment: "Tạo yêu cầu cấp vốn",
      createdAt: "2026-04-03T10:00:00",
    },
  ],
  createdAt: "2026-04-03T10:00:00",
  updatedAt: "2026-04-03T10:00:00",
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

function statusClass(status: RequestStatus): string {
  switch (status) {
    case RequestStatus.PENDING:
      return "bg-amber-500/15 border-amber-500/30 text-amber-300";
    case RequestStatus.PAID:
      return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
    case RequestStatus.REJECTED:
      return "bg-rose-500/15 border-rose-500/30 text-rose-300";
    default:
      return "bg-slate-500/15 border-slate-500/30 text-slate-300";
  }
}

function statusLabel(status: RequestStatus): string {
  switch (status) {
    case RequestStatus.PENDING:
      return "Chờ duyệt";
    case RequestStatus.PAID:
      return "Đã cấp vốn";
    case RequestStatus.REJECTED:
      return "Đã từ chối";
    default:
      return status;
  }
}

function timelineActionLabel(action: RequestAction): string {
  switch (action) {
    case RequestAction.APPROVE:
      return "Duyệt";
    case RequestAction.REJECT:
      return "Từ chối";
    case RequestAction.PAYOUT:
      return "Giải ngân";
    case RequestAction.CANCEL:
      return "Hủy";
    default:
      return action;
  }
}

function timelineIcon(action: RequestAction): React.ReactNode {
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
    default:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export default function ManagerApprovalDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [request, setRequest] = useState<ManagerApprovalDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [approvedAmount, setApprovedAmount] = useState("");
  const [approveComment, setApproveComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<ManagerApprovalDetailResponse>(`/api/v1/manager/approvals/${id}`);

        if (cancelled) return;

        setRequest(res.data);
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

  const maxApprovable = useMemo(() => {
    if (!request) return 0;
    return Math.max(0, Math.min(request.amount, request.department.totalAvailableBalance));
  }, [request]);

  const previewApprovedAmount = useMemo(() => {
    if (!request) return 0;

    const fromInput = Number(approvedAmount);
    if (!Number.isFinite(fromInput) || fromInput <= 0) {
      return Math.min(request.amount, maxApprovable || request.amount);
    }

    return Math.min(fromInput, maxApprovable || request.amount);
  }, [approvedAmount, maxApprovable, request]);

  const canTakeAction = request?.status === RequestStatus.PENDING;

  const openApproveModal = () => {
    if (!request) return;
    setApprovedAmount(String(Math.min(request.amount, maxApprovable || request.amount)));
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

    const numericAmount = Number(approvedAmount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setActionError("Số tiền duyệt phải lớn hơn 0.");
      return;
    }

    if (numericAmount > maxApprovable) {
      setActionError("Số tiền duyệt vượt mức quỹ phòng ban khả dụng.");
      return;
    }

    setSubmitting(true);
    setActionError(null);

    const body: ManagerApproveBody = {
      approvedAmount: numericAmount,
      comment: approveComment.trim() || undefined,
    };

    try {
      await api.post<ManagerApproveResponse>(`/api/v1/manager/approvals/${id}/approve`, body);
      router.push("/manager/approvals");
    } catch {
      router.push("/manager/approvals");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;

    if (rejectReason.trim().length < 10) {
      setActionError("Lý do từ chối cần ít nhất 10 ký tự.");
      return;
    }

    setSubmitting(true);
    setActionError(null);

    const body: ManagerRejectBody = { reason: rejectReason.trim() };

    try {
      await api.post<ManagerRejectResponse>(`/api/v1/manager/approvals/${id}/reject`, body);
      router.push("/manager/approvals");
    } catch {
      router.push("/manager/approvals");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded bg-slate-800 animate-pulse" />
        <div className="h-36 rounded-2xl bg-slate-800 animate-pulse" />
        <div className="h-72 rounded-2xl bg-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-4">
        <Link href="/manager/approvals" className="inline-flex items-center gap-2 text-slate-300 hover:text-white">
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

  const overDeptBudget = request.amount > request.department.totalAvailableBalance;

  const sortedTimeline = [...request.timeline].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/manager/approvals" className="hover:text-slate-200 transition-colors">
          Duyệt cấp vốn dự án
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
              <span className="inline-flex px-3 py-1.5 rounded-full border text-sm bg-blue-500/15 border-blue-500/30 text-blue-300">
                Cấp vốn DA
              </span>
              <span className={`inline-flex px-3 py-1.5 rounded-full border text-sm ${statusClass(request.status)}`}>
                {statusLabel(request.status)}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(request.amount)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm">
        Phê duyệt sẽ tự động trích {formatCurrency(previewApprovedAmount)} từ Quỹ Phòng ban sang Dự án, không qua Kế toán.
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Người gửi yêu cầu</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <InfoCard label="Họ tên" value={request.requester.fullName} />
              <InfoCard label="Mã nhân viên" value={request.requester.employeeCode} />
              <InfoCard label="Chức danh" value={request.requester.jobTitle ?? "—"} />
            </div>
          </div>

          <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Ngân sách dự án</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoCard
                label="Dự án"
                value={`${request.project.projectCode} • ${request.project.name}`}
              />
              <InfoCard label="Tổng ngân sách DA" value={formatCurrency(request.project.totalBudget)} />
              <InfoCard label="Ngân sách hiện tại" value={formatCurrency(request.project.availableBudget)} />
              <InfoCard label="Yêu cầu thêm" value={formatCurrency(request.amount)} />
              <InfoCard
                label="Sau phê duyệt"
                value={formatCurrency(request.project.availableBudget + previewApprovedAmount)}
              />
            </div>
          </div>

          <div
            className={`rounded-2xl border p-5 ${
              overDeptBudget
                ? "border-rose-500/30 bg-rose-500/10"
                : "border-emerald-500/30 bg-emerald-500/10"
            }`}
          >
            <p className={`text-sm ${overDeptBudget ? "text-rose-300" : "text-emerald-300"}`}>
              Quỹ phòng ban khả dụng: {formatCurrency(request.department.totalAvailableBalance)}
            </p>
            {overDeptBudget && (
              <p className="text-xs text-rose-300 mt-2">Yêu cầu hiện vượt mức quỹ phòng ban đang khả dụng.</p>
            )}
          </div>

          <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-2">
            <h2 className="text-lg font-semibold text-white">Nội dung yêu cầu</h2>
            <p className="text-sm text-slate-300 whitespace-pre-line">{request.description || "Không có mô tả"}</p>
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

          {sortedTimeline.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có lịch sử xử lý.</p>
          ) : (
            <div className="space-y-3">
              {sortedTimeline.map((entry, index) => (
                <div key={entry.id} className="relative pl-8">
                  {index < sortedTimeline.length - 1 && (
                    <span className="absolute left-3 top-7 bottom-[-10px] w-px bg-slate-600" />
                  )}

                  <span className="absolute left-0 top-1 w-6 h-6 rounded-full border border-white/20 bg-slate-900 text-slate-300 flex items-center justify-center">
                    {timelineIcon(entry.action)}
                  </span>

                  <div className="rounded-xl border border-white/10 bg-slate-900 p-3">
                    <p className="text-sm font-medium text-white">{timelineActionLabel(entry.action)}</p>
                    <p className="text-xs text-slate-400 mt-1">{entry.actorName}</p>
                    {entry.comment && <p className="text-xs text-slate-300 mt-1">{entry.comment}</p>}
                    <p className="text-xs text-slate-500 mt-1">{formatDateTime(entry.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm">
          {error}
        </div>
      )}

      {showApproveModal && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowApproveModal(false)}
            aria-label="Đóng modal duyệt"
          />

          <div className="absolute inset-x-0 top-10 mx-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-slate-900 border border-white/10 p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">Xác nhận duyệt yêu cầu</h3>
            <p className="text-sm text-slate-400">{request.requestCode}</p>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Số tiền duyệt</label>
              <input
                type="number"
                min={1}
                max={maxApprovable}
                value={approvedAmount}
                onChange={(event) => setApprovedAmount(event.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <p className="text-xs text-slate-500 mt-1">Tối đa {formatCurrency(maxApprovable)}</p>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Ghi chú</label>
              <textarea
                rows={4}
                value={approveComment}
                onChange={(event) => setApproveComment(event.target.value)}
                placeholder="Nhận xét của bạn (tuỳ chọn)"
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
                disabled={submitting || maxApprovable <= 0}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
              >
                {submitting ? "Đang xử lý..." : "Xác nhận duyệt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
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
              {["Thiếu căn cứ sử dụng vốn", "Mức đề xuất chưa phù hợp", "Cần bổ sung kế hoạch chi tiết", "Quỹ PB chưa đủ"].map(
                (chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() =>
                      setRejectReason((prev) => (prev.trim() ? `${prev.trim()}. ${chip}` : chip))
                    }
                    className="px-3 py-1.5 rounded-full border border-white/15 bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                  >
                    {chip}
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-white mt-1">{value}</p>
    </div>
  );
}
