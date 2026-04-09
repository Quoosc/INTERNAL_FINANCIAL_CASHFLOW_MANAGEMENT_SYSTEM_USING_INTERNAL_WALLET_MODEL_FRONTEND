"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api-client";
import { SystemConfigItem, SystemSettingsResponse, UpdateSettingsBody } from "@/types";

type SettingsCategory = SystemConfigItem["category"];

// TODO: Replace when Sprint 6 is complete
const MOCK_SETTINGS: SystemConfigItem[] = [
  {
    key: "PIN_MAX_RETRY",
    value: "5",
    description: "So lan nhap sai PIN toi da truoc khi khoa",
    createdAt: null,
    updatedAt: null,
    category: "SECURITY",
  },
  {
    key: "PIN_LOCK_DURATION_MINUTES",
    value: "30",
    description: "Thoi gian khoa PIN (phut)",
    createdAt: null,
    updatedAt: null,
    category: "SECURITY",
  },
  {
    key: "WITHDRAWAL_LIMIT",
    value: "50000000",
    description: "Han muc rut tien toi da moi giao dich",
    createdAt: null,
    updatedAt: null,
    category: "SECURITY",
  },
  {
    key: "MAIL_ENABLED",
    value: "true",
    description: "Bat/tat gui email he thong",
    createdAt: null,
    updatedAt: null,
    category: "MAIL",
  },
  {
    key: "SYSTEM_TIMEZONE",
    value: "Asia/Ho_Chi_Minh",
    description: "Timezone mac dinh cho he thong",
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
    upper.includes("OTP") ||
    upper.includes("AUTH")
  ) {
    return "SECURITY";
  }

  if (upper.includes("MAIL") || upper.includes("SMTP")) {
    return "MAIL";
  }

  return "SYSTEM";
}

function normalizeItem(
  item: Partial<SystemConfigItem> & { key: string; value: string }
): SystemConfigItem {
  return {
    key: item.key,
    value: item.value,
    description: item.description ?? null,
    category: item.category ?? inferCategory(item.key),
    createdAt: item.createdAt ?? null,
    updatedAt: item.updatedAt ?? null,
  };
}

function normalizeItems(
  items: Array<Partial<SystemConfigItem> & { key: string; value: string }>
): SystemConfigItem[] {
  return items.map(normalizeItem);
}

function pickSettingsItems(payload: SystemSettingsResponse | SystemConfigItem[]): SystemConfigItem[] {
  if (Array.isArray(payload)) {
    return normalizeItems(payload);
  }

  return normalizeItems(payload.items);
}

export default function AdminSettingsPage() {
  const [items, setItems] = useState<SystemConfigItem[]>([]);
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
        const res = await api.get<SystemSettingsResponse | SystemConfigItem[]>("/api/v1/admin/settings");
        if (cancelled) return;
        setItems(pickSettingsItems(res.data));
      } catch (err) {
        if (cancelled) return;

        setItems(MOCK_SETTINGS);

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Khong the tai cau hinh tu API, dang hien thi du lieu mau.");
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

  const grouped = useMemo(
    () => ({
      SECURITY: items.filter((item) => item.category === "SECURITY"),
      MAIL: items.filter((item) => item.category === "MAIL"),
      SYSTEM: items.filter((item) => item.category === "SYSTEM"),
    }),
    [items]
  );

  const updateValue = (key: string, value: string) => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, value } : item)));
  };

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);

    const payload: UpdateSettingsBody = {
      items: items.map((item) => ({ key: item.key, value: item.value })),
    };

    try {
      const res = await api.put<SystemSettingsResponse | SystemConfigItem[]>("/api/v1/admin/settings", payload);

      // Khi API tra danh sach settings moi, dong bo lai UI ngay.
      setItems(pickSettingsItems(res.data));
      setNotice("Da luu cau hinh he thong.");
    } catch (err) {
      if (err instanceof ApiError) {
        setNotice(`API loi: ${err.apiMessage}. Da giu du lieu hien tai tren UI.`);
      } else {
        setNotice("API chua san sang, da mo phong thao tac luu cau hinh.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Cau hinh he thong</h1>
        <p className="text-slate-400 mt-1">Quan tri thong so van hanh va bao mat he thong.</p>
      </div>

      <div className="px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm">
        Thay doi cau hinh co hieu luc ngay lap tuc. Kiem tra ky truoc khi luu.
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
            description="PIN, OTP, gioi han giao dich va chinh sach bao mat"
            items={grouped.SECURITY}
            onChange={updateValue}
          />

          <SettingsGroup
            title="MAIL"
            description="SMTP, gui thong bao email he thong"
            items={grouped.MAIL}
            onChange={updateValue}
          />

          <SettingsGroup
            title="SYSTEM"
            description="Cac tham so van hanh chung"
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
          {saving ? "Dang luu..." : "Luu cau hinh"}
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
  items: SystemConfigItem[];
  onChange: (key: string, value: string) => void;
}) {
  return (
    <section className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-slate-400 mt-1">{description}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">Khong co cau hinh trong nhom nay.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.key} className="rounded-xl border border-white/10 bg-slate-900 p-4 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-white">{item.key}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.description ?? "Khong co mo ta"}</p>
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
