"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";
import type { ReceiptScanState } from "@/components/request/receipt-scan-status";

interface ReceiptPreviewModalProps {
  file: File;
  /** Object URL của file (ảnh hoặc PDF), do trang tạo lúc user chọn file */
  previewUrl: string | null;
  scan?: ReceiptScanState;
  onClose: () => void;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

/**
 * Xem chứng từ cỡ lớn. Ảnh: bấm để phóng to / thu nhỏ. PDF: hiển thị trong khung.
 * Nếu AI đã đọc file, các giá trị đọc được hiện bên cạnh để user đối chiếu.
 */
export function ReceiptPreviewModal({ file, previewUrl, scan, onClose }: ReceiptPreviewModalProps) {
  const [zoomed, setZoomed] = useState(false);
  const isPdf = file.type === "application/pdf";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const result = scan?.state === "done" ? scan.result : null;
  const rows: Array<[string, string | null]> = result
    ? [
        ["Tổng tiền", result.fields.totalAmount != null ? formatCurrency(result.fields.totalAmount) : null],
        ["Ngày hoá đơn", result.fields.invoiceDate ? formatDate(result.fields.invoiceDate) : null],
        ["Người bán", result.fields.vendorName],
        ["MST", result.fields.vendorTaxCode],
        ["Số hoá đơn", result.fields.invoiceNumber],
        ["VAT", result.fields.vatAmount != null ? formatCurrency(result.fields.vatAmount) : null],
        // Chỉ hiện khi AI có chọn hạng mục (quyết toán lấy hạng mục theo tạm ứng, không qua AI)
        ...(result.suggestion.category
          ? [["Hạng mục gợi ý", result.suggestion.category.name] as [string, string]]
          : []),
      ]
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Xem chứng từ ${file.name}`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex min-h-0 flex-1 flex-col bg-slate-900">
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <div className="flex shrink-0 items-center gap-2">
              {!isPdf && (
                <button
                  type="button"
                  onClick={() => setZoomed((z) => !z)}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20"
                >
                  {zoomed ? "Thu nhỏ" : "Phóng to"}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng"
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20"
              >
                Đóng ✕
              </button>
            </div>
          </div>

          <div className={`min-h-0 flex-1 overflow-auto ${zoomed ? "" : "flex items-center justify-center"} p-3`}>
            {isPdf ? (
              previewUrl && <iframe src={previewUrl} title={file.name} className="h-[78vh] w-full rounded-lg bg-white" />
            ) : previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- object URL của file local, không qua next/image
              <img
                src={previewUrl}
                alt={file.name}
                onClick={() => setZoomed((z) => !z)}
                className={
                  zoomed
                    ? "max-w-none cursor-zoom-out"
                    : "max-h-[78vh] max-w-full cursor-zoom-in object-contain"
                }
              />
            ) : (
              <p className="text-sm text-slate-300">Không xem trước được file này.</p>
            )}
          </div>
        </div>

        {result && (
          <aside className="w-full shrink-0 overflow-y-auto border-t border-slate-200 p-5 lg:w-80 lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">✨ AI đã đọc</p>
            <p className="mt-1 text-xs text-slate-500">Đối chiếu với ảnh trước khi gửi yêu cầu.</p>
            <dl className="mt-4 space-y-3 text-sm">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className={value ? "font-medium text-slate-900" : "italic text-slate-400"}>
                    {value ?? "Không đọc được"}
                  </dd>
                </div>
              ))}
            </dl>
            {result.fields.lineItems.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-slate-500">Dòng hàng</p>
                <ul className="mt-1 space-y-1 text-sm text-slate-800">
                  {result.fields.lineItems.map((item, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span className="min-w-0 truncate">
                        {item.description ?? "Mặt hàng"}
                        {item.quantity != null && item.quantity > 1 ? ` ×${item.quantity}` : ""}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {item.amount != null ? formatCurrency(item.amount) : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
