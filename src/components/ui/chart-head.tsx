import type { ReactNode } from "react";

export function ChartHead({ title, description, right }: { title: string; description?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-[18px]">
      <div>
        <h3 className="text-base font-bold text-text">{title}</h3>
        {description && <p className="text-[12.5px] text-subtext mt-0.5">{description}</p>}
      </div>
      {right}
    </div>
  );
}
