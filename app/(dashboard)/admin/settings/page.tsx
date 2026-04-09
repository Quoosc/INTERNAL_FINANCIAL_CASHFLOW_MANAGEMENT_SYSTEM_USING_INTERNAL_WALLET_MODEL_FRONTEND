"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api-client";
import { SystemConfigRequest, SystemConfigResponse } from "@/types";

type SettingsCategory = "SECURITY" | "MAIL" | "SYSTEM";

type SettingViewItem = SystemConfigResponse & {
  category: SettingsCategory;
};

// TODO: Replace when Sprint 6 is complete
const MOCK_SETTINGS: SettingViewItem[] = [
  {
    key: "PIN_MAX_RETRY",
    value: "5",
    description: "Số lần nhập sai PIN tối đa trước khi khóa",
    createdAt: null,
    updatedAt: null,
    category: "SECURITY",
  },
  {
    key: "PIN_LOCK_DURATION_MINUTES",
    value: "30",
    description: "Thời gian khóa PIN (phút)",
    createdAt: null,
    updatedAt: null,
    category: "SECURITY",
  },
  {
    key: "WITHDRAWAL_LIMIT",
    value: "50000000",
    description: "Hạn mức rút tiền tối đa mỗi giao dịch",
    createdAt: null,
    updatedAt: null,
    category: "SECURITY",
  },
  {
    key: "MAIL_ENABLED",
    value: "true",
    description: "Bật/tắt gửi email hệ thống",
    createdAt: null,
    updatedAt: null,
    category: "MAIL",
  },
  {
    key: "SYSTEM_TIMEZONE",
    value: "Asia/Ho_Chi_Minh",
    description: "Timezone mặc định cho hệ thống",
    createdAt: null,
    updatedAt: null,
    category: "SYSTEM",
  },
];

function inferCategory(key: string): SettingsCategory {
  const upper = key.toUpperCase();

  if (
    upper.includes("PIN") ||
    upper.includes("WITHDRAW") ||
    upper.includes("RETRY") ||
    upper.includes("LOCK") ||
    upper.includes("MAX_FILE") ||
    upper.includes("MINIMUM_REQUEST")
  ) {
    return "SECURITY";
  }

  if (upper.includes("MAIL") || upper.includes("SMTP")) {
    return "MAIL";
  }

  return "SYSTEM";
}

function normalizeItems(items: SystemConfigResponse[]): SettingViewItem[] {
  return items.map((item) => ({
    ...item,
    category: inferCategory(item.key),
  }));
}

export default function AdminSettingsPage() {
  const [items, setItems] = useState<SettingViewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      setLoading(true);
      setError(null);

      try {
        const adminRes = await api.get<{ items: SystemConfigResponse[] }>("/api/v1/admin/settings");
        if (cancelled) return;
        setItems(normalizeItems(adminRes.data.items));
      } catch (adminErr) {
        try {
          const fallbackRes = await api.get<SystemConfigResponse[]>("/api/v1/system-configs");
          if (cancelled) return;
          setItems(normalizeItems(fallbackRes.data));
        } catch (fallbackErr) {
          if (cancelled) return;
          setItems(MOCK_SETTINGS);

          if (adminErr instanceof ApiError) {
            setError(adminErr.apiMessage);
          } else if (fallbackErr instanceof ApiError) {
            setError(fallbackErr.apiMessage);
          } else {
            setError("Không thể tải settings từ API, đang hiển thị dữ liệu mẫu.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    return {
      SECURITY: items.filter((item) => item.category === "SECURITY"),
      MAIL: items.filter((item) => item.category === "MAIL"),
      SYSTEM: items.filter((item) => item.category === "SYSTEM"),
    };
  }, [items]);

  const updateValue = (key: string, value: string) => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, value } : item)));
  };

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);

    const payload = {
      configs: items.map((item) => ({ key: item.key, value: item.value })),
    };

    try {
      await api.put<{ items: SystemConfigResponse[] }>("/api/v1/admin/settings", payload);
      setNotice("Đã lưu cấu hình hệ thống.");
    } catch {
      try {
        await Promise.all(
          items.map((item) => {
            const body: SystemConfigRequest = {
              value: item.value,
              description: item.description ?? undefined,
            };
            return api.put<SystemConfigResponse>(`/api/v1/system-configs/${item.key}`, body);
          })
        );
        setNotice("Đã lưu cấu hình qua endpoint /system-configs.");
      } catch {
        setNotice("API chưa sẵn sàng, đã mô phỏng lưu cấu hình.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Cấu hình hệ thống</h1>
        <p className="text-slate-400 mt-1">Quản trị thông số vận hành và bảo mật hệ thống.</p>
      </div>

      <div className="px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm">
        Thay đổi cấu hình có hiệu lực ngay lập tức. Kiểm tra kỹ trước khi lưu.
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={`settings-skeleton-${index}`} className="h-44 rounded-2xl bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <SettingsGroup
            title="SECURITY"
            description="PIN, giới hạn giao dịch, chính sách bảo mật"
            items={grouped.SECURITY}
            onChange={updateValue}
          />

          <SettingsGroup
            title="MAIL"
            description="SMTP, gửi thông báo email hệ thống"
            items={grouped.MAIL}
            onChange={updateValue}
          />

          <SettingsGroup
            title="SYSTEM"
            description="Các tham số vận hành chung"
            items={grouped.SYSTEM}
            onChange={updateValue}
          />
        </>
      )}

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
        >
          {saving ? "Đang lưu..." : "Lưu cấu hình"}
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm">
          {error}
        </div>
      )}

      {notice && (
        <div className="px-4 py-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm">
          {notice}
        </div>
      )}
    </div>
  );
}

function SettingsGroup({
  title,
  description,
  items,
  onChange,
}: {
  title: SettingsCategory;
  description: string;
  items: SettingViewItem[];
  onChange: (key: string, value: string) => void;
}) {
  return (
    <section className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-slate-400 mt-1">{description}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">Không có cấu hình trong nhóm này.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.key} className="rounded-xl border border-white/10 bg-slate-900 p-4 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-white">{item.key}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.description ?? "Không có mô tả"}</p>
                </div>
                <input
                  value={item.value}
                  onChange={(event) => onChange(item.key, event.target.value)}
                  className="w-full md:w-72 px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-slate-100 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
