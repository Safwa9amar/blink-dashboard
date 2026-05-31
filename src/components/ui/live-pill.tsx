import type { ReactNode } from "react";

export function LivePill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 bg-soft-pink text-primary border border-soft-border rounded-full px-3 py-1.5 text-[12.5px] font-bold">
      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      {children}
    </span>
  );
}
