"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { getNotifications, markAllAsRead, markAsRead } from "@/lib/api";
import { NotificationResponse, NotificationType } from "@/types";

const PAGE_SIZE = 20;

type NotificationFilterTab = "ALL" | "UNREAD";

// Fallback mock data when backend is unavailable
const MOCK_NOTIFICATIONS: NotificationResponse[] = [
  {
    id: 1,
    type: NotificationType.REQUEST_SUBMITTED,
    title: "Yeu cau moi duoc tao",
    message: "REQ-2026-0101 da duoc gui cho Team Leader.",
    isRead: false,
    refId: 101,
    refType: "REQUEST",
    referenceLink: "/requests/101",
    createdAt: "2026-04-08T09:30:00",
  },
  {
    id: 2,
    type: NotificationType.REQUEST_APPROVED_BY_TL,
    title: "Yeu cau da duoc Team Leader duyet",
    message: "REQ-2026-0100 da chuyen sang Ke toan.",
    isRead: false,
    refId: 100,
    refType: "REQUEST",
    referenceLink: "/requests/100",
    createdAt: "2026-04-08T08:15:00",
  },
  {
    id: 3,
    type: NotificationType.REQUEST_PAID,
    title: "Yeu cau da duoc giai ngan",
    message: "REQ-2026-0095 da duoc chi tra.",
    isRead: true,
    refId: 95,
    refType: "REQUEST",
    referenceLink: "/requests/95",
    createdAt: "2026-04-07T16:40:00",
  },
  {
    id: 4,
    type: NotificationType.SALARY_PAID,
    title: "Luong da duoc thanh toan",
    message: "Ban da nhan luong thang 03/2026.",
    isRead: true,
    refId: 77,
    refType: "PAYSLIP",
    referenceLink: "/payroll/77",
    createdAt: "2026-04-07T08:00:00",
  },
  {
    id: 5,
    type: NotificationType.SECURITY_ALERT,
    title: "Canh bao bao mat",
    message: "Phat hien dang nhap tu thiet bi moi.",
    isRead: false,
    refId: null,
    refType: null,
    referenceLink: null,
    createdAt: "2026-04-06T20:10:00",
  },
  {
    id: 6,
    type: NotificationType.SYSTEM,
    title: "Thong bao he thong",
    message: "He thong se bao tri tu 23:00 den 23:30.",
    isRead: true,
    refId: null,
    refType: null,
    referenceLink: null,
    createdAt: "2026-04-06T13:20:00",
  },
];

function formatTimeAgo(iso: string): string {
  const now = Date.now();
  const target = new Date(iso).getTime();
  const diff = Math.max(0, now - target);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < 5 * minute) return "Vua xong";
  if (diff < hour) return `${Math.floor(diff / minute)} phut truoc`;
  if (diff < day) return `${Math.floor(diff / hour)} gio truoc`;
  if (diff < 2 * day) return "Hom qua";
  if (diff < 7 * day) return `${Math.floor(diff / day)} ngay truoc`;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

function getTypeIcon(type: string): React.ReactNode {
  switch (type) {
    case NotificationType.REQUEST_SUBMITTED:
    case NotificationType.REQUEST_APPROVED_BY_TL:
    case NotificationType.REQUEST_PAID:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case NotificationType.REQUEST_REJECTED:
    case NotificationType.PROJECT_TOPUP_REJECTED:
    case NotificationType.DEPT_TOPUP_REJECTED:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case NotificationType.SALARY_PAID:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
      );
    case NotificationType.SECURITY_ALERT:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 9v2m0 4h.01M10.29 3.86l-8.03 14A2 2 0 004 21h16a2 2 0 001.74-3.14l-8.03-14a2 2 0 00-3.48 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.16V11a6 6 0 00-4-5.66V5a2 2 0 10-4 0v.34A6 6 0 006 11v3.16c0 .53-.21 1.04-.6 1.43L4 17h5" />
        </svg>
      );
  }
}

function getTypeIconClass(type: string): string {
  switch (type) {
    case NotificationType.REQUEST_SUBMITTED:
    case NotificationType.REQUEST_APPROVED_BY_TL:
    case NotificationType.REQUEST_PAID:
    case NotificationType.PROJECT_TOPUP_APPROVED:
    case NotificationType.DEPT_TOPUP_APPROVED:
      return "bg-emerald-500/20 text-emerald-300";
    case NotificationType.REQUEST_REJECTED:
    case NotificationType.PROJECT_TOPUP_REJECTED:
    case NotificationType.DEPT_TOPUP_REJECTED:
      return "bg-rose-500/20 text-rose-300";
    case NotificationType.SALARY_PAID:
      return "bg-blue-500/20 text-blue-300";
    case NotificationType.SECURITY_ALERT:
      return "bg-amber-500/20 text-amber-300";
    default:
      return "bg-slate-600/40 text-slate-200";
  }
}

function buildMockPage(source: NotificationResponse[], filter: NotificationFilterTab, page: number) {
  const filtered = filter === "UNREAD" ? source.filter((n) => !n.isRead) : source;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = safePage * PAGE_SIZE;

  return {
    items: filtered.slice(start, start + PAGE_SIZE),
    total,
    totalPages,
  };
}

function getNotificationTarget(item: NotificationResponse): string | null {
  if (item.referenceLink) return item.referenceLink;

  if (item.refType === "REQUEST" && item.refId) return `/requests/${item.refId}`;
  if (item.refType === "PAYSLIP" && item.refId) return `/payroll/${item.refId}`;
  if (item.refType === "PROJECT" && item.refId) return `/projects/${item.refId}`;

  return null;
}

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<NotificationFilterTab>("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await getNotifications(filter === "UNREAD", page, PAGE_SIZE);

        if (cancelled) return;

        setNotifications(res.data.content);
        setTotal(res.data.totalElements);
        setTotalPages(Math.max(1, res.data.totalPages));
      } catch (err) {
        if (cancelled) return;

        const mock = buildMockPage(MOCK_NOTIFICATIONS, filter, page);
        setNotifications(mock.items);
        setTotal(mock.total);
        setTotalPages(mock.totalPages);

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Khong the tai thong bao tu API, dang hien thi du lieu mau.");
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleTabChange = (nextFilter: NotificationFilterTab) => {
    if (nextFilter === filter) return;
    setFilter(nextFilter);
    setPage(0);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch {
      // keep optimistic behavior
    }

    if (filter === "UNREAD") {
      setNotifications([]);
      setTotal(0);
      setTotalPages(1);
      setPage(0);
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleOpenNotification = async (item: NotificationResponse) => {
    if (!item.isRead) {
      try {
        await markAsRead(item.id);
      } catch {
        // keep optimistic behavior
      }

      if (filter === "UNREAD") {
        setNotifications((prev) => prev.filter((n) => n.id !== item.id));
        setTotal((prevTotal) => {
          const nextTotal = Math.max(0, prevTotal - 1);
          const nextPages = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
          setTotalPages(nextPages);
          setPage((prevPage) => Math.min(prevPage, nextPages - 1));
          return nextTotal;
        });
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      }
    }

    const target = getNotificationTarget(item);
    if (target) router.push(target);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 0 || nextPage >= totalPages || nextPage === page) return;
    setPage(nextPage);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Thong bao</h1>
          <p className="text-slate-400 mt-1">Cap nhat yeu cau, luong va canh bao he thong.</p>
        </div>

        <button
          type="button"
          onClick={() => void handleMarkAllRead()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors border border-white/10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M5 13l4 4L19 7" />
          </svg>
          Danh dau tat ca da doc
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
          Tat ca
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
          Chua doc ({filter === "UNREAD" ? total : unreadCount})
        </button>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-14 text-center text-slate-400 text-sm">Dang tai thong bao...</div>
        ) : notifications.length === 0 ? (
          <div className="py-14 text-center text-slate-500 text-sm">Khong co thong bao phu hop.</div>
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
                    <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${getTypeIconClass(item.type)}`}>
                      {getTypeIcon(item.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm md:text-base font-semibold text-white truncate">{item.title}</p>
                        <span className="text-xs text-slate-400 shrink-0">{formatTimeAgo(item.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-300 mt-1 line-clamp-2">{item.message}</p>
                    </div>

                    {!item.isRead && <span className="mt-1 inline-flex w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="px-4 py-3 border-t border-white/10 bg-slate-900/70 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Tong {total} thong bao • Trang {page + 1}/{totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 0}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors"
            >
              Truoc
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages - 1}
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

