"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  RequestAction,
  RequestDetailResponse,
  RequestStatus,
  RequestType,
  UpdateRequestBody,
} from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ParsedDescription {
  title: string;
  expenseDate: string;
  body: string;
}

interface TimelineRow {
  title: string;
  subtitle: string;
  time: string;
  tone: "done" | "current" | "pending" | "rejected" | "cancelled";
}

// TODO: Replace with real API call when Sprint 5 is complete
const MOCK_REQUEST: RequestDetailResponse = {
  id: 501,
  requestCode: "REQ-EMP-0426-001",
  type: RequestType.ADVANCE,
  status: RequestStatus.PENDING_ACCOUNTANT_EXECUTION,
  amount: 1_500_000,
  approvedAmount: 1_300_000,
  description:
    "Tiêu đề: Tạm ứng công tác khách hàng\nNgày chi tiêu: 2026-04-02\nChi phí đi lại và lưu trú cho buổi workshop.",
  rejectReason: null,
  projectId: 1,
  projectName: "Hệ thống quản lý nội bộ",
  phaseId: 12,
  phaseName: "Phase 2 - Development",
  categoryId: 103,
  categoryName: "Di chuyển",
  createdAt: "2026-04-02T09:15:00",
  updatedAt: "2026-04-02T16:40:00",
  projectCode: "PRJ-IT-001",
  phaseCode: "PH-002",
  requesterId: 17,
  requesterName: "Nguyễn Văn A",
  attachments: [
    {
      fileId: 901,
      fileName: "ve_may_bay.pdf",
      url: "https://example.com/files/ve_may_bay.pdf",
      fileType: "application/pdf",
      size: 254000,
    },
    {
      fileId: 902,
      fileName: "hoa_don_khach_san.jpg",
      url: "https://example.com/files/hoa_don_khach_san.jpg",
      fileType: "image/jpeg",
      size: 368000,
    },
  ],
  timeline: [
    {
      id: 1,
      action: RequestAction.APPROVE,
      statusAfterAction: RequestStatus.PENDING_ACCOUNTANT_EXECUTION,
      actorId: 23,
      actorName: "Trần Thị B - Team Leader",
      comment: "Duyệt với mức phù hợp ngân sách.",
      createdAt: "2026-04-02T16:40:00",
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

function formatDate(isoDate: string): string {
  if (!isoDate) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${isoDate}T00:00:00`));
}

function getTypeClass(type: RequestType): string {
  switch (type) {
    case RequestType.ADVANCE:
      return "bg-violet-100 border-violet-200 text-violet-700";
    case RequestType.EXPENSE:
      return "bg-cyan-100 border-cyan-200 text-cyan-700";
    case RequestType.REIMBURSE:
      return "bg-teal-100 border-teal-200 text-teal-700";
    case RequestType.PROJECT_TOPUP:
      return "bg-amber-100 border-amber-200 text-amber-700";
    case RequestType.DEPARTMENT_TOPUP:
      return "bg-rose-100 border-rose-200 text-rose-700";
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
    case RequestType.PROJECT_TOPUP:
      return "Nạp quỹ DA";
    case RequestType.DEPARTMENT_TOPUP:
      return "Nạp quota phòng ban";
    default:
      return type;
  }
}

function getStatusClass(status: RequestStatus): string {
  switch (status) {
    case RequestStatus.PENDING:
      return "bg-amber-100 border-amber-200 text-amber-700";
    case RequestStatus.APPROVED_BY_TEAM_LEADER:
      return "bg-green-100 border-green-200 text-green-700";
    case RequestStatus.PENDING_ACCOUNTANT_EXECUTION:
      return "bg-blue-50 border-blue-200 text-blue-700";
    case RequestStatus.APPROVED_BY_MANAGER:
    case RequestStatus.APPROVED_BY_CFO:
      return "bg-green-100 border-green-200 text-green-700";
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
      return "Team Leader đã duyệt";
    case RequestStatus.PENDING_ACCOUNTANT_EXECUTION:
      return "Chờ Kế toán giải ngân";
    case RequestStatus.APPROVED_BY_MANAGER:
      return "Manager đã duyệt";
    case RequestStatus.APPROVED_BY_CFO:
      return "CFO đã duyệt";
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

function parseDescription(description: string | null): ParsedDescription {
  if (!description) {
    return { title: "", expenseDate: "", body: "" };
  }

  const lines = description.split("\n").map((line) => line.trim());
  const titleLine = lines.find((line) => line.startsWith("Tiêu đề:"));
  const expenseDateLine = lines.find((line) => line.startsWith("Ngày chi tiêu:"));

  const bodyLines = lines.filter(
    (line) => !line.startsWith("Tiêu đề:") && !line.startsWith("Ngày chi tiêu:")
  );

  return {
    title: titleLine ? titleLine.replace("Tiêu đề:", "").trim() : "",
    expenseDate: expenseDateLine ? expenseDateLine.replace("Ngày chi tiêu:", "").trim() : "",
    body: bodyLines.join("\n").trim(),
  };
}

function composeDescription(input: ParsedDescription): string {
  const rows = [
    `Tiêu đề: ${input.title.trim()}`,
    `Ngày chi tiêu: ${input.expenseDate.trim()}`,
    input.body.trim(),
  ].filter((line) => Boolean(line && line.trim()));

  return rows.join("\n");
}

function buildTimelineRows(request: RequestDetailResponse): TimelineRow[] {
  const rows: TimelineRow[] = [
    {
      title: "Yêu cầu đã được tạo",
      subtitle: `Người tạo: ${request.requesterName}`,
      time: formatDateTime(request.createdAt),
      tone: "done",
    },
  ];

  const sortedTimeline = [...request.timeline].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sortedTimeline.forEach((entry) => {
    rows.push({
      title:
        entry.action === RequestAction.APPROVE
          ? "Đã duyệt"
          : entry.action === RequestAction.REJECT
            ? "Đã từ chối"
            : entry.action === RequestAction.PAYOUT
              ? "Đã chi tiền"
              : entry.action === RequestAction.CANCEL
                ? "Đã hủy yêu cầu"
                : entry.action,
      subtitle: `${entry.actorName}${entry.comment ? ` • ${entry.comment}` : ""}`,
      time: formatDateTime(entry.createdAt),
      tone:
        entry.action === RequestAction.REJECT
          ? "rejected"
          : entry.action === RequestAction.CANCEL
            ? "cancelled"
            : "done",
    });
  });

  switch (request.status) {
    case RequestStatus.PENDING:
      rows.push({
        title: "Đang chờ Team Leader duyệt",
        subtitle: "Chưa có quyết định phê duyệt",
        time: "Hiện tại",
        tone: "current",
      });
      break;
    case RequestStatus.APPROVED_BY_TEAM_LEADER:
      rows.push({
        title: "Team Leader đã duyệt",
        subtitle: "Đang chờ Accountant xử lý giải ngân",
        time: "Hiện tại",
        tone: "current",
      });
      break;
    case RequestStatus.PENDING_ACCOUNTANT_EXECUTION:
      rows.push({
        title: "Đang chờ Kế toán giải ngân",
        subtitle: "Đã được Team Leader duyệt",
        time: "Hiện tại",
        tone: "current",
      });
      break;
    case RequestStatus.APPROVED_BY_MANAGER:
      rows.push({
        title: "Manager đã duyệt — đang xử lý",
        subtitle: "Hệ thống sẽ tự động cấp vốn",
        time: "Hiện tại",
        tone: "current",
      });
      break;
    case RequestStatus.APPROVED_BY_CFO:
      rows.push({
        title: "CFO đã duyệt — đang xử lý",
        subtitle: "Hệ thống sẽ tự động cấp quota",
        time: "Hiện tại",
        tone: "current",
      });
      break;
    case RequestStatus.PAID:
      rows.push({
        title: "Yêu cầu đã xử lý đầy đủ",
        subtitle: "Khoản tiền đã được chi",
        time: "Hiện tại",
        tone: "done",
      });
      break;
    case RequestStatus.REJECTED:
      rows.push({
        title: "Yêu cầu kết thúc với trạng thái từ chối",
        subtitle: request.rejectReason ? `Lý do: ${request.rejectReason}` : "Không có lý do chi tiết",
        time: "Hiện tại",
        tone: "rejected",
      });
      break;
    case RequestStatus.CANCELLED:
      rows.push({
        title: "Yêu cầu đã bị hủy",
        subtitle: "Không tiếp tục xử lý",
        time: "Hiện tại",
        tone: "cancelled",
      });
      break;
    default:
      rows.push({
        title: "Đang xử lý",
        subtitle: "Vui lòng theo dõi cập nhật mới",
        time: "Hiện tại",
        tone: "pending",
      });
  }

  return rows;
}

function getTimelineToneClass(tone: TimelineRow["tone"]): string {
  switch (tone) {
    case "done":
      return "bg-emerald-500 border-emerald-400";
    case "current":
      return "bg-blue-500 border-blue-400";
    case "pending":
      return "bg-amber-500 border-amber-400";
    case "rejected":
      return "bg-rose-500 border-rose-400";
    case "cancelled":
      return "bg-slate-500 border-slate-400";
    default:
      return "bg-slate-500 border-slate-400";
  }
}

function getTimelineCardClass(tone: TimelineRow["tone"]): string {
  switch (tone) {
    case "done":
      return "border-emerald-200 bg-emerald-500/5";
    case "current":
      return "border-blue-200 bg-blue-500/5";
    case "pending":
      return "border-amber-200 bg-amber-500/5";
    case "rejected":
      return "border-rose-200 bg-rose-500/5";
    case "cancelled":
      return "border-slate-500/20 bg-slate-500/5";
    default:
      return "border-slate-200 bg-white";
  }
}

function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RequestDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [request, setRequest] = useState<RequestDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [editAmount, setEditAmount] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editExpenseDate, setEditExpenseDate] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        // const res = await api.get<RequestDetailResponse>(`/api/v1/requests/${id}`)
        const res = await api.get<RequestDetailResponse>(`/api/v1/requests/${id}`);

        if (cancelled) return;
        setRequest(res.data);
      } catch (err) {
        if (cancelled) return;

        setRequest({
          ...MOCK_REQUEST,
          id: Number(id),
          requestCode: `REQ-EMP-0426-${String(id).padStart(3, "0")}`,
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

  const parsed = useMemo(() => parseDescription(request?.description ?? ""), [request]);
  const timelineRows = useMemo(() => (request ? buildTimelineRows(request) : []), [request]);

  const canEditOrCancel = request?.status === RequestStatus.PENDING;

  const openEdit = () => {
    if (!request) return;

    const parsedLocal = parseDescription(request.description);
    setEditAmount(String(request.amount));
    setEditTitle(parsedLocal.title);
    setEditExpenseDate(parsedLocal.expenseDate);
    setEditDescription(parsedLocal.body);
    setEditing(true);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!request) return;

    setError(null);

    const amountNumber = Number(editAmount.replace(/\D/g, ""));
    if (!amountNumber || amountNumber <= 0) {
      setError("Số tiền cập nhật không hợp lệ.");
      return;
    }

    if (!editTitle.trim()) {
      setError("Vui lòng nhập tiêu đề.");
      return;
    }

    if (!editDescription.trim()) {
      setError("Vui lòng nhập mô tả.");
      return;
    }

    if (!editExpenseDate.trim()) {
      setError("Vui lòng chọn ngày chi tiêu.");
      return;
    }

    const mergedDescription = composeDescription({
      title: editTitle,
      expenseDate: editExpenseDate,
      body: editDescription,
    });

    const updateBody: UpdateRequestBody = {
      amount: amountNumber,
      description: mergedDescription,
      attachmentFileIds: request.attachments.map((file) => file.fileId),
    };

    setActionLoading(true);

    try {
      // const res = await api.put<RequestDetailResponse>(`/api/v1/requests/${id}`, updateBody)
      const res = await api.put<RequestDetailResponse>(`/api/v1/requests/${id}`, updateBody);
      setRequest(res.data);
      setEditing(false);
    } catch (err) {
      setRequest((prev) =>
        prev
          ? {
              ...prev,
              amount: amountNumber,
              description: mergedDescription,
              updatedAt: new Date().toISOString(),
            }
          : prev
      );
      setEditing(false);

      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Không thể cập nhật qua API, đã cập nhật dữ liệu mẫu trên giao diện.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!request) return;

    const confirmed = window.confirm("Bạn chắc chắn muốn hủy yêu cầu này?");
    if (!confirmed) return;

    setActionLoading(true);
    setError(null);

    try {
      // await api.delete(`/api/v1/requests/${id}`)
      await api.delete(`/api/v1/requests/${id}`);
      router.push("/requests");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Không thể hủy yêu cầu. Vui lòng thử lại.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-40 rounded bg-white animate-pulse" />
        <div className="h-32 rounded-2xl bg-white animate-pulse" />
        <div className="h-64 rounded-2xl bg-white animate-pulse" />
        <div className="h-64 rounded-2xl bg-white animate-pulse" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => router.push("/requests")}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại danh sách
        </button>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-center text-slate-500">
          Không tìm thấy yêu cầu.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.push("/requests")}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại danh sách
      </button>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{request.requestCode}</h1>
          <p className="text-slate-500 text-sm mt-1">Tạo lúc: {formatDateTime(request.createdAt)}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex px-3 py-1.5 rounded-full border text-sm ${getTypeClass(request.type)}`}>
            {getTypeLabel(request.type)}
          </span>
          <span className={`inline-flex px-3 py-1.5 rounded-full border text-sm ${getStatusClass(request.status)}`}>
            {getStatusLabel(request.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">Chi tiết yêu cầu</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailCell label="Số tiền" value={formatCurrency(request.amount)} />
              <DetailCell label="Tiêu đề" value={parsed.title || "—"} />
              <DetailCell label="Dự án" value={`${request.projectCode ?? ""} ${request.projectName ?? ""}`.trim() || "—"} />
              <DetailCell label="Phase" value={`${request.phaseCode ?? ""} ${request.phaseName ?? ""}`.trim() || "—"} />
              <DetailCell label="Category" value={request.categoryName ?? "—"} />
              <DetailCell label="Ngày chi tiêu" value={parsed.expenseDate ? formatDate(parsed.expenseDate) : "—"} />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
              <p className="text-xs text-slate-500">Mô tả</p>
              <p className="text-sm text-slate-900 mt-1 whitespace-pre-line">
                {parsed.body || request.description || "Không có mô tả"}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Tệp đính kèm</h2>

            {request.attachments.length === 0 ? (
              <p className="text-sm text-slate-500">Không có tệp đính kèm.</p>
            ) : (
              <div className="space-y-3">
                {request.attachments.map((file) => (
                  <div
                    key={file.fileId}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-slate-900 truncate">{file.fileName}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {file.fileType} • {formatAttachmentSize(file.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                      >
                        Xem trước
                      </a>
                      <a
                        href={file.url}
                        download
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                      >
                        Tải xuống
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {canEditOrCancel && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Thao tác</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openEdit}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 text-sm font-semibold transition-colors"
                >
                  Chỉnh sửa
                </button>

                <button
                  type="button"
                  onClick={handleCancelRequest}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 text-sm font-semibold transition-colors"
                >
                  Hủy yêu cầu
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Timeline xử lý</h2>

          <div className="space-y-3">
            {timelineRows.map((row, index) => (
              <div key={`${row.title}-${index}`} className="relative pl-8">
                {index < timelineRows.length - 1 && (
                  <span className="absolute left-[11px] top-6 bottom-[-14px] w-px bg-slate-200" />
                )}
                <span
                  className={`absolute left-0 top-1 w-[22px] h-[22px] rounded-full border-2 ${getTimelineToneClass(row.tone)}`}
                />
                <div className={`rounded-xl border p-3 ${getTimelineCardClass(row.tone)}`}>
                  <p className="text-sm font-semibold text-slate-900">{row.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{row.subtitle}</p>
                  <p className="text-xs text-slate-500 mt-1">{row.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm">
          {error}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setEditing(false)}
            aria-label="Đóng form chỉnh sửa"
          />

          <div className="absolute inset-x-0 top-8 mx-auto w-[calc(100%-2rem)] max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-sm shadow-2xl p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Chỉnh sửa yêu cầu</h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Số tiền</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editAmount ? formatCurrency(Number(editAmount.replace(/\D/g, ""))) : ""}
                  onChange={(e) => setEditAmount(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Tiêu đề</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Ngày chi tiêu</label>
                <input
                  type="date"
                  value={editExpenseDate}
                  onChange={(e) => setEditExpenseDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Mô tả</label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 text-sm font-semibold transition-colors"
                >
                  {actionLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-900 font-medium mt-1">{value}</p>
    </div>
  );
}
