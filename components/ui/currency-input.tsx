"use client";

import React, { useState } from "react";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  error?: string;
  locale?: string;
  currencyLabel?: string;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

function formatValue(value: number | null | undefined, locale: string): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  return Math.trunc(value).toLocaleString(locale);
}

function digitsFromValue(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  return String(Math.trunc(value));
}

export function CurrencyInput({
  value,
  onChange,
  error,
  locale = "vi-VN",
  currencyLabel = "VND",
  className = "",
  disabled,
  onBlur,
  onFocus,
  ...props
}: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [draftDigits, setDraftDigits] = useState(() => digitsFromValue(value));
  const displayValue = isFocused ? draftDigits : formatValue(value, locale);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const normalizedDigits = digitsOnly(event.target.value);
    setDraftDigits(normalizedDigits);
    onChange(normalizedDigits ? Number(normalizedDigits) : null);
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setDraftDigits(digitsFromValue(value));
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          {...props}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          disabled={disabled}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`w-full rounded-xl border bg-white px-4 py-3 pr-16 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60 ${
            error ? "border-rose-300" : "border-slate-200"
          } ${className}`}
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
          {currencyLabel}
        </span>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
