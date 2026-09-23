"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  label?: string;
  fallbackHref?: string;
}

export function BackButton({
  label = "Quay lại",
  fallbackHref,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref ?? "/dashboard");
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      {label}
    </button>
  );
}
