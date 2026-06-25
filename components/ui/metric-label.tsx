interface MetricLabelProps {
  label: string;
  description: string;
}

export function MetricLabel({ label, description }: MetricLabelProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <span className="group relative inline-flex">
        <button
          type="button"
          className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-500 outline-none transition hover:border-blue-300 hover:text-blue-600 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/20"
          aria-label={`Giải thích ${label.toLowerCase()}`}
          title={description}
        >
          ?
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 rounded-lg bg-slate-950 px-3 py-2 text-left text-xs font-normal leading-5 text-white shadow-lg group-hover:block group-focus-within:block"
        >
          {description}
        </span>
      </span>
    </span>
  );
}
