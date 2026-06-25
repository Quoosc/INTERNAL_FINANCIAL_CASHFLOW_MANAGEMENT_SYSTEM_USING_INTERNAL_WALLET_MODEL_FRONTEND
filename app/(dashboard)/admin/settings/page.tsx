"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { useToast } from "@/contexts/toast-context";
import { evictAllConfigCache, getAdminSettings, updateAdminSettings } from "@/lib/api";
import { SystemConfigItem, SystemConfigResponse } from "@/types";

type SettingsCategory = SystemConfigItem["category"];

type SettingDisplayMeta = {
  label: string;
  description: string;
};

const VISIBLE_SETTING_META: Record<string, SettingDisplayMeta> = {
  PIN_MAX_RETRY: {
    label: "Số lần nhập sai PIN tối đa",
    description: "Số lần người dùng được nhập sai PIN trước khi hệ thống khóa PIN giao dịch.",
  },
  PIN_LOCK_MINUTES: {
    label: "Thời gian khóa PIN",
    description: "Số phút khóa PIN sau khi người dùng nhập sai quá số lần cho phép.",
  },
  SYSTEM_MAINTENANCE_MODE: {
    label: "Chế độ bảo trì hệ thống",
    description: "Bật chế độ này để tạm dừng các giao dịch trong thời gian bảo trì.",
  },
  MAX_ATTACHMENT_SIZE_MB: {
    label: "Dung lượng tối đa mỗi tệp đính kèm",
    description: "Giới hạn dung lượng cho từng tệp chứng từ được tải lên trong yêu cầu.",
  },
  MAX_ATTACHMENT_COUNT: {
    label: "Số tệp đính kèm tối đa",
    description: "Số lượng tệp chứng từ tối đa cho một yêu cầu.",
  },
  JWT_REFRESH_EXPIRY_DAYS: {
    label: "Thời hạn phiên đăng nhập",
    description: "Số ngày refresh token còn hiệu lực trước khi người dùng cần đăng nhập lại.",
  },
  NOTIFICATION_RETAIN_DAYS: {
    label: "Thời gian lưu thông báo",
    description: "Số ngày hệ thống giữ thông báo trước khi tự động dọn dẹp.",
  },
  WITHDRAW_LIMIT_EMPLOYEE: {
    label: "Hạn mức rút tự động của Nhân viên",
    description: "Giao dịch rút tiền của Nhân viên không vượt hạn mức này sẽ được xử lý tự động.",
  },
  WITHDRAW_LIMIT_TEAM_LEADER: {
    label: "Hạn mức rút tự động của Trưởng nhóm",
    description: "Giao dịch rút tiền của Trưởng nhóm không vượt hạn mức này sẽ được xử lý tự động.",
  },
  WITHDRAW_LIMIT_MANAGER: {
    label: "Hạn mức rút tự động của Manager",
    description: "Giao dịch rút tiền của Manager không vượt hạn mức này sẽ được xử lý tự động.",
  },
  WITHDRAW_LIMIT_ACCOUNTANT: {
    label: "Hạn mức rút tự động của Kế toán",
    description: "Giao dịch rút tiền của Kế toán không vượt hạn mức này sẽ được xử lý tự động.",
  },
  WITHDRAW_LIMIT_CFO: {
    label: "Hạn mức rút tự động của CFO",
    description: "Giao dịch rút tiền của CFO không vượt hạn mức này sẽ được xử lý tự động.",
  },
  WITHDRAW_LIMIT_ADMIN: {
    label: "Hạn mức rút tự động của Admin",
    description: "Giá trị 0 nghĩa là Admin không được rút tự động và luôn cần quy trình kiểm soát.",
  },
};

const CATEGORY_META: Record<SettingsCategory, { label: string; description: string; tone: string }> = {
  SECURITY: {
    label: "Bảo mật",
    description: "PIN, OTP, giới hạn giao dịch và chính sách xác thực.",
    tone: "border-rose-100 bg-rose-50 text-rose-700",
  },
  MAIL: {
    label: "Email",
    description: "SMTP và thông báo email hệ thống.",
    tone: "border-amber-100 bg-amber-50 text-amber-700",
  },
  SYSTEM: {
    label: "Vận hành",
    description: "Các tham số vận hành chung của hệ thống.",
    tone: "border-blue-100 bg-blue-50 text-blue-700",
  },
};

function getSettingMeta(key: string): SettingDisplayMeta {
  return (
    VISIBLE_SETTING_META[key] ?? {
      label: key
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/^\w/, (char) => char.toUpperCase()),
      description: "Cấu hình hệ thống.",
    }
  );
}

type SettingValidation = { min?: number; max?: number; isInt?: boolean };

const SETTING_VALIDATION: Record<string, SettingValidation> = {
  PIN_MAX_RETRY:           { min: 1, max: 10, isInt: true },
  PIN_LOCK_MINUTES:        { min: 1, max: 1440, isInt: true },
  MAX_ATTACHMENT_SIZE_MB:  { min: 1, max: 100, isInt: true },
  MAX_ATTACHMENT_COUNT:    { min: 1, max: 20, isInt: true },
  JWT_REFRESH_EXPIRY_DAYS: { min: 1, max: 365, isInt: true },
  NOTIFICATION_RETAIN_DAYS:{ min: 1, max: 365, isInt: true },
  WITHDRAW_LIMIT_EMPLOYEE: { min: 0, isInt: true },
  WITHDRAW_LIMIT_TEAM_LEADER:{ min: 0, isInt: true },
  WITHDRAW_LIMIT_MANAGER:  { min: 0, isInt: true },
  WITHDRAW_LIMIT_ACCOUNTANT:{ min: 0, isInt: true },
  WITHDRAW_LIMIT_CFO:      { min: 0, isInt: true },
  WITHDRAW_LIMIT_ADMIN:    { min: 0, isInt: true },
};

function validateSetting(key: string, value: string): string | null {
  const rules = SETTING_VALIDATION[key];
  if (!rules) return null;

  if (rules.isInt) {
    if (!/^-?\d+$/.test(value.trim())) return "Giá trị phải là số nguyên.";
    const n = parseInt(value, 10);
    if (rules.min !== undefined && n < rules.min)
      return `Giá trị tối thiểu là ${rules.min}.`;
    if (rules.max !== undefined && n > rules.max)
      return `Giá trị tối đa là ${rules.max}.`;
  }

  return null;
}

function isVisibleSetting(item: SystemConfigItem): boolean {
  return Object.prototype.hasOwnProperty.call(VISIBLE_SETTING_META, item.key);
}

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
  const toast = useToast();
  const [items, setItems] = useState<SystemConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [evictingCache, setEvictingCache] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getAdminSettings();
      setItems(res.data.items.map(normalizeItem).filter(isVisibleSetting));
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.apiMessage);
      } else {
        toast.error("Không thể tải cấu hình hệ thống.");
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

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

    const validationError = validateSetting(item.key, item.value);
    if (validationError) {
      toast.error(`${getSettingMeta(item.key).label}: ${validationError}`);
      return;
    }

    setSavingKey(key);

    try {
      await updateAdminSettings({ configs: [{ key: item.key, value: item.value }] });
      toast.success(`Đã cập nhật ${getSettingMeta(item.key).label}.`);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(`Lỗi API: ${err.apiMessage}`);
      } else {
        toast.error("Không thể cập nhật cấu hình.");
      }
    } finally {
      setSavingKey(null);
    }
  };

  const handleEvictAllCache = async () => {
    setEvictingCache(true);

    try {
      await evictAllConfigCache();
      toast.success("Đã làm mới cache cấu hình.");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(`Lỗi API: ${err.apiMessage}`);
      } else {
        toast.error("Không thể làm mới cache cấu hình.");
      }
    } finally {
      setEvictingCache(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blue-200 bg-linear-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-900/10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Quản trị cấu hình
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Cấu hình hệ thống</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Quản trị các tham số vận hành cần thiết bằng nhãn tiếng Việt, không hiển thị các key kỹ thuật hoặc key test.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadSettings()}
              disabled={loading}
              className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Tải lại
            </button>
            <button
              type="button"
              onClick={() => void handleEvictAllCache()}
              disabled={evictingCache || loading}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-lg shadow-blue-950/10 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {evictingCache ? "Đang làm mới..." : "Làm mới cache"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard label="Tổng cấu hình" value={String(items.length)} />
        <MetricCard label="Bảo mật" value={String(grouped.SECURITY.length)} />
        <MetricCard label="Vận hành" value={String(grouped.SYSTEM.length)} />
        <MetricCard label="Hạn mức rút" value={String(items.filter((item) => item.key.startsWith("WITHDRAW_LIMIT_")).length)} />
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 shadow-sm">
        <div className="flex gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-amber-100 font-bold text-amber-700">!</span>
          <div>
            <p className="font-bold">Kiểm tra kỹ trước khi lưu cấu hình.</p>
            <p className="mt-1 leading-6">
              Các giá trị như hạn mức rút tiền, khóa PIN hoặc chế độ bảo trì có thể ảnh hưởng ngay đến toàn bộ người dùng đang hoạt động.
            </p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={`settings-skeleton-${index}`} className="h-52 animate-pulse rounded-3xl bg-white" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <SettingsGroup
            title="SECURITY"
            items={grouped.SECURITY}
            onChange={updateValue}
            onSave={handleSaveItem}
            savingKey={savingKey}
          />

          {grouped.MAIL.length > 0 && (
            <SettingsGroup
              title="MAIL"
              items={grouped.MAIL}
              onChange={updateValue}
              onSave={handleSaveItem}
              savingKey={savingKey}
            />
          )}

          <SettingsGroup
            title="SYSTEM"
            items={grouped.SYSTEM}
            onChange={updateValue}
            onSave={handleSaveItem}
            savingKey={savingKey}
          />
        </div>
      )}
    </div>
  );
}

function SettingsGroup({
  title,
  items,
  onChange,
  onSave,
  savingKey,
}: {
  title: SettingsCategory;
  items: SystemConfigItem[];
  onChange: (key: string, value: string) => void;
  onSave: (key: string) => Promise<void>;
  savingKey: string | null;
}) {
  const meta = CATEGORY_META[title];

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-blue-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${meta.tone}`}>
            {meta.label}
          </div>
          <h2 className="mt-3 text-lg font-bold text-slate-900">{meta.label}</h2>
          <p className="mt-1 text-sm text-slate-500">{meta.description}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
          {items.length} tham số
        </span>
      </div>

      {items.length === 0 ? (
        <p className="px-5 py-10 text-sm text-slate-500">Không có cấu hình trong nhóm này.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.key} className="grid grid-cols-1 gap-4 px-5 py-4 xl:grid-cols-[minmax(0,1fr)_360px_auto] xl:items-center">
              <div>
                <p className="text-sm font-bold text-slate-900">{getSettingMeta(item.key).label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{getSettingMeta(item.key).description}</p>
              </div>
              {item.value === "true" || item.value === "false" ? (
                <select
                  value={item.value}
                  onChange={(event) => onChange(item.key, event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="false">Tắt</option>
                  <option value="true">Bật</option>
                </select>
              ) : (
                <div className="space-y-1">
                  <input
                    value={item.value}
                    onChange={(event) => onChange(item.key, event.target.value)}
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-4 ${
                      validateSetting(item.key, item.value)
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                    }`}
                  />
                  {(() => {
                    const rules = SETTING_VALIDATION[item.key];
                    const err = validateSetting(item.key, item.value);
                    if (err) return <p className="text-xs text-rose-600">{err}</p>;
                    if (rules?.min !== undefined || rules?.max !== undefined) {
                      const parts = [];
                      if (rules.min !== undefined) parts.push(`≥ ${rules.min}`);
                      if (rules.max !== undefined) parts.push(`≤ ${rules.max}`);
                      return <p className="text-xs text-slate-400">Cho phép: {parts.join(", ")}</p>;
                    }
                    return null;
                  })()}
                </div>
              )}
              <button
                type="button"
                onClick={() => void onSave(item.key)}
                disabled={savingKey !== null}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingKey === item.key ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 h-2 w-12 rounded-full bg-blue-600" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
