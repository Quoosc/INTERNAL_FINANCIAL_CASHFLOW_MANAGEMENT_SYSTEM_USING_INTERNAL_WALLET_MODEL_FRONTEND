"use client";

import React, { useEffect, useRef, useState } from "react";

export interface KebabMenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger" | "warning";
}

interface KebabMenuProps {
  items: KebabMenuItem[];
  label?: string;
}

function itemClassName(tone: KebabMenuItem["tone"]): string {
  switch (tone) {
    case "danger":
      return "text-rose-700 hover:bg-rose-50";
    case "warning":
      return "text-amber-700 hover:bg-amber-50";
    default:
      return "text-slate-700 hover:bg-slate-50";
  }
}

export function KebabMenu({ items, label = "Mở menu thao tác" }: KebabMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg leading-none text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        aria-label={label}
        aria-expanded={open}
      >
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`block w-full px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 ${itemClassName(item.tone)}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
