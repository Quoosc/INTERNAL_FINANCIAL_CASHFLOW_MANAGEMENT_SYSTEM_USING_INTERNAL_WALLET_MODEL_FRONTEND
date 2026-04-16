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
        throw new Error("Cloudinary upload failed");
      }

      const uploaded: CloudinaryUploadResponse = await cloudinaryRes.json();

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
        />
        <TabButton
          active={activeTab === "AVATAR"}
          label="Ảnh đại diện"
          onClick={() => setActiveTab("AVATAR")}
        />
        <TabButton
          active={activeTab === "BANK"}
          label="Ngân hàng"
          onClick={() => setActiveTab("BANK")}
        />
        <TabButton
          active={activeTab === "SECURITY"}
          label="Bảo mật"
          onClick={() => setActiveTab("SECURITY")}
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
            <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
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
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
        active
          ? "bg-blue-100 border-blue-300 text-blue-700"
          : "bg-white border-slate-200 text-slate-600 hover:bg-blue-100"
      }`}
    >
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
