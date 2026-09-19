// BROKE MUSIC — debounced search box with `/` shortcut + skeleton support.
"use client";

import { useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";

export function SearchBox({
  value,
  onChange,
  loading,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  loading?: boolean;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [autoFocus]);

  return (
    <div className="glass group relative flex items-center gap-2 rounded-[1.4rem] px-4 py-3.5 transition focus-within:border-lime-300/40">
      {loading ? <Loader2 size={18} className="shrink-0 animate-spin text-lime-300" /> : <Search size={18} className="shrink-0 text-white/40" />}
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search songs, artists, albums…"
        aria-label="Search songs, artists, albums"
        className="w-full bg-transparent text-sm font-medium text-white placeholder:text-white/30 focus:outline-none"
      />
      {value && (
        <button onClick={() => onChange("")} aria-label="Clear search" className="grid h-7 w-7 place-items-center rounded-full bg-white/5 text-white/50 hover:text-white">
          <X size={14} />
        </button>
      )}
      <kbd className="hidden shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-white/40 sm:block">/</kbd>
    </div>
  );
}
