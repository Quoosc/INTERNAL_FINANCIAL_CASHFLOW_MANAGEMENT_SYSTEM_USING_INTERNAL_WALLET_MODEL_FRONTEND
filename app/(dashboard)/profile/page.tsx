"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import {
  BankInfo,
  BankOption,
  UpdateAvatarRequest,
  UpdateBankInfoRequest,
  UpdatePinRequest,
  UpdateProfileRequest,
  UserProfileResponse,
} from "@/types";

const CLOUDINARY_CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
const CLOUDINARY_FOLDER        = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER!;

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  original_filename: string;
  bytes: number;
  format?: string;
}

function formatDateInput(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

const ROLE_LABEL: Record<string, string> = {
  EMPLOYEE:    "Nhân viên",
  TEAM_LEADER: "Team Leader",
  MANAGER:     "Quản lý",
  ACCOUNTANT:  "Kế toán",
  CFO:         "Giám đốc tài chính",
  ADMIN:       "Quản trị viên",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
        {label}
      </span>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  disabled,
  type = "text",
  placeholder,
}: {
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full px-4 py-2.5 rounded-xl border text-slate-900 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${
        disabled
          ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    />
  );
}

function SaveBtn({
  onClick,
  disabled,
  loading,
  label,
  loadingLabel,
}: {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  label: string;
  loadingLabel: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md hover:shadow-blue-500/20"
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {loading ? loadingLabel : label}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = "profile" | "bank";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [profile, setProfile]     = useState<UserProfileResponse | null>(null);
  const [banks, setBanks]         = useState<BankOption[]>([]);
  const [loading, setLoading]     = useState(true);

  const [profileForm, setProfileForm] = useState<UpdateProfileRequest>({
    fullName: "", phoneNumber: "", address: "", dateOfBirth: "", citizenId: "",
  });

  const [bankForm, setBankForm] = useState<UpdateBankInfoRequest>({
    bankName: "", accountNumber: "", accountOwner: "",
  });

  const [pinForm, setPinForm] = useState<UpdatePinRequest & { confirmPin: string }>({
    currentPin: "", newPin: "", confirmPin: "",
  });

  const [avatarFile, setAvatarFile]   = useState<File | null>(null);
  const [savingInfo, setSavingInfo]   = useState(false);
  const [savingBank, setSavingBank]   = useState(false);
  const [savingPin, setSavingPin]     = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const avatarPreviewUrl = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : null),
    [avatarFile],
  );

  useEffect(() => () => { if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl); }, [avatarPreviewUrl]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, bRes] = await Promise.all([
          api.get<UserProfileResponse>("/api/v1/users/me/profile"),
          api.get<BankOption[]>("/api/v1/banks"),
        ]);
        if (cancelled) return;
        const p = pRes.data;
        setProfile(p);
        setBanks(bRes.data);
        setProfileForm({
          fullName:    p.fullName,
          phoneNumber: p.phoneNumber ?? "",
          address:     p.address ?? "",
          dateOfBirth: formatDateInput(p.dateOfBirth),
          citizenId:   p.citizenId ?? "",
        });
        setBankForm({
          bankName:      p.bankInfo.bankName ?? "",
          accountNumber: p.bankInfo.accountNumber ?? "",
          accountOwner:  p.bankInfo.accountOwner ?? "",
        });
      } catch (err) {
        if (!cancelled)
          toast.error(err instanceof ApiError ? err.apiMessage : "Không thể tải thông tin hồ sơ.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [toast]);

  const handleSaveProfile = async () => {
    setSavingInfo(true);
    try {
      const res = await api.put<UserProfileResponse>("/api/v1/users/me/profile", {
        fullName:    profileForm.fullName.trim(),
        phoneNumber: profileForm.phoneNumber?.trim() || undefined,
        address:     profileForm.address?.trim()     || undefined,
        dateOfBirth: profileForm.dateOfBirth?.trim() || undefined,
        citizenId:   profileForm.citizenId?.trim()   || undefined,
      });
      setProfile(res.data);
      if (user) setUser({ ...user, fullName: res.data.fullName });
      toast.success("Đã cập nhật thông tin cá nhân.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.apiMessage : "Không thể cập nhật thông tin.");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSaveBank = async () => {
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountOwner) {
      toast.error("Vui lòng nhập đầy đủ thông tin ngân hàng.");
      return;
    }
    setSavingBank(true);
    try {
      const res = await api.put<BankInfo>("/api/v1/users/me/bank-info", {
        bankName:      bankForm.bankName,
        accountNumber: bankForm.accountNumber.trim(),
        accountOwner:  bankForm.accountOwner.trim(),
      });
      setProfile((prev) => (prev ? { ...prev, bankInfo: res.data } : prev));
      toast.success("Đã cập nhật thông tin ngân hàng.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.apiMessage : "Không thể cập nhật ngân hàng.");
    } finally {
      setSavingBank(false);
    }
  };

  const handleSavePin = async () => {
    if (!/^\d{5}$/.test(pinForm.currentPin) || !/^\d{5}$/.test(pinForm.newPin)) {
      toast.error("PIN phải gồm đúng 5 chữ số.");
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      toast.error("PIN mới và xác nhận PIN không khớp.");
      return;
    }
    setSavingPin(true);
    try {
      await api.put<{ message: string }>("/api/v1/users/me/pin", {
        currentPin: pinForm.currentPin,
        newPin:     pinForm.newPin,
      });
      setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
      toast.success("Đã cập nhật PIN giao dịch.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.apiMessage : "Không thể cập nhật PIN.");
    } finally {
      setSavingPin(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile) return;
    if (avatarFile.size > 5 * 1024 * 1024) {
      toast.error("Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5 MB.");
      return;
    }
    setSavingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file",          avatarFile);
      fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      fd.append("folder",        CLOUDINARY_FOLDER);
      const cRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: fd },
      );
      if (!cRes.ok) {
        const body = await cRes.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(`Tải ảnh lên thất bại${body.error?.message ? `: ${body.error.message}` : ""}.`);
      }
      const uploaded = (await cRes.json()) as CloudinaryUploadResponse;
      const payload: UpdateAvatarRequest = {
        cloudinaryPublicId: uploaded.public_id,
        url:                uploaded.secure_url,
        fileName:           avatarFile.name || `${uploaded.original_filename}.${uploaded.format ?? "jpg"}`,
        fileType:           avatarFile.type || `image/${uploaded.format ?? "jpeg"}`,
        size:               avatarFile.size || 0,
      };
      await api.put<{ avatar: string }>("/api/v1/users/me/avatar", payload);
      setProfile((prev) => (prev ? { ...prev, avatar: uploaded.secure_url } : prev));
      if (user) setUser({ ...user, avatar: uploaded.secure_url });
      setAvatarFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Đã cập nhật ảnh đại diện.");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.apiMessage);
      else if (err instanceof Error) toast.error(err.message);
      else toast.error("Không thể cập nhật ảnh đại diện.");
    } finally {
      setSavingAvatar(false);
    }
  };

  const avatarSrc = avatarPreviewUrl ?? profile?.avatar ?? user?.avatar ?? null;
  const initials  = (profile?.fullName ?? user?.fullName ?? "U").charAt(0).toUpperCase();
  const roleLabel = ROLE_LABEL[user?.role ?? ""] ?? user?.role ?? "—";

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-56 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-10 w-full rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-80 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
        <p className="text-slate-500 mt-0.5 text-sm">Quản lý thông tin, ngân hàng và bảo mật tài khoản.</p>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
        {(
          [
            { key: "profile", label: "Thông tin cá nhân", icon: "M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" },
            { key: "bank",    label: "Ngân hàng & Bảo mật", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
          ] as { key: Tab; label: string; icon: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Thông tin cá nhân + Ảnh đại diện ── */}
      {activeTab === "profile" && (
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Thông tin cá nhân</p>
              <p className="text-xs text-slate-400 mt-0.5">Cập nhật họ tên, liên hệ và ảnh đại diện</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Avatar + fields row */}
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar column */}
              <div className="flex flex-col items-center gap-3 sm:w-40 shrink-0">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-slate-100 shadow-md">
                    {avatarSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarSrc} alt={profile?.fullName ?? ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                        {initials}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Chọn ảnh đại diện"
                    className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 border-2 border-white flex items-center justify-center text-white shadow-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                  />
                </div>

                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-900 leading-tight">
                    {profile?.fullName ?? user?.fullName}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{profile?.employeeCode ?? "—"}</p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-medium">
                    {roleLabel}
                  </span>
                </div>

                {avatarFile && (
                  <div className="w-full space-y-1.5">
                    <p className="text-[11px] text-slate-500 text-center truncate">{avatarFile.name}</p>
                    <button
                      type="button"
                      disabled={savingAvatar}
                      onClick={() => void handleSaveAvatar()}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors shadow-sm"
                    >
                      {savingAvatar ? (
                        <>
                          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Đang tải...
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Lưu ảnh đại diện
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAvatarFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>

              {/* Info fields */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Họ và tên">
                  <TextInput
                    value={profileForm.fullName}
                    onChange={(v) => setProfileForm((p) => ({ ...p, fullName: v }))}
                  />
                </Field>
                <Field label="Email">
                  <TextInput value={profile?.email ?? ""} disabled />
                </Field>
                <Field label="Số điện thoại">
                  <TextInput
                    value={profileForm.phoneNumber ?? ""}
                    onChange={(v) => setProfileForm((p) => ({ ...p, phoneNumber: v }))}
                    placeholder="0912 345 678"
                  />
                </Field>
                <Field label="Ngày sinh">
                  <TextInput
                    type="date"
                    value={profileForm.dateOfBirth ?? ""}
                    onChange={(v) => setProfileForm((p) => ({ ...p, dateOfBirth: v }))}
                  />
                </Field>
                <Field label="CCCD / CMND">
                  <TextInput
                    value={profileForm.citizenId ?? ""}
                    onChange={(v) => setProfileForm((p) => ({ ...p, citizenId: v }))}
                    placeholder="079xxxxxxxxx"
                  />
                </Field>
                <Field label="Phòng ban">
                  <TextInput value={profile?.departmentName ?? user?.departmentName ?? "—"} disabled />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Địa chỉ">
                    <TextInput
                      value={profileForm.address ?? ""}
                      onChange={(v) => setProfileForm((p) => ({ ...p, address: v }))}
                      placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <SaveBtn
                onClick={() => void handleSaveProfile()}
                disabled={savingInfo}
                loading={savingInfo}
                label="Lưu thông tin"
                loadingLabel="Đang lưu..."
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Tab 2: Ngân hàng & Bảo mật ── */}
      {activeTab === "bank" && (
        <div className="space-y-5">
          {/* Bank section */}
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Thông tin ngân hàng</p>
                <p className="text-xs text-slate-400 mt-0.5">Tài khoản nhận giải ngân và rút tiền</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Virtual card preview */}
              <div
                className="relative rounded-2xl overflow-hidden shadow-lg select-none"
                style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e3a8a 100%)" }}
              >
                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white opacity-5" />
                <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white opacity-5" />
                <div className="relative p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <span className="text-white/90 text-sm font-semibold tracking-wide">
                        {bankForm.bankName || "Chưa chọn ngân hàng"}
                      </span>
                    </div>
                    <div className="flex items-center -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-red-500 opacity-90" />
                      <div className="w-8 h-8 rounded-full bg-yellow-400 opacity-80" />
                    </div>
                  </div>
                  <div
                    className="w-12 h-9 rounded-lg"
                    style={{ background: "linear-gradient(135deg, #fef08a 0%, #fbbf24 50%, #f59e0b 100%)" }}
                  >
                    <div className="w-full h-full rounded-lg opacity-60 grid grid-cols-2 gap-px p-1">
                      <div className="rounded-sm bg-yellow-600/40" />
                      <div className="rounded-sm bg-yellow-600/40" />
                      <div className="rounded-sm bg-yellow-600/40" />
                      <div className="rounded-sm bg-yellow-600/40" />
                    </div>
                  </div>
                  <div>
                    <p className="text-blue-300 text-[10px] mb-1 uppercase tracking-wider">Số tài khoản</p>
                    <p className="text-white font-mono text-lg tracking-[0.2em] font-semibold">
                      {bankForm.accountNumber
                        ? bankForm.accountNumber.replace(/(.{4})/g, "$1 ").trim()
                        : "•••• •••• •••• ••••"}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-300 text-[10px] mb-1 uppercase tracking-wider">Chủ tài khoản</p>
                    <p className="text-white text-sm font-semibold uppercase tracking-wide">
                      {bankForm.accountOwner || "NGUYEN VAN A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Ngân hàng">
                    <select
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm((p) => ({ ...p, bankName: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    >
                      <option value="">Chọn ngân hàng</option>
                      {banks.map((b) => (
                        <option key={b.value} value={b.value}>{b.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Số tài khoản">
                  <TextInput
                    value={bankForm.accountNumber}
                    onChange={(v) => setBankForm((p) => ({ ...p, accountNumber: v }))}
                    placeholder="Nhập số tài khoản"
                  />
                </Field>
                <Field label="Chủ tài khoản">
                  <TextInput
                    value={bankForm.accountOwner}
                    onChange={(v) => setBankForm((p) => ({ ...p, accountOwner: v }))}
                    placeholder="Nhập tên chủ tài khoản"
                  />
                </Field>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <SaveBtn
                  onClick={() => void handleSaveBank()}
                  disabled={savingBank}
                  loading={savingBank}
                  label="Lưu ngân hàng"
                  loadingLabel="Đang lưu..."
                />
              </div>
            </div>
          </section>

          {/* Security / PIN section */}
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Bảo mật</p>
                <p className="text-xs text-slate-400 mt-0.5">Mã PIN xác nhận giao dịch (5 chữ số)</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(
                  [
                    { key: "currentPin", label: "PIN hiện tại" },
                    { key: "newPin",     label: "PIN mới" },
                    { key: "confirmPin", label: "Xác nhận PIN mới" },
                  ] as { key: keyof typeof pinForm; label: string }[]
                ).map(({ key, label }) => (
                  <Field key={key} label={label}>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={5}
                      value={pinForm[key]}
                      onChange={(e) =>
                        setPinForm((p) => ({ ...p, [key]: e.target.value.replace(/\D/g, "").slice(0, 5) }))
                      }
                      placeholder="•••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    />
                  </Field>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <SaveBtn
                  onClick={() => void handleSavePin()}
                  disabled={savingPin}
                  loading={savingPin}
                  label="Cập nhật PIN"
                  loadingLabel="Đang cập nhật..."
                />
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
