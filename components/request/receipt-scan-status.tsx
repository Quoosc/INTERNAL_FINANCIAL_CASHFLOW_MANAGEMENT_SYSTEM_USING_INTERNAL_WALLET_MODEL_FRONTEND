"use client";

import { formatCurrency } from "@/lib/format";
import type { ReceiptExtractionResponse } from "@/types";

export type ReceiptScanState =
  | { state: "scanning" }
  | { state: "done"; result: ReceiptExtractionResponse; ignored: boolean }
  | { state: "error"; message: string };

const WARNING_LABELS: Record<string, string> = {
  AMOUNT_UNREADABLE: "Không đọc được số tiền",
  LINE_ITEMS_MISMATCH: "Tổng các dòng hàng không khớp tổng tiền",
  INVOICE_DATE_IN_FUTURE: "Ngày hoá đơn ở tương lai",
  INVOICE_DATE_TOO_OLD: "Hoá đơn đã cũ",
  CURRENCY_NOT_VND: "Hoá đơn không dùng VND",
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

interface ReceiptScanStatusProps {
  scan: ReceiptScanState;
  onToggleIgnore: () => void;
  onRetry: () => void;
}

/** Dòng trạng thái AI dưới mỗi file chứng từ: đang đọc / đã đọc / lỗi. */
export function ReceiptScanStatus({ scan, onToggleIgnore, onRetry }: ReceiptScanStatusProps) {
  if (scan.state === "scanning") {
    return (
      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-violet-700">
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Đang đọc chứng từ…
      </p>
    );
  }

  if (scan.state === "error") {
    return (
      <p className="mt-1 text-xs text-rose-600">
        {scan.message}{" "}
        <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2">
          Thử lại
        </button>
      </p>
    );
  }

  const { fields, warnings } = scan.result;
  const parts = [
    fields.totalAmount != null ? formatCurrency(fields.totalAmount) : null,
    fields.invoiceDate ? formatDate(fields.invoiceDate) : null,
    fields.vendorName,
  ].filter(Boolean);

  return (
    <div className="mt-1 space-y-0.5">
      <p className={`text-xs ${scan.ignored ? "text-slate-400 line-through" : "text-violet-700"}`}>
        ✨ {parts.length > 0 ? `Đã đọc: ${parts.join(" · ")}` : "Không đọc được thông tin từ chứng từ này"}
        <button
          type="button"
          onClick={onToggleIgnore}
          className="ml-2 font-semibold text-slate-500 no-underline hover:text-slate-800"
        >
          {scan.ignored ? "Dùng lại" : "Bỏ qua"}
        </button>
      </p>
      {!scan.ignored && warnings.length > 0 && (
        <p className="text-xs text-amber-700">
          ⚠ {warnings.map((w) => WARNING_LABELS[w] ?? w).join(" · ")}
        </p>
      )}
    </div>
  );
}
