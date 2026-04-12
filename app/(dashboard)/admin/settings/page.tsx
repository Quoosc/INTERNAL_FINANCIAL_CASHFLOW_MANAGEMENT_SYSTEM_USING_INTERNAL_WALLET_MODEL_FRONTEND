"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { evictAllConfigCache, getAllConfigs, updateConfig } from "@/lib/api";
import { SystemConfigItem, SystemConfigResponse } from "@/types";

type SettingsCategory = SystemConfigItem["category"];

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
  item: SystemConfigResponse & { category?: SettingsCategory }
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

export default function AdminSettingsPage() {
  const [items, setItems] = useState<SystemConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [evictingCache, setEvictingCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getAllConfigs();
      setItems(res.data.map(normalizeItem));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Khong the tai cau hinh he thong.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

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

  const handleSaveItem = async (key: string) => {
    const item = items.find((entry) => entry.key === key);
    if (!item) return;

    setSavingKey(key);
    setNotice(null);

    try {
      await updateConfig(item.key, { value: item.value });
      setNotice(`Da cap nhat cau hinh ${item.key}.`);
    } catch (err) {
      if (err instanceof ApiError) {
        setNotice(`API loi: ${err.apiMessage}`);
      } else {
        setNotice("Khong the cap nhat cau hinh.");
      }
    } finally {
      setSavingKey(null);
    }
  };

  const handleEvictAllCache = async () => {
    setEvictingCache(true);
    setNotice(null);

    try {
      await evictAllConfigCache();
      setNotice("Da lam moi cache cau hinh.");
    } catch (err) {
      if (err instanceof ApiError) {
        setNotice(`API loi: ${err.apiMessage}`);
      } else {
        setNotice("Khong the lam moi cache cau hinh.");
      }
    } finally {
      setEvictingCache(false);
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
            onSave={handleSaveItem}
            savingKey={savingKey}
          />

          <SettingsGroup
            title="MAIL"
            description="SMTP, gui thong bao email he thong"
            items={grouped.MAIL}
            onChange={updateValue}
            onSave={handleSaveItem}
            savingKey={savingKey}
          />

          <SettingsGroup
            title="SYSTEM"
            description="Cac tham so van hanh chung"
            items={grouped.SYSTEM}
            onChange={updateValue}
            onSave={handleSaveItem}
            savingKey={savingKey}
          />
        </>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => void loadSettings()}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
        >
          Tai lai
        </button>
        <button
          type="button"
          onClick={() => void handleEvictAllCache()}
          disabled={evictingCache || loading}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
        >
          {evictingCache ? "Dang lam moi cache..." : "Lam moi cache"}
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
  onSave,
  savingKey,
}: {
  title: SettingsCategory;
  description: string;
  items: SystemConfigItem[];
  onChange: (key: string, value: string) => void;
  onSave: (key: string) => Promise<void>;
  savingKey: string | null;
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
                <button
                  type="button"
                  onClick={() => void onSave(item.key)}
                  disabled={savingKey !== null}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm"
                >
                  {savingKey === item.key ? "Dang luu..." : "Luu"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
