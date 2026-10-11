import type { ReactNode } from "react";

/** A small label-over-value pair for the review modals. */
export function DetailField({ label, children, mono = false }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-subtext">{label}</p>
      <div className={`text-sm font-medium text-text break-words ${mono ? "font-mono" : ""}`}>{children}</div>
    </div>
  );
}
