import type { ReactNode } from "react";

/** KPI cards: 2 columns on phones (instead of one tall card per row), then 3 / 5. */
export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">{children}</div>;
}
