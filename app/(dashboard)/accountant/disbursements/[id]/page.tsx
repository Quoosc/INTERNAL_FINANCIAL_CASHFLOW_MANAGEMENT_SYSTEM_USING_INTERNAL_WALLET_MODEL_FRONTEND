"use client";

import Link from "next/link";
import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  DisburseBody,
  DisburseResponse,
  DisbursementDetailResponse,
  DisbursementRejectBody,
  RequestAction,
  RequestStatus,
  RequestType,
} from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

// DisburseResponse v3.0: id, requestCode, status, transactionCode, amount, disbursedAt
type DisburseSuccessView = DisburseResponse;

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

function getTypeClass(type: RequestType): string {
  switch (type) {
    case RequestType.ADVANCE:
      return "bg-violet-50 border-violet-200 text-violet-700";
    case RequestType.EXPENSE:
      return "bg-sky-500/15 border-sky-500/30 text-sky-300";
    case RequestType.REIMBURSE:
      return "bg-amber-50 border-amber-200 text-amber-700";
    default:
      return "bg-slate-500/15 border-slate-500/30 text-slate-600";
  }
}

function getAttachmentIcon(fileType: string): React.ReactNode {
  const lower = fileType.toLowerCase();

  if (lower.includes("pdf")) {
    return (
      <svg className="w-5 h-5 text-rose-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 3h7l5 5v13H7V3zm7 0v5h5" />
      </svg>
    );
  }

  if (lower.includes("image")) {
    return (
      <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11l3 3 2-2 4 4" />
      </svg>
    );
  }

  return (
    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 3h10l4 4v14H7V3zm10 0v4h4" />
    </svg>
  );
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function AccountantDisbursementDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [detail, setDetail] = useState<DisbursementDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [checklist, setChecklist] = useState({
    identityVerified: false,
    amountVerified: false,
    attachmentsReviewed: false,
    budgetAvailable: false,
    approvalChainComplete: false,
  });

  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<DisburseSuccessView | null>(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<DisbursementDetailResponse>(`/api/v1/accountant/disbursements/${id}`);

        if (cancelled) return;
        setDetail(res.data);
      } catch (err) {
        if (cancelled) return;

        setDetail(null);

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải dữ liệu giải ngân.");
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

  const allChecked = useMemo(() => Object.values(checklist).every(Boolean), [checklist]);

  const tlApprovalEntry = useMemo(() => {
    if (!detail) return null;

    return detail.timeline.find(
      (entry) =>
        entry.action === RequestAction.APPROVE &&
        entry.statusAfterAction === RequestStatus.PENDING_ACCOUNTANT_EXECUTION
    );
  }, [detail]);

  const budgetStillAvailable = useMemo(() => {
    if (!detail) return false;

    const remaining = detail.phase.budgetLimit - detail.phase.currentSpent;
    return remaining >= detail.approvedAmount;
  }, [detail]);

  const handleChecklistChange = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePinChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 5);
    setPin(digitsOnly);
    setPinError(null);
  };

  async function handleDisburse() {
    if (!detail) return;
    if (!allChecked) {
      setPinError("Vui lòng hoàn tất checklist trước khi giải ngân.");
      return;
    }

    if (pin.length < 5) {
      setPinError("Vui lòng nhập đủ 5 chữ số PIN.");
      return;
    }

    setSubmitting(true);
    setPinError(null);

    try {
      const body: DisburseBody = { pin };
      // const res = await api.post<DisburseResponse>(
      //   `/api/v1/accountant/disbursements/${id}/disburse`,
      //   body
      // );
      // TODO: Replace when Sprint 6 is complete - simulate success
      // setSuccessData(res.data);
      void body;
      setSuccessData({
        id: detail.id,
        requestCode: detail.requestCode,
        status: "PAID",
        transactionCode: `TXN-2026-${String(detail.id).padStart(4, "0")}A`,
        amount: detail.approvedAmount,
        disbursedAt: new Date().toISOString(),
      });
      setShowSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400 || err.status === 401) {
          setPinError(err.apiMessage);
        } else {
          setPinError("Đã có lỗi xảy ra. Vui lòng thử lại.");
        }
      } else {
        setPinError("Đã có lỗi xảy ra. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (rejectReason.trim().length < 10) {
      setRejectError("Lý do từ chối phải có ít nhất 10 ký tự.");
      return;
    }

    setRejectSubmitting(true);
    setRejectError(null);

    try {
      const body: DisbursementRejectBody = {
        reason: rejectReason.trim(),
      };
      // await api.post<DisbursementRejectResponse>(
      //   `/api/v1/accountant/disbursements/${id}/reject`,
      //   body
      // );
      // TODO: Replace when Sprint 6 is complete - simulate reject
      void (body as DisbursementRejectBody);
      router.push("/accountant/disbursements");
    } catch (err) {
      if (err instanceof ApiError) {
        setRejectError(err.apiMessage);
      } else {
        setRejectError("Không thể từ chối giải ngân, vui lòng thử lại.");
      }
    } finally {
      setRejectSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-60 rounded bg-white animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-120 rounded-2xl bg-white animate-pulse" />
          <div className="h-120 rounded-2xl bg-white animate-pulse" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-4">
        <Link href="/accountant/disbursements" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại danh sách
        </Link>
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
          Không tìm thấy yêu cầu giải ngân.
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/accountant/disbursements" className="hover:text-slate-700 transition-colors">
          Giải ngân
        </Link>
        <span>/</span>
        <span className="text-slate-600 font-mono">{detail.requestCode}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">Mã yêu cầu</p>
                <h1 className="text-2xl font-bold text-slate-900 font-mono mt-1">{detail.requestCode}</h1>
                <p className="text-sm text-slate-500 mt-1">Tạo lúc {formatDateTime(detail.createdAt)}</p>
              </div>
              <div className="flex flex-col items-start lg:items-end gap-2">
                <span className={`inline-flex px-3 py-1.5 rounded-full border text-sm ${getTypeClass(detail.type)}`}>
                  {getTypeLabel(detail.type)}
                </span>
                <p className="text-2xl font-bold text-amber-700">{formatCurrency(detail.approvedAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Approval chain</h2>

            <div className="space-y-3">
              <TimelineStep
                title="Bước 1: Nhân viên tạo yêu cầu"
                subtitle={detail.requester.fullName}
                time={formatDateTime(detail.createdAt)}
                completed
              />

              <TimelineStep
                title="Bước 2: Team Leader duyệt"
                subtitle={tlApprovalEntry?.actorName ?? "Team Leader"}
                time={tlApprovalEntry ? formatDateTime(tlApprovalEntry.createdAt) : "Chưa có dữ liệu"}
                note={tlApprovalEntry?.comment ?? undefined}
                completed={Boolean(tlApprovalEntry)}
              />

              <TimelineStep
                title="Bước 3: Accountant xử lý giải ngân"
                subtitle="Đang chờ xác minh"
                time="Hiện tại"
                current
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Thông tin người nhận</h2>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white border border-slate-200 text-slate-100 flex items-center justify-center text-sm font-semibold">
                {getInitials(detail.requester.fullName)}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{detail.requester.fullName}</p>
                <p className="text-xs text-slate-500">{detail.requester.employeeCode} • {detail.requester.departmentName}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoCard label="Ngân hàng" value={detail.requester.bankName} />
              <InfoCard label="Số tài khoản" value={detail.requester.bankAccountNum} mono />
              <InfoCard label="Chủ tài khoản" value={detail.requester.bankAccountOwner} />
              <InfoCard label="Chức danh" value={detail.requester.jobTitle ?? "—"} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Thông tin yêu cầu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoCard label="Dự án" value={`${detail.project.projectCode} • ${detail.project.name}`} />
              <InfoCard label="Phase" value={`${detail.phase.phaseCode} • ${detail.phase.name}`} />
              <InfoCard
                label="Ngân sách phase"
                value={`${formatCurrency(detail.phase.currentSpent)} / ${formatCurrency(detail.phase.budgetLimit)}`}
              />
              <InfoCard
                label="Số tiền giải ngân"
                value={formatCurrency(detail.approvedAmount)}
                tone="text-amber-700"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Mô tả</p>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">{detail.description ?? "Không có mô tả"}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Compliance checklist</h2>

            <ChecklistItem
              checked={checklist.identityVerified}
              onToggle={() => handleChecklistChange("identityVerified")}
              label="Đã xác nhận danh tính người nhận"
            />

            <ChecklistItem
              checked={checklist.amountVerified}
              onToggle={() => handleChecklistChange("amountVerified")}
              label={`Số tiền khớp chứng từ (${formatCurrency(detail.approvedAmount)})`}
            />

            <ChecklistItem
              checked={checklist.attachmentsReviewed}
              onToggle={() => handleChecklistChange("attachmentsReviewed")}
              label="Đã xem xét tất cả chứng từ đính kèm"
            />

            <ChecklistItem
              checked={checklist.budgetAvailable}
              onToggle={() => handleChecklistChange("budgetAvailable")}
              label="Ngân sách phase còn đủ để giải ngân"
              hint={budgetStillAvailable ? "Ngân sách khả dụng" : "Ngân sách đang sát ngưỡng"}
            />

            <ChecklistItem
              checked={checklist.approvalChainComplete}
              onToggle={() => handleChecklistChange("approvalChainComplete")}
              label="Chuỗi phê duyệt đầy đủ và hợp lệ"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Receipt Viewer</h2>

            {detail.attachments.length === 0 ? (
              <p className="text-sm text-slate-500">Không có chứng từ đính kèm.</p>
            ) : (
              <div className="space-y-3">
                {detail.attachments.map((file) => (
                  <div key={file.fileId} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5">{getAttachmentIcon(file.fileType)}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-900 truncate">{file.fileName}</p>
                        <p className="text-xs text-slate-500 mt-1">{formatFileSize(file.size)}</p>
                      </div>
                    </div>

                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-700"
                    >
                      Xem
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M14 3h7m0 0v7m0-7L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Xác nhận giải ngân</h2>
            <p className="text-sm text-slate-500">Nhập mã PIN của bạn để xác nhận giải ngân.</p>

            <div className={`rounded-xl border p-4 ${allChecked ? "border-emerald-200 bg-emerald-500/5" : "border-slate-200 bg-white"}`}>
              <label className="block text-sm text-slate-600 mb-2">Mã PIN (5 chữ số)</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={5}
                value={pin}
                onChange={(event) => handlePinChange(event.target.value)}
                disabled={!allChecked || submitting}
                placeholder="•••••"
                className="w-full px-4 py-3 rounded-xl bg-blue-50 border border-slate-200 text-slate-900 tracking-[0.35em] text-center text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50"
              />
              {!allChecked && (
                <p className="text-xs text-amber-700 mt-2">Cần hoàn tất checklist trước khi nhập PIN.</p>
              )}
              {pinError && <p className="text-xs text-rose-700 mt-2">{pinError}</p>}
            </div>

            <button
              type="button"
              onClick={handleDisburse}
              disabled={pin.length < 5 || submitting || !allChecked}
              className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {submitting ? "Đang giải ngân..." : `Giải ngân ${formatCurrency(detail.approvedAmount)}`}
            </button>

            {detail.status === "PENDING_ACCOUNTANT_EXECUTION" && (
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(true);
                  setRejectReason("");
                  setRejectError(null);
                }}
                className="w-full px-4 py-3 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-sm font-semibold transition-colors"
              >
                Từ chối giải ngân
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm">
          {error}
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

          <div className="absolute inset-x-0 top-10 mx-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Từ chối giải ngân - {detail.requestCode}</h3>

            <div>
              <label className="block text-sm text-slate-600 mb-2">Lý do từ chối</label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {["Thiếu chứng từ", "Số tiền không hợp lý", "Không đúng danh mục", "Vượt ngân sách"].map(
                (reasonChip) => (
                  <button
                    key={reasonChip}
                    type="button"
                    onClick={() =>
                      setRejectReason((prev) =>
                        prev.trim() ? `${prev.trim()}. ${reasonChip}` : reasonChip
                      )
                    }
                    className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs text-slate-600 hover:bg-blue-100"
                  >
                    {reasonChip}
                  </button>
                )
              )}
            </div>

            {rejectError && (
              <div className="px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm">
                {rejectError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleReject()}
                disabled={rejectReason.trim().length < 10 || rejectSubmitting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
              >
                {rejectSubmitting ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && successData && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" />
          <div className="absolute inset-x-0 top-16 mx-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-emerald-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <h3 className="text-xl font-bold text-slate-900">Giải ngân thành công</h3>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 bg-blue-50 p-4">
              <p className="text-sm text-slate-600">
                Mã giao dịch: <span className="font-mono text-slate-900">{successData.transactionCode}</span>
              </p>
              <p className="text-sm text-slate-600">
                Số tiền: <span className="font-semibold text-emerald-700">{formatCurrency(successData.amount)}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/accountant/disbursements")}
              className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineStep({
  title,
  subtitle,
  time,
  note,
  completed,
  current,
}: {
  title: string;
  subtitle: string;
  time: string;
  note?: string;
  completed?: boolean;
  current?: boolean;
}) {
  return (
    <div className="relative pl-8">
      <span
        className={`absolute left-0 top-1 w-5 h-5 rounded-full border flex items-center justify-center ${
          current
            ? "border-amber-300 bg-amber-100 text-amber-700 animate-pulse"
            : completed
              ? "border-emerald-300 bg-emerald-100 text-emerald-700"
              : "border-slate-500/50 bg-slate-500/20 text-slate-600"
        }`}
      >
        {completed ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
        )}
      </span>
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        {note && <p className="text-xs text-slate-600 mt-1">{note}</p>}
        <p className="text-xs text-slate-500 mt-1">{time}</p>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  tone,
  mono,
}: {
  label: string;
  value: string;
  tone?: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm mt-1 ${tone ?? "text-slate-900"} ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function ChecklistItem({
  checked,
  onToggle,
  label,
  hint,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 cursor-pointer hover:border-slate-200 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-0.5 h-4 w-4 rounded border-slate-200 bg-white text-emerald-500 focus:ring-emerald-500/50"
      />
      <span className="text-sm text-slate-700">
        {label}
        {hint && <span className="block text-xs text-slate-500 mt-1">{hint}</span>}
      </span>
    </label>
  );
}

