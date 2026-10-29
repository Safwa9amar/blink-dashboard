import type { ReactNode } from "react";

/** One label / value row of a detail card's `<dl>`. */
export function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-[13px]">
      <dt className="text-subtext shrink-0">{label}</dt>
      <dd className="font-medium text-text text-end break-words min-w-0">{children}</dd>
    </div>
  );
}
