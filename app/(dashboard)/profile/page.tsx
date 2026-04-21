"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api-client";
import {
  BankOption,
  BankInfo,
  UpdateAvatarRequest,
  UpdateBankInfoRequest,
  UpdatePinRequest,
  UpdateProfileRequest,
  UserProfileResponse,
} from "@/types";

type ProfileTab = "INFO" | "AVATAR" | "BANK" | "SECURITY";

interface UploadSignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  original_filename: string;
  bytes: number;
  resource_type: string;
  format?: string;
}

function formatDateInput(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("INFO");

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [banks, setBanks] = useState<BankOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState<UpdateProfileRequest>({
    fullName: "",
    phoneNumber: "",
    address: "",
    dateOfBirth: "",
    citizenId: "",
  });

  const [bankForm, setBankForm] = useState<UpdateBankInfoRequest>({
    bankName: "",
    accountNumber: "",
    accountOwner: "",
  });

  const [pinForm, setPinForm] = useState<UpdatePinRequest & { confirmPin: string }>({
    currentPin: "",
    newPin: "",
    confirmPin: "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarPreviewUrl = useMemo(() => {
    if (!avatarFile) return null;
    return URL.createObjectURL(avatarFile);
  }, [avatarFile]);

  const [savingInfo, setSavingInfo] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [profileRes, banksRes] = await Promise.all([
          api.get<UserProfileResponse>("/api/v1/users/me/profile"),
          api.get<BankOption[]>("/api/v1/banks"),
        ]);

        if (cancelled) return;

        const profileData = profileRes.data;
        const bankData = banksRes.data;

        setProfile(profileData);
        setBanks(bankData);
        setProfileForm({
          fullName: profileData.fullName,
          phoneNumber: profileData.phoneNumber ?? "",
          address: profileData.address ?? "",
          dateOfBirth: formatDateInput(profileData.dateOfBirth),
          citizenId: profileData.citizenId ?? "",
        });
        setBankForm({
          bankName: profileData.bankInfo.bankName ?? "",
          accountNumber: profileData.bankInfo.accountNumber ?? "",
          accountOwner: profileData.bankInfo.accountOwner ?? "",
        });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải thông tin hồ sơ.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveProfile = async () => {
    setSavingInfo(true);
    setError(null);
    setNotice(null);

    try {
      const payload: UpdateProfileRequest = {
        fullName: profileForm.fullName.trim(),
        phoneNumber: profileForm.phoneNumber?.trim() || undefined,
        address: profileForm.address?.trim() || undefined,
        dateOfBirth: profileForm.dateOfBirth?.trim() || undefined,
        citizenId: profileForm.citizenId?.trim() || undefined,
      };

      const res = await api.put<UserProfileResponse>("/api/v1/users/me/profile", payload);
      setProfile(res.data);
      setNotice("Đã cập nhật thông tin cá nhân.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Không thể cập nhật thông tin cá nhân.");
      }
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSaveBank = async () => {
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountOwner) {
      setError("Vui lòng nhập đầy đủ thông tin ngân hàng.");
      return;
    }

    setSavingBank(true);
    setError(null);
    setNotice(null);

    try {
      const payload: UpdateBankInfoRequest = {
        bankName: bankForm.bankName,
        accountNumber: bankForm.accountNumber.trim(),
        accountOwner: bankForm.accountOwner.trim(),
      };

      const res = await api.put<BankInfo>("/api/v1/users/me/bank-info", payload);

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              bankInfo: res.data,
            }
          : prev
      );
      setNotice("Đã cập nhật thông tin ngân hàng.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Không thể cập nhật thông tin ngân hàng.");
      }
    } finally {
      setSavingBank(false);
    }
  };

  const handleSavePin = async () => {
    if (!/^\d{5}$/.test(pinForm.currentPin) || !/^\d{5}$/.test(pinForm.newPin)) {
      setError("PIN phải gồm đúng 5 chữ số.");
      return;
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      setError("PIN mới và xác nhận PIN không khớp.");
      return;
    }

    setSavingPin(true);
    setError(null);
    setNotice(null);

    try {
      await api.put<{ message: string }>("/api/v1/users/me/pin", {
        currentPin: pinForm.currentPin,
        newPin: pinForm.newPin,
      });

      setPinForm({
        currentPin: "",
        newPin: "",
        confirmPin: "",
      });
      setNotice("Đã cập nhật PIN giao dịch.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Không thể cập nhật PIN giao dịch.");
      }
    } finally {
      setSavingPin(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile) {
      setError("Vui lòng chọn ảnh đại diện.");
      return;
    }

    setSavingAvatar(true);
    setError(null);
    setNotice(null);

    try {
      const signatureRes = await api.get<UploadSignatureResponse>(
        "/api/v1/uploads/signature?folder=AVATAR"
      );

      const signature = signatureRes.data;
      const uploadData = new FormData();
      uploadData.append("file", avatarFile);
      uploadData.append("api_key", signature.apiKey);
      uploadData.append("timestamp", String(signature.timestamp));
      uploadData.append("signature", signature.signature);
      uploadData.append("folder", signature.folder);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`,
        {
          method: "POST",
          body: uploadData,
        }
      );

      if (!cloudinaryRes.ok) {
        let detail = "";
        try {
          const errBody = (await cloudinaryRes.json()) as { error?: { message?: string } };
          if (errBody.error?.message) detail = `: ${errBody.error.message}`;
        } catch {
          // ignore json parse failure on error response
        }
        throw new Error(
          `Tải ảnh lên thất bại${detail} (HTTP ${cloudinaryRes.status}). Vui lòng thử lại.`
        );
      }

      let uploaded: CloudinaryUploadResponse;
      try {
        uploaded = (await cloudinaryRes.json()) as CloudinaryUploadResponse;
      } catch {
        throw new Error("Phản hồi từ máy chủ lưu trữ ảnh không hợp lệ. Vui lòng thử lại.");
      }

      const avatarPayload: UpdateAvatarRequest = {
        cloudinaryPublicId: uploaded.public_id,
        fileName: avatarFile.name || `${uploaded.original_filename}.${uploaded.format ?? "jpg"}`,
        fileType: avatarFile.type || `${uploaded.resource_type}/${uploaded.format ?? "jpeg"}`,
        size: avatarFile.size || uploaded.bytes,
      };

      const avatarRes = await api.put<{ avatar: string }>("/api/v1/users/me/avatar", {
        ...avatarPayload,
        avatarUrl: uploaded.secure_url,
      });

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              avatar: avatarRes.data.avatar,
            }
          : prev
      );
      setAvatarFile(null);
      setNotice("Đã cập nhật ảnh đại diện.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Không thể cập nhật ảnh đại diện.");
      }
    } finally {
      setSavingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-60 rounded bg-white animate-pulse" />
        <div className="h-80 rounded-2xl bg-white animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
        <p className="text-slate-500 mt-1">Quản lý thông tin, ngân hàng và bảo mật tài khoản.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton
          active={activeTab === "INFO"}
          label="Thông tin"
          onClick={() => setActiveTab("INFO")}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <TabButton
          active={activeTab === "AVATAR"}
          label="Ảnh đại diện"
          onClick={() => setActiveTab("AVATAR")}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <TabButton
          active={activeTab === "BANK"}
          label="Ngân hàng"
          onClick={() => setActiveTab("BANK")}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
        />
        <TabButton
          active={activeTab === "SECURITY"}
          label="Bảo mật"
          onClick={() => setActiveTab("SECURITY")}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
        />
      </div>

      {activeTab === "INFO" && (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <Field label="Họ và tên">
            <input
              value={profileForm.fullName}
              onChange={(event) =>
                setProfileForm((prev) => ({
                  ...prev,
                  fullName: event.target.value,
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900"
            />
          </Field>

          <Field label="Email">
            <input
              value={profile?.email ?? ""}
              disabled
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-500"
            />
          </Field>

          <Field label="Số điện thoại">
            <input
              value={profileForm.phoneNumber ?? ""}
              onChange={(event) =>
                setProfileForm((prev) => ({
                  ...prev,
                  phoneNumber: event.target.value,
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900"
            />
          </Field>

          <Field label="Địa chỉ">
            <input
              value={profileForm.address ?? ""}
              onChange={(event) =>
                setProfileForm((prev) => ({
                  ...prev,
                  address: event.target.value,
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900"
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Ngày sinh">
              <input
                type="date"
                value={profileForm.dateOfBirth ?? ""}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    dateOfBirth: event.target.value,
                  }))
                }
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900"
              />
            </Field>

            <Field label="CCCD">
              <input
                value={profileForm.citizenId ?? ""}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    citizenId: event.target.value,
                  }))
                }
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900"
              />
            </Field>
          </div>

          <ActionButton
            disabled={savingInfo}
            label={savingInfo ? "Đang lưu..." : "Lưu thông tin"}
            onClick={() => void handleSaveProfile()}
          />
        </section>
      )}

      {activeTab === "AVATAR" && (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-slate-200 hover:ring-blue-500 transition-all bg-white flex items-center justify-center cursor-pointer">
              {avatarPreviewUrl || profile?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreviewUrl ?? profile?.avatar ?? ""}
                  alt="Ảnh đại diện"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-500 text-xs">Chưa có ảnh</span>
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                className="text-sm text-slate-600"
              />
              <p className="text-xs text-slate-500 mt-1">Chọn ảnh JPG/PNG để cập nhật.</p>
            </div>
          </div>

          <ActionButton
            disabled={savingAvatar}
            label={savingAvatar ? "Đang tải ảnh..." : "Lưu ảnh đại diện"}
            onClick={() => void handleSaveAvatar()}
          />
        </section>
      )}

      {activeTab === "BANK" && (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          {/* Virtual bank card preview */}
          <div
            className="relative rounded-2xl overflow-hidden shadow-lg select-none"
            style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e3a8a 100%)" }}
          >
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white opacity-5" />
            <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white opacity-5" />
            <div className="absolute top-6 right-24 w-20 h-20 rounded-full bg-white opacity-[0.04]" />

            <div className="relative p-6 space-y-5">
              {/* Top row: bank name + card brand icon */}
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
                {/* Mastercard-style circles */}
                <div className="flex items-center -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-red-500 opacity-90" />
                  <div className="w-8 h-8 rounded-full bg-yellow-400 opacity-80" />
                </div>
              </div>

              {/* Chip */}
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

              {/* Account number */}
              <div>
                <p className="text-blue-300 text-[10px] mb-1 uppercase tracking-wider">Số tài khoản</p>
                <p className="text-white font-mono text-lg tracking-[0.2em] font-semibold">
                  {bankForm.accountNumber
                    ? bankForm.accountNumber.replace(/(.{4})/g, "$1 ").trim()
                    : "•••• •••• •••• ••••"}
                </p>
              </div>

              {/* Account owner */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-blue-300 text-[10px] mb-1 uppercase tracking-wider">Chủ tài khoản</p>
                  <p className="text-white text-sm font-semibold uppercase tracking-wide">
                    {bankForm.accountOwner || "NGUYEN VAN A"}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <Field label="Ngân hàng">
            <select
              value={bankForm.bankName}
              onChange={(event) =>
                setBankForm((prev) => ({
                  ...prev,
                  bankName: event.target.value,
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900"
            >
              <option value="">Chọn ngân hàng</option>
              {banks.map((bank) => (
                <option key={bank.value} value={bank.value}>
                  {bank.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Số tài khoản">
            <input
              value={bankForm.accountNumber}
              onChange={(event) =>
                setBankForm((prev) => ({
                  ...prev,
                  accountNumber: event.target.value,
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900"
            />
          </Field>

          <Field label="Chủ tài khoản">
            <input
              value={bankForm.accountOwner}
              onChange={(event) =>
                setBankForm((prev) => ({
                  ...prev,
                  accountOwner: event.target.value,
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900"
            />
          </Field>

          <ActionButton
            disabled={savingBank}
            label={savingBank ? "Đang lưu..." : "Lưu thông tin ngân hàng"}
            onClick={() => void handleSaveBank()}
          />
        </section>
      )}

      {activeTab === "SECURITY" && (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Mã PIN giao dịch</p>
              <p className="text-xs text-slate-400">Dùng để xác nhận khi giải ngân và rút tiền.</p>
            </div>
          </div>
          <Field label="PIN hiện tại (5 số)">
            <input
              type="password"
              inputMode="numeric"
              maxLength={5}
              value={pinForm.currentPin}
              onChange={(event) =>
                setPinForm((prev) => ({
                  ...prev,
                  currentPin: event.target.value.replace(/\D/g, "").slice(0, 5),
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900"
            />
          </Field>

          <Field label="PIN mới (5 số)">
            <input
              type="password"
              inputMode="numeric"
              maxLength={5}
              value={pinForm.newPin}
              onChange={(event) =>
                setPinForm((prev) => ({
                  ...prev,
                  newPin: event.target.value.replace(/\D/g, "").slice(0, 5),
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900"
            />
          </Field>

          <Field label="Xác nhận PIN mới">
            <input
              type="password"
              inputMode="numeric"
              maxLength={5}
              value={pinForm.confirmPin}
              onChange={(event) =>
                setPinForm((prev) => ({
                  ...prev,
                  confirmPin: event.target.value.replace(/\D/g, "").slice(0, 5),
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900"
            />
          </Field>

          <ActionButton
            disabled={savingPin}
            label={savingPin ? "Đang cập nhật..." : "Cập nhật PIN"}
            onClick={() => void handleSavePin()}
          />
        </section>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {notice && (
        <div className="px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">
          {notice}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-colors ${
        active
          ? "bg-blue-100 border-blue-300 text-blue-700"
          : "bg-white border-slate-200 text-slate-600 hover:bg-blue-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm text-slate-600 mb-2">{label}</span>
      {children}
    </label>
  );
}

function ActionButton({
  disabled,
  label,
  onClick,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
    >
      {label}
    </button>
  );
}
