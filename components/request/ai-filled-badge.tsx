"use client";

interface AiFilledBadgeProps {
  /** "ai" = AI đọc từ chứng từ · "advance" = lấy theo khoản tạm ứng gốc */
  kind: "ai" | "advance";
}

/** Nhãn nhỏ cạnh label, cho biết giá trị được điền tự động. Mất đi khi user tự sửa ô đó. */
export function AiFilledBadge({ kind }: AiFilledBadgeProps) {
  if (kind === "advance") {
    return (
      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-200">
        🔗 Theo tạm ứng
      </span>
    );
  }
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200">
      ✨ AI gợi ý
    </span>
  );
}
