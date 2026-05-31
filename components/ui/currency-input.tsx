"use client";

import React, { useLayoutEffect, useRef } from "react";

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

function digitOffsetForCaret(displayValue: string, caret: number): number {
  return digitsOnly(displayValue.slice(0, caret)).length;
}

function getSelectedDigitRange(input: HTMLInputElement): { start: number; end: number } {
  const selectionStart = input.selectionStart ?? input.value.length;
  const selectionEnd = input.selectionEnd ?? selectionStart;
  const startCaret = Math.min(selectionStart, selectionEnd);
  const endCaret = Math.max(selectionStart, selectionEnd);

  return {
    start: digitOffsetForCaret(input.value, startCaret),
    end: digitOffsetForCaret(input.value, endCaret),
  };
}

function replaceSelectedDigits(currentDigits: string, input: HTMLInputElement, insertedDigits: string): string {
  const range = getSelectedDigitRange(input);
  return `${currentDigits.slice(0, range.start)}${insertedDigits}${currentDigits.slice(range.end)}`;
}

function deleteSelectedDigits(currentDigits: string, input: HTMLInputElement, direction: "backward" | "forward"): string {
  const range = getSelectedDigitRange(input);

  if (range.start !== range.end) {
    return `${currentDigits.slice(0, range.start)}${currentDigits.slice(range.end)}`;
  }

  if (direction === "backward" && range.start > 0) {
    return `${currentDigits.slice(0, range.start - 1)}${currentDigits.slice(range.start)}`;
  }

  if (direction === "forward" && range.start < currentDigits.length) {
    return `${currentDigits.slice(0, range.start)}${currentDigits.slice(range.start + 1)}`;
  }

  return currentDigits;
}

export function CurrencyInput({
  value,
  onChange,
  error,
  locale = "vi-VN",
  currencyLabel = "VND",
  className = "",
  onBlur,
  onFocus,
  disabled,
  onKeyDown,
  onPaste,
  onClick,
  ...props
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const shouldMoveCaretToEnd = useRef(false);
  const handledKeyRef = useRef<{ inputType: string; data: string } | null>(null);
  const rawDigits = digitsFromValue(value);
  const displayValue = formatValue(value, locale);
  const rawDigitsRef = useRef(rawDigits);

  useLayoutEffect(() => {
    rawDigitsRef.current = rawDigits;
  }, [rawDigits]);

  useLayoutEffect(() => {
    if (!shouldMoveCaretToEnd.current) return;

    const input = inputRef.current;
    if (!input || document.activeElement !== input) {
      shouldMoveCaretToEnd.current = false;
      return;
    }

    input.setSelectionRange(displayValue.length, displayValue.length);
    shouldMoveCaretToEnd.current = false;
  }, [displayValue]);

  const commitDigits = (nextDigits: string) => {
    const normalizedDigits = digitsOnly(nextDigits);
    rawDigitsRef.current = normalizedDigits;
    shouldMoveCaretToEnd.current = true;
    onChange(normalizedDigits ? Number(normalizedDigits) : null);
  };

  const moveCaretToEnd = () => {
    shouldMoveCaretToEnd.current = true;
    window.requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input || document.activeElement !== input) return;
      input.setSelectionRange(input.value.length, input.value.length);
      shouldMoveCaretToEnd.current = false;
    });
  };

  const handleBeforeInput = (event: React.FormEvent<HTMLInputElement>) => {
    if (event.defaultPrevented || disabled) return;

    const nativeEvent = event.nativeEvent as InputEvent;
    const inputType = nativeEvent.inputType;
    const data = nativeEvent.data ?? "";
    const handledKey = handledKeyRef.current;

    if (handledKey && handledKey.inputType === inputType && handledKey.data === data) {
      event.preventDefault();
      handledKeyRef.current = null;
      return;
    }

    if (inputType === "deleteContentBackward" || inputType === "deleteContentForward") {
      event.preventDefault();
      commitDigits(
        deleteSelectedDigits(
          rawDigitsRef.current,
          event.currentTarget,
          inputType === "deleteContentBackward" ? "backward" : "forward",
        ),
      );
      return;
    }

    if (inputType === "insertText" || inputType === "insertCompositionText") {
      const insertedDigits = digitsOnly(data);
      event.preventDefault();

      if (!insertedDigits) return;
      commitDigits(replaceSelectedDigits(rawDigitsRef.current, event.currentTarget, insertedDigits));
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      handledKeyRef.current = {
        inputType: event.key === "Backspace" ? "deleteContentBackward" : "deleteContentForward",
        data: "",
      };
      commitDigits(
        deleteSelectedDigits(
          rawDigitsRef.current,
          event.currentTarget,
          event.key === "Backspace" ? "backward" : "forward",
        ),
      );
      return;
    }

    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      handledKeyRef.current = { inputType: "insertText", data: event.key };
      commitDigits(replaceSelectedDigits(rawDigitsRef.current, event.currentTarget, event.key));
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    onPaste?.(event);
    if (event.defaultPrevented || disabled) return;

    const pastedDigits = digitsOnly(event.clipboardData.getData("text"));
    event.preventDefault();
    if (!pastedDigits) return;
    commitDigits(replaceSelectedDigits(rawDigitsRef.current, event.currentTarget, pastedDigits));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    commitDigits(event.target.value);
  };

  const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) moveCaretToEnd();
  };

  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          {...props}
          ref={inputRef}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={displayValue}
          onBeforeInput={handleBeforeInput}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          onPaste={handlePaste}
          onClick={handleClick}
          onBlur={onBlur}
          onFocus={onFocus}
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
