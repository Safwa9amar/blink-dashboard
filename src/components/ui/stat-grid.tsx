import type { ReactNode } from "react";

export function StatGrid({ cols = 5, children }: { cols?: 4 | 5; children: ReactNode }) {
  const grid = cols === 4 ? "xl:grid-cols-4" : "xl:grid-cols-5";
  return <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${grid} gap-4 mb-7`}>{children}</div>;
}
