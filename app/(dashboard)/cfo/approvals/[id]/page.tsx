"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  AdminApprovalDetailResponse,
  AdminApproveBody,
  AdminApproveResponse,
  AdminRejectBody,
  AdminRejectResponse,
  RequestAction,
  RequestStatus,
  RequestType,
} from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

const LIST_PATH = "/cfo/approvals";

// TODO: Replace when Sprint 6 is complete
const MOCK_DETAIL: AdminApprovalDetailResponse = {
  id: 20,
  requestCode: "REQ-2026-0060",
  type: "DEPARTMENT_TOPUP",
  status: RequestStatus.PENDING,
  amount: 200_000_000,
  approvedAmount: null,
  description:
    "Xin cấp thêm quota ngân sách cho phòng IT Q2/2026. Lý do: mở rộng team thêm 3 headcount và nâng cấp hạ tầng cloud phục vụ roadmap sản phẩm.",
  rejectReason: null,
  requester: {
    id: 5,
    fullName: "Trần Thị Bích",
    avatar: null,
    employeeCode: "MGR001",
    jobTitle: "Manager IT",
    email: "manager.it@ifms.vn",
    departmentName: "Phòng Công nghệ thông tin",
  },
  department: {
    id: 1,
    name: "Phòng Công nghệ thông tin",
    code: "IT",
    totalProjectQuota: 800_000_000,
    totalAvailableBalance: 80_000_000,
  },
  systemFund: {
    totalBalance: 1_248_500_000,
  },
  timeline: [],
  createdAt: "2026-04-02T09:00:00",
  updatedAt: "2026-04-02T09:00:00",
};

const REJECT_REASON_SUGGESTIONS = [
  "Ngân sách đề xuất chưa phù hợp với kế hoạch quý",
  "Cần bổ sung căn cứ sử dụng ngân sách",
  "Đề xuất vượt khả năng quỹ hệ thống hiện tại",
  "Cần điều chỉnh số tiền đề nghị cấp quota",
];



function statusClass(status: RequestStatus): string {
  switch (status) {
    case RequestStatus.PENDING:
      return "bg-amber-100 border-amber-200 text-amber-700";
    case RequestStatus.APPROVED_BY_CFO:
      return "bg-blue-50 border-blue-200 text-blue-700";
    case RequestStatus.PAID:
      return "bg-emerald-100 border-emerald-200 text-emerald-700";
    case RequestStatus.REJECTED:
      return "bg-rose-100 border-rose-200 text-rose-700";
    default:
      return "bg-slate-100 border-slate-200 text-slate-600";
  }
}

function statusLabel(status: RequestStatus): string {
  switch (status) {
    case RequestStatus.PENDING:
      return "Chờ duyệt";
    case RequestStatus.APPROVED_BY_CFO:
      return "Đã duyệt CFO";
    case RequestStatus.PAID:
      return "Đã cấp quota";
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
      return "Hạch toán";
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

export default function CfoApprovalDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [request, setRequest] = useState<AdminApprovalDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [approvedAmount, setApprovedAmount] = useState("");
  const [approveComment, setApproveComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<AdminApprovalDetailResponse>(
          `/api/v1/cfo/approvals/${id}`,
        );

        if (cancelled) return;

        setRequest(res.data);
        setUsingMockData(false);
      } catch (err) {
        if (cancelled) return;

        const safeId = Number(id);
        setRequest({
          ...MOCK_DETAIL,
          id: Number.isFinite(safeId) && safeId > 0 ? safeId : MOCK_DETAIL.id,
          requestCode: `REQ-2026-${String(id).padStart(4, "0")}`,
        });
        setUsingMockData(true);

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

  const systemFundBalance = request?.systemFund.totalBalance ?? 0;
  const deptCurrent = request?.department.totalAvailableBalance ?? 0;

  const maxApprovable = useMemo(() => {
    if (!request) return 0;
    return Math.max(0, Math.min(request.amount, systemFundBalance));
  }, [request, systemFundBalance]);

  const previewApprovedAmount = useMemo(() => {
    if (!request) return 0;

    const fromInput = Number(approvedAmount);
    if (!Number.isFinite(fromInput) || fromInput <= 0) {
      return Math.min(request.amount, maxApprovable || request.amount);
    }

    return Math.min(fromInput, request.amount);
  }, [approvedAmount, maxApprovable, request]);

  const systemFundAfter = Math.max(0, systemFundBalance - previewApprovedAmount);
  const deptAfter = deptCurrent + previewApprovedAmount;
  const overSystemFund = request ? request.amount > systemFundBalance : false;
  const canTakeAction = request?.status === RequestStatus.PENDING;

  const sortedTimeline = useMemo(() => {
    if (!request) return [];
    return [...request.timeline].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [request]);

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

    const numericApprovedAmount = Number(approvedAmount);
    if (!Number.isFinite(numericApprovedAmount) || numericApprovedAmount <= 0) {
      setActionError("Số tiền duyệt phải lớn hơn 0.");
      return;
    }

    if (numericApprovedAmount > request.amount) {
      setActionError("Số tiền duyệt không được vượt số tiền yêu cầu.");
      return;
    }

    if (numericApprovedAmount > systemFundBalance) {
      setActionError("Số tiền duyệt vượt quỹ hệ thống khả dụng.");
      return;
    }

    setSubmitting(true);
    setActionError(null);

    const body: AdminApproveBody = {
      approvedAmount: numericApprovedAmount,
      comment: approveComment.trim() || undefined,
    };

    try {
      if (!usingMockData) {
        await api.post<AdminApproveResponse>(`/api/v1/cfo/approvals/${id}/approve`, body);
      }
      router.push(LIST_PATH);
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
      setActionError("Lý do từ chối cần ít nhất 10 ký tự.");
      return;
    }

    setSubmitting(true);
    setActionError(null);

    const body: AdminRejectBody = { reason: rejectReason.trim() };

    try {
      if (!usingMockData) {
        await api.post<AdminRejectResponse>(`/api/v1/cfo/approvals/${id}/reject`, body);
      }
      router.push(LIST_PATH);
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
        <div className="h-8 w-64 rounded bg-white animate-pulse" />
        <div className="h-36 rounded-2xl bg-white animate-pulse" />
        <div className="h-72 rounded-2xl bg-white animate-pulse" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-4">
        <Link href={LIST_PATH} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại danh sách
        </Link>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center text-slate-500">
          Không tìm thấy yêu cầu.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href={LIST_PATH} className="hover:text-slate-900 transition-colors">
          Duyệt cấp quota ngân sách
        </Link>
        <span>/</span>
        <span className="text-slate-600 font-mono">{request.requestCode}</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500">Mã yêu cầu</p>
            <h1 className="text-2xl font-bold text-slate-900 font-mono mt-1">
              {request.requestCode}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tạo lúc {formatDateTime(request.createdAt)}
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex px-3 py-1.5 rounded-full border text-sm bg-blue-50 border-blue-200 text-blue-700">
                Cấp quota
              </span>
              <span className={`inline-flex px-3 py-1.5 rounded-full border text-sm ${statusClass(request.status)}`}>
                {statusLabel(request.status)}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(request.amount)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Tác động Flow 3</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InfoCard label="Quỹ hệ thống hiện tại" value={formatCurrency(systemFundBalance)} />
          <InfoCard label="Sau phê duyệt" value={formatCurrency(systemFundAfter)} tone="text-amber-700" />
          <InfoCard label="Quỹ phòng ban sau phê duyệt" value={formatCurrency(deptAfter)} tone="text-emerald-700" />
        </div>

        {overSystemFund && (
          <div className="px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">
            Cảnh báo: số tiền yêu cầu đang vượt Quỹ hệ thống khả dụng.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Thông tin người gửi yêu cầu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoCard label="Họ tên" value={request.requester.fullName} />
              <InfoCard label="Mã nhân viên" value={request.requester.employeeCode} />
              <InfoCard label="Chức danh" value={request.requester.jobTitle ?? "-"} />
              <InfoCard label="Email" value={request.requester.email ?? "-"} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Thông tin phòng ban</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoCard label="Phòng ban" value={request.department.name} />
              <InfoCard label="Mã phòng" value={request.department.code} />
              <InfoCard label="Quota dự án hiện tại" value={formatCurrency(request.department.totalProjectQuota)} />
              <InfoCard label="Ngân sách khả dụng" value={formatCurrency(request.department.totalAvailableBalance)} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Nội dung yêu cầu</h2>
            <p className="text-sm text-slate-600 whitespace-pre-line">
              {request.description || "Không có mô tả."}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Tiến trình Flow 3</h2>

            {sortedTimeline.length > 0 ? (
              <div className="space-y-3">
                {sortedTimeline.map((entry, index) => (
                  <div key={entry.id} className="relative pl-8">
                    {index < sortedTimeline.length - 1 && (
                      <span className="absolute left-3 top-7 -bottom-2.5 w-px bg-slate-200" />
                    )}
                    <span className="absolute left-0 top-1 w-6 h-6 rounded-full border border-slate-300 bg-white text-slate-600 flex items-center justify-center">
                      {timelineIcon(entry.action)}
                    </span>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-sm font-medium text-slate-900">{timelineActionLabel(entry.action)}</p>
                      <p className="text-xs text-slate-500 mt-1">{entry.actorName}</p>
                      {entry.comment && (
                        <p className="text-xs text-slate-600 mt-1">{entry.comment}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">{formatDateTime(entry.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-sm font-medium text-slate-900">Manager gửi yêu cầu</p>
                  <p className="text-xs text-slate-500 mt-1">{request.requester.fullName}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatDateTime(request.createdAt)}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-medium text-amber-700">Đang chờ CFO phê duyệt</p>
                  <p className="text-xs text-amber-200/80 mt-1">
                    Sau khi duyệt, hệ thống sẽ tự động chuyển quỹ và cập nhật trạng thái.
                  </p>
                </div>
              </div>
            )}
          </div>

          {canTakeAction && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <h2 className="text-lg font-semibold text-slate-900">Thao tác phê duyệt</h2>
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

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Tóm tắt quyết định</h2>
          <InfoCard label="Loại yêu cầu" value={RequestType.DEPARTMENT_TOPUP} />
          <InfoCard label="Số tiền yêu cầu" value={formatCurrency(request.amount)} />
          <InfoCard label="Số tiền dự kiến duyệt" value={formatCurrency(previewApprovedAmount)} tone="text-blue-700" />
          <InfoCard label="Trạng thái hiện tại" value={statusLabel(request.status)} />
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm">
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
          <div className="absolute inset-x-0 top-10 mx-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Xác nhận duyệt yêu cầu</h3>
            <p className="text-sm text-slate-500">{request.requestCode}</p>

            <div>
              <label className="block text-sm text-slate-600 mb-2">Số tiền duyệt</label>
              <input
                type="number"
                min={1}
                max={request.amount}
                value={approvedAmount}
                onChange={(event) => setApprovedAmount(event.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <p className="text-xs text-slate-500 mt-1">
                Tối đa theo yêu cầu: {formatCurrency(request.amount)} • Quỹ hệ thống: {formatCurrency(systemFundBalance)}
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-2">Ghi chú</label>
              <textarea
                rows={4}
                value={approveComment}
                onChange={(event) => setApproveComment(event.target.value)}
                placeholder="Nhận xét của CFO (tuỳ chọn)"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            {actionError && (
              <div className="px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
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
          <div className="absolute inset-x-0 top-10 mx-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Từ chối yêu cầu — {request.requestCode}</h3>

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
              {REJECT_REASON_SUGGESTIONS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() =>
                    setRejectReason((prev) =>
                      prev.trim() ? `${prev.trim()}. ${chip}` : chip,
                    )
                  }
                  className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-100"
                >
                  {chip}
                </button>
              ))}
            </div>

            {actionError && (
              <div className="px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm">
                {actionError}
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
  tone = "text-slate-900",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm mt-1 ${tone}`}>{value}</p>
    </div>
  );
}
