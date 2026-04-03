"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  MarkAllReadResponse,
  MarkReadResponse,
  NotificationFilterParams,
  NotificationListResponse,
  NotificationRefType,
  NotificationResponse,
  NotificationType,
} from "@/types";

const PAGE_LIMIT = 20;

// TODO: Replace with real API calls when Sprint 8 is complete
const MOCK_NOTIFICATIONS: NotificationResponse[] = [
  {
    id: 1,
    type: NotificationType.REQUEST_APPROVED,
    title: "Yêu cầu đã được duyệt",
    message: "REQ-EMP-0326-001 đã được Team Leader duyệt.",
    isRead: false,
    refId: 101,
    refType: NotificationRefType.REQUEST,
    createdAt: "2026-04-03T11:20:00",
  },
  {
    id: 2,
    type: NotificationType.REQUEST_REJECTED,
    title: "Yêu cầu bị từ chối",
    message: "REQ-EMP-0326-005 bị từ chối do thiếu chứng từ.",
    isRead: false,
    refId: 105,
    refType: NotificationRefType.REQUEST,
    createdAt: "2026-04-03T09:10:00",
  },
  {
    id: 3,
    type: NotificationType.SALARY_PAID,
    title: "Lương đã được thanh toán",
    message: "Phiếu lương tháng 03/2026 đã được chuyển vào ví của bạn.",
    isRead: true,
    refId: 2001,
    refType: NotificationRefType.PAYSLIP,
    createdAt: "2026-04-02T10:05:00",
  },
  {
    id: 4,
    type: NotificationType.SYSTEM,
    title: "Nạp tiền thành công",
    message: "Bạn đã nạp thành công 500.000 ₫ vào ví.",
    isRead: false,
    refId: null,
    refType: null,
    createdAt: "2026-04-02T07:45:00",
  },
  {
    id: 5,
    type: NotificationType.WARN,
    title: "Cảnh báo số dư",
    message: "Số dư khả dụng của bạn đang thấp hơn mức khuyến nghị.",
    isRead: true,
    refId: null,
    refType: null,
    createdAt: "2026-04-01T17:30:00",
  },
  {
    id: 6,
    type: NotificationType.REQUEST_APPROVED,
    title: "Yêu cầu chờ kế toán",
    message: "REQ-EMP-0326-007 đã được duyệt và chuyển sang kế toán.",
    isRead: false,
    refId: 107,
    refType: NotificationRefType.REQUEST,
    createdAt: "2026-04-01T14:10:00",
  },
  {
    id: 7,
    type: NotificationType.SYSTEM,
    title: "Cập nhật hệ thống",
    message: "Hệ thống sẽ bảo trì từ 23:00 đến 23:30 hôm nay.",
    isRead: true,
    refId: null,
    refType: null,
    createdAt: "2026-03-31T21:00:00",
  },
  {
    id: 8,
    type: NotificationType.SALARY_PAID,
    title: "Phiếu lương mới",
    message: "Phiếu lương tháng 02/2026 đã sẵn sàng để xem.",
    isRead: false,
    refId: 1998,
    refType: NotificationRefType.PAYSLIP,
    createdAt: "2026-03-31T08:40:00",
  },
  {
    id: 9,
    type: NotificationType.REQUEST_REJECTED,
    title: "Yêu cầu cần chỉnh sửa",
    message: "REQ-EMP-0326-008 thiếu thông tin dự án, vui lòng cập nhật.",
    isRead: true,
    refId: 108,
    refType: NotificationRefType.REQUEST,
    createdAt: "2026-03-30T15:25:00",
  },
  {
    id: 10,
    type: NotificationType.SYSTEM,
    title: "Giao dịch ví mới",
    message: "Có giao dịch mới được ghi nhận trong lịch sử ví.",
    isRead: false,
    refId: null,
    refType: null,
    createdAt: "2026-03-29T10:10:00",
  },
];

type NotificationFilterTab = "ALL" | "UNREAD";

function formatTimeAgo(iso: string): string {
  const now = Date.now();
  const target = new Date(iso).getTime();
  const diff = Math.max(0, now - target);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < 5 * minute) return "Vừa xong";
  if (diff < hour) return `${Math.floor(diff / minute)} phút trước`;
  if (diff < day) return `${Math.floor(diff / hour)} giờ trước`;
  if (diff < 2 * day) return "Hôm qua";
  if (diff < 7 * day) return `${Math.floor(diff / day)} ngày trước`;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

function getTypeIcon(type: NotificationType): React.ReactNode {
  switch (type) {
    case NotificationType.REQUEST_APPROVED:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12l2 2 4-4m7 2A9 9 0 113 12a9 9 0 0118 0z" />
        </svg>
      );
    case NotificationType.REQUEST_REJECTED:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case NotificationType.SALARY_PAID:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.6}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
          />
        </svg>
      );
    case NotificationType.WARN:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.6}
            d="M12 9v4m0 4h.01M10.29 3.86l-8.03 14A2 2 0 004 21h16a2 2 0 001.74-3.14l-8.03-14a2 2 0 00-3.48 0z"
          />
        </svg>
      );
    case NotificationType.SYSTEM:
    default:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.6}
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.16V11a6 6 0 00-4-5.66V5a2 2 0 10-4 0v.34A6 6 0 006 11v3.16c0 .53-.21 1.04-.6 1.43L4 17h5m6 0a3 3 0 11-6 0"
          />
        </svg>
      );
  }
}

function getTypeIconClass(type: NotificationType): string {
  switch (type) {
    case NotificationType.REQUEST_APPROVED:
      return "bg-emerald-500/20 text-emerald-300";
    case NotificationType.REQUEST_REJECTED:
      return "bg-rose-500/20 text-rose-300";
    case NotificationType.SALARY_PAID:
      return "bg-blue-500/20 text-blue-300";
    case NotificationType.WARN:
      return "bg-amber-500/20 text-amber-300";
    case NotificationType.SYSTEM:
    default:
      return "bg-slate-600/40 text-slate-200";
  }
}

function buildMockPage(
  source: NotificationResponse[],
  filter: NotificationFilterTab,
  page: number
): { items: NotificationResponse[]; total: number; totalPages: number } {
  const filtered = filter === "UNREAD" ? source.filter((n) => !n.isRead) : source;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * PAGE_LIMIT;
  const items = filtered.slice(start, start + PAGE_LIMIT);

  return { items, total, totalPages };
}

function getNotificationTarget(item: NotificationResponse): string | null {
  if (item.refType === NotificationRefType.REQUEST && item.refId) {
    return `/requests/${item.refId}`;
  }

  if (item.refType === NotificationRefType.PAYSLIP && item.refId) {
    return `/payroll/${item.refId}`;
  }

  if (item.refType === NotificationRefType.PROJECT && item.refId) {
    return `/projects/${item.refId}`;
  }

  return null;
}

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<NotificationFilterTab>("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      setLoading(true);
      setError(null);

      const params: NotificationFilterParams = {
        page,
        limit: PAGE_LIMIT,
        isRead: filter === "UNREAD" ? false : undefined,
      };

      try {
        const query = new URLSearchParams();
        if (typeof params.page === "number") query.set("page", String(params.page));
        if (typeof params.limit === "number") query.set("limit", String(params.limit));
        if (typeof params.isRead === "boolean") query.set("isRead", String(params.isRead));
        if (filter === "UNREAD") query.set("unreadOnly", "true");

        // const res = await api.get<NotificationListResponse>('/api/v1/notifications', { params: { unreadOnly: filter === 'UNREAD', page, limit: 20 } })
        const res = await api.get<NotificationListResponse>(`/api/v1/notifications?${query.toString()}`);

        if (cancelled) return;
        setNotifications(res.data.items);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        if (cancelled) return;

        const mock = buildMockPage(MOCK_NOTIFICATIONS, filter, page);
        setNotifications(mock.items);
        setTotal(mock.total);
        setTotalPages(mock.totalPages);

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải thông báo từ API, đang hiển thị dữ liệu mẫu.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [filter, page]);

  const handleTabChange = (nextFilter: NotificationFilterTab) => {
    if (nextFilter === filter) return;
    setFilter(nextFilter);
    setPage(1);
  };

  const handleMarkAllRead = async () => {
    try {
      // await api.put<MarkAllReadResponse>('/api/v1/notifications/read-all')
      await api.put<MarkAllReadResponse>("/api/v1/notifications/read-all");
    } catch {
      // Ignore API error; still update UI optimistically
    }

    if (filter === "UNREAD") {
      setNotifications([]);
      setTotal(0);
      setTotalPages(1);
      setPage(1);
      return;
    }

    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const handleOpenNotification = async (item: NotificationResponse) => {
    if (!item.isRead) {
      try {
        // await api.put<MarkReadResponse>(`/api/v1/notifications/${item.id}/read`)
        await api.put<MarkReadResponse>(`/api/v1/notifications/${item.id}/read`);
      } catch {
        // Ignore API error; still update UI optimistically
      }

      if (filter === "UNREAD") {
        setNotifications((prev) => prev.filter((n) => n.id !== item.id));
        setTotal((prev) => {
          const nextTotal = Math.max(0, prev - 1);
          const nextTotalPages = Math.max(1, Math.ceil(nextTotal / PAGE_LIMIT));
          setTotalPages(nextTotalPages);
          setPage((currentPage) => Math.min(currentPage, nextTotalPages));
          return nextTotal;
        });
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      }
    }

    const target = getNotificationTarget(item);
    if (target) {
      router.push(target);
    }
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Thông báo</h1>
          <p className="text-slate-400 mt-1">Biến động số dư, trạng thái yêu cầu, lương và cảnh báo hệ thống.</p>
        </div>

        <button
          type="button"
          onClick={() => void handleMarkAllRead()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors border border-white/10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M5 13l4 4L19 7" />
          </svg>
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleTabChange("ALL")}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
            filter === "ALL"
              ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
              : "bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Tất cả
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("UNREAD")}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
            filter === "UNREAD"
              ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
              : "bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Chưa đọc
        </button>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-14 text-center text-slate-400 text-sm">
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
              </svg>
              Đang tải thông báo...
            </span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-14 text-center text-slate-500 text-sm">Không có thông báo phù hợp.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {notifications.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => void handleOpenNotification(item)}
                  className={`w-full text-left px-4 py-4 md:px-5 hover:bg-slate-700/30 transition-colors ${
                    item.isRead ? "bg-slate-900" : "bg-slate-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${getTypeIconClass(item.type)}`}
                    >
                      {getTypeIcon(item.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm md:text-base font-semibold text-white truncate">{item.title}</p>
                        <span className="text-xs text-slate-400 shrink-0">{formatTimeAgo(item.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-300 mt-1 line-clamp-2">{item.message}</p>
                    </div>

                    {!item.isRead && (
                      <span className="mt-1 inline-flex w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="px-4 py-3 border-t border-white/10 bg-slate-900/70 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Tổng {total} thông báo • Trang {page}/{totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-amber-400 text-sm">{error}</p>}
    </div>
  );
}
